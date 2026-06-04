# 🗺️ MASTER PLAN: VIBE-AGENT 2026 ECOSYSTEM (RESTRUCTURED)

**Trạng thái:** Đang thực thi (Cơ cấu lại theo định hướng kiểm soát chất lượng & sản xuất)  
**Tầm nhìn:** Xây dựng một Hệ sinh thái AI tự hành cấu trúc Monorepo, có khả năng quản lý tri thức, điều phối đa tác nhân (RAG, Game Bot, CV Bot) với độ tin cậy cấp độ doanh nghiệp (Enterprise-grade reliability), giám sát vết tư duy thời gian thực và quản trị vòng đời tri thức chặt chẽ.

---

## 🚦 TIÊU CHUẨN ĐÁNH GIÁ TIẾN ĐỘ (THREE-STATE MATURITY MODEL)
Để đảm bảo tính chính xác và tránh hiện tượng ngộ nhận về tiến độ giữa Prototype (Bản dựng thử) và Production-ready (Sẵn sàng sản xuất), dự án áp dụng hệ thống phân tầng trạng thái sau:
- **`AD` (Architecture Defined)**: Bản vẽ kiến trúc, thiết kế cơ sở dữ liệu và giao thức DTO/Contracts đã khóa hoàn tất.
- **`PI` (Prototype Implemented)**: Bản dựng thử nghiệm chạy được luồng chính (Happy path) hoặc mock dữ liệu được kiểm duyệt.
- **`PR` (Production Ready)**: Mã nguồn hoàn thiện khả năng bắt lỗi, xử lý biên rủi ro, kiểm thử tự động, tối ưu hóa hiệu năng đạt chuẩn sản xuất.

---

## 🏗️ PHẦN A: FOUNDATION (Nền tảng hạ tầng)
*Mục tiêu: Đóng gói hệ thống Monorepo, thiết lập môi trường tách biệt và tự động hóa vận hành.*
- `[x] AD` `[x] PI` `[x] PR` **Phase A1: Kiến trúc Monorepo & Structural Decoupling**
  - Cô lập cấu trúc sạch sẽ: apps (deployable), knowledge/ (RAG fuels), research/ (experiments), legacy/ (archives), packages/ (shared), infra/ (gateways), docker/ (compose).
- `[x] AD` `[x] PI` `[x] PR` **Phase A2: Containerization & Reverse Proxy**
  - Đóng gói Multi-stage Docker, thiết lập API Gateway Nginx quản lý CORS, giới hạn tần suất (Rate Limiting).
- `[x] AD` `[x] PI` `[x] PR` **Phase A3: Scripts tự động hóa**
  - Cung cấp `bootstrap.ps1` / `bootstrap.sh` tự động cài đặt dependency và cấu hình môi trường 1-click.

---

## 🧠 PHẦN B: CORE RUNTIME (Lõi tự động hóa tự hành)
*Mục tiêu: Đảm bảo khả năng tương tác hệ điều hành cục bộ chính xác và điều phối tác vụ phi trạng thái.*
- `[x] AD` `[x] PI` `[x] PR` **Phase B1: C# FlaUI Host Runtime**
  - Lõi C# .NET 9 tự động hóa desktop vật lý sử dụng FlaUI, kết nối piped ngầm truyền telemetry log thời gian thực.
- `[x] AD` `[x] PI` `[x] PR` **Phase B2: Orchestrator BullMQ**
  - Hàng đợi Redis BullMQ tiếp nhận, quản lý phân luồng tác vụ và đồng bộ trạng thái nhiệm vụ.
- `[x] AD` `[x] PI` `[x] PR` **Phase B3: Human-in-the-Loop (HITL) Gate**
  - Tầng phê duyệt kiểm soát an toàn từ con người trước khi cho phép C# chạy các lệnh nhạy cảm hoặc rủi ro.
*Nhiệm vụ đạt chuẩn PR:* Tinh chỉnh cơ chế dọn dẹp tài nguyên (Resource cleanup) khi luồng C# đột ngột crash, bắt lỗi mất tiêu điểm UI (focus loss) trên Windows.

---

## 💾 PHẦN C: MEMORY & KNOWLEDGE (Tri thức & Quản trị RAG)
*Mục tiêu: Quản trị thông tin dạng vector, RPGM Graph và thiết lập cơ chế vòng đời tài liệu.*
- `[x] AD` `[x] PI` `[x] PR` **Phase C1: GitDoc RAG**
  - Phân tích tài liệu nhiều phiên bản, tính toán cosine similarity và lưu trữ vector ngữ nghĩa qua pgvector.
- `[x] AD` `[x] PI` `[x] PR` **Phase C2: RPGM GraphRAG**
  - Thiết lập đồ thị tri thức quan hệ liên kết RPGM (Relational Property Graph Model) lưu trữ thực thể trực tiếp dưới lõi PostgreSQL.
