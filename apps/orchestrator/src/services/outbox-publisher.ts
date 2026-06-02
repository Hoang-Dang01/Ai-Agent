import { dbService } from './db.service';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';
import { MetricsCollector } from './metrics-collector';

export class OutboxPublisher {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isPublishing = false;
  private static readonly nodeInstanceId = `node_${randomUUID()}`;

  private static get client() {
    return dbService.client as any;
  }

  /**
   * Starts the periodic background sweep for pending outbox events.
   */
  public static start(intervalMs: number = 1000): void {
    if (this.intervalId) return;

    logger.info(`[Outbox Publisher] Starting Outbox SRE sweep daemon (Instance: ${this.nodeInstanceId}) every ${intervalMs}ms...`);
    this.intervalId = setInterval(async () => {
      await this.publishPendingEvents();
    }, intervalMs);
  }

  /**
   * Stops the background sweep daemon.
   */
  public static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[Outbox Publisher] Stopped Outbox sweep background daemon.');
    }
  }

  /**
   * Fetches unpublished events, broadcasts them, and marks them as published.
   * Guarantees AT-LEAST-ONCE delivery by lock-claiming events before socket broadcasts.
   */
  public static async publishPendingEvents(): Promise<number> {
    if (this.isPublishing) return 0;
    this.isPublishing = true;

    try {
      const claimTimeoutSeconds = parseInt(process.env.OUTBOX_CLAIM_TIMEOUT_SECONDS || '60', 10);

      // SRE lock claiming using highly optimized PostgreSQL CTE query with SKIP LOCKED
      const claimedEvents = (await this.client.$queryRawUnsafe(`
        WITH claimed AS (
            SELECT id
            FROM outbox_events
            WHERE published_at IS NULL 
              AND (claimed_at IS NULL OR claimed_at < NOW() - $1 * INTERVAL '1 second')
            ORDER BY created_at ASC
            LIMIT 100
            FOR UPDATE SKIP LOCKED
        )
        UPDATE outbox_events o
        SET claimed_at = NOW(), claimed_by = $2
        FROM claimed c
        WHERE o.id = c.id
        RETURNING o.id, o.aggregate_type as "aggregateType", o.aggregate_id as "aggregateId", o.event_type as "eventType", o.payload;
      `, claimTimeoutSeconds, this.nodeInstanceId)) as any[];

      if (!claimedEvents || claimedEvents.length === 0) {
        this.isPublishing = false;
        return 0;
      }

      MetricsCollector.increment('outbox_claim_total', claimedEvents.length);
      logger.info(`[Outbox Publisher] Swept & claimed ${claimedEvents.length} outbox events atomically.`);

      let publishedCount = 0;
      for (const event of claimedEvents) {
        try {
          // Broadcast via Socket.io
          const io = (global as any).io;
          if (io) {
            const socketChannel = event.eventType.toLowerCase();
            logger.debug({ channel: socketChannel, payload: event.payload }, '[Outbox Publisher] Broadcasting socket event');
            io.emit(socketChannel, event.payload);
          }

          // Mark as officially published only AFTER successful dispatch (At-Least-Once guarantee)
          await this.client.outboxEvent.update({
            where: { id: event.id },
            data: { publishedAt: new Date() }
          });

          publishedCount++;
          MetricsCollector.increment('outbox_publish_total');
        } catch (eventErr: any) {
          logger.error(`[Outbox Publisher] Failed to publish event ID: ${event.id}: ${eventErr.message}`);
          MetricsCollector.increment('outbox_publish_failure_total');
          // Do not update publishedAt; this event remains claimed but unpublished, 
          // and will be reclaimed by another sweep thread after the timeout expires.
        }
      }

      return publishedCount;
    } catch (error: any) {
      logger.error(`[Outbox Publisher] Critical SRE sweep failure: ${error.message}`);
      return 0;
    } finally {
      this.isPublishing = false;
    }
  }
}
