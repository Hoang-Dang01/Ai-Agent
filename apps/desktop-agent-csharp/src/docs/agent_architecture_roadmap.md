# LỘ TRÌNH PHÁT TRIỂN NỀN TẢNG AGENT TỰ HÀNH NGOẠI TUYẾN - PHIÊN BẢN V3.1 (OFFLINE AGENT PLATFORM ROADMAP V3.1)
**Dự án:** Offline C# AI Agent Runner  
**Tầm nhìn:** Xây dựng một nền tảng Agent tự hành chạy cục bộ (100% On-Premise) có khả năng tự lập kế hoạch, tự thực thi tác vụ trên Windows, tự kiểm tra kết quả, tự sửa lỗi, tự học từ kinh nghiệm và hỗ trợ nhiều Agent phối hợp quy mô lớn.

---

## 🏛️ Kiến trúc Phân tầng Lai (Hybrid 3-Tier Architecture)

Để đảm bảo khả năng mở rộng tối đa mà không phụ thuộc vào một ngôn ngữ hay framework duy nhất, hệ thống được phân chia vai trò rõ ràng thành 3 tầng độc lập:

```
                    ┌───────────────────────────────┐
                    │     TypeScript Dashboard      │ (React/Zustand - Giám sát & HITL)
                    └──────────────┬────────────────┘
                                   ▼
                    ┌───────────────────────────────┐
                    │       C# Runtime Layer        │ (.NET 9/WPF/FlaUI - Thực thi & Bảo mật)
                    └──────────────┬────────────────┘
                                   ▼
                    ┌───────────────────────────────┐
                    │    Python Cognitive Layer     │ (FastAPI/ONNX - Bộ não & Suy luận)
                    └───────────────────────────────┘
```

### 1. C# Runtime Layer (Hệ điều hành của Agent)
*   **Công nghệ:** .NET 9, WPF, FlaUI, ASP.NET Minimal API.
*   **Vai trò:**
    *   **Thực thi công cụ (Tool Execution):** Cung cấp và chạy các công cụ tương tác trực tiếp với hệ điều hành Windows qua giao diện chuẩn `ITool`.
    *   **Bảo mật đặc quyền (Capability Security):** Lớp rào chắn kiểm soát các quyền truy cập tài nguyên dựa trên Năng lực (`AgentCapability`).
    *   **Trạng thái Thế giới (World State):** Quản lý mô hình cấu trúc thế giới hiện tại của máy trạm và tự động đồng bộ sau mỗi hành động.
    *   **Hosting:** Đóng gói dịch vụ tự chạy ngoại tuyến, cung cấp HTTP API để giao tiếp cục bộ.

### 2. Python Cognitive Layer (Bộ não suy luận)
*   **Công nghệ:** FastAPI, Transformers, ONNX Runtime GenAI, Sentence Transformers.
*   **Vai trò:**
    *   **Planning (Lập kế hoạch):** Chuyển đổi yêu cầu của người dùng thành đồ thị nhiệm vụ có cấu trúc (DAG/Task Graph) chuẩn JSON.
    *   **Reflection (Nhận thức):** Thực hiện kiểm lỗi, đánh giá và lập lại kế hoạch (Critic/Replanner).
    *   **Memory & Vision:** Xử lý RAG, tri thức hệ thống và chỉ kích hoạt VLM (Qwen2.5-VL) làm cơ chế Fallback khi FlaUI bị lỗi.

### 3. TypeScript Dashboard (Trung tâm điều khiển)
*   **Công nghệ:** React, Tailwind CSS, Zustand, Socket.io.
*   **Vai trò:**
    *   Giám sát trạng thái thế giới (World State Viewer) và hiển thị nhật ký gọi công cụ (Tool Call Logs).
    *   Giao diện phê duyệt tác vụ nguy hiểm hoặc khi độ tin cậy tự kiểm tra thấp (Human Approval - HITL).

---

## 📅 Lộ trình 11 Giai đoạn Phát triển (11-Phase Maturity Roadmap)

### Giai đoạn 1: Chu trình Agent Cơ bản (Agent Loop Foundation)
*   **Mục tiêu:** Thiết lập chu trình nhận thức tối giản: `User -> Goal -> Plan -> Execute -> Observe -> Done`.
*   **Kết quả:** Agent thực hiện thành công việc mở Notepad, gõ văn bản, mở Calculator hoặc mở một thư mục.

### Giai đoạn 2: Hệ thống Công cụ chuẩn hóa (Tool System)
*   **Mục tiêu:** Tách biệt logic của Agent khỏi thư viện tự động hóa vật lý bằng tầng giao diện trừu tượng (`ITool`).
*   **Các công cụ đầu tiên:** `OpenApplicationTool`, `ClickTool`, `TypeTextTool`, `ReadWindowTool`, `TakeScreenshotTool`.

