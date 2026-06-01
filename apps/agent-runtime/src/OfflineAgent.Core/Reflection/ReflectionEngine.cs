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

            // Trích xuất JSON từ phản hồi sinh bởi AI và thực hiện giải tuần tự hóa động
            try
            {
                if (!string.IsNullOrWhiteSpace(correctionText))
                {
                    string jsonText = ExtractJson(correctionText);
                    var options = new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    var proposal = System.Text.Json.JsonSerializer.Deserialize<ReplanCorrection>(jsonText, options);
                    if (proposal != null && !string.IsNullOrEmpty(proposal.SuggestedTool))
                    {
                        context.Logger($"[Reflection: Replanner] Đề xuất tái lập lộ trình từ AI được parse thành công: '{proposal.SuggestedTool}'");
                        return proposal;
                    }
                }
            }
            catch (Exception ex)
            {
                context.Logger($"[Reflection: Replanner Warning] Không thể giải tuần tự hóa phản hồi AI JSON: {ex.Message}. Sử dụng phương án an toàn mặc định.");
            }

            // Phương án an toàn mặc định (Fallback) để đảm bảo độ ổn định tuyệt đối của hệ thống
            return new ReplanCorrection
            {
                SuggestedTool = "OpenApplicationTool",
                Arguments = new Dictionary<string, object> { { "exePath", "notepad.exe" } },
                Reason = "Tự động khởi động lại ứng dụng Notepad để khôi phục tiêu điểm sạch."
            };
        }

        /// <summary>
        /// Trích xuất khối JSON hợp lệ từ chuỗi văn bản tự do của LLM (hỗ trợ Markdown block hoặc chuỗi trần).
        /// </summary>
        private string ExtractJson(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return "{}";
            
            // Tìm kiếm thẻ Code Block Markdown
            int startIndex = text.IndexOf("```json");
            if (startIndex != -1)
            {
                startIndex += 7;
                int endIndex = text.IndexOf("```", startIndex);
                if (endIndex != -1)
                {
                    return text.Substring(startIndex, endIndex - startIndex).Trim();
                }
            }
            else
            {
                startIndex = text.IndexOf("```");
                if (startIndex != -1)
                {
                    startIndex += 3;
                    int endIndex = text.IndexOf("```", startIndex);
                    if (endIndex != -1)
                    {
                        return text.Substring(startIndex, endIndex - startIndex).Trim();
                    }
                }
            }

            // Trích xuất khối đối tượng JSON nằm giữa dấu ngoặc nhọn đầu tiên và cuối cùng
            int firstBrace = text.IndexOf('{');
            int lastBrace = text.LastIndexOf('}');
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace)
            {
                return text.Substring(firstBrace, lastBrace - firstBrace + 1);
            }

            return text.Trim();
        }
    }
}
