import { Queue } from 'bullmq';
import { redisConnection } from './connection';
import { dbService } from '../services/db.service';
import { logger } from '../config/logger';
import { AITaskDTO } from '../types/shared-types';

export const aiTasksQueue = new Queue('ai-tasks', {
  connection: redisConnection as any,
});

/**
 * Enqueues a new AI Task into the database and BullMQ queue.
 * Pre-registers the task in the DB to maintain the Planning Layer / Task Graph state.
 */
export async function enqueueTask(
  goalId: string,
  title: string,
  payload: any = {},
  dependencies: string[] = []
): Promise<AITaskDTO> {
  try {
    logger.info(`[Queue Service] Registering task "${title}" in DB...`);

    // 1. Create task in PostgreSQL DB
    const dbTask = await dbService.client.aITask.create({
      data: {
        goalId,
        title,
        status: 'PENDING',
        payload: payload,
        dependencies: {
          connect: dependencies.map((depId) => ({ id: depId })),
        },
      },
      include: {
        dependencies: true,
      },
    });

    logger.info(`[Queue Service] Task registered with DB ID: ${dbTask.id}. Enqueueing to BullMQ...`);

    // 2. Add job to BullMQ
    await aiTasksQueue.add(
      'execute-task',
      {
        taskId: dbTask.id,
        goalId,
        title,
        payload,
      },
      {
        jobId: dbTask.id, // Align BullMQ Job ID with Database Task ID
      }
    );

    logger.info(`[Queue Service] Task enqueued in BullMQ successfully.`);

    return dbTask as any;
  } catch (error) {
    logger.error(error, `[Queue Service] Failed to enqueue task "${title}":`);
    throw error;
  }
}
