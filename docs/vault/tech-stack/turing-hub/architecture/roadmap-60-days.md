# LỘ TRÌNH 60 NGÀY KỸ SƯ AI AGENT (AI AGENT ENGINEER ROADMAP)

## 📅 THÁNG 1: HOST RUNTIME & SYSTEMS ENGINEERING (Hạ Tầng Hệ Thống)

### Tuần 1: C# (.NET 9) & Thực thi Vật lý (OS Automation)
- **Ngày 1**: Cài đặt môi trường (VS Code, .NET 9 SDK, SQLite/PostgreSQL local). Thiết lập Repo Git đầu tiên cho dự án "Agent-Runtime".
- **Ngày 2**: Syntax C# cơ bản, Class, Interface và Dependency Injection. Tạo interface `ITool` chuẩn hóa.
- **Ngày 3**: Tự động hóa UI chuẩn Windows bằng **FlaUI.UIA3**. Truy cập Automation Tree và tìm kiếm phần tử bằng ID/Name.
- **Ngày 4**: Lập kịch bản Click và Nhập liệu mô phỏng hành vi tự nhiên (Natural Typing Speed, Bezier Curves).
- **Ngày 5**: Xây dựng **Capability Security Guard** kiểm duyệt đặc quyền của Agent trước khi gọi tool (Access Control).
- **Ngày 6**: WebView2 Automation cơ bản: Tương tác với Chromium nhúng trong Windows.
- **Ngày 7**: **Project 1:** Viết single-file `.exe` WPF C# App tự động mở Notepad, nhập văn bản "Hello World" và lưu file bằng FlaUI.

