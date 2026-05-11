# Codemap — Ai-Agent Project
> Phân tích cấu trúc thư mục dự án: `Ai-Agent`
> Mục đích: Lưu trữ kiến trúc tổng thể của hệ thống Đa Tác Nhân (Multi-Agent System) và các module liên quan.

---

## Tổng quan

Dự án **Ai-Agent** là một hệ thống đa tác nhân đồ sộ, được vận hành theo tiêu chuẩn **Industrial Grade**. Hệ thống sử dụng kiến trúc Microservices/Modular, kết hợp giữa môi trường **Node.js** (điều phối và giao diện) và **Python** (xử lý AI cốt lõi), đồng thời được thiết lập luồng vận hành tự động bởi Bầy đàn AI 10 Đặc vụ (Swarm Agents).

- **Frontend**: SPA ReactJS (Vite) với giao diện Glassmorphism.
- **Backend Orchestrator**: Node.js quản lý luồng agent, kết nối cơ sở dữ liệu PostgreSQL.
- **AI Engine**: Python đảm nhiệm xử lý logic suy luận chính của AI.
- **Minecraft Engine**: Node.js chịu trách nhiệm điều khiển bot trong Minecraft.
- **Swarm Brain**: Thư mục `.antigravity/` chứa "Hiến pháp" và định danh 10 Đặc vụ AI phát triển dự án.

---

## Cấu trúc Cây Thư Mục Tổng Thể

```text
Ai-Agent/
│
├── .antigravity/               # [BỘ NÃO] Cấu hình Bầy đàn AI (AI Swarm)
│   ├── agents/                 # Chứa 10 file .mdc định danh (Agent 01 -> 10)
│   ├── core/                   # 5 luật hiến pháp (Anti-Hallucination, Glassmorphism...)
│   ├── project/                # Ngữ cảnh dự án (db-schema.md, spec.md, history)
│   └── templates/              # Mẫu báo cáo, audit, test case chuẩn
│
├── deploy/                     # Các file cấu hình và kịch bản triển khai (Deployment)
│   ├── docker-compose.yml      # Cấu hình khởi chạy các services qua Docker
│   ├── start.bat               # Script khởi động nhanh hệ thống (Chạy Concurrent)
│   └── ...                     
│
├── docs/                       # Khối Tri thức & Dữ liệu RAG
│   ├── agency-agents/          # Kho prompt/vai trò cho các phòng ban AI
│   ├── claude-cli-research/    # Nghiên cứu mã nguồn CLI
│   ├── GenerativeAICourse/     # Tài liệu Khóa học Trí tuệ Nhân tạo
│   └── turing-hub/             # Trạm tri thức lõi (Vector DB RAG)
│
├── plans/                      # Quản lý kế hoạch phát triển
│   └── updates/                # Các bản ghi cập nhật lịch sử, lộ trình (Release Notes)
│
├── scripts/                    # Các tập lệnh tiện ích tự động hóa
│
└── src/                        # THƯ MỤC SOURCE CODE CHÍNH
    │
    ├── ai-engine/              # Động cơ Trí tuệ Nhân tạo (Python)
    │   ├── main.py             # Entry point của AI Engine
    │   └── ...
    │
    ├── backend-orchestrator/   # Bộ điều phối Backend (Node.js)
    │   ├── server.js           # Entry point của server điều phối
    │   └── ...
    │
    ├── frontend-ui/            # Giao diện người dùng (ReactJS / Vite)
    │   ├── package.json        # Cấu hình dự án React
    │   └── src/                # Source code giao diện React
    │       ├── App.jsx         # React Router điều hướng chính
    │       ├── assets/css/     # Bộ CSS Utility nội bộ (Glassmorphism.css)
    │       └── pages/          # Các Component hoàn chỉnh (Home, Chat, Minecraft...)
    │
    ├── frontend-ui-legacy/     # (Dự phòng) Mã nguồn HTML/JS thuần cũ
    │
    ├── minecraft-engine/       # Module chuyên biệt cho Minecraft (Node.js)
    │   ├── server.js           # Server điều khiển Minecraft bot
    │   └── ...
    │
    └── tools/                  # Các công cụ phụ trợ hệ thống
```

---

## Chi tiết các Phân hệ Cốt lõi (Core Subsystems)

### 1. `src/frontend-ui/` (ReactJS SPA)
Giao diện trung tâm điều khiển (Command Center) được nâng cấp lên ReactJS. Sử dụng phong cách thiết kế bắt buộc là **Glassmorphism**. Toàn bộ mã nguồn sử dụng bộ Utility CSS nội bộ để quản trị trạng thái thời gian thực (Real-time) cho Chatbot, Bảng điều khiển Bot Minecraft và Quản trị Tài liệu RAG.

### 2. `src/backend-orchestrator/` (Node.js)
Đóng vai trò là "nhạc trưởng". Nhận API requests từ Frontend, tra cứu Database, giao việc cho AI Engine hoặc điều hướng lệnh trực tiếp xuống Minecraft Engine.

### 3. `src/ai-engine/` (Python)
"Bộ não" suy luận của hệ thống. Nhận các yêu cầu từ Orchestrator, gọi API LLM, thực thi RAG (Truy xuất từ `docs/`) và trả về kết quả suy luận logic.

### 4. `src/minecraft-engine/` (Node.js)
Động cơ tương tác với môi trường vật lý ảo (Minecraft). Cung cấp cơ chế điều hướng 3D, thao tác với rương đồ và tự động hóa các tác vụ.

### 5. `Khối Điều Hành AI (.antigravity/)`
Kiến trúc Industrial Grade độc quyền. Cho phép một "bầy đàn" gồm 10 AI Agents tự động phát triển, đọc lỗi, viết code, kiểm thử và thiết kế giao diện cho chính dự án này dựa trên "Hiến pháp" cốt lõi.

---

> **Bản đồ mã nguồn này được quản lý và cập nhật liên tục bởi Agent 09 (Knowledge Sentinel) nhằm đảm bảo sự nhất quán cho toàn bộ vòng đời phát triển dự án.**
