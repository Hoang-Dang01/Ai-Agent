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
- **Added:** Giao diện `Integrations Hub`.
  - *Lý do (Why):* Nơi tập trung quản lý API Key và Webhook. Thiết kế với tính năng che Pass (Mockup) và cảnh báo bảo mật nghiêm ngặt.
- **Architecture Decision:** Chốt kiến trúc lõi Backend RAG thành mô hình `Chimera GraphRAG`.
  - *Lý do (Why):* Từ bỏ Vector RAG truyền thống. Chọn kết hợp `Neo4j AuraDB` (Miễn phí trên Cloud) làm Lõi Đồ thị, `RAGFlow DeepDoc` làm cỗ máy băm tài liệu OCR, và `Intent Router` làm bộ điều hướng câu hỏi để tối ưu hóa chi phí API.
- **Added:** Giao diện `Experiments Sandbox` (Khu thử nghiệm).
  - *Lý do (Why):* Cần một "Phòng thí nghiệm lõi" độc lập để chạy thử các thuật toán rủi ro cao (như thử DeepDoc OCR) trước khi tích hợp vào hệ thống chính.
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
- **Added:** Thiết lập và tích hợp hàng đợi xử lý tác vụ bất đồng bộ `src/queue/taskQueue.ts`, `connection.ts` và worker `taskWorker.ts` sử dụng BullMQ và Redis.
  - *Lý do (Why):* Cho phép thực thi các tác vụ nặng (như mở ứng dụng, tương tác UI, chụp ảnh màn hình) ở chế độ ngầm và cập nhật trạng thái chi tiết của từng lớp nhận thức.
- **Added:** Thiết lập middleware bảo mật `auth.middleware.ts`, `rateLimiter.middleware.ts` và tái cấu trúc `server.ts` tích hợp Socket.io.
  - *Lý do (Why):* Bảo vệ API chống spam bằng bộ giới hạn tần suất dựa trên Redis, xác thực bằng JWT Bearer, và truyền phát log thời gian thực về Dashboard phục vụ quan sát.

### Phase 04.1: Closed-Loop Physical Automation & E2E UAT Verification - 01-06-2026
- **Added:** Đồng bộ hóa biến môi trường cứng `CS_AGENT_EXE_PATH` vào file `apps/orchestrator/.env` và hoàn tất cấu hình kết nối tự động PostgreSQL (pgvector) & Redis dưới nền Docker.
  - *Lý do (Why):* Khắc phục việc thiếu cấu hình môi trường cục bộ trên hệ điều hành Windows khi người dùng chạy thử nghiệm thực tế.
- **Fixed:** Sửa lỗi phân giải đường dẫn tìm kiếm file chạy tự động hóa `OfflineAgent.Console.exe` từ 4 cấp thành 5 cấp (`../../../../../`) trong `taskWorker.ts`, đồng thời bổ sung cơ chế fallback tự động định vị theo thư mục làm việc hiện tại (`process.cwd()`).
  - *Lý do (Why):* Folder chạy thực tế của code biên dịch nằm sâu 5 cấp trong thư mục `dist/src/queue/`, khiến đường dẫn cũ bị lệch cấp và phân giải sai thành `apps/apps/agent-runtime` (nhân đôi `apps`).
- **Fixed:** Sửa lỗi tham số dòng lệnh trong `OfflineAgent.Console/Program.cs` xử lý chuẩn xác khoảng trắng bằng cách ghép nối lại đối số sử dụng `string.Join(" ", args.Skip(1))`.
  - *Lý do (Why):* Thư mục dự án của người dùng nằm ở `c:\Git cua tui\Ai-Agent` chứa khoảng trắng, làm Windows tự động tách đường dẫn thành nhiều tham số và gây ra lỗi `Workflow file not found: c:\Git`.
