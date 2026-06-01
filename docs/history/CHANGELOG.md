# 📜 CHANGELOG & ARCHITECTURE DECISIONS

File này lưu lại lịch sử thay đổi của dự án. Không chỉ ghi LÀM GÌ, mà phải ghi TẠI SAO LẠI LÀM THẾ.

## [Unreleased] - Ngày bắt đầu chuẩn hóa
### Added
- Khởi tạo bộ khung dự án theo chuẩn Documentation as Code.
- Lý do (TẠI SAO): Việc quản trị context quá lỏng lẻo dẫn đến AI quên luồng, do đó cần thiết lập `AGENTS.md`, `brief.md`, `BRD.md` ngay từ đầu.

### UI Architecture (Phase 01)
- **Added:** Hệ thống Logo sử dụng `mix-blend-screen` và `invert` thay vì xóa nền trắng.
  - *Lý do (Why):* Giúp linh hoạt đổi màu logo từ đen sang trắng phát sáng mà không cần Photoshop, hỗ trợ tối đa khi áp dụng Dark Mode.
- **Added:** Chuyển đổi Popup Menu của Sidebar từ (Route, Bundler) sang (Profile, Shortcuts, Help).
  - *Lý do (Why):* Menu mặc định của Next.js DevTools chỉ mang tính kỹ thuật. Cập nhật lại để tối ưu hóa Trải nghiệm Người dùng (UX) và sát với nhu cầu thực tế của User.
- **Added:** Xây dựng `PreferencesModal` với Framer Motion.
  - *Lý do (Why):* Cần một bảng điều khiển trung tâm để quản lý Ngôn ngữ, UI và AI Model trước khi code tính năng Backend, nhằm đảm bảo "Khung UI chuẩn Vibe" đã sẵn sàng.
- **Added:** Bản dựng trang `The Vault` (Kho Trí Thức) với mô phỏng RAG Knowledge Graph bằng hạt dữ liệu.
  - *Lý do (Why):* Cần cho User hình dung trước cách dữ liệu PDF được "băm nhỏ" và xoay quanh Lõi AI, từ đó chốt thiết kế trước khi đấu nối Vector Database (ChromaDB) ở Phase 04.
- **Added:** Giao diện `AI Engines Fleet` và `Engine Detail Config`.
  - *Lý do (Why):* Cần trạm điều khiển cho các tác vụ chạy ngầm. Đặc biệt đã code thêm module `Swarm Accounts` dành riêng cho Minecraft để quản lý multi-account cày Top AFK.
- **Added:** Giao diện `Integrations Hub`.
  - *Lý do (Why):* Nơi tập trung quản lý API Key và Webhook. Thiết kế với tính năng che Pass (Mockup) và cảnh báo bảo mật nghiêm ngặt.
- **Architecture Decision:** Chốt kiến trúc lõi Backend RAG thành mô hình `Chimera GraphRAG`.
  - *Lý do (Why):* Từ bỏ Vector RAG truyền thống. Chọn kết hợp `Neo4j AuraDB` (Miễn phí trên Cloud) làm Lõi Đồ thị, `RAGFlow DeepDoc` làm cỗ máy băm tài liệu OCR, và `Intent Router` làm bộ điều hướng câu hỏi để tối ưu hóa chi phí API.
- **Architecture Decision:** Chốt thuật toán chống ban cho Minecraft Bot: `Stealth AFK Ladder`.
  - *Lý do (Why):* Nếu cắm nhiều acc liên tục sẽ bị Admin phát hiện. Cần áp dụng thuật toán "Treo lệch pha ngẫu nhiên (Jitter Margin)" và "Ngắt kết nối bất đối xứng" để giữ vững thứ hạng top một cách tàng hình.
- **Added:** Giao diện `Experiments Sandbox` (Khu thử nghiệm).
  - *Lý do (Why):* Cần một "Phòng thí nghiệm lõi" độc lập để chạy thử các thuật toán rủi ro cao (như thử DeepDoc OCR, thử Mineflayer auto-rest) trước khi tích hợp vào hệ thống chính.
- **Audited:** Tạo báo cáo kiểm thử tại `docs/vault/lessons-learned/qa-report-vault-ui.md`.

