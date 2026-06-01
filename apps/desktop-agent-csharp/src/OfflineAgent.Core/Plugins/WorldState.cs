using System;
using System.Collections.Generic;

namespace OfflineAgent.Core.Plugins
{
    public class GoalState
    {
        public string CurrentGoal { get; set; } = string.Empty;
    }

    public class EnvironmentState
    {
        public string ActiveWindow { get; set; } = string.Empty;
        public string CurrentApplication { get; set; } = string.Empty;
        public List<string> OpenWindows { get; set; } = new List<string>();
    }

    public class ExecutionState
    {
        public string CurrentTask { get; set; } = string.Empty;
        public Stack<string> TaskHistory { get; set; } = new Stack<string>();
    }

    public class MemorySnapshot
    {
        public Dictionary<string, object> Facts { get; set; } = new Dictionary<string, object>();
    }

    public class WorldState
    {
        public GoalState Goal { get; set; } = new GoalState();
        public EnvironmentState Environment { get; set; } = new EnvironmentState();
        public ExecutionState Execution { get; set; } = new ExecutionState();
        public MemorySnapshot Memory { get; set; } = new MemorySnapshot();
        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }
}
