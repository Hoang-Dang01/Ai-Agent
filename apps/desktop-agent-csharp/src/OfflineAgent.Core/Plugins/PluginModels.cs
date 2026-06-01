using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace OfflineAgent.Core.Plugins
{
    public class PluginManifest
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("version")]
        public string Version { get; set; } = "1.0.0";

        [JsonPropertyName("icon")]
        public string Icon { get; set; } = string.Empty;

        [JsonPropertyName("commands")]
        public List<PluginCommand> Commands { get; set; } = new List<PluginCommand>();
    }

    public class PluginCommand
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("prompt")]
        public string Prompt { get; set; } = string.Empty;
    }

    public class PluginSkill
    {
        public string Name { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
    }

    public class Plugin
    {
        public PluginManifest Manifest { get; set; } = new PluginManifest();
        public List<PluginSkill> Skills { get; set; } = new List<PluginSkill>();
        public string DirectoryPath { get; set; } = string.Empty;
    }
}
