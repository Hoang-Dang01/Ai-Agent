import { Response } from 'express';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { dbService } from '../services/db.service';
import { logger } from '../config/logger';
import { aiTasksQueue } from '../queue/taskQueue';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

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

  try {
    const backendUrl = process.env.BACKEND_AI_URL || 'http://localhost:8000';
    logger.info(`[Goal Controller] Querying Python Cognitive Planner for goal: "${goal}"`);
    
    // Extract tracing contexts or default fallback
    const correlationId = (req.headers['x-request-id'] as string) || randomUUID();
    const parentRequestId = req.headers['x-parent-request-id'] as string || undefined;
    const taskId = req.headers['x-task-id'] as string || undefined;
    const workflowId = req.headers['x-workflow-id'] as string || undefined;
    const epoch = req.headers['x-execution-epoch'] as string || undefined;

    // Call Python Planner API propagating standard SRE tracing context
    const response = await axios.post(
      `${backendUrl}/api/plan/generate`, 
      { goal },
      {
        headers: {
          'X-Request-ID': correlationId,
          ...(parentRequestId && { 'X-Parent-Request-ID': parentRequestId }),
          ...(taskId && { 'X-Task-ID': taskId }),
          ...(workflowId && { 'X-Workflow-ID': workflowId }),
          ...(epoch && { 'X-Execution-Epoch': epoch })
        }
      }
    );
    const planData = response.data; // Expected format: { goal: string, tasks: Array<...> }

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

    // Map Python planner string IDs (e.g. "task_0") to newly generated native UUIDs
    const idMap: Record<string, string> = {};
    for (const task of planData.tasks) {
      idMap[task.id] = randomUUID();
    }

    // Insert all task nodes in PENDING_APPROVAL status
    for (const task of planData.tasks) {
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
    for (const task of planData.tasks) {
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

    const userGoal = await dbService.client.userGoal.findUnique({
      where: { id: goalId },
      include: {
        tasks: {
          include: {
            dependencies: true,
          },
        },
      },
    });

    if (!userGoal) {
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
