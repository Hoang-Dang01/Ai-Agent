"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStateRepository = void 0;
const db_service_1 = require("./db.service");
const task_state_machine_1 = require("../utils/task-state-machine");
const metrics_collector_1 = require("./metrics-collector");
class TaskStateRepository {
    static get client() {
        return db_service_1.dbService.client;
    }
    /**
     * Generates a globally unique, Postgres-sequence monotonic fencing token.
     * Guarantees sequence order across multiple application worker nodes.
     * Can accept an optional transaction client to run inside the same database transaction.
     */
    static async generateFencingToken(tx) {
        const client = tx || this.client;
        const result = (await client.$queryRawUnsafe(`SELECT nextval('task_fencing_seq') as nextval;`));
        return BigInt(result[0].nextval);
    }
    /**
     * Safe write utilizing fencing token check to reject outdated split-brain updates.
     * Leverages transactional integrity to record OutboxEvent atomically alongside the write.
     * Can run inside an existing database transaction client if passed.
     */
    static async updateWithFence(taskId, incomingFencingToken, patch, tx, expectedStatus, expectedEpoch) {
        const client = tx || this.client;
        const task = await client.aITask.findUnique({
            where: { id: taskId }
        });
        if (!task) {
            throw new Error(`Task with ID '${taskId}' not found.`);
        }
        // Enforce state transitions if status is being updated
        if (patch.status) {
            task_state_machine_1.TaskStateMachine.assertTransition(task.status, patch.status);
        }
        // Track DLQ metrics if task is being dead-lettered
        if (patch.deadLetteredAt) {
            metrics_collector_1.MetricsCollector.increment('dlq_total');
        }
        const executeUpdate = async (transactionClient) => {
            let result;
            const whereClause = { id: taskId };
            if (expectedStatus) {
                whereClause.status = expectedStatus;
            }
            if (expectedEpoch !== undefined) {
                whereClause.executionEpoch = expectedEpoch;
            }
            if (incomingFencingToken === undefined) {
                result = await transactionClient.aITask.updateMany({
                    where: whereClause,
                    data: patch
                });
            }
            else {
                whereClause.OR = [
                    { fencingToken: null },
                    { fencingToken: BigInt(incomingFencingToken) }
                ];
                result = await transactionClient.aITask.updateMany({
                    where: whereClause,
                    data: patch // Completely immutable: fencingToken is strictly validated in 'where' but never updated in 'data'
                });
            }
            if (result.count === 0) {
                throw new Error('FENCING_OR_CONCURRENCY_REJECTED');
            }
            // Insert OutboxEvent atomically
            await transactionClient.outboxEvent.create({
                data: {
                    aggregateType: 'AITask',
                    aggregateId: taskId,
                    eventType: patch.status ? `TASK_${patch.status}` : 'TASK_UPDATED',
                    payload: { taskId, patch }
                }
            });
            // Return updated task
            return await transactionClient.aITask.findUnique({ where: { id: taskId } });
        };
        try {
            if (tx) {
                return await executeUpdate(tx);
            }
            else {
                return await this.client.$transaction(async (t) => {
                    return await executeUpdate(t);
                });
            }
        }
        catch (err) {
            if (err.message === 'FENCING_OR_CONCURRENCY_REJECTED') {
                metrics_collector_1.MetricsCollector.increment('fencing_rejection_total');
                throw new Error(`Fencing rejection or task modified concurrently: Outdated fencing token or concurrent write conflict.`);
            }
            throw err;
        }
    }
    /**
     * Compare-And-Swap (CAS) write to prevent double recovery collisions.
     * Only updates if the database matches the expected epoch, then increments the epoch.
     * Logs OutboxEvent in the same database transaction.
     * If generateFence is true, atomically generates a globally monotonic fencing token inside the transaction.
     * Returns true if successful, false otherwise.
     */
    static async updateWithCAS(taskId, expectedEpoch, patch, generateFence = false, tx, expectedStatus) {
        const client = tx || this.client;
        const task = await client.aITask.findUnique({
            where: { id: taskId }
        });
        if (!task)
            return false;
        // Enforce state transitions if status is being updated
        if (patch.status) {
            task_state_machine_1.TaskStateMachine.assertTransition(task.status, patch.status);
        }
        // Track DLQ metrics if task is being dead-lettered
        if (patch.deadLetteredAt) {
            metrics_collector_1.MetricsCollector.increment('dlq_total');
        }
        const executeCAS = async (transactionClient) => {
            let fencingTokenPatch = {};
            if (generateFence) {
                const nextFence = await this.generateFencingToken(transactionClient);
                fencingTokenPatch = { fencingToken: nextFence };
            }
            const whereClause = {
                id: taskId,
                executionEpoch: expectedEpoch
            };
            if (expectedStatus) {
                if (Array.isArray(expectedStatus)) {
                    whereClause.status = { in: expectedStatus };
                }
                else {
                    whereClause.status = expectedStatus;
                }
            }
            const result = await transactionClient.aITask.updateMany({
                where: whereClause,
                data: {
                    ...patch,
                    ...fencingTokenPatch,
                    executionEpoch: expectedEpoch + 1 // Monotonically increment epoch
                }
            });
            if (result.count === 0) {
                throw new Error('CAS_CONFLICT');
            }
            // Insert OutboxEvent atomically
            await transactionClient.outboxEvent.create({
                data: {
                    aggregateType: 'AITask',
                    aggregateId: taskId,
                    eventType: patch.status ? `TASK_${patch.status}` : 'TASK_UPDATED',
                    payload: { taskId, patch }
                }
            });
            return true;
        };
        try {
            if (tx) {
                return await executeCAS(tx);
            }
            else {
                return await this.client.$transaction(async (t) => {
                    return await executeCAS(t);
                });
            }
        }
        catch (err) {
            if (err.message === 'CAS_CONFLICT') {
                metrics_collector_1.MetricsCollector.increment('cas_conflict_total');
            }
            return false;
        }
    }
}
exports.TaskStateRepository = TaskStateRepository;
