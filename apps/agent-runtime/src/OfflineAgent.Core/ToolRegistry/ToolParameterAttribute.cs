using System;

namespace OfflineAgent.Core.ToolRegistry
{
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
    public class ToolParameterAttribute : Attribute
    {
        public string Name { get; }
        public string Type { get; }
        public string Description { get; }
        public bool IsRequired { get; }

        public ToolParameterAttribute(string name, string type, string description, bool isRequired = true)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Type = type ?? "string";
            Description = description ?? string.Empty;
            IsRequired = isRequired;
        }
    }
}
