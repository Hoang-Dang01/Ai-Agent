namespace OfflineAgent.Core.Plugins
{
    public class ReflectionResult
    {
        public bool Success { get; set; }
        public float Confidence { get; set; } // Ngưỡng tin cậy (Ví dụ: < 0.7f -> AskUser)
        public string Reason { get; set; } = string.Empty;
    }
}
