"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.apiRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const connection_1 = require("../queue/connection");
const logger_1 = require("../config/logger");
// Create a Redis-backed rate limiter for protecting orchestrator API routes
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return standard rate limit info headers
    legacyHeaders: false, // Disable the X-RateLimit-* headers
    skip: (req) => process.env.NODE_ENV === 'test',
    store: new rate_limit_redis_1.default({
        // @ts-ignore
        sendCommand: (...args) => connection_1.redisConnection.call(args[0], ...args.slice(1)),
    }),
    handler: (req, res) => {
        logger_1.logger.warn({ ip: req.ip, path: req.path }, '[Rate Limiter] Rate limit exceeded');
        res.status(429).json({
            error: 'Too Many Requests: Rate limit exceeded. Please try again after 15 minutes.',
        });
    },
});
// Create a highly restrictive Redis-backed rate limiter for signup and login endpoints
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // Capped at 5 sign-up/login attempts per hour per unique client IP
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test',
    store: new rate_limit_redis_1.default({
        // @ts-ignore
        sendCommand: (...args) => connection_1.redisConnection.call(args[0], ...args.slice(1)),
    }),
    handler: (req, res) => {
        logger_1.logger.warn({ ip: req.ip, path: req.path }, '[Rate Limiter] Auth brute-force rate limit exceeded');
        res.status(429).json({
            error: 'Too Many Requests: Strict authentication rate limit exceeded. Please try again after 1 hour.',
        });
    },
});
