# 📂 CÂY THƯ MỤC KIẾN TRÚC MONOREPO (VIBE PLATFORM)

Đây là bản đồ cấu trúc tiêu chuẩn cấp độ doanh nghiệp (Enterprise Offline Agent Architecture) được tối ưu hóa sau Phase 04.

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
│   ├── desktop-agent-csharp/ # [LÕI HOST RUNTIME CORE - C# .NET 9] Trái tim thực thi
│   │   ├── OfflineAgent.Core/ # AgentHost, ToolSystem, WorldState, CapabilitySecurity, FlaUI
│   │   └── OfflineAgent.UI/   # Giao diện WPF điều hành tại máy trạm
│   │
│   ├── orchestrator/    # [NHẠC TRƯỞNG ĐIỀU PHỐI - Node.js TS] API Gateway & Queue Manager
│   │   ├── prisma/
│   │   │   └── schema.prisma # Datasource PostgreSQL & pgvector, Model DAG Tasks, Goals
│   │   └── src/
│   │       ├── config/       # env.ts (strict config), logger.ts (pino)
│   │       ├── middlewares/  # auth.middleware.ts, rateLimiter.middleware.ts
│   │       ├── queue/        # connection.ts, taskQueue.ts, taskWorker.ts (BullMQ)
│   │       ├── services/     # db.service.ts (Prisma Wrapper & Auto vector extension)
│   │       └── types/        # shared-types.ts (bản sao cục bộ contract)
│   │
│   ├── backend-ai/      # [DỊCH VỤ NHẬN THỨC - Python FastAPI] Động cơ AI kép
│   │   ├── main.py
│   │   └── services/
│   │       ├── planner/      # Lập kế hoạch AI (Qwen ONNX / local LLM xuất DAG Task Graph)
│   │       ├── memory/       # RAG pipeline, LangChain, pgvector, embeddings
│   │       ├── vision/       # YOLOv8 UI, VLM Qwen2-VL phân tích ngữ cảnh hình ảnh
│   │       └── reflection/   # Bộ đối chứng criticism/verification nhận thức
│   │
│   └── frontend/        # [CONTROL DECK UI - Next.js 15] Giao diện buồng lái quan sát & can thiệp
│       └── src/
│           ├── components/rag/   # Monitor RAG, so sánh phiên bản tài liệu
│           └── components/agent/ # Giám sát World State, Task Graph, Logs, HITL Approval
│
├── packages/            # [TẦNG CHIA SẺ DỮ LIỆU & HỢP ĐỒNG - DRY]
│   │
│   ├── contracts/       # [MỚI - POLYGLOT SCHEMAS] Schema JSON dùng chung đa ngôn ngữ
│   │   ├── task.schema.json
│   │   ├── world-state.schema.json
│   │   ├── tool-call.schema.json
│   │   └── reflection.schema.json
│   │
│   └── shared-types/    # Thư viện kiểu TypeScript dùng chung cho Frontend & Orchestrator
│       ├── index.ts
│       └── package.json
│
├── examples/            # [MỚI - AGENT IMPLEMENTATIONS] Các ứng dụng Agent chạy trên nền tảng
│   ├── dino-cv-agent/   # Agent thị giác máy tính chơi game Dino
│   └── minecraft-agent/ # Agent tự hành AFK / điều khiển trong game Minecraft
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
