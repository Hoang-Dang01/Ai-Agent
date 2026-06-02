export class MetricsCollector {
  private static metrics = {
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

  public static increment(metricName: keyof typeof MetricsCollector.metrics, value: number = 1): void {
    if (this.metrics[metricName] !== undefined) {
      this.metrics[metricName] += value;
    }
  }

  public static getMetrics() {
    return { ...this.metrics };
  }

  public static reset(): void {
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
