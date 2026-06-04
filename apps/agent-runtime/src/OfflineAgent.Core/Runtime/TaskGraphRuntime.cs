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
        Cancelled,
        Blocked,
        WaitingApproval,
        Skipped
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

            // Kiểm tra xem có Checkpoint cũ để hồi phục hay không
            string goalId = GoalManager.Instance.ActiveGoal?.GoalId ?? "default";
            string goalText = GoalManager.Instance.ActiveGoal?.GoalText ?? string.Empty;
            var savedCheckpoint = CheckpointManager.Instance.LoadCheckpoint(goalId);
            if (savedCheckpoint != null)
            {
                context.Logger($"[Checkpoint Recovery] Phát hiện Checkpoint cũ! Đang khôi phục trạng thái cho {savedCheckpoint.Nodes.Count} node...");
                foreach (var savedNode in savedCheckpoint.Nodes)
                {
                    var activeNode = _nodes.FirstOrDefault(n => n.Id == savedNode.Id);
                    if (activeNode != null)
                    {
                        activeNode.State = savedNode.State;
                        activeNode.RetryCount = savedNode.RetryCount;
                    }
                }
            }

            // Cấu hình giới hạn số lần Replan toàn cục
            const int MaxReplanCeiling = 3;
            int globalReplanCount = 0;

            // Khởi tạo bản sao lưu trạng thái tốt gần nhất (rollback points)
            var lastGoodWorldStateBackup = _worldState.Clone();

            foreach (var node in executionOrder)
            {
                // Nếu node đã được đánh dấu hoàn thành từ Checkpoint cũ, ta có quyền bỏ qua (Skipped)
                if (node.State == TaskState.Completed)
                {
                    context.Logger($"[Workflow Runtime] Node [{node.Id}] đã hoàn thành từ Checkpoint trước. Bỏ qua chạy lại.");
                    continue;
                }

                context.Logger($"\n--------------------------------------------------");
                context.Logger($"[Workflow Node] Bắt đầu xử lý Node [{node.Id}]: '{node.Name}'");
                context.Logger($"--------------------------------------------------");

                // Kiểm tra xem các node phụ thuộc trước đó có hoàn thành hay không
                if (node.DependsOn.Any(depId => _nodes.First(n => n.Id == depId).State != TaskState.Completed))
                {
                    context.Logger($"[Workflow Runtime] Đánh dấu Node [{node.Id}] là Bị hủy (Cancelled) vì phụ thuộc thất bại.");
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
                        // Đánh dấu Blocked (P1)
                        node.State = TaskState.Blocked;
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

                    ToolResponse toolResult = new ToolResponse { IsSuccess = false, Output = "Chưa thực thi." };
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
                    ArtifactStore.Instance.SaveExecutionLog(node.Id, $"Hoàn thành bước. Screenshot: '{screenshotPath}', XML: '{xmlPath}'");

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

                    // PERSISTENT EXECUTION JOURNAL (P1)
                    // Ghi lại giao dịch chuẩn xác dạng JSONL
                    ExecutionJournal.Instance.RecordEntry(new JournalEntry
                    {
                        GoalId = goalId,
                        TaskId = node.Id,
                        ToolName = node.ToolName,
                        InputArgs = node.Arguments,
                        OutputResult = toolResult.Output,
                        Status = verification.Success ? "SUCCESS" : "FAILED",
                        Timestamp = DateTime.Now
                    });

                    if (verification.Success && verification.Confidence >= 0.7f)
                    {
                        nodeSucceeded = true;
                        node.State = TaskState.Completed;
                        _worldState.Execution.TaskHistory.Push(node.Name);

                        // Lưu checkpoint lưu trữ tiến trình an toàn
                        CheckpointManager.Instance.SaveCheckpoint(goalId, goalText, _nodes);

                        // Cập nhật bản sao lưu trạng thái tốt gần nhất
                        lastGoodWorldStateBackup = _worldState.Clone();
                    }
                    else
                    {
                        node.RetryCount++;
                        if (node.RetryCount > maxRetries)
                        {
                            // Đánh dấu WaitingApproval (P1)
                            node.State = TaskState.WaitingApproval;

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
                                    
                                    // Lưu checkpoint sau khi được phê duyệt
                                    CheckpointManager.Instance.SaveCheckpoint(goalId, goalText, _nodes);

                                    // Cập nhật bản sao lưu trạng thái tốt gần nhất
                                    lastGoodWorldStateBackup = _worldState.Clone();
                                }
                                else
                                {
                                    node.State = TaskState.Failed;
                                    CheckpointManager.Instance.SaveCheckpoint(goalId, goalText, _nodes);
                                    break;
                                }
                            }
                            else
                            {
                                node.State = TaskState.Failed;
                                CheckpointManager.Instance.SaveCheckpoint(goalId, goalText, _nodes);
                                break;
                            }
                        }
                        else
                        {
                            // Kiểm tra xem đã vượt quá giới hạn Replan toàn cục chưa
                            if (globalReplanCount >= MaxReplanCeiling)
                            {
                                context.Logger($"[Workflow Runtime Warning] Đã vượt ngưỡng replan tối đa cho phép ({MaxReplanCeiling}). Ngừng gọi AI và đánh dấu thất bại.");
                                node.State = TaskState.Failed;
                                CheckpointManager.Instance.SaveCheckpoint(goalId, goalText, _nodes);
                                break;
                            }

                            // Gọi Replanner tái cấu trúc
                            globalReplanCount++;
                            context.Logger($"[Workflow Runtime] [Replanner Call {globalReplanCount}/{MaxReplanCeiling}] Gọi AI đề xuất kịch bản sửa đổi...");
                            var correction = await _reflectionEngine.DiagnoseAndReplanAsync(
                                _worldState.Goal.CurrentGoal,
                                node.Name,
                                verification,
                                ToolCatalog.Instance.GetCatalogSchemaJson(),
                                context
                            );

                            if (correction != null && !string.IsNullOrEmpty(correction.SuggestedTool))
                            {
                                context.Logger($"[Workflow Runtime] [Replanner Application] AI de xuat tai lap ke hoach. Cap nhat cong cu sang '{correction.SuggestedTool}' voi tham so moi.");
                                node.ToolName = correction.SuggestedTool;
                                node.Arguments = correction.Arguments;
                            }
                        }
                    }
                }

                if (node.State == TaskState.Failed || node.State == TaskState.Timeout || node.State == TaskState.Blocked)
                {
                    context.Logger($"\n[Workflow Runtime] >>> TIẾN TRÌNH DAG THẤT BẠI TẠI NODE [{node.Id}]. DỪNG KHẨN CẤP <<<");

                    // Thực hiện Rollback trạng thái WorldState về checkpoint tốt gần nhất
                    context.Logger($"[State Recovery] Đang phục hồi WorldState về checkpoint tốt gần nhất...");
                    RollbackWorldState(lastGoodWorldStateBackup);

                    EventBus.Instance.Publish(new AgentEvent
                    {
                        Type = AgentEventType.StateRolledBack,
                        Source = "TaskGraphRuntime",
                        Message = $"Đã rollback WorldState cho Goal [{goalId}] về checkpoint thành công gần nhất."
                    });

                    return false;
                }
            }

            // Xóa sạch Checkpoint sau khi quy trình DAG hoàn tất 100%
            CheckpointManager.Instance.ClearCheckpoint(goalId);
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
        /// Sử dụng thuật toán DFS 3 trạng thái (Unvisited, Visiting, Visited) để phát hiện vòng lặp chuẩn xác.
        /// </summary>
        private List<TaskNode> SolveTopologicalSort()
        {
            var sorted = new List<TaskNode>();
            var visiting = new HashSet<string>();
            var visited = new HashSet<string>();

            foreach (var node in _nodes)
            {
                VisitNode(node.Id, visiting, visited, sorted);
            }

            return sorted;
        }

        private void VisitNode(string id, HashSet<string> visiting, HashSet<string> visited, List<TaskNode> sorted)
        {
            // Nếu node đã được xử lý xong hoàn toàn, bỏ qua để tránh trùng lặp
            if (visited.Contains(id)) return;

            // Nếu node đang nằm trong nhánh đệ quy hiện tại -> Phát hiện vòng lặp
            if (visiting.Contains(id))
            {
                throw new InvalidOperationException($"[Workflow Runtime] Phat hien quan he phu thuoc vong tron (Circular Dependency) lien quan den Node [{id}]!");
            }

            // Đánh dấu là đang thăm (Visiting)
            visiting.Add(id);

            var node = _nodes.First(n => n.Id == id);
            foreach (var depId in node.DependsOn)
            {
                VisitNode(depId, visiting, visited, sorted);
            }

            // Đã xử lý xong: Chuyển từ Visiting sang Visited và thêm vào danh sách kết quả
            visiting.Remove(id);
            visited.Add(id);
            sorted.Add(node);
        }

        private void RollbackWorldState(WorldState.WorldState targetState)
        {
            _worldState.Goal.CurrentGoal = targetState.Goal.CurrentGoal;
            _worldState.Environment.ActiveWindow = targetState.Environment.ActiveWindow;
            _worldState.Environment.CurrentApplication = targetState.Environment.CurrentApplication;
            _worldState.Environment.OpenWindows = new List<string>(targetState.Environment.OpenWindows);
            _worldState.Execution.CurrentTask = targetState.Execution.CurrentTask;
            _worldState.Execution.TaskHistory = new Stack<string>(new Stack<string>(targetState.Execution.TaskHistory));
            _worldState.Memory.Facts = new Dictionary<string, object>(targetState.Memory.Facts);
            _worldState.LastUpdated = DateTime.Now;
        }
    }
}
