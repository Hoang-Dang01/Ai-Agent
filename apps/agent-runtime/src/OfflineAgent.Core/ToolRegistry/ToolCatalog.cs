using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using OfflineAgent.Core.Plugins;
using OfflineAgent.Core.Tools;

namespace OfflineAgent.Core.ToolRegistry
{
    public class ToolCatalog
    {
        private static readonly Lazy<ToolCatalog> _instance = new Lazy<ToolCatalog>(() => new ToolCatalog());
        public static ToolCatalog Instance => _instance.Value;

        private readonly Dictionary<string, ITool> _tools = new Dictionary<string, ITool>(StringComparer.OrdinalIgnoreCase);

        private ToolCatalog()
        {
            // Tự động đăng ký các công cụ chuẩn vào danh mục
            RegisterTool(new OpenApplicationTool());
            RegisterTool(new TypeTextTool());
            RegisterTool(new ClickTool());
            RegisterTool(new ReadWindowTool());
        }

        public void RegisterTool(ITool tool)
        {
            if (tool == null) throw new ArgumentNullException(nameof(tool));
            _tools[tool.Name] = tool;
        }

        public ITool GetTool(string name)
        {
            if (_tools.TryGetValue(name, out var tool))
            {
                return tool;
            }
            throw new KeyNotFoundException($"[ToolCatalog] Không tìm thấy công cụ: '{name}'");
        }

        public bool TryGetTool(string name, out ITool tool)
        {
            return _tools.TryGetValue(name, out tool!);
        }

        public List<ITool> GetAllTools()
        {
            return _tools.Values.ToList();
        }

        /// <summary>
        /// Tạo ra danh mục Schema JSON của tất cả các công cụ đã đăng ký.
        /// Sử dụng để nạp trực tiếp cho bộ Planner LLM lập kế hoạch.
        /// </summary>
        public string GetCatalogSchemaJson()
        {
            var catalog = _tools.Values.Select(t => new
            {
                name = t.Name,
                description = t.Description,
                requiredCapabilities = t.RequiredCapabilities.Select(c => c.ToString()).ToList()
            });

            return JsonSerializer.Serialize(catalog, new JsonSerializerOptions { WriteIndented = true });
        }
    }
}
