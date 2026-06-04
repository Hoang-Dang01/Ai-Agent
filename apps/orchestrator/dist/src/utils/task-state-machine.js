"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStateMachine = void 0;
class TaskStateMachine {
    /**
     * Validates if a transition from `current` to `next` status is permitted.
     */
    static isValidTransition(current, next) {
        if (current === next)
            return true; // No-op is always valid
        const allowed = this.allowedTransitions[current];
        return allowed ? allowed.includes(next) : false;
    }
    /**
     * Asserts transition is valid or throws an error.
     */
    static assertTransition(current, next) {
        if (!this.isValidTransition(current, next)) {
            throw new Error(`Invalid task state transition: Cannot change status from '${current}' to '${next}'.`);
        }
    }
}
exports.TaskStateMachine = TaskStateMachine;
TaskStateMachine.allowedTransitions = {
    QUEUED: ['DISPATCHED'],
    DISPATCHED: ['ACKNOWLEDGED', 'FAILED'],
    ACKNOWLEDGED: ['EXECUTING', 'FAILED'],
    EXECUTING: ['COMPLETED', 'FAILED', 'CANCELLED', 'RECOVERING', 'QUEUED'],
    RECOVERING: ['QUEUED', 'FAILED'],
    COMPLETED: [], // Terminal state
    FAILED: [], // Terminal state
    CANCELLED: [] // Terminal state
};