### DevOps & Monorepo Architecture (Phase 03)
- **Architecture Decision:** Khóa cấu trúc Monorepo (`apps`, `packages`, `infra`, `docker`, `bots`, `scripts`).
  - *Lý do (Why):* Giúp mở rộng (scale) sau này cực kỳ dễ dàng (chuẩn bị cho Turborepo hoặc pnpm workspace), tránh component/DTO bị lặp lại (DRY).
- **Architecture Decision:** Áp dụng Nginx làm Reverse Proxy duy nhất.
  - *Lý do (Why):* Centralized routing (`/api`, `/ai`), xử lý CORS, Rate Limit và SSL tập trung thay vì để từng Node app tự gồng gánh.
- **Architecture Decision:** Tách file Compose thành `docker-compose.dev.yml` và `docker-compose.prod.yml`.
  - *Lý do (Why):* Môi trường Local cần Hot-reload (Bind mount), trong khi Production cần Immutable Images và tối ưu resource. Không thể dùng chung 1 file được.
- **Architecture Decision:** Áp dụng `uv` thay cho `pip` cho Python AI Engine.
  - *Lý do (Why):* `uv` viết bằng Rust giúp cài đặt thư viện Python nhanh hơn 10-100 lần, cực kỳ quan trọng để giảm thời gian build Docker CI/CD cho AI.
- **Architecture Decision:** Đưa Healthcheck và GPU Readiness vào tiêu chuẩn bắt buộc cho Docker Compose.
  - *Lý do (Why):* Tránh lỗi dây chuyền khi Boot hệ thống (Orchestrator boot xong nhưng DB/AI chưa ready). Đảm bảo Container AI có thể map với GPU sau này mà không cần refactor file.

### Completed Phase 03 (DevOps & Automation Execution)
- **Added:** `apps/frontend/Dockerfile`, `apps/orchestrator/Dockerfile`, `apps/backend-ai/Dockerfile`.
  - *Lý do (Why):* Đóng gói Monorepo thành các microservices độc lập theo chuẩn Multi-stage build để tối ưu size và bảo mật (non-root user).
- **Added:** `docker/docker-compose.dev.yml` và `docker/docker-compose.prod.yml`.
  - *Lý do (Why):* Tách bạch rõ môi trường. Dev dùng Bind mount để Hot Reload. Prod dùng Immutable Image với Healthchecks nghiêm ngặt.
- **Added:** `infra/nginx/nginx.conf`.
  - *Lý do (Why):* Hoạt động như API Gateway, điều hướng `/api/` về Node và `/ai/` về Python. Giải quyết triệt để CORS issue.
- **Added:** `scripts/bootstrap.ps1` và `scripts/bootstrap.sh`.
  - *Lý do (Why):* Script đa nền tảng giúp 1-click clone .env, cài Node modules, và xài `uv pip` cài Python. Xóa bỏ quá trình onboarding bằng tay.
- **Added:** `.github/workflows/ci.yml`.
  - *Lý do (Why):* Gác cổng chặn bug. Mỗi khi Push code, GitHub Actions sẽ check Lint, Type (TS), và build thử Docker để bắt lỗi hạ tầng ngay trên mây.

### Architecture Review & Phase 04 Kickoff
- **Architecture Review:** Đánh giá Maturity của dự án đạt 7.5/10 (SaaS nhỏ) -> Nâng cấp lên 9/10 qua bản tối ưu Phase 3.1. Đã phân tích và ghi nhận các "lỗ hổng" Enterprise cần bù đắp dần trong tương lai: Secrets Management, Observability, Queue System, Rate Limiting, Deployment Strategy, và True GPU Orchestration.
  - *Lý do (Why):* Nhận thức đúng Tech Debt từ sớm giúp định hình mã nguồn (Source code) linh hoạt, dễ tích hợp các hệ thống này vào các Phase sau.
- **Added Blueprint:** Khởi tạo `docs/plans/phase-04-orchestrator-blueprint.md`.
  - *Lý do (Why):* Lên thiết kế lõi cho Phase 04 tập trung vào: Shared Contracts (DRY), Prisma Database, Queue System (BullMQ), và Real-time WebSockets. Chuyển đổi trạng thái từ "Infra skeleton" sang "AI Operating Platform".
- **Documentation Sync:** Cập nhật `README.md` và `docs/directory-tree-simplified.md` với sơ đồ Monorepo mới nhất (bao gồm `infra`, `docker`, `packages`).
  - *Lý do (Why):* Giữ cho Second Brain luôn đồng bộ với thực tế Codebase. Đảm bảo Dev mới clone về biết gõ lệnh Docker thay vì cài tay.

