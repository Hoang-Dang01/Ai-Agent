# 🚀 Ai-Agent: Vibe Ecosystem 2026

**Tầm nhìn:** Hệ sinh thái AI (AI-Native Ecosystem) được xây dựng theo kiến trúc Monorepo chuẩn công nghiệp (Production-grade). Tích hợp AI tạo sinh, RAG Pipeline, giao diện Vibe UI và khả năng điều phối bầy đàn Agent (Swarm) tự hành thông qua Nginx Reverse Proxy và Docker Orchestration.

---

## 🏛️ Kiến trúc Monorepo (Vibe Blueprint)

Dự án được cấu trúc theo triết lý "Hạt nhân & Phòng ban" nhằm đảm bảo khả năng mở rộng vô hạn và không bao giờ bị mất ngữ cảnh (Context Drift). Mọi thao tác phát triển đều được tự động hóa tài liệu hóa (Documentation as Code).

### 1. 🚀 `apps/` (Tầng Thực Thi Lõi - Microservices)
- `frontend/`: Giao diện người dùng Next.js 15 (Vibe UI, Standalone output).
- `backend-ai/`: Khối động cơ AI xử lý RAG Pipeline và LLM Inference (Python FastAPI, quản lý package bằng `uv`, sẵn sàng CUDA/GPU).
- `orchestrator/`: Nhạc trưởng điều phối dữ liệu, Database Schema và API Gateway nội bộ (Node.js/Express, tích hợp BullMQ/Redis).

### 2. 🤖 `bots/` (Khu Vực Sandbox Tự Hành)
- `minecraft-engine/`: Bot tự hành trong môi trường vật lý ảo (Minecraft AFK & Navigation).
- `dino-cv-bot/`: Bot nhận diện hình ảnh Computer Vision.

### 3. 📦 `packages/` (Tầng Chia Sẻ)
- Nơi chứa cấu hình, type definitions (TS) và utility functions dùng chung cho toàn bộ monorepo (DRY).

### 4. 🛡️ `infra/` & `docker/` (Hạ Tầng & DevOps)
- `docker/`: Chứa các bản thiết kế Docker Compose (`dev.yml`, `prod.yml`, `obs.yml`) để phân tách môi trường.
- `infra/nginx/`: Trạm gác cổng (Reverse Proxy) xử lý Rate Limit, Security Headers và định tuyến API.
- `infra/observability/`: Giám sát sức khỏe hệ thống (Prometheus, Grafana).

### 5. 🧠 `docs/` (The Second Brain - Hầm Trú Ẩn Tri Thức)
- `plans/`: Lộ trình thi công (`master-plan.md`) và blueprint từng Phase.
- `history/`: Lịch sử quyết định kiến trúc (`CHANGELOG.md`).
- `vault/`: Hầm lưu trữ bài học xương máu (`lessons-learned`) và thiết kế kỹ thuật.

### 6. 🛠️ `scripts/` (DevOps & Utilities)
- Các kịch bản tự động hóa khởi tạo môi trường 1-click (Bash / PowerShell).

---

## ⚡ Hướng dẫn Khởi động & Deploy (1-Click Onboarding)

Dự án đã được tự động hóa hoàn toàn bằng Docker Compose và Bootstrap Scripts. Khi clone code về, bạn không cần cài tay bất cứ module nào.

**Cách 1: Triển khai Cục bộ để Code (Hot-Reload Mode)**
```bash
# 1. Khởi tạo môi trường tự động (Tự tạo .env, tự cài node_modules và python uv venv)
# Trên Linux/Mac/WSL:
./scripts/bootstrap.sh
# Trên Windows:
.\scripts\bootstrap.ps1

# 2. Bật toàn bộ hệ thống bằng Docker Compose (Dùng bind-mount)
docker compose -f docker/docker-compose.dev.yml up -d
```
*Giao diện sẽ chạy tại `http://localhost` (Đi qua Nginx Gateway).*

**Cách 2: Triển khai Production (Immutable & Secured)**
```bash
docker compose -f docker/docker-compose.prod.yml up -d --build
```
*Tích hợp Healthchecks, Giới hạn tài nguyên, Rate Limiting và chạy non-root user.*

---

## 🎨 Kiến trúc Dynamic UI Engine
Hệ thống Frontend (`apps/frontend`) được trang bị **Theme Engine** cấp độ công nghiệp, hỗ trợ hoán đổi phong cách thiết kế ngay trong thời gian thực (Real-time):
- **Dark Mode (Vibe UI):** Mặc định với hiệu ứng Kính (Glassmorphism), viền Neon và ánh sáng hạt (Framer Motion).
- **Light Mode (Neo-Brutalism):** Phong cách thô mộc, góc cạnh (Sci-Fi), nền sáng chói. Tối ưu xử lý dữ liệu.

---
> ⚠️ **LUẬT THÉP:** Mọi Developer (Human/AI) khi đóng góp mã nguồn ĐỀU PHẢI đọc và tuân thủ tuyệt đối **[AGENTS.md](./AGENTS.md)** (The Antigravity Operational Kernel V5.0). Việc code mù quáng mà bỏ qua *Pre-Flight Check* sẽ bị từ chối.
