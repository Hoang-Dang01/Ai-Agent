"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_service_1 = require("../services/db.service");
const task_state_machine_1 = require("../utils/task-state-machine");
const task_state_repository_1 = require("../services/task-state.repository");
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
async function runTests() {
    console.log(`\n==================================================`);
    console.log(`🧪 STARTING AUTOMATED TASK PERSISTENCE TEST SUITE (V3 - CONCURRENCY & CONSISTENCY)`);
    console.log(`==================================================\n`);
    try {
        // 1. Initialize Database
        await db_service_1.dbService.initialize();
        console.log(`${YELLOW}⚡ Database connection initialized successfully.${RESET}\n`);
        const client = db_service_1.dbService.client;
        // Create a mock user and a mock goal
        console.log(`${YELLOW}⚡ Setting up mock User and Goal...${RESET}`);
        const mockUser = await client.user.create({
            data: {
                email: `persistence_test_${Date.now()}@vibe.ai`,
                password: 'mockpassword123'
            }
        });
        const mockGoal = await client.userGoal.create({
            data: {
                userId: mockUser.id,
                goal: 'Verify distributed consistency guarantees.',
                status: 'ACTIVE'
            }
        });
        // ----------------------------------------------------
        // TEST 1: Task State Machine Enforcement
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 1] Task State Machine Transition Logic${RESET}`);
        // Verify static rules
        assert(task_state_machine_1.TaskStateMachine.isValidTransition('QUEUED', 'DISPATCHED') === true, 'Static rule allowed: QUEUED -> DISPATCHED');
        assert(task_state_machine_1.TaskStateMachine.isValidTransition('DISPATCHED', 'ACKNOWLEDGED') === true, 'Static rule allowed: DISPATCHED -> ACKNOWLEDGED');
        assert(task_state_machine_1.TaskStateMachine.isValidTransition('FAILED', 'EXECUTING') === false, 'Static rule blocked: FAILED -> EXECUTING');
        assert(task_state_machine_1.TaskStateMachine.isValidTransition('COMPLETED', 'QUEUED') === false, 'Static rule blocked: COMPLETED -> QUEUED');
        // Create task
        const stateTask = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'State machine task',
                status: 'QUEUED'
            }
        });
        // Attempt valid transition via repository
        await task_state_repository_1.TaskStateRepository.updateWithFence(stateTask.id, 1, { status: 'DISPATCHED' });
        const fetchedStateTask = await client.aITask.findUnique({ where: { id: stateTask.id } });
        assert(fetchedStateTask.status === 'DISPATCHED', 'Valid status transition applied successfully via repository.');
        // Attempt invalid transition via repository
        let invalidTransitionBlocked = false;
        try {
            await task_state_repository_1.TaskStateRepository.updateWithFence(stateTask.id, 1, { status: 'QUEUED' }); // DISPATCHED -> QUEUED is invalid
        }
        catch (err) {
            invalidTransitionBlocked = true;
            assert(err.message.includes('Invalid task state transition'), 'Repository threw error blocking invalid transition.');
        }
        assert(invalidTransitionBlocked === true, 'TaskStateRepository correctly rejected invalid transition.');
        // ----------------------------------------------------
        // TEST 2: Compare-And-Swap (CAS) Concurrency (Double Recovery Protection)
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 2] Compare-And-Swap Concurrency (Chống Double Recovery)${RESET}`);
        const casTask = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'Recovery CAS task',
                status: 'DISPATCHED',
                executionEpoch: 1
            }
        });
        // Simulate two nodes scanning and attempting to revive/recovery task concurrently
        // Node 1 attempts first (should succeed)
        const node1Success = await task_state_repository_1.TaskStateRepository.updateWithCAS(casTask.id, 1, { status: 'ACKNOWLEDGED' });
        // Node 2 attempts next with outdated epoch (should fail)
        const node2Success = await task_state_repository_1.TaskStateRepository.updateWithCAS(casTask.id, 1, { status: 'ACKNOWLEDGED' });
        assert(node1Success === true, 'Node 1 successfully revived the task (Epoch matched 1).');
        assert(node2Success === false, 'Node 2 was successfully blocked (Epoch has been incremented to 2 by Node 1).');
        // Fetch and check final epoch
        const fetchedCAS = await client.aITask.findUnique({ where: { id: casTask.id } });
        assert(fetchedCAS.executionEpoch === 2, `Final executionEpoch is monotonically incremented to 2. Got: ${fetchedCAS.executionEpoch}`);
        assert(fetchedCAS.status === 'ACKNOWLEDGED', 'Final status updated correctly.');
        // ----------------------------------------------------
        // TEST 3: Fencing Token Protection
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 3] Fencing Token Protection (Chống Split-Brain Ghi Muộn)${RESET}`);
        const fencingTask = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'Fenced task',
                status: 'ACKNOWLEDGED',
                fencingToken: BigInt(16) // Current token is 16
            }
        });
        // Simulated Worker A tries to write with outdated fencing token 15 (e.g. partition recovery delay)
        let workerABlocked = false;
        try {
            await task_state_repository_1.TaskStateRepository.updateWithFence(fencingTask.id, 15, { title: 'Late outdated split-brain write' });
        }
        catch (err) {
            workerABlocked = true;
            assert(err.message.includes('Fencing rejection'), 'Stale Worker A late write with fencingToken 15 successfully rejected.');
        }
        assert(workerABlocked === true, 'Worker A write was blocked.');
        // Simulated Worker C tries to write with a forged newer fencing token 17 (without obtaining lease first)
        let workerCBlocked = false;
        try {
            await task_state_repository_1.TaskStateRepository.updateWithFence(fencingTask.id, 17, { title: 'Forged split-brain write' });
        }
        catch (err) {
            workerCBlocked = true;
            assert(err.message.includes('Fencing rejection'), 'Forged Worker C write with newer fencingToken 17 successfully rejected.');
        }
        assert(workerCBlocked === true, 'Worker C write was blocked.');
        // Simulated Worker B writes with correct, current fencing token 16 (Owner of active lease)
        await task_state_repository_1.TaskStateRepository.updateWithFence(fencingTask.id, 16, { title: 'Valid updated write' });
        const fetchedFenced = await client.aITask.findUnique({ where: { id: fencingTask.id } });
        assert(fetchedFenced.title === 'Valid updated write', 'Worker B write with current fencingToken 16 approved successfully.');
        assert(fetchedFenced.fencingToken === BigInt(16), 'Database fencingToken remains unmodified at 16 (fencing token immutability is guaranteed).');
        // ----------------------------------------------------
        // TEST 4: Relational attempts Uniqueness
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 4] Relational attempts Uniqueness per Epoch${RESET}`);
        const attemptTask = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'Task with unique attempts',
                status: 'QUEUED'
            }
        });
        // Insert attempt #1 for epoch 1 (Success)
        const att1 = await client.taskExecutionAttempt.create({
            data: {
                taskId: attemptTask.id,
                executionEpoch: 1,
                status: 'FAILED',
                error: 'Failed execution.'
            }
        });
        assert(!!att1, 'First execution attempt log saved successfully.');
        // Try to insert a duplicate attempt for the same task and epoch 1 (Should fail due to unique constraint)
        let duplicateAttemptBlocked = false;
        try {
            await client.taskExecutionAttempt.create({
                data: {
                    taskId: attemptTask.id,
                    executionEpoch: 1,
                    status: 'COMPLETED'
                }
            });
        }
        catch (err) {
            duplicateAttemptBlocked = true;
            assert(err.code === 'P2002', `Unique constraint successfully blocked duplicate attempt logging. Code: ${err.code}`);
        }
        assert(duplicateAttemptBlocked === true, 'Database successfully blocked duplicate attempt for identical epoch.');
        // ----------------------------------------------------
        // TEST 5: Scoped Idempotency Collision
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 5] Scoped Idempotency Collision (Service Isolation)${RESET}`);
        const idempKey = `refund_key_${Date.now()}`;
        // Insert in 'payment' service (Succeeds)
        const taskPayment = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'Payment Refund Task',
                status: 'QUEUED',
                serviceName: 'payment',
                idempotencyKey: idempKey
            }
        });
        assert(!!taskPayment, 'First scoped idempotency task created under payment service.');
        // Insert same key in 'payment' service (Should be blocked)
        let duplicatePaymentBlocked = false;
        try {
            await client.aITask.create({
                data: {
                    goalId: mockGoal.id,
                    title: 'Duplicate Payment Refund',
                    status: 'QUEUED',
                    serviceName: 'payment',
                    idempotencyKey: idempKey
                }
            });
        }
        catch (err) {
            duplicatePaymentBlocked = true;
            assert(err.code === 'P2002', `Duplicate idempotencyKey inside the SAME service ('payment') was successfully blocked. Code: ${err.code}`);
        }
        assert(duplicatePaymentBlocked === true, 'Blocked identical idempotency chèn within same service.');
        // Insert same key in 'email' service (Should succeed without collision)
        const taskEmail = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'Email Notification Task',
                status: 'QUEUED',
                serviceName: 'email',
                idempotencyKey: idempKey
            }
        });
        assert(!!taskEmail, 'Identical idempotencyKey approved under DIFFERENT service namespace ("email"). Scoping isolation works.');
        // ----------------------------------------------------
        // TEST 6: Dead Letter Queue (DLQ) Limit Triggers
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 6] Dead Letter Queue (DLQ) & Retry Policy triggers${RESET}`);
        const dlqTask = await client.aITask.create({
            data: {
                goalId: mockGoal.id,
                title: 'Poison Pill Task',
                status: 'EXECUTING',
                retryCount: 4,
                maxRetry: 5
            }
        });
        // Simulate retry failure increment
        const updatedCount = dlqTask.retryCount + 1;
        const patchPayload = {
            retryCount: updatedCount,
            status: 'FAILED'
        };
        // If max retry is hit, dead-letter it
        if (updatedCount >= dlqTask.maxRetry) {
            patchPayload.deadLetteredAt = new Date();
        }
        await task_state_repository_1.TaskStateRepository.updateWithFence(dlqTask.id, 1, patchPayload);
        const fetchedDLQ = await client.aITask.findUnique({ where: { id: dlqTask.id } });
        assert(fetchedDLQ.status === 'FAILED', 'Task status is set to FAILED.');
        assert(fetchedDLQ.retryCount === 5, 'retryCount is successfully incremented to 5.');
        assert(fetchedDLQ.deadLetteredAt !== null, `deadLetteredAt timestamp logged successfully. Task is officially Dead-Lettered.`);
        // ----------------------------------------------------
        // CLEANUP
        // ----------------------------------------------------
        console.log(`\n${YELLOW}🧹 Cleaning up mock test records from Database...${RESET}`);
        await client.user.delete({
            where: { id: mockUser.id }
        });
        console.log(`${GREEN}✔ All test users, goals, attempts, and tasks cascade deleted successfully.${RESET}`);
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
    console.log(`📊 FINAL TASK PERSISTENCE TEST REPORT`);
    console.log(`==================================================`);
    if (failedTests === 0) {
        console.log(`${GREEN}★ ALL HARDENING PERSISTENCE TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
        process.exit(0);
    }
    else {
        console.log(`${RED}🚨 HARDENING PERSISTENCE TESTS FAILED WITH ${failedTests} FAILURE(S)${RESET}`);
        process.exit(1);
    }
}
runTests();
