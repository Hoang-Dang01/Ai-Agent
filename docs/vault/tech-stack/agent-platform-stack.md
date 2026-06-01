# 🧠 ENTERPRISE AI AGENT PLATFORM STACK

Tài liệu này định hình Stack công nghệ tối cao được tuyển chọn và khóa cứng (locked) cho toàn bộ hệ sinh thái **Vibe-Agent 2026 Platform**. Triết lý thiết kế tập trung hoàn toàn vào khả năng chạy **Offline On-Premise**, tính xác thực **Deterministic**, cấu trúc **Goal-driven** và quản lý hạ tầng hệ thống phân tán.

---

## 🎯 1. BẢN ĐỒ CÔNG NGHỆ CHUYÊN BIỆT (THE AGENT PLATFORM STACK)

### A. Tầng Ngôn ngữ lập trình (Programming)
*   **Python:** Lõi nhận thức, xử lý AI, RAG và quy hoạch kế hoạch.
*   **C# (.NET 9):** Lõi host vật lý điều khiển hệ điều hành, FlaUI, bảo mật đặc quyền.
*   **TypeScript:** API Orchestrator (Node.js) và buồng lái giám sát (Next.js 15).
*   **SQL (PostgreSQL):** Truy vấn dữ liệu quan hệ, lưu trữ Goal và Task states.
*   **Bash / PowerShell:** Tự động hóa hạ tầng và đóng gói script.

### B. Tầng Nhận thức cơ bản (AI Foundations)
*   **NumPy & Pandas:** Xử lý dữ liệu ma trận và làm sạch thông tin.
*   **PyTorch:** Nghiên cứu và huấn luyện/tinh chỉnh mô hình cục bộ.
*   **ONNX Runtime:** **Trụ cột suy luận offline.** Nạp mô hình YOLOv8-UI và Qwen-1.5B trực tiếp vào CPU/GPU máy trạm để suy luận thời gian thực với kích thước bộ cài tối thiểu.

### C. Kỹ nghệ Mô hình Ngôn ngữ (LLM & Agent Engineering)
*   **LangGraph:** Điều phối luồng đồ thị trạng thái tuần hoàn (State Machine). Quản trị các kịch bản tự sửa lỗi (Self-Correction Loop) và giao tiếp HITL (Human-in-the-Loop).
*   **Transformers:** Kết nối mô hình HuggingFace nội bộ.
*   **DSPy:** Tối ưu hóa prompt tự động (để thay thế prompt viết tay truyền thống).

### D. Tầng Môi trường & Thực thi vật lý (Computer Use & Environment)
*   **FlaUI (C#):** Tương tác low-level với Windows GUI thông qua Automation Tree, thay thế cơ chế rê chuột tọa độ tĩnh không an toàn.
*   **Playwright / Selenium:** Tự động hóa môi trường trình duyệt (Headless/Headed Browser).
*   **Vision Models (YOLOv8 + Qwen2-VL):** Định vị tọa độ Bounding Box của nút bấm, ô nhập liệu động trên màn hình máy trạm.

### E. Tầng Dữ liệu & Tri thức (Data Layer & Vector DB)
*   **PostgreSQL (pgvector):** Lưu trữ Goal, DAG Task Graph, và Vector Embeddings cho tài liệu RAG.
*   **Redis:** Quản lý cache ngữ cảnh hội thoại, khóa phân tán (Distributed Locks) và backend hàng đợi BullMQ.
*   **Qdrant / FAISS:** Lõi tìm kiếm tương đồng vector siêu nhẹ cho RAG.

### F. Tầng Điều phối & Runtime (Runtime & Orchestration)
*   **FastAPI (Python):** Bọc các service nhận thức AI (Brain Services).
*   **Express.js (Node.js TS):** API Gateway và Socket.io Real-time streaming.
*   **BullMQ:** Hàng đợi tác vụ bất đồng bộ chịu tải cao.
*   **Docker & Docker Compose:** Đóng gói 1-Click container.

### G. Tầng Giám sát & Đo lường (Observability & Telemetry)
*   **OpenTelemetry:** Tiêu chuẩn hóa telemetry trace giữa C#, Node.js và Python.
*   **Prometheus & Grafana:** Giám sát sức khỏe hạ tầng hệ thống (Inference latency, Queue size, CPU/VRAM usage).
*   **Langfuse:** Theo dõi chất lượng phản hồi, dấu vết cuộc gọi LLM và tỷ lệ Hallucination.

---

## ⚡ 2. 7 NHÓM CỐT LÕI (MVP PLATFORM RUNTIME)

Để tránh quá tải nhận thức, toàn bộ lõi vận hành trong giai đoạn này được khóa cứng xung quanh 7 nhóm công cụ tối giản dưới đây:

1.  **C# Runtime + FlaUI:** Engine thực thi OS vật lý.
2.  **FastAPI (Python):** API nhận thức bọc ngoài Brain Services.
3.  **PyTorch / ONNX Runtime:** Suy luận cục bộ (Local Inference) tốc độ cao.
4.  **PostgreSQL + Redis:** Cơ sở dữ liệu trạng thái và bộ nhớ cache hàng đợi.
5.  **Qdrant:** Lõi Vector RAG cục bộ.
6.  **LangGraph:** Đồ thị hóa trạng thái và điều phối tác vụ.
7.  **Prometheus + Grafana:** Telemetry giám sát toàn diện.
