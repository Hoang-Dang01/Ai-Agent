"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
class MetricsCollector {
    static increment(metricName, value = 1) {
        if (this.metrics[metricName] !== undefined) {
            this.metrics[metricName] += value;
        }
    }
    static getMetrics() {
        return { ...this.metrics };
    }
    static reset() {
        this.metrics = {
            recovery_attempt_total: 0,
            recovery_success_total: 0,
            recovery_failure_total: 0,
            dlq_total: 0,
            fencing_rejection_total: 0,
            cas_conflict_total: 0,
            outbox_claim_total: 0,
            outbox_publish_total: 0,
            outbox_publish_failure_total: 0,
            lease_recovery_total: 0,
            lease_recovery_failure_total: 0,
            heartbeat_timeout_total: 0,
        };
    }
}
exports.MetricsCollector = MetricsCollector;
MetricsCollector.metrics = {
    recovery_attempt_total: 0,
    recovery_success_total: 0,
    recovery_failure_total: 0,
    dlq_total: 0,
    fencing_rejection_total: 0,
    cas_conflict_total: 0,
    outbox_claim_total: 0,
    outbox_publish_total: 0,
    outbox_publish_failure_total: 0,
    lease_recovery_total: 0,
    lease_recovery_failure_total: 0,
    heartbeat_timeout_total: 0,
};
