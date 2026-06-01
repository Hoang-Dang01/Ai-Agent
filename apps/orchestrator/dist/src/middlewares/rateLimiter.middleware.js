"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimiter = void 0;
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
