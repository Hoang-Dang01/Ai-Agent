using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FlaUI.Core.Definitions;
using OfflineAgent.Core.Plugins;
using OfflineAgent.Core.Security;

namespace OfflineAgent.Core.Tools
{
    public class ReadWindowTool : ITool
    {
        public string Name => "ReadWindowTool";
        public string Description => "Đọc tiêu đề và nội dung văn bản hiện hành trong cửa sổ để quan sát (Observer).";

        public List<AgentCapability> RequiredCapabilities => new List<AgentCapability> 
        { 
            AgentCapability.ReadFiles 
        };

        public List<ToolPredicate> Preconditions => new List<ToolPredicate>
        {
            new ToolPredicate { Predicate = "allowed", EntityType = "read" }
        };

        public List<ToolPredicate> Effects => new List<ToolPredicate>
        {
            new ToolPredicate { Predicate = "read", EntityType = "window" }
        };

        public async Task<ToolResponse> ExecuteAsync(Dictionary<string, object> arguments, AgentContext context)
        {
            context.Logger("[Tool: ReadWindowTool] Đang đọc trạng thái cửa sổ...");

            try
            {
                var app = context.AutomationHelper.StartOrAttach("notepad.exe");
                var window = context.AutomationHelper.GetMainWindow(app, 2000);
                context.AutomationHelper.EnsureWindowFocus(window);

                var editElement = window.FindFirstDescendant(cf => cf.ByControlType(ControlType.Document)) 
                                  ?? window.FindFirstDescendant(cf => cf.ByClassName("Edit"));

                string content = "[Trống]";
                if (editElement != null && editElement.Patterns.Value.IsSupported)
                {
                    content = editElement.Patterns.Value.Pattern.Value;
                }

                context.Logger($"[Tool: ReadWindowTool] Thành công! Cửa sổ: '{window.Title}', Kích thước chữ: {content.Length} ký tự.");

                var updatedState = new Dictionary<string, object>
                {
                    { "ActiveWindow", window.Title },
                    { "LastReadContent", content }
                };

                return new ToolResponse 
                { 
                    IsSuccess = true, 
                    Output = $"Cửa sổ hiện tại: '{window.Title}'. Nội dung văn bản: '{content}'.",
                    UpdatedState = updatedState
                };
            }
            catch (Exception ex)
            {
                context.Logger($"[Tool: ReadWindowTool] Lỗi thực thi: {ex.Message}");
                return new ToolResponse { IsSuccess = false, Output = $"Lỗi: {ex.Message}" };
            }
        }
    }
}
