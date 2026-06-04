using System.Collections.Generic;
using System.Threading.Tasks;
using OfflineAgent.Core.Security;

namespace OfflineAgent.Core.Plugins
{
    public class ToolPredicate
    {
        public int SchemaVersion { get; set; } = 1;
        public string Predicate { get; set; } = string.Empty;   // e.g. "allowed", "running", "exists"
        public string EntityType { get; set; } = string.Empty;  // e.g. "write", "app", "file", "network"
        public string? EntityIdParameter { get; set; }          // dynamic parameter binding
        public object TargetValue { get; set; } = true;         // support non-boolean values
    }

    public interface ITool
    {
        string Name { get; }
        string Description { get; }
        List<AgentCapability> RequiredCapabilities { get; }
        List<ToolPredicate> Preconditions { get; }
        List<ToolPredicate> Effects { get; }
        Task<ToolResponse> ExecuteAsync(Dictionary<string, object> arguments, AgentContext context);
    }

    public class ToolResponse
    {
        public bool IsSuccess { get; set; }
        public string Output { get; set; } = string.Empty;
        public Dictionary<string, object> UpdatedState { get; set; } = new Dictionary<string, object>();
    }
}