### Vision Agent Research & BA Specification (Phase 04 Addendum) - 27-05-2026
- **Added:** Tài liệu Đặc tả Yêu cầu Nghiệp vụ (BRD) tại `docs/vault/ba_report_local_agent.md` cho Local Vision-Based Computer Use Agent ("OpenClaw").
  - *Lý do (Why):* Trước khi tiến hành viết code logic điều khiển (PyAutoGUI) và thị giác (YOLOv8), cần định nghĩa rõ ranh giới nghiệp vụ (Business Rules), hạn mức tài chính, cơ chế an toàn dừng khẩn cấp (Fail-Safe), và các kịch bản kiểm thử UAT để đảm bảo hệ thống an toàn 100% khi chạy On-Premise trên máy trạm Legion R9000P và tương tác với các API cơ sở dữ liệu nội bộ Medstand.

### Tích hợp Lõi Nhận Thức Xác Định (Deterministic Cognitive Runtime - Phase 05 Kickoff) - 01-06-2026
- **Added:** Thư mục cấu hình tác nhân `.agent/` từ `prompt_sample` chứa các lớp định nghĩa tác nhân (`agents/`), nhân vật (`kernel/`), cấu hình dự án (`project/`), và lớp trạng thái (`runtime/`).
  - *Lý do (Why):* Định hình hành vi và ranh giới hoạt động của tác nhân trong IDE (ví dụ: các luật `cognitive-laws`, `manifest` của từng vai trò) một cách rõ ràng và kiểm soát được thay vì để tác nhân tự do suy luận bừa bãi.
- **Merged:** Tích hợp 6 định luật nhận thức bất biến (6 Immutable Laws) của Lõi Nhận Thức Xác Định vào file `AGENTS.md` ở thư mục gốc.
  - *Lý do (Why):* Đảm bảo tính nhất quán tuyệt đối giữa Đạo luật vận hành Antigravity (Operating Doctrine) và các định luật nhận thức xác định (Deterministic Cognitive Laws) tại thời điểm thực thi.

### Triển khai Hoàn Tất Phase 04: AI Operating Platform (Orchestrator & Database) - 01-06-2026
- **Added:** Gói kiểu dữ liệu dùng chung `packages/shared-types` và bản sao cục bộ `apps/orchestrator/src/types/shared-types.ts`.
  - *Lý do (Why):* Định hình hợp đồng dữ liệu chuẩn hóa (User, Goal, Task, Tool, World State) đồng nhất xuyên suốt Monorepo.
- **Added:** Khởi tạo cấu hình và bộ ghi log chuyên dụng `apps/orchestrator/src/config/env.ts` và `logger.ts` sử dụng `pino` và `dotenv`.
  - *Lý do (Why):* Tăng cường tính năng tự quan sát (Observability) và kiểm duyệt chặt chẽ tính sẵn sàng của tài nguyên hệ thống khi khởi động.
- **Added:** Thiết kế Schema dữ liệu `prisma/schema.prisma` và dịch vụ `src/services/db.service.ts`.
  - *Lý do (Why):* Cung cấp lõi dữ liệu cho kiến trúc Goal-driven với khả năng mô hình hóa Đồ thị Đồ tác vụ (DAG Task Graph) và kích hoạt tự động phần mở rộng `pgvector` phục vụ RAG.
- **Added:** Tích hợp hàng đợi xử lý tác vụ bất đồng bộ `src/queue/taskQueue.ts`, `connection.ts` và worker `taskWorker.ts` sử dụng BullMQ và Redis.
  - *Lý do (Why):* Cho phép thực thi các tác vụ nặng (như mở ứng dụng, tương tác UI, chụp ảnh màn hình) ở chế độ ngầm và cập nhật trạng thái chi tiết của từng lớp nhận thức.
- **Added:** Thiết lập middleware bảo mật `auth.middleware.ts`, `rateLimiter.middleware.ts` và tái cấu trúc `server.ts` tích hợp Socket.io.
  - *Lý do (Why):* Bảo vệ API chống spam bằng bộ giới hạn tần suất dựa trên Redis, xác thực bằng JWT Bearer, và truyền phát log thời gian thực về Dashboard phục vụ quan sát.
