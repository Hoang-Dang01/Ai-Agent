# 📖 CẨM NANG KIẾN TRÚC MÃ NGUỒN (MONOREPO SOURCE ARCHITECTURE README)
**Dự án:** Vibe Ecosystem / Enterprise AI-Agent Operating Platform  
**Đường dẫn tài liệu:** `c:\Git cua tui\Ai-Agent\docs\vault\src_architecture_readme.md`

Tài liệu này đóng vai trò là bản hướng dẫn kỹ thuật chuyên sâu (Source Code Readme), phân rã toàn bộ cấu trúc mã nguồn (`src`) của 4 phân hệ và các gói chia sẻ trong Monorepo, giúp nhà phát triển nắm rõ luồng dữ liệu hợp nhất và sơ đồ vận hành của hệ thống.

---

## 🚦 1. Luồng Hoạt Động Hợp Nhất (Unified System Data Flow)

Hệ thống vận hành theo chu kỳ vòng kín (closed-loop cognitive cycle) từ mục tiêu người dùng đến tự động hóa hệ điều hành:

```text
[Mục tiêu lớn: Goal]
       ↓ (Orchestrator)
[Đồ thị nhiệm vụ phụ thuộc: Task Graph DAG]
       ↓ (BullMQ Queue)
[Phát Job thực thi tác vụ: execute-task]
       ↓ (WPF WPF / Console Runtime)
[Kiểm duyệt an toàn: Capability Security Guard]
       ↓ (C# Automation)
[Thực thi công cụ: FlaUI Tool Execution] ──→ [Xóa cache quét màn hình: Cache Invalidate]
       ↓ (Observer Engine)
[Chụp ảnh & Quét cây giao diện: WorldStateFrame Capture] ──→ [Artifact Store vật lý (PNG/XML)]
       ↓ (State Delta Engine)
[Đo lường sai lệch môi trường: State Delta Computation] (Tiết kiệm 95% Tokens)
       ↓ (Reflection Engine)
[Thẩm định kết quả: Rule-Based Verifier]
       ↓ (Thất bại / Nghi ngờ)
[Chẩn đoán lỗi cục bộ: Local LLM Critic]
       ↓ (Tái lập lộ trình)
[Đề xuất sửa đổi kế hoạch: LLM Replanner] ──→ [Cập nhật DAG / Human Approval]
       ↓ (Thành công)
[Lưu Checkpoint tiến trình: CheckpointManager] ──→ [Socket.io Telemetry live-stream Dashboard]
```

---

## 📂 2. Phân Rã Chi Tiết Mã Nguồn 4 Phân Hệ (Source Code Walkthrough)

---

### Phân Hệ A: C# Desktop Runtime Core (`apps/agent-runtime/`)
"Bàn tay thực thi" trực tiếp trên hệ điều hành Windows, phát triển bằng .NET 9.0.

#### 1. Logic Nghiệp Vụ Cốt Lõi (`OfflineAgent.Core/`)
*   **`Runtime/`**: Bộ điều phối luồng chạy.
    *   [TaskGraphRuntime.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Runtime/TaskGraphRuntime.cs): Trái tim của runtime. Chứa thuật toán sắp xếp topo (Topological Sort) để giải mã đồ thị DAG nhiệm vụ, quản lý việc bọc cơ chế Timeout (sử dụng Task Racing) và Retry cho từng Node, đồng thời kích hoạt Telemetry Event Bus.
    *   [GoalManager.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Runtime/GoalManager.cs): Quản lý trạng thái vòng đời của Mục tiêu hiện hành (`ActiveGoal`).
    *   [CheckpointManager.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Runtime/CheckpointManager.cs): Lưu trữ đồ thị nhiệm vụ đang chạy dở dang xuống ổ cứng dưới dạng JSON và tự động nạp lại khi khôi phục sau sự cố.
    *   [ExecutionJournal.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Runtime/ExecutionJournal.cs): Ghi chép lịch sử giao dịch (audit log) chuẩn xác dạng JSON Lines (JSONL) vào ổ đĩa.
*   **`WorldState/`**: Phân hệ quản lý trạng thái môi trường.
    *   [WorldStateEngine.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/WorldState/WorldStateEngine.cs): Triển khai **Observation Cache** bọc FlaUI quét cây giao diện. Sử dụng bộ nhớ đệm 5 giây giúp tối ưu hóa CPU, chủ động xóa bỏ cache (`Invalidate()`) ngay khi phát hiện hành động thay đổi ứng dụng.
    *   [StateDeltaEngine.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/WorldState/StateDeltaEngine.cs): So sánh `beforeState` và `afterState` để trích xuất sai khác môi trường (ví dụ đổi cửa sổ hiện hành, tiến trình mới xuất hiện), giúp giảm kích thước prompt gửi cho LLM.