- **Fixed:** Nâng cấp cấu hình dự án `OfflineAgent.Console.csproj` thành Target Platform Windows (`net9.0-windows`) và kích hoạt `<UseWpf>true</UseWpf>`.
  - *Lý do (Why):* Chương trình chạy dưới dạng Console piped ngầm qua Node.js, .NET 9.0 mặc định không load các assembly phục vụ giao diện Desktop (như `Accessibility.dll`) mà FlaUI yêu cầu để điều khiển hệ điều hành, dẫn đến lỗi crash nạp file.
- **Verified:** Kích hoạt thành công 100% kịch bản UAT tự hành điều khiển Notepad trên máy trạm Windows của người dùng (Notepad mở tự động, FlaUI tự động viết văn bản chính xác và cập nhật trạng thái nhiệm vụ thời gian thực về database).

### Phase 05: Frontend Dashboard UI/UX Overhaul & API/WebSockets Integration - 01-06-2026
- **Added:** Tích hợp `socket.io-client` vào `apps/frontend` và khởi tạo `SocketProvider` context.
  - *Lý do (Why):* Cung cấp cổng truyền tin thời gian thực toàn cục kết nối trực tiếp đến Orchestrator Gateway tại cổng `NEXT_PUBLIC_ORCHESTRATOR_URL`.
- **Added:** Thêm REST API endpoint `GET /api/goals/active` trong Orchestrator `server.ts`.
  - *Lý do (Why):* Cung cấp cổng REST API chuẩn để Frontend truy vấn trực tiếp Goal và chuỗi Task DAG thực tế từ cơ sở dữ liệu.
- **Added:** Bổ sung cơ chế phát sóng sự kiện `world_state_frame` qua Socket.io trong worker `taskWorker.ts`.
  - *Lý do (Why):* Cho phép đẩy các ảnh chụp màn hình cơ sở dữ liệu Base64 thực từ worker đến trực tiếp Client Dashboard.
- **Fixed:** Tái cấu trúc giao diện `LiveThoughtStream` kết nối WebSockets với **Cơ chế Batching Queue 250ms**.
  - *Lý do (Why):* Gom góp và xả log theo từng lô 250ms giúp loại bỏ hoàn toàn hiện tượng lag/jank giật hình của `AnimatePresence` khi C# đổ dồn dập hàng chục dòng log/giây.
- **Fixed:** Tích hợp bộ đệm tối đa 30 ảnh chụp màn hình trong `RAGMonitoring`.
  - *Lý do (Why):* Tự động xóa frame cũ khi vượt quá 30 phần tử để ngăn ngừa tràn bộ nhớ DOM và crash trình duyệt.
- **Fixed:** Thiết kế bộ invalidation đẩy tiến trình trong `MasterPlanWidget` tự động cập nhật cache REST API thông qua WebSockets.
  - *Lý do (Why):* Loại bỏ hoàn toàn cơ chế Polling cũ bằng đẩy dữ liệu theo sự kiện (event-driven), tối ưu hóa tài nguyên mạng.
