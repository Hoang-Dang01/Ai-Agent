# 📜 CHANGELOG & ARCHITECTURE DECISIONS

File này lưu lại lịch sử thay đổi của dự án. Không chỉ ghi LÀM GÌ, mà phải ghi TẠI SAO LẠI LÀM THẾ.

## [Unreleased] - Ngày bắt đầu chuẩn hóa

### Phase K1: Document Ingestion Agent (MarkItDown Integration) - 04-06-2026
- **Added:** Local file upload parser in Node.js orchestrator [server.ts](file:///c:/Git%20cua%20tui/Ai-Agent/apps/orchestrator/server.ts) using DiskStorage Multer and dedicated rate limiter.
  - *Lý do (Why):* Avoids NodeJS RAM exhaustion under concurrent heavy uploads and secures endpoint boundaries from spam DOS attacks.
- **Fixed:** Robust error status proxying in Node.js Gateway.
  - *Lý do (Why):* Prevents downstream Python error pages (like `413 Payload Too Large` text or HTML) from causing JSON parse crashes and turning into a generic `500 Server Error` on the gateway. Downstream HTTP status codes are now accurately preserved and returned to the client.
- **Added:** MIME guess verification using the `filetype` package in Python service [document_ingestion.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/services/document_ingestion.py).
  - *Lý do (Why):* Rejects spoofed files (e.g. executable MZ masquerading with `.pdf` extension) based on magic byte signatures.
- **Added:** Document status state machine using strict ORM Enum (`PENDING`, `PROCESSING`, `INDEXED`, `FAILED`) in Python backend [models.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/models.py).
  - *Lý do (Why):* Enables clean asynchronous progress tracking for UI indicators and dashboard tables.
- **Added:** Filesystem caching path (`storage_path` in `Document` model) in [document_ingestion.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/services/document_ingestion.py).
  - *Lý do (Why):* Offloads converted markdown output from Postgres `Text` columns to local filesystem files, avoiding TOAST table performance bloat in PostgreSQL.
- **Added:** SHA-256 content hash deduplication checks in Python backend [document_agent.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/routers/document_agent.py).
  - *Lý do (Why):* Reuses pre-computed embeddings and GraphRAG indices on identical byte inputs, saving LLM cost and CPU time.
- **Added:** `JobDispatcher` interface class in [job_dispatcher.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/services/job_dispatcher.py).
  - *Lý do (Why):* Decouples the FastAPI endpoint logic from the async queue mechanism, allowing easy replacement with Redis/Celery queue workers in future phases.
- **Fixed:** Eager relationship loading in async transactions using `selectinload` in [document_agent.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/routers/document_agent.py) and [rag.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/routers/rag.py).
  - *Lý do (Why):* Eliminates lazy-loading database requests that throw `MissingGreenlet` exceptions under FastAPI's async SQLAlchemy execution context.
- **Fixed:** Database unique constraint race condition recovery.
  - *Lý do (Why):* Catches SQLAlchemy `IntegrityError` during concurrent duplicate uploads, rolling back and eagerly returning the committed record. This guarantees that concurrent client requests succeed without user-facing failures.
- **Fixed:** Disk space leak prevention on document removal in [rag.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/routers/rag.py).
  - *Lý do (Why):* Automatically deletes the cached markdown file from the local disk when a document is cascade-deleted, preventing storage leaks.
- **Fixed:** Pydantic model serialization completeness.
  - *Lý do (Why):* Updated `DocumentResponse` in [schemas.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/schemas.py) to declare and expose all new metadata columns, resolving client-facing missing property issues.
- **Added:** Automated integration test suites:
  - `apps/orchestrator/src/test/document-upload.test.ts` verifying gateway upload streaming.
  - `research/test_document_agent.py` checking core ingestion statuses.
  - `research/test_production_ingestion.py` executing 20 concurrent stress-uploads and verifying dynamic PDF, DOCX, XLSX, and PPTX conversions.
  - `research/test_e2e_production_pipeline.py` verifying E2E RAG flow (Upload -> Embed -> Search -> Chat -> Cascade Delete) using the real document `ba_report_local_agent.docx`.

### Phase F: Backend & Data Hardening (RAG Citations, Scoped Fallback & Schema Normalization) - 04-06-2026
- **Added:** Normalized `ChatCitation` relation model in [schema.prisma](file:///c:/Git%20cua%20tui/Ai-Agent/apps/orchestrator/prisma/schema.prisma) and pushed changes to PostgreSQL via `npx prisma db push`.
  - *Lý do (Why):* Avoids the JSON array anti-pattern inside `ChatHistory` for persisting RAG sources. Normalization allows structured relational queries, avoids serialization issues, and guarantees data integrity.
- **Added:** Direct scoped fallback to Python AI backend `/api/rag/chat/` in `POST /api/study-hub/chat` endpoint of [server.ts](file:///c:/Git%20cua%20tui/Ai-Agent/apps/orchestrator/server.ts) when n8n is offline or unreachable.
  - *Lý do (Why):* Ensures resilience of Q&A and Study Hub features during n8n service interruptions, while preventing sensitive task execution or planning DAG flows from bypassing the orchestrator pipeline.
- **Added:** Cosine similarity calculation returning float similarity score under the key `similarity` in FastAPI router [rag.py](file:///c:/Git%20cua%20tui/Ai-Agent/apps/backend-ai/app/routers/rag.py).
  - *Lý do (Why):* Standardizes metrics on retrieval accuracy and replaces confusing "confidence" terminology to prevent users from mistaking it for generation correctness.
- **Added:** Automated integration test suite `apps/orchestrator/src/test/rag-citations.test.ts` verifying relational persistence, direct fallback recovery, and history inclusion.

### Phase G4: Security & Privilege Audit - 04-06-2026
- **Added:** Automated security test suite in `apps/orchestrator/src/test/security-isolation.test.ts` verifying JWT claim validations, cross-user isolation boundaries, WebSocket room broadcasts, and 100-probe random UUID enumeration.
- **Security Hardening (JWT):** Hardened `auth.middleware.ts` to explicitly enforce `HS256` token signing verification, check expiration limits, validate presence of standard claims (`sub` or `id`, `email`), and mandate `role === 'authenticated'`.
  - *Lý do (Why):* Prevents algorithm-spoofing attacks (like `alg=none`), ensures invalid or expired tokens are rejected, and locks baseline authorization roles.
- **Security Hardening (REST Endpoints):** Scoped all major REST API gateways (`GET /api/goals/active`, `GET /api/goals/:goalId`, `POST /api/tasks`, `POST /api/study-hub/chat`, `GET /api/study-hub/history/:sessionId`, `/api/telemetry/*`) to `req.user.id`.
  - *Lý do (Why):* Eliminates Insecure Direct Object Reference (IDOR) vulnerabilities where authenticated users could access or hijack other accounts' goals, task pipelines, chat histories, or telemetry details.
- **Security Hardening (Queue Worker Boundary):** Re-hydrates task metadata and goal owner `userId` authoritatively from the Postgres DB inside `taskWorker.ts` rather than trusting BullMQ payload arguments.
  - *Lý do (Why):* Guarantees queue payload tamper resistance, preventing spoofed job variables from affecting worker behaviors.
- **Security Hardening (WebSocket Rooms):** Integrated Socket.io connection JWT handshakes, mapped sockets to private rooms (`user_${userId}`), and refactored worker broadcasters to emit progress frames strictly to the room of the goal owner. Added database ownership check to `hitl_response` listener. Furthermore, added direct database checks during the socket handshake (Deleted User Protection) and implemented scheduled force-disconnections when the handshake JWT expires (Socket JWT Lifetime Protection).
  - *Lý do (Why):* Prevents global broadcasting leaks of sensitive automation updates, screenshots, or HITL prompts to unauthorized peers, blocks active connections immediately if their user record is deleted, and ensures sockets cannot outlive their JWT token lifetime limit.
- **Database Schema Migration:** Updated `schema.prisma` to bind `ChatHistory` to `userId` and link `AITelemetryTrace` relationally to `UserGoal`.

### Phase D1 & D2: Cognitive Planning & Pre-validation (Architectural Safeguards V5) - 04-06-2026
- **Refactored (100% Generic Dynamic Predicate Engine):** Chuyển đổi toàn bộ bộ giả lập trạng thái `simulate_state_and_validate` sang mô hình Entity Store phẳng dạng `state["entities"][entityType][entityId][predicate] = targetValue` với cơ chế auto-materialization (`setdefault`).
  - *Lý do (Why):* Triệt tiêu hoàn toàn switch-cases và keyword hardcoding (`delete`, `network`, `close`) trong Python, giúp bộ simulator tự động chạy được với mọi predicate (như `encrypted`, `mounted`) và mọi EntityType mới mà không cần chạm vào code Python.
- **Refactored (Unified Constraints Schema):** Đồng nhất hóa định dạng ràng buộc mục tiêu (Constraints) dùng chung định nghĩa với Predicate qua lớp `ConstraintNode` trong `DAGTaskGraph` Pydantic model.
  - *Lý do (Why):* Cho phép simulator nạp trực tiếp danh sách constraints làm trạng thái ban đầu của hệ thống, giúp kiểm chứng logic chặt chẽ và nhất quán.
- **Refactored (Single Pass LLM Constraints Extraction):** Gộp trường `constraints` trực tiếp vào structured model của LLM Planner.
  - *Lý do (Why):* LLM Planner trả về cả DAG nhiệm vụ lẫn các constraints đi kèm trong duy nhất 1 cuộc gọi API, tránh hiện tượng double LLM calls gây tăng chi phí và trễ.
- **Refactored (Single Source of Truth Capabilities):** Loại bỏ danh sách capabilities tĩnh của Python. Thay vào đó, capabilities của Agent được inject từ môi trường và đối chiếu trực tiếp với requiredCapabilities từ catalog.
  - *Lý do (Why):* Ngăn ngừa hoàn toàn drift cấu hình giữa Python và C#; C# vẫn là source of truth duy nhất cho Tool Capabilities.
- **Added (Granular Semantic Determinism Metrics):** Nâng cấp bộ đo đạc determinism (Test 10) sang sử dụng chữ ký ngữ nghĩa chuẩn hóa `normalized_plan_signature` (bỏ qua khác biệt về ID hay hoán vị thứ tự topo tương đương).
  - *Lý do (Why):* Cho phép báo cáo chính xác % Tool set consistency, % Dependency consistency, và % Node count consistency khi chạy Gemini trực tuyến.
- **Added (5 New Security/Architecture Tests):** Thêm các ca kiểm thử:
  - *TEST 14:* Unknown Predicate (encrypted)
  - *TEST 15:* Unknown EntityType (volume)
  - *TEST 16:* Catalog Version Mismatch (999)
  - *TEST 17:* Capability Rejection trước khi chạy simulation
  - *TEST 18:* Topological Permutation Stability.

### Phase D1 & D2: Cognitive Planning & Pre-validation - 04-06-2026
- **Added (Build-time Catalog Generation):** Tích hợp cờ `--generate-catalog <path>` vào `OfflineAgent.Console.exe` cho phép xuất catalog schema dưới dạng tệp JSON tĩnh trong quá trình build/bootstrap hệ thống thay vì gọi tiến trình (subprocess) tại runtime.
  - *Lý do (Why):* Loại bỏ hoàn toàn overhead khởi tạo tiến trình (process-storm risk) khi chịu tải lớn (ví dụ: 100 request/s).
- **Added (Catalog Versioning & Startup Parity):** Tải cấu trúc `tools_catalog.json` ở Python startup và xác thực `schemaVersion == 1`.
  - *Lý do (Why):* Ngăn chặn hoàn toàn lỗi bất tương thích giữa Planner (Python) và Runtime (C#) khi deploy lệch phiên bản.
- **Added (Structured Predicates & Entity Store State Simulator):** Thiết lập cấu trúc trạng thái nested Entity Store (`global`, `application`, `file`) và mô phỏng thực thi trên đồ thị topo để kiểm chứng preconditions và effects định nghĩa động từ C# schema (e.g. `{ "Predicate": "allowed", "Subject": "write" }`) thay vì hardcode tên công cụ hoặc regex thô trong chuỗi goal.
- **Added (Resource Binding):** Liên kết đối số của task (như `exePath` hay `path` của file) với định danh Entity ID thật trong World State, cho phép phân biệt các hành động trên các tài nguyên khác nhau (e.g. xóa file A rồi đọc file A là vi phạm, nhưng xóa file A rồi đọc file B là hợp lệ).
- **Added (Task Parameter Validation):** Tự động thẩm định sự tồn tại và kiểu dữ liệu (string, integer, boolean) của các đối số truyền vào so với metadata tham số bắt buộc của công cụ từ catalog trước khi thực thi.
- **Fixed (Kahn Topological Sort & Cycle Rejection):** Chuyển đổi bộ cycle checker từ đệ quy DFS sang giải thuật **Kahn Topological Sort**.
  - *Lý do (Why):* Vừa thực hiện Cycle Detection vừa sắp xếp thứ tự topo trong duy nhất một lần duyệt, khử hoàn toàn đệ quy tránh lỗi `RecursionError` trên đồ thị sâu (kiểm thử thành công tới 2000 levels).
- **Fixed (Windows UTF-8 Encoding Root Cause):** Cấu hình `sys.stdout` và `sys.stderr` tự động chuyển đổi sang mã hóa UTF-8 khi khởi động chương trình trong `main.py` và `test_multi_agent_planner.py`. Đồng thời, bổ sung biến môi trường `PYTHONUTF8=1` vào `docker-compose.dev.yml`, `Dockerfile`, và `Dockerfile.gpu`.
  - *Lý do (Why):* Giải quyết triệt để từ gốc (root-cause) lỗi sập tiến trình `UnicodeEncodeError` trong cả môi trường phát triển cục bộ và container hóa.
- **Hardened (Strict Cycle Rejection):** Thay đổi giải thuật kiểm soát chu trình lặp (Cycle mitigation) từ tự động sửa lỗi (auto-repair linearize) sang **Từ chối và lập lại kế hoạch (Strict Reject & Replan)**. Nếu phát hiện vòng lặp dependencies, planner sẽ từ chối đồ thị, ghi nhận lỗi `VALIDATION` trong Telemetry, và trả về đồ thị rỗng để kích hoạt luồng Critic/Replan của Orchestrator.
  - *Lý do (Why):* Ngăn chặn việc planner tự bẻ gãy chu trình làm mất đi ý đồ nghiệp vụ (business intent) và thứ tự thực thi của người dùng.
- **Hardened (Graph Integrity & Hallucination Controls):** 
  - Tích hợp hàm `validate_dependency_integrity` để xác minh tất cả dependencies đều trỏ đến Task ID hợp lệ trong đồ thị, ngăn chặn lỗi mồ côi (Ghost / Orphan dependency), trùng lặp ID (Duplicate Task ID), và tự phụ thuộc vòng lặp độ dài 1 (Self dependency).
  - Tích hợp hàm `validate_tool_hallucination` đối chiếu các tool trong kế hoạch với danh mục khả năng đã đăng ký thực tế (`OpenApplicationTool`, `TypeTextTool`, `ClickTool`, `ReadWindowTool`), ngăn chặn LLM ảo tưởng công cụ (Tool hallucination).
- **Hardened (Contradiction Taxonomy Expansion):** Mở rộng bộ quy tắc kiểm duyệt tiền thẩm định tĩnh (`validate_goal_constraints`) hỗ trợ: Temporal Contradictions (Đọc tệp sau khi đã xóa), Permission Contradictions (Gửi thư khi ngoại tuyến/không có internet), và Mutual Exclusion (Đóng và giữ ứng dụng mở cùng lúc).
- **Added (Advanced Stress, Fuzz & Determinism Testing):** Bổ sung các ca kiểm thử mới trong `test_multi_agent_planner.py`:
  - *TEST 4 (Large Scale Stress Test):* Kiểm thử tải với chuỗi xích 2000 tasks liên tục, chứng minh thời gian xử lý cực nhanh (< 5ms) và không bị tràn bộ nhớ stack.
  - *TEST 5 (Multiple Cycles):* Phát hiện nhiều vòng lặp chu trình độc lập/giao nhau.
  - *TEST 6 (Ghost Tasks):* Xử lý an toàn các id phụ thuộc không tồn tại (ghost tasks) trong Kahn checker.
  - *TEST 7 (Contradiction Expansion):* Xác thực các ràng buộc mới bổ sung (Temporal, Permission, Mutex).
  - *TEST 8 (Integrity Rejections):* Chứng minh bộ validator đánh chặn thành công các kế hoạch lỗi mồ côi (Ghost), trùng lặp ID (Duplicate), và tự phụ thuộc (Self).
  - *TEST 9 (Tool Hallucination Rejection):* Loại bỏ thành công các kế hoạch ảo tưởng công cụ.
  - *TEST 10 (Planner Determinism):* Kiểm thử và chứng minh độ ổn định 100% của đầu ra đồ thị (tạo ra cùng một mã hash duy nhất) qua 20 lần chạy liên tiếp hoặc báo cáo phần trăm đồng thuận mà không gây fail build đối với LLM.
  - *TEST 11 (Parameter Validation):* Xác nhận đánh chặn tham số thiếu hoặc sai kiểu dữ liệu của task.
  - *TEST 12 (Precondition/Effect Simulation):* Xác nhận đánh chặn thành công các mâu thuẫn gián tiếp (ví dụ: upload SharePoint khi air-gapped, hoặc đọc file đã bị xóa trước đó).
- **Security Hardening (Telemetry Orphan Lifecycle):** Nâng cấp quan hệ của `AITelemetryTrace` với `UserGoal` trong `schema.prisma` từ `onDelete: SetNull` sang `onDelete: Cascade`.
  - *Lý do (Why):* Triệt tiêu hoàn toàn rò rỉ dữ liệu và các bản ghi telemetry mồ côi (orphan traces) trong DB PostgreSQL khi người dùng xóa Goal.

### Phase C1, C2 & C3: Memory & Knowledge RAG - 04-06-2026
- **Added:** Endpoint `DELETE /api/rag/documents/{document_id}` trong `apps/backend-ai/app/routers/rag.py`.
  - *Lý do (Why):* Cung cấp cổng xóa tài liệu vật lý và kích hoạt cascade xóa toàn bộ các bản ghi phụ thuộc (Versions, Embeddings, GraphNodes, GraphEdges) không để lại dữ liệu mồ côi (Orphans).
- **Added:** Kịch bản kiểm thử tích hợp vòng đời tri thức tại `research/test_rag_lifecycle.py` kiểm chứng toàn bộ luồng Ingest -> Update -> Search -> Chat -> Delete -> SRE Cleanup.
  - *Lý do (Why):* Đảm bảo vòng đời tri thức khép kín, ngăn chặn rò rỉ dữ liệu hoặc nhiễm chéo chỉ mục (Data Contamination) sau khi tài liệu bị loại bỏ.
- **Fixed:** Khắc phục lỗi `NameError` của Pydantic schema trong `apps/backend-ai/app/schemas.py`.
  - *Lý do (Why):* Di chuyển `CriticResponse` và `ReplanResponse` từ reflection router sang schemas file để tránh lỗi biên dịch do khai báo trễ khi chạy test GraphRAG.
- **Fixed:** Thay thế các hàm `print()` chứa ký tự Tiếng Việt bằng Tiếng Anh không dấu trong `main.py` và `rag.py`.
  - *Lý do (Why):* Ngăn chặn hoàn toàn lỗi sập ứng dụng hoặc luồng chạy nền do `UnicodeEncodeError` (CP1252) trên môi trường Windows.
- **Fixed:** Tái cấu trúc kiểu phản hồi của `create_document` trả về đối tượng `schemas.DocumentResponse` được dựng thủ công thay vì ORM object.
  - *Lý do (Why):* Loại bỏ hoàn toàn lỗi truy vấn trễ `greenlet_spawn` của SQLAlchemy 2.0 khi serialize đối tượng có quan hệ nhiều tầng (`versions`).

### Phase G2 & G3: Integration, Load Tests & Failure Injection - 04-06-2026
- **Added:** Kịch bản kiểm thử tải đồng thời tại `apps/orchestrator/src/test/load-test.ts` giả lập 50 luồng lập kế hoạch song song.
  - *Lý do (Why):* Đảm bảo hệ thống chịu tải cao ổn định, không nghẽn cơ sở dữ liệu và tính toán chính xác các phân vị độ trễ (P50/P95/P99).
- **Added:** Kịch bản bơm lỗi tự động (Chaos Testing) tại `apps/orchestrator/src/test/failure-injection.test.ts`.
  - *Lý do (Why):* Kiểm chứng tính đàn hồi và khả năng chịu lỗi (Resilience) khi đột ngột mất kết nối DB hoặc AI Backend bị quá tải.
- **Fixed:** Bổ sung khối bắt lỗi `try-catch` và fallback ngoại tuyến cho cuộc gọi Python AI Backend trong `apps/orchestrator/src/controllers/goal.controller.ts`.
  - *Lý do (Why):* Khi AI Backend ném lỗi 429 (Rate Limit) hoặc Timeout, hệ thống tự động giáng cấp xuống bộ lập kế hoạch luật ngoại tuyến (Offline Rule-Based Planner) để bảo vệ luồng hoạt động mà không trả về lỗi HTTP 500.
- **Fixed:** Bổ sung cấu hình `skip` bỏ qua Rate Limiting khi chạy thử nghiệm (`process.env.NODE_ENV === 'test'`) trong `apps/orchestrator/src/middlewares/rateLimiter.middleware.ts`.
  - *Lý do (Why):* Loại bỏ hiện tượng chặn nhầm các request kiểm thử đồng thời cao trong các bộ test tự động.
- **Fixed:** Đưa thông tin `goal` vào cấu trúc ghi log khẩn cấp ngoại tuyến `emergency-telemetry.log`.
  - *Lý do (Why):* Đảm bảo rằng thông tin câu lệnh gốc của người dùng được lưu trữ đầy đủ trong tệp tin log cục bộ khi Postgres bị sập.

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

### SRE Fencing Token Concurrency Test Alignment (02-06-2026)
- **Fixed:** Tái cấu trúc và hiệu chỉnh bộ kiểm thử `apps/orchestrator/src/test/task-persistence.test.ts`.
  - *What:* Loại bỏ assertion cũ (kiểu greater-token-wins) đòi hỏi worker tự nâng fencing token trong DB từ 16 lên 17 qua cổng `updateWithFence()`. Tích hợp bộ 3 test kiểm duyệt phân tầng: chặn đứng stale worker (15 vs 16), chặn đứng forged newer worker (17 vs 16), và phê chuẩn duy nhất current lease owner (16 vs 16) đồng thời bảo đảm tính bất biến (immutability) của fencing token trong DB.
  - *Why (TẠI SAO):* Đảm bảo tính nhất quán tối cao của kiến trúc **exact-match lease fencing**. Việc cho phép worker tự động nhảy token hoặc ghi đè token trong các lệnh ghi thường (`updateWithFence`) sẽ phá hỏng hoàn toàn cơ chế bảo vệ lease; bất kỳ caller nào biết taskId đều có thể giả mạo token lớn hơn để chiếm quyền ghi mà không cần thông qua bước tranh chấp CAS (`updateWithCAS(generateFence=true)`) hợp lệ.
  - *Tradeoff:* Việc bảo vệ token bất biến đồng nghĩa worker không thể tự động nâng token khi đang chạy. Điều này hoàn toàn đúng vì việc nâng token là đặc quyền duy nhất của database sequencer trong quá trình CAS claim/recovery.
  - *Impact:* Loại bỏ hoàn toàn mâu thuẫn giữa mã nguồn repository và kịch bản test. Cả hai suite kiểm thử `task-persistence.test.ts` và `task-chaos-recovery.test.ts` cùng trình biên dịch TypeScript đều đạt tỷ lệ thành công 100% (0 errors/failures).

### Phase AI-H1: Structured Tracing & Distributed Observability (02-06-2026)
- **Added:** Thiết lập hạ tầng tracing và log JSON cấu trúc trong `apps/backend-ai`.
  - *What:*
    - Xây dựng `logging_context.py` quản lý thread/async-safe `ContextVars` (requestId, parentRequestId, taskId, workflowId, executionEpoch, timeoutMs) và helper `build_trace_headers()`.
    - Triển khai `StructuredJsonFormatter` định dạng logs thành chuỗi JSON tiêu chuẩn, tích hợp phiên bản `1.0.0`, định danh `backend-ai` service, và chừa sẵn 2 trường `traceId`/`spanId` cho OpenTelemetry.
    - Cấu hình an toàn `logging.config.dictConfig` dưới nút `"root"` thay vì override handlers thủ công của uvicorn/fastapi.
    - Xây dựng `StructuredTracingMiddleware` bắt correlation context, ghi nhận latency qua monotonic clock (`time.perf_counter()`), tự động liên kết `workflowId` rỗng sang `requestId`, lưu `request.state.request_id` và bắt exception qua `logger.exception()`.
    - Propagate toàn bộ tracing headers từ Express orchestrator `goal.controller.ts` xuống FastAPI planner call.
  - *Why (TẠI SAO):* Giúp hệ thống đạt tiêu chuẩn vận hành doanh nghiệp (observability-first). Khi scale-out với hàng nghìn task DAG chạy song song, việc thiếu correlation trace chain sẽ biến file log thành một đống hỗn tạp không thể truy vết. Tracing context và JSON format giúp lập trình viên lọc log tức thì trên ELK/Loki.
  - *Tradeoff:* Cấu hình dictConfig yêu cầu khai báo rõ ràng các loggers của uvicorn/fastapi, bù lại triệt tiêu 100% tình huống log bị lặp hoặc mất định dạng uvicorn trên console.
  - *Verified:*
    - Xây dựng suite test `test_log_schema.py` xác minh thành công 100% định dạng JSON, OTel field reservations và mapping context.
    - Xây dựng suite stress test `test_concurrency_isolation.py` kiểm duyệt 100% tính cô lập (isolation) của `ContextVars` dưới tải 100 requests song song (0 leaks).

### Phase B1: C# FlaUI Host Runtime PR Hardening (04-06-2026)
- **Added:** Cơ chế quản lý vòng đời và dọn dẹp tài nguyên tự động cho các ứng dụng được khởi chạy bởi Agent trong [WindowAutomationHelper.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Automation/WindowAutomationHelper.cs).
  - *Lý do (Why):* Khi Agent khởi chạy các ứng dụng như Notepad để thực hiện thao tác vật lý, nếu Agent bị crash hoặc dừng đột ngột, các ứng dụng này sẽ bị bỏ lại dưới dạng tiến trình mồ côi (orphan processes) gây rò rỉ tài nguyên hệ thống. Việc đăng ký danh sách ứng dụng tự động đóng/diệt khi Dispose giúp giải phóng 100% tài nguyên.
- **Added:** Đăng ký sự kiện dọn dẹp khẩn cấp toàn cục trong [Program.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Console/Program.cs) thông qua `ProcessExit`, `UnhandledException`, và `CancelKeyPress`.
  - *Lý do (Why):* Đảm bảo rằng ngay cả khi chương trình bị dừng khẩn cấp (như bấm Ctrl+C hoặc crash ngoài khối `using`), hàm `Dispose` của helper vẫn được gọi để dọn dẹp các ứng dụng mồ côi một cách an toàn.
- **Added:** Cơ chế tự động khôi phục tiêu điểm khi bị mất (Focus Lost Recovery) bằng cách sử dụng Win32 API `GetForegroundWindow` P/Invoke.
  - *Lý do (Why):* Trong quá trình tự động hóa Windows, nếu người dùng click chuột đi nơi khác hoặc có cửa sổ popup đè lên, Agent sẽ bị mất tiêu điểm (Focus Loss) và thao tác gõ/nhấp chuột sẽ bị lỗi. Việc định kỳ kiểm tra handle cửa sổ foreground và gọi `window.SetForeground()` / `window.Focus()` giúp khôi phục tiêu điểm ngay lập tức.
- **Fixed:** Xử lý triệt để lỗi crash do Console.Clear và Console.ReadKey trong môi trường chuyển hướng (redirected stdin/stdout) bằng các helper `SafeClearConsole` và `SafeReadKey`.
  - *Lý do (Why):* Khi chương trình C# được gọi ngầm (piped stream) thông qua Node.js worker, không có cửa sổ console thực tế, khiến các lệnh clear hoặc đọc phím trực tiếp bắn ngoại lệ `IOException` làm sập toàn bộ runner.
- **Verified:** Build biên dịch C# thành công 100% không lỗi. Chạy kiểm thử tự động FlaUI Notepad Automation qua Console hoạt động ổn định và tự động tắt Notepad sạch sẽ sau khi hoàn thành.

### Phase D3: Planning & Reflection / Replanning Loop PR Hardening (04-06-2026)
- **Added:** Giới hạn số lần AI replanning toàn cục `MaxReplanCeiling = 3` trong [TaskGraphRuntime.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Runtime/TaskGraphRuntime.cs).
  - *Lý do (Why):* Ngăn chặn các kịch bản lập kế hoạch lặp vô hạn (runaway replanning) khi Agent liên tục gặp lỗi thực thi và cố gắng đề xuất sửa đổi không thành công, từ đó kiểm soát chặt chẽ chi phí sử dụng API AI.
- **Added:** Cơ chế khôi phục trạng thái `RollbackWorldState()` tại [TaskGraphRuntime.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/Runtime/TaskGraphRuntime.cs) và hỗ trợ Deep Clone trong [WorldState.cs](file:///c:/Git%20cua%20tui/Ai-Agent/apps/agent-runtime/src/OfflineAgent.Core/WorldState/WorldState.cs).
  - *Lý do (Why):* Đảm bảo tính nhất quán của trạng thái hệ thống (`WorldState`). Khi luồng chạy DAG bị lỗi vĩnh viễn (fails permanently hoặc bị hủy bởi người dùng), tất cả các thay đổi tạm thời trên `WorldState` (như `ActiveWindow`, `CurrentApplication`, `Memory.Facts`, `TaskHistory`) được rollback atomically về checkpoint thành công gần nhất.
- **Added:** Truyền phát sự kiện viễn thông `StateRolledBack` thông qua `EventBus` khi rollback được thực thi thành công.
  - *Lý do (Why):* Giúp Orchestrator và giao diện người dùng nhận biết tức thì sự kiện hoàn tác trạng thái để cập nhật giao diện trực quan và lưu vết lịch sử hệ thống.
- **Tradeoff:** Việc Rollback trạng thái chỉ thực hiện trên bộ nhớ (`WorldState` trong RAM) và lưu trữ cục bộ (checkpoint), các tác động vật lý bên ngoài hệ điều hành đã xảy ra (ví dụ: file đã tạo, ứng dụng đã mở) không thể hoàn tác vật lý bằng code thông thường.
- **Impact:** Đạt mức độ ổn định và an toàn Production-ready cho vòng lặp Replanning & Reflection. Test suite biên dịch thành công 100% và đã được xác thực thực tế qua kịch bản lỗi với 3 lần replan trượt và rollback trạng thái hoàn chỉnh.

### Phase B2 & B3: Orchestrator BullMQ & HITL Gate PR Hardening (04-06-2026)
- **Added:** Cơ chế bảo vệ EPIPE khi ghi vào `stdin` của tiến trình con đã thoát hoặc không thể ghi trong [server.ts](file:///c:/Git%20cua%20tui/Ai-Agent/apps/orchestrator/server.ts) và [taskWorker.ts](file:///c:/Git%20cua%20tui/Ai-Agent/apps/orchestrator/src/queue/taskWorker.ts).
  - *Lý do (Why):* Tránh lỗi sập toàn bộ Express server (`write EPIPE` crash) khi người dùng thao tác duyệt thủ công (HITL) quá trễ (sau khi tiến trình đã tự động hủy do quá hạn 60s hoặc đã thoát).
- **Added:** Logic thu gom và diệt sạch tiến trình mồ côi (`active.child.kill('SIGKILL')`) khi dừng/shutdown server (`SIGTERM`/`SIGINT`).
  - *Lý do (Why):* Ngăn chặn hoàn toàn việc rò rỉ tài nguyên hệ thống (zombie processes) từ các runner C# FlaUI khi tắt/khởi động lại Node.js orchestrator.
- **Tradeoff:** Việc diệt cưỡng bức (`SIGKILL`) khi tắt server là bắt buộc để đảm bảo tốc độ shutdown và dọn dẹp sạch sẽ tài nguyên, đánh đổi lại là các task đang chạy dở sẽ bị gián đoạn ngay lập tức (sẽ được tự động khôi phục bởi cơ chế `LeaseReaperService` khi server boot lại).
- **Impact:** Đạt chuẩn Production-Ready cho phần Core Runtime Queue & HITL Gate. Toàn bộ các test suite tự động kiểm định độ tin cậy và xử lý lỗi biên trong `hitl-hardening.test.ts` đã chạy qua thành công 100% với 0 lỗi.
