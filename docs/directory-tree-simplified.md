# 📂 CÂY THƯ MỤC KIẾN TRÚC MONOREPO (VIBE PLATFORM)

Đây là bản đồ cấu trúc tiêu chuẩn (Standard Monorepo Architecture) được chốt sau Phase 03. Không được phép thêm bớt thư mục gốc bừa bãi.

```text
/ Ai-Agent (Root)
│
├── .antigravity/        # Cấu hình AI Agents (Prompts, System Instructions)
├── .github/             # CI/CD Pipeline (GitHub Actions)
│   └── workflows/
│       └── ci.yml       # Tự động Lint, Typecheck, Ruff, Dry-Build
│
├── apps/                # [Tầng Microservices Ứng Dụng]
│   ├── frontend/        # Next.js 15 UI (Vibe Design System)
│   ├── orchestrator/    # Node.js API Gateway & Queue Manager
│   └── backend-ai/      # Python FastAPI (RAG, Inference, uv-managed)
│
├── bots/                # [Tầng Worker & Sandbox Tự Hành]
│   ├── dino-cv-bot/     # Bot thị giác máy tính
│
├── packages/            # [Tầng Chia Sẻ - DRY]
│   ├── shared-types/    # DTOs, TypeScript Interfaces
│   └── eslint-config/   # Cấu hình lint chuẩn
│
├── infra/               # [Tầng Hạ Tầng Mạng & Giám Sát]
│   ├── nginx/           # Reverse Proxy config (Routing, Rate Limit, CORS)
│   ├── postgres/        # Init scripts cho DB pgvector
│   └── observability/   # Cấu hình Prometheus, Grafana, Loki
│
├── docker/              # [Tầng Điều Phối Docker Compose]
│   ├── docker-compose.dev.yml   # Môi trường Local (Hot-reload)
│   ├── docker-compose.prod.yml  # Môi trường Deploy (Secured, Healthchecked)
│   └── docker-compose.obs.yml   # Stack giám sát sức khỏe
│
├── scripts/             # [Tầng Tự Động Hóa]
│   ├── bootstrap.sh     # 1-click Setup cho Linux/Mac
│   └── bootstrap.ps1    # 1-click Setup cho Windows
│
├── docs/                # [Tầng Tri Thức (The Second Brain)]
│   ├── plans/           # Master Plan và Blueprints từng Phase
│   ├── history/         # CHANGELOG (Lịch sử quyết định kiến trúc)
│   └── vault/           # Báo cáo nghiệm thu, bài học xương máu
│
├── package.json         # Root scripts (optional cho npm workspaces)
└── README.md            # Sổ tay dự án
```