*   **`ToolRegistry/`**: Đăng ký và chuẩn hóa công cụ.
    *   [ToolParameterAttribute.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/ToolRegistry/ToolParameterAttribute.cs): Định nghĩa các metadata trang trí trên tham số của Tool.
    *   [ToolCatalog.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/ToolRegistry/ToolCatalog.cs): Sử dụng C# Reflection quét toàn bộ lớp kế thừa `ITool` có gắn `ToolParameter` để tự động sinh JSON Schema chuẩn gửi cho AI Planner.
*   **`Tools/`**: Tập hợp các công cụ tự động hóa UI vật lý.
    *   `OpenApplicationTool.cs`: Khởi chạy tiến trình Windows sạch theo đường dẫn chỉ định.
    *   `ClickTool.cs`: Định vị phần tử UI trên cây FlaUI và giả lập sự kiện chuột.
    *   `TypeTextTool.cs`: Giả lập bàn phím gửi chuỗi ký tự vào ứng dụng đích.
    *   `ReadWindowTool.cs`: Trích xuất nội dung văn bản bên trong cửa sổ tiêu điểm.
*   **`Reflection/`**: Phân hệ đối chứng nhận thức.
    *   [ReflectionEngine.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Reflection/ReflectionEngine.cs): Thực hiện xác minh nhanh bằng luật cứng (Rule-Based Verifier), bọc cổng gọi Local AI (GenAI ONNX) để chẩn đoán lỗi (Critic) và giải tuần tự hóa (deserialize) đề xuất sửa sai (Replanner) dạng JSON, có fallback an toàn.
*   **`Security/`**: Bộ kiểm soát rủi ro.
    *   [CapabilitySecurityGuard.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Security/CapabilitySecurityGuard.cs): Kiểm tra quyền hạn và cảnh báo rủi ro (SAFE/CRITICAL) trước khi thực thi tool.
*   **`Storage/`**: Quản trị tài nguyên.
    *   [ArtifactStore.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Storage/ArtifactStore.cs): Ghi file nhị phân PNG (screenshots) và XML (cây giao diện) xuống ổ cứng, giải phóng RAM.
*   **`Vision/`**: Nhúng AI cục bộ.
    *   [LocalVisionModel.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Vision/LocalVisionModel.cs): Tải mô hình Qwen2.5-Instruct ONNX thông qua GenAI API để suy luận streaming cục bộ ngay trên máy trạm.
*   **`Events/`**: 
    *   [EventBus.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Events/EventBus.cs): Lớp Singleton quản trị phân phối các sự kiện telemetry nội bộ.

#### 2. Giao Diện Điều Hành Trực Quan (`OfflineAgent.UI/`)
*   `MainWindow.xaml` & `MainWindow.xaml.cs`: Triển khai giao diện WPF bọc hệ thống runtime. Cung cấp Matrix console hiển thị thời gian thực luồng suy luận của Local LLM và live log của cuộc gọi công cụ FlaUI.

---

### Phân Hệ B: Node.js AI Orchestrator (`apps/orchestrator/`)
"Hệ thần kinh" điều phối API Gateway, xác thực và hàng đợi công việc.

*   `server.ts`: Tệp tin entry-point khởi tạo Express Server, gán Socket.io lên đối tượng toàn cục `(global as any).io` để live-stream trạng thái, và bootstrap kết nối PostgreSQL.
*   `prisma/schema.prisma`: Schema Prisma ORM chứa các cấu hình mô hình `Goal`, `AITask` (hỗ trợ quan hệ phụ thuộc DAG tự tham chiếu `dependencies`), `ToolExecution` và `WorldStateFrame`.
*   **`src/queue/`**: Phân hệ hàng đợi bất đồng bộ.
    *   `taskQueue.ts`: Khởi tạo queue `ai-tasks` bằng BullMQ để đăng ký Task trong Postgres DB ở trạng thái `PENDING` và đẩy Task Job vào Redis.
    *   `taskWorker.ts`: Khởi tạo worker BullMQ lắng nghe xử lý công việc, cập nhật trạng thái Task sang `PROCESSING`, chạy tuần tự các Tools nghiệp vụ và đẩy trạng thái trung gian (`task_progress`, `task_completed`) thời gian thực lên Socket.io.
*   **`src/services/`**:
    *   `db.service.ts`: Khởi tạo PrismaClient, xác thực khả năng kết nối DB và cấu hình đóng kết nối an toàn (graceful shutdown).
    *   `world-state.service.ts`: Ghi nhận dữ liệu World State Frame (base64 screenshot và XML UI Tree) xuống database.
*   **`src/middlewares/`**:
    *   `auth.middleware.ts`: Middleware xác thực mã JWT để bảo vệ các endpoints nghiệp vụ.
    *   `rateLimiter.middleware.ts`: Rate Limiter dựa trên Redis (`rate-limit-redis`) ngăn chặn tấn công từ chối dịch vụ.