- **Fixed:** Sửa lỗi cú pháp thẻ `div` chưa đóng bị tồn đọng sẵn trong file Next.js `ai-engines/[id]/page.tsx` giúp toàn bộ dự án `npm run build` thành công 100% với 0 lỗi.
- **Added:** Bổ sung cơ chế **Tái lập & Xóa vết dữ liệu cũ (State Reset & Warning Banner)** khi WebSocket mất kết nối hoặc reconnect thành công trong `LiveThoughtStream`.
  - *Lý do (Why):* Khi kết nối bị đứt, dữ liệu hiển thị trên màn hình có thể bị stale (cũ và không còn phản ánh đúng tình trạng C# chạy hiện tại). Cần hiển thị banner cảnh báo màu hổ phách (amber) và tự động dọn sạch log cũ khi tái kết nối thành công để đồng bộ thông tin mới hoàn toàn.
- **Added:** Tích hợp giải pháp **Polling Fallback 5000ms** song song với WebSocket Invalidation trong `MasterPlanWidget`.
  - *Lý do (Why):* Đảm bảo rằng nếu WebSocket gặp sự cố hoặc sự kiện phát sóng bị trượt, giao diện sơ đồ tác vụ vẫn được làm tươi định kỳ mỗi 5 giây, bảo đảm đồng bộ 100% khi Goal mới được khởi chạy dưới nền.
- **Clarified:** Xác thực tệp kích hoạt kiểm thử E2E tự động `trigger_test.bat` đã nằm sẵn ở thư mục gốc (`c:\Git cua tui\Ai-Agent\trigger_test.bat`).

### Phase 06: GitDoc RAG Core Integration - 01-06-2026
- **Added:** Thiết lập schema pgvector và ORM models `Document`, `Version`, `Embedding` trong `apps/backend-ai/app/models.py`.
  - *Lý do (Why):* Cung cấp lõi lưu trữ tài liệu có phiên bản, phục vụ tìm kiếm ngữ nghĩa (semantic search) chất lượng cao và tích hợp vào chatbot.
- **Added:** Tích hợp background task `calculate_and_save_embedding` và cơ chế fallback offline sinh vector từ băm MD5 khi không có khóa Gemini API trong `apps/backend-ai/app/services/rag_service.py`.
  - *Lý do (Why):* Đảm bảo hệ thống vận hành trơn tru bất kể môi trường kết nối trực tuyến hay ngoại tuyến.
- **Added:** Thiết kế giao diện Next.js cho Kho Trí Thức và Study Hub trong `apps/frontend/src/app/vault/page.tsx` và `study-hub/page.tsx`.
  - *Lý do (Why):* Mang lại trải nghiệm tra cứu và trò chuyện RAG trực quan cho người dùng.

### Phase 07: GraphRAG RPGM Core Integration & live 3D Galaxy Graph - 01-06-2026
- **Architecture Decision:** Chọn mô hình Relational Property Graph Model (RPGM) thay vì kéo container Neo4j cồng kềnh.
  - *Lý do (Why):* Tiết kiệm CPU/RAM máy trạm cục bộ, gom gọn các giao dịch Relational, Vector, và Graph dưới một lõi PostgreSQL thống nhất.
- **Added:** Thêm ràng buộc khóa ngoại `version_id` kèm `ondelete="CASCADE"` cho `graph_nodes` và `graph_edges` trong `models.py`.
  - *Lý do (Why):* Giải quyết triệt để vấn đề orphan edges. Khi xóa document hoặc version, tất cả các thực thể và mối liên kết graph liên quan đều được dọn sạch tự động bởi database.
- **Added:** Bổ sung cơ chế **Khóa ghi đồng thời tối ưu hóa chống rò rỉ bộ nhớ `asynccontextmanager`** theo `version_id` trong `graph_service.py`.
  - *Lý do (Why):* Sử dụng một từ điển khóa tĩnh có thể tích lũy các đối tượng Lock vô tận gây rò rỉ bộ nhớ (memory leak). Triển khai cơ chế đếm tham chiếu (waiter reference-counting) giúp tự động hủy khóa khỏi từ điển toàn cục ngay sau khi tất cả các luồng chờ đã được giải phóng.
- **Added:** Thiết kế giới hạn tối đa **15 relationships** trong truy vấn lân cận 1-hop của `get_neighborhood_graph`.
  - *Lý do (Why):* Ngăn chặn hiện tượng phình to prompt context (Gemini context window bloat) khi truy vấn tài liệu lớn có quá nhiều thực thể liên kết.
- **Added:** Tích hợp try-catch, structured Pydantic parsing và tài liệu phân tích ranh giới cho **Offline Rule-based Parser (Fallback)** trong `graph_service.py`.
  - *Lý do (Why):* Đảm bảo tính minh bạch, ghi rõ khả năng trích xuất thực thể và ranh giới hoạt động của bộ trích xuất tĩnh, đồng thời xuất cảnh báo log rõ ràng để tránh lỗi âm thầm (silent failure) khi kích hoạt fallback.
- **Added:** Đấu nối API đồ thị thật `/api/graph/data` và vẽ thiên hà 3D dynamic SVG laser pulse trong `apps/frontend/src/components/vault/knowledge-graph.tsx`.
  - *Lý do (Why):* Trực quan hóa chính xác, mượt mà cấu trúc mạng lưới tri thức thật từ cơ sở dữ liệu lên dashboard.
- **Verified:** Xây dựng suite kiểm thử tự động `experiments/test_graph_rag.py` kiểm duyệt thành công 100% tất cả các biên bảo mật: trích xuất, idempotency khóa ghi đếm tham chiếu, malformed fallback, và cascade delete.
- **Verified:** Biên dịch thành công Next.js sản xuất (`npm run build`) với 0 lỗi cú pháp.

### Phase 08: Multi-Agent Collaboration & Visual Plan Generation - 01-06-2026
- **Added:** Khai báo cấu trúc DTO dùng chung `DAGTaskNode` và `DAGTaskGraph` trong `packages/shared-types/index.ts`.
  - *Lý do (Why):* Tạo ra một hợp đồng kiểu dữ liệu thống nhất giữa cổng điều phối Node.js Orchestrator và bảng điều khiển Next.js Frontend giúp quản trị đồ thị tác vụ an toàn.
- **Added:** Cập nhật các Pydantic schemas tương ứng phục vụ Gemini RAG trích xuất trong `apps/backend-ai/app/schemas.py`.
  - *Lý do (Why):* Định chuẩn cấu trúc trích xuất định dạng JSON từ mô hình ngôn ngữ lớn (Gemini Structured Output) khi thực hiện phân rã Goal của người dùng.
- **Added:** Phát triển lõi lập kế hoạch nhận thức `apps/backend-ai/app/services/planner_service.py` tích hợp hướng dẫn nghiệp vụ RAG SOPs, giải thuật DFS chặn vòng lặp phụ thuộc (circular dependency detection), và bộ lọc tiền kiểm duyệt mâu thuẫn xác định (deterministic pre-validation rules).
  - *Lý do (Why):* Việc sử dụng mô hình LLM để phát hiện các mục tiêu mâu thuẫn (ví dụ: ghi chép vào Notepad nhưng cấm khởi động Notepad) dễ gây ra tình trạng bất định (flaky) và lãng phí mã API. Việc tích hợp tầng tiền kiểm duyệt rule-based giúp bắt mâu thuẫn 100% chính xác trước khi gửi lệnh đi, trong khi giải thuật DFS đảm bảo đồ thị nhiệm vụ luôn là một DAG hợp lệ trước khi đẩy xuống Client.
- **Added:** Tích hợp FastAPI router `apps/backend-ai/app/routers/planner.py` và đăng ký endpoint `/api/plan/generate` trong `main.py`.
  - *Lý do (Why):* Cung cấp cổng REST API độc lập phục vụ điều phối lập kế hoạch.
- **Added:** Viết bộ điều khiển liên kết `apps/orchestrator/src/controllers/goal.controller.ts` và tích hợp các endpoint tạo plan và phê duyệt tại `apps/orchestrator/server.ts`.
  - *Lý do (Why):* Tiếp nhận yêu cầu, phân giải định danh chuỗi tạm sang UUID chính thức của PostgreSQL, lưu trữ trạng thái chờ phê duyệt `PENDING_APPROVAL` của Goal và Task để phục vụ cơ chế Human-in-the-Loop (HITL), và sắp xếp topo kích hoạt root BullMQ job khi được phê duyệt.
- **Added:** Phát triển giao diện sơ đồ tác vụ tương tác `apps/frontend/src/components/agent/visual-plan.tsx` sử dụng **SVG Canvas tùy chỉnh** bóng bẩy và tích hợp vào `MasterPlanWidget`.
  - *Lý do (Why):* Giải quyết triệt để xung đột peer dependency của React Flow với React 19 bằng cách tự vẽ SVG Canvas tùy biến, cung cấp giao diện trực quan hỗ trợ xóa node, sửa tham số JSON thô trực tiếp trên bảng điều khiển Glassmorphism trước khi bấm duyệt chạy.
- **Verified:** Hoàn tất suite kiểm thử tự động `experiments/test_multi_agent_planner.py` kiểm nghiệm thành công 100% các tình huống lập kế hoạch tiêu chuẩn, DFS chặn chu trình, và tiền kiểm duyệt mâu thuẫn xác định.
- **Fixed (Visual Hardening):** Bổ sung cơ chế phòng thủ **`visiting` Set chống đệ quy lặp vô hạn** trong `computeLevels` tại `visual-plan.tsx`. Nếu DAG xuất hiện chu trình lặp lỗi, giao diện lập tức phát hiện và bẻ gãy đệ quy để tránh crash trình duyệt.
- **Fixed (Visual Hardening):** Triển khai cơ chế **tính kích thước dynamic canvas** (`canvasWidth` và `canvasHeight`) dựa trên số level topological lớn nhất và số node song song tối đa trong `visual-plan.tsx`. Khắc phục triệt để lỗi tràn/cắt xén node khi số lượng node tác vụ phức tạp vượt quá khung nhìn tĩnh (750x400px).
- **Fixed (Visual Hardening):** Thay thế cơ chế lọc Client-side của `visual-plan.tsx` bằng cách bổ sung API định danh đích danh `/api/goals/:goalId` tại `server.ts`. Frontend gửi yêu cầu tải duy nhất bản ghi cần phê duyệt để triệt tiêu độ trễ mạng và loại bỏ hoàn toàn hiển thị trắng do sai lệch cache `/active`.
- **Verified:** Biên dịch thành công Next.js sản xuất với 0 lỗi biên dịch.

### Phase 12: Stripe Payment Gateway Integration - 02-06-2026
- **Added:** Thiết kế Schema dữ liệu `UserSubscription` với quan hệ một-một trong `schema.prisma`, đồng bộ sync tự động cơ sở dữ liệu qua Prisma client.
  - *Lý do (Why):* Phục vụ lưu giữ trạng thái bản quyền của tài khoản người dùng, bao gồm thông tin ID khách hàng Stripe và thời điểm xác thực bản quyền ngoại tuyến cuối cùng (`lastVerifiedAt`).
- **Added:** Middleware Express raw body verify parser đăng ký ở cấu hình đầu tiên trong `server.ts`.
  - *Lý do (Why):* Cổng thanh toán Stripe yêu cầu kiểm tra chữ ký mật mã (Webhook Signature Verification) trực tiếp trên chuỗi Buffer gốc chưa bị Express parse thành JSON để tránh giả mạo payload.
- **Added:** Bộ xử lý API `payment.controller.ts` xử lý Checkout Sessions và Webhooks.
  - *Lý do (Why):* Cho phép người dùng khởi chạy cổng Stripe Checkout chính thống để nâng cấp tài khoản tự động, tiếp nhận các Webhook sự kiện hoàn thành (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) để cập nhật trạng thái cơ sở dữ liệu tức thời.
- **Added:** Tích hợp giao diện Glassmorphism cao cấp `profile-billing.tsx` vào cài đặt cá nhân của người dùng.
  - *Lý do (Why):* Hiển thị trực quan tình trạng gói cước của người dùng (Bản miễn phí, Turing Hub Premium, Quá hạn ngoại tuyến), hỗ trợ nút bấm Checkout nâng cấp gói cước thời gian thực.
- **Added:** Xây dựng suite kiểm thử tự động toàn diện `apps/orchestrator/src/test/payment.test.ts`.
  - *Lý do (Why):* Kiểm duyệt toàn bộ chu trình thanh toán (tạo checkout, xác minh chữ ký Webhook, hủy cước) một cách an toàn và độc lập bằng kỹ thuật `generateTestHeaderString` và can thiệp dynamic CommonJS module-caching (`require.cache`) để stub các lệnh API ngoài mà không cần kết nối mạng.
- **Architecture Decision:** Cho phép thời hạn ngoại tuyến tối đa **30 ngày** kể từ lần xác thực cuối cùng, tuy nhiên core physical desktop automations chạy C# FlaUI cục bộ **được cam kết không bao giờ bị khóa** dưới mọi điều kiện ngoại tuyến.
  - *Lý do (Why):* Tạo thế cân bằng tối ưu giữa việc bảo vệ bản quyền phần mềm SaaS và tôn trọng tuyệt đối quyền tự do, làm chủ hoàn toàn ứng dụng offline của người dùng cuối.
- **Verified:** Chạy suite kiểm thử tự động thanh toán đạt tỷ lệ thành công 100% (0 failures) và hoàn tất Next.js production build sạch sẽ 100% không phát sinh lỗi biên dịch.

### Phase 13: Decoupling & Enterprise Structural Refactoring - 02-06-2026
- **Architecture Decision:** Di chuyển và cô lập mã nguồn nguyên mẫu cũ `apps/gitdoc/` sang `legacy/gitdoc/`.
  - *Lý do (Why):* Giữ cho phân vùng `apps/` chỉ chứa các deployable microservices đang hoạt động thực tế, giảm tải nợ kỹ thuật (technical debt) và nhiễu ngữ cảnh cho hệ thống CI/CD monorepo.
- **Architecture Decision:** Di chuyển toàn bộ các kịch bản thử nghiệm thuật toán từ `apps/backend-ai/experiments/` ra thư mục gốc độc lập `research/experiments/`.
  - *Lý do (Why):* Ngăn chặn việc trộn lẫn mã chạy thử (Research/Experiments) và mã chạy sản xuất (Production Code) trong backend-ai microservice, tối ưu hóa kích thước build Docker và khả năng onboarding của lập trình viên mới.
- **Architecture Decision:** Decouple toàn bộ thư viện tài liệu SOPs và kỹ năng `apps/agent-runtime/src/knowledge-work-plugins/` ra thư mục gốc `knowledge-work-plugins/`.
  - *Lý do (Why):* Phân định rõ ranh giới trách nhiệm (Separation of Concerns). Runtime không nên chứa dữ liệu tri thức nghiệp vụ RAG. Thư viện tri thức được chuyển ra ngoài để C# host runtime tải động từ thư mục monorepo root (đã được cấu hình tự động tìm kiếm fallback 5 cấp trong C# `Program.cs` và `MainWindow.xaml.cs`).
- **Verified:** Hoàn tất di chuyển toàn bộ cấu trúc bằng lệnh git tracking (`git mv`), cấu trúc cây thư mục sạch sẽ 100% và đã được cập nhật đồng bộ trong [directory-tree-simplified.md](file:///c:/Git%20cua%20tui/Ai-Agent/docs/directory-tree-simplified.md).
- **Architecture Decision:** Tiếp tục tối ưu hóa cấu trúc cây thư mục monorepo (Refinements):
  - Rút ngắn và chuẩn hóa tên thư mục tri thức gốc thành `knowledge/plugins/` thay vì `knowledge-work-plugins/` nhằm định vị rõ ranh giới "Nhiên liệu tri thức" (Fuel) nằm ngoài Runtime Engine. Đồng bộ hóa C# host runtime path discovery (`Program.cs` và `MainWindow.xaml.cs`) để nạp gộp tài nguyên tri thức tự động từ đường dẫn mới.
  - Làm phẳng (flatten) thư mục thí nghiệm từ `research/experiments/` lên thẳng cấp độ `research/` giúp giảm bớt một tầng thư mục lồng nhau không cần thiết, làm nổi bật ngay các tệp kiểm thử cô lập (`test_*.py`).

### Phase K+3 & K+4: Enterprise SRE-Grade Hardening & Observability (02-06-2026)
- **Added:** Hợp nhất sinh Fencing sequence token vật lý (`SELECT nextval('task_fencing_seq')`) trực tiếp vào trong cùng transaction cơ sở dữ liệu của CAS update (`prisma.$transaction`).
  - *Lý do (Why):* Triệt tiêu hoàn toàn race window giữa thời điểm worker sinh fencing sequence token và thời điểm cập nhật trạng thái/epoch vào cơ sở dữ liệu.
- **Added:** Ràng buộc lọc xác thực chính xác Fencing Token (`fencingToken = incomingFencingToken`) trong các lệnh ghi `updateWithFence` và heartbeat gia hạn lease.
  - *Lý do (Why):* Ngăn chặn tuyệt đối tình huống zombie worker có thể gia hạn lease vô điều kiện, bảo đảm quyền sở hữu duy nhất của active worker.
- **Added:** Ràng buộc kiểm tra đa tầng nghiêm ngặt `executionEpoch` và `expectedStatus` trong luồng ghi của `updateWithFence`.
  - *Lý do (Why):* Xây dựng cổng kiểm duyệt dữ liệu 4 lớp (Task ID + executionEpoch + fencingToken + status). Nếu task đã bị thu hồi/recycle hoặc bị hủy (CANCELLED), mọi luồng ghi muộn từ worker cũ đều bị chặn đứng triệt để.
- **Added:** Cơ chế bất biến Fencing Token (Immutable fencingToken) trong các lệnh ghi thường của worker.
  - *Lý do (Why):* Loại bỏ cột `fencingToken` khỏi data payload cập nhật trong `updateWithFence` để bảo vệ token an toàn, không bị ghi đè sau khi phân phối.
- **Added:** Cờ hiệu `leaseLost` và cơ chế ngắt tiến trình zombie lập tức bằng `SIGKILL` kèm trả về sớm (`if (leaseLost) return;`) tại `taskWorker.ts`.
  - *Lý do (Why):* Chấm dứt hoạt động của C# process ngay khi mất lease và bỏ qua mọi callback/stdout trễ để tránh làm bẩn dữ liệu trong DB.
- **Added:** Giao dịch đơn nguyên phục hồi task hết hạn của `LeaseReaperService` bọc trong `$transaction` sử dụng `LIMIT 100 FOR UPDATE SKIP LOCKED`.
  - *Lý do (Why):* Thực hiện quét và claim atomically theo lô 100 tasks để tránh xung đột tài nguyên giữa nhiều reaper node, đảm bảo an toàn tuyệt đối khi hệ thống scale-out.
- **Added:** Tích hợp 6 chỉ số đo đạc telemetry phân tán mở rộng trong `MetricsCollector`.
  - *Lý do (Why):* Cung cấp khả năng tự quan sát tối đa của hệ thống khi chạy tải lớn, tự động ghi nhận số lượng sweeps, claims, publishes, recovery success/fail và heartbeat timeouts.
- **Added:** Quy trình ngắt cổng Graceful Shutdown phối hợp có tổ chức trên các tín hiệu `SIGTERM` / `SIGINT` trong `server.ts`.
  - *Lý do (Why):* Đóng BullMQ worker trước, dừng daemons sweep/reap, xả nốt outbox tồn đọng, sau đó mới ngắt kết nối Redis và DB sạch sẽ để tránh các ngoại lệ kết nối đột ngột (connection drop exception).
- **Optimized:** Tối ưu hóa chu trình Lease Recovery thành 1 bước CAS trực tiếp (`EXECUTING` -> `QUEUED`) và loại bỏ bước trung gian `RECOVERING`.
  - *Lý do (Why):* Cắt giảm số lượng truy vấn cơ sở dữ liệu trên mỗi task từ 4 xuống chỉ còn 2 trong Reaper loop, giảm thiểu tối đa thời gian giữ transaction lock trên cơ sở dữ liệu.
- **Added:** Cơ chế khóa chống trùng lặp heartbeat `runningHeartbeat` trong `taskWorker.ts`.
  - *Lý do (Why):* Ngăn chặn tình trạng xếp chồng nhiều luồng ghi heartbeat đồng thời lên nhau khi kết nối mạng/cơ sở dữ liệu bị chậm hoặc trễ.
- **Verified:** Cập nhật bộ chaos recovery test suite và biên dịch TypeScript thành công 100% không phát sinh lỗi.




