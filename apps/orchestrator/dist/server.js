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
const jwt = __importStar(require("jsonwebtoken"));
const env_1 = require("./src/config/env");
const logger_1 = require("./src/config/logger");
const db_service_1 = require("./src/services/db.service");
const taskQueue_1 = require("./src/queue/taskQueue");
const auth_middleware_1 = require("./src/middlewares/auth.middleware");
const rateLimiter_middleware_1 = require("./src/middlewares/rateLimiter.middleware");
const goal_controller_1 = require("./src/controllers/goal.controller");
const auth_controller_1 = require("./src/controllers/auth.controller");
const event_bus_service_1 = require("./src/services/event-bus.service");
const payment_controller_1 = require("./src/controllers/payment.controller");
const outbox_publisher_1 = require("./src/services/outbox-publisher");
const lease_reaper_service_1 = require("./src/services/lease-reaper.service");
const telemetry_retention_job_1 = require("./src/jobs/telemetry-retention.job");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Boot background BullMQ worker
const taskWorker_1 = require("./src/queue/taskWorker");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: env_1.env.CORS_ORIGIN }));
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/api/payment/webhook')) {
            req.rawBody = buf;
        }
    }
}));
const server = http.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.env.CORS_ORIGIN,
        methods: ['GET', 'POST'],
    },
});
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
        logger_1.logger.warn('[Socket.io] Handshake failed: Token missing');
        return next(new Error('Authentication error: Token missing'));
    }
    try {
        const decoded = jwt.verify(token, env_1.env.JWT_SECRET, { algorithms: ['HS256'] });
        const userId = decoded.sub || decoded.id;
        if (!userId) {
            logger_1.logger.warn('[Socket.io] Handshake failed: Invalid claims');
            return next(new Error('Authentication error: Invalid claims'));
        }
        // Verify user still exists in database (Deleted User Protection)
        db_service_1.dbService.client.user.findUnique({
            where: { id: userId },
            select: { id: true }
        }).then(dbUser => {
            if (!dbUser) {
                logger_1.logger.warn({ userId, event: 'SECURITY_ACCESS_DENIED' }, '[Socket.io] Handshake failed: User no longer exists in database.');
                return next(new Error('Authentication error: User no longer exists.'));
            }
            socket.userId = userId;
            socket.tokenExp = decoded.exp;
            next();
        }).catch(err => {
            logger_1.logger.error(err, '[Socket.io] Database verification failed during handshake');
            return next(new Error('Authentication error: Internal error'));
        });
    }
    catch (err) {
        logger_1.logger.warn('[Socket.io] Handshake failed: Token invalid');
        return next(new Error('Authentication error: Invalid token'));
    }
});
// Stash Socket.io server globally so services and workers can broadcast events
global.io = io;
// 1. Unprotected / Healthcheck endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', environment: env_1.env.NODE_ENV, timestamp: new Date() });
});
// 1.2. Public Authentication Endpoints (Strict rate limiting)
app.post('/api/auth/signup', rateLimiter_middleware_1.authRateLimiter, async (req, res) => {
    await (0, auth_controller_1.signup)(req, res);
});
app.post('/api/auth/login', rateLimiter_middleware_1.authRateLimiter, async (req, res) => {
    await (0, auth_controller_1.login)(req, res);
});
// 1.5. REST API endpoint to retrieve the most recent active Goal and all of its AITasks
app.get('/api/goals/active', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const activeGoal = await db_service_1.dbService.client.userGoal.findFirst({
            where: { userId: req.user.id },
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
// 1.6. REST API endpoint to retrieve a specific Goal by ID and all of its AITasks
app.get('/api/goals/:goalId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const goal = await db_service_1.dbService.client.userGoal.findFirst({
            where: { id: req.params.goalId, userId: req.user.id },
            include: {
                tasks: {
                    orderBy: { createdAt: 'asc' },
                }
            }
        });
        if (!goal) {
            logger_1.logger.warn({ userId: req.user.id, resourceId: req.params.goalId, ip: req.ip, event: 'SECURITY_ACCESS_DENIED' }, '[Server API] Access Denied: Goal not found or unauthorized.');
            return res.status(404).json({ error: 'Goal not found' });
        }
        res.json({
            status: 'OK',
            goal
        });
    }
    catch (error) {
        logger_1.logger.error(error, `[Server Error] Failed to fetch goal details for ID ${req.params.goalId}:`);
        res.status(500).json({ error: 'Failed to fetch goal details.' });
    }
});
// 1.8. Plan generation REST route (bridges to Python Cognitive Planner)
app.post('/api/goals/plan', rateLimiter_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware, async (req, res) => {
    await (0, goal_controller_1.createGoalPlan)(req, res);
});
// 1.9. Plan approval REST route (shifts statuses to active and triggers BullMQ)
app.post('/api/goals/:goalId/approve', rateLimiter_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware, async (req, res) => {
    await (0, goal_controller_1.approveGoalPlan)(req, res);
});
// 1.12. Study Hub Chat Proxy with local n8n automation and fallback recovery
app.post('/api/study-hub/chat', rateLimiter_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware, async (req, res) => {
    const { message, sessionId, agent } = req.body;
    if (!message || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields: message and sessionId.' });
    }
    const agentType = agent || 'general';
    try {
        // Validate session ownership: check if session exists and belongs to user
        const existingChat = await db_service_1.dbService.client.chatHistory.findFirst({
            where: { sessionId }
        });
        if (existingChat && existingChat.userId && existingChat.userId !== req.user.id) {
            logger_1.logger.warn({ userId: req.user.id, resourceId: sessionId, ip: req.ip, event: 'SECURITY_ACCESS_DENIED', ownerId: existingChat.userId }, '[Chat Proxy] Access Denied: Session ID owned by another user.');
            return res.status(403).json({ error: 'Access Denied: Session ID owned by another user.' });
        }
        // 1. Persist User Message to chat_history table
        await db_service_1.dbService.client.chatHistory.create({
            data: {
                sessionId,
                userId: req.user.id,
                senderType: 'user',
                agentType,
                message,
            },
        });
        // 2. Fetch/Proxy webhook request to local n8n workflow engine with timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s hard ceiling timeout
        let aiMessage = '';
        let aiSources = null;
        let responseOk = false;
        try {
            const n8nRes = await fetch(env_1.env.N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, sessionId, agent: agentType }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (n8nRes.ok) {
                const data = await n8nRes.json();
                aiMessage = data.output || data.response || 'No response returned from workflow.';
                aiSources = data.sources || null;
                responseOk = true;
            }
            else {
                logger_1.logger.warn(`[Orchestrator Gateway] n8n responded with status ${n8nRes.status}. Attempting direct Python RAG fallback.`);
            }
        }
        catch (fetchErr) {
            clearTimeout(timeoutId);
            logger_1.logger.warn(fetchErr, '[Orchestrator Gateway] n8n fetch request failed or timed out. Attempting direct Python RAG fallback.');
        }
        // Direct Fallback strictly for Study Hub Q&A route
        if (!responseOk) {
            try {
                logger_1.logger.info(`[Orchestrator Fallback] Querying Python AI Engine RAG chat directly at: ${env_1.env.AI_ENGINE_URL}/api/rag/chat/`);
                const pythonRes = await fetch(`${env_1.env.AI_ENGINE_URL}/api/rag/chat/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: message })
                });
                if (pythonRes.ok) {
                    const data = await pythonRes.json();
                    aiMessage = data.response || 'No response from direct RAG.';
                    aiSources = data.sources || null;
                    responseOk = true;
                }
                else {
                    logger_1.logger.error(`[Orchestrator Fallback] Python AI Engine RAG responded with status ${pythonRes.status}`);
                    aiMessage = 'Failed to communicate with RAG engine. Python service returned an error.';
                }
            }
            catch (fallbackErr) {
                logger_1.logger.error(fallbackErr, '[Orchestrator Fallback] Direct Python RAG query failed:');
                aiMessage = 'Failed to communicate with RAG engine. Python service is offline or timed out.';
            }
        }
        // 3. Persist AI Response (or Fallback System Error response) to PostgreSQL with relational citations
        const savedAiMsg = await db_service_1.dbService.client.chatHistory.create({
            data: {
                sessionId,
                userId: req.user.id,
                senderType: 'ai',
                agentType: responseOk ? agentType : 'system_error',
                message: aiMessage,
                citations: aiSources && Array.isArray(aiSources) ? {
                    create: aiSources.map((src) => ({
                        documentId: src.document_id || src.documentId || '',
                        title: src.title || '',
                        similarity: typeof src.similarity === 'number' ? src.similarity : null
                    }))
                } : undefined
            },
            include: {
                citations: true
            }
        });
        res.json({
            status: 'OK',
            output: savedAiMsg.message,
            message: savedAiMsg,
            sources: savedAiMsg.citations
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Server Error] Failed to process Study Hub Chat proxy:');
        res.status(500).json({ error: 'Failed to process Study Hub chat request.' });
    }
});
// 1.13. Retrieve persistent chat logs filtered by sessionId and ordered chronologically
app.get('/api/study-hub/history/:sessionId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        // Validate session ownership: verify that if session history exists, it belongs to the authenticated user
        const existingChat = await db_service_1.dbService.client.chatHistory.findFirst({
            where: { sessionId }
        });
        if (existingChat && existingChat.userId && existingChat.userId !== req.user.id) {
            logger_1.logger.warn({ userId: req.user.id, resourceId: sessionId, ip: req.ip, event: 'SECURITY_ACCESS_DENIED', ownerId: existingChat.userId }, '[Chat History] Access Denied: Session ID owned by another user.');
            return res.status(403).json({ error: 'Access Denied: Session ID owned by another user.' });
        }
        const chatLogs = await db_service_1.dbService.client.chatHistory.findMany({
            where: { sessionId, userId: req.user.id },
            include: { citations: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json({
            status: 'OK',
            history: chatLogs,
        });
    }
    catch (error) {
        logger_1.logger.error(error, `[Server Error] Failed to retrieve chat history for session ${req.params.sessionId}:`);
        res.status(500).json({ error: 'Failed to retrieve chat history.' });
    }
});
// 1.13.5. Document Ingestion Agent Upload Proxy
const uploadDir = path_1.default.join(__dirname, 'temp');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'Too many uploads. Limit is 5 files per minute.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test' // bypass for test runs
});
const upload = (0, multer_1.default)({
    dest: uploadDir,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
app.post('/api/document-agent/upload', auth_middleware_1.authMiddleware, uploadLimiter, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'Payload Too Large: File size exceeds the 50MB limit.' });
            }
            return res.status(400).json({ error: err.message || 'File upload error.' });
        }
        next();
    });
}, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    try {
        const formData = new FormData();
        const fileBuffer = await fs_1.default.promises.readFile(req.file.path);
        const fileBlob = new Blob([fileBuffer]);
        formData.append('file', fileBlob, req.file.originalname);
        if (req.body.commitMessage) {
            formData.append('commit_message', req.body.commitMessage);
        }
        // Forward to Python AI Engine /api/document-agent/upload/
        const response = await fetch(`${env_1.env.AI_ENGINE_URL}/api/document-agent/upload/`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            let errorMessage = 'Failed to parse document.';
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.error || errorMessage;
                }
                else {
                    errorMessage = await response.text() || errorMessage;
                }
            }
            catch (parseErr) {
                logger_1.logger.warn(parseErr, '[Orchestrator Gateway] Failed to parse error response from Python AI engine');
            }
            return res.status(response.status).json({ error: errorMessage });
        }
        const data = await response.json();
        res.status(201).json(data);
    }
    catch (error) {
        logger_1.logger.error(error, '[Server Error] DocumentAgent upload failed:');
        res.status(500).json({ error: 'Failed to process document upload.' });
    }
    finally {
        // Always delete temp file to prevent disk leaks
        fs_1.default.promises.unlink(req.file.path).catch(err => {
            logger_1.logger.error(err, `[Server Error] Failed to delete temp file at ${req.file.path}`);
        });
    }
});
// 1.14. Stripe Payment Gateway & Webhooks Web portals
app.post('/api/payment/checkout', rateLimiter_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware, async (req, res) => {
    await (0, payment_controller_1.createCheckoutSession)(req, res);
});
app.post('/api/payment/webhook', async (req, res) => {
    await (0, payment_controller_1.handleStripeWebhook)(req, res);
});
app.get('/api/payment/subscription', auth_middleware_1.authMiddleware, async (req, res) => {
    await (0, payment_controller_1.getSubscriptionStatus)(req, res);
});
// 2. Protected & Rate Limited Endpoint to enqueue tasks
// Mounts Redis-backed rate limiter and JWT authentication middleware
app.post('/api/tasks', rateLimiter_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { goalId, title, payload, dependencies } = req.body;
        if (!goalId || !title) {
            return res.status(400).json({ error: 'Missing required fields: goalId and title.' });
        }
        // Enforce user goal ownership before enqueueing tasks
        const goal = await db_service_1.dbService.client.userGoal.findFirst({
            where: { id: goalId, userId: req.user.id }
        });
        if (!goal) {
            logger_1.logger.warn({ userId: req.user.id, resourceId: goalId, ip: req.ip, event: 'SECURITY_ACCESS_DENIED' }, '[Queue Service] Access Denied: Goal not found or unauthorized.');
            return res.status(404).json({ error: 'Goal not found or unauthorized.' });
        }
        const task = await (0, taskQueue_1.enqueueTask)(goalId, title, payload, dependencies);
        res.status(201).json(task);
    }
    catch (error) {
        logger_1.logger.error(error, '[Server Error] Failed to submit task:');
        res.status(500).json({ error: error.message || 'Failed to submit task.' });
    }
});
// --- AI Telemetry & Debugging Deck API endpoints ---
// 1. Get telemetry summary statistics with P50/P95/P99 latency calculations
app.get('/api/telemetry/stats', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const totalTraces = await db_service_1.dbService.client.aITelemetryTrace.count({
            where: { goal: { userId: req.user.id } }
        });
        const successTraces = await db_service_1.dbService.client.aITelemetryTrace.count({
            where: { status: 'SUCCESS', goal: { userId: req.user.id } }
        });
        const failedTraces = await db_service_1.dbService.client.aITelemetryTrace.count({
            where: { status: 'FAILED', goal: { userId: req.user.id } }
        });
        const sumTokens = await db_service_1.dbService.client.aITelemetryTrace.aggregate({
            where: { goal: { userId: req.user.id } },
            _sum: {
                inputTokens: true,
                outputTokens: true
            }
        });
        const sumCosts = await db_service_1.dbService.client.aITelemetryTrace.aggregate({
            where: { goal: { userId: req.user.id } },
            _sum: {
                calculatedInputCostUsd: true,
                calculatedOutputCostUsd: true,
                estimatedCostUsd: true
            }
        });
        // Compute P50, P95, and P99 percentiles for latency on SUCCESS calls using PostgreSQL PERCENTILE_CONT
        const percentiles = await db_service_1.dbService.client.$queryRaw `
      SELECT 
        COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY t.latency_ms), 0) AS p50,
        COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY t.latency_ms), 0) AS p95,
        COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY t.latency_ms), 0) AS p99
      FROM ai_telemetry_traces t
      INNER JOIN "UserGoal" g ON t.goal_id = g.id
      WHERE t.status = 'SUCCESS' AND t.latency_ms IS NOT NULL AND g."userId" = ${req.user.id};
    `;
        const p50 = percentiles[0]?.p50 || 0;
        const p95 = percentiles[0]?.p95 || 0;
        const p99 = percentiles[0]?.p99 || 0;
        res.json({
            status: 'OK',
            stats: {
                totalTraces,
                successTraces,
                failedTraces,
                inputTokens: sumTokens._sum.inputTokens || 0,
                outputTokens: sumTokens._sum.outputTokens || 0,
                calculatedInputCostUsd: Number(sumCosts._sum.calculatedInputCostUsd || 0),
                calculatedOutputCostUsd: Number(sumCosts._sum.calculatedOutputCostUsd || 0),
                estimatedCostUsd: Number(sumCosts._sum.estimatedCostUsd || 0),
                latencyPercentiles: {
                    p50,
                    p95,
                    p99
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Server Error] Failed to aggregate telemetry statistics:');
        res.status(500).json({ error: 'Failed to retrieve telemetry stats.' });
    }
});
// 2. Query/search telemetry traces supporting pagination and filtering
app.get('/api/telemetry/traces', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { status, traceType, model, limit = '20', offset = '0' } = req.query;
        const parsedLimit = parseInt(limit, 10);
        const parsedOffset = parseInt(offset, 10);
        const traces = await db_service_1.dbService.client.aITelemetryTrace.findMany({
            where: {
                goal: { userId: req.user.id },
                ...(status && { status: status }),
                ...(traceType && { traceType: traceType }),
                ...(model && { model: model })
            },
            orderBy: { createdAt: 'desc' },
            take: parsedLimit,
            skip: parsedOffset
        });
        const total = await db_service_1.dbService.client.aITelemetryTrace.count({
            where: {
                goal: { userId: req.user.id },
                ...(status && { status: status }),
                ...(traceType && { traceType: traceType }),
                ...(model && { model: model })
            }
        });
        res.json({
            status: 'OK',
            total,
            limit: parsedLimit,
            offset: parsedOffset,
            traces
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Server Error] Failed to retrieve telemetry traces:');
        res.status(500).json({ error: 'Failed to query telemetry traces.' });
    }
});
// 3. Get trace details by ID and its child spans (reconstructing Call Tree)
app.get('/api/telemetry/traces/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const trace = await db_service_1.dbService.client.aITelemetryTrace.findFirst({
            where: { id: req.params.id, goal: { userId: req.user.id } }
        });
        if (!trace) {
            logger_1.logger.warn({ userId: req.user.id, resourceId: req.params.id, ip: req.ip, event: 'SECURITY_ACCESS_DENIED' }, '[Telemetry API] Access Denied: Trace not found or unauthorized.');
            return res.status(404).json({ error: 'Telemetry trace not found' });
        }
        let childSpans = [];
        if (trace.spanId) {
            childSpans = await db_service_1.dbService.client.aITelemetryTrace.findMany({
                where: { parentSpanId: trace.spanId, goal: { userId: req.user.id } },
                orderBy: { createdAt: 'asc' }
            });
        }
        res.json({
            status: 'OK',
            trace,
            childSpans
        });
    }
    catch (error) {
        logger_1.logger.error(error, `[Server Error] Failed to retrieve details for trace ${req.params.id}:`);
        res.status(500).json({ error: 'Failed to retrieve trace details.' });
    }
});
// 3. WebSockets Real-time connection handling
io.on('connection', (socket) => {
    const userId = socket.userId;
    const tokenExp = socket.tokenExp;
    socket.join(`user_${userId}`);
    logger_1.logger.info(`[Socket.io] Client connected: ${socket.id} (User: ${userId})`);
    let disconnectTimeout = null;
    if (tokenExp) {
        const timeToExpire = tokenExp * 1000 - Date.now();
        if (timeToExpire <= 0) {
            logger_1.logger.warn({ userId }, '[Socket.io] Socket disconnected immediately: Token expired.');
            socket.disconnect(true);
            return;
        }
        disconnectTimeout = setTimeout(() => {
            logger_1.logger.warn({ userId, event: 'SECURITY_ACCESS_DENIED' }, '[Socket.io] Socket force-disconnected: JWT expired.');
            socket.disconnect(true);
        }, timeToExpire);
    }
    socket.on('hitl_response', async (data) => {
        logger_1.logger.info(`[Socket.io] Received HITL response for goal ${data.goalId} from user ${userId}: approved=${data.approved}`);
        // Authorize HITL response: ensure target goal belongs to this user
        try {
            const goal = await db_service_1.dbService.client.userGoal.findFirst({
                where: { id: data.goalId, userId }
            });
            if (!goal) {
                logger_1.logger.warn({ userId, resourceId: data.goalId, ip: socket.handshake.address, event: 'SECURITY_ACCESS_DENIED' }, `[Socket.io] Unauthorized HITL response attempt by user ${userId} for goal ${data.goalId}`);
                return;
            }
        }
        catch (dbErr) {
            logger_1.logger.error(dbErr, `[Socket.io] Database verification failed during HITL response for goal ${data.goalId}`);
            return;
        }
        const active = global.activeProcesses?.get(data.goalId);
        if (active && active.child) {
            if (active.clearHitlTimeout) {
                active.clearHitlTimeout();
            }
            const answer = data.approved ? 'y\n' : 'n\n';
            try {
                if (active.child.stdin && active.child.stdin.writable) {
                    active.child.stdin.write(answer);
                    logger_1.logger.info(`[Socket.io] Piped answer "${answer.trim()}" to C# standard input.`);
                }
                else {
                    logger_1.logger.warn(`[Socket.io] Stdin stream is not writable for goal ${data.goalId}. Process may have exited or timed out.`);
                }
            }
            catch (err) {
                logger_1.logger.error(err, `[Socket.io] Failed to write answer to C# stdin for goal ${data.goalId}:`);
            }
        }
        else {
            logger_1.logger.warn(`[Socket.io] No active C# process found for goal ${data.goalId}`);
        }
    });
    socket.on('disconnect', () => {
        if (disconnectTimeout) {
            clearTimeout(disconnectTimeout);
        }
        logger_1.logger.info(`[Socket.io] Client disconnected: ${socket.id} (User: ${userId})`);
    });
});
// 4. Clean Startup & Database Connection
async function bootstrap() {
    try {
        // Connect to database and verify pgvector
        await db_service_1.dbService.initialize();
        // Start outbox publisher sweep loop
        outbox_publisher_1.OutboxPublisher.start(1000);
        // Start lease reaper recovery sweep loop
        lease_reaper_service_1.LeaseReaperService.start(15000);
        // Connect to Redis Event Bus Pub/Sub
        await event_bus_service_1.eventBusService.initialize();
        // Start daily telemetry retention pruning scheduler
        (0, telemetry_retention_job_1.startTelemetryRetentionScheduler)();
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
async function handleGracefulShutdown(signal) {
    logger_1.logger.info(`[Shutdown] ${signal} signal received. Shutting down gracefully...`);
    try {
        // 1. Stop BullMQ worker from claiming new tasks
        logger_1.logger.info('[Shutdown] Closing BullMQ tasks worker...');
        await taskWorker_1.aiTasksWorker.close();
        logger_1.logger.info('[Shutdown] BullMQ tasks worker closed.');
        // 1.5. Terminate all active spawned processes to prevent orphan leaks
        logger_1.logger.info('[Shutdown] Terminating all active C# processes...');
        const activeProcs = global.activeProcesses;
        if (activeProcs && activeProcs.size > 0) {
            for (const [goalId, active] of activeProcs.entries()) {
                try {
                    if (active.clearHitlTimeout) {
                        active.clearHitlTimeout();
                    }
                    if (active.child) {
                        logger_1.logger.info(`[Shutdown] Killing process for goal ${goalId} (PID: ${active.child.pid})`);
                        active.child.kill('SIGKILL');
                    }
                }
                catch (killErr) {
                    logger_1.logger.error(`[Shutdown] Error killing child process for goal ${goalId}: ${killErr.message}`);
                }
            }
            activeProcs.clear();
        }
        // 2. Stop sweep & reaper daemons
        outbox_publisher_1.OutboxPublisher.stop();
        lease_reaper_service_1.LeaseReaperService.stop();
        (0, telemetry_retention_job_1.stopTelemetryRetentionScheduler)();
        // 3. Perform a final outbox flush to send pending events
        logger_1.logger.info('[Shutdown] Performing final outbox flush sweep...');
        await outbox_publisher_1.OutboxPublisher.publishPendingEvents();
        logger_1.logger.info('[Shutdown] Final outbox flush sweep completed.');
        // 4. Disconnect Redis and DB
        logger_1.logger.info('[Shutdown] Disconnecting event bus and database...');
        await event_bus_service_1.eventBusService.disconnect();
        await db_service_1.dbService.disconnect();
        // 5. Close Http Server
        server.close(() => {
            logger_1.logger.info('[Shutdown] Http server closed.');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Shutdown Error] Error during graceful shutdown:');
        process.exit(1);
    }
}
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
bootstrap();