### Giai đoạn 3: Trạng thái Thế giới cấu trúc (World State)
*   **Mục tiêu:** Cung cấp mô hình thế giới được chuẩn hóa bằng cách nhóm các thành phần thông tin thay vì dùng thuộc tính phẳng.
*   **Cấu trúc dữ liệu:**
    ```csharp
    public class GoalState
    {
        public string CurrentGoal { get; set; } = string.Empty;
    }

    public class EnvironmentState
    {
        public string ActiveWindow { get; set; } = string.Empty;
        public string CurrentApplication { get; set; } = string.Empty;
        public List<string> OpenWindows { get; set; } = new();
    }

    public class ExecutionState
    {
        public string CurrentTask { get; set; } = string.Empty;
        public Stack<string> TaskHistory { get; set; } = new();
    }

    public class MemorySnapshot
    {
        public Dictionary<string, object> Facts { get; set; } = new();
    }

    public class WorldState
    {
        public GoalState Goal { get; set; } = new();
        public EnvironmentState Environment { get; set; } = new();
        public ExecutionState Execution { get; set; } = new();
        public MemorySnapshot Memory { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }
    ```

### Giai đoạn 4: Bảo mật đặc quyền (Capability Security)
*   **Mục tiêu:** Thay thế bộ lọc danh sách đen (Blacklist) bằng cơ chế quản lý đặc quyền chặt chẽ trước khi cho phép Agent thao tác máy.
*   **Đặc quyền:** `ReadFiles`, `WriteFiles`, `DeleteFiles`, `LaunchApps`, `KeyboardInput`, `MouseControl`.
*   **Cơ chế Phê duyệt (Approval Modes):** `Auto` (Tự động chạy), `AskUser` (Hỏi ý kiến con người qua UI), `Deny` (Chặn đứng lập tức).

### Giai đoạn 5: Dịch vụ Lập kế hoạch chuẩn DAG (Planner Service)
*   **Mục tiêu:** Planner trả về đồ thị nhiệm vụ (DAG/Task Graph) chuẩn JSON ngay từ đầu để quản lý sự phụ thuộc:
    ```json
    {
      "goal": "Open ERP and export report",
      "tasks": [
        { "id": "1", "name": "Open ERP", "dependsOn": [] },
        { "id": "2", "name": "Login", "dependsOn": ["1"] }
      ]
    }
    ```

### Giai đoạn 6: Động cơ Nhận thức kiểm lỗi & Độ tin cậy (Reflection V3)
*   **Mục tiêu:** Tách luồng kiểm tra thành 5 thực thể nhằm giảm Tokens và latency, bổ sung độ tin cậy (Confidence):
    ```
    Execute -> Observer (Code-based) -> Critic (Rule-based) -> Verifier (Rule-based) -> Replanner (LLM-based)
    ```
*   **Kết quả phản hồi:**
    ```csharp
    public class ReflectionResult
    {
        public bool Success { get; set; }
        public float Confidence { get; set; } // Nếu thấp (ví dụ < 0.7) -> Kích hoạt AskUser
        public string Reason { get; set; } = string.Empty;
    }
    ```

### Giai đoạn 7: Bộ nhớ mở rộng (Memory System)
*   **Mục tiêu:** Triển khai bộ nhớ 3 tầng: **Episodic Memory** (Ghi vết lịch sử phiên), **Procedural Memory** (Quy trình thành công), và **Semantic Memory** (Tri thức môi trường cố định, ví dụ: *"Nút đăng nhập trang ERP nằm ở góc trên bên phải"*).

### Giai đoạn 8: Tầng Thị giác Máy tính làm Fallback (Vision Layer)
*   **Mục tiêu:** Chỉ kích hoạt xử lý ảnh cục bộ (Qwen2.5-VL/MiniCPM-V) khi các phương pháp tự động hóa giao diện chuẩn (FlaUI) thất bại hoàn toàn để tối ưu tài nguyên GPU/VRAM.

### Giai đoạn 9: Dashboard giám sát sớm (Early Dashboard Interface)
*   **Mục tiêu:** Đưa giao diện giám sát xuất hiện sớm (ngay từ Phase 3-4) nhằm hiển thị trạng thái thế giới hiện hành, lịch sử gọi công cụ và nhật ký thực thi để tối ưu hóa quá trình debug ("Visibility is more important than Vision in debugging agents").

### Giai đoạn 10: Động cơ Đồ thị (Task Graph Engine)
*   **Mục tiêu:** Hỗ trợ chạy song song các node, tự động thử lại (Retry) và xử lý phân nhánh dựa trên trạng thái `Pending`, `Running`, `Completed`, `Failed`.

### Giai đoạn 11: Cộng tác đa thực thể (Multi-Agent Swarm)
*   **Mục tiêu:** Phối hợp bầy đàn các Agent chuyên biệt (Planner Agent, Executor Agent, Vision Agent, Memory Agent, Coordinator Agent) truyền thông qua MQTT, Redis Streams hoặc gRPC.

---

## 🛠️ Trọng tâm triển khai hiện tại: Giai đoạn 2, 3 và 4
Chúng ta sẽ tập trung tối đa để xây dựng một **C# Runtime** cực kỳ vững chắc, an toàn và có mô hình thế giới hoàn thiện bao gồm:
1.  **Tool System (`ITool`)**
2.  **World State nâng cấp**
3.  **Capability Security (Bảo mật đặc quyền)**

Mục tiêu cốt lõi là tạo ra một Runtime ổn định trước khi mở rộng khả năng nhận thức.
