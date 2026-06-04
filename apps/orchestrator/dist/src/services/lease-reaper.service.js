"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaseReaperService = void 0;
const db_service_1 = require("./db.service");
const task_state_repository_1 = require("./task-state.repository");
const metrics_collector_1 = require("./metrics-collector");
const logger_1 = require("../config/logger");
class LeaseReaperService {
    static get client() {
        return db_service_1.dbService.client;
    }
    /**
     * Starts the Lease Reaper background daemon.
     */
    static start(intervalMs = 15000) {
        if (this.intervalId)
            return;
        logger_1.logger.info(`[Lease Reaper] Starting Lease Reaper recovery daemon every ${intervalMs}ms...`);
        this.intervalId = setInterval(async () => {
            await this.reap();
        }, intervalMs);
    }
    /**
     * Stops the background sweep daemon.
     */
    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger_1.logger.info('[Lease Reaper] Stopped Lease Reaper daemon.');
        }
    }
    /**
     * Scans for expired active tasks in batches of 100 using FOR UPDATE SKIP LOCKED
     * and triggers their recovery workflow atomically inside a single transaction.
     */
    static async reap() {
        if (this.isReaping)
            return 0;
        this.isReaping = true;
        try {
            metrics_collector_1.MetricsCollector.increment('recovery_attempt_total');
            return await this.client.$transaction(async (tx) => {
                // Production-grade batch sweep claiming up to 100 expired executing tasks atomically
                // Locks them using FOR UPDATE SKIP LOCKED to prevent lock contention or double claiming
                const expiredTasks = (await tx.$queryRawUnsafe(`
          SELECT id, execution_epoch as "executionEpoch", status, retry_count as "retryCount", max_retry as "maxRetry"
          FROM "AITask"
          WHERE status = 'EXECUTING' AND lease_expires_at < NOW()
          LIMIT 100
          FOR UPDATE SKIP LOCKED;
        `));
                if (expiredTasks.length === 0) {
                    return 0;
                }
                logger_1.logger.warn(`[Lease Reaper] Detected ${expiredTasks.length} orphaned executing task(s) with expired leases.`);
                let recoveredCount = 0;
                for (const task of expiredTasks) {
                    try {
                        const currentEpoch = task.executionEpoch;
                        const updatedRetry = task.retryCount + 1;
                        // 1. Mark current attempt as TIMED_OUT/FAILED in the execution history
                        await tx.taskExecutionAttempt.updateMany({
                            where: { taskId: task.id, executionEpoch: currentEpoch },
                            data: {
                                status: 'FAILED',
                                error: 'Lease expired. Worker heartbeat timed out or crashed.',
                                endedAt: new Date()
                            }
                        });
                        // Check if retry ceiling is hit
                        if (updatedRetry >= task.maxRetry) {
                            // Trigger DLQ dead-lettering directly in a single transaction updating epoch, fencingToken and status
                            const casSuccess = await task_state_repository_1.TaskStateRepository.updateWithCAS(task.id, currentEpoch, {
                                status: 'FAILED',
                                retryCount: updatedRetry,
                                deadLetteredAt: new Date(),
                                dlqReason: 'LEASE_EXPIRED_RETRY_LIMIT',
                                lastError: 'CriticalException: Lease expired and retry threshold reached.'
                            }, true, // Atomic Fencing token generation
                            tx, 'EXECUTING' // Validate status in DB is still EXECUTING
                            );
                            if (casSuccess) {
                                logger_1.logger.error(`[Lease Reaper] Task ${task.id} exceeded max retries. Moved to DLQ.`);
                                metrics_collector_1.MetricsCollector.increment('recovery_success_total');
                                metrics_collector_1.MetricsCollector.increment('lease_recovery_total');
                                recoveredCount++;
                            }
                            else {
                                metrics_collector_1.MetricsCollector.increment('recovery_failure_total');
                                metrics_collector_1.MetricsCollector.increment('lease_recovery_failure_total');
                            }
                            continue;
                        }
                        // 2. Perform Single-Transaction CAS + Fencing Recovery: EXECUTING -> QUEUED
                        // Fences concurrent recovery races. Monotonically increments executionEpoch & fencingToken atomically in one step
                        const casSuccess = await task_state_repository_1.TaskStateRepository.updateWithCAS(task.id, currentEpoch, {
                            status: 'QUEUED',
                            retryCount: updatedRetry,
                            leaseExpiresAt: null,
                            lastHeartbeatAt: null
                        }, true, // Atomic Fencing token generation
                        tx, 'EXECUTING' // Validate status in DB is still EXECUTING
                        );
                        if (casSuccess) {
                            logger_1.logger.info(`[Lease Reaper] Task ${task.id} recovered back to QUEUED (Epoch: ${currentEpoch + 1}).`);
                            metrics_collector_1.MetricsCollector.increment('recovery_success_total');
                            metrics_collector_1.MetricsCollector.increment('lease_recovery_total');
                            recoveredCount++;
                        }
                        else {
                            logger_1.logger.warn(`[Lease Reaper] CAS recovery conflict for Task ${task.id}. Another node recovered it.`);
                            metrics_collector_1.MetricsCollector.increment('recovery_failure_total');
                            metrics_collector_1.MetricsCollector.increment('lease_recovery_failure_total');
                        }
                    }
                    catch (taskErr) {
                        logger_1.logger.error(`[Lease Reaper] Failed to recover task ID: ${task.id}: ${taskErr.message}`);
                        metrics_collector_1.MetricsCollector.increment('recovery_failure_total');
                        metrics_collector_1.MetricsCollector.increment('lease_recovery_failure_total');
                    }
                }
                return recoveredCount;
            });
        }
        catch (error) {
            logger_1.logger.error(`[Lease Reaper] Critical daemon error: ${error.message}`);
            metrics_collector_1.MetricsCollector.increment('recovery_failure_total');
            metrics_collector_1.MetricsCollector.increment('lease_recovery_failure_total');
            return 0;
        }
        finally {
            this.isReaping = false;
        }
    }
}
exports.LeaseReaperService = LeaseReaperService;
LeaseReaperService.intervalId = null;
LeaseReaperService.isReaping = false;
