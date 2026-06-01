import express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { env } from './src/config/env';
import { logger } from './src/config/logger';
import { dbService } from './src/services/db.service';
import { enqueueTask } from './src/queue/taskQueue';
import { authMiddleware } from './src/middlewares/auth.middleware';
import { apiRateLimiter } from './src/middlewares/rateLimiter.middleware';

// Boot background BullMQ worker
import './src/queue/taskWorker';

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

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

  socket.on('disconnect', () => {
    logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// 4. Clean Startup & Database Connection
async function bootstrap() {
  try {
    // Connect to database and verify pgvector
    await dbService.initialize();

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
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Shutting down gracefully...');
  await dbService.disconnect();
  server.close(() => {
    logger.info('Http server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Shutting down gracefully...');
  await dbService.disconnect();
  server.close(() => {
    logger.info('Http server closed.');
    process.exit(0);
  });
});

bootstrap();