- `[x] AD` `[x] PI` `[x] PR` **Phase C3: Kiến trúc Vòng đời tri thức (Knowledge Lifecycle)**
  - Tầng quản trị ngăn ngừa phình to bộ đệm: Tự động băm nhỏ $\rightarrow$ Nhúng $\rightarrow$ Lập đồ thị $\rightarrow$ Lưu trữ lâu dài $\rightarrow$ Dọn dẹp chỉ mục thừa khi xóa tài liệu.
*Nhiệm vụ đạt chuẩn PR:* Triển khai các kịch bản kiểm thử cascade delete, dọn dẹp triệt để orphan edges khi văn bản hoặc phiên bản tài liệu bị loại bỏ.

---

## 🧭 PHẦN D: PLANNING & REFLECTION (Nhận thức lập kế hoạch)
*Mục tiêu: AI tự động phân rã mục tiêu phức tạp thành đồ thị DAG phi chu trình và tự sửa sai.*
- `[x] AD` `[x] PI` `[x] PR` **Phase D1: Lập kế hoạch đa tác nhân (Multi-Agent Planner)**
  - Phân rã mục tiêu (Goal) của người dùng thành đồ thị DAG nhiệm vụ (AITask DAG Graph) bằng giải thuật DFS tránh vòng lặp phụ thuộc.
- `[x] AD` `[x] PI` `[x] PR` **Phase D2: Tiền thẩm định mâu thuẫn nhận thức (Cognitive Pre-validation)**
  - Sử dụng rule-based tĩnh kiểm tra mâu thuẫn nghiệp vụ của nhiệm vụ trước khi gọi LLM tránh flaky và tiết kiệm tài nguyên API.
- `[x] AD` `[x] PI` `[x] PR` **Phase D3: Vòng phản hồi tự sửa lỗi (Replanning Loop)**
  - Agent tự động đánh giá kết quả thất bại của công cụ, kích hoạt tác nhân Critic lập kế hoạch điều chỉnh lại DAG Tasks động.
*Nhiệm vụ đạt chuẩn PR:* Giới hạn số bước lặp vô hạn của Replanning (Max iteration ceiling protection) và cơ chế khôi phục trạng thái cũ khi kế hoạch hoàn toàn bế tắc.

---

## 📊 PHẦN E: OBSERVABILITY & AI TELEMETRY (Tự quan sát chuyên sâu)
*Mục tiêu: Ghi nhận chi tiết luồng tư duy, lượng token sử dụng và vết gọi công cụ phục vụ gỡ lỗi.*
- `[x] AD` `[x] PI` `[x] PR` **Phase E1: AI Telemetry Layer**
  - Thiết lập tầng thu thập dữ liệu chuyên biệt lưu trữ Prompt Traces, Reasoning Steps, Token Usage metrics, Tool Call parameters và lịch sử sửa đổi kế hoạch (Plan History).
- `[x] AD` `[x] PI` `[x] PR` **Phase E2: Developer Debugging Deck**
  - Cung cấp giao diện trực quan cho lập trình viên phân tích vết của từng Prompt Node và đo đạc độ trễ của các mô hình ngôn ngữ.

---

## 🎨 PHẦN F: FRONTEND & VIBE UI (Giao diện điều khiển Next.js)
*Mục tiêu: Cung cấp giao diện dashboard tương tác bóng bẩy, trực quan hóa luồng tư duy.*
- `[x] AD` `[x] PI` `[ ] PR` **Phase F1: Next.js Glassmorphism Core**
  - Xây dựng hệ thống UI với HSL Tailored Colors, hiệu ứng kính mờ và các vi chuyển động (Micro-animations).
- `[x] AD` `[x] PI` `[ ] PR` **Phase F2: SVG DAG Visual Planner**
  - SVG Canvas tùy chỉnh cho phép chỉnh sửa cấu trúc node, tham số JSON của kế hoạch trực quan trước khi chạy.
- `[x] AD` `[x] PI` `[ ] PR` **Phase F3: Batching Queue Stream & Visual Graph**
  - Trực quan hóa Graph 3D Galaxy mạng lưới tri thức, đồng thời gom log WebSockets theo đợt 250ms triệt tiêu lag giao diện.
*Nhiệm vụ đạt chuẩn PR:* Tích hợp hiển thị biểu đồ tiêu thụ token thời gian thực, điểm số tin cậy truy vấn RAG và bộ chỉ báo trạng thái luồng tư duy hiện hành.

---

## 🧪 PHẦN G: EVALUATION & QUALITY GATE (Đánh giá & Kiểm thử độ tin cậy)
*Mục tiêu: Đảm bảo mã nguồn đạt chuẩn sản xuất, chống suy thoái hành vi agent.*
- `[x] AD` `[ ] PI` `[ ] PR` **Phase G1: Khung đánh giá tác nhân (Agent Evaluation Framework)**
  - Tự động hóa chạy đánh giá chất lượng phản hồi và kế hoạch của Agent dựa trên tập dữ liệu chuẩn (Benchmark datasets).
- `[x] AD` `[x] PI` `[x] PR` **Phase G2: Integration & Load Tests**
  - Kiểm thử tích hợp Event Bus và đo đạc khả năng chịu tải hàng đợi BullMQ với tần suất tác vụ cao.
