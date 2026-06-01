using System.Text;

namespace OfflineAgent.Core.Plugins
{
    public class PluginPromptBuilder
    {
        /// <summary>
        /// Tự động lắp ráp hệ thống prompt (System Prompt) cho mô hình AI.
        /// </summary>
        /// <param name="plugin">Plugin nghiệp vụ được chọn</param>
        /// <param name="command">Lệnh cụ thể cần chạy</param>
        /// <param name="coreSystemPrompt">Nội dung hướng dẫn chung hoặc nhân tố hạt nhân (tùy chọn)</param>
        public string BuildSystemPrompt(Plugin plugin, PluginCommand command, string coreSystemPrompt = "")
        {
            var sb = new StringBuilder();

            // 1. Nhúng bộ hướng dẫn lõi cốt lõi của Agent (nếu có, ví dụ: AGENTS.md)
            if (!string.IsNullOrEmpty(coreSystemPrompt))
            {
                sb.AppendLine("=== CORE SYSTEM OPERATING DOCTRINE ===");
                sb.AppendLine(coreSystemPrompt);
                sb.AppendLine();
            }

            // 2. Định nghĩa vai trò (Role-Based Persona Context) từ Manifest
            sb.AppendLine("=== ACTIVE AGENT ROLE PROFILE ===");
            sb.AppendLine($"Role Name: {plugin.Manifest.Name}");
            sb.AppendLine($"Description: {plugin.Manifest.Description}");
            sb.AppendLine($"Version: {plugin.Manifest.Version}");
            sb.AppendLine();

            // 3. Tiêm toàn bộ tri thức kỹ năng (Skills Library) từ các file Markdown
            if (plugin.Skills.Count > 0)
            {
                sb.AppendLine("=== DOMAIN KNOWLEDGE & SKILLS LIBRARY ===");
                sb.AppendLine("Below are strict workflows, terminology guidelines, and instructions you MUST follow for this role:");
                sb.AppendLine();

                foreach (var skill in plugin.Skills)
                {
                    sb.AppendLine($"--- SKILL RESOURCE: {skill.Name.ToUpper()} ---");
                    sb.AppendLine(skill.Content);
                    sb.AppendLine();
                }
            }

            // 4. Tiêm chi tiết thực thi của lệnh Slash Command được gọi
            sb.AppendLine("=== EXECUTING TASK COMMAND ===");
            sb.AppendLine($"Command: {command.Name}");
            sb.AppendLine($"Task Goal: {command.Description}");
            sb.AppendLine();
            sb.AppendLine("Task-Specific Instructions:");
            sb.AppendLine(command.Prompt);
            sb.AppendLine();

            sb.AppendLine("=== FINAL OPERATIONAL MANDATE ===");
            sb.AppendLine("Synthesize the core doctrine, role profile, domain skills, and task instructions above.");
            sb.AppendLine("Respond strictly keeping this context, operating offline, and ensuring zero-defect output.");

            return sb.ToString();
        }
    }
}
