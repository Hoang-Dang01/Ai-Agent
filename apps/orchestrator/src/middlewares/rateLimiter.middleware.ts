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

// Create a highly restrictive Redis-backed rate limiter for signup and login endpoints
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Capped at 5 sign-up/login attempts per hour per unique client IP
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisConnection.call(args[0], ...args.slice(1)),
  }),
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, '[Rate Limiter] Auth brute-force rate limit exceeded');
    res.status(429).json({
      error: 'Too Many Requests: Strict authentication rate limit exceeded. Please try again after 1 hour.',
    });
  },
});

