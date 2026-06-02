"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiTasksWorker = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
const db_service_1 = require("../services/db.service");
const logger_1 = require("../config/logger");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
// Stash active processes globally for HITL communication
global.activeProcesses = global.activeProcesses || new Map();
exports.aiTasksWorker = new bullmq_1.Worker('ai-tasks', async (job) => {
    const { taskId, goalId, title } = job.data;
    logger_1.logger.info(`[Worker] Starting physical execution for Job ID: ${job.id} | Task: "${title}"`);
    // 1. Update task state in DB to PROCESSING
    await db_service_1.dbService.client.aITask.update({
        where: { id: taskId },
        data: { status: 'PROCESSING' },
    });
    emitSocketEvent('task_progress', { taskId, status: 'PROCESSING', progress: 10 });
    // 2. Fetch all AITasks of this Goal to map the complete DAG graph
    const tasks = await db_service_1.dbService.client.aITask.findMany({
        where: { goalId },
        include: {
            dependencies: true,
        },
    });
    // Map DB AITask records into C# TaskNode objects
    const workflowNodes = tasks.map((task) => {
        const payload = task.payload || {};
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
    logger_1.logger.info(`[Worker] Generated unique workflow JSON: ${tempJsonPath}`);
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
        logger_1.logger.error(errorMsg);
        await db_service_1.dbService.client.aITask.update({
            where: { id: taskId },
            data: { status: 'FAILED', error: errorMsg },
        });
        emitSocketEvent('task_failed', { taskId, status: 'FAILED', error: errorMsg });
        // Cleanup temp file
        if (fs.existsSync(tempJsonPath)) {
            fs.unlinkSync(tempJsonPath);
        }
        throw new Error(errorMsg);
    }
    return new Promise((resolve, reject) => {
        let processTimeout = null;
        let hitlTimeout = null;
        let child = null;
        const cleanup = () => {
            if (processTimeout)
                clearTimeout(processTimeout);
            if (hitlTimeout)
                clearTimeout(hitlTimeout);
            global.activeProcesses.delete(goalId);
            try {
                if (fs.existsSync(tempJsonPath)) {
                    fs.unlinkSync(tempJsonPath);
                    logger_1.logger.info(`[Worker] Cleaned up temp file: ${tempJsonPath}`);
                }
            }
            catch (err) {
                logger_1.logger.error(`[Worker] Failed to delete temp file: ${err.message}`);
            }
        };
        try {
            logger_1.logger.info(`[Worker] Spawning C# Agent Runner: "${exePath}"`);
            child = (0, child_process_1.spawn)(exePath, ['--workflow', tempJsonPath]);
            // Global Process Timeout (180s) to prevent hanging zombie processes
            const GLOBAL_TIMEOUT_MS = 180000;
            processTimeout = setTimeout(() => {
                logger_1.logger.warn(`[Worker] [Process Timeout] C# runner exceeded limit of ${GLOBAL_TIMEOUT_MS / 1000}s. Killing SIGKILL...`);
                if (child) {
                    child.kill('SIGKILL');
                }
            }, GLOBAL_TIMEOUT_MS);
            // Track and log standard error stream (captures crashes / exceptions)
            child.stderr.on('data', (data) => {
                logger_1.logger.error(`[C# Agent Stderr] ${data.toString().trim()}`);
            });
            // Register in active processes map for Socket.io HITL responses
            const clearHitlTimeout = () => {
                if (hitlTimeout) {
                    clearTimeout(hitlTimeout);
                    hitlTimeout = null;
                }
            };
            global.activeProcesses.set(goalId, { child, clearHitlTimeout });
            // Parse stdout stream line-by-line
            const rl = readline.createInterface({
                input: child.stdout,
                terminal: false,
            });
            rl.on('line', async (line) => {
                const trimmed = line.trim();
                if (!trimmed)
                    return;
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed.type === 'log') {
                        logger_1.logger.info(`[C# Agent Log] ${parsed.message}`);
                    }
                    else if (parsed.type === 'telemetry') {
                        logger_1.logger.info(`[C# Telemetry] ${parsed.event}: ${parsed.message}`);
                        emitSocketEvent('telemetry_event', { event: parsed.event, message: parsed.message, payload: parsed.payload });
                    }
                    else if (parsed.type === 'node_state') {
                        // C# States: Pending, Running, Completed, Failed, Retrying, Timeout, Cancelled, Blocked, WaitingApproval, Skipped
                        // DB States: PENDING, PROCESSING, COMPLETED, FAILED
                        let dbStatus = 'PROCESSING';
                        if (parsed.state === 'Completed')
                            dbStatus = 'COMPLETED';
                        else if (parsed.state === 'Failed' || parsed.state === 'Cancelled' || parsed.state === 'Timeout' || parsed.state === 'Blocked')
                            dbStatus = 'FAILED';
                        logger_1.logger.info(`[Worker] Task Node ${parsed.taskId} state -> C#: ${parsed.state} | Syncing DB: ${dbStatus}`);
                        let errorMsg = null;
                        if (parsed.state === 'Cancelled')
                            errorMsg = 'Cancelled due to dependency failure.';
                        else if (parsed.state === 'Timeout')
                            errorMsg = 'Task execution timed out.';
                        else if (parsed.state === 'Blocked')
                            errorMsg = 'Security capability blocked execution.';
                        await db_service_1.dbService.client.aITask.update({
                            where: { id: parsed.taskId },
                            data: {
                                status: dbStatus,
                                error: errorMsg,
                            },
                        });
                        // Create simulated ToolExecution & WorldStateFrame on successful/failed node completion
                        if (dbStatus === 'COMPLETED' || dbStatus === 'FAILED') {
                            const toolExec = await db_service_1.dbService.client.toolExecution.create({
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
                            await db_service_1.dbService.client.worldStateFrame.create({
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
                    }
                    else if (parsed.type === 'prompt') {
                        logger_1.logger.warn(`[Worker] [HITL Gate] C# runtime requested approval: "${parsed.prompt}"`);
                        // Update active task to notify that we are waiting for human intervention
                        await db_service_1.dbService.client.aITask.update({
                            where: { id: taskId },
                            data: { status: 'PROCESSING' },
                        });
                        emitSocketEvent('hitl_request', { goalId, prompt: parsed.prompt, title: parsed.title });
                        // Deadlock Prevention: auto-decline HITL prompt if no user input after 60 seconds
                        if (hitlTimeout)
                            clearTimeout(hitlTimeout);
                        hitlTimeout = setTimeout(() => {
                            logger_1.logger.warn(`[Worker] [HITL Timeout] HITL prompt timed out after 60s. Auto-declining with 'n'...`);
                            child.stdin.write('n\n');
                        }, 60000);
                    }
                }
                catch (e) {
                    // Raw log fallback if line is not valid JSON
                    logger_1.logger.debug(`[C# Agent Stdout Raw] ${trimmed}`);
                }
            });
            child.on('close', async (code) => {
                cleanup();
                logger_1.logger.info(`[Worker] C# Agent CLI exited with code ${code}`);
                if (code === 0) {
                    const resultPayload = { status: 'SUCCESS', message: 'Workflow completed successfully.' };
                    await db_service_1.dbService.client.aITask.update({
                        where: { id: taskId },
                        data: {
                            status: 'COMPLETED',
                            result: resultPayload,
                        },
                    });
                    emitSocketEvent('task_completed', { taskId, status: 'COMPLETED', result: resultPayload });
                    resolve();
                }
                else {
                    const errorMsg = `Workflow execution failed with exit code ${code}`;
                    await db_service_1.dbService.client.aITask.update({
                        where: { id: taskId },
                        data: {
                            status: 'FAILED',
                            error: errorMsg,
                        },
                    });
                    emitSocketEvent('task_failed', { taskId, status: 'FAILED', error: errorMsg });
                    reject(new Error(errorMsg));
                }
            });
            child.on('error', (err) => {
                cleanup();
                logger_1.logger.error(err, `[Worker] Child process spawn error:`);
                reject(err);
            });
        }
        catch (err) {
            cleanup();
            logger_1.logger.error(err, `[Worker] Execution error inside spawn:`);
            reject(err);
        }
    });
}, {
    connection: connection_1.redisConnection,
});
// Graceful worker termination logs
exports.aiTasksWorker.on('failed', (job, err) => {
    logger_1.logger.error(err, `[Worker] Job ${job?.id} failed:`);
});
exports.aiTasksWorker.on('completed', (job) => {
    logger_1.logger.info(`[Worker] Job ${job.id} completed successfully.`);
});
/**
 * Socket.io broadcaster helper
 */
function emitSocketEvent(event, data) {
    const io = global.io;
    if (io) {
        logger_1.logger.debug({ event, data }, '[Worker] Broadcasting socket event');
        io.emit(event, data);
    }
    else {
        logger_1.logger.warn('[Worker] Socket.io server instance is not registered globally.');
    }
}
