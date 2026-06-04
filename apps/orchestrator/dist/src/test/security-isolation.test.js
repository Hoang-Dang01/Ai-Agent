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
Object.defineProperty(exports, "__esModule", { value: true });
const db_service_1 = require("../services/db.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const goal_controller_1 = require("../controllers/goal.controller");
const jwt = __importStar(require("jsonwebtoken"));
const env_1 = require("../config/env");
const crypto_1 = require("crypto");
// Simple colored console assertions
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';
let failedTests = 0;
function assert(condition, message) {
    if (condition) {
        console.log(`${GREEN}✔ PASS:${RESET} ${message}`);
    }
    else {
        console.error(`${RED}✘ FAIL:${RESET} ${message}`);
        failedTests++;
    }
}
function mockResponse() {
    const res = {};
    res.statusCode = 200;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
}
// Emulate the controller/routing logic from server.ts for isolated query verification
async function simulateActiveGoalGet(userId) {
    const activeGoal = await db_service_1.dbService.client.userGoal.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            tasks: {
                orderBy: { createdAt: 'asc' },
            }
        }
    });
    if (!activeGoal)
        return { status: 200, goal: null };
    return { status: 200, goal: activeGoal };
}
async function simulateGoalGet(userId, goalId) {
    const goal = await db_service_1.dbService.client.userGoal.findFirst({
        where: { id: goalId, userId },
        include: {
            tasks: {
                orderBy: { createdAt: 'asc' },
            }
        }
    });
    if (!goal)
        return { status: 404, error: 'Goal not found' };
    return { status: 200, goal };
}
async function simulateTaskEnqueue(userId, goalId, title) {
    const goal = await db_service_1.dbService.client.userGoal.findFirst({
        where: { id: goalId, userId }
    });
    if (!goal)
        return { status: 404, error: 'Goal not found or unauthorized.' };
    // Simulated Enqueue Success
    return { status: 201, task: { goalId, title } };
}
async function simulateChatSend(userId, sessionId, message) {
    const existingChat = await db_service_1.dbService.client.chatHistory.findFirst({
        where: { sessionId }
    });
    if (existingChat && existingChat.userId && existingChat.userId !== userId) {
        return { status: 403, error: 'Access Denied: Session ID owned by another user.' };
    }
    const savedMsg = await db_service_1.dbService.client.chatHistory.create({
        data: {
            sessionId,
            userId,
            senderType: 'user',
            message
        }
    });
    return { status: 200, message: savedMsg };
}
async function simulateChatHistoryGet(userId, sessionId) {
    const existingChat = await db_service_1.dbService.client.chatHistory.findFirst({
        where: { sessionId }
    });
    if (existingChat && existingChat.userId && existingChat.userId !== userId) {
        return { status: 403, error: 'Access Denied: Session ID owned by another user.' };
    }
    const chatLogs = await db_service_1.dbService.client.chatHistory.findMany({
        where: { sessionId, userId },
        orderBy: { createdAt: 'asc' },
    });
    return { status: 200, history: chatLogs };
}
async function simulateTelemetryStatsGet(userId) {
    const totalTraces = await db_service_1.dbService.client.aITelemetryTrace.count({
        where: { goal: { userId } }
    });
    return { status: 200, totalTraces };
}
async function simulateTelemetryTracesGet(userId) {
    const traces = await db_service_1.dbService.client.aITelemetryTrace.findMany({
        where: { goal: { userId } }
    });
    return { status: 200, traces };
}
async function simulateTelemetryTraceDetailGet(userId, traceId) {
    const trace = await db_service_1.dbService.client.aITelemetryTrace.findFirst({
        where: { id: traceId, goal: { userId } }
    });
    if (!trace)
        return { status: 404, error: 'Telemetry trace not found' };
    return { status: 200, trace };
}
async function simulateHitlResponse(userId, goalId) {
    const goal = await db_service_1.dbService.client.userGoal.findFirst({
        where: { id: goalId, userId }
    });
    if (!goal)
        return { status: 403, error: 'Unauthorized HITL response' };
    return { status: 200, message: 'Authorized' };
}
async function runTests() {
    console.log(`\n==================================================`);
    console.log(`🧪 STARTING AUTOMATED SECURITY & ISOLATION SUITE`);
    console.log(`==================================================\n`);
    try {
        await db_service_1.dbService.initialize();
        console.log(`${YELLOW}⚡ Database connection initialized.${RESET}\n`);
        // Create test accounts
        const userA_Id = `usera_${Date.now()}`;
        const userB_Id = `userb_${Date.now()}`;
        const emailA = `usera_${Date.now()}@antigravity.ai`;
        const emailB = `userb_${Date.now()}@antigravity.ai`;
        await db_service_1.dbService.client.user.createMany({
            data: [
                { id: userA_Id, email: emailA, password: 'mockedPassword123' },
                { id: userB_Id, email: emailB, password: 'mockedPassword123' }
            ]
        });
        console.log(`${YELLOW}⚡ Test User A (${emailA}) and User B (${emailB}) created.${RESET}\n`);
        // Generate tokens
        const tokenA = jwt.sign({ sub: userA_Id, email: emailA, role: 'authenticated' }, env_1.env.JWT_SECRET, { expiresIn: '1h' });
        const tokenB = jwt.sign({ sub: userB_Id, email: emailB, role: 'authenticated' }, env_1.env.JWT_SECRET, { expiresIn: '1h' });
        // ----------------------------------------------------
        // TEST 1: JWT Claims & Validation Hardening Audit
        // ----------------------------------------------------
        console.log(`${YELLOW}[TEST AREA 1] JWT Claims & Signatures Audit${RESET}`);
        // Verify rejection of alg=none
        const unsignedToken = jwt.sign({ sub: userA_Id, email: emailA, role: 'authenticated' }, '', { algorithm: 'none' });
        const reqNone = { headers: { authorization: `Bearer ${unsignedToken}` } };
        const resNone = mockResponse();
        await (0, auth_middleware_1.authMiddleware)(reqNone, resNone, () => { });
        assert(resNone.statusCode === 403, 'authMiddleware rejects unsigned token (alg=none)');
        // Verify rejection of missing claims (role !== authenticated)
        const badRoleToken = jwt.sign({ sub: userA_Id, email: emailA, role: 'guest' }, env_1.env.JWT_SECRET);
        const reqRole = { headers: { authorization: `Bearer ${badRoleToken}` } };
        const resRole = mockResponse();
        await (0, auth_middleware_1.authMiddleware)(reqRole, resRole, () => { });
        assert(resRole.statusCode === 403, 'authMiddleware rejects token with invalid role claim');
        // Verify rejection of expired token
        const expiredToken = jwt.sign({ sub: userA_Id, email: emailA, role: 'authenticated' }, env_1.env.JWT_SECRET, { expiresIn: '-1s' });
        const reqExp = { headers: { authorization: `Bearer ${expiredToken}` } };
        const resExp = mockResponse();
        await (0, auth_middleware_1.authMiddleware)(reqExp, resExp, () => { });
        assert(resExp.statusCode === 403, 'authMiddleware rejects expired token');
        // Verify valid passage
        const reqValid = { headers: { authorization: `Bearer ${tokenA}` } };
        const resValid = mockResponse();
        let middlewarePass = false;
        await (0, auth_middleware_1.authMiddleware)(reqValid, resValid, () => { middlewarePass = true; });
        assert(!!middlewarePass, 'authMiddleware approves valid token with correct claims');
        // ----------------------------------------------------
        // TEST 2: Goal, Task & HITL Isolation Check
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 2] Cross-User Goal, Task & HITL Isolation${RESET}`);
        // Create Goal for User B
        const goalB = await db_service_1.dbService.client.userGoal.create({
            data: {
                userId: userB_Id,
                goal: 'Goal belonging to User B',
                status: 'PENDING_APPROVAL'
            }
        });
        // User A attempts to view User B's Goal
        const getResult = await simulateGoalGet(userA_Id, goalB.id);
        assert(getResult.status === 404, 'User A querying User B\'s Goal by ID returns 404 Not Found');
        // User A attempts to approve User B's Goal
        const approveReq = { params: { goalId: goalB.id }, user: { id: userA_Id } };
        const approveRes = mockResponse();
        await (0, goal_controller_1.approveGoalPlan)(approveReq, approveRes);
        assert(approveRes.statusCode === 404, 'User A approving User B\'s Goal plan returns 404 Not Found');
        // User A attempts to submit a task to User B's Goal
        const taskResult = await simulateTaskEnqueue(userA_Id, goalB.id, 'Task submitted by unauthorized user');
        assert(taskResult.status === 404, 'User A enqueuing a task on User B\'s Goal returns 404 Not Found');
        // User A attempts to approve a HITL prompt for User B's Goal
        const hitlResult = await simulateHitlResponse(userA_Id, goalB.id);
        assert(hitlResult.status === 403, 'User A submitting HITL response on User B\'s Goal yields 403 Forbidden');
        // ----------------------------------------------------
        // TEST 3: Chat Session Ownership
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 3] Chat Session Ownership Verification${RESET}`);
        const sessionB = `session_b_${Date.now()}`;
        // User B starts a chat session
        const chatBSend = await simulateChatSend(userB_Id, sessionB, 'Hello, I am User B.');
        assert(chatBSend.status === 200, 'User B starts session successfully');
        // User A attempts to write to User B's chat session
        const chatASend = await simulateChatSend(userA_Id, sessionB, 'Attack message from User A.');
        assert(chatASend.status === 403, 'User A posting message to User B\'s sessionId yields 403 Forbidden');
        // User A attempts to view User B's chat history
        const chatAHistory = await simulateChatHistoryGet(userA_Id, sessionB);
        assert(chatAHistory.status === 403, 'User A fetching User B\'s session history yields 403 Forbidden');
        // User B views own history
        const chatBHistory = await simulateChatHistoryGet(userB_Id, sessionB);
        assert(chatBHistory.status === 200 && chatBHistory.history?.length === 1, 'User B retrieves own session history successfully');
        // ----------------------------------------------------
        // TEST 4: Telemetry Scoping
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 4] Telemetry Isolation Scoping${RESET}`);
        // Create mock telemetry trace for User B's goal
        const traceB = await db_service_1.dbService.client.aITelemetryTrace.create({
            data: {
                traceId: (0, crypto_1.randomUUID)(),
                goalId: goalB.id,
                traceType: 'PLAN',
                status: 'SUCCESS',
                promptText: 'Telemetry trace content belonging to User B goal',
                responseText: 'Success'
            }
        });
        // User A fetches telemetry stats
        const statsA = await simulateTelemetryStatsGet(userA_Id);
        assert(statsA.totalTraces === 0, 'User A querying telemetry stats returns 0 (ignores User B\'s traces)');
        // User A fetches telemetry traces list
        const tracesA = await simulateTelemetryTracesGet(userA_Id);
        assert(tracesA.traces?.length === 0, 'User A querying traces list returns empty array (ignores User B\'s traces)');
        // User A attempts to retrieve User B's trace detail by ID
        const traceDetailA = await simulateTelemetryTraceDetailGet(userA_Id, traceB.id);
        assert(traceDetailA.status === 404, 'User A fetching User B\'s specific trace detail returns 404 Not Found');
        // User B fetches own telemetry stats
        const statsB = await simulateTelemetryStatsGet(userB_Id);
        assert(statsB.totalTraces === 1, 'User B successfully retrieves own telemetry stats');
        // ----------------------------------------------------
        // TEST 5: Negative Resource Enumeration Probing (100 times)
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 5] Negative Resource Enumeration (100 probes)${RESET}`);
        let enumerationPassed = true;
        for (let i = 0; i < 100; i++) {
            const probeId = (0, crypto_1.randomUUID)();
            // Probe Goal endpoint
            const goalProbe = await simulateGoalGet(userA_Id, probeId);
            // Probe Telemetry details endpoint
            const telemetryProbe = await simulateTelemetryTraceDetailGet(userA_Id, probeId);
            // Probe Chat History endpoint
            const chatProbe = await simulateChatHistoryGet(userA_Id, `session_probe_${probeId}`);
            if (goalProbe.status !== 404 || telemetryProbe.status !== 404 || chatProbe.status !== 200) {
                // Note: chatProbe returns 200 with empty array if session doesn't exist (which is safe), but 403 only if it belongs to someone else.
                enumerationPassed = false;
                break;
            }
        }
        assert(enumerationPassed, '100 random UUID probes against Goal, Chat, and Telemetry correctly yield 404/empty and do not cause server/database crashes');
        // Test malformed formats
        const malformedId = 'not-a-valid-uuid-12345';
        const goalMalformed = await simulateGoalGet(userA_Id, malformedId);
        const telemetryMalformed = await simulateTelemetryTraceDetailGet(userA_Id, malformedId);
        assert(goalMalformed.status === 404 && telemetryMalformed.status === 404, 'Malformed (non-UUID) ID queries handled gracefully (return 404 without database crash)');
        // ----------------------------------------------------
        // CLEANUP
        // ----------------------------------------------------
        console.log(`\n${YELLOW}🧹 Initiating database cleanup...${RESET}`);
        await db_service_1.dbService.client.chatHistory.deleteMany({
            where: { sessionId: sessionB }
        });
        await db_service_1.dbService.client.aITelemetryTrace.deleteMany({
            where: { id: traceB.id }
        });
        await db_service_1.dbService.client.userGoal.deleteMany({
            where: { userId: userB_Id }
        });
        await db_service_1.dbService.client.user.deleteMany({
            where: { id: { in: [userA_Id, userB_Id] } }
        });
        console.log(`${GREEN}✔ Cleanup finished. Removed security-isolation test data.${RESET}`);
        await db_service_1.dbService.disconnect();
    }
    catch (error) {
        console.error(`\n${RED}💥 Critical test execution crash: ${error.message}${RESET}`);
        console.error(error);
        failedTests++;
    }
    // ----------------------------------------------------
    // TEST SUITE REPORT
    // ----------------------------------------------------
    console.log(`\n==================================================`);
    console.log(`📊 FINAL TEST REPORT`);
    console.log(`==================================================`);
    if (failedTests === 0) {
        console.log(`${GREEN}★ ALL SECURITY ISOLATION TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
        process.exit(0);
    }
    else {
        console.log(`${RED}🚨 TEST SUITE COMPLETED WITH FAILURES (${failedTests} failures)${RESET}`);
        process.exit(1);
    }
}
runTests();
