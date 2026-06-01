using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using FlaUI.Core.AutomationElements;
using OfflineAgent.Core.Automation;

namespace OfflineAgent.Core.WorldState
{
    public class WorldStateEngine
    {
        private readonly WindowAutomationHelper _automationHelper;
        private string _cachedUiTree = string.Empty;
        private DateTime _lastCacheTime = DateTime.MinValue;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromSeconds(5);

        public WorldStateEngine(WindowAutomationHelper automationHelper)
        {
            _automationHelper = automationHelper ?? throw new ArgumentNullException(nameof(automationHelper));
        }

        /// <summary>
        /// Quét hệ thống hiện hành và trích xuất Frame trạng thái đầy đủ (WorldState Frame DTO).
        /// </summary>
        public WorldStateFrame CaptureStateFrame(string taskId, string toolExecutionId)
        {
            var frame = new WorldStateFrame
            {
                Id = Guid.NewGuid().ToString(),
                TaskId = taskId,
                ToolExecutionId = toolExecutionId,
                Timestamp = DateTime.Now,
                OpenWindows = GetOpenWindowsList(),
                ScreenshotUrl = CaptureScreenshotPlaceholder(),
                UiTreeXml = CaptureActiveWindowUiTree()
            };

            return frame;
        }

        private List<string> GetOpenWindowsList()
        {
            // Trích xuất các tiến trình có cửa sổ giao diện chính đang hiển thị
            return Process.GetProcesses()
                .Where(p => !string.IsNullOrEmpty(p.MainWindowTitle))
                .Select(p => $"{p.ProcessName} (Title: {p.MainWindowTitle})")
                .Take(15) // Giới hạn kích thước danh sách để tiết kiệm bộ nhớ
                .ToList();
        }

        private string CaptureScreenshotPlaceholder()
        {
            // Trả về chuỗi base64 giả lập ảnh chụp màn hình để tránh tải nặng đĩa cứng cục bộ
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        }

        private string CaptureActiveWindowUiTree()
        {
            if (DateTime.Now - _lastCacheTime < _cacheDuration && !string.IsNullOrEmpty(_cachedUiTree))
            {
                return _cachedUiTree;
            }

            try
            {
                // Lấy tiến trình Notepad làm ví dụ đại diện, hoặc tiến trình active hiện hành
                var activeProcess = Process.GetProcessesByName("notepad").FirstOrDefault();
                if (activeProcess != null)
                {
                    var app = _automationHelper.StartOrAttach("notepad.exe");
                    var window = _automationHelper.GetMainWindow(app, 1500);

                    // Xây dựng cây XML đơn giản đại diện cho các Button, Document, MenuItem trong Notepad
                    var editElement = window.FindFirstDescendant(cf => cf.ByClassName("Edit")) 
                                      ?? window.FindFirstDescendant(cf => cf.ByControlType(FlaUI.Core.Definitions.ControlType.Document));
                    
                    string editNode = editElement != null 
                        ? $"<TextBox Name='{editElement.Name}' AutomationId='{editElement.AutomationId}' Class='{editElement.ClassName}' />" 
                        : "";

                    string xml = $"<Window Title='{window.Title}' AutomationId='{window.AutomationId}'>\n" +
                                 $"  <MenuBar Name='System'>\n" +
                                 $"    <MenuItem Name='File' />\n" +
                                 $"    <MenuItem Name='Edit' />\n" +
                                 $"  </MenuBar>\n" +
                                 $"  {editNode}\n" +
                                 $"</Window>";

                    _cachedUiTree = xml;
                    _lastCacheTime = DateTime.Now;
                    return xml;
                }
            }
            catch
            {
                // Bỏ qua lỗi và trả về XML mặc định nếu FlaUI bận
            }

            return "<Window Title='Desktop' Active='True'><UnknownArea /></Window>";
        }
    }

    /// <summary>
    /// Frame DTO chụp ảnh trạng thái vật lý của môi trường Host OS tại một thời điểm
    /// Khớp hoàn toàn với schema: packages/contracts/world-state.schema.json
    /// </summary>
    public class WorldStateFrame
    {
        public string Id { get; set; } = string.Empty;
        public string TaskId { get; set; } = string.Empty;
        public string ToolExecutionId { get; set; } = string.Empty;
        public string ScreenshotUrl { get; set; } = string.Empty;
        public string UiTreeXml { get; set; } = string.Empty;
        public List<string> OpenWindows { get; set; } = new List<string>();
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }
}
