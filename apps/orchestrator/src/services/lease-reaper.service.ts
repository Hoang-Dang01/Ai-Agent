import { dbService } from './db.service';
import { TaskStateRepository } from './task-state.repository';
import { MetricsCollector } from './metrics-collector';
import { logger } from '../config/logger';

export class LeaseReaperService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isReaping = false;

  private static get client() {
    return dbService.client as any;
  }

  /**
   * Starts the Lease Reaper background daemon.
   */
  public static start(intervalMs: number = 15000): void {
    if (this.intervalId) return;

    logger.info(`[Lease Reaper] Starting Lease Reaper recovery daemon every ${intervalMs}ms...`);
    this.intervalId = setInterval(async () => {
      await this.reap();
    }, intervalMs);
  }

  /**
   * Stops the background sweep daemon.
   */
  public static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[Lease Reaper] Stopped Lease Reaper daemon.');
    }
  }

  /**
   * Scans for expired active tasks in batches of 100 using FOR UPDATE SKIP LOCKED
   * and triggers their recovery workflow atomically inside a single transaction.
   */
  public static async reap(): Promise<number> {
    if (this.isReaping) return 0;
    this.isReaping = true;

    try {
      MetricsCollector.increment('recovery_attempt_total');

      return await this.client.$transaction(async (tx: any) => {
        // Production-grade batch sweep claiming up to 100 expired executing tasks atomically
        // Locks them using FOR UPDATE SKIP LOCKED to prevent lock contention or double claiming
        const expiredTasks = (await tx.$queryRawUnsafe(`
          SELECT id, execution_epoch as "executionEpoch", status, retry_count as "retryCount", max_retry as "maxRetry"
          FROM "AITask"
          WHERE status = 'EXECUTING' AND lease_expires_at < NOW()
          LIMIT 100
          FOR UPDATE SKIP LOCKED;
        `)) as any[];

        if (expiredTasks.length === 0) {
          return 0;
        }

        logger.warn(`[Lease Reaper] Detected ${expiredTasks.length} orphaned executing task(s) with expired leases.`);

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
              const casSuccess = await TaskStateRepository.updateWithCAS(
                task.id,
                currentEpoch,
                {
                  status: 'FAILED',
                  retryCount: updatedRetry,
                  deadLetteredAt: new Date(),
                  dlqReason: 'LEASE_EXPIRED_RETRY_LIMIT',
                  lastError: 'CriticalException: Lease expired and retry threshold reached.'
                },
                true, // Atomic Fencing token generation
                tx,
                'EXECUTING' // Validate status in DB is still EXECUTING
              );

              if (casSuccess) {
                logger.error(`[Lease Reaper] Task ${task.id} exceeded max retries. Moved to DLQ.`);
                MetricsCollector.increment('recovery_success_total');
                MetricsCollector.increment('lease_recovery_total');
                recoveredCount++;
              } else {
                MetricsCollector.increment('recovery_failure_total');
                MetricsCollector.increment('lease_recovery_failure_total');
              }
              continue;
            }

            // 2. Perform Single-Transaction CAS + Fencing Recovery: EXECUTING -> QUEUED
            // Fences concurrent recovery races. Monotonically increments executionEpoch & fencingToken atomically in one step
            const casSuccess = await TaskStateRepository.updateWithCAS(
              task.id,
              currentEpoch,
              {
                status: 'QUEUED',
                retryCount: updatedRetry,
                leaseExpiresAt: null,
                lastHeartbeatAt: null
              },
              true, // Atomic Fencing token generation
              tx,
              'EXECUTING' // Validate status in DB is still EXECUTING
            );

            if (casSuccess) {
              logger.info(`[Lease Reaper] Task ${task.id} recovered back to QUEUED (Epoch: ${currentEpoch + 1}).`);
              MetricsCollector.increment('recovery_success_total');
              MetricsCollector.increment('lease_recovery_total');
              recoveredCount++;
            } else {
              logger.warn(`[Lease Reaper] CAS recovery conflict for Task ${task.id}. Another node recovered it.`);
              MetricsCollector.increment('recovery_failure_total');
              MetricsCollector.increment('lease_recovery_failure_total');
            }
          } catch (taskErr: any) {
            logger.error(`[Lease Reaper] Failed to recover task ID: ${task.id}: ${taskErr.message}`);
            MetricsCollector.increment('recovery_failure_total');
            MetricsCollector.increment('lease_recovery_failure_total');
          }
        }

        return recoveredCount;
      });
    } catch (error: any) {
      logger.error(`[Lease Reaper] Critical daemon error: ${error.message}`);
      MetricsCollector.increment('recovery_failure_total');
      MetricsCollector.increment('lease_recovery_failure_total');
      return 0;
    } finally {
      this.isReaping = false;
    }
  }
}
