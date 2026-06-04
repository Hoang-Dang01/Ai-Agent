using System;
using System.Collections.Generic;

namespace OfflineAgent.Core.WorldState
{
    public class GoalState
    {
        public string CurrentGoal { get; set; } = string.Empty;

        public GoalState Clone()
        {
            return new GoalState { CurrentGoal = this.CurrentGoal };
        }
    }

    public class EnvironmentState
    {
        public string ActiveWindow { get; set; } = string.Empty;
        public string CurrentApplication { get; set; } = string.Empty;
        public List<string> OpenWindows { get; set; } = new List<string>();

        public EnvironmentState Clone()
        {
            return new EnvironmentState
            {
                ActiveWindow = this.ActiveWindow,
                CurrentApplication = this.CurrentApplication,
                OpenWindows = new List<string>(this.OpenWindows)
            };
        }
    }

    public class ExecutionState
    {
        public string CurrentTask { get; set; } = string.Empty;
        public Stack<string> TaskHistory { get; set; } = new Stack<string>();

        public ExecutionState Clone()
        {
            var historyCopy = new Stack<string>(new Stack<string>(this.TaskHistory));
            return new ExecutionState
            {
                CurrentTask = this.CurrentTask,
                TaskHistory = historyCopy
            };
        }
    }

    public class MemorySnapshot
    {
        public Dictionary<string, object> Facts { get; set; } = new Dictionary<string, object>();

        public MemorySnapshot Clone()
        {
            return new MemorySnapshot
            {
                Facts = new Dictionary<string, object>(this.Facts)
            };
        }
    }

    public class WorldState
    {
        public GoalState Goal { get; set; } = new GoalState();
        public EnvironmentState Environment { get; set; } = new EnvironmentState();
        public ExecutionState Execution { get; set; } = new ExecutionState();
        public MemorySnapshot Memory { get; set; } = new MemorySnapshot();
        public DateTime LastUpdated { get; set; } = DateTime.Now;

        public WorldState Clone()
        {
            return new WorldState
            {
                Goal = this.Goal.Clone(),
                Environment = this.Environment.Clone(),
                Execution = this.Execution.Clone(),
                Memory = this.Memory.Clone(),
                LastUpdated = this.LastUpdated
            };
        }
    }
}
