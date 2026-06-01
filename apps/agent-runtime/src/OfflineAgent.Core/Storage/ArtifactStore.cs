using System;
using System.IO;

namespace OfflineAgent.Core.Storage
{
    public class ArtifactStore
    {
        private static readonly Lazy<ArtifactStore> _instance = new Lazy<ArtifactStore>(() => new ArtifactStore());
        public static ArtifactStore Instance => _instance.Value;

        private readonly string _baseArtifactsDirectory;

        private ArtifactStore()
        {
            // Thiết lập đường dẫn thư mục lưu trữ Artifacts vật lý tại thư mục gốc của giải pháp chạy
            string rootDir = AppDomain.CurrentDomain.BaseDirectory;
            
            // Tìm ngược lên thư mục gốc của monorepo
            string targetDir = Path.Combine(rootDir, "artifacts");
            try
            {
                // Thử tìm thư mục gốc monorepo nếu chạy trong debug/release
                string parentDir = Path.GetFullPath(Path.Combine(rootDir, "..", "..", "..", ".."));
                if (Directory.Exists(parentDir))
                {
                    targetDir = Path.Combine(parentDir, "artifacts");
                }
            }
            catch
            {
                // Fallback về base directory
            }

            _baseArtifactsDirectory = targetDir;
            
            // Đảm bảo các thư mục con tồn tại vật lý
            EnsureDirectoryExists(Path.Combine(_baseArtifactsDirectory, "screenshots"));
            EnsureDirectoryExists(Path.Combine(_baseArtifactsDirectory, "ui-trees"));
            EnsureDirectoryExists(Path.Combine(_baseArtifactsDirectory, "logs"));
        }

        private void EnsureDirectoryExists(string path)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }

        /// <summary>
        /// Giải mã và lưu trữ ảnh chụp màn hình dạng Base64 vật lý xuống đĩa cứng.
        /// Trả về đường dẫn vật lý đầy đủ để Dashboard có thể liên kết hiển thị.
        /// </summary>
        public string SaveScreenshot(string taskId, string toolExecutionId, string base64Data)
        {
            if (string.IsNullOrEmpty(base64Data)) return string.Empty;

            try
            {
                // Loại bỏ phần đầu nếu có định dạng data:image/png;base64,
                string cleanBase64 = base64Data;
                if (base64Data.Contains(","))
                {
                    cleanBase64 = base64Data.Split(',')[1];
                }

                byte[] imageBytes = Convert.FromBase64String(cleanBase64);
                string filePath = Path.Combine(_baseArtifactsDirectory, "screenshots", $"{taskId}_{toolExecutionId}.png");

                File.WriteAllBytes(filePath, imageBytes);
                return filePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ArtifactStore Error] Không thể lưu ảnh chụp màn hình: {ex.Message}");
                return string.Empty;
            }
        }

        /// <summary>
        /// Lưu trữ cây XML giao diện FlaUI đã quét được để Dashboard có thể dựng cấu trúc cây.
        /// </summary>
        public string SaveUiTree(string taskId, string xmlContent)
        {
            if (string.IsNullOrEmpty(xmlContent)) return string.Empty;

            try
            {
                string filePath = Path.Combine(_baseArtifactsDirectory, "ui-trees", $"{taskId}.xml");
                File.WriteAllText(filePath, xmlContent);
                return filePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ArtifactStore Error] Không thể lưu cây UI XML: {ex.Message}");
                return string.Empty;
            }
        }

        /// <summary>
        /// Lưu trữ vết nhật ký (execution logs) vật lý để phục vụ Replay/Trace.
        /// </summary>
        public string SaveExecutionLog(string taskId, string logText)
        {
            if (string.IsNullOrEmpty(logText)) return string.Empty;

            try
            {
                string filePath = Path.Combine(_baseArtifactsDirectory, "logs", $"{taskId}.log");
                File.AppendAllText(filePath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {logText}\n");
                return filePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ArtifactStore Error] Không thể lưu nhật ký log: {ex.Message}");
                return string.Empty;
            }
        }
    }
}
