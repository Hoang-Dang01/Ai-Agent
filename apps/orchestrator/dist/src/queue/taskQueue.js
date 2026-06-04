"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiTasksQueue = void 0;
exports.enqueueTask = enqueueTask;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
const db_service_1 = require("../services/db.service");
const logger_1 = require("../config/logger");
exports.aiTasksQueue = new bullmq_1.Queue('ai-tasks', {
    connection: connection_1.redisConnection,
});
/**
 * Enqueues a new AI Task into the database and BullMQ queue.
 * Pre-registers the task in the DB to maintain the Planning Layer / Task Graph state.
 */
async function enqueueTask(goalId, title, payload = {}, dependencies = []) {
    try {
        logger_1.logger.info(`[Queue Service] Registering task "${title}" in DB...`);
        // 1. Create task in PostgreSQL DB
        const dbTask = await db_service_1.dbService.client.aITask.create({
            data: {
                goalId,
                title,
                status: 'QUEUED',
                payload: payload,
                dependencies: {
                    connect: dependencies.map((depId) => ({ id: depId })),
                },
            },
            include: {
                dependencies: true,
            },
        });
        logger_1.logger.info(`[Queue Service] Task registered with DB ID: ${dbTask.id}. Enqueueing to BullMQ...`);
        // 2. Add job to BullMQ
        await exports.aiTasksQueue.add('execute-task', {
            taskId: dbTask.id,
            goalId,
            title,
            payload,
        }, {
            jobId: dbTask.id, // Align BullMQ Job ID with Database Task ID
        });
        logger_1.logger.info(`[Queue Service] Task enqueued in BullMQ successfully.`);
        return dbTask;
    }
    catch (error) {
        logger_1.logger.error(error, `[Queue Service] Failed to enqueue task "${title}":`);
        throw error;
    }
}
