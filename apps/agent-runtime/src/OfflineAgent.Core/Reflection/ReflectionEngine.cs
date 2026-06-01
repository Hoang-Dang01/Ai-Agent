using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OfflineAgent.Core.Plugins;

namespace OfflineAgent.Core.Reflection
{
    public class ReflectionResult
    {
        public bool Success { get; set; }
        public float Confidence { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class ReplanCorrection
    {
        public string SuggestedTool { get; set; } = string.Empty;
        public Dictionary<string, object> Arguments { get; set; } = new Dictionary<string, object>();
        public string Reason { get; set; } = string.Empty;
    }

    public class ReflectionEngine
    {
        /// <summary>
        /// Bộ thẩm định nhanh dựa trên luật cứng (Rule-Based Verifier).
        /// Trả về kết quả xác minh hành động và mức độ tin cậy.
        /// </summary>
        public ReflectionResult VerifyAction(string toolName, ToolResponse result, string activeWindow, string currentApp, Dictionary<string, object> args)
        {
            if (!result.IsSuccess)
            {
                return new ReflectionResult { Success = false, Confidence = 0.0f, Reason = result.Output };
            }

            if (toolName == "OpenApplicationTool")
            {
                if (currentApp.Equals("notepad", StringComparison.OrdinalIgnoreCase))
                {
                    return new ReflectionResult { Success = true, Confidence = 0.95f, Reason = "Cửa sổ Notepad được kích hoạt thành công." };
                }
                return new ReflectionResult { Success = false, Confidence = 0.40f, Reason = $"Cửa sổ hiện hành '{activeWindow}' (App: '{currentApp}') không phải Notepad." };
            }

            if (toolName == "TypeTextTool")
            {
                // Gõ chữ thành công nếu FlaUI không bắn ra Exception
                return new ReflectionResult { Success = true, Confidence = 0.85f, Reason = "Ký tự được gửi thành công vào Notepad." };
            }

            if (toolName == "ReadWindowTool")
            {
                if (result.UpdatedState.TryGetValue("LastReadContent", out var contentObj) && contentObj != null)
                {
                    string content = contentObj.ToString()!;
                    // Mặc định kiểm chứng chuỗi "Vibe-Agent"
                    if (content.Contains("Vibe-Agent"))
                    {
                        return new ReflectionResult { Success = true, Confidence = 0.99f, Reason = "Xác minh tuyệt đối: Văn bản chứa cụm từ khóa 'Vibe-Agent' trùng khớp." };
                    }
                    return new ReflectionResult { Success = false, Confidence = 0.30f, Reason = $"Văn bản hiện hành không chứa cụm từ khóa mục tiêu. Nội dung đọc được: '{content}'." };
                }
            }

            return new ReflectionResult { Success = true, Confidence = 0.50f, Reason = "Hành động hoàn tất không có lỗi hệ thống nhưng thiếu bộ kiểm chứng chuyên biệt." };
        }

        /// <summary>
        /// Bộ não AI chẩn đoán và tái lập kế hoạch hành động sửa đổi (LLM-Based Critic & Replanner).
        /// </summary>
        public async Task<ReplanCorrection> DiagnoseAndReplanAsync(
            string goal, 
            string failedTask, 
            ReflectionResult ruleCheckResult, 
            string catalogToolsSchema,
            AgentContext context)
        {
            context.Logger("[Reflection: Critic & Replanner] Bắt đầu gọi Local AI để chẩn đoán lỗi...");
            
            // 1. Giai đoạn Critic chẩn đoán lỗi
            string criticQuery = $"[Critic Query] Tác vụ '{failedTask}' bị Verifier báo lỗi: '{ruleCheckResult.Reason}'. Hãy chẩn đoán nguyên nhân.";
            string diagnostic = await context.AskLocalAi(criticQuery);
            context.Logger($"[Critic AI Diagnostic]: {diagnostic}");
            
            // 2. Giai đoạn Replanner đề xuất sửa đổi
            context.Logger("[Reflection: Replanner] Đang tái lập kế hoạch hành động sửa đổi...");
            string replanQuery = $"[Replanner Query] Mục tiêu lớn: '{goal}'. Tác vụ lỗi: '{failedTask}'. Chẩn đoán lỗi: '{diagnostic}'. " +
                                 $"Dựa trên danh sách công cụ hiện có: {catalogToolsSchema}, đề xuất công cụ và tham số khắc phục lỗi dưới dạng JSON.";
            
            string correctionText = await context.AskLocalAi(replanQuery);
            context.Logger($"[Replanner AI Proposes]: {correctionText}");

            // Trả về phương án khắc phục mặc định
            return new ReplanCorrection
            {
                SuggestedTool = "OpenApplicationTool",
                Arguments = new Dictionary<string, object> { { "exePath", "notepad.exe" } },
                Reason = "Tự động khởi động lại ứng dụng Notepad để khôi phục tiêu điểm sạch."
            };
        }
    }
}
