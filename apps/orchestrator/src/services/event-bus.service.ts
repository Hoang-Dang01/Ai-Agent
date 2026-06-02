import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class EventBusService {
  private static instance: EventBusService;
  private subscriber: Redis | null = null;

  private constructor() { }

  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  /**
   * Initializes the isolated Redis Pub/Sub subscriber connection.
   */
  public async initialize(): Promise<void> {
    if (this.subscriber) {
      return;
    }

    logger.info(`[Event Bus Node] Connecting to Redis Pub/Sub at ${env.REDIS_URL}...`);

    // Create separate connection purely for subscriber duties (prevents BullMQ lock clashes)
    this.subscriber = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Essential for resilient reconnects without threshold exhaustion
      reconnectOnError: (err) => {
        logger.error(err, '[Event Bus Node] Connection error encountered. Reconnecting...');
        return true; // Auto-trigger reconnection
      }
    });

    this.subscriber.on('connect', () => {
      logger.info('[Event Bus Node] Subscriber connection established.');
    });

    this.subscriber.on('error', (err) => {
      logger.error(err, '[Event Bus Node] Redis Pub/Sub error:');
    });

    // Subscribe to RAG / AI cognitive core events channel
    await this.subscriber.subscribe('ai_events');
    logger.info('[Event Bus Node] Subscribed to Redis channel: ai_events');

    // Wire up the main message receiver pipeline
    this.subscriber.on('message', (channel, message) => {
      if (channel === 'ai_events') {
        this.handleAIEvent(message);
      }
    });
  }

  /**
   * Safe payload parsing and real-time Socket.io broadcasting.
   */
  private handleAIEvent(rawMessage: string): void {
    try {
      const payload = JSON.parse(rawMessage);
      const { type, data } = payload;

      logger.info(`[Event Bus Node] Received event "${type}" on channel "ai_events"`);

      if (type === 'KNOWLEDGE_GRAPH_UPDATED') {
        const versionId = data?.version_id;
        logger.info(`[Event Bus Node] Broadcasting RPGM update event for Version ID: ${versionId} via WebSockets.`);

        // Broadcast the real-time update push notification to all connected visual Next.js UI clients
        const io = (global as any).io;
        if (io) {
          io.emit('graph_update_pushed', { versionId });
        } else {
          logger.warn('[Event Bus Node] Global Socket.io server instance is not initialized. Skipping broadcast.');
        }
      }
    } catch (err: any) {
      logger.error(err, `[Event Bus Node Error] Failed to parse received Redis event payload: ${rawMessage}`);
    }
  }

  /**
   * Graceful disconnection on server termination.
   */
  public async disconnect(): Promise<void> {
    if (this.subscriber) {
      logger.info('[Event Bus Node] Closing Redis subscriber connection...');
      await this.subscriber.quit();
      this.subscriber = null;
    }
  }
}

export const eventBusService = EventBusService.getInstance();
