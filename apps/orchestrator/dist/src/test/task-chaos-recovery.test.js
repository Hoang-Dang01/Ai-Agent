"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_service_1 = require("../services/db.service");
const task_state_repository_1 = require("../services/task-state.repository");
const metrics_collector_1 = require("../services/metrics-collector");
const outbox_publisher_1 = require("../services/outbox-publisher");
const lease_reaper_service_1 = require("../services/lease-reaper.service");
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
async function runChaosTests() {
    console.log(`\n==================================================`);
    console.log(`🧪 STARTING SRE-GRADE CHAOS RECOVERY & CONCURRENCY STRESS SUITE (PHASE K+3)`);
    console.log(`==================================================\n`);
    try {
        // 1. Initialize DB Connection
        await db_service_1.dbService.initialize();
        console.log(`${YELLOW}⚡ Database connection initialized successfully.${RESET}\n`);
        const client = db_service_1.dbService.client;
        // Reset collector metrics to ensure clean test state
        metrics_collector_1.MetricsCollector.reset();
        // Create a mock user and a mock goal for testing
        console.log(`${YELLOW}⚡ Setting up mock User and Goal...${RESET}`);
        const mockUser = await client.user.create({
            data: {
                email: `chaos_sre_test_${Date.now()}@vibe.ai`,
                password: 'mockpassword123'
            }
        });
        const mockGoal = await client.userGoal.create({
            data: {
                userId: mockUser.id,
                goal: 'Verify high-contention SRE chaos failovers.',
                status: 'ACTIVE'
            }
        });
        // ----------------------------------------------------
        // TEST 1: 100 Concurrent Workers Stress Test (Atomic CAS Contention)
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 1] 100 Concurrent Workers High-Contention CAS Race${RESET}`);
        const contentionTask = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'High Contention Task',
                status: 'DISPATCHED',
                executionEpoch: 100
            }
        });
        console.log(`${YELLOW}⚡ Triggering 100 parallel workers concurrently claiming the task...${RESET}`);
        // Launch 100 parallel CAS updates simultaneously
        const results = await Promise.all(Array.from({ length: 100 }, () => task_state_repository_1.TaskStateRepository.updateWithCAS(contentionTask.id, 100, { status: 'FAILED' })));
        const successCount = results.filter(r => r === true).length;
        const failCount = results.filter(r => r === false).length;
        assert(successCount === 1, `Exactly 1 concurrent worker successfully claimed the lock. successCount: ${successCount}`);
        assert(failCount === 99, `Exactly 99 concurrent workers failed with CAS conflict. failCount: ${failCount}`);
        // Verify final epoch and status in DB
        const finalContentionTask = await client.aITask.findUnique({ where: { id: contentionTask.id } });
        assert(finalContentionTask.status === 'FAILED', 'Final task status is FAILED.');
        assert(finalContentionTask.executionEpoch === 101, `Monotonically incremented epoch is initial + 1 (101). Got: ${finalContentionTask.executionEpoch}`);
        // Verify metrics accurately counted 99 conflicts
        const metricsA = metrics_collector_1.MetricsCollector.getMetrics();
        assert(metricsA.cas_conflict_total === 99, `cas_conflict_total metric perfectly counted 99 conflicts. Got: ${metricsA.cas_conflict_total}`);
        // ----------------------------------------------------
        // TEST 2: Transactional Abort & Multi-Model Rollback Integrity
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 2] SRE Transaction Rollback & Orphan State Audit${RESET}`);
        const mockTaskId = `rollback-dummy-id-${Date.now()}`;
        const initialMetrics = metrics_collector_1.MetricsCollector.getMetrics();
        let transactionRolledBack = false;
        try {
            await client.$transaction(async (tx) => {
                // Create an attempt
                const mockTask = await tx.aITask.create({
                    data: {
                        id: mockTaskId,
                        goalId: mockGoal.id,
                        title: 'Rollback Dummy Task',
                        status: 'QUEUED'
                    }
                });
                // Atomic write inside transaction tx
                await tx.aITask.update({
                    where: { id: mockTask.id },
                    data: { status: 'DISPATCHED' }
                });
                // Insert outbox atomically inside transaction tx
                await tx.outboxEvent.create({
                    data: {
                        aggregateType: 'AITask',
                        aggregateId: mockTask.id,
                        eventType: 'TASK_DISPATCHED',
                        payload: { taskId: mockTask.id }
                    }
                });
                // Intentional crash / database validation constraint violation to force abort
                throw new Error('INTENTIONAL_CHAOS_ABORT_BOOM');
            });
        }
        catch (err) {
            if (err.message === 'INTENTIONAL_CHAOS_ABORT_BOOM') {
                transactionRolledBack = true;
            }
        }
        assert(transactionRolledBack === true, 'SRE transactional abort injected and rolled back successfully.');
        // Audit and verify that 0 orphaned records remain in the DB
        const dummyTasks = await client.aITask.findMany({ where: { id: mockTaskId } });
        assert(dummyTasks.length === 0, `Task record completely rolled back. Count: ${dummyTasks.length}`);
        const abortedAttempts = await client.taskExecutionAttempt.findMany({ where: { taskId: mockTaskId } });
        assert(abortedAttempts.length === 0, `Execution attempt log completely rolled back. Count: ${abortedAttempts.length}`);
        // Verify outbox was never created
        const abortedOutboxes = await client.outboxEvent.findMany({ where: { aggregateId: mockTaskId } });
        assert(abortedOutboxes.length === 0, `OutboxEvent record completely rolled back. Count: ${abortedOutboxes.length}`);
        // Verify no metrics were incorrectly incremented
        const postRollbackMetrics = metrics_collector_1.MetricsCollector.getMetrics();
        assert(postRollbackMetrics.dlq_total === initialMetrics.dlq_total &&
            postRollbackMetrics.fencing_rejection_total === initialMetrics.fencing_rejection_total, 'Observability metrics were not incremented during aborted transaction.');
        // ----------------------------------------------------
        // TEST 3: Outbox Claiming skip locked & Network Outage Simulation
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 3] Outbox Skip-Locked Claiming & Outage Failover Sweep${RESET}`);
        // Temporarily inject Socket Outage by shutting down socket server emit stub
        const originalIo = global.io;
        global.io = {
            emit: () => {
                throw new Error('SocketException: Connection reset by peer.');
            }
        };
        // Create a new task causing a transactional outbox insert
        const outageTask = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'Outage Failover Task',
                status: 'QUEUED'
            }
        });
        await task_state_repository_1.TaskStateRepository.updateWithFence(outageTask.id, 200, { status: 'DISPATCHED' });
        // Run sweep during socket outage: should fail to publish but events MUST remain claimed and eventually retryable
        console.log(`${YELLOW}⚡ Simulating Outbox Sweep during Network Outage...${RESET}`);
        const sweepCountOutage = await outbox_publisher_1.OutboxPublisher.publishPendingEvents();
        assert(sweepCountOutage === 0, `Publisher processed 0 events during outage. sweepCountOutage: ${sweepCountOutage}`);
        // Verify in database that outbox events remain claimed but unpublished
        const outageEvents = await client.outboxEvent.findMany({
            where: { aggregateId: outageTask.id }
        });
        assert(outageEvents.length >= 1, 'OutboxEvents exist in database.');
        assert(outageEvents[0].publishedAt === null, 'OutboxEvent publishedAt is null (not lost).');
        assert(outageEvents[0].claimedAt !== null, 'OutboxEvent claimedAt timestamp registered.');
        assert(outageEvents[0].claimedBy !== null, 'OutboxEvent claimedBy node instance ID captured.');
        // Restore network connection (restore Socket mock)
        global.io = originalIo;
        // Simulate reclaim timeout passing (temporarily mock process.env for 0 seconds reclaim)
        process.env.OUTBOX_CLAIM_TIMEOUT_SECONDS = '0';
        console.log(`${YELLOW}⚡ Restoring Network Connectivity and Re-Sweeping...${RESET}`);
        const sweepCountRestored = await outbox_publisher_1.OutboxPublisher.publishPendingEvents();
        assert(sweepCountRestored >= 1, `Publisher reclaimed and published ${sweepCountRestored} event(s) successfully after reconnect.`);
        // Verify outbox events are now successfully marked as published in DB
        const finalOutageEvents = await client.outboxEvent.findMany({
            where: { aggregateId: outageTask.id }
        });
        assert(finalOutageEvents[0].publishedAt !== null, 'OutboxEvent is officially marked as published in PostgreSQL.');
        // ----------------------------------------------------
        // TEST 4: Lease Expiration & Dual CAS-Fencing Reaper Recovery
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 4] Lease Expiration & Dual CAS-Fencing Reaper Recovery${RESET}`);
        // Create a task that crashed/expired in EXECUTING status
        const crashedTask = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'Crashed Active Task',
                status: 'EXECUTING',
                executionEpoch: 5,
                fencingToken: BigInt(0), // Sequence-friendly start token
                // Expired lease
                leaseExpiresAt: new Date(Date.now() - 5000)
            }
        });
        // Create an active attempt log in history
        await client.taskExecutionAttempt.create({
            data: {
                taskId: crashedTask.id,
                executionEpoch: 5,
                status: 'RUNNING'
            }
        });
        console.log(`${YELLOW}⚡ Executing SRE LeaseReaperService sweep daemon...${RESET}`);
        const reapedCount = await lease_reaper_service_1.LeaseReaperService.reap();
        assert(reapedCount === 1, `LeaseReaper successfully recovered 1 crashed task. reapedCount: ${reapedCount}`);
        // Verify task state in database
        const recoveredTask = await client.aITask.findUnique({ where: { id: crashedTask.id } });
        assert(recoveredTask.status === 'QUEUED', `Task status successfully reset to QUEUED (Epoch audit). Got: ${recoveredTask.status}`);
        assert(recoveredTask.executionEpoch === 6, `executionEpoch atomically incremented to 6. Got: ${recoveredTask.executionEpoch}`);
        assert(recoveredTask.fencingToken > BigInt(0), `fencingToken atomically incremented to sequence value: ${recoveredTask.fencingToken}`);
        assert(recoveredTask.leaseExpiresAt === null, 'leaseExpiresAt lease locked has been cleared.');
        // Verify attempt log was updated to FAILED in database
        const attempts = await client.taskExecutionAttempt.findMany({
            where: { taskId: crashedTask.id }
        });
        assert(attempts.length === 1, 'Crashed task has attempt log.');
        assert(attempts[0].status === 'FAILED', 'Attempt status updated to FAILED.');
        assert(attempts[0].endedAt !== null, 'Attempt endedAt timestamp registered.');
        // Verify recovery metrics
        const finalMetrics = metrics_collector_1.MetricsCollector.getMetrics();
        assert(finalMetrics.recovery_attempt_total >= 1, 'recovery_attempt_total metric logged.');
        assert(finalMetrics.recovery_success_total === 1, 'recovery_success_total metric logged.');
        // ----------------------------------------------------
        // TEST 5: Split-Brain Zombie Worker Reconnect Rejection
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 5] Split-Brain Zombie Worker Reconnect Blocked (Fence & Epoch Gate)${RESET}`);
        // Create a task representing a zombie worker holding an active lease
        const zombieTask = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'Zombie Task',
                status: 'EXECUTING',
                executionEpoch: 10,
                fencingToken: BigInt(888),
                leaseExpiresAt: new Date(Date.now() - 5000) // Expired lease due to simulated partition
            }
        });
        // Simulate Lease Reaper recovering the task because of partition timeout
        console.log(`${YELLOW}⚡ Simulating Lease Reaper recovery...${RESET}`);
        const zombieReapedCount = await lease_reaper_service_1.LeaseReaperService.reap();
        assert(zombieReapedCount === 1, `LeaseReaper successfully recovered zombie task. Count: ${zombieReapedCount}`);
        // Verify task state in database after recovery
        const recoveredZombie = await client.aITask.findUnique({ where: { id: zombieTask.id } });
        assert(recoveredZombie.status === 'QUEUED', 'Task successfully reset to QUEUED.');
        assert(recoveredZombie.executionEpoch === 11, `Epoch incremented from 10 to 11. Got: ${recoveredZombie.executionEpoch}`);
        assert(recoveredZombie.fencingToken !== null && recoveredZombie.fencingToken !== BigInt(888), 'Fencing token changed to next sequence token.');
        // Simulate Zombie Worker reconnecting and attempting to commit COMPLETED using old fence (888) and old epoch (10)
        console.log(`${YELLOW}⚡ Simulated Zombie Worker attempts to write COMPLETED with stale fence (888) and epoch (10)...${RESET}`);
        let zombieWriteFailed = false;
        try {
            await task_state_repository_1.TaskStateRepository.updateWithFence(zombieTask.id, BigInt(888), // Old Fencing Token
            { status: 'COMPLETED' }, undefined, 'EXECUTING', // Old Expected status
            10 // Old Expected Epoch
            );
        }
        catch (err) {
            zombieWriteFailed = true;
            const isFencingError = err.message.includes('Fencing rejection or task modified concurrently');
            const isTransitionError = err.message.includes('Invalid task state transition');
            assert(isFencingError || isTransitionError, `Zombie write correctly rejected. Got error: ${err.message}`);
        }
        assert(zombieWriteFailed === true, 'Fencing + Epoch matching prevents split-brain zombie write.');
        // Verify database remains untouched (still QUEUED and epoch 11)
        const finalZombieDb = await client.aITask.findUnique({ where: { id: zombieTask.id } });
        assert(finalZombieDb.status === 'QUEUED', `Task status is preserved as QUEUED. Got: ${finalZombieDb.status}`);
        assert(finalZombieDb.executionEpoch === 11, `Task epoch remains 11. Got: ${finalZombieDb.executionEpoch}`);
        // ----------------------------------------------------
        // CLEANUP
        // ----------------------------------------------------
        console.log(`\n${YELLOW}🧹 Cleaning up mock test records from Database...${RESET}`);
        await client.user.delete({
            where: { id: mockUser.id }
        });
        console.log(`${GREEN}✔ All test users, goals, outbox events, attempts, and tasks cascade deleted successfully.${RESET}`);
        // Disconnect
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
    console.log(`📊 FINAL SRE CHAOS RECOVERY & CONCURRENCY TEST REPORT`);
    console.log(`==================================================`);
    if (failedTests === 0) {
        console.log(`${GREEN}★ ALL CHAOS RECOVERY AND CONSISTENCY TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
        process.exit(0);
    }
    else {
        console.log(`${RED}🚨 CHAOS RECOVERY AND CONSISTENCY TESTS FAILED WITH ${failedTests} FAILURE(S)${RESET}`);
        process.exit(1);
    }
}
runChaosTests();
