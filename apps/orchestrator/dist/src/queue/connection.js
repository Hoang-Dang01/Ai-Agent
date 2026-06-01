"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = exports.redisConnectionOptions = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
exports.redisConnectionOptions = {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
};
logger_1.logger.info(`[Redis Connection] Connecting to Redis at ${env_1.env.REDIS_URL}...`);
exports.redisConnection = new ioredis_1.default(env_1.env.REDIS_URL, exports.redisConnectionOptions);
exports.redisConnection.on('connect', () => {
    logger_1.logger.info('[Redis Connection] Connected to Redis successfully.');
});
exports.redisConnection.on('error', (err) => {
    logger_1.logger.error(err, '[Redis Connection] Redis connection error:');
});
