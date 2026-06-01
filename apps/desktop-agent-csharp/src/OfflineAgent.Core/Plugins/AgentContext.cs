using System;
using System.Threading.Tasks;
using OfflineAgent.Core.Automation;

namespace OfflineAgent.Core.Plugins
{
    public class AgentContext
    {
        /// <summary>
        /// Bộ công cụ điều khiển giao diện ứng dụng Windows chuẩn (FlaUI).
        /// </summary>
        public WindowAutomationHelper AutomationHelper { get; }

        /// <summary>
        /// Cổng ghi nhận log nghiệp vụ (để in ra Console hoặc hiển thị trực quan lên WPF).
        /// </summary>
        public Action<string> Logger { get; }

        /// <summary>
        /// Hàm đại diện cho cổng gọi suy luận LLM/VLM cục bộ.
        /// </summary>
        public Func<string, Task<string>> AskLocalAi { get; }

        /// <summary>
        /// Hàm đại diện cho cổng yêu cầu dữ liệu đầu vào trực quan từ người dùng (WPF Input Dialog hoặc Console ReadLine).
        /// </summary>
        public Func<string, string, string>? PromptUser { get; set; }

        public AgentContext(WindowAutomationHelper automationHelper, Action<string> logger, Func<string, Task<string>> askLocalAi)
        {
            AutomationHelper = automationHelper ?? throw new ArgumentNullException(nameof(automationHelper));
            Logger = logger ?? throw new ArgumentNullException(nameof(logger));
            AskLocalAi = askLocalAi ?? throw new ArgumentNullException(nameof(askLocalAi));
        }
    }
}
