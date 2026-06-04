"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_service_1 = require("../services/db.service");
const telemetry_retention_job_1 = require("../jobs/telemetry-retention.job");
const telemetry_pricing_registry_1 = require("../services/telemetry-pricing.registry");
const crypto_1 = require("crypto");
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
function hashSHA256(text) {
    return (0, crypto_1.createHash)('sha256').update(text).digest('hex');
}
function sanitizeErrorMessage(msg) {
    if (!msg)
        return null;
    let sanitized = msg.substring(0, 512);
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, '[REDACTED_TOKEN]');
    sanitized = sanitized.replace(/Authorization:\s*[^\s]+/gi, '[REDACTED_AUTHORIZATION]');
    return sanitized;
}
async function runTelemetryTests() {
    console.log(`\n==================================================`);
    console.log(`🧪 STARTING AUTOMATED TELEMETRY HARDENING TEST SUITE`);
    console.log(`==================================================\n`);
    try {
        // 0. Initialize database connection
        console.log(`${YELLOW}[SETUP] Initializing database...${RESET}`);
        await db_service_1.dbService.initialize();
        // Clean trace logs before running test cases
        console.log(`${YELLOW}[SETUP] Cleaning existing telemetry traces...${RESET}`);
        await db_service_1.dbService.client.aITelemetryTrace.deleteMany();
        // ----------------------------------------------------
        // TEST 1: Sanitized Error Taxonomy Verification
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 1] Sanitized Error Taxonomy Verification${RESET}`);
        const rawError = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJvcGVyYXRvckBhbnRpZ3Jhdml0eS5haSJ9.abcdefg. Failure details here... Stacktrace:\nTraceback (most recent call last):\n  File "app.py", line 45, in generate\n    raise HTTPException(status_code=429, detail="Rate Limit Exceeded")';
        const sanitizedError = sanitizeErrorMessage(rawError);
        assert(sanitizedError !== null, 'Sanitized error is not null.');
        assert(sanitizedError.length <= 512, 'Sanitized error message size is constrained within 512 characters.');
        assert(!sanitizedError.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'Sensitive Bearer JWT token was successfully redacted.');
        assert(!sanitizedError.includes('Authorization:'), 'Sensitive Authorization headers were redacted.');
        console.log(`   Sanitized message output: "${sanitizedError}"`);
        // ----------------------------------------------------
        // TEST 2: Cost Materialization & Write-time Pricing Verification
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 2] Cost Materialization & Write-time Pricing Verification${RESET}`);
        // Standard calculations
        const costs1 = (0, telemetry_pricing_registry_1.calculateTokensCost)('gemini-1.5-flash', 1000000, 2000000);
        assert(costs1.calculatedInputCostUsd === 0.075, 'Calculated input cost matches registry rates (0.075 USD per million input).');
        assert(costs1.calculatedOutputCostUsd === 0.60, 'Calculated output cost matches registry rates (0.30 USD per million output).');
        assert(costs1.estimatedCostUsd === 0.675, 'Total estimated cost matches input + output cost sum (0.675 USD).');
        // Create a trace with materialized cost
        const traceId = 'test-trace-uuid';
        const spanId = 'test-span-uuid';
        const promptText = 'Verify this prompt text is logged';
        const promptHash = hashSHA256(promptText);
        const insertedTrace = await db_service_1.dbService.client.aITelemetryTrace.create({
            data: {
                traceId,
                spanId,
                traceType: 'PLAN',
                status: 'SUCCESS',
                model: 'gemini-1.5-flash',
                promptText: '',
                promptHash,
                inputTokens: 1000000,
                outputTokens: 2000000,
                calculatedInputCostUsd: costs1.calculatedInputCostUsd,
                calculatedOutputCostUsd: costs1.calculatedOutputCostUsd,
                estimatedCostUsd: costs1.estimatedCostUsd,
                latencyMs: 1200
            }
        });
        assert(insertedTrace.calculatedInputCostUsd !== null, 'Calculated input cost is written to database.');
        assert(Number(insertedTrace.calculatedInputCostUsd) === 0.075, 'Materialized database input cost is mathematically correct.');
        assert(Number(insertedTrace.estimatedCostUsd) === 0.675, 'Materialized database estimated cost is mathematically correct.');
        // ----------------------------------------------------
        // TEST 3: Telemetry Retention Policy & Daily Pruning Job Verification
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 3] Telemetry Retention Policy & Daily Pruning Job Verification${RESET}`);
        const now = new Date();
        // Success trace older than 90 days (should be deleted)
        const success95DaysOld = await db_service_1.dbService.client.aITelemetryTrace.create({
            data: {
                traceId: 'success-old-trace',
                spanId: 's-old',
                traceType: 'PLAN',
                status: 'SUCCESS',
                promptText: 'Old plan prompt',
                createdAt: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000)
            }
        });
        // Failed trace older than 180 days (should be deleted)
        const failed185DaysOld = await db_service_1.dbService.client.aITelemetryTrace.create({
            data: {
                traceId: 'failed-old-trace',
                spanId: 'f-old',
                traceType: 'CRITIC',
                status: 'FAILED',
                promptText: 'Old critic prompt',
                createdAt: new Date(now.getTime() - 185 * 24 * 60 * 60 * 1000)
            }
        });
        // Failed trace older than 90 days but less than 180 days (should survive)
        const failed100DaysOld = await db_service_1.dbService.client.aITelemetryTrace.create({
            data: {
                traceId: 'failed-survivor-trace',
                spanId: 'f-survive',
                traceType: 'CRITIC',
                status: 'FAILED',
                promptText: 'Failed survivor prompt',
                createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000)
            }
        });
        // Success trace older than 30 days but less than 90 days (should survive, but raw prompt texts should be cleared)
        const success35DaysOld = await db_service_1.dbService.client.aITelemetryTrace.create({
            data: {
                traceId: 'success-text-clear-trace',
                spanId: 's-text-clear',
                traceType: 'PLAN',
                status: 'SUCCESS',
                promptText: 'Text to be cleared',
                responseText: 'Response to be cleared',
                createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
            }
        });
        // Fresh success trace (should survive intact)
        const freshTrace = await db_service_1.dbService.client.aITelemetryTrace.create({
            data: {
                traceId: 'fresh-trace',
                spanId: 'fresh-span',
                traceType: 'PLAN',
                status: 'SUCCESS',
                promptText: 'Fresh prompt',
                responseText: 'Fresh response',
                createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
            }
        });
        // Execute retention pruning job
        console.log('   Executing telemetry retention pruning job...');
        const pruneResults = await (0, telemetry_retention_job_1.runTelemetryRetentionPruning)();
        assert(pruneResults.deletedSuccessCount >= 1, 'Pruning deleted at least 1 SUCCESS trace older than 90 days.');
        assert(pruneResults.deletedFailedCount >= 1, 'Pruning deleted at least 1 FAILED trace older than 180 days.');
        assert(pruneResults.clearedTextsCount >= 1, 'Pruning cleared raw text files older than 30 days.');
        // Verify survivors
        const sOldCheck = await db_service_1.dbService.client.aITelemetryTrace.findUnique({ where: { id: success95DaysOld.id } });
        const fOldCheck = await db_service_1.dbService.client.aITelemetryTrace.findUnique({ where: { id: failed185DaysOld.id } });
        const f100Check = await db_service_1.dbService.client.aITelemetryTrace.findUnique({ where: { id: failed100DaysOld.id } });
        const s35Check = await db_service_1.dbService.client.aITelemetryTrace.findUnique({ where: { id: success35DaysOld.id } });
        const freshCheck = await db_service_1.dbService.client.aITelemetryTrace.findUnique({ where: { id: freshTrace.id } });
        assert(sOldCheck === null, 'Success trace > 90 days was deleted physically.');
        assert(fOldCheck === null, 'Failed trace > 180 days was deleted physically.');
        assert(f100Check !== null, 'Failed trace > 90 days but < 180 days survived.');
        assert(s35Check !== null, 'Success trace > 30 days but < 90 days survived.');
        assert(s35Check.promptText === '', 'Prompt text for trace older than 30 days was cleared.');
        assert(s35Check.responseText === '', 'Response text for trace older than 30 days was cleared.');
        assert(freshCheck !== null, 'Fresh trace survived.');
        assert(freshCheck.promptText === 'Fresh prompt', 'Fresh trace prompt text remains intact.');
        // ----------------------------------------------------
        // TEST 4: Percentile Latency Calculation Verification
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 4] Percentile Latency Calculation Verification${RESET}`);
        // Insert 5 traces with latencies: 100ms, 200ms, 300ms, 400ms, 500ms
        // To ensure exact percentiles:
        // P50 = 300ms
        // P95 = 500ms (based on interpolation/percentile equations)
        await db_service_1.dbService.client.aITelemetryTrace.deleteMany();
        const latencies = [100, 200, 300, 400, 500];
        for (let i = 0; i < latencies.length; i++) {
            await db_service_1.dbService.client.aITelemetryTrace.create({
                data: {
                    traceId: `latency-trace-${i}`,
                    spanId: `lat-${i}`,
                    traceType: 'PLAN',
                    status: 'SUCCESS',
                    promptText: '',
                    latencyMs: latencies[i]
                }
            });
        }
        const percentiles = await db_service_1.dbService.client.$queryRaw `
      SELECT 
        COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms), 0) AS p50,
        COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) AS p95,
        COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms), 0) AS p99
      FROM ai_telemetry_traces
      WHERE status = 'SUCCESS' AND latency_ms IS NOT NULL;
    `;
        const p50 = percentiles[0]?.p50 || 0;
        const p95 = percentiles[0]?.p95 || 0;
        const p99 = percentiles[0]?.p99 || 0;
        assert(p50 === 300, `P50 (Median) latency calculated correctly: ${p50}ms (Expected: 300ms)`);
        assert(p95 >= 450 && p95 <= 500, `P95 latency calculated correctly: ${p95}ms (Expected range: 450-500ms)`);
        assert(p99 >= 480 && p99 <= 500, `P99 latency calculated correctly: ${p99}ms (Expected range: 480-500ms)`);
        // Clean up
        await db_service_1.dbService.client.aITelemetryTrace.deleteMany();
        await db_service_1.dbService.disconnect();
    }
    catch (error) {
        console.error(`\n${RED}💥 Critical test execution crash: ${error.message}${RESET}`);
        failedTests++;
    }
    // ----------------------------------------------------
    // TEST SUITE REPORT
    // ----------------------------------------------------
    console.log(`\n==================================================`);
    console.log(`📊 FINAL TELEMETRY HARDENING TEST REPORT`);
    console.log(`==================================================`);
    if (failedTests === 0) {
        console.log(`${GREEN}★ ALL TELEMETRY HARDENING TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
        process.exit(0);
    }
    else {
        console.log(`${RED}🚨 TELEMETRY HARDENING TESTS FAILED WITH ${failedTests} FAILURE(S)${RESET}`);
        process.exit(1);
    }
}
runTelemetryTests();
