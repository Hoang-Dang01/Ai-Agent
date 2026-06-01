"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiTasksWorker = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
const db_service_1 = require("../services/db.service");
const logger_1 = require("../config/logger");
exports.aiTasksWorker = new bullmq_1.Worker('ai-tasks', async (job) => {
    const { taskId, goalId, title, payload } = job.data;
    logger_1.logger.info(`[Worker] Starting processing for Job ID: ${job.id} | Task: "${title}"`);
    // 1. Update task state in DB to PROCESSING
    await db_service_1.dbService.client.aITask.update({
        where: { id: taskId },
        data: { status: 'PROCESSING' },
    });
    // Notify UI client of progress
    emitSocketEvent('task_progress', { taskId, status: 'PROCESSING', progress: 10 });
    try {
        // 2. Simulate Execution Layer & Environment Layer
        logger_1.logger.info(`[Worker] [Execution Layer] Initiating tools for task: "${title}"`);
        // Step A: Simulate Tool Invocations (e.g. OpenApplicationTool)
        await sleep(1500);
        const toolExec1 = await db_service_1.dbService.client.toolExecution.create({
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
        await db_service_1.dbService.client.worldStateFrame.create({
            data: {
                taskId,
                toolExecutionId: toolExec1.id,
                screenshotUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...', // Mock base64
                uiTreeXml: '<Window Name="Untitled - Notepad"><Document Name="Text Editor" /></Window>',
            },
        });
        // Step C: Simulate Tool Typing (e.g. TypeTextTool)
        await sleep(1500);
        const toolExec2 = await db_service_1.dbService.client.toolExecution.create({
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
        await db_service_1.dbService.client.worldStateFrame.create({
            data: {
                taskId,
                toolExecutionId: toolExec2.id,
                screenshotUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
                uiTreeXml: '<Window Name="*Untitled - Notepad"><Document Name="Text Editor">Hello World from Antigravity OS</Document></Window>',
            },
        });
        // 3. Mark task completed in database
        const resultPayload = { status: 'SUCCESS', message: 'Task completed successfully.' };
        await db_service_1.dbService.client.aITask.update({
            where: { id: taskId },
            data: {
                status: 'COMPLETED',
                result: resultPayload,
            },
        });
        logger_1.logger.info(`[Worker] Completed task: "${title}" successfully.`);
        emitSocketEvent('task_completed', { taskId, status: 'COMPLETED', result: resultPayload });
    }
    catch (error) {
        logger_1.logger.error(error, `[Worker] Failed task: "${title}":`);
        const errorMsg = error.message || 'Unknown execution error';
        await db_service_1.dbService.client.aITask.update({
            where: { id: taskId },
            data: {
                status: 'FAILED',
                error: errorMsg,
            },
        });
        emitSocketEvent('task_failed', { taskId, status: 'FAILED', error: errorMsg });
        throw error;
    }
}, {
    connection: connection_1.redisConnection,
});
// Graceful shut down helpers
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
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
