import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const redisConnectionOptions = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
};

logger.info(`[Redis Connection] Connecting to Redis at ${env.REDIS_URL}...`);

export const redisConnection = new Redis(env.REDIS_URL, redisConnectionOptions);

redisConnection.on('connect', () => {
  logger.info('[Redis Connection] Connected to Redis successfully.');
});

redisConnection.on('error', (err) => {
  logger.error(err, '[Redis Connection] Redis connection error:');
});