---

### Phân Hệ C: Python Backend-AI (`apps/backend-ai/`)
"Bộ não nhận thức" cung cấp các dịch vụ tính toán AI chuyên sâu thông qua FastAPI.

*   `app/main.py`: Điểm nạp FastAPI Server, đăng ký các routers nghiệp vụ và mở CORS cho các phân hệ tương tác.
*   `app/routers/reflection.py`: Cung cấp 3 REST Endpoints chính:
    *   `/verify`: Gọi `RuleVerifier` to thực thi bộ luật cứng thẩm định hành động.
    *   `/critic`: Trích xuất prompt chẩn đoán lỗi chi tiết cho LLM.
    *   `/replan`: Nhận phản hồi chẩn đoán lỗi để đề xuất cấu trúc công cụ thay thế dạng JSON.
*   **`app/services/`**:
    *   `reflection/verifier/rule_verifier.py`: Chứa logic kiểm tra các điều kiện cứng của ứng dụng.
    *   `reflection/critic/critic.py`: Tạo prompt chẩn đoán lỗi chuyên sâu.
    *   `reflection/replanner/replanner.py`: Xử lý phân tích cấu trúc schema để tìm kiếm công cụ thay thế.

---

### Phân Hệ D: Next.js Frontend Dashboard (`apps/frontend/`)
"Buồng lái" trực quan hóa toàn bộ tiến trình hoạt động của hệ thống.

*   **`src/components/dashboard/`**:
    *   `TaskGraphView.tsx`: Vẽ sơ đồ cây thư mục đồ thị DAG của các tác vụ bằng thư viện trực quan hóa (như React Flow).
    *   `WorldStateMonitor.tsx`: Hiển thị ảnh chụp màn hình OS thời gian thực và phân tích XML UI tree.
    *   `HitlApprovalGate.tsx`: Giao diện hiển thị cửa sổ lấy ý kiến con người (Human-in-the-Loop) khi Agent OS yêu cầu phê duyệt thủ công.
*   **`src/components/vault/`**:
    *   `RAGMonitor.tsx`: Giám sát cơ sở dữ liệu vector, các đoạn văn bản (chunks) được lấy ra để đối chiếu RAG.
*   **`src/components/model-lab/`**:
    *   `ModelTester.tsx`: Phòng thí nghiệm thử nghiệm trực quan prompt, tham số ONNX cục bộ.

---

### Gói Chia Sẻ & Hợp Đồng Dữ Liệu (`packages/`)
Đảm bảo tính đồng bộ dữ liệu (DRY) cho Monorepo đa ngôn ngữ.

*   **`contracts/`**: Polyglot JSON Schemas dùng chung:
    *   `task.schema.json`: Schema cấu trúc Task.
    *   `world-state.schema.json`: Schema trạng thái thế giới (cửa sổ hoạt động, danh sách tiến trình).
    *   `tool-call.schema.json`: Định nghĩa cấu trúc tham số đầu vào/ra của Tool.
    *   `reflection.schema.json`: Schema định nghĩa giao thức verify/critic/replan.
*   **`shared-types/`**:
    *   `index.ts` & `package.json`: Khai báo các TypeScript Types dùng chung giữa Node.js Orchestrator và Next.js Frontend, biên dịch trực tiếp sang Javascript để phân phối cục bộ.

---

## 🛠️ 3. Cẩm Nang Khởi Chạy Từng Phân Hệ Bằng CLI

Nếu không sử dụng script 1-click `start_all.ps1`, nhà phát triển có thể tự khởi chạy từng phân hệ bằng các lệnh CLI tiêu chuẩn:

### 1. Khởi chạy Python Backend-AI (Port 8000):
```bash
cd apps/backend-ai
# Kích hoạt môi trường ảo python venv cục bộ
.venv\Scripts\activate
# Chạy FastAPI Server qua uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Khởi chạy Node.js AI Orchestrator (Port 3000):
```bash
cd apps/orchestrator
# Cài đặt thư viện phụ thuộc
npm install
# Khởi chạy Prisma ORM sinh mã client
npx prisma generate
# Khởi chạy Express Server ở chế độ nhà phát triển
npm run dev
```

### 3. Khởi chạy Next.js Frontend Dashboard (Port 4000 hoặc Default):
```bash
cd apps/frontend
# Cài đặt thư viện phụ thuộc
npm install
# Chạy Dashboard Web Server
npm run dev
```

### 4. Khởi chạy C# Desktop Client (WPF):
```bash
cd apps/agent-runtime/src
# Khôi phục các gói thư viện NuGet
dotnet restore OfflineAgent.sln
# Khởi chạy WPF Client
dotnet run --project OfflineAgent.UI\OfflineAgent.UI.csproj
```
