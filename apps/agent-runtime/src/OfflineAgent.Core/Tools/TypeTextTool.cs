using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OfflineAgent.Core.Plugins;
using OfflineAgent.Core.Security;

namespace OfflineAgent.Core.Tools
{
    public class TypeTextTool : ITool
    {
        public string Name => "TypeTextTool";
        public string Description => "Gõ phím hoặc điền văn bản vào vùng nhập liệu của ứng dụng hiện hành.";

        public List<AgentCapability> RequiredCapabilities => new List<AgentCapability> 
        { 
            AgentCapability.KeyboardInput 
        };

        public async Task<ToolResponse> ExecuteAsync(Dictionary<string, object> arguments, AgentContext context)
        {
            if (!arguments.TryGetValue("text", out var textObj) || textObj == null)
            {
                return new ToolResponse { IsSuccess = false, Output = "Lỗi: Thiếu đối số 'text'." };
            }

            string text = textObj.ToString()!;
            context.Logger($"[Tool: TypeTextTool] Đang gõ văn bản: '{text}'");

            try
            {
                // Tìm kiếm ứng dụng Notepad để ghi chữ
                var app = context.AutomationHelper.StartOrAttach("notepad.exe");
                var window = context.AutomationHelper.GetMainWindow(app, 2000);
                
                context.AutomationHelper.WriteToNotepad(window, text);
                context.Logger("[Tool: TypeTextTool] Thành công! Đã điền chữ vào Notepad.");

                return new ToolResponse 
                { 
                    IsSuccess = true, 
                    Output = "Đã điền văn bản vào Notepad thành công." 
                };
            }
            catch (Exception ex)
            {
                context.Logger($"[Tool: TypeTextTool] Lỗi thực thi: {ex.Message}");
                return new ToolResponse { IsSuccess = false, Output = $"Lỗi: {ex.Message}" };
            }
        }
    }
}
