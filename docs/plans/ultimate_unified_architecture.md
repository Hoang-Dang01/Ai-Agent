# KIẾN TRÚC HỢP NHẤT: AI AGENT TỰ HÀNH & KHO TRI THỨC (ULTIMATE UNIFIED AGENT & SECOND BRAIN ECOSYSTEM)
**Dự án:** Vibe Ecosystem 2026  
**Thư mục làm việc:** `c:\Git cua tui\Ai-Agent`  
**Tầm nhìn:** Gộp chung **Hệ thống tự động hóa tác vụ (C# Runtime)**, **Bộ não suy luận (Python Cognitive)**, và **Kho tri thức tài liệu (GitDoc RAG / Second Brain)** thành một hệ sinh thái monorepo đồng nhất, tạo ra thực thể AI có năng lực đọc hiểu tri thức và thực thi hành động khép kín.

---

## 🏛️ Sơ đồ Kiến trúc Hệ thống hợp nhất

Hệ thống được cấu trúc lại hoàn chỉnh trong monorepo `c:\Git cua tui\Ai-Agent` để chia sẻ tài nguyên hạ tầng và dữ liệu:

```
                            ┌───────────────────────────────┐
                            │      TypeScript Web UI        │ (Next.js 15 - Quản lý RAG & Dashboard)
                            └──────────────┬────────────────┘
                                           │ Socket.io / HTTP
                                           ▼
                            ┌───────────────────────────────┐
                            │       Node.js Gateway         │ (orchestrator - Định tuyến & Điều phối)
                            └──────────────┬────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼ (Local Socket.io)                           ▼ (HTTP / FastAPI)
      ┌───────────────────────────┐                 ┌───────────────────────────┐
      │     C# Runtime Client     │                 │   Python Cognitive Core   │
      │ (WPF/FlaUI - Operating)   │                 │ (FastAPI - Brain & RAG)   │
      └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                    │                                             │ SQL
                    ▼                                             ▼
      ┌───────────────────────────┐                 ┌───────────────────────────┐
      │    Windows Operating      │                 │  PostgreSQL (pgvector)    │
      │   (Notepad, ERP, Apps)    │                 │ (Lưu trữ Tài liệu & RAG)  │
      └───────────────────────────┘                 └───────────────────────────┘
```

---

## 📂 Tổ chức Cấu trúc Thư mục Monorepo tối cao

```
Ai-Agent/
├── apps/
│   ├── frontend/                     # [NEXT.JS 15] Giao diện hợp nhất
│   │   ├── src/components/rag/       # Kế thừa GitDoc (Quản lý tài liệu, so sánh phiên bản diff, RAG Chat)
│   │   └── src/components/agent/     # Giao diện giám sát Agent (World State, Task Graph, Logs, HITL Approval)
│   │
│   ├── backend-ai/                   # [PYTHON FASTAPI] Động cơ AI kép (Kép RAG + Lập kế hoạch)
│   │   ├── main.py                   # Cổng API chạy FastAPI
│   │   ├── services/rag.py           # Logic RAG kế thừa từ GitDoc (LangChain, pgvector, Gemini Embeddings)
│   │   ├── services/planner.py       # Logic Lập kế hoạch AI (Qwen ONNX / local LLM xuất DAG Task Graph)
│   │   └── services/reflection.py    # Bộ đối chứng nhận thức V3 (Critic/Verifier/Replanner)
│   │
│   ├── orchestrator/                 # [NODE.JS] Nhạc trưởng điều phối & API Gateway
│   │   └── server.js                 # Xử lý kết nối Socket.io thời gian thực giữa Web UI và C# Client
│   │
│   └── desktop-agent-csharp/         # [C# .NET 9] Bàn tay thực thi tương tác Windows (FlaUI)
│       ├── OfflineAgent.Core/        # Thư viện lõi (ITool, WorldState, Capability Security, Reflection V3 Client)
│       └── OfflineAgent.UI/          # Giao diện WPF điều hành tại máy trạm
│
├── docs/                             # Kho tri thức kỹ thuật & Sổ tay vận hành
│   └── plans/
│       └── ultimate_unified_architecture.md
│
├── docker/                           # Khởi chạy 1-Click Container
│   ├── docker-compose.dev.yml        # Bật Nginx, PostgreSQL + pgvector, Redis cục bộ
│   └── schema.sql                    # SQL khởi tạo bảng tài liệu GitDoc và bảng lưu vết của Agent
```

---

## ⚡ Chu trình Tương tác và Vận hành Khép kín (The Ultimate Cognitive-Action Loop)

Sự kết hợp này tạo ra một chu trình khép kín giúp Agent giải quyết các tác vụ phức tạp dựa trên tri thức có sẵn:

```
[Mục tiêu người dùng]
        │
        ▼
[Python Planner Service] ──► Truy vấn RAG (GitDoc) để lấy tài liệu/kinh nghiệm hướng dẫn tương ứng
        │
        ▼
[Sinh đồ thị nhiệm vụ DAG] ──► Gửi đồ thị nhiệm vụ dạng JSON tới C# Runtime qua Node.js Gateway
        │
        ▼
[C# Desktop Operator] ──► Kiểm duyệt đặc quyền (Capability Guard) -> Thực thi FlaUI trên Windows
        │
        ├─► [Observer] ──► Thu thập dữ liệu trạng thái thô gửi về Dashboard để hiển thị trực quan
        │
        ├─► [Critic & Verifier] ──► Kiểm tra kết quả hành động dựa trên luật cứng
        │
        └─► [Success] ──► Cập nhật WorldState phân tầng & Hoàn tất tác vụ
```

1.  **Tiếp nhận và Truy vấn Tri thức:** Người dùng đưa ra mục tiêu: *"Kiểm tra mã số thuế của đối tác và đồng bộ điểm lên ERP"*. Python Planner nhận yêu cầu, lập tức gọi dịch vụ RAG (`services/rag.py`) truy vấn kho tri thức tài liệu của **GitDoc** để tìm hướng dẫn nghiệp vụ: *"Quy trình đăng nhập ERP và đối soát doanh nghiệp"*.
2.  **Lập kế hoạch DAG:** Dựa trên tài liệu hướng dẫn thu thập được từ RAG, Planner sinh ra một đồ thị nhiệm vụ (DAG/Task Graph) chuẩn JSON chứa các bước phụ thuộc và gửi về C# Runtime Client.
3.  **Thực thi và Bảo mật đặc quyền:** C# Runtime kiểm duyệt đặc quyền (`AgentCapability`), chạy lần lượt các công cụ chuẩn hóa (`ITool`) để điều khiển Windows (mở app, nhập liệu bằng FlaUI).
4.  **Quan sát và Đối chứng:** Phân hệ Reflection cập nhật `WorldState` phân tầng (Goal, Environment, Execution, Memory), đồng thời bắn log trạng thái và hình ảnh chụp màn hình về Node.js Orchestrator để cập nhật thời gian thực lên Dashboard Next.js phục vụ giám sát.
5.  **Lưu trữ bài học (Episodic Memory):** Sau khi hoàn thành quy trình thành công, Agent tóm tắt lại kịch bản, các lỗi đã gặp và cách khắc phục rồi lưu ngược lại vào kho tài liệu **GitDoc** dưới dạng một "Episodic Record" (Bộ nhớ tình tiết mới) để phục vụ cho các phiên làm việc tiếp theo.
