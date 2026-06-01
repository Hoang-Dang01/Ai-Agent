using System.Threading.Tasks;

namespace OfflineAgent.Core.Plugins
{
    public interface IAgentCommand
    {
        string Trigger { get; }      // Cú pháp kích hoạt lệnh (ví dụ: /dev:review)
        string Description { get; }  // Mô tả nhiệm vụ
        string Prompt { get; }       // Prompt chỉ dẫn cụ thể cho AI

        /// <summary>
        /// Thực thi các tác vụ tự động hóa vật lý thực tế trên máy trạm.
        /// </summary>
        Task ExecuteAsync(AgentContext context);
    }
}
