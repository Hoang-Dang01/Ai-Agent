import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisConnection } from '../queue/connection';
import { logger } from '../config/logger';

// Create a Redis-backed rate limiter for protecting orchestrator API routes
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return standard rate limit info headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisConnection.call(args[0], ...args.slice(1)),
  }),
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, '[Rate Limiter] Rate limit exceeded');
    res.status(429).json({
      error: 'Too Many Requests: Rate limit exceeded. Please try again after 15 minutes.',
    });
  },
});
