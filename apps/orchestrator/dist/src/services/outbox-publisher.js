"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxPublisher = void 0;
const db_service_1 = require("./db.service");
const logger_1 = require("../config/logger");
const crypto_1 = require("crypto");
const metrics_collector_1 = require("./metrics-collector");
class OutboxPublisher {
    static get client() {
        return db_service_1.dbService.client;
    }
    /**
     * Starts the periodic background sweep for pending outbox events.
     */
    static start(intervalMs = 1000) {
        if (this.intervalId)
            return;
        logger_1.logger.info(`[Outbox Publisher] Starting Outbox SRE sweep daemon (Instance: ${this.nodeInstanceId}) every ${intervalMs}ms...`);
        this.intervalId = setInterval(async () => {
            await this.publishPendingEvents();
        }, intervalMs);
    }
    /**
     * Stops the background sweep daemon.
     */
    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger_1.logger.info('[Outbox Publisher] Stopped Outbox sweep background daemon.');
        }
    }
    /**
     * Fetches unpublished events, broadcasts them, and marks them as published.
     * Guarantees AT-LEAST-ONCE delivery by lock-claiming events before socket broadcasts.
     */
    static async publishPendingEvents() {
        if (this.isPublishing)
            return 0;
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
      `, claimTimeoutSeconds, this.nodeInstanceId));
            if (!claimedEvents || claimedEvents.length === 0) {
                this.isPublishing = false;
                return 0;
            }
            metrics_collector_1.MetricsCollector.increment('outbox_claim_total', claimedEvents.length);
            logger_1.logger.info(`[Outbox Publisher] Swept & claimed ${claimedEvents.length} outbox events atomically.`);
            let publishedCount = 0;
            for (const event of claimedEvents) {
                try {
                    // Broadcast via Socket.io
                    const io = global.io;
                    if (io) {
                        const socketChannel = event.eventType.toLowerCase();
                        logger_1.logger.debug({ channel: socketChannel, payload: event.payload }, '[Outbox Publisher] Broadcasting socket event');
                        io.emit(socketChannel, event.payload);
                    }
                    // Mark as officially published only AFTER successful dispatch (At-Least-Once guarantee)
                    await this.client.outboxEvent.update({
                        where: { id: event.id },
                        data: { publishedAt: new Date() }
                    });
                    publishedCount++;
                    metrics_collector_1.MetricsCollector.increment('outbox_publish_total');
                }
                catch (eventErr) {
                    logger_1.logger.error(`[Outbox Publisher] Failed to publish event ID: ${event.id}: ${eventErr.message}`);
                    metrics_collector_1.MetricsCollector.increment('outbox_publish_failure_total');
                    // Do not update publishedAt; this event remains claimed but unpublished, 
                    // and will be reclaimed by another sweep thread after the timeout expires.
                }
            }
            return publishedCount;
        }
        catch (error) {
            logger_1.logger.error(`[Outbox Publisher] Critical SRE sweep failure: ${error.message}`);
            return 0;
        }
        finally {
            this.isPublishing = false;
        }
    }
}
exports.OutboxPublisher = OutboxPublisher;
OutboxPublisher.intervalId = null;
OutboxPublisher.isPublishing = false;
OutboxPublisher.nodeInstanceId = `node_${(0, crypto_1.randomUUID)()}`;
