using System;
using System.IO;
using System.Linq;
using System.Threading;
using OfflineAgent.Core.Automation;
using OfflineAgent.Core.Plugins;

namespace OfflineAgent.ConsoleApp
{
    class Program
    {
        static void Main(string[] args)
        {
            // Thiết lập mã hóa UTF-8 để in tiếng Việt chuẩn trong console Windows
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.InputEncoding = System.Text.Encoding.UTF8;

            while (true)
            {
                Console.Clear();
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine("==================================================================");
                Console.WriteLine("        OFFLINE C# AI AGENT RUNNER - CONTROL PANEL (NET 9.0)");
                Console.WriteLine("==================================================================");
                Console.ResetColor();
                Console.WriteLine("1. Run FlaUI Windows Automation Test (Notepad Scenarios - No AI)");
                Console.WriteLine("2. Run YOLOv8 ONNX Object Detection (UI Elements - Coming Soon)");
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("3. Run Qwen2.5 1.5B Local ONNX GenAI Model (Direct C# Inference)");
                Console.ResetColor();
                Console.WriteLine("4. View and Run Knowledge Work Plugins (Declarative JSON/Markdown)");
                Console.ResetColor();
                Console.WriteLine("5. Exit");
                Console.WriteLine("==================================================================");
                Console.Write("Enter your selection (1-5): ");

                var input = Console.ReadLine();

                switch (input)
                {
                    case "1":
                        ExecuteFlaUITest();
                        break;
                    case "2":
                        Console.WriteLine("\n[Vision] YOLOv8 ONNX module is under development. Press any key to return...");
                        Console.ReadKey();
                        break;
                    case "3":
                        ExecuteLocalLLM();
                        break;
                    case "4":
                        ExecutePluginsMenu();
                        break;
                    case "5":
                        Console.ForegroundColor = ConsoleColor.Yellow;
                        Console.WriteLine("\nExiting Offline C# Agent. Goodbye!");
                        Console.ResetColor();
                        return;
                    default:
                        Console.WriteLine("\nInvalid selection. Press any key to try again...");
                        Console.ReadKey();
                        break;
                }
            }
        }

        private static void ExecuteFlaUITest()
        {
            Console.Clear();
            Console.WriteLine("==================================================================");
            Console.WriteLine("   RUNNING FLAUI WINDOWS AUTOMATION TEST (NOTEPAD SCENARIOS)");
            Console.WriteLine("==================================================================");
            Console.WriteLine("[System] Step 1: Initializing FlaUI UIA3 Engine...");

            using (var helper = new WindowAutomationHelper())
            {
                try
                {
                    // Khởi chạy hoặc kết nối vào Notepad
                    Console.WriteLine("[System] Step 2: Starting or attaching to Notepad...");
                    var app = helper.StartOrAttach("notepad.exe");

                    // Chờ cửa sổ chính của Notepad xuất hiện
                    Console.WriteLine("[System] Step 3: Fetching main window handle...");
                    var window = helper.GetMainWindow(app);
                    Console.WriteLine($"[System] Success! Connected to Window: '{window.Title}'");

                    // Tự động viết văn bản vào Notepad ngầm dưới hệ thống
                    Console.WriteLine("[System] Step 4: Writing text into Notepad using native Windows API...");
                    string message = $"Hello from Offline C# Agent!\n" +
                                     $"This is an automated Windows OS control demo running 100% offline.\n" +
                                     $"No AI training required. Zero VRAM usage.\n" +
                                     $"Active time: {DateTime.Now:dd-MM-yyyy HH:mm:ss}";
                    
                    helper.WriteToNotepad(window, message);

                    Console.WriteLine("\n==================================================================");
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("✅ TEST COMPLETED SUCCESSFULLY!");
                    Console.ResetColor();
                    Console.WriteLine("Notepad has been written to. You can check the Notepad window.");
                    Console.WriteLine("==================================================================");
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine($"\n[Error] Test failed: {ex.Message}");
                    Console.ResetColor();
                }
            }

            Console.WriteLine("\nPress any key to return to Main Menu...");
            Console.ReadKey();
        }

        private static void ExecuteLocalLLM()
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("==================================================================");
            Console.WriteLine("    RUNNING LOCAL QWEN 2.5 ONNX GENERATIVE AI INFERENCE (C#)");
            Console.WriteLine("==================================================================");
            Console.ResetColor();

            // Khám phá đường dẫn mô hình
            string rootDir = AppDomain.CurrentDomain.BaseDirectory;
            string[] potentialPaths = new[]
            {
                Path.Combine(rootDir, "models", "Qwen2.5-1.5B-Instruct", "onnx"),
                Path.Combine(rootDir, "..", "..", "..", "..", "models", "Qwen2.5-1.5B-Instruct", "onnx"),
                Path.Combine(rootDir, "..", "..", "..", "..", "..", "models", "Qwen2.5-1.5B-Instruct", "onnx")
            };

