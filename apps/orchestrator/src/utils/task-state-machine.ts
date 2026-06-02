export type TaskStatus = 'QUEUED' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'EXECUTING' | 'RECOVERING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export class TaskStateMachine {
  private static readonly allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
    QUEUED: ['DISPATCHED'],
    DISPATCHED: ['ACKNOWLEDGED', 'FAILED'],
    ACKNOWLEDGED: ['EXECUTING', 'FAILED'],
    EXECUTING: ['COMPLETED', 'FAILED', 'CANCELLED', 'RECOVERING', 'QUEUED'],
    RECOVERING: ['QUEUED', 'FAILED'],
    COMPLETED: [],  // Terminal state
    FAILED: [],     // Terminal state
    CANCELLED: []   // Terminal state
  };

  /**
   * Validates if a transition from `current` to `next` status is permitted.
   */
  public static isValidTransition(current: TaskStatus, next: TaskStatus): boolean {
    if (current === next) return true; // No-op is always valid
    const allowed = this.allowedTransitions[current];
    return allowed ? allowed.includes(next) : false;
  }

  /**
   * Asserts transition is valid or throws an error.
   */
  public static assertTransition(current: TaskStatus, next: TaskStatus): void {
    if (!this.isValidTransition(current, next)) {
      throw new Error(`Invalid task state transition: Cannot change status from '${current}' to '${next}'.`);
    }
  }
}
