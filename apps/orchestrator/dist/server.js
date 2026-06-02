"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http = __importStar(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./src/config/env");
const logger_1 = require("./src/config/logger");
const db_service_1 = require("./src/services/db.service");
const taskQueue_1 = require("./src/queue/taskQueue");
const auth_middleware_1 = require("./src/middlewares/auth.middleware");
const rateLimiter_middleware_1 = require("./src/middlewares/rateLimiter.middleware");
const goal_controller_1 = require("./src/controllers/goal.controller");
// Boot background BullMQ worker
require("./src/queue/taskWorker");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: env_1.env.CORS_ORIGIN }));
app.use(express_1.default.json());
const server = http.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.env.CORS_ORIGIN,
        methods: ['GET', 'POST'],
    },
});
// Stash Socket.io server globally so services and workers can broadcast events
global.io = io;
// 1. Unprotected / Healthcheck endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', environment: env_1.env.NODE_ENV, timestamp: new Date() });
});
// 1.5. REST API endpoint to retrieve the most recent active Goal and all of its AITasks
app.get('/api/goals/active', async (req, res) => {
    try {
        const activeGoal = await db_service_1.dbService.client.userGoal.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                tasks: {
                    orderBy: { createdAt: 'asc' },
                }
            }
        });
        if (!activeGoal) {
            return res.json({ status: 'NONE', goal: null });
        }
        res.json({
            status: 'OK',
            goal: activeGoal
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Server Error] Failed to fetch active goal:');
        res.status(500).json({ error: 'Failed to fetch active goal.' });
    }
});
// 1.8. Plan generation REST route (bridges to Python Cognitive Planner)
app.post('/api/goals/plan', rateLimiter_middleware_1.apiRateLimiter, async (req, res) => {
    await (0, goal_controller_1.createGoalPlan)(req, res);
});
// 1.9. Plan approval REST route (shifts statuses to active and triggers BullMQ)
app.post('/api/goals/:goalId/approve', rateLimiter_middleware_1.apiRateLimiter, async (req, res) => {
    await (0, goal_controller_1.approveGoalPlan)(req, res);
});
// 2. Protected & Rate Limited Endpoint to enqueue tasks
// Mounts Redis-backed rate limiter and JWT authentication middleware
app.post('/api/tasks', rateLimiter_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { goalId, title, payload, dependencies } = req.body;
        if (!goalId || !title) {
            return res.status(400).json({ error: 'Missing required fields: goalId and title.' });
        }
        const task = await (0, taskQueue_1.enqueueTask)(goalId, title, payload, dependencies);
        res.status(201).json(task);
    }
    catch (error) {
        logger_1.logger.error(error, '[Server Error] Failed to submit task:');
        res.status(500).json({ error: error.message || 'Failed to submit task.' });
    }
});
// 3. WebSockets Real-time connection handling
io.on('connection', (socket) => {
    logger_1.logger.info(`[Socket.io] Client connected: ${socket.id}`);
    socket.on('hitl_response', (data) => {
        logger_1.logger.info(`[Socket.io] Received HITL response for goal ${data.goalId}: approved=${data.approved}`);
        const active = global.activeProcesses?.get(data.goalId);
        if (active && active.child) {
            if (active.clearHitlTimeout) {
                active.clearHitlTimeout();
            }
            const answer = data.approved ? 'y\n' : 'n\n';
            active.child.stdin.write(answer);
            logger_1.logger.info(`[Socket.io] Piped answer "${answer.trim()}" to C# standard input.`);
        }
        else {
            logger_1.logger.warn(`[Socket.io] No active C# process found for goal ${data.goalId}`);
        }
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
    });
});
// 4. Clean Startup & Database Connection
async function bootstrap() {
    try {
        // Connect to database and verify pgvector
        await db_service_1.dbService.initialize();
        server.listen(env_1.env.PORT, () => {
            logger_1.logger.info('==================================================');
            logger_1.logger.info(`🚀 [Antigravity Core] Node.js AI Orchestrator running`);
            logger_1.logger.info(`   Port: ${env_1.env.PORT}`);
            logger_1.logger.info(`   Mode: ${env_1.env.NODE_ENV}`);
            logger_1.logger.info('==================================================');
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Bootstrap Error] Failed to launch Orchestrator server:');
        process.exit(1);
    }
}
// Handle termination signals for clean resource release
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM signal received. Shutting down gracefully...');
    await db_service_1.dbService.disconnect();
    server.close(() => {
        logger_1.logger.info('Http server closed.');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT signal received. Shutting down gracefully...');
    await db_service_1.dbService.disconnect();
    server.close(() => {
        logger_1.logger.info('Http server closed.');
        process.exit(0);
    });
});
bootstrap();