### Tuần 2: Backend Orchestrator & API Gateway (Node.js TS & Redis)
- **Ngày 8**: TypeScript nâng cao và thiết lập dự án Node.js với Express.
- **Ngày 9**: Cài đặt và cấu hình **Redis** local làm cache ngữ cảnh hội thoại.
- **Ngày 10**: Tích hợp **BullMQ** và `ioredis`. Khởi tạo hàng đợi tác vụ bất đồng bộ `ai-tasks`.
- **Ngày 11**: Viết Worker lắng nghe BullMQ, cập nhật trạng thái tác vụ (`PENDING` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED`).
- **Ngày 12**: Tích hợp **Socket.io** truyền phát log tiến trình (Thought Stream) thời gian thực về Frontend.
- **Ngày 13**: Thiết lập bộ giới hạn tần suất API (Rate Limiter) dựa trên Redis.
- **Ngày 14**: **Project 2:** Xây dựng server Gateway nhận yêu cầu từ client, đẩy vào BullMQ và phát tín hiệu progress qua Socket.io.

### Tuần 3: Dữ liệu & Tri thức cục bộ (PostgreSQL & Vector DB)
- **Ngày 15**: Thiết lập CSDL PostgreSQL và cài đặt phần mở rộng `pgvector`.
- **Ngày 16**: Cấu hình **Prisma Client** (CommonJS/TS) kết nối tới Postgres.
- **Ngày 17**: Thiết kế Schema CSDL lưu vết 4 lớp nhận thức: `UserGoal` $\rightarrow$ `AITask` (DAG) $\rightarrow$ `ToolExecution` $\rightarrow$ `WorldStateFrame`.
- **Ngày 18**: Tìm hiểu cơ bản về Embeddings Model và Vector Database (**Qdrant** / FAISS).
- **Ngày 19**: Thực hiện tìm kiếm tương đồng vector (Similarity Search) lấy Top K tài liệu liên quan.
- **Ngày 20**: Viết hàm RAG cơ bản: Gom Context kết quả RAG ghép vào Prompt.
- **Ngày 21**: **Project 3:** Xây dựng module CRUD tài liệu và tự động sinh vector lưu vào Qdrant/pgvector.

### Tuần 4: Lõi Nhận thức Python & FastAPI Gateway
- **Ngày 22**: Cài đặt Python 3.11/3.12 sử dụng `uv` làm quản lý thư viện tốc độ cao.
- **Ngày 23**: Viết Web API đầu tiên bằng **FastAPI**, xử lý các router Async.
- **Ngày 24**: Nạp và chạy suy luận mô hình cục bộ nhẹ (như YOLOv8-UI hoặc Qwen-1.5B) bằng **ONNX Runtime** để định vị UI.
- **Ngày 25**: Kết nối LLM cục bộ (Ollama) và API Cloud (OpenRouter).
- **Ngày 26**: Viết parser phân tách đầu ra của LLM từ ngôn ngữ tự nhiên thành cấu trúc DAG JSON Task Graph.
- **Ngày 27**: Đấu nối API nhận thức Python với Node.js API Gateway.
- **Ngày 28**: **Project 4:** Tích hợp bộ Planner Python nhận lệnh, phân rã thành DAG gửi về Node.js enqueuer.

---

## 📅 THÁNG 2: COGNITIVE ORCHESTRATION & OBSERVABILITY (Nhận Thức & Giám Sát)

### Tuần 5: LangGraph (Đồ thị trạng thái & Nhận thức)
- **Ngày 29**: Nguyên lý đồ thị trạng thái: Nodes, Edges, State và Reducers trong **LangGraph**.
- **Ngày 30**: Xây dựng cấu trúc Graph lập kế hoạch: Planner $\rightarrow$ Executor $\rightarrow$ Critic (Self-Correction Loop).
- **Ngày 31**: Tích hợp cơ chế tạm dừng đợi duyệt **Human-in-the-Loop (HITL)** trong LangGraph.
- **Ngày 32**: Xử lý nén trạng thái (State Compression) và lưu vết bộ nhớ cuộc hội thoại (Memory System).
- **Ngày 33**: Viết cơ chế tự sửa lỗi (Self-Correction) khi một bước hành động UI bị lỗi (Ví dụ: click trượt).
- **Ngày 34**: Tối ưu hóa bộ compiler lắp ráp System Prompt dựa trên ngữ cảnh lấy từ RAG.
- **Ngày 35**: **Project 5:** Xây dựng đồ thị Agent tự sửa lỗi đăng nhập ERP cơ bản bằng LangGraph.

### Tuần 6: Giám sát toàn diện & Giảm thiểu sai lệch (Observability & Telemetry)
- **Ngày 36**: Tích hợp **OpenTelemetry** thu thập traces giữa các phân hệ đa ngôn ngữ (C# $\rightarrow$ TS $\rightarrow$ Python).
- **Ngày 37**: Cài đặt và cấu hình **Prometheus** để đo lường metrics thời gian thực.
- **Ngày 38**: Thiết lập dashboard **Grafana** hiển thị biểu đồ CPU, RAM, Redis queue size và độ trễ LLM inference.
- **Ngày 39**: Tích hợp **Langfuse** hoặc Helicone để theo dõi chất lượng sinh văn bản và traces gọi API LLM.
- **Ngày 40**: Xử lý logic Circuit Breaker: Dừng khẩn cấp sau 3 lần retry thất bại.
- **Ngày 41**: Viết logs tự động ghi nhận tỷ lệ Hallucination (AI nói nhảm) của Planner.
- **Ngày 42**: **Project 6:** Thiết lập Dashboard Grafana hoàn chỉnh hiển thị Metrics và Traces của một luồng xử lý Agent bất đồng bộ.

### Tuần 7: Dashboard Hợp nhất & Cinematic UI/UX (Frontend Deck)
- **Ngày 43**: Khởi tạo Next.js 15 App Router kết hợp Tailwind CSS v4 và Shadcn UI.
- **Ngày 44**: Áp dụng triết lý Glassmorphism (blur, border-white/10) xuyên suốt các trang Dashboard.
- **Ngày 45**: Xây dựng `LiveThoughtStream` hiển thị telemetry log chạy real-time qua Socket.io.
- **Ngày 46**: Vẽ đồ thị topo mạng RAG (`RAGMonitoring`) sử dụng Framer Motion và SVG.
- **Ngày 47**: Thiết kế widget giám sát đồ thị tác vụ `MasterPlanWidget` hiển thị trạng thái động của DAG.
- **Ngày 48**: Tích hợp nút bấm HITL Approval (Duyệt/Từ chối) và nút dừng khẩn cấp (Kill Switch) kết nối tới C# Client.
- **Ngày 49**: **Project 7:** Hoàn thiện giao diện Dashboard buồng lái (Control Deck) cinematic đẹp mắt.

### Tuần 8: Tích hợp Thực nghiệm & Nghiệm thu
- **Ngày 50**: Đấu nối toàn bộ chu trình: User Goal $\rightarrow$ Planner (Python) $\rightarrow$ TS Gateway $\rightarrow$ C# Host Runtime $\rightarrow$ Windows OS.
- **Ngày 51**: Thử nghiệm Agent chạy offline hoàn toàn trong mạng nội bộ.
- **Ngày 52**: Tạo kịch bản kiểm thử UAT 1: Đối soát & Điền điểm tự động trên ERP Medstand giả lập.
- **Ngày 53**: Tạo kịch bản kiểm thử UAT 2: Xử lý sự cố nút bấm bị ẩn/thay đổi vị trí.
- **Ngày 54**: Đo lường và đánh giá hiệu năng (TTFT, VRAM consumption, CPU load).
- **Ngày 55**: Tiến hành kiểm thử chịu tải (Load Testing) xem hệ thống chịu được bao nhiêu tiến trình song song.
- **Ngày 56 - 60**: Đóng gói Single-File Offline Installer cho Windows trạm Legion R9000P. Viết báo cáo UAT hoàn tất dự án.
