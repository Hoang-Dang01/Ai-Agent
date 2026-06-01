using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using OfflineAgent.Core.Events;
using OfflineAgent.Core.Plugins;
using OfflineAgent.Core.ToolRegistry;
using OfflineAgent.Core.Security;
using OfflineAgent.Core.WorldState;
using OfflineAgent.Core.Storage;

namespace OfflineAgent.Core.Runtime
{
    public enum TaskState
    {
        Pending,
        Running,
        Completed,
        Failed,
        Retrying,
        Timeout,
        Cancelled
    }

    public class TaskNode
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ToolName { get; set; } = string.Empty;
        public Dictionary<string, object> Arguments { get; set; } = new Dictionary<string, object>();
        public List<string> DependsOn { get; set; } = new List<string>();
        public TaskState State { get; set; } = TaskState.Pending;
        public int RetryCount { get; set; } = 0;
    }

    public class TaskGraphRuntime
    {
        private readonly List<TaskNode> _nodes;
        private readonly CapabilitySecurityGuard _securityGuard;
        private readonly WorldStateEngine _stateEngine;
        private readonly StateDeltaEngine _deltaEngine;
        private readonly Reflection.ReflectionEngine _reflectionEngine;
        private readonly WorldState.WorldState _worldState;

        public TaskGraphRuntime(
            List<TaskNode> nodes, 
            CapabilitySecurityGuard securityGuard, 
            WorldStateEngine stateEngine, 
            StateDeltaEngine deltaEngine,
            Reflection.ReflectionEngine reflectionEngine,
            WorldState.WorldState worldState)
        {
            _nodes = nodes ?? throw new ArgumentNullException(nameof(nodes));
            _securityGuard = securityGuard ?? throw new ArgumentNullException(nameof(securityGuard));
            _stateEngine = stateEngine ?? throw new ArgumentNullException(nameof(stateEngine));
            _deltaEngine = deltaEngine ?? throw new ArgumentNullException(nameof(deltaEngine));
            _reflectionEngine = reflectionEngine ?? throw new ArgumentNullException(nameof(reflectionEngine));
            _worldState = worldState ?? throw new ArgumentNullException(nameof(worldState));
        }

        /// <summary>
        /// Giải mã đồ thị DAG và thực thi tuần tự/song song các nút tác vụ dựa trên quan hệ phụ thuộc.
        /// Quản lý chặt chẽ cơ chế thử lại (Retries), giới hạn thời gian (Timeout), và kích hoạt sự kiện viễn thông.
        /// </summary>
        public async Task<bool> ExecuteWorkflowAsync(AgentContext context)
        {
            context.Logger("[Workflow Runtime] Đang phân tích đồ thị quan hệ phụ thuộc DAG...");
            
            // Sắp xếp topo các nút nhiệm vụ
            var executionOrder = SolveTopologicalSort();
            context.Logger("[Workflow Runtime] Thứ tự thực thi topo được xác lập thành công.");

            foreach (var node in executionOrder)
            {
                context.Logger($"\n--------------------------------------------------");
                context.Logger($"[Workflow Node] Bắt đầu xử lý Node [{node.Id}]: '{node.Name}'");
                context.Logger($"--------------------------------------------------");

                // Kiểm tra xem các node phụ thuộc trước đó có hoàn thành hay không
                if (node.DependsOn.Any(depId => _nodes.First(n => n.Id == depId).State != TaskState.Completed))
                {
                    context.Logger($"[Workflow Runtime] Bỏ qua Node [{node.Id}] vì các node phụ thuộc chưa hoàn thành.");
                    node.State = TaskState.Cancelled;
                    continue;
                }

                node.State = TaskState.Running;

                bool nodeSucceeded = false;
                const int maxRetries = 2;
                const int nodeTimeoutMs = 15000; // Giới hạn 15 giây mỗi công cụ thực thi

                while (!nodeSucceeded && node.RetryCount <= maxRetries)
                {
                    if (node.RetryCount > 0)
                    {
                        context.Logger($"[Workflow Runtime] [Retry] Đang thử lại tác vụ lần thứ {node.RetryCount}...");
                        node.State = TaskState.Retrying;
                    }

                    // 1. CAPABILITY SECURITY CHECK
                    ITool tool;
                    if (!ToolCatalog.Instance.TryGetTool(node.ToolName, out tool!))
                    {
                        context.Logger($"[Error] Không tìm thấy công cụ '{node.ToolName}' trong danh mục.");
                        node.State = TaskState.Failed;
                        break;
                    }

                    var authResult = await _securityGuard.AuthorizeToolExecutionAsync(tool, context);
                    if (!authResult.IsAuthorized)
                    {
                        node.State = TaskState.Failed;
                        break;
                    }

                    // Sao lưu trạng thái trước khi chạy Tool (State Delta)
                    var beforeState = CloneWorldState();

                    // 2. EXECUTE TOOL WITH TIMEOUT GATES
                    EventBus.Instance.Publish(new AgentEvent
                    {
                        Type = AgentEventType.ToolCalled,
                        Source = "TaskGraphRuntime",
                        Message = $"Khởi chạy {tool.Name} cho Node [{node.Id}]",
                        Payload = new Dictionary<string, object> { { "Arguments", node.Arguments } }
                    });

                    ToolResponse toolResult = null;
                    try
                    {
                        // Kích hoạt cơ chế Timeout bằng cách bọc Task.WhenAny
                        var executionTask = tool.ExecuteAsync(node.Arguments, context);
                        var timeoutTask = Task.Delay(nodeTimeoutMs);

                        var completedTask = await Task.WhenAny(executionTask, timeoutTask);
                        if (completedTask == timeoutTask)
                        {
                            context.Logger($"[TIMEOUT ERROR] Công cụ '{tool.Name}' chạy vượt quá giới hạn {nodeTimeoutMs / 1000} giây.");
                            node.State = TaskState.Timeout;
                            EventBus.Instance.Publish(new AgentEvent
                            {
                                Type = AgentEventType.ToolFailed,
                                Source = "TaskGraphRuntime",
                                Message = $"Công cụ '{tool.Name}' bị dừng đột ngột do hết giờ."
                            });
                            toolResult = new ToolResponse { IsSuccess = false, Output = "Hết giờ thực thi (Timeout)." };
                        }
                        else
                        {
                            toolResult = await executionTask;
                        }
                    }
                    catch (Exception ex)
                    {
                        toolResult = new ToolResponse { IsSuccess = false, Output = $"Ngoại lệ: {ex.Message}" };
                    }

                    EventBus.Instance.Publish(new AgentEvent
                    {
                        Type = toolResult.IsSuccess ? AgentEventType.ToolSucceeded : AgentEventType.ToolFailed,
                        Source = "TaskGraphRuntime",
                        Message = toolResult.IsSuccess ? $"Thành công: {tool.Name}" : $"Thất bại: {tool.Name}"
                    });

                    // 3. CACHE INVALIDATION
                    // Giải phóng cache của UI Tree ngay lập tức sau khi tool thực thi xong để tránh đọc tree cũ
                    _stateEngine.Invalidate();

                    // Cập nhật WorldState thô ngay lập tức
                    if (toolResult.IsSuccess)
                    {
                        foreach (var kvp in toolResult.UpdatedState)
                        {
                            if (kvp.Key == "CurrentApplication") _worldState.Environment.CurrentApplication = kvp.Value.ToString()!;
                            if (kvp.Key == "ActiveWindow") _worldState.Environment.ActiveWindow = kvp.Value.ToString()!;
                            if (kvp.Key == "LastReadContent") _worldState.Memory.Facts["LastReadContent"] = kvp.Value;
                        }
                    }

                    // 4. OBSERVE & SNAPSHOT (WorldStateEngine)
                    context.Logger("[Observer] Engine đang chụp lại ảnh trạng thái môi trường...");
                    var stateFrame = _stateEngine.CaptureStateFrame(node.Id, Guid.NewGuid().ToString());

                    // Tách biệt Artifact Store vật lý (PNG/XML) ra khỏi RAM
                    string screenshotPath = ArtifactStore.Instance.SaveScreenshot(node.Id, Guid.NewGuid().ToString(), stateFrame.ScreenshotUrl);
                    string xmlPath = ArtifactStore.Instance.SaveUiTree(node.Id, stateFrame.UiTreeXml);
                    ArtifactStore.Instance.SaveExecutionLog(node.Id, $"Hoàn thành bước. Screenshot lưu tại '{screenshotPath}', XML lưu tại '{xmlPath}'");

                    var afterState = new WorldState.WorldState
                    {
                        Environment = new EnvironmentState
                        {
                            ActiveWindow = _worldState.Environment.ActiveWindow,
                            CurrentApplication = _worldState.Environment.CurrentApplication,
                            OpenWindows = stateFrame.OpenWindows
                        }
                    };

                    // 5. STATE DELTA (Tính toán Delta biến đổi)
                    var stateDelta = _deltaEngine.ComputeDelta(beforeState, afterState);
                    if (stateDelta.HasChanges)
                    {
                        if (stateDelta.ActiveWindowChanged)
                            context.Logger($"  • Cửa sổ thay đổi: '{stateDelta.ActiveWindowFrom}' -> '{stateDelta.ActiveWindowTo}'");
                        if (stateDelta.CurrentApplicationChanged)
                            context.Logger($"  • Đổi ứng dụng: '{stateDelta.CurrentApplicationFrom}' -> '{stateDelta.CurrentApplicationTo}'");
                        
                        EventBus.Instance.Publish(new AgentEvent
                        {
                            Type = AgentEventType.StateChanged,
                            Source = "TaskGraphRuntime",
                            Message = "Trạng thái OS thay đổi."
                        });
                    }

                    // 6. VERIFICATION (Reflection Engine)
                    var verification = _reflectionEngine.VerifyAction(
                        node.ToolName, 
                        toolResult, 
                        _worldState.Environment.ActiveWindow, 
                        _worldState.Environment.CurrentApplication, 
                        node.Arguments
                    );

                    context.Logger($"[Verifier Result] Success: {verification.Success}, Độ tin cậy: {verification.Confidence:P0}");

                    if (verification.Success && verification.Confidence >= 0.7f)
                    {
                        nodeSucceeded = true;
                        node.State = TaskState.Completed;
                        _worldState.Execution.TaskHistory.Push(node.Name);
                    }
                    else
                    {
                        node.RetryCount++;
                        if (node.RetryCount > maxRetries)
                        {
                            // Khởi chạy Human-In-The-Loop approval
                            EventBus.Instance.Publish(new AgentEvent
                            {
                                Type = AgentEventType.ApprovalRequested,
                                Source = "TaskGraphRuntime",
                                Message = "Báo động đỏ! Đang lấy phê duyệt từ người dùng."
                            });

                            if (context.PromptUser != null)
                            {
                                string approval = context.PromptUser($"Nhiệm vụ '{node.Name}' gặp sự cố. Bạn có đồng ý hoàn tất thủ công? (y/n):", "Human Overwrite Gate");
                                if (approval?.ToLower() == "y")
                                {
                                    context.Logger("[HITL] Đã phê duyệt hoàn thành thủ công.");
                                    nodeSucceeded = true;
                                    node.State = TaskState.Completed;
                                }
                                else
                                {
                                    node.State = TaskState.Failed;
                                    break;
                                }
                            }
                            else
                            {
                                node.State = TaskState.Failed;
                                break;
                            }
                        }
                        else
                        {
                            // Gọi Replanner tái cấu trúc
                            var correction = await _reflectionEngine.DiagnoseAndReplanAsync(
                                _worldState.Goal.CurrentGoal,
                                node.Name,
                                verification,
                                ToolCatalog.Instance.GetCatalogSchemaJson(),
                                context
                            );
                        }
                    }
                }

                if (node.State == TaskState.Failed || node.State == TaskState.Timeout)
                {
                    context.Logger($"\n[Workflow Runtime] >>> TIẾN TRÌNH DAG THẤT BẠI TẠI NODE [{node.Id}]. DỪNG KHẨN CẤP <<<");
                    return false;
                }
            }

            return true;
        }

        private WorldState.WorldState CloneWorldState()
        {
            return new WorldState.WorldState
            {
                Environment = new EnvironmentState
                {
                    ActiveWindow = _worldState.Environment.ActiveWindow,
                    CurrentApplication = _worldState.Environment.CurrentApplication,
                    OpenWindows = new List<string>(_worldState.Environment.OpenWindows)
                }
            };
        }

        /// <summary>
        /// Sắp xếp Topo giải quan hệ phụ thuộc để xác lập lộ trình thực thi đúng đắn nhất.
        /// </summary>
        private List<TaskNode> SolveTopologicalSort()
        {
            var sorted = new List<TaskNode>();
            var visited = new Dictionary<string, bool>();

            foreach (var node in _nodes)
            {
                VisitNode(node.Id, visited, sorted);
            }

            return sorted;
        }

        private void VisitNode(string id, Dictionary<string, bool> visited, List<TaskNode> sorted)
        {
            if (visited.TryGetValue(id, out var inProgress))
            {
                if (inProgress)
                {
                    throw new InvalidOperationException("[Workflow Runtime] Phát hiện quan hệ phụ thuộc vòng tròn (Circular Dependency)!");
                }
                return;
            }

            visited[id] = true;

            var node = _nodes.First(n => n.Id == id);
            foreach (var depId in node.DependsOn)
            {
                VisitNode(depId, visited, sorted);
            }

            visited[id] = false;
            sorted.Add(node);
        }
    }
}
