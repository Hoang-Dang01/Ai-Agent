import { Worker, Job } from 'bullmq';
import { redisConnection } from './connection';
import { dbService } from '../services/db.service';
import { logger } from '../config/logger';

export const aiTasksWorker = new Worker(
  'ai-tasks',
  async (job: Job) => {
    const { taskId, goalId, title, payload } = job.data;
    logger.info(`[Worker] Starting processing for Job ID: ${job.id} | Task: "${title}"`);

    // 1. Update task state in DB to PROCESSING
    await dbService.client.aITask.update({
      where: { id: taskId },
      data: { status: 'PROCESSING' },
    });

    // Notify UI client of progress
    emitSocketEvent('task_progress', { taskId, status: 'PROCESSING', progress: 10 });

    try {
      // 2. Simulate Execution Layer & Environment Layer
      logger.info(`[Worker] [Execution Layer] Initiating tools for task: "${title}"`);
      
      // Step A: Simulate Tool Invocations (e.g. OpenApplicationTool)
      await sleep(1500);
      const toolExec1 = await dbService.client.toolExecution.create({
        data: {
          taskId,
          toolName: 'OpenApplicationTool',
          args: { appName: 'Notepad' },
          result: { pid: 14052, status: 'SUCCESS' },
          riskLevel: 'SAFE',
          status: 'SUCCESS',
        },
      });
      emitSocketEvent('task_progress', { taskId, status: 'PROCESSING', progress: 40, activeTool: 'OpenApplicationTool' });

      // Step B: Simulate Environment Frame (Screenshot & Window UI Tree)
      await sleep(1000);
      await dbService.client.worldStateFrame.create({
        data: {
          taskId,
          toolExecutionId: toolExec1.id,
          screenshotUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...', // Mock base64
          uiTreeXml: '<Window Name="Untitled - Notepad"><Document Name="Text Editor" /></Window>',
        },
      });

      // Step C: Simulate Tool Typing (e.g. TypeTextTool)
      await sleep(1500);
      const toolExec2 = await dbService.client.toolExecution.create({
        data: {
          taskId,
          toolName: 'TypeTextTool',
          args: { text: 'Hello World from Antigravity OS' },
          result: { charactersTyped: 31, status: 'SUCCESS' },
          riskLevel: 'SAFE',
          status: 'SUCCESS',
        },
      });
      emitSocketEvent('task_progress', { taskId, status: 'PROCESSING', progress: 80, activeTool: 'TypeTextTool' });

      // Step D: Capture final Environment state
      await sleep(1000);
      await dbService.client.worldStateFrame.create({
        data: {
          taskId,
          toolExecutionId: toolExec2.id,
          screenshotUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
          uiTreeXml: '<Window Name="*Untitled - Notepad"><Document Name="Text Editor">Hello World from Antigravity OS</Document></Window>',
        },
      });

      // 3. Mark task completed in database
      const resultPayload = { status: 'SUCCESS', message: 'Task completed successfully.' };
      await dbService.client.aITask.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          result: resultPayload,
        },
      });

      logger.info(`[Worker] Completed task: "${title}" successfully.`);
      emitSocketEvent('task_completed', { taskId, status: 'COMPLETED', result: resultPayload });
    } catch (error: any) {
      logger.error(error, `[Worker] Failed task: "${title}":`);
      
      const errorMsg = error.message || 'Unknown execution error';
      await dbService.client.aITask.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          error: errorMsg,
        },
      });

      emitSocketEvent('task_failed', { taskId, status: 'FAILED', error: errorMsg });
      throw error;
    }
  },
  {
    connection: redisConnection as any,
  }
);

// Graceful shut down helpers
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
