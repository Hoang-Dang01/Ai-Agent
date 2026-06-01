using System.Collections.Generic;
using System.Threading.Tasks;

namespace OfflineAgent.Core.Plugins
{
    public interface ITool
    {
        string Name { get; }
        string Description { get; }
        List<AgentCapability> RequiredCapabilities { get; }
        Task<ToolResponse> ExecuteAsync(Dictionary<string, object> arguments, AgentContext context);
    }

    public class ToolResponse
    {
        public bool IsSuccess { get; set; }
        public string Output { get; set; } = string.Empty;
        public Dictionary<string, object> UpdatedState { get; set; } = new Dictionary<string, object>();
    }
}
