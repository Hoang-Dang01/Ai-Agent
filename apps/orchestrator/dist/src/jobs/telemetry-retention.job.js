"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTelemetryRetentionPruning = runTelemetryRetentionPruning;
exports.startTelemetryRetentionScheduler = startTelemetryRetentionScheduler;
exports.stopTelemetryRetentionScheduler = stopTelemetryRetentionScheduler;
const db_service_1 = require("../services/db.service");
const logger_1 = require("../config/logger");
/**
 * Runs the daily telemetry retention pruning job.
 *
 * Retention Rules:
 * - SUCCESS traces are deleted after 90 days.
 * - FAILED traces are deleted after 180 days.
 * - Raw prompt/response texts are cleared (set to empty strings, keeping hashes) after 30 days.
 */
async function runTelemetryRetentionPruning() {
    logger_1.logger.info('[Telemetry Retention Job] Starting telemetry pruning job...');
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneHundredEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const BATCH_SIZE = 500; // Constrained batch size to prevent locking postgres table under heavy stress
    let deletedSuccessCount = 0;
    let deletedFailedCount = 0;
    let clearedTextsCount = 0;
    try {
        // 1. Delete SUCCESS traces older than 90 days in batch chunks
        while (true) {
            const records = await db_service_1.dbService.client.aITelemetryTrace.findMany({
                where: {
                    status: 'SUCCESS',
                    createdAt: { lt: ninetyDaysAgo }
                },
                select: { id: true },
                take: BATCH_SIZE
            });
            if (records.length === 0)
                break;
            const ids = records.map(r => r.id);
            const res = await db_service_1.dbService.client.aITelemetryTrace.deleteMany({
                where: { id: { in: ids } }
            });
            deletedSuccessCount += res.count;
            logger_1.logger.debug(`[Telemetry Retention Job] Deleted ${res.count} success traces...`);
            if (res.count < BATCH_SIZE)
                break;
        }
        // 2. Delete FAILED traces older than 180 days in batch chunks
        while (true) {
            const records = await db_service_1.dbService.client.aITelemetryTrace.findMany({
                where: {
                    status: 'FAILED',
                    createdAt: { lt: oneHundredEightyDaysAgo }
                },
                select: { id: true },
                take: BATCH_SIZE
            });
            if (records.length === 0)
                break;
            const ids = records.map(r => r.id);
            const res = await db_service_1.dbService.client.aITelemetryTrace.deleteMany({
                where: { id: { in: ids } }
            });
            deletedFailedCount += res.count;
            logger_1.logger.debug(`[Telemetry Retention Job] Deleted ${res.count} failed traces...`);
            if (res.count < BATCH_SIZE)
                break;
        }
        // 3. Clear prompt/response text older than 30 days in batch chunks
        while (true) {
            const records = await db_service_1.dbService.client.aITelemetryTrace.findMany({
                where: {
                    createdAt: { lt: thirtyDaysAgo },
                    OR: [
                        { promptText: { not: '' } },
                        { responseText: { not: '' } }
                    ]
                },
                select: { id: true },
                take: BATCH_SIZE
            });
            if (records.length === 0)
                break;
            const ids = records.map(r => r.id);
            const res = await db_service_1.dbService.client.aITelemetryTrace.updateMany({
                where: { id: { in: ids } },
                data: {
                    promptText: '',
                    responseText: ''
                }
            });
            clearedTextsCount += res.count;
            logger_1.logger.debug(`[Telemetry Retention Job] Cleared prompt/response texts of ${res.count} traces...`);
            if (res.count < BATCH_SIZE)
                break;
        }
        logger_1.logger.info({
            deletedSuccessCount,
            deletedFailedCount,
            clearedTextsCount
        }, '[Telemetry Retention Job] Completed pruning job successfully.');
        return {
            deletedSuccessCount,
            deletedFailedCount,
            clearedTextsCount
        };
    }
    catch (error) {
        logger_1.logger.error(error, '[Telemetry Retention Job] Pruning failed:');
        throw error;
    }
}
let pruningIntervalId = null;
/**
 * Starts the telemetry pruning background scheduler.
 * Runs once every 24 hours.
 */
function startTelemetryRetentionScheduler(intervalMs = 24 * 60 * 60 * 1000) {
    if (pruningIntervalId) {
        logger_1.logger.warn('[Telemetry Retention Job] Scheduler is already running.');
        return;
    }
    logger_1.logger.info('[Telemetry Retention Job] Starting scheduler running every 24 hours.');
    // Run once immediately on startup
    runTelemetryRetentionPruning().catch((err) => {
        logger_1.logger.error(err, '[Telemetry Retention Job] Initial startup run failed:');
    });
    pruningIntervalId = setInterval(async () => {
        try {
            await runTelemetryRetentionPruning();
        }
        catch (err) {
            logger_1.logger.error(err, '[Telemetry Retention Job] Scheduled run failed:');
        }
    }, intervalMs);
}
/**
 * Stops the telemetry pruning background scheduler.
 */
function stopTelemetryRetentionScheduler() {
    if (pruningIntervalId) {
        clearInterval(pruningIntervalId);
        pruningIntervalId = null;
        logger_1.logger.info('[Telemetry Retention Job] Scheduler stopped.');
    }
}
