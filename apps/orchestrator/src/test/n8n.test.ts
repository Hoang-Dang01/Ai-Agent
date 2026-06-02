import { dbService } from '../services/db.service';
import { env } from '../config/env';

// Simple colored console assertions
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

// Custom request mock for express endpoint testing
function mockResponse() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
}

// Controller logic extraction to test proxy flow in isolation
async function simulateChatProxy(message: string, sessionId: string, agent: string) {
  const agentType = agent || 'general';

  // 1. Persist User Message
  await dbService.client.chatHistory.create({
    data: {
      sessionId,
      senderType: 'user',
      agentType,
      message,
    },
  });

  // 2. Fetch/Proxy webhook request to n8n
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      aiMessage = 'Failed to communicate with local automation workflows. n8n returned a server error.';
    }
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    aiMessage = 'Failed to communicate with local automation workflows. Connection timed out or n8n is offline.';
  }

  // 3. Persist AI Response
  const savedAiMsg = await dbService.client.chatHistory.create({
    data: {
      sessionId,
      senderType: 'ai',
      agentType: responseOk ? agentType : 'system_error',
      message: aiMessage,
    },
  });

  return savedAiMsg;
}

async function runTests() {
  console.log(`\n==================================================`);
  console.log(`🧪 STARTING AUTOMATED n8n WORKFLOW INTEGRATION SUITE`);
  console.log(`==================================================\n`);

  // Stash original global fetch to guarantee clean recoveries
  const originalFetch = global.fetch;

  try {
    // 1. Setup DB Connection
    await dbService.initialize();
    console.log(`${YELLOW}⚡ Database connection initialized.${RESET}\n`);

    const testSessionId = `test_session_${Date.now()}`;
    const testMessage = 'Hello Code Mentor, check my HTML index files.';

    // ----------------------------------------------------
    // TEST 1: Successful n8n Chat Webhook Proxying
    // ----------------------------------------------------
    console.log(`${YELLOW}[TEST AREA 1] n8n Webhook Success Path & DB Logging${RESET}`);

    // Set fetch stub for success path
    global.fetch = async (url: any, options: any) => {
      if (typeof url === 'string' && url.includes('/webhook/chat')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ output: 'Welcome to Vibe Agent ecosystem. Your script is running.' }),
        } as any;
      }
      return originalFetch(url, options);
    };

    try {
      const result = await simulateChatProxy(testMessage, testSessionId, 'code_mentor');
      
      assert(!!result, 'Proxy returns a valid saved message object');
      assert(result.senderType === 'ai', 'Proxy output sender is AI');
      assert(result.agentType === 'code_mentor', 'Proxy output preserves correct agent designation');
      assert(result.message === 'Welcome to Vibe Agent ecosystem. Your script is running.', 'Proxy returns correct mocked workflow text');

      // Check DB values sequence
      const dbLogs = await dbService.client.chatHistory.findMany({
        where: { sessionId: testSessionId },
        orderBy: { createdAt: 'asc' },
      });

      assert(dbLogs.length === 2, 'Successful proxy inserts exactly 2 records (user query + AI answer)');
      assert(dbLogs[0].senderType === 'user' && dbLogs[0].message === testMessage, 'First logged record maps to User query');
      assert(dbLogs[1].senderType === 'ai' && dbLogs[1].message.includes('Vibe Agent'), 'Second logged record maps to AI answer');

    } finally {
      // Restore fetch right after test case executes
      global.fetch = originalFetch;
    }

    // ----------------------------------------------------
    // TEST 2: Hardened n8n Timeout / Connection Offline Fallback
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[TEST AREA 2] n8n Timeout & Offline Connection Failures${RESET}`);

    const failedSessionId = `failed_session_${Date.now()}`;

    // Set fetch stub to throw a mock TypeError (simulating host unreachable/offline)
    global.fetch = async (url: any, options: any) => {
      if (typeof url === 'string' && url.includes('/webhook/chat')) {
        throw new TypeError('fetch failed (connection refused)');
      }
      return originalFetch(url, options);
    };

    try {
      const result = await simulateChatProxy(testMessage, failedSessionId, 'analytics_expert');

      assert(!!result, 'Timeout proxy returns valid saved fallback message');
      assert(result.senderType === 'ai', 'Fallback message sender is AI');
      assert(result.agentType === 'system_error', 'Fallback maps to agentType "system_error" for visualization');
      assert(result.message.includes('Connection timed out or n8n is offline'), 'Fallback returns descriptive offline warning');

      // Verify DB sequence is preserved
      const dbLogs = await dbService.client.chatHistory.findMany({
        where: { sessionId: failedSessionId },
        orderBy: { createdAt: 'asc' },
      });

      assert(dbLogs.length === 2, 'Failed proxy preserves database layout (User query still persisted successfully)');
      assert(dbLogs[0].senderType === 'user', 'First record is preserved user query');
      assert(dbLogs[1].senderType === 'ai' && dbLogs[1].agentType === 'system_error', 'Second record is fallback system error description');

    } finally {
      // Guarantee fetch restore
      global.fetch = originalFetch;
    }

    // ----------------------------------------------------
    // TEST 3: History Ordering & Retrievals
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[TEST AREA 3] Historical logs sorting and integrity${RESET}`);

    const historySessionId = `history_session_${Date.now()}`;

    // Bulk write mock sessions directly to database
    await dbService.client.chatHistory.create({
      data: { sessionId: historySessionId, senderType: 'user', message: 'First message', createdAt: new Date(Date.now() - 2000) }
    });
    await dbService.client.chatHistory.create({
      data: { sessionId: historySessionId, senderType: 'ai', message: 'Second message', createdAt: new Date(Date.now() - 1000) }
    });
    await dbService.client.chatHistory.create({
      data: { sessionId: historySessionId, senderType: 'user', message: 'Third message', createdAt: new Date() }
    });

    const historicalLogs = await dbService.client.chatHistory.findMany({
      where: { sessionId: historySessionId },
      orderBy: { createdAt: 'asc' },
    });

    assert(historicalLogs.length === 3, 'Retrieves correct count of logged messages');
    assert(historicalLogs[0].message === 'First message', 'First index maps to oldest log');
    assert(historicalLogs[1].message === 'Second message', 'Second index maps to middle log');
    assert(historicalLogs[2].message === 'Third message', 'Third index maps to latest log');

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log(`\n${YELLOW}🧹 Initiating database cleanup...${RESET}`);
    await dbService.client.chatHistory.deleteMany({
      where: {
        sessionId: {
          in: [testSessionId, failedSessionId, historySessionId]
        }
      }
    });
    console.log(`${GREEN}✔ Cleanup finished. Removed mock chat logs.${RESET}`);

    // Disconnect
    await dbService.disconnect();

  } catch (error: any) {
    console.error(`\n${RED}💥 Critical test execution crash: ${error.message}${RESET}`);
    console.error(error);
    failedTests++;
  } finally {
    // Ultimate safety cleanup to avoid any possibility of test pollution
    global.fetch = originalFetch;
  }

  // ----------------------------------------------------
  // TEST SUITE REPORT
  // ----------------------------------------------------
  console.log(`\n==================================================`);
  console.log(`📊 FINAL TEST REPORT`);
  console.log(`==================================================`);
  if (failedTests === 0) {
    console.log(`${GREEN}★ ALL TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
    process.exit(0);
  } else {
    console.log(`${RED}🚨 TEST SUITE COMPLETED WITH FAILURES (${failedTests} failures)${RESET}`);
    process.exit(1);
  }
}

runTests();
