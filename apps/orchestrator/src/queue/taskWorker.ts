import { Worker, Job } from 'bullmq';
import { redisConnection } from './connection';
import { dbService } from '../services/db.service';
import { logger } from '../config/logger';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { TaskStateRepository } from '../services/task-state.repository';
import { TaskStatus } from '../utils/task-state-machine';
import { MetricsCollector } from '../services/metrics-collector';

// Stash active processes globally for HITL communication
(global as any).activeProcesses = (global as any).activeProcesses || new Map();

export const aiTasksWorker = new Worker(
  'ai-tasks',
  async (job: Job) => {
    const { taskId, goalId, title } = job.data;
    logger.info(`[Worker] Starting physical execution for Job ID: ${job.id} | Task: "${title}"`);

    // 1. Retrieve the task to get the expected execution epoch
    const task = await dbService.client.aITask.findUnique({
      where: { id: taskId }
    });
    if (!task) {
      const errorMsg = `Task with ID '${taskId}' not found.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Atomically claim the task using CAS: EXECUTING state, lastHeartbeatAt, leaseExpiresAt, increment epoch, and generate fencing token inside transaction
    const claimSuccess = await TaskStateRepository.updateWithCAS(
      taskId,
      task.executionEpoch,
      {
        status: 'EXECUTING',
        lastHeartbeatAt: new Date(),
        leaseExpiresAt: new Date(Date.now() + 30000)
      },
      true, // Generate sequence fencing token atomically inside transaction
      undefined,
      task.status as TaskStatus // Validate that task status has not changed from what we read (should be QUEUED or DISPATCHED)
    );

    if (!claimSuccess) {
      const errorMsg = `Fencing or CAS conflict: Task ${taskId} is already being executed or recovered by another worker.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Retrieve the atomically generated fencing token from the DB
    const claimedTask = await dbService.client.aITask.findUnique({
      where: { id: taskId }
    });
    if (!claimedTask || claimedTask.fencingToken === null) {
      const errorMsg = `Task ${taskId} claimed task or fencing token was not found or generated correctly.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    const currentFence = claimedTask.fencingToken;
    const currentEpoch = claimedTask.executionEpoch; // Read the exact epoch under which we hold this lease

    emitSocketEvent('task_progress', { taskId, status: 'EXECUTING', progress: 10 });

    let heartbeatInterval: NodeJS.Timeout | null = null;

    // 2. Fetch all AITasks of this Goal to map the complete DAG graph
    const tasks = await dbService.client.aITask.findMany({
      where: { goalId },
      include: {
        dependencies: true,
      },
    });

    // Map DB AITask records into C# TaskNode objects
    const workflowNodes = tasks.map((task) => {
      const payload = (task.payload as any) || {};
      return {
        Id: task.id,
        Name: task.title,
        ToolName: payload.toolName || 'OpenApplicationTool',
        Arguments: payload.arguments || {},
        DependsOn: task.dependencies.map((dep) => dep.id),
        State: 0, // Pending
        RetryCount: 0,
      };
    });

    // 3. Write workflow nodes to a unique temp JSON file to prevent race conditions
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempJsonPath = path.join(tempDir, `workflow_${goalId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`);
    fs.writeFileSync(tempJsonPath, JSON.stringify(workflowNodes, null, 2), 'utf8');

    logger.info(`[Worker] Generated unique workflow JSON: ${tempJsonPath}`);

    // 4. Resolve the path to OfflineAgent.Console.exe
    let exePath = process.env.CS_AGENT_EXE_PATH;
    if (!exePath) {
      const rootDir = path.resolve(__dirname, '../../../../../');
      const cwdDir = path.resolve(process.cwd(), '../../');
      const potentialPaths = [
        path.join(rootDir, 'apps/agent-runtime/src/OfflineAgent.Console/bin/Debug/net9.0-windows/OfflineAgent.Console.exe'),
        path.join(rootDir, 'apps/agent-runtime/src/OfflineAgent.Console/bin/Release/net9.0-windows/OfflineAgent.Console.exe'),
        path.join(process.cwd(), '../agent-runtime/src/OfflineAgent.Console/bin/Debug/net9.0-windows/OfflineAgent.Console.exe'),
        path.join(process.cwd(), '../agent-runtime/src/OfflineAgent.Console/bin/Release/net9.0-windows/OfflineAgent.Console.exe'),
      ];
      for (const p of potentialPaths) {
        if (fs.existsSync(p)) {
          exePath = p;
          break;
        }
      }
    }

    if (!exePath || !fs.existsSync(exePath)) {
      const errorMsg = `C# Agent Console Executable not found. Path: ${exePath}`;
      logger.error(errorMsg);
      await TaskStateRepository.updateWithFence(taskId, currentFence, { status: 'FAILED', error: errorMsg }, undefined, undefined, currentEpoch);
      emitSocketEvent('task_failed', { taskId, status: 'FAILED', error: errorMsg });
      // Cleanup temp file
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }
      throw new Error(errorMsg);
    }

    return new Promise<void>((resolve, reject) => {
      let processTimeout: NodeJS.Timeout | null = null;
      let hitlTimeout: NodeJS.Timeout | null = null;
      let child: any = null;
      let leaseLost = false;

      const cleanup = () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (processTimeout) clearTimeout(processTimeout);
        if (hitlTimeout) clearTimeout(hitlTimeout);
        (global as any).activeProcesses.delete(goalId);
        try {
          if (fs.existsSync(tempJsonPath)) {
            fs.unlinkSync(tempJsonPath);
            logger.info(`[Worker] Cleaned up temp file: ${tempJsonPath}`);
          }
        } catch (err: any) {
          logger.error(`[Worker] Failed to delete temp file: ${err.message}`);
        }
      };

      try {
        logger.info(`[Worker] Spawning C# Agent Runner: "${exePath}"`);
        child = spawn(exePath, ['--workflow', tempJsonPath]);

        // Start Heartbeat Daemon (extends lease by 30s every 10s and verifies state remains EXECUTING)
        let runningHeartbeat = false;
        heartbeatInterval = setInterval(async () => {
          if (runningHeartbeat) {
            logger.warn(`[Heartbeat Daemon] Previous heartbeat execution is still in progress. Skipping this tick.`);
            return;
          }
          runningHeartbeat = true;
          try {
            await TaskStateRepository.updateWithFence(taskId, currentFence, {
              status: 'EXECUTING',
              lastHeartbeatAt: new Date(),
              leaseExpiresAt: new Date(Date.now() + 30000)
            }, undefined, 'EXECUTING', currentEpoch); // Heartbeat only allowed if status is EXECUTING and epoch matches
          } catch (err: any) {
            logger.error(`[Heartbeat Daemon] Failed to renew lease for Task ${taskId} (Lease Lost): ${err.message}`);
            MetricsCollector.increment('heartbeat_timeout_total');
            leaseLost = true;
            if (child) {
              logger.error(`[Heartbeat Daemon] Lost fencing lock or task status changed. Terminating child process immediately.`);
              try {
                child.kill('SIGKILL');
              } catch (killErr: any) {
                logger.error(`[Heartbeat Daemon] Error killing child process: ${killErr.message}`);
              }
            }
            cleanup();
            reject(new Error(`Lease lost or task status changed. Heartbeat failed: ${err.message}`));
          } finally {
            runningHeartbeat = false;
          }
        }, 10000);

        // Global Process Timeout (180s) to prevent hanging zombie processes
        const GLOBAL_TIMEOUT_MS = 180000;
        processTimeout = setTimeout(() => {
          logger.warn(`[Worker] [Process Timeout] C# runner exceeded limit of ${GLOBAL_TIMEOUT_MS / 1000}s. Killing SIGKILL...`);
          if (child) {
            child.kill('SIGKILL');
          }
        }, GLOBAL_TIMEOUT_MS);

        // Track and log standard error stream (captures crashes / exceptions)
        child.stderr.on('data', (data: Buffer) => {
          logger.error(`[C# Agent Stderr] ${data.toString().trim()}`);
        });

        // Register in active processes map for Socket.io HITL responses
        const clearHitlTimeout = () => {
          if (hitlTimeout) {
            clearTimeout(hitlTimeout);
            hitlTimeout = null;
          }
        };
        (global as any).activeProcesses.set(goalId, { child, clearHitlTimeout });

        // Parse stdout stream line-by-line
        const rl = readline.createInterface({
          input: child.stdout,
          terminal: false,
        });

        rl.on('line', async (line) => {
          if (leaseLost) {
            logger.warn(`[Worker] Lease was lost. Ignoring incoming C# stdout stream log.`);
            return;
          }
          const trimmed = line.trim();
          if (!trimmed) return;

          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.type === 'log') {
              logger.info(`[C# Agent Log] ${parsed.message}`);
            } else if (parsed.type === 'telemetry') {
              logger.info(`[C# Telemetry] ${parsed.event}: ${parsed.message}`);
              emitSocketEvent('telemetry_event', { event: parsed.event, message: parsed.message, payload: parsed.payload });
            } else if (parsed.type === 'node_state') {
              // C# States: Pending, Running, Completed, Failed, Retrying, Timeout, Cancelled, Blocked, WaitingApproval, Skipped
              // DB States: QUEUED, EXECUTING, COMPLETED, FAILED
              let dbStatus: TaskStatus = 'EXECUTING';
              if (parsed.state === 'Completed') dbStatus = 'COMPLETED';
              else if (parsed.state === 'Failed' || parsed.state === 'Cancelled' || parsed.state === 'Timeout' || parsed.state === 'Blocked') dbStatus = 'FAILED';

              logger.info(`[Worker] Task Node ${parsed.taskId} state -> C#: ${parsed.state} | Syncing DB: ${dbStatus}`);

              let errorMsg = null;
              if (parsed.state === 'Cancelled') errorMsg = 'Cancelled due to dependency failure.';
              else if (parsed.state === 'Timeout') errorMsg = 'Task execution timed out.';
              else if (parsed.state === 'Blocked') errorMsg = 'Security capability blocked execution.';

              await TaskStateRepository.updateWithFence(parsed.taskId, undefined, {
                status: dbStatus,
                error: errorMsg,
              });

              // Create simulated ToolExecution & WorldStateFrame on successful/failed node completion
              if (dbStatus === 'COMPLETED' || dbStatus === 'FAILED') {
                const toolExec = await dbService.client.toolExecution.create({
                  data: {
                    taskId: parsed.taskId,
                    toolName: 'WindowsAutomationTool',
                    args: { state: parsed.state },
                    result: { exitCode: 0, status: dbStatus },
                    riskLevel: 'SAFE',
                    status: dbStatus === 'COMPLETED' ? 'SUCCESS' : 'FAILED',
                  },
                });

                const screenshotUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                const uiTreeXml = '<Window Name="Windows Desktop Integration"><Control Name="FlaUI Engine" /></Window>';
                await dbService.client.worldStateFrame.create({
                  data: {
                    taskId: parsed.taskId,
                    toolExecutionId: toolExec.id,
                    screenshotUrl,
                    uiTreeXml,
                  },
                });

                emitSocketEvent('world_state_frame', {
                  taskId: parsed.taskId,
                  toolExecutionId: toolExec.id,
                  screenshotUrl,
                  uiTreeXml,
                  createdAt: new Date()
                });
              }

              emitSocketEvent('task_progress', { taskId: parsed.taskId, status: dbStatus, error: errorMsg, progress: dbStatus === 'COMPLETED' ? 100 : 50 });
            } else if (parsed.type === 'prompt') {
              logger.warn(`[Worker] [HITL Gate] C# runtime requested approval: "${parsed.prompt}"`);

              // Update active task to notify that we are waiting for human intervention
              await TaskStateRepository.updateWithFence(taskId, currentFence, { status: 'EXECUTING' }, undefined, undefined, currentEpoch);

              emitSocketEvent('hitl_request', { goalId, prompt: parsed.prompt, title: parsed.title });

              // Deadlock Prevention: auto-decline HITL prompt if no user input after 60 seconds
              if (hitlTimeout) clearTimeout(hitlTimeout);
              hitlTimeout = setTimeout(() => {
                logger.warn(`[Worker] [HITL Timeout] HITL prompt timed out after 60s. Auto-declining with 'n'...`);
                child.stdin.write('n\n');
              }, 60000);
            }
          } catch (e) {
            // Raw log fallback if line is not valid JSON
            logger.debug(`[C# Agent Stdout Raw] ${trimmed}`);
          }
        });

        child.on('close', async (code: number) => {
          if (leaseLost) {
            logger.warn(`[Worker] Lease was lost. Ignoring C# agent CLI close event.`);
            return;
          }
          cleanup();
          logger.info(`[Worker] C# Agent CLI exited with code ${code}`);

          if (code === 0) {
            const resultPayload = { status: 'SUCCESS', message: 'Workflow completed successfully.' };
            await TaskStateRepository.updateWithFence(taskId, currentFence, {
              status: 'COMPLETED',
              result: resultPayload,
            }, undefined, undefined, currentEpoch);
            emitSocketEvent('task_completed', { taskId, status: 'COMPLETED', result: resultPayload });
            resolve();
          } else {
            const errorMsg = `Workflow execution failed with exit code ${code}`;
            await TaskStateRepository.updateWithFence(taskId, currentFence, {
              status: 'FAILED',
              error: errorMsg,
            }, undefined, undefined, currentEpoch);
            emitSocketEvent('task_failed', { taskId, status: 'FAILED', error: errorMsg });
            reject(new Error(errorMsg));
          }
        });

        child.on('error', (err: any) => {
          if (leaseLost) return;
          cleanup();
          logger.error(err, `[Worker] Child process spawn error:`);
          reject(err);
        });

      } catch (err: any) {
        if (leaseLost) return;
        cleanup();
        logger.error(err, `[Worker] Execution error inside spawn:`);
        reject(err);
      }
    });
  },
  {
    connection: redisConnection as any,
  }
);

// Graceful worker termination logs
aiTasksWorker.on('failed', (job, err) => {
  logger.error(err, `[Worker] Job ${job?.id} failed:`);
});

aiTasksWorker.on('completed', (job) => {
  logger.info(`[Worker] Job ${job.id} completed successfully.`);
});

/**
 * Socket.io broadcaster helper
 */
function emitSocketEvent(event: string, data: any) {
  const io = (global as any).io;
  if (io) {
    logger.debug({ event, data }, '[Worker] Broadcasting socket event');
    io.emit(event, data);
  } else {
    logger.warn('[Worker] Socket.io server instance is not registered globally.');
  }
}
