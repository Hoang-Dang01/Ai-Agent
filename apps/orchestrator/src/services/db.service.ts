import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

class DbService {
  public client: PrismaClient;

  constructor() {
    this.client = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.setupLogging();
  }

  private setupLogging() {
    // Pipe Prisma events into our pino logger for observability
    (this.client as any).$on('query', (e: any) => {
      logger.debug({ query: e.query, params: e.params, duration: e.duration }, '[Prisma Query]');
    });

    (this.client as any).$on('error', (e: any) => {
      logger.error({ message: e.message }, '[Prisma Error]');
    });

    (this.client as any).$on('info', (e: any) => {
      logger.info({ message: e.message }, '[Prisma Info]');
    });

    (this.client as any).$on('warn', (e: any) => {
      logger.warn({ message: e.message }, '[Prisma Warning]');
    });
  }

  /**
   * Initializes database connection and ensures pgvector extension is enabled.
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('[DB Service] Connecting to PostgreSQL database...');
      await this.client.$connect();
      logger.info('[DB Service] Database connected successfully.');

      // Initialize pgvector extension
      logger.info('[DB Service] Ensuring pgvector extension is enabled...');
      await this.client.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
      logger.info('[DB Service] pgvector extension checked/enabled successfully.');
    } catch (error) {
      logger.error(error, '[DB Service] Failed to initialize database connection:');
      throw error;
    }
  }

  /**
   * Closes database connection cleanly.
   */
  public async disconnect(): Promise<void> {
    logger.info('[DB Service] Disconnecting database client...');
    await this.client.$disconnect();
    logger.info('[DB Service] Database disconnected.');
  }
}

export const dbService = new DbService();
