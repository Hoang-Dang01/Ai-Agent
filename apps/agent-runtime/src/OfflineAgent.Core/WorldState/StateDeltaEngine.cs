using System;
using System.Collections.Generic;
using System.Linq;

namespace OfflineAgent.Core.WorldState
{
    public class StateDelta
    {
        public bool ActiveWindowChanged { get; set; }
        public string ActiveWindowFrom { get; set; } = string.Empty;
        public string ActiveWindowTo { get; set; } = string.Empty;

        public bool CurrentApplicationChanged { get; set; }
        public string CurrentApplicationFrom { get; set; } = string.Empty;
        public string CurrentApplicationTo { get; set; } = string.Empty;

        public List<string> WindowsAdded { get; set; } = new List<string>();
        public List<string> WindowsRemoved { get; set; } = new List<string>();

        public bool HasChanges => ActiveWindowChanged || CurrentApplicationChanged || WindowsAdded.Any() || WindowsRemoved.Any();
    }

    public class StateDeltaEngine
    {
        /// <summary>
        /// So sánh sai khác giữa hai Frame trạng thái trước và sau khi gọi Tool.
        /// Sinh ra đối tượng StateDelta nhẹ, giúp tiết kiệm tối đa Token cho LLM.
        /// </summary>
        public StateDelta ComputeDelta(WorldState before, WorldState after)
        {
            var delta = new StateDelta();

            // 1. So sánh sự thay đổi cửa sổ hoạt động
            if (before.Environment.ActiveWindow != after.Environment.ActiveWindow)
            {
                delta.ActiveWindowChanged = true;
                delta.ActiveWindowFrom = before.Environment.ActiveWindow;
                delta.ActiveWindowTo = after.Environment.ActiveWindow;
            }

            // 2. So sánh sự thay đổi tiến trình hiện hành
            if (before.Environment.CurrentApplication != after.Environment.CurrentApplication)
            {
                delta.CurrentApplicationChanged = true;
                delta.CurrentApplicationFrom = before.Environment.CurrentApplication;
                delta.CurrentApplicationTo = after.Environment.CurrentApplication;
            }

            // 3. So sánh danh sách các tiến trình cửa sổ được mở thêm/đóng bớt
            var beforeWindows = before.Environment.OpenWindows ?? new List<string>();
            var afterWindows = after.Environment.OpenWindows ?? new List<string>();

            delta.WindowsAdded = afterWindows.Except(beforeWindows).ToList();
            delta.WindowsRemoved = beforeWindows.Except(afterWindows).ToList();

            return delta;
        }
    }
}
