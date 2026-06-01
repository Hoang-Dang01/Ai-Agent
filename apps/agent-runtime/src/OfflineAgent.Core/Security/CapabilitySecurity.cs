using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OfflineAgent.Core.Plugins;

namespace OfflineAgent.Core.Security
{
    public enum AgentCapability
    {
        ReadFiles,
        WriteFiles,
        DeleteFiles,
        LaunchApps,
        KeyboardInput,
        MouseControl
    }

    public class CapabilitySecurityGuard
    {
        private readonly List<AgentCapability> _grantedCapabilities;

        public CapabilitySecurityGuard(List<AgentCapability> grantedCapabilities)
        {
            _grantedCapabilities = grantedCapabilities ?? new List<AgentCapability>();
        }

        /// <summary>
        /// Kiểm tra xem công cụ hiện hành có đủ đặc quyền để chạy trên hệ điều hành hay không.
        /// Hỗ trợ Human-In-The-Loop (HITL) để xin quyền trực tiếp từ người dùng.
        /// </summary>
        public async Task<SecurityDecision> AuthorizeToolExecutionAsync(ITool tool, AgentContext context)
        {
            context.Logger($"[Capability Guard] Đang thẩm định đặc quyền cho công cụ: {tool.Name}");
            await Task.Delay(200);

            var missingCapabilities = new List<AgentCapability>();

            foreach (var reqCap in tool.RequiredCapabilities)
            {
                // Đối chiếu với enum mới trong Security
                // Lưu ý: convert enum trùng tên giữa Plugins và Security
                var capName = reqCap.ToString();
                if (!Enum.TryParse<AgentCapability>(capName, out var matchedCap) || !_grantedCapabilities.Contains(matchedCap))
                {
                    // Map lại từ enum cũ trong Plugins sang enum mới
                    missingCapabilities.Add(matchedCap);
                }
            }

            if (missingCapabilities.Count == 0)
            {
                context.Logger($"[Capability Guard] OK! Đầy đủ đặc quyền thực thi.");
                return new SecurityDecision { IsAuthorized = true };
            }

            // Phát hiện thiếu quyền -> Kích hoạt cơ chế HITL (Hỏi ý kiến con người để xin ghi đè quyền truy cập)
            string capsStr = string.Join(", ", missingCapabilities);
            context.Logger($"[SECURITY WARNING] Thiếu đặc quyền truy cập: [{capsStr}].");
            context.Logger($"[Capability Guard] Đang tạm dừng để xin cấp quyền bổ sung (Human-In-The-Loop)...");

            if (context.PromptUser != null)
            {
                string approval = context.PromptUser(
                    $"Công cụ '{tool.Name}' yêu cầu quyền bổ sung: [{capsStr}]. Bạn có đồng ý cấp phép tạm thời để tiếp tục không? (y/n):", 
                    "Security Access Request"
                );

                if (approval?.ToLower() == "y")
                {
                    context.Logger($"[HITL Approval] Người dùng ĐÃ phê duyệt cấp quyền tạm thời!");
                    
                    // Thêm các quyền được cấp phép vào danh sách
                    foreach (var cap in missingCapabilities)
                    {
                        _grantedCapabilities.Add(cap);
                    }

                    return new SecurityDecision 
                    { 
                        IsAuthorized = true, 
                        Reason = "Được người dùng ghi đè cấp phép thông qua HITL." 
                    };
                }
            }

            string errMsg = $"[SECURITY BLOCK] Từ chối thực thi! Công cụ '{tool.Name}' yêu cầu đặc quyền [{capsStr}] nhưng Agent bị cấm truy cập.";
            context.Logger(errMsg);

            return new SecurityDecision 
            { 
                IsAuthorized = false, 
                Reason = errMsg 
            };
        }
    }

    public class SecurityDecision
    {
        public bool IsAuthorized { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
