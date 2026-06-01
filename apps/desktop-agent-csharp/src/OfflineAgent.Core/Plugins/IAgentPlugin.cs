using System.Collections.Generic;

namespace OfflineAgent.Core.Plugins
{
    public interface IAgentPlugin
    {
        string Id { get; }
        string Name { get; }
        string Description { get; }
        string Version { get; }
        
        /// <summary>
        /// Trả về danh sách các lệnh thực thi hành động C# tương ứng.
        /// </summary>
        List<IAgentCommand> GetCommands();

        /// <summary>
        /// Lắp ghép và trả về hướng dẫn kỹ năng nghiệp vụ dạng Markdown.
        /// </summary>
        string GetSystemInstructions();
    }
}
