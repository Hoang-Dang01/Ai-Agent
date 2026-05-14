# 🏗️ KHỞI TẠO KIẾN TRÚC PHASE 03: DEVOPS & AUTOMATION

**Dựa trên quyết định kiến trúc (Architectural Pivot) cập nhật:** Thiết lập một nền tảng Production-Grade AI Platform vững chắc trước khi code tính năng, tránh Technical Debt về sau.

## 1. KHÓA CẤU TRÚC MONOREPO (LOCKED)
Hệ thống sẽ tuân thủ tuyệt đối cấu trúc sau từ Phase 03:
```text
/
├── apps/               # Các ứng dụng cốt lõi (Microservices)
│   ├── frontend/       # Next.js 15 UI
│   ├── orchestrator/   # Node.js API Gateway / Event Bus
│   └── backend-ai/     # FastAPI Python Engine
├── bots/               # Các bot tự hành độc lập
│   ├── minecraft-engine/
│   └── dino-cv-bot/
├── packages/           # Thư viện dùng chung
│   ├── shared-types/   # TypeScript Interfaces dùng chung giữa Frontend & Node
│   ├── shared-utils/
│   └── eslint-config/
├── infra/              # Hạ tầng Deploy & Observability
│   ├── nginx/          # Reverse Proxy cấu hình
│   ├── postgres/       # Init scripts cho DB
│   └── observability/  # Placeholder cho Prometheus, Grafana
├── scripts/            # Automation
│   ├── bootstrap.ps1   # Multi-platform setup
│   └── bootstrap.sh
└── docker/             # Các file cấu hình Compose
    ├── docker-compose.dev.yml
    └── docker-compose.prod.yml
```

## 2. QUY CHUẨN MÔI TRƯỜNG (ENVIRONMENT STRATEGY)
Mỗi service (`apps/*`, `bots/*`) bắt buộc phải có:
- `.env.example`: File mẫu (commit lên Git).
- `.env`: File môi trường cục bộ (bị ignore).
- Quản lý tập trung: Không hardcode bất kỳ URL hay API Key nào.

## 3. DOCKER COMPOSE STRATEGY (DEV VS PROD)
Tách biệt hoàn toàn môi trường:
- **`docker-compose.dev.yml`**: Dùng cho Local. Mount trực tiếp source code (`volumes: - .:/app`) để hot-reload, không build image production.
- **`docker-compose.prod.yml`**: Immutable images, Restart policy (`unless-stopped`), giới hạn tài nguyên.

## 4. REVERSE PROXY (NGINX)
- Cửa ngõ duy nhất (Port 80/443).
- Routing tập trung:
  - `/api/*` -> `orchestrator`
  - `/ai/*` -> `backend-ai`
  - `/` -> `frontend`
- Xử lý CORS và Rate Limit ở tầng Nginx.

## 5. HEALTHCHECK MANDATE
Tất cả các service trong `docker-compose` phải có `healthcheck` và `depends_on: condition: service_healthy` để tránh tình trạng khởi động lỗi dây chuyền (Orchestrator gọi AI khi AI chưa boot xong).

## 6. PYTHON ECOSYSTEM & GPU AWARENESS
- **Package Manager:** Chuyển sang dùng `uv` thay cho `pip` truyền thống ở `backend-ai` để tăng tốc độ cài đặt Docker CI/CD lên x10-100 lần.
- **GPU Ready:** Trong file `docker-compose.prod.yml`, service `backend-ai` sẽ được đính kèm resource reservation cho GPU `capabilities: [gpu]`.

## 7. ĐA NỀN TẢNG (CROSS-PLATFORM AUTOMATION)
Các script khởi tạo sẽ được viết bằng 2 phiên bản: `Bash (.sh)` cho Linux/Mac/WSL và `PowerShell (.ps1)` cho Windows native.

---
**Trạng thái:** Đã chốt kiến trúc. Chuẩn bị thực thi Task 1 (Viết Dockerfile).
