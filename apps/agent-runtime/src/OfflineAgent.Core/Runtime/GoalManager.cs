using System;
using OfflineAgent.Core.Events;

namespace OfflineAgent.Core.Runtime
{
    public enum GoalStatus
    {
        Pending,
        Running,
        WaitingApproval,
        Completed,
        Failed
    }

    public class GoalRuntime
    {
        public string GoalId { get; set; } = Guid.NewGuid().ToString();
        public string GoalText { get; set; } = string.Empty;
        public GoalStatus Status { get; set; } = GoalStatus.Pending;
        public DateTime StartTime { get; set; } = DateTime.Now;
        public DateTime? EndTime { get; set; }
        public string ExecutionReason { get; set; } = string.Empty;

        public TimeSpan Duration => (EndTime ?? DateTime.Now) - StartTime;
    }

    public class GoalManager
    {
        private static readonly Lazy<GoalManager> _instance = new Lazy<GoalManager>(() => new GoalManager());
        public static GoalManager Instance => _instance.Value;

        public GoalRuntime ActiveGoal { get; private set; }

        private GoalManager()
        {
        }

        public GoalRuntime StartGoal(string goalText)
        {
            ActiveGoal = new GoalRuntime
            {
                GoalText = goalText,
                Status = GoalStatus.Running,
                StartTime = DateTime.Now
            };

            EventBus.Instance.Publish(new AgentEvent
            {
                Type = AgentEventType.TaskStarted, // Map sang TaskStarted làm đại diện cho mục tiêu chung
                Source = "GoalManager",
                Message = $"[Goal Started] Mục tiêu lớn kích hoạt: '{goalText}' (ID: {ActiveGoal.GoalId})"
            });

            return ActiveGoal;
        }

        public void CompleteGoal(bool success, string reason = "")
        {
            if (ActiveGoal == null) return;

            ActiveGoal.Status = success ? GoalStatus.Completed : GoalStatus.Failed;
            ActiveGoal.EndTime = DateTime.Now;
            ActiveGoal.ExecutionReason = reason;

            EventBus.Instance.Publish(new AgentEvent
            {
                Type = success ? AgentEventType.StateChanged : AgentEventType.ToolFailed,
                Source = "GoalManager",
                Message = $"[Goal Finished] Mục tiêu hoàn tất. Kết quả: {ActiveGoal.Status} | Thời gian: {ActiveGoal.Duration.TotalSeconds:F2} giây. Lý do: {reason}"
            });
        }
    }
}
