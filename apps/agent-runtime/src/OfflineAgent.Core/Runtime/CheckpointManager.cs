using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace OfflineAgent.Core.Runtime
{
    public class CheckpointData
    {
        public string GoalId { get; set; } = string.Empty;
        public string GoalText { get; set; } = string.Empty;
        public List<TaskNode> Nodes { get; set; } = new List<TaskNode>();
        public DateTime SavedTime { get; set; } = DateTime.Now;
    }

    public class CheckpointManager
    {
        private static readonly Lazy<CheckpointManager> _instance = new Lazy<CheckpointManager>(() => new CheckpointManager());
        public static CheckpointManager Instance => _instance.Value;

        private readonly string _checkpointDirectory;

        private CheckpointManager()
        {
            string rootDir = AppDomain.CurrentDomain.BaseDirectory;
            string targetDir = Path.Combine(rootDir, "artifacts", "checkpoints");

            try
            {
                string parentDir = Path.GetFullPath(Path.Combine(rootDir, "..", "..", "..", ".."));
                if (Directory.Exists(parentDir))
                {
                    targetDir = Path.Combine(parentDir, "artifacts", "checkpoints");
                }
            }
            catch
            {
                // Fallback
            }

            _checkpointDirectory = targetDir;

            if (!Directory.Exists(_checkpointDirectory))
            {
                Directory.CreateDirectory(_checkpointDirectory);
            }
        }

        /// <summary>
        /// Đồng bộ và lưu trữ sơ đồ Task Node hiện tại xuống file JSON Checkpoint vật lý.
        /// </summary>
        public void SaveCheckpoint(string goalId, string goalText, List<TaskNode> nodes)
        {
            if (string.IsNullOrEmpty(goalId)) return;

            try
            {
                var data = new CheckpointData
                {
                    GoalId = goalId,
                    GoalText = goalText,
                    Nodes = nodes,
                    SavedTime = DateTime.Now
                };

                string filePath = Path.Combine(_checkpointDirectory, $"checkpoint_{goalId}.json");
                string jsonString = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });

                File.WriteAllText(filePath, jsonString);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CheckpointManager Error] Không thể lưu Checkpoint: {ex.Message}");
            }
        }

        /// <summary>
        /// Tra cứu và khôi phục đồ thị nhiệm vụ từ Checkpoint cũ dựa trên Goal ID.
        /// </summary>
        public CheckpointData LoadCheckpoint(string goalId)
        {
            if (string.IsNullOrEmpty(goalId)) return null;

            try
            {
                string filePath = Path.Combine(_checkpointDirectory, $"checkpoint_{goalId}.json");
                if (File.Exists(filePath))
                {
                    string jsonString = File.ReadAllText(filePath);
                    return JsonSerializer.Deserialize<CheckpointData>(jsonString);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CheckpointManager Error] Không thể khôi phục Checkpoint: {ex.Message}");
            }

            return null;
        }

        /// <summary>
        /// Xóa bỏ Checkpoint sau khi Goal đã hoàn thành trọn vẹn.
        /// </summary>
        public void ClearCheckpoint(string goalId)
        {
            if (string.IsNullOrEmpty(goalId)) return;

            try
            {
                string filePath = Path.Combine(_checkpointDirectory, $"checkpoint_{goalId}.json");
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }
            catch
            {
                // Bỏ qua nếu checkpoint không tồn tại
            }
        }
    }
}
