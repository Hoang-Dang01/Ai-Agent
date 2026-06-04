import * as dotenv from 'dotenv';
import * as path from 'path';
// Load .env variables before importing other local modules
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import { spawn, ChildProcess } from 'child_process';
import express from 'express';
import * as http from 'http';
import axios from 'axios';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { dbService } from '../services/db.service';
import { runTelemetryRetentionPruning } from '../jobs/telemetry-retention.job';
import { env } from '../config/env';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${GREEN}✔ PASS:${RESET} ${message}`);
  } else {
    console.error(`${RED}✘ FAIL:${RESET} ${message}`);
    failedTests++;
  }
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServerToBeReady(port: number, maxAttempts = 30): Promise<boolean> {
  console.log(`${YELLOW}[SETUP] Waiting for Orchestrator to respond on port ${port}...${RESET}`);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await axios.get(`http://localhost:${port}/health`, { timeout: 1000 });
      if (res.status === 200) {
        console.log(`${GREEN}[SETUP] Orchestrator is ready after ${i * 500}ms!${RESET}`);
        return true;
      }
    } catch (err) {
      // retry
    }
    await delay(500);
  }
  throw new Error(`Orchestrator server on port ${port} did not boot up in time.`);
}

// 1. Mock Python Backend supporting Failure Injection
let mockResponseStatusCode = 200;
let mockResponseDelayMs = 0;

function startMockPythonBackend(port: number): http.Server {
  const app = express();
  app.use(express.json());

  app.post('/api/plan/generate', async (req, res) => {
    if (mockResponseDelayMs > 0) {
      await delay(mockResponseDelayMs);
    }

    if (mockResponseStatusCode === 429) {
      return res.status(429).json({ detail: '429 Rate Limit Exceeded' });
    }
    
    if (mockResponseStatusCode === 500) {
      return res.status(500).json({ detail: 'Internal Provider Error' });
    }

    // Default Success
    res.json({
      graph: {
        goal: req.body.goal || 'Failsafe Testing',
        tasks: [{ id: 'task_0', title: 'Failsafe Task', toolName: 'ReadWindowTool', args: {}, dependencies: [] }]
      },
      telemetry: {
        traceId: 'chaos-trace-id',
        spanId: 'chaos-span-id',
        model: 'gemini-1.5-flash',
        promptText: 'Chaos prompt',
        responseText: 'Chaos response',
        inputTokens: 100,
        outputTokens: 100,
        latencyMs: 150,
        status: 'SUCCESS'
      }
    });
  });

  return app.listen(port);
}