            string modelPath = potentialPaths.FirstOrDefault(Directory.Exists) ?? string.Empty;

            if (string.IsNullOrEmpty(modelPath))
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[Error] Không tìm thấy thư mục mô hình Qwen2.5 ONNX lượng hóa tại các đường dẫn tiềm năng.");
                Console.WriteLine("Đường dẫn tìm kiếm dự kiến: models\\Qwen2.5-1.5B-Instruct\\onnx\\");
                Console.ResetColor();
                Console.WriteLine("\nBấm phím bất kỳ để quay lại...");
                Console.ReadKey();
                return;
            }

            Console.WriteLine($"[GenAI] Phát hiện thư mục mô hình tại: {Path.GetFullPath(modelPath)}");
            Console.WriteLine("[GenAI] Đang nạp mô hình ONNX vào RAM máy trạm. Vui lòng chờ...");

            try
            {
                using (var llm = new OfflineAgent.Core.Vision.LocalVisionModel(modelPath))
                {
                    llm.Load();
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[GenAI] NẠP MÔ HÌNH THÀNH CÔNG! Trí tuệ AI Cục bộ đã sẵn sàng.");
                    Console.ResetColor();

                    while (true)
                    {
                        Console.WriteLine("\n==================================================================");
                        Console.Write("Nhập câu hỏi cho Local AI (hoặc gõ 'q' để quay lại Menu): ");
                        string question = Console.ReadLine() ?? "";
                        if (question.ToLower() == "q" || string.IsNullOrEmpty(question)) break;

                        Console.ForegroundColor = ConsoleColor.Yellow;
                        Console.WriteLine("\n[Local AI Answer - Streaming Output]:");
                        Console.ResetColor();

                        // Gọi sinh chữ thời gian thực
                        string systemPrompt = "Bạn là trợ lý AI thông minh chạy ngoại tuyến hoàn toàn bằng mã nguồn C# (.NET 9.0). Hãy trả lời ngắn gọn, lịch sự bằng Tiếng Việt.";
                        
                        var task = llm.GenerateTextAsync(systemPrompt, question, piece =>
                        {
                            Console.Write(piece);
                        });

                        task.Wait();
                        Console.WriteLine();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[Error] Lỗi nạp hoặc suy luận mô hình GenAI: {ex.Message}");
                Console.ResetColor();
                Console.WriteLine("\nBấm phím bất kỳ để quay lại...");
                Console.ReadKey();
            }
        }

        private static void ExecutePluginsMenu()
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("==================================================================");
            Console.WriteLine("    KNOWLEDGE WORK PLUGINS ENGINE - DEPLOYMENT CONSOLE");
            Console.WriteLine("==================================================================");
            Console.ResetColor();

            // Khám phá đường dẫn thư mục plugins thích ứng (chạy từ debug/release hoặc dotnet run)
            string rootDir = AppDomain.CurrentDomain.BaseDirectory;

            // Các đường dẫn tìm kiếm tiềm năng cho cả plugins nội bộ và thư mục knowledge-work-plugins mới tải về
            string[] potentialPaths = new[]
            {
                Path.Combine(rootDir, "plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "knowledge-work-plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "src", "knowledge-work-plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "..", "plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "..", "knowledge-work-plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "..", "src", "knowledge-work-plugins")
            };

            Console.WriteLine("[Engine] Đang tự động quét và nạp gộp cấu trúc phòng ban...");

            var loader = new PluginLoader();
            var plugins = new System.Collections.Generic.List<Plugin>();
            var checkedPaths = new System.Collections.Generic.HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var path in potentialPaths)
            {
                try
                {
                    string fullPath = Path.GetFullPath(path);
                    if (Directory.Exists(fullPath) && checkedPaths.Add(fullPath))
                    {
                        var loaded = loader.LoadPlugins(fullPath);
                        foreach (var plugin in loaded)
                        {
                            if (!plugins.Any(p => p.Manifest.Id.Equals(plugin.Manifest.Id, StringComparison.OrdinalIgnoreCase)))
                            {
                                plugins.Add(plugin);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Engine] Cảnh báo lỗi quét đường dẫn '{path}': {ex.Message}");
                }
            }

            if (plugins.Count == 0)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\n[Engine] Không tìm thấy plugin hợp lệ nào trong thư mục. Vui lòng kiểm tra lại cấu hình.");
                Console.ResetColor();
                Console.WriteLine("Bấm phím bất kỳ để quay lại...");
                Console.ReadKey();
                return;
            }

            Console.WriteLine($"\n[Engine] Phát hiện thành công {plugins.Count} phòng ban nghiệp vụ:");
            for (int i = 0; i < plugins.Count; i++)
            {
                Console.WriteLine($"{i + 1}. [{plugins[i].Manifest.Id}] - {plugins[i].Manifest.Name}");
                Console.WriteLine($"   Mô tả: {plugins[i].Manifest.Description}");
            }

            Console.Write("\nChọn phòng ban để làm việc (1-" + plugins.Count + ") hoặc 'q' để quay lại: ");
            string choice = Console.ReadLine() ?? "";
            if (choice.ToLower() == "q") return;

            if (int.TryParse(choice, out int pluginIndex) && pluginIndex >= 1 && pluginIndex <= plugins.Count)
            {
                var selectedPlugin = plugins[pluginIndex - 1];
                ShowPluginDetails(selectedPlugin);
            }
            else
            {
                Console.WriteLine("Lựa chọn không hợp lệ. Bấm phím bất kỳ để quay lại...");
                Console.ReadKey();
            }
        }

        private static void ShowPluginDetails(Plugin plugin)
        {
            while (true)
            {
                Console.Clear();
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("==================================================================");
                Console.WriteLine($"   PHÒNG BAN: {plugin.Manifest.Name.ToUpper()} ({plugin.Manifest.Version})");
                Console.WriteLine("==================================================================");
                Console.ResetColor();
                Console.WriteLine($"Mô tả: {plugin.Manifest.Description}");
                Console.WriteLine();

                // Hiển thị thư viện kỹ năng (Skills)
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("--- THƯ VIỆN KỸ NĂNG (MARKDOWN SKILLS) ---");
                Console.ResetColor();
                if (plugin.Skills.Count == 0)
                {
                    Console.WriteLine("(Trống)");
                }
                else
                {
                    foreach (var skill in plugin.Skills)
                    {
                        Console.WriteLine($"• [Skill] {skill.Name} - {skill.Content.Length} ký tự");
                    }
                }
                Console.WriteLine();

                // Hiển thị các lệnh nghiệp vụ (Commands)
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("--- DANH SÁCH LỆNH TÁC NGHIỆP (SLASH COMMANDS) ---");
                Console.ResetColor();
                if (plugin.Manifest.Commands.Count == 0)
                {
                    Console.WriteLine("(Trống)");
                }
                else
                {
                    for (int i = 0; i < plugin.Manifest.Commands.Count; i++)
                    {
                        var cmd = plugin.Manifest.Commands[i];
                        Console.WriteLine($"{i + 1}. {cmd.Name} - {cmd.Description}");
                    }
                }

                Console.Write("\nChọn số lệnh để giả lập thực thi hoặc 'q' để quay lại menu trước: ");
                string choice = Console.ReadLine() ?? "";
                if (choice.ToLower() == "q") return;

                if (int.TryParse(choice, out int cmdIndex) && cmdIndex >= 1 && cmdIndex <= plugin.Manifest.Commands.Count)
                {
                    var selectedCmd = plugin.Manifest.Commands[cmdIndex - 1];
                    RunSimulatedCommand(plugin, selectedCmd);
                }
                else
                {
                    Console.WriteLine("Lựa chọn không hợp lệ. Bấm phím bất kỳ để thử lại...");
                    Console.ReadKey();
                }
            }
        }

        private static void RunSimulatedCommand(Plugin plugin, PluginCommand command)
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("==================================================================");
            Console.WriteLine($"   MÔ PHỎNG LỆNH: {command.Name}");
            Console.WriteLine("==================================================================");
            Console.ResetColor();

            Console.WriteLine("[Engine] Đang trích xuất tri thức từ tài liệu Markdown và ghép nối Prompt...");
            Thread.Sleep(500);

            // Tự động xây dựng prompt tổng hợp
            var builder = new PluginPromptBuilder();
            
            // Lấy tri thức lõi từ AGENTS.md nếu có
            string agentsDoctrine = "";
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string agentsMdPath = Path.Combine(baseDir, "AGENTS.md");
            if (!File.Exists(agentsMdPath))
            {
                agentsMdPath = Path.Combine(baseDir, "..", "..", "..", "..", "AGENTS.md");
            }
            if (File.Exists(agentsMdPath))
            {
                agentsDoctrine = File.ReadAllText(agentsMdPath);
            }

            string finalPrompt = builder.BuildSystemPrompt(plugin, command, agentsDoctrine);

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\n[Prompt Builder] KẾT QUẢ TỔNG HỢP SYSTEM PROMPT HỢP NHẤT:");
            Console.WriteLine("------------------------------------------------------------------");
            Console.ResetColor();
            
            // In ra prompt tổng hợp với màu sắc khác
            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.WriteLine(finalPrompt);
            Console.ResetColor();

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("------------------------------------------------------------------");
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"\n[Offline-Agent] BỘ PROMPT TỔNG HỢP TRÊN ĐÃ SẴN SÀNG CHO ONNX GENAI!");
            Console.ResetColor();
            Console.WriteLine("Lưu ý: Tri thức này sẽ được nạp thẳng vào RAM làm System Instructions.");
            Console.WriteLine("Bấm phím bất kỳ để quay lại menu phòng ban...");
            Console.ReadKey();
        }
    }
}