- `[x] AD` `[x] PI` `[x] PR` **Phase G3: Failure Injection (Bơm lỗi hệ thống)**
  - Mô phỏng tình huống đột ngột mất kết nối Redis, PostgreSQL hoặc n8n ngoại tuyến để kiểm tra tính đàn hồi và phục hồi của Orchestrator.
- `[x] AD` `[x] PI` `[x] PR` **Phase G4: Security & Privilege Audit**
  - Kiểm tra rò rỉ JWT claim, thời hạn token, cơ chế bảo mật cô lập tài nguyên và thẩm định đặc quyền.

---

## 🔌 PHẦN H: SOLUTIONS (Tác nhân tự hành đặc thù)
*Mục tiêu: Triển khai các giải pháp Agent phục vụ thực tiễn.*
- `[ ] AD` `[ ] PI` `[ ] PR` **Phase H1: Dino CV Agent**
  - Xây dựng mô hình thị giác tự hành điều khiển click chuột chơi Chrome Dino Game cục bộ sử dụng OpenCV và PyAutoGUI.
- `[ ] AD` `[ ] PI` `[ ] PR` **Phase H2: Sales & Tech Support Auto-Pilot**
  - Tích hợp các plugin hỗ trợ nghiệp vụ doanh nghiệp.

---

## 💳 PHẦN I: MONETIZATION (Thương mại hóa & Cổng thanh toán)
*Mục tiêu: Cung cấp tính năng bản quyền và các gói thuê bao thương mại.*
- `[x] AD` `[x] PI` `[x] PR` **Phase I1: Stripe Checkout Integration**
  - Đấu nối cổng thanh toán, sinh redirect checkout session và cập nhật trạng thái bản quyền của tài khoản.
- `[x] AD` `[x] PI` `[x] PR` **Phase I2: Webhook Cryptographic Verification**
  - Lắng nghe và xác minh chữ ký bảo mật Webhooks từ Stripe sử dụng raw buffer payload.
- `[x] AD` `[x] PI` `[x] PR` **Phase I3: Offline License Grace Policy**
  - Cấu hình thời hạn đệm ngoại tuyến tối đa 30 ngày, đảm bảo core physical automations không bao giờ bị khóa.

---

## 🤖 PHẦN K: AGENT REGISTRY & CAPABILITIES (Tích hợp Hệ sinh thái Tác nhân)
*Mục tiêu: Đăng ký và mở rộng các tác nhân/công cụ chuyên biệt thành Capabilities của Hệ sinh thái Vibe-Agent.*
- `[ ] AD` `[ ] PI` `[ ] PR` **Phase K1: Document Ingestion Agent (MarkItDown)**
  - Tích hợp Microsoft MarkItDown vào `apps/backend-ai` làm `DocumentAgent` để tự động hóa trích xuất và chuẩn hóa tài liệu (PDF, DOCX, PPTX, XLSX, HTML, E-mail, Images OCR) sang Markdown chất lượng cao trước khi RAG chunking & embedding.
- `[ ] AD` `[ ] PI` `[ ] PR` **Phase K2: Learning Agent (Understand Anything)**
  - Xây dựng `LearningAgent` thực hiện trích xuất tri thức nâng cao: tự động sinh tóm tắt, khái niệm cốt lõi, flashcards, câu đố ôn luyện (Quiz), bản đồ tư duy (Mindmap) và mở rộng quan hệ đồ thị tri thức (Knowledge Graph) từ file tài liệu tải lên.
- `[ ] AD` `[ ] PI` `[ ] PR` **Phase K3: Software Quality & Security Agents (Taste & Cybersecurity Skills)**
  - Tích hợp `CodeTasteAgent` (đánh giá readability, kiến trúc, maintainability của code) và `SecurityAgent` (quét lỗ hổng bảo mật: SQL Injection, XSS, SSRF, Command Injection) tạo thành bộ lọc kiểm duyệt chất lượng trước khi nộp HITL approval.
- `[ ] AD` `[ ] PI` `[ ] PR` **Phase K4: Cognitive Reflection Trace (Reasonix Pattern)**
  - Học hỏi mô hình vết tư duy (Reasoning trace) và quy trình tự phản biện (Self-critique/Reflection) từ Reasonix nhằm cải thiện độ sâu phân tích cho Planner/Reflection Engine mà không gây dư thừa thời gian chạy (Double Planning).

---

## 🚀 PHẦN J: PRODUCTION & LAUNCH
*Mục tiêu: Phát hành phiên bản chính thức V1.0.*
- `[ ] AD` `[ ] PI` `[ ] PR` **Phase J1: Hardening & Deploy**
  - Đóng gói cấu hình môi trường sản xuất nghiêm ngặt, thiết lập CI/CD Zero-downtime và phát hành ứng dụng rộng rãi.

---
> **Bản quyền tri thức thuộc về Phòng Kế Hoạch (Planning Dept):**
> Mọi thay đổi trạng thái của từng Phase từ AD $\rightarrow$ PI $\rightarrow$ PR đều phải được cập nhật kèm theo các báo cáo kiểm thử nghiệm nghiệm thu tương ứng trong thư mục `docs/vault/`.

