using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace OfflineAgent.Core.Runtime
{
    public class JournalEntry
    {
        public string GoalId { get; set; } = string.Empty;
        public string TaskId { get; set; } = string.Empty;
        public string ToolName { get; set; } = string.Empty;
        public Dictionary<string, object> InputArgs { get; set; } = new Dictionary<string, object>();
        public string OutputResult { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }

    public class ExecutionJournal
    {
        private static readonly Lazy<ExecutionJournal> _instance = new Lazy<ExecutionJournal>(() => new ExecutionJournal());
        public static ExecutionJournal Instance => _instance.Value;

        private readonly string _journalFilePath;
        private readonly object _lockObj = new object();

        private ExecutionJournal()
        {
            // Thiết lập tệp tin lưu trữ Journal vật lý trong thư mục artifacts
            string rootDir = AppDomain.CurrentDomain.BaseDirectory;
            string artifactsDir = Path.Combine(rootDir, "artifacts", "logs");

            try
            {
                string parentDir = Path.GetFullPath(Path.Combine(rootDir, "..", "..", "..", ".."));
                if (Directory.Exists(parentDir))
                {
                    artifactsDir = Path.Combine(parentDir, "artifacts", "logs");
                }
            }
            catch
            {
                // Fallback
            }

            if (!Directory.Exists(artifactsDir))
            {
                Directory.CreateDirectory(artifactsDir);
            }

            _journalFilePath = Path.Combine(artifactsDir, "journal.jsonl");
        }

        /// <summary>
        /// Ghi lại một bản ghi giao dịch (Journal Entry) dạng JSON Line (JSONL).
        /// Cực kỳ tiết kiệm hiệu năng do chỉ cần thực hiện Append văn bản thô, tránh đọc/ghi đè toàn bộ tệp tin.
        /// </summary>
        public void RecordEntry(JournalEntry entry)
        {
            if (entry == null) return;

            lock (_lockObj)
            {
                try
                {
                    string jsonLine = JsonSerializer.Serialize(entry);
                    File.AppendAllText(_journalFilePath, jsonLine + "\n");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ExecutionJournal Error] Không thể ghi nhận Journal: {ex.Message}");
                }
            }
        }
    }
}
