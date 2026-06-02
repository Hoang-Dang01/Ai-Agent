import { dbService } from './db.service';
import { TaskStateMachine, TaskStatus } from '../utils/task-state-machine';
import { MetricsCollector } from './metrics-collector';

export class TaskStateRepository {
  private static get client() {
    return dbService.client as any;
  }

  /**
   * Generates a globally unique, Postgres-sequence monotonic fencing token.
   * Guarantees sequence order across multiple application worker nodes.
   * Can accept an optional transaction client to run inside the same database transaction.
   */
  public static async generateFencingToken(tx?: any): Promise<bigint> {
    const client = tx || this.client;
    const result = (await client.$queryRawUnsafe(
      `SELECT nextval('task_fencing_seq') as nextval;`
    )) as any[];
    return BigInt(result[0].nextval);
  }

  /**
   * Safe write utilizing fencing token check to reject outdated split-brain updates.
   * Leverages transactional integrity to record OutboxEvent atomically alongside the write.
   * Can run inside an existing database transaction client if passed.
   */
  public static async updateWithFence(
    taskId: string,
    incomingFencingToken: bigint | number | string | undefined,
    patch: any,
    tx?: any,
    expectedStatus?: TaskStatus,
    expectedEpoch?: number
  ): Promise<any> {
    const client = tx || this.client;
    const task = await client.aITask.findUnique({
      where: { id: taskId }
    });
    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    // Enforce state transitions if status is being updated
    if (patch.status) {
      TaskStateMachine.assertTransition(task.status as TaskStatus, patch.status as TaskStatus);
    }

    // Track DLQ metrics if task is being dead-lettered
    if (patch.deadLetteredAt) {
      MetricsCollector.increment('dlq_total');
    }

    const executeUpdate = async (transactionClient: any) => {
      let result;
      const whereClause: any = { id: taskId };

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
      } else {
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
      } else {
        return await this.client.$transaction(async (t: any) => {
          return await executeUpdate(t);
        });
      }
    } catch (err: any) {
      if (err.message === 'FENCING_OR_CONCURRENCY_REJECTED') {
        MetricsCollector.increment('fencing_rejection_total');
        throw new Error(
          `Fencing rejection or task modified concurrently: Outdated fencing token or concurrent write conflict.`
        );
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
  public static async updateWithCAS(
    taskId: string,
    expectedEpoch: number,
    patch: any,
    generateFence: boolean = false,
    tx?: any,
    expectedStatus?: TaskStatus | TaskStatus[]
  ): Promise<boolean> {
    const client = tx || this.client;
    const task = await client.aITask.findUnique({
      where: { id: taskId }
    });
    if (!task) return false;

    // Enforce state transitions if status is being updated
    if (patch.status) {
      TaskStateMachine.assertTransition(task.status as TaskStatus, patch.status as TaskStatus);
    }

    // Track DLQ metrics if task is being dead-lettered
    if (patch.deadLetteredAt) {
      MetricsCollector.increment('dlq_total');
    }

    const executeCAS = async (transactionClient: any) => {
      let fencingTokenPatch = {};
      if (generateFence) {
        const nextFence = await this.generateFencingToken(transactionClient);
        fencingTokenPatch = { fencingToken: nextFence };
      }

      const whereClause: any = {
        id: taskId,
        executionEpoch: expectedEpoch
      };

      if (expectedStatus) {
        if (Array.isArray(expectedStatus)) {
          whereClause.status = { in: expectedStatus };
        } else {
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
      } else {
        return await this.client.$transaction(async (t: any) => {
          return await executeCAS(t);
        });
      }
    } catch (err: any) {
      if (err.message === 'CAS_CONFLICT') {
        MetricsCollector.increment('cas_conflict_total');
      }
      return false;
    }
  }
}
