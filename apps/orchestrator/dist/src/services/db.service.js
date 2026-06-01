"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
class DbService {
    constructor() {
        this.client = new client_1.PrismaClient({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'info' },
                { emit: 'event', level: 'warn' },
            ],
        });
        this.setupLogging();
    }
    setupLogging() {
        // Pipe Prisma events into our pino logger for observability
        this.client.$on('query', (e) => {
            logger_1.logger.debug({ query: e.query, params: e.params, duration: e.duration }, '[Prisma Query]');
        });
        this.client.$on('error', (e) => {
            logger_1.logger.error({ message: e.message }, '[Prisma Error]');
        });
        this.client.$on('info', (e) => {
            logger_1.logger.info({ message: e.message }, '[Prisma Info]');
        });
        this.client.$on('warn', (e) => {
            logger_1.logger.warn({ message: e.message }, '[Prisma Warning]');
        });
    }
    /**
     * Initializes database connection and ensures pgvector extension is enabled.
     */
    async initialize() {
        try {
            logger_1.logger.info('[DB Service] Connecting to PostgreSQL database...');
            await this.client.$connect();
            logger_1.logger.info('[DB Service] Database connected successfully.');
            // Initialize pgvector extension
            logger_1.logger.info('[DB Service] Ensuring pgvector extension is enabled...');
            await this.client.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
            logger_1.logger.info('[DB Service] pgvector extension checked/enabled successfully.');
        }
        catch (error) {
            logger_1.logger.error(error, '[DB Service] Failed to initialize database connection:');
            throw error;
        }
    }
    /**
     * Closes database connection cleanly.
     */
    async disconnect() {
        logger_1.logger.info('[DB Service] Disconnecting database client...');
        await this.client.$disconnect();
        logger_1.logger.info('[DB Service] Database disconnected.');
    }
}
exports.dbService = new DbService();
