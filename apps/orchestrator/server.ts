import express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { env } from './src/config/env';
import { logger } from './src/config/logger';
import { dbService } from './src/services/db.service';
import { enqueueTask } from './src/queue/taskQueue';
import { authMiddleware } from './src/middlewares/auth.middleware';
import { apiRateLimiter, authRateLimiter } from './src/middlewares/rateLimiter.middleware';
import { createGoalPlan, approveGoalPlan } from './src/controllers/goal.controller';
import { signup, login } from './src/controllers/auth.controller';
import { eventBusService } from './src/services/event-bus.service';
import { createCheckoutSession, handleStripeWebhook, getSubscriptionStatus } from './src/controllers/payment.controller';
import { OutboxPublisher } from './src/services/outbox-publisher';
import { LeaseReaperService } from './src/services/lease-reaper.service';


// Boot background BullMQ worker
import { aiTasksWorker } from './src/queue/taskWorker';

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({
  verify: (req: any, res, buf) => {
    if (req.originalUrl.startsWith('/api/payment/webhook')) {
      req.rawBody = buf;
    }
  }
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// Stash Socket.io server globally so services and workers can broadcast events
(global as any).io = io;

// 1. Unprotected / Healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', environment: env.NODE_ENV, timestamp: new Date() });
});

// 1.2. Public Authentication Endpoints (Strict rate limiting)
app.post('/api/auth/signup', authRateLimiter, async (req: any, res: any) => {
  await signup(req, res);
});

app.post('/api/auth/login', authRateLimiter, async (req: any, res: any) => {
  await login(req, res);
});


// 1.5. REST API endpoint to retrieve the most recent active Goal and all of its AITasks
app.get('/api/goals/active', authMiddleware as any, async (req: any, res: any) => {
  try {
    const activeGoal = await dbService.client.userGoal.findFirst({
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
  } catch (error: any) {
    logger.error(error, '[Server Error] Failed to fetch active goal:');
    res.status(500).json({ error: 'Failed to fetch active goal.' });
  }
});

// 1.6. REST API endpoint to retrieve a specific Goal by ID and all of its AITasks
app.get('/api/goals/:goalId', authMiddleware as any, async (req: any, res: any) => {
  try {
    const goal = await dbService.client.userGoal.findUnique({
      where: { id: req.params.goalId },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
        }
      }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({
      status: 'OK',
      goal
    });
  } catch (error: any) {
    logger.error(error, `[Server Error] Failed to fetch goal details for ID ${req.params.goalId}:`);
    res.status(500).json({ error: 'Failed to fetch goal details.' });
  }
});

// 1.8. Plan generation REST route (bridges to Python Cognitive Planner)
app.post(
  '/api/goals/plan',
  apiRateLimiter,
  authMiddleware as any,
  async (req: any, res: any) => {
    await createGoalPlan(req, res);
  }
);

// 1.9. Plan approval REST route (shifts statuses to active and triggers BullMQ)
app.post(
  '/api/goals/:goalId/approve',
  apiRateLimiter,
  authMiddleware as any,
  async (req: any, res: any) => {
    await approveGoalPlan(req, res);
  }
);


// 1.12. Study Hub Chat Proxy with local n8n automation and fallback recovery
app.post('/api/study-hub/chat', apiRateLimiter, authMiddleware as any, async (req: any, res: any) => {
  const { message, sessionId, agent } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'Missing required fields: message and sessionId.' });
  }

  const agentType = agent || 'general';

  try {
    // 1. Persist User Message to chat_history table
    await dbService.client.chatHistory.create({
      data: {
        sessionId,
        senderType: 'user',
        agentType,
        message,
      },
    });

    // 2. Fetch/Proxy webhook request to local n8n workflow engine with timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s hard ceiling timeout

    let aiMessage = '';
    let responseOk = false;

    try {
      const n8nRes = await fetch(env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, agent: agentType }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (n8nRes.ok) {
        const data = await n8nRes.json() as any;
        aiMessage = data.output || data.response || 'No response returned from workflow.';
        responseOk = true;
      } else {
        logger.error(`[Orchestrator Gateway] n8n responded with status ${n8nRes.status}`);
        aiMessage = 'Failed to communicate with local automation workflows. n8n returned a server error.';
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      logger.error(fetchErr, '[Orchestrator Gateway] n8n fetch request failed or timed out:');
      aiMessage = 'Failed to communicate with local automation workflows. Connection timed out or n8n is offline.';
    }

    // 3. Persist AI Response (or Fallback System Error response) to PostgreSQL
    const savedAiMsg = await dbService.client.chatHistory.create({
      data: {
        sessionId,
        senderType: 'ai',
        agentType: responseOk ? agentType : 'system_error',
        message: aiMessage,
      },
    });

    res.json({
      status: 'OK',
      output: savedAiMsg.message,
      message: savedAiMsg,
    });
  } catch (error: any) {
    logger.error(error, '[Server Error] Failed to process Study Hub Chat proxy:');
    res.status(500).json({ error: 'Failed to process Study Hub chat request.' });
  }
});

