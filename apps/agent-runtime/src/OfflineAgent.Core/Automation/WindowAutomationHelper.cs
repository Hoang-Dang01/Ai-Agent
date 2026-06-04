using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using FlaUI.Core;
using FlaUI.Core.AutomationElements;
using FlaUI.Core.Definitions;
using FlaUI.UIA3;

namespace OfflineAgent.Core.Automation
{
    public class WindowAutomationHelper : IDisposable
    {
        private readonly UIA3Automation _automation;
        private readonly List<Application> _trackedApplications = new List<Application>();

        public WindowAutomationHelper()
        {
            // Khởi tạo engine giao tiếp UI Automation 3 của Microsoft
            _automation = new UIA3Automation();
        }

        /// <summary>
        /// Khởi chạy một tiến trình ứng dụng mới hoặc kết nối vào tiến trình đang chạy.
        /// </summary>
        public Application StartOrAttach(string exePathOrName)
        {
            string processName = Path.GetFileNameWithoutExtension(exePathOrName);
            var existingProcess = Process.GetProcessesByName(processName).FirstOrDefault();

            if (existingProcess != null)
            {
                Console.WriteLine($"[Automation] Connecting to running process: {processName} (PID: {existingProcess.Id})");
                return Application.Attach(existingProcess);
            }
            else
            {
                Console.WriteLine($"[Automation] Starting new process: {exePathOrName}");
                var app = Application.Launch(exePathOrName);
                _trackedApplications.Add(app);
                return app;
            }
        }

        /// <summary>
        /// Lấy cửa sổ chính của ứng dụng với cơ chế đợi (Timeout).
        /// </summary>
        public Window GetMainWindow(Application app, int timeoutMs = 5000)
        {
            var stopwatch = Stopwatch.StartNew();
            while (stopwatch.ElapsedMilliseconds < timeoutMs)
            {
                var window = app.GetMainWindow(_automation);
                if (window != null)
                {
                    return window;
                }
                Thread.Sleep(200);
            }
            throw new TimeoutException("[Automation] Timeout waiting for main window to load.");
        }

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        /// <summary>
        /// Đảm bảo cửa sổ đích đang ở foreground và có tiêu điểm (focus).
        /// Hỗ trợ phục hồi tiêu điểm nếu bị mất (Focus Loss).
        /// </summary>
        public void EnsureWindowFocus(Window window)
        {
            if (window == null) return;

            try
            {
                IntPtr foregroundHwnd = GetForegroundWindow();
                IntPtr targetHwnd = window.Properties.NativeWindowHandle.Value;
                
                // So sánh nếu cửa sổ hiện tại không phải là foreground window
                if (foregroundHwnd != targetHwnd)
                {
                    Console.WriteLine($"[Automation] Focus lost! Bringing window '{window.Title}' back to foreground.");
                    window.SetForeground();
                    Thread.Sleep(200); // Đợi cửa sổ được vẽ/kích hoạt
                    window.Focus();
                    Thread.Sleep(100);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Automation Warning] Error ensuring focus: {ex.Message}. Attempting direct activation.");
                try
                {
                    window.SetForeground();
                    window.Focus();
                }
                catch { /* ignore */ }
            }
        }

        /// <summary>
        /// Tự động tìm kiếm vùng nhập liệu chính của Notepad (hỗ trợ cả Windows 10 và Windows 11) và điền văn bản.
        /// </summary>
        public void WriteToNotepad(Window window, string text)
        {
            EnsureWindowFocus(window);

            // Windows 10 Notepad sử dụng lớp control là "Edit"
            // Windows 11 Notepad sử dụng control dạng Document hoặc lớp "RichEditD2DPT"
            var editElement = window.FindFirstDescendant(cf => cf.ByControlType(ControlType.Document)) 
                              ?? window.FindFirstDescendant(cf => cf.ByClassName("Edit"));

            if (editElement != null)
            {
                // Active cửa sổ lên trước khi nhập liệu để đảm bảo bắt tiêu điểm
                editElement.Focus();
                Thread.Sleep(50);
                
                // Sử dụng ValuePattern để ghi chữ ngầm trực tiếp mà không cần di chuyển chuột
                if (editElement.Patterns.Value.IsSupported)
                {
                    editElement.Patterns.Value.Pattern.SetValue(text);
                    Console.WriteLine("[Automation] Text written successfully via ValuePattern.");
                }
                else
                {
                    // Nếu ValuePattern không được hỗ trợ, sử dụng cơ chế gõ phím mô phỏng
                    editElement.Focus();
                    editElement.AsTextBox().Text = text;
                    Console.WriteLine("[Automation] Text written successfully via TextBox Text property.");
                }
            }
            else
            {
                throw new InvalidOperationException("[Automation] Could not find the edit area in Notepad window.");
            }
        }

        /// <summary>
        /// Giải phóng tài nguyên UI Automation và dọn dẹp các ứng dụng đã khởi chạy.
        /// </summary>
        public void Dispose()
        {
            foreach (var app in _trackedApplications)
            {
                try
                {
                    if (app != null)
                    {
                        if (!app.HasExited)
                        {
                            Console.WriteLine($"[Automation Cleanup] Closing tracked application PID: {app.ProcessId}");
                            app.Close();
                            
                            int waitTime = 0;
                            while (!app.HasExited && waitTime < 1000)
                            {
                                Thread.Sleep(100);
                                waitTime += 100;
                            }
                            
                            if (!app.HasExited)
                            {
                                Console.WriteLine($"[Automation Cleanup] Force killing tracked application PID: {app.ProcessId}");
                                app.Kill();
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Automation Cleanup Warning] Error closing application: {ex.Message}");
                }
            }
            _trackedApplications.Clear();
            _automation?.Dispose();
        }
    }
}
