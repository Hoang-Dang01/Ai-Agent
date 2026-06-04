using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using OfflineAgent.Core.Plugins;
using OfflineAgent.Core.Security;
using OfflineAgent.Core.ToolRegistry;

namespace OfflineAgent.Core.Tools
{
    [ToolParameter("exePath", "string", "Đường dẫn vật lý đến file thực thi (.exe) của ứng dụng.", true)]
    public class OpenApplicationTool : ITool
    {
        public string Name => "OpenApplicationTool";
        public string Description => "Khởi chạy một ứng dụng mới hoặc kết nối vào tiến trình đang chạy (Ví dụ: notepad.exe).";
        
        public List<AgentCapability> RequiredCapabilities => new List<AgentCapability> 
        { 
            AgentCapability.LaunchApps 
        };

        public List<ToolPredicate> Preconditions => new List<ToolPredicate>
        {
            new ToolPredicate { Predicate = "allowed", EntityType = "app_open" }
        };

        public List<ToolPredicate> Effects => new List<ToolPredicate>
        {
            new ToolPredicate { Predicate = "running", EntityType = "app", EntityIdParameter = "exePath" }
        };

        public async Task<ToolResponse> ExecuteAsync(Dictionary<string, object> arguments, AgentContext context)
        {
            if (!arguments.TryGetValue("exePath", out var pathObj) || pathObj == null)
            {
                return new ToolResponse { IsSuccess = false, Output = "Lỗi: Thiếu đối số 'exePath'." };
            }

            string exePath = pathObj.ToString()!;
            context.Logger($"[Tool: OpenApplicationTool] Khởi chạy hoặc gắn vào: {exePath}");

            try
            {
                var app = context.AutomationHelper.StartOrAttach(exePath);
                var window = context.AutomationHelper.GetMainWindow(app, 3000);
                
                context.Logger($"[Tool: OpenApplicationTool] Thành công! Đã kết nối cửa sổ: '{window.Title}'");

                var updatedState = new Dictionary<string, object>
                {
                    { "CurrentApplication", Path.GetFileNameWithoutExtension(exePath) },
                    { "ActiveWindow", window.Title }
                };

                return new ToolResponse 
                { 
                    IsSuccess = true, 
                    Output = $"Đã mở thành công '{exePath}' và kết nối vào cửa sổ '{window.Title}'.",
                    UpdatedState = updatedState
                };
            }
            catch (Exception ex)
            {
                context.Logger($"[Tool: OpenApplicationTool] Lỗi thực thi: {ex.Message}");
                return new ToolResponse { IsSuccess = false, Output = $"Lỗi: {ex.Message}" };
            }
        }
    }
}
