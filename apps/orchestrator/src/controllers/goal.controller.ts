import { Response } from 'express';
import axios from 'axios';
import { randomUUID, createHash } from 'crypto';
import { dbService } from '../services/db.service';
import { logger } from '../config/logger';
import { aiTasksQueue } from '../queue/taskQueue';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { calculateTokensCost } from '../services/telemetry-pricing.registry';

function hashSHA256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function sanitizeErrorMessage(msg: string | null | undefined): string | null {
  if (!msg) return null;
  let sanitized = msg.substring(0, 512);
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, '[REDACTED_TOKEN]');
  sanitized = sanitized.replace(/Authorization:\s*[^\s]+/gi, '[REDACTED_AUTHORIZATION]');
  return sanitized;
}

/**
 * Helper to ensure a default local user exists for offline/local testing convenience.
 */
async function getOrCreatePlaceholderUserId(): Promise<string> {
  const existingUser = await dbService.client.user.findFirst();
  if (existingUser) {
    return existingUser.id;
  }
  
  logger.info('[Goal Controller] Creating failsafe placeholder user in database...');
  const defaultUser = await dbService.client.user.create({
    data: {
      email: 'operator@antigravity.ai',
      password: 'offline_failsafe_password_hash_unusable',
    },
  });
  return defaultUser.id;
}

/**
 * 1. Creates a structured task DAG from a user goal, registers UserGoal and AITasks
 * in the database under PENDING_APPROVAL state, and returns the graph with database UUIDs.
 */
