"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_service_1 = require("../services/db.service");
const env_1 = require("../config/env");
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
// Controller logic extraction to test proxy flow in isolation
async function simulateChatProxy(message, sessionId, agent) {
    const agentType = agent || 'general';
    // 1. Persist User Message
    await db_service_1.dbService.client.chatHistory.create({
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
    }
    catch (fetchErr) {
        clearTimeout(timeoutId);
    }
    // Direct Fallback strictly for Study Hub Q&A route
    if (!responseOk) {
        try {
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
        }
        catch (fallbackErr) {
            aiMessage = 'Failed to communicate with RAG engine. Python service is offline or timed out.';
        }
    }
    // 3. Persist AI Response with relational citations
    const savedAiMsg = await db_service_1.dbService.client.chatHistory.create({
        data: {
            sessionId,
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
    return savedAiMsg;
}
async function runTests() {
    console.log(`\n==================================================`);
    console.log(`🧪 STARTING AUTOMATED RAG CITATIONS & FALLBACK TEST SUITE`);
    console.log(`==================================================\n`);
    const originalFetch = global.fetch;
    try {
        // 1. Setup DB Connection
        await db_service_1.dbService.initialize();
        console.log(`${YELLOW}⚡ Database connection initialized.${RESET}\n`);
        const testSessionId = `test_rag_session_${Date.now()}`;
        const testMessage = 'Explain how to reset ERP passwords.';
        // ----------------------------------------------------
        // TEST 1: n8n Success Path with Relational Citations
        // ----------------------------------------------------
        console.log(`${YELLOW}[TEST AREA 1] n8n Webhook Success Path & Relational DB Citations${RESET}`);
        global.fetch = async (url, options) => {
            if (typeof url === 'string' && url.includes('/webhook/chat')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        output: 'To reset ERP passwords, use the ERP portal.',
                        sources: [
                            { document_id: 'doc-111', title: 'ERP User Guide', similarity: 0.954 },
                            { document_id: 'doc-222', title: 'Security Handbook', similarity: 0.812 }
                        ]
                    }),
                };
            }
            return originalFetch(url, options);
        };
        try {
            const result = await simulateChatProxy(testMessage, testSessionId, 'analytics_expert');
            assert(!!result, 'Proxy returns valid saved message object');
            assert(result.senderType === 'ai', 'Proxy output sender is AI');
            assert(result.citations && result.citations.length === 2, 'Two citations are successfully returned in include object');
            // Verify database persistence in ChatCitation table
            const dbCitations = await db_service_1.dbService.client.chatCitation.findMany({
                where: { chatHistoryId: result.id },
                orderBy: { title: 'asc' }
            });
            assert(dbCitations.length === 2, 'Exactly 2 records persisted in chat_citations table');
            assert(dbCitations[0].title === 'ERP User Guide' && dbCitations[0].similarity === 0.954, 'First citation title and similarity score correctly mapped');
            assert(dbCitations[1].title === 'Security Handbook' && dbCitations[1].similarity === 0.812, 'Second citation title and similarity score correctly mapped');
            // Verify that documentId is correctly saved
            assert(dbCitations[0].documentId === 'doc-111', 'documentId mapped correctly');
        }
        finally {
            global.fetch = originalFetch;
        }
        // ----------------------------------------------------
        // TEST 2: Scoped Direct Fallback to Python AI Backend
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 2] Scoped Direct Fallback to Python RAG Chat${RESET}`);
        const fallbackSessionId = `test_fallback_session_${Date.now()}`;
        // Mock n8n fetch to fail, and mock python AI engine fetch to succeed
        global.fetch = async (url, options) => {
            if (typeof url === 'string' && url.includes('/webhook/chat')) {
                throw new Error('n8n offline');
            }
            if (typeof url === 'string' && url.includes('/api/rag/chat/')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        response: 'Direct Python RAG response: ERP instructions.',
                        sources: [
                            { document_id: 'doc-333', title: 'Fallback Manual', similarity: 0.887 }
                        ]
                    }),
                };
            }
            return originalFetch(url, options);
        };
        try {
            const result = await simulateChatProxy(testMessage, fallbackSessionId, 'analytics_expert');
            assert(!!result, 'Fallback proxy returns a valid saved message object');
            assert(result.message === 'Direct Python RAG response: ERP instructions.', 'Fallback correctly retrieves direct Python message');
            assert(result.citations && result.citations.length === 1, 'Fallback citations successfully returned');
            // Verify database
            const dbCitations = await db_service_1.dbService.client.chatCitation.findMany({
                where: { chatHistoryId: result.id }
            });
            assert(dbCitations.length === 1, 'Exactly 1 citation persisted from direct fallback');
            assert(dbCitations[0].title === 'Fallback Manual' && dbCitations[0].similarity === 0.887, 'Fallback citation title and similarity mapped correctly');
        }
        finally {
            global.fetch = originalFetch;
        }
        // ----------------------------------------------------
        // TEST 3: History Retrieval with relational citations
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 3] Chat history with relational citations include${RESET}`);
        const historySessionId = `test_history_session_${Date.now()}`;
        // Insert user message
        await db_service_1.dbService.client.chatHistory.create({
            data: { sessionId: historySessionId, senderType: 'user', message: 'Hello query' }
        });
        // Insert AI response with nested citations
        await db_service_1.dbService.client.chatHistory.create({
            data: {
                sessionId: historySessionId,
                senderType: 'ai',
                message: 'Responded answer',
                citations: {
                    create: [
                        { documentId: 'doc-999', title: 'History Citations Document', similarity: 0.999 }
                    ]
                }
            }
        });
        // Retrieve history
        const historyLogs = await db_service_1.dbService.client.chatHistory.findMany({
            where: { sessionId: historySessionId },
            include: { citations: true },
            orderBy: { createdAt: 'asc' }
        });
        assert(historyLogs.length === 2, 'History logs count matches');
        assert(historyLogs[0].senderType === 'user' && historyLogs[0].citations.length === 0, 'User message contains no citations');
        assert(historyLogs[1].senderType === 'ai' && historyLogs[1].citations.length === 1, 'AI message contains exactly 1 citation');
        assert(historyLogs[1].citations[0].title === 'History Citations Document' && historyLogs[1].citations[0].similarity === 0.999, 'Citations relation correctly fetched');
        // ----------------------------------------------------
        // CLEANUP
        // ----------------------------------------------------
        console.log(`\n${YELLOW}🧹 Initiating database cleanup...${RESET}`);
        await db_service_1.dbService.client.chatHistory.deleteMany({
            where: {
                sessionId: {
                    in: [testSessionId, fallbackSessionId, historySessionId]
                }
            }
        });
        console.log(`${GREEN}✔ Cleanup finished. Removed mock test data.${RESET}`);
        await db_service_1.dbService.disconnect();
    }
    catch (error) {
        console.error(`\n${RED}💥 Critical test execution crash: ${error.message}${RESET}`);
        console.error(error);
        failedTests++;
    }
    finally {
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
    }
    else {
        console.log(`${RED}🚨 TEST SUITE COMPLETED WITH FAILURES (${failedTests} failures)${RESET}`);
        process.exit(1);
    }
}
runTests();
