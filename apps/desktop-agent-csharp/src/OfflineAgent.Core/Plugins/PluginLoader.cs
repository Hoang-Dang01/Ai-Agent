using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace OfflineAgent.Core.Plugins
{
    public class PluginLoader
    {
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            AllowTrailingCommas = true,
            ReadCommentHandling = JsonCommentHandling.Skip
        };

        /// <summary>
        /// Quét thư mục gốc và tải tất cả các plugin tri thức hợp lệ.
        /// </summary>
        /// <param name="pluginsRootPath">Đường dẫn đến thư mục chứa các plugin (thường là "plugins")</param>
        public List<Plugin> LoadPlugins(string pluginsRootPath)
        {
            var loadedPlugins = new List<Plugin>();

            if (!Directory.Exists(pluginsRootPath))
            {
                Console.WriteLine($"[PluginLoader] Thư mục gốc không tồn tại: {pluginsRootPath}");
                return loadedPlugins;
            }

            // Quét tất cả các thư mục con cấp 1 (mỗi thư mục con là một Plugin)
            var pluginDirectories = Directory.GetDirectories(pluginsRootPath);
            foreach (var dir in pluginDirectories)
            {
                try
                {
                    var plugin = LoadSinglePlugin(dir);
                    if (plugin != null)
                    {
                        loadedPlugins.Add(plugin);
                        Console.WriteLine($"[PluginLoader] Đã tải plugin thành công: '{plugin.Manifest.Name}' ({plugin.Manifest.Id}) - Phiên bản {plugin.Manifest.Version}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[PluginLoader] Lỗi khi tải plugin từ thư mục {dir}: {ex.Message}");
                }
            }

            return loadedPlugins;
        }

        /// <summary>
        /// Nạp một plugin đơn lẻ từ thư mục của nó.
        /// </summary>
        private Plugin? LoadSinglePlugin(string directoryPath)
        {
            // Kiểm tra manifest tại: {directory}/.claude-plugin/plugin.json hoặc {directory}/plugin.json
            string manifestPath = Path.Combine(directoryPath, ".claude-plugin", "plugin.json");
            if (!File.Exists(manifestPath))
            {
                manifestPath = Path.Combine(directoryPath, "plugin.json");
            }

            if (!File.Exists(manifestPath))
            {
                // Không tìm thấy file manifest, bỏ qua thư mục này
                return null;
            }

            // 1. Phân tích manifest JSON
            string jsonContent = File.ReadAllText(manifestPath);
            var manifest = JsonSerializer.Deserialize<PluginManifest>(jsonContent, JsonOptions);
            if (manifest == null || string.IsNullOrEmpty(manifest.Id))
            {
                throw new InvalidDataException("File manifest không hợp lệ hoặc thiếu thuộc tính 'id'.");
            }

            var plugin = new Plugin
            {
                Manifest = manifest,
                DirectoryPath = directoryPath
            };

            // 2. Nạp toàn bộ các skills dạng Markdown dưới thư mục skills/
            string skillsPath = Path.Combine(directoryPath, "skills");
            if (Directory.Exists(skillsPath))
            {
                var mdFiles = Directory.GetFiles(skillsPath, "*.md", SearchOption.AllDirectories);
                foreach (var file in mdFiles)
                {
                    try
                    {
                        string content = File.ReadAllText(file);
                        plugin.Skills.Add(new PluginSkill
                        {
                            Name = Path.GetFileNameWithoutExtension(file),
                            Content = content,
                            FilePath = file
                        });
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[PluginLoader] Cảnh báo: Không thể đọc file skill '{file}': {ex.Message}");
                    }
                }
            }

            return plugin;
        }
    }
}
