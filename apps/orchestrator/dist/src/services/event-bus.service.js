"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBusService = exports.EventBusService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
class EventBusService {
    constructor() {
        this.subscriber = null;
    }
    static getInstance() {
        if (!EventBusService.instance) {
            EventBusService.instance = new EventBusService();
        }
        return EventBusService.instance;
    }
    /**
     * Initializes the isolated Redis Pub/Sub subscriber connection.
     */
    async initialize() {
        if (this.subscriber) {
            return;
        }
        logger_1.logger.info(`[Event Bus Node] Connecting to Redis Pub/Sub at ${env_1.env.REDIS_URL}...`);
        // Create separate connection purely for subscriber duties (prevents BullMQ lock clashes)
        this.subscriber = new ioredis_1.default(env_1.env.REDIS_URL, {
            maxRetriesPerRequest: null, // Essential for resilient reconnects without threshold exhaustion
            reconnectOnError: (err) => {
                logger_1.logger.error(err, '[Event Bus Node] Connection error encountered. Reconnecting...');
                return true; // Auto-trigger reconnection
            }
        });
        this.subscriber.on('connect', () => {
            logger_1.logger.info('[Event Bus Node] Subscriber connection established.');
        });
        this.subscriber.on('error', (err) => {
            logger_1.logger.error(err, '[Event Bus Node] Redis Pub/Sub error:');
        });
        // Subscribe to RAG / AI cognitive core events channel
        await this.subscriber.subscribe('ai_events');
        logger_1.logger.info('[Event Bus Node] Subscribed to Redis channel: ai_events');
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
    handleAIEvent(rawMessage) {
        try {
            const payload = JSON.parse(rawMessage);
            const { type, data } = payload;
            logger_1.logger.info(`[Event Bus Node] Received event "${type}" on channel "ai_events"`);
            if (type === 'KNOWLEDGE_GRAPH_UPDATED') {
                const versionId = data?.version_id;
                logger_1.logger.info(`[Event Bus Node] Broadcasting RPGM update event for Version ID: ${versionId} via WebSockets.`);
                // Broadcast the real-time update push notification to all connected visual Next.js UI clients
                const io = global.io;
                if (io) {
                    io.emit('graph_update_pushed', { versionId });
                }
                else {
                    logger_1.logger.warn('[Event Bus Node] Global Socket.io server instance is not initialized. Skipping broadcast.');
                }
            }
        }
        catch (err) {
            logger_1.logger.error(err, `[Event Bus Node Error] Failed to parse received Redis event payload: ${rawMessage}`);
        }
    }
    /**
     * Graceful disconnection on server termination.
     */
    async disconnect() {
        if (this.subscriber) {
            logger_1.logger.info('[Event Bus Node] Closing Redis subscriber connection...');
            await this.subscriber.quit();
            this.subscriber = null;
        }
    }
}
exports.EventBusService = EventBusService;
exports.eventBusService = EventBusService.getInstance();