// 1.13. Retrieve persistent chat logs filtered by sessionId and ordered chronologically
app.get('/api/study-hub/history/:sessionId', authMiddleware as any, async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    const chatLogs = await dbService.client.chatHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      status: 'OK',
      history: chatLogs,
    });
  } catch (error: any) {
    logger.error(error, `[Server Error] Failed to retrieve chat history for session ${req.params.sessionId}:`);
    res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
});

// 1.14. Stripe Payment Gateway & Webhooks Web portals
app.post('/api/payment/checkout', apiRateLimiter, authMiddleware as any, async (req: any, res: any) => {
  await createCheckoutSession(req, res);
});

app.post('/api/payment/webhook', async (req: any, res: any) => {
  await handleStripeWebhook(req, res);
});

app.get('/api/payment/subscription', authMiddleware as any, async (req: any, res: any) => {
  await getSubscriptionStatus(req, res);
});


// 2. Protected & Rate Limited Endpoint to enqueue tasks
// Mounts Redis-backed rate limiter and JWT authentication middleware
app.post(
  '/api/tasks',
  apiRateLimiter,
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { goalId, title, payload, dependencies } = req.body;

      if (!goalId || !title) {
        return res.status(400).json({ error: 'Missing required fields: goalId and title.' });
      }

      const task = await enqueueTask(goalId, title, payload, dependencies);
      res.status(201).json(task);
    } catch (error: any) {
      logger.error(error, '[Server Error] Failed to submit task:');
      res.status(500).json({ error: error.message || 'Failed to submit task.' });
    }
  }
);

// 3. WebSockets Real-time connection handling
io.on('connection', (socket) => {
  logger.info(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('hitl_response', (data: { goalId: string; approved: boolean }) => {
    logger.info(`[Socket.io] Received HITL response for goal ${data.goalId}: approved=${data.approved}`);
    const active = (global as any).activeProcesses?.get(data.goalId);
    if (active && active.child) {
      if (active.clearHitlTimeout) {
        active.clearHitlTimeout();
      }
      const answer = data.approved ? 'y\n' : 'n\n';
      active.child.stdin.write(answer);
      logger.info(`[Socket.io] Piped answer "${answer.trim()}" to C# standard input.`);
    } else {
      logger.warn(`[Socket.io] No active C# process found for goal ${data.goalId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// 4. Clean Startup & Database Connection
async function bootstrap() {
  try {
    // Connect to database and verify pgvector
    await dbService.initialize();

    // Start outbox publisher sweep loop
    OutboxPublisher.start(1000);

    // Start lease reaper recovery sweep loop
    LeaseReaperService.start(15000);

    // Connect to Redis Event Bus Pub/Sub
    await eventBusService.initialize();

    server.listen(env.PORT, () => {
      logger.info('==================================================');
      logger.info(`🚀 [Antigravity Core] Node.js AI Orchestrator running`);
      logger.info(`   Port: ${env.PORT}`);
      logger.info(`   Mode: ${env.NODE_ENV}`);
      logger.info('==================================================');
    });
  } catch (error) {
    logger.error(error, '[Bootstrap Error] Failed to launch Orchestrator server:');
    process.exit(1);
  }
}

// Handle termination signals for clean resource release
async function handleGracefulShutdown(signal: string) {
  logger.info(`[Shutdown] ${signal} signal received. Shutting down gracefully...`);
  
  try {
    // 1. Stop BullMQ worker from claiming new tasks
    logger.info('[Shutdown] Closing BullMQ tasks worker...');
    await aiTasksWorker.close();
    logger.info('[Shutdown] BullMQ tasks worker closed.');

    // 2. Stop sweep & reaper daemons
    OutboxPublisher.stop();
    LeaseReaperService.stop();

    // 3. Perform a final outbox flush to send pending events
    logger.info('[Shutdown] Performing final outbox flush sweep...');
    await OutboxPublisher.publishPendingEvents();
    logger.info('[Shutdown] Final outbox flush sweep completed.');

    // 4. Disconnect Redis and DB
    logger.info('[Shutdown] Disconnecting event bus and database...');
    await eventBusService.disconnect();
    await dbService.disconnect();

    // 5. Close Http Server
    server.close(() => {
      logger.info('[Shutdown] Http server closed.');
      process.exit(0);
    });
  } catch (error) {
    logger.error(error, '[Shutdown Error] Error during graceful shutdown:');
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));


bootstrap();