export async function createGoalPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { goal } = req.body;
  
  if (!goal || !goal.trim()) {
    res.status(400).json({ error: 'Goal statement cannot be empty' });
    return;
  }

    // Extract tracing contexts or default fallback
    const correlationId = (req.headers['x-request-id'] as string) || randomUUID();
    const parentRequestId = req.headers['x-parent-request-id'] as string || undefined;
    const clientSpanId = randomUUID(); // New Span representing this planning call

    let planGraph;
    let telemetryBlock;
    const startTime = Date.now();

    try {
      const backendUrl = process.env.BACKEND_AI_URL || 'http://localhost:8000';
      logger.info(`[Goal Controller] Querying Python Cognitive Planner for goal: "${goal}"`);

      // Call Python Planner API propagating tracing context via HTTP standard headers
      const response = await axios.post(
        `${backendUrl}/api/plan/generate`, 
        { goal },
        {
          headers: {
            'X-Trace-Id': correlationId,
            'X-Span-Id': clientSpanId,
            ...(parentRequestId && { 'X-Parent-Span-Id': parentRequestId })
          },
          timeout: 10000 // 10s timeout
        }
      );
      
      // The response schema is GoalPlanningResponse: { graph: DAGTaskGraph, telemetry: AITelemetryBlock }
      const responseBody = response.data;
      planGraph = responseBody.graph;
      telemetryBlock = responseBody.telemetry;
    } catch (axiosErr: any) {
      logger.error(axiosErr, `[Goal Controller] Failed to reach Python Cognitive Planner for goal: "${goal}". Generating offline fallback plan.`);
      
      let errorType = 'UNKNOWN';
      let errorMessage = axiosErr.message || String(axiosErr);
      
      if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.toLowerCase().includes('timeout')) {
        errorType = 'TIMEOUT';
      } else if (axiosErr.response) {
        const status = axiosErr.response.status;
        errorMessage = `AI backend returned status ${status}: ${JSON.stringify(axiosErr.response.data || '')}`;
        if (status === 429) {
          errorType = 'RATE_LIMIT';
        } else if (status >= 500) {
          errorType = 'PROVIDER_ERROR';
        }
      } else if (axiosErr.request) {
        errorType = 'PROVIDER_ERROR';
      }

      // Generate the rule-based offline fallback plan
      planGraph = {
        goal,
        tasks: [
          {
            id: 'task_0',
            title: `Offline Rule-Based Plan for: ${goal}`,
            toolName: 'ReadWindowTool',
            args: {},
            dependencies: []
          }
        ]
      };

      telemetryBlock = {
        traceId: correlationId,
        spanId: clientSpanId,
        parentSpanId: parentRequestId || null,
        model: 'offline-rule-based-planner',
        promptText: `Goal: ${goal}`,
        responseText: 'Offline rule-based fallback triggered due to AI provider failure.',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        status: 'FAILED',
        errorType,
        errorMessage
      };
    }

    try {

    // Pre-create or fetch active userId
    const userId = req.user?.id || await getOrCreatePlaceholderUserId();

    // Create Goal in database with PENDING_APPROVAL status
    const userGoal = await dbService.client.userGoal.create({
      data: {
        userId,
        goal,
        status: 'PENDING_APPROVAL',
      },
    });

    logger.info(`[Goal Controller] Created UserGoal ${userGoal.id} in PENDING_APPROVAL status.`);

    // --- Hardened Telemetry Logging & Cost Materialization ---
    try {
      const isArchiveEnabled = process.env.ENABLE_PROMPT_ARCHIVE === 'true' || process.env.NODE_ENV === 'development';
      
      let promptText = telemetryBlock.promptText || '';
      let responseText = telemetryBlock.responseText || '';
      let promptHash = null;
      let responseHash = null;

      if (!isArchiveEnabled) {
        promptHash = hashSHA256(promptText);
        responseHash = responseText ? hashSHA256(responseText) : null;
        promptText = '';
        responseText = '';
      }

      const { calculatedInputCostUsd, calculatedOutputCostUsd, estimatedCostUsd } = calculateTokensCost(
        telemetryBlock.model,
        telemetryBlock.inputTokens,
        telemetryBlock.outputTokens
      );

      const sanitizedErrorMessage = sanitizeErrorMessage(telemetryBlock.errorMessage);

      await dbService.client.aITelemetryTrace.create({
        data: {
          traceId: telemetryBlock.traceId || correlationId,
          spanId: telemetryBlock.spanId || clientSpanId,
          parentSpanId: telemetryBlock.parentSpanId || parentRequestId || null,
          goalId: userGoal.id,
          traceType: 'PLAN',
          status: telemetryBlock.status || 'SUCCESS',
          model: telemetryBlock.model || 'gemini-1.5-flash',
          promptText,
          responseText,
          promptHash,
          responseHash,
          inputTokens: telemetryBlock.inputTokens || 0,
          outputTokens: telemetryBlock.outputTokens || 0,
          calculatedInputCostUsd,
          calculatedOutputCostUsd,
          estimatedCostUsd,
          latencyMs: telemetryBlock.latencyMs || 0,
          errorType: telemetryBlock.errorType || null,
          errorMessage: sanitizedErrorMessage
        }
      });
      logger.info(`[Goal Controller] Successfully materialized cost & logged telemetry trace for UserGoal ${userGoal.id}.`);
    } catch (telemetryErr) {
      // Avoid letting telemetry db failure crash the main application process flow (Failsafe fallback)
      logger.error(telemetryErr, '[Goal Controller] Telemetry database logging failed. Falling back to emergency local log file...');
      try {
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        const logPath = path.join(logDir, 'emergency-telemetry.log');
        const emergencyLogEntry = {
          timestamp: new Date().toISOString(),
          error: (telemetryErr as any).message || String(telemetryErr),
          goalId: userGoal.id,
          goal,
          correlationId,
          telemetryBlock
        };
        fs.appendFileSync(logPath, JSON.stringify(emergencyLogEntry) + '\n', 'utf8');
        logger.info(`[Goal Controller] Emergency telemetry logged successfully to: ${logPath}`);
      } catch (fileErr) {
        logger.error(fileErr, '[Goal Controller] Failsafe emergency local file logging failed:');
      }
    }

    // Map Python planner string IDs (e.g. "task_0") to newly generated native UUIDs
    const idMap: Record<string, string> = {};
    for (const task of planGraph.tasks) {
      idMap[task.id] = randomUUID();
    }

    // Insert all task nodes in PENDING_APPROVAL status
    for (const task of planGraph.tasks) {
      const dbId = idMap[task.id];
      await dbService.client.aITask.create({
        data: {
          id: dbId,
          goalId: userGoal.id,
          title: task.title,
          status: 'QUEUED',
          payload: {
            toolName: task.toolName,
            arguments: task.args,
          },
        },
      });
    }

    // Connect task dependencies using the mapped UUIDs
    for (const task of planGraph.tasks) {
      if (task.dependencies && task.dependencies.length > 0) {
        const dbId = idMap[task.id];
        const connectIds = task.dependencies
          .map((depId: string) => ({ id: idMap[depId] }))
          .filter((c: any) => c.id !== undefined);

        if (connectIds.length > 0) {
          await dbService.client.aITask.update({
            where: { id: dbId },
            data: {
              dependencies: {
                connect: connectIds,
              },
            },
          });
        }
      }
    }

    // Fetch the fully populated Goal and Tasks graph to return to the client
    const populatedGoal = await dbService.client.userGoal.findUnique({
      where: { id: userGoal.id },
      include: {
        tasks: {
          include: {
            dependencies: true,
          },
        },
      },
    });

    res.status(201).json({
      status: 'OK',
      goal: populatedGoal,
    });
  } catch (error: any) {
    logger.error(error, '[Goal Controller] Planning request failed:');
    res.status(500).json({ error: error.message || 'Failed to generate goal plan.' });
  }
}

