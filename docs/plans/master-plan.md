# 🗺️ MASTER PLAN: VIBE-AGENT 2026 ECOSYSTEM
**Trạng thái:** Đang thực thi
**Tầm nhìn:** Xây dựng một Hệ sinh thái AI (AI-Native Ecosystem) tự hành với cấu trúc Monorepo, có khả năng quản lý tri thức, điều phối các agent độc lập (RAG, Game Bot, CV Bot) và cung cấp giao diện giao tiếp thời gian thực chuẩn Vibe UI.

---

## 🏗️ PHẦN 1: FOUNDATION & INFRASTRUCTURE (Giai đoạn Nền tảng)
- [x] **Phase 01:** Thiết lập kiến trúc cốt lõi (Vibe Architecture) và hệ thống thư mục Monorepo.
- [x] **Phase 02:** Kích hoạt 5 Phòng ban AI (Agents Departments) và "The Second Brain" (Vault).
- [x] **Phase 03:** Thiết lập CI/CD Pipeline, Dockerize và kịch bản Automation (scripts).
- [ ] **Phase 04:** Khởi tạo Backend Orchestrator (Node.js) & thiết kế Database Schema (Prisma).

## 🧠 PHẦN 2: AI ENGINE & COGNITIVE CORE (Lõi Nhận thức)
- [ ] **Phase 05:** Khởi tạo Python AI Engine (FastAPI) & kết nối Local/Cloud LLM (Ollama/OpenRouter).
- [ ] **Phase 06:** Tích hợp RAG Pipeline (Vector Database: ChromaDB/Qdrant).
- [ ] **Phase 07:** Nâng cấp Knowledge Graph (GraphRAG) để AI hiểu mối quan hệ dữ liệu phức tạp.
- [ ] **Phase 08:** Xây dựng Data Ingestion Engine (Tiếp nhận tài liệu PDF, Markdown, Cào web).

## 🔌 PHẦN 3: ORCHESTRATION & INTEGRATION (Điều phối & Tích hợp)
- [ ] **Phase 09:** Xây dựng API Gateway & Event Bus (Kết nối Node.js với Python Engine).
- [ ] **Phase 10:** Tích hợp Hệ thống Xác thực (Clerk / Supabase Auth).
- [ ] **Phase 11:** Thiết lập n8n Automation Workflows (Tự động hóa luồng nghiệp vụ).
- [ ] **Phase 12:** Tích hợp Payment Gateway (Stripe / Lemon Squeezy).

## 🎨 PHẦN 4: FRONTEND & VIBE UI (Giao diện Người dùng)
- [ ] **Phase 13:** Khởi tạo Next.js App, tích hợp TailwindCSS & Shadcn UI.
- [ ] **Phase 14:** Áp dụng Design System "Glassmorphism" xuyên suốt các trang.
- [ ] **Phase 15:** Xây dựng Workspace Dashboard & Agent Chat Interface.
- [ ] **Phase 16:** Xử lý Real-time Streaming UI (WebSockets / SSE) để hiển thị luồng tư duy của AI.

## 🧪 PHẦN 5: BOTS & AUTONOMOUS AGENTS (Thực nghiệm & Tự hành)
- [ ] **Phase 18:** Tích hợp Dino CV Bot (Module nhận diện hình ảnh Computer Vision).
- [ ] **Phase 19:** Triệu hồi "Virtual Customer Swarm" (Phòng Research) để stress-test hệ thống.
- [ ] **Phase 20:** Tối ưu hóa toàn diện, Security Audit và Deploy lên Production (Vercel + DigitalOcean) -> **V1.0 Launch!**

---
> **Lưu ý cho Phòng Tri thức (Knowledge Dept):** 
> Sau khi mỗi Phase kết thúc, hãy đánh dấu `[x]` vào ô tương ứng, đồng thời tạo ra một file `docs/plans/phase-xx-ten.md` mới để quy hoạch chi tiết cho Phase tiếp theo. Ghi chép mọi lỗi lầm vào `docs/vault/lessons-learned/`.
