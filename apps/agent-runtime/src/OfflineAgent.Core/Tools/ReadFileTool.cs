using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using OfflineAgent.Core.Plugins;
using OfflineAgent.Core.Security;
using OfflineAgent.Core.ToolRegistry;

namespace OfflineAgent.Core.Tools
{
    [ToolParameter("path", "string", "Đường dẫn file cần đọc.", true)]
    public class ReadFileTool : ITool
    {
        public string Name => "ReadFileTool";
        public string Description => "Đọc nội dung một file.";
        
        public List<AgentCapability> RequiredCapabilities => new List<AgentCapability> 
        { 
            AgentCapability.ReadFiles 
        };

        public List<ToolPredicate> Preconditions => new List<ToolPredicate>
        {
            new ToolPredicate { Predicate = "allowed", EntityType = "read" },
            new ToolPredicate { Predicate = "exists", EntityType = "file", EntityIdParameter = "path", TargetValue = true }
        };

        public List<ToolPredicate> Effects => new List<ToolPredicate>();

        public async Task<ToolResponse> ExecuteAsync(Dictionary<string, object> arguments, AgentContext context)
        {
            if (!arguments.TryGetValue("path", out var pathObj) || pathObj == null)
            {
                return new ToolResponse { IsSuccess = false, Output = "Lỗi: Thiếu tham số 'path'." };
            }
            string path = pathObj.ToString()!;
            context.Logger($"[Tool: ReadFileTool] Đang đọc file: {path}");
            try
            {
                if (File.Exists(path))
                {
                    string content = await File.ReadAllTextAsync(path);
                    return new ToolResponse { IsSuccess = true, Output = content };
                }
                return new ToolResponse { IsSuccess = false, Output = $"File không tồn tại: {path}" };
            }
            catch (Exception ex)
            {
                return new ToolResponse { IsSuccess = false, Output = $"Lỗi đọc file: {ex.Message}" };
            }
        }
    }
}