/**
 * 2. Approves the UserGoal, shifts its status to ACTIVE, tasks status to PENDING,
 * and enqueues the root triggers into BullMQ to start execution.
 */
export async function approveGoalPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const goalId = req.params.goalId as string;

  try {
    logger.info(`[Goal Controller] Approving Goal Plan for ID: ${goalId}...`);

    const userGoal = await dbService.client.userGoal.findFirst({
      where: { id: goalId, userId: req.user?.id },
      include: {
        tasks: {
          include: {
            dependencies: true,
          },
        },
      },
    });

    if (!userGoal) {
      logger.warn({ userId: req.user?.id, resourceId: goalId, ip: req.ip, event: 'SECURITY_ACCESS_DENIED' }, '[Goal Controller] Access Denied: Goal not found during approval.');
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    if (userGoal.status !== 'PENDING_APPROVAL') {
      res.status(400).json({ error: `Goal cannot be approved in its current status: ${userGoal.status}` });
      return;
    }

    // 1. Shift UserGoal status to ACTIVE
    await dbService.client.userGoal.update({
      where: { id: goalId },
      data: { status: 'ACTIVE' },
    });



    // 3. Find root tasks (those with zero parent dependencies) to trigger queue execution
    const allTasks = (await dbService.client.aITask.findMany({
      where: { goalId },
      include: {
        dependencies: true,
      },
    })) as any[];

    const rootTasks = allTasks.filter(t => t.dependencies.length === 0);
    const triggerTask = rootTasks[0] || allTasks[0];

    if (!triggerTask) {
      res.status(400).json({ error: 'No tasks found in the approved workflow plan' });
      return;
    }

    logger.info(`[Goal Controller] Plan approved. Enqueueing trigger task "${triggerTask.title}" (ID: ${triggerTask.id}) into BullMQ...`);

    // 4. Add the initial trigger job to BullMQ queue
    await aiTasksQueue.add(
      'execute-task',
      {
        taskId: triggerTask.id,
        goalId: userGoal.id,
        title: triggerTask.title,
        payload: triggerTask.payload,
      },
      {
        jobId: triggerTask.id, // Align BullMQ Job ID with Database Task ID
      }
    );

    res.json({
      status: 'OK',
      message: 'Plan approved. Workflow started successfully.',
      triggerTaskId: triggerTask.id,
    });
  } catch (error: any) {
    logger.error(error, '[Goal Controller] Plan approval failed:');
    res.status(500).json({ error: error.message || 'Failed to approve goal plan.' });
  }
}