async function runFailureTests() {
  console.log(`\n==================================================`);
  console.log(`🧪 STARTING AUTOMATED FAILURE INJECTION SUITE (PHASE G3)`);
  
  // Configure environment variables for this test runner process
  process.env.BACKEND_AI_URL = 'http://localhost:3004';
  process.env.ENABLE_PROMPT_ARCHIVE = 'true';
  console.log(`==================================================\n`);

  let mockPythonServer: http.Server | null = null;
  let orchestratorProcess: ChildProcess | null = null;
  const emergencyLogPath = path.join(__dirname, '../../logs/emergency-telemetry.log');

  try {
    // 0. Setup clean database
    await dbService.initialize();
    await dbService.client.aITelemetryTrace.deleteMany();
    await dbService.client.userGoal.deleteMany();
    
    const testUser = await dbService.client.user.create({
      data: {
        email: `chaos_user_${Date.now()}@chaos.ai`,
        password: 'chaospassword'
      }
    });
    const token = jwt.sign({ userId: testUser.id, email: testUser.email }, env.JWT_SECRET, { expiresIn: '1h' });

    // Clean old emergency log files if any
    if (fs.existsSync(emergencyLogPath)) {
      fs.unlinkSync(emergencyLogPath);
    }

    // 1. Launch Mock Python server on port 3004
    mockPythonServer = startMockPythonBackend(3004);

    // 2. Launch Orchestrator Test Server on port 3003
    orchestratorProcess = spawn('node', ['-r', 'ts-node/register', 'server.ts'], {
      env: {
        ...process.env,
        PORT: '3003',
        BACKEND_AI_URL: 'http://localhost:3004',
        REDIS_URL: 'redis://127.0.0.1:6379',
        NODE_ENV: 'test'
      },
      stdio: 'pipe'
    });

    orchestratorProcess.stdout?.on('data', (data) => {
      console.log(`[Orchestrator-3003] ${data.toString().trim()}`);
    });
    orchestratorProcess.stderr?.on('data', (data) => {
      console.error(`[Orchestrator-3003 ERR] ${data.toString().trim()}`);
    });

    // Wait for server to start listening
    await waitForServerToBeReady(3003);

    // ----------------------------------------------------
    // CASE 1: Postgres Database Connection Outage & Emergency Logging Fallback
    // ----------------------------------------------------
    console.log(`${YELLOW}[CASE 1] Postgres Database Outage Simulation (Observability of Observability)${RESET}`);
    
    // Temporarily mock dbService client throw error on create to simulate database death
    const originalCreate = dbService.client.aITelemetryTrace.create;
    dbService.client.aITelemetryTrace.create = () => {
      throw new Error('DatabaseConnectionException: Connection pool timed out.');
    };

    // We can test this by running the controller code directly or mocking the server.
    // In our orchestrator server.ts, createGoalPlan imports its own dbService instance. 
    // To make sure it fails database-wise, we can trigger the HTTP endpoint on server 3003. 
    // But since server 3003 is spawned in a separate process, mocking our local dbService won't affect it.
    // Therefore, we can simulate the DB death directly inside our local process to test the controller logic,
    // OR we can test that the local fallback function handles the crash cleanly.
    // Let's call the controller function logic directly in our test process or verify the log file generation.
    // We can require/import the goal controller logic into our local process and run it directly!
    // That is extremely direct and covers the exact logic in goal.controller.ts.
    
    const mockReq: any = {
      body: { goal: 'Test database offline emergency logging' },
      headers: { 'x-request-id': 'stress-correlation-id' },
      user: { id: testUser.id }
    };
    
    const mockRes: any = {
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.body = data;
        return this;
      },
      statusCode: 200,
      body: null
    };

    const { createGoalPlan } = require('../controllers/goal.controller');
    
    // Call controller directly. It will call axios to Python backend, fetch plan, and fail on writing telemetry.
    await createGoalPlan(mockReq, mockRes);

    // Restore database client original function
    dbService.client.aITelemetryTrace.create = originalCreate;

    assert(mockRes.statusCode === 201, 'Main request successfully returns 201 OK (failsafe fallback).');
    assert(fs.existsSync(emergencyLogPath) === true, 'Emergency log file was successfully created.');

    const logContent = fs.readFileSync(emergencyLogPath, 'utf8');
    assert(logContent.includes('DatabaseConnectionException'), 'Emergency log successfully saved the database connection error.');
    assert(logContent.includes('Test database offline emergency logging'), 'Emergency log contains the prompt goal description.');
    
    // ----------------------------------------------------
    // CASE 2: AI Backend 429 Rate Limit Fallback
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[CASE 2] AI Provider 429 Rate Limit Outage Fallback${RESET}`);
    
    // Set Mock Python backend to return 429
    mockResponseStatusCode = 429;

    const res429 = await axios.post(
      'http://localhost:3003/api/goals/plan',
      { goal: 'Query something under rate limit' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    assert(res429.status === 201, 'Request returns 201 OK using rule-based offline planner fallback.');
    
    // Check trace created in DB
    const traces429 = await dbService.client.aITelemetryTrace.findMany({
      where: { errorType: 'RATE_LIMIT' }
    });
    
    assert(traces429.length >= 1, 'Telemetry trace registered successfully with errorType RATE_LIMIT.');
    assert(traces429[0].status === 'FAILED', 'Trace status marked as FAILED.');
    assert(traces429[0].errorMessage!.includes('429'), 'Telemetry captures raw status message detail.');

    // ----------------------------------------------------
    // CASE 3: Idempotent Retention Recovery Simulation
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[CASE 3] Idempotent Retention Recovery Simulation${RESET}`);

    // Call retention pruning multiple times consecutively to ensure no double deletes or lock issues
    console.log('   Executing telemetry retention pruning job... (Run 1)');
    const prune1 = await runTelemetryRetentionPruning();
    
    console.log('   Executing telemetry retention pruning job... (Run 2)');
    const prune2 = await runTelemetryRetentionPruning();
    
    assert(prune1.deletedSuccessCount === 0 && prune2.deletedSuccessCount === 0, 'Retention job executed twice consecutively without throwing database errors.');

    // Clean up
    console.log(`\n${YELLOW}🧹 Cleaning up mock test records from Database...${RESET}`);
    await dbService.client.aITelemetryTrace.deleteMany();
    await dbService.client.userGoal.deleteMany();
    await dbService.client.user.delete({ where: { id: testUser.id } });
    
    if (fs.existsSync(emergencyLogPath)) {
      fs.unlinkSync(emergencyLogPath);
    }
    console.log(`${GREEN}✔ Test records cleaned successfully.${RESET}`);

  } catch (error: any) {
    console.error(`\n${RED}💥 Critical failure test execution crash: ${error.message}${RESET}`);
    console.error(error);
    failedTests++;
  } finally {
    // Shutdown servers
    console.log(`\n${YELLOW}[CLEANUP] Stopping Mock Servers...${RESET}`);
    if (mockPythonServer) {
      mockPythonServer.close();
      console.log('   Mock Python Backend stopped.');
    }
    if (orchestratorProcess) {
      orchestratorProcess.kill();
      if (orchestratorProcess.pid) {
        try {
          process.kill(-orchestratorProcess.pid);
        } catch {}
      }
      console.log('   Orchestrator Test Server stopped.');
    }
    
    await dbService.disconnect();
  }

  // ----------------------------------------------------
  // TEST SUITE REPORT
  // ----------------------------------------------------
  console.log(`\n==================================================`);
  console.log(`📊 FINAL FAILURE INJECTION TESTING REPORT`);
  console.log(`==================================================`);
  if (failedTests === 0) {
    console.log(`${GREEN}★ ALL FAILURE INJECTION CHAOS TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
    process.exit(0);
  } else {
    console.log(`${RED}🚨 FAILURE INJECTION TESTS FAILED WITH ${failedTests} FAILURE(S)${RESET}`);
    process.exit(1);
  }
}

runFailureTests();
