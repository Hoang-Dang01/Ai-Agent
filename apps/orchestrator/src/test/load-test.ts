import * as dotenv from 'dotenv';
import * as path from 'path';
// Load .env variables before importing other local modules
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import { spawn, ChildProcess } from 'child_process';
import express from 'express';
import * as http from 'http';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { dbService } from '../services/db.service';
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

// 1. Mock Python Backend Server to avoid calling real LLM and speed up stress testing
function startMockPythonBackend(port: number): http.Server {
  const app = express();
  app.use(express.json());

  app.post('/api/plan/generate', (req, res) => {
    // Generate a random simulated latency between 50ms and 950ms
    const randomLatency = Math.floor(Math.random() * 900) + 50;
    
    const traceId = (req.headers['x-trace-id'] as string) || 'mock-trace-id';
    const spanId = (req.headers['x-span-id'] as string) || 'mock-span-id';
    const parentSpanId = (req.headers['x-parent-span-id'] as string) || null;

    res.json({
      graph: {
        goal: req.body.goal || 'Stress Testing',
        tasks: [
          {
            id: 'task_0',
            title: 'Mock Load Task',
            toolName: 'ReadWindowTool',
            args: {},
            dependencies: []
          }
        ]
      },
      telemetry: {
        traceId,
        spanId,
        parentSpanId,
        model: 'gemini-1.5-flash',
        promptText: `Mock prompt for goal: ${req.body.goal}`,
        responseText: '{"tasks":[{"id":"task_0","title":"Mock Load Task"}]}',
        inputTokens: 120,
        outputTokens: 240,
        latencyMs: randomLatency,
        status: 'SUCCESS'
      }
    });
  });

  const server = app.listen(port);
  return server;
}

async function runLoadTests() {
  console.log(`\n==================================================`);
  console.log(`🧪 STARTING AUTOMATED CONCURRENT LOAD STRESS SUITE (PHASE G2)`);
  console.log(`==================================================\n`);

  let mockPythonServer: http.Server | null = null;
  let orchestratorProcess: ChildProcess | null = null;

  try {
    // 0. Clean DB state
    await dbService.initialize();
    await dbService.client.aITelemetryTrace.deleteMany();
    await dbService.client.userGoal.deleteMany();
    
    // Create test user and token
    const testUser = await dbService.client.user.create({
      data: {
        email: `stress_user_${Date.now()}@stress.ai`,
        password: 'stresspassword'
      }
    });
    
    const token = jwt.sign({ userId: testUser.id, email: testUser.email }, env.JWT_SECRET, { expiresIn: '1h' });

    // 1. Launch Mock Python server on port 3004
    console.log(`${YELLOW}[SETUP] Starting Mock Python Backend Server on port 3004...${RESET}`);
    mockPythonServer = startMockPythonBackend(3004);

    // 2. Launch Orchestrator under test on port 3003
    console.log(`${YELLOW}[SETUP] Spawning Orchestrator Test Server on port 3003...${RESET}`);
    orchestratorProcess = spawn('node', ['-r', 'ts-node/register', 'server.ts'], {
      env: {
        ...process.env,
        PORT: '3003',
        BACKEND_AI_URL: 'http://localhost:3004',
        REDIS_URL: 'redis://127.0.0.1:6379',
        NODE_ENV: 'test',
        ENABLE_PROMPT_ARCHIVE: 'true'
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

    // 3. Fire 50 concurrent plan requests via Promise.all
    console.log(`\n${YELLOW}[TEST AREA 1] Stressing /api/goals/plan with 50 concurrent inserts...${RESET}`);
    const stressRequests = Array.from({ length: 50 }, (_, i) => {
      return axios.post(
        'http://localhost:3003/api/goals/plan',
        { goal: `Concurrent stress test goal number ${i}` },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      ).then(res => res.status)
       .catch(err => {
         console.error(`Request ${i} failed: ${err.message}`);
         return 500;
       });
    });

    const startMs = Date.now();
    const statuses = await Promise.all(stressRequests);
    const endMs = Date.now();

    const successCount = statuses.filter(s => s === 210 || s === 201).length;
    const failCount = statuses.filter(s => s !== 210 && s !== 201).length;

    console.log(`   Stress test finished in ${endMs - startMs}ms.`);
    assert(successCount === 50, `Successfully processed exactly 50 concurrent requests. Got: ${successCount}`);
    assert(failCount === 0, `Exactly 0 concurrent requests failed.`);

    // 4. Query statistics endpoint to verify calculations (percentiles, sums, counts)
    console.log(`\n${YELLOW}[TEST AREA 2] Verifying Telemetry statistics accuracy under stress...${RESET}`);
    const statsRes = await axios.get('http://localhost:3003/api/telemetry/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const stats = statsRes.data.stats;
    assert(stats.totalTraces === 50, `Telemetry stats recorded exactly 50 traces. Got: ${stats.totalTraces}`);
    assert(stats.successTraces === 50, 'All 50 traces mapped as SUCCESS.');
    assert(stats.inputTokens === 50 * 120, `Input token sum is mathematically correct: ${stats.inputTokens} (Expected: ${50 * 120})`);
    assert(stats.outputTokens === 50 * 240, `Output token sum is mathematically correct: ${stats.outputTokens} (Expected: ${50 * 240})`);
    
    // Verify percentiles are present and logical
    assert(stats.latencyPercentiles.p50 > 0, `P50 latency calculated: ${stats.latencyPercentiles.p50}ms`);
    assert(stats.latencyPercentiles.p95 >= stats.latencyPercentiles.p50, `P95 latency (${stats.latencyPercentiles.p95}ms) >= P50 latency`);
    assert(stats.latencyPercentiles.p99 >= stats.latencyPercentiles.p95, `P99 latency (${stats.latencyPercentiles.p99}ms) >= P95 latency`);

    // Clean up test data from DB
    console.log(`\n${YELLOW}🧹 Cleaning up mock test records from Database...${RESET}`);
    await dbService.client.aITelemetryTrace.deleteMany();
    await dbService.client.userGoal.deleteMany();
    await dbService.client.user.delete({ where: { id: testUser.id } });
    console.log(`${GREEN}✔ Test records cascade deleted successfully.${RESET}`);

  } catch (error: any) {
    console.error(`\n${RED}💥 Critical load test execution crash: ${error.message}${RESET}`);
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
      // On Windows, sometimes spawn with shell: true leaves child hanging. Force kill if needed.
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
  console.log(`📊 FINAL CONCURRENT LOAD TESTING REPORT`);
  console.log(`==================================================`);
  if (failedTests === 0) {
    console.log(`${GREEN}★ ALL CONCURRENT LOAD TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
    process.exit(0);
  } else {
    console.log(`${RED}🚨 LOAD TESTS FAILED WITH ${failedTests} FAILURE(S)${RESET}`);
    process.exit(1);
  }
}

runLoadTests();
