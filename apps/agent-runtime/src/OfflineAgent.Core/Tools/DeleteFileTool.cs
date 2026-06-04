using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using OfflineAgent.Core.Plugins;
using OfflineAgent.Core.Security;
using OfflineAgent.Core.ToolRegistry;

namespace OfflineAgent.Core.Tools
{
    [ToolParameter("path", "string", "Đường dẫn file cần xóa.", true)]
    public class DeleteFileTool : ITool
    {
        public string Name => "DeleteFileTool";
        public string Description => "Xóa một file khỏi hệ thống.";
        
        public List<AgentCapability> RequiredCapabilities => new List<AgentCapability> 
        { 
            AgentCapability.DeleteFiles 
        };

        public List<ToolPredicate> Preconditions => new List<ToolPredicate>
        {
            new ToolPredicate { Predicate = "allowed", EntityType = "write" }
        };

        public List<ToolPredicate> Effects => new List<ToolPredicate>
        {
            new ToolPredicate { Predicate = "exists", EntityType = "file", EntityIdParameter = "path", TargetValue = false }
        };

        public async Task<ToolResponse> ExecuteAsync(Dictionary<string, object> arguments, AgentContext context)
        {
            if (!arguments.TryGetValue("path", out var pathObj) || pathObj == null)
            {
                return new ToolResponse { IsSuccess = false, Output = "Lỗi: Thiếu tham số 'path'." };
            }
            string path = pathObj.ToString()!;
            context.Logger($"[Tool: DeleteFileTool] Đang xóa file: {path}");
            try
            {
                if (File.Exists(path))
                {
                    File.Delete(path);
                    return new ToolResponse { IsSuccess = true, Output = $"Đã xóa file thành công: {path}" };
                }
                return new ToolResponse { IsSuccess = true, Output = $"File không tồn tại: {path}" };
            }
            catch (Exception ex)
            {
                return new ToolResponse { IsSuccess = false, Output = $"Lỗi xóa file: {ex.Message}" };
            }
        }
    }
}
