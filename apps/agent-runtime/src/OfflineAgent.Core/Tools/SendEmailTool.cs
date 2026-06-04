using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OfflineAgent.Core.Plugins;
using OfflineAgent.Core.Security;
using OfflineAgent.Core.ToolRegistry;

namespace OfflineAgent.Core.Tools
{
    [ToolParameter("email", "string", "Địa chỉ email người nhận.", true)]
    [ToolParameter("subject", "string", "Tiêu đề email.", true)]
    [ToolParameter("body", "string", "Nội dung email.", true)]
    public class SendEmailTool : ITool
    {
        public string Name => "SendEmailTool";
        public string Description => "Gửi email báo cáo.";
        
        public List<AgentCapability> RequiredCapabilities => new List<AgentCapability> 
        { 
            AgentCapability.KeyboardInput 
        };

        public List<ToolPredicate> Preconditions => new List<ToolPredicate>
        {
            new ToolPredicate { Predicate = "allowed", EntityType = "network", TargetValue = true }
        };

        public List<ToolPredicate> Effects => new List<ToolPredicate>();

        public async Task<ToolResponse> ExecuteAsync(Dictionary<string, object> arguments, AgentContext context)
        {
            return new ToolResponse { IsSuccess = true, Output = "Đã gửi email thành công (mô phỏng)." };
        }
    }
}
