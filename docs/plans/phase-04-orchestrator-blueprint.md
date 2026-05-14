# 🚀 BLUEPRINT PHASE 04: AI OPERATING PLATFORM (ORCHESTRATOR & DATABASE)

**Tầm nhìn:** Chuyển đổi hệ thống từ "Infra Skeleton" (Bộ khung hạ tầng) sang một "AI Operating Platform" thực thụ.

---

## 🏛️ CROSS-CHECK & RISK ASSESSMENT (Strategy Dept)
- **Architectural Risk:** Tích hợp cùng lúc Prisma (DB), Redis (Queue), và Sockets (Realtime) trong một Phase là rủi ro cực cao về cấu hình môi trường và race-conditions.
- **Mitigation (Giảm thiểu):** Chia nhỏ Phase 04 thành 4 chặng (Sub-phases) hoàn toàn độc lập. Yêu cầu Engineering Dept hoàn thành và test từng chặng trước khi sang chặng tiếp theo.
- **Agile Scope:** Tạm gác Clerk/Supabase Auth phức tạp. Dùng JWT RS256 cơ bản để bảo vệ API Gateway trước, giữ cho Phase này tập trung thuần túy vào Hạ tầng Dữ liệu (Data Infra).

---

## 📋 ATOMIC EXECUTION PLAN (Checklist cho Engineering)

### Chặng 4A: Core Gateway & Enterprise Base
- [ ] Khởi tạo thư mục `apps/orchestrator` (Node.js/Express) nếu chưa có cấu trúc chuẩn.
- [ ] Thiết lập `packages/shared-types`: Chứa file `index.ts` xuất các DTO (Data Transfer Objects) cơ bản để xài chung.
- [ ] Cấu hình **Observability Awareness**: Cài đặt `pino` và `pino-http` thay cho `console.log`.
- [ ] Cấu hình **Secrets Management Awareness**: Load file `.env` qua module gom nhóm (vd: `src/config/env.ts`), ném lỗi ngay lúc khởi động nếu thiếu biến môi trường.

### Chặng 4B: Prisma & Database Schema
- [ ] Cài đặt `prisma` vào `apps/orchestrator`. Khởi tạo `schema.prisma`.
- [ ] Thiết kế Data Model: `User`, `Session`, `Document`, `AI_Task`.
- [ ] Kích hoạt plugin `pgvector` trong Prisma (Raw SQL / extension) để dọn đường cho RAG Pipeline (Phase 06).
- [ ] Chạy `prisma migrate dev` để đồng bộ bảng xuống container Postgres đang chạy.
- [ ] Viết module `src/services/db.service.ts` để quản lý Prisma Client (tránh connection leak).

### Chặng 4C: Asynchronous Task Queue (Redis + BullMQ)
- [ ] Cài đặt `bullmq` và `ioredis`.
- [ ] Viết module `src/queue/connection.ts` để kết nối Redis container.
- [ ] Khởi tạo Queue `ai-tasks`.
- [ ] Viết một Worker cơ bản lắng nghe `ai-tasks` (Chỉ cần log ra "Processing task X" kèm `setTimeout` để giả lập delay).

### Chặng 4D: API Gateway & Real-time Sockets
- [ ] Viết middleware JWT Auth (Bảo vệ các route nhạy cảm).
- [ ] Viết middleware Rate Limiter (dựa trên Redis) ở tầng App (nếu Nginx Gateway chưa đủ linh hoạt cho per-user limits).
- [ ] Tích hợp `socket.io` vào server Express.
- [ ] Cấu hình luồng bắn event: Khi BullMQ Worker (Chặng 4C) xử lý xong task, bắn một event Socket về client báo "Task Complete".

---

## 🚀 THE HANDOFF (Bàn giao)
*Văn bản này đã được Strategy Dept chốt hạ kiến trúc và chia nhỏ rủi ro.*
**Khẩu lệnh kích hoạt:** *"Phase 04 plan is locked. Engineering Dept (dept-engineering), commence execution."*
