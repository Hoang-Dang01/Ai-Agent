# 📂 CÂY THƯ MỤC KIẾN TRÚC MONOREPO (AI OPERATING PLATFORM)

Đây là bản đồ cấu trúc tiêu chuẩn cấp độ doanh nghiệp (Enterprise AI Operating Platform) đạt chuẩn 10/10.

```text
/ Ai-Agent (Root)
│
├── .agent/              # [IDE RULES ONLY] Cấu hình quy tắc nhận thức và định tuyến cho IDE
│   ├── agents/          # Khai báo ranh giới CAN/CANNOT (MDC manifests của planner, backend, frontend...)
│   ├── kernel/          # Đạo luật nhận thức tối cao (cognitive-laws, core, governance)
│   └── runtime/         # Quản trị trạng thái và chế độ làm việc (runtime-state)
│
├── apps/                # [TẦNG MICROSERVICES & APPLICATIONS]
│   │
│   ├── agent-runtime/   # [LÕI HOST RUNTIME CORE - C# .NET 9] Hệ điều hành tác nhân (Agent OS)
│   │   ├── OfflineAgent.Core/ # Lõi logic tương tác Windows
│   │   │   ├── Tools/        # Hệ thống công cụ vật lý (OpenApplication, Click, TypeText)
│   │   │   ├── ToolRegistry/ # Danh mục công cụ chuẩn hóa (ToolCatalog.cs)
│   │   │   ├── WorldState/   # Cảm biến trạng thái môi trường (WorldStateEngine.cs)
│   │   │   ├── Security/     # Bộ kiểm duyệt đặc quyền (CapabilitySecurity.cs)
│   │   │   └── Vision/       # Nhúng mô hình thị giác cục bộ (LocalVisionModel)
│   │   ├── OfflineAgent.UI/   # Giao diện WPF điều hành tại máy trạm
│   │   └── OfflineAgent.sln
│   │
│   ├── orchestrator/    # [NHẠC TRƯỞNG ĐIỀU PHỐI - Node.js TS] API Gateway & Hàng đợi
│   │   ├── prisma/
│   │   │   └── schema.prisma # Datasource PostgreSQL & pgvector, Model DAG Tasks, Goals
│   │   └── src/
│   │       ├── config/       # env.ts (strict config), logger.ts (pino)
│   │       ├── middlewares/  # auth.middleware.ts, rateLimiter.middleware.ts
│   │       ├── queue/        # connection.ts, taskQueue.ts, taskWorker.ts (BullMQ)
│   │       ├── services/     # db.service.ts, world-state.service.ts (quản lý trạng thái môi trường)
│   │       └── types/        # shared-types.ts (bản sao cục bộ contract)
│   │
│   ├── backend-ai/      # [DỊCH VỤ NHẬN THỨC - Python FastAPI] Động cơ AI kép
│   │   ├── main.py
│   │   └── services/
│   │       ├── planner/      # Lập kế hoạch AI (Qwen ONNX / local LLM xuất DAG Task Graph)
│   │       ├── memory/       # RAG pipeline, LangChain, pgvector, embeddings
│   │       ├── vision/       # YOLOv8 UI, VLM Qwen2-VL phân tích ngữ cảnh hình ảnh
│   │       └── reflection/   # Bộ đối chứng nhận thức
│   │           ├── verifier/ # Rule-Based Verification (kiểm tra cứng cửa sổ, file, control)
│   │           ├── critic/   # LLM-Based Diagnosis (chẩn đoán nguyên nhân thất bại)
│   │           └── replanner/# Correction Logic (đề xuất sửa đổi kế hoạch)
│   │
│   └── frontend/        # [CONTROL DECK UI - Next.js 15] Giao diện buồng lái quan sát & can thiệp
│       └── src/
│           ├── components/dashboard/ # Giám sát World State, Task Graph, Logs, HITL Gate
│           ├── components/vault/     # Giám sát kho tri thức RAG và so sánh đối chiếu tài liệu
│           ├── components/model-lab/ # Thử nghiệm Qwen ONNX, verifier cục bộ
│           └── components/ui/        # Các thành phần giao diện dùng chung (buttons, inputs...)
│
├── packages/            # [TẦNG CHIA SẺ DỮ LIỆU & HỢP ĐỒNG - DRY]
│   │
│   ├── contracts/       # [POLYGLOT SCHEMAS] Schema JSON dùng chung đa ngôn ngữ
│   │   ├── task.schema.json
│   │   ├── world-state.schema.json
│   │   ├── tool-call.schema.json
│   │   └── reflection.schema.json
│   │
│   └── shared-types/    # Thư viện kiểu TypeScript dùng chung cho Frontend & Orchestrator
│       ├── index.ts
│       └── package.json
│
├── solutions/           # [AGENT IMPLEMENTATIONS] Các ứng dụng Agent hoàn chỉnh chạy trên nền tảng
│   └── dino-cv-agent/   # Agent thị giác máy tính chơi game Dino
│
├── infra/               # [HẠ TẦNG & GIÁM SÁT MẠNG]
│   ├── nginx/           # Reverse Proxy config (API Gateway, Rate Limit, CORS)
│   ├── postgres/        # Init scripts cho DB pgvector
│   └── observability/   # Cấu hình Prometheus, Grafana, Loki
│
├── docker/              # [ĐIỀU PHỐI DOCKER COMPOSE]
│   ├── docker-compose.dev.yml   # Môi trường Local (Postgres + pgvector, Redis, Nginx, App)
│   ├── docker-compose.prod.yml  # Môi trường Deploy (Secured, Healthchecked)
│   └── docker-compose.obs.yml   # Stack giám sát sức khỏe
│
├── scripts/             # [TỰ ĐỘNG HÓA VẬN HÀNH]
│   ├── bootstrap.sh     # 1-click Setup cho Linux/Mac
│   └── bootstrap.ps1    # 1-click Setup cho Windows
│
└── docs/                # [THE SECOND BRAIN - NGUỒN TRI THỨC DUY NHẤT]
    ├── plans/           # Master Plan và Blueprints từng Phase
    ├── history/         # CHANGELOG (Lịch sử quyết định kiến trúc)
    └── vault/           # Tài liệu đặc tả (BRD), báo cáo nghiệm thu UAT, bài học lỗi lầm
```
