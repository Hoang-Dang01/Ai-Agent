# TÀI LIỆU ĐẶC TẢ YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)
**Dự án:** Local Vision-Based Computer Use Agent ("OpenClaw" Engine)  
**Hệ sinh thái:** Vibe-Agent 2026 Ecosystem  
**Tác giả:** Senior Business Analyst (IT BA)  
**Trạng thái:** Bản thảo đề xuất (Draft)  
**Ngày khởi tạo:** 27-05-2026  

---

## 1. TỔNG QUAN DỰ ÁN (EXECUTIVE SUMMARY)

### 1.1. Bối cảnh (Background)
Trong quá trình vận hành hệ thống Dược phẩm & Thiết bị Y tế (ví dụ: Hệ thống Medstand), doanh nghiệp phải đối mặt với hai thách thức lớn:
1.  **Hệ thống phân mảnh:** Các tác vụ nghiệp vụ phân tán trên nhiều nền tảng (cổng thông tin nhà thuốc đối tác, hệ thống ERP cũ không hỗ trợ API, công cụ quản lý nội bộ). Nhân viên vận hành phải thao tác thủ công (nhập liệu, đối soát) chiếm tới 40% quỹ thời gian làm việc.
2.  **Bảo mật dữ liệu chiến lược:** Dữ liệu về chính sách giá sản phẩm trọng tâm, điểm tích lũy của khách hàng và hạn mức công nợ là thông tin nhạy cảm. Doanh nghiệp không thể gửi dữ liệu này lên các API đám mây công cộng (như OpenAI, Claude) do ràng buộc nghiêm ngặt về bảo mật dữ liệu y dược và tài chính.

### 1.2. Mục tiêu chiến lược (Project Objectives)
*   **Tự động hóa tác nghiệp không API:** Xây dựng một thế hệ **Local Autonomous Agent** có khả năng "nhìn" màn hình và "điều khiển" bàn phím/chuột trực tiếp trên máy trạm của nhân viên để thực hiện tác vụ thay thế con người.
*   **Bảo mật tuyệt đối (100% On-Premise):** Hệ thống chạy hoàn toàn cục bộ trên máy trạm trang bị card đồ họa **NVIDIA GeForce GTX 1650 (4GB VRAM)** và **64GB RAM**, không gửi bất cứ dữ liệu nào ra Internet.
*   **Cắt giảm 80% thời gian tác nghiệp thủ công** và giảm tỷ lệ sai sót nhập liệu (Human Error) xuống dưới 0.5%.

---

## 2. PHÂN TÍCH HIỆN TRẠNG & QUY TRÌNH MONG MUỐN (AS-IS vs. TO-BE)

### 2.1. Quy trình hiện tại (As-Is Process)
Nhân viên vận hành thực hiện đối soát chương trình tích lũy và cập nhật trạng thái khách hàng theo quy trình thủ công sau:

```
[Nhận yêu cầu đối soát] 
       │
       ▼
[Mở SQL Developer] ──► Chạy thủ công file 'API_ChamDiemKH_AI.sql' hoặc 'API_CongNoChiTiet_AI.sql'
       │
       ▼
[Xuất dữ liệu Excel] ──► Mở file đối chiếu thủ công bằng mắt
       │
       ▼
[Mở Web đối tác / ERP cũ] ──► Đăng nhập thủ công bằng tài khoản
       │
       ▼
[Nhập tay dữ liệu] ──► Click từng nút, điền từng ô điểm tích lũy mới cho khách hàng
       │
       ▼
[Gửi Email báo cáo] ──► Soạn mail thủ công gửi quản lý khu vực
```
*   **Điểm nghẽn (Pain points):** Mất thời gian (~15-20 phút/khách hàng), dễ nhầm lẫn số liệu công nợ/tích lũy, không thể chạy ngoài giờ làm việc.

### 2.2. Quy trình mong muốn với Agent (To-Be Process)
Quy trình tự động hóa khép kín có sự giám sát của con người (Human-in-the-Loop):

```
[Yêu cầu kích hoạt từ n8n / Web UI]
       │
       ▼
[Agent suy luận (LangGraph + Ollama)] ──► Tự động truy vấn SQL nội bộ thông qua DB Tool
       │
       ▼
[Agent chụp màn hình & YOLO quét UI] ──► Xác định tọa độ các nút bấm trên ERP/Web đối tác
       │
       ▼
[Agent di chuyển chuột & Nhập liệu] ──► Thao tác click tự nhiên, nhập điểm tích lũy
       │
       ▼
[Yêu cầu phê duyệt (HITL)] ──► Chụp ảnh kết quả, gửi yêu cầu xác nhận lên Next.js UI hoặc Telegram
       │
       ├─► [Rejected] ──► Gửi phản hồi lỗi về Planner để sửa hoặc dừng khẩn cấp
       │
       └─► [Approved] ──► Hoàn tất tác vụ, Agent tự động gửi mail báo cáo & đóng tiến trình
```

---

## 3. PHÂN TÍCH CÁC BÊN LIÊN QUAN (STAKEHOLDER ANALYSIS)

| Bên liên quan (Stakeholder) | Vai trò trong hệ thống | Kỳ vọng cốt lõi | Mức độ ảnh hưởng |
| :--- | :--- | :--- | :--- |
| **Ban Giám đốc (Sponsors)** | Người phê duyệt ngân sách và định hướng chiến lược. | Tăng năng suất lao động, giảm chi phí vận hành (OpEx), bảo mật dữ liệu khách hàng không bị rò rỉ. | **Quyết định (High)** |
| **Nhân viên Vận hành (Ops Team)** | Người dùng trực tiếp (End-users) giám sát Agent. | Giao diện Next.js UI dễ sử dụng, cơ chế dừng khẩn cấp nhạy bén, giảm bớt việc tay chân lặp đi lặp lại. | **Cao (High)** |
| **Đội ngũ Phát triển (IT/Devs)** | Người xây dựng và bảo trì mã nguồn. | Cấu trúc Monorepo thống nhất, code Python/Node.js rõ ràng, dễ bảo trì, mô hình YOLO dễ training và triển khai. | **Trung bình (Medium)** |
| **Đại lý / Nhà thuốc đối tác** | Bên thụ hưởng dịch vụ. | Thời gian xử lý chương trình tích lũy nhanh chóng, dữ liệu công nợ chính xác tuyệt đối. | **Thấp (Low)** |

---

## 4. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

Hệ thống được chia thành 4 phân hệ chức năng chính (Module) hoạt động nhịp nhàng:

### Phân hệ 1: Hệ thống Giác quan (Local Vision Module)
*   **FR-1.1:** Hệ thống phải hỗ trợ chụp ảnh màn hình (screenshot) của máy Host tại thời điểm runtime với độ trễ dưới 200ms.
*   **FR-1.2:** Tích hợp mô hình YOLOv8 nội bộ để phát hiện tọa độ Bounding Box `[x_min, y_min, x_max, y_max]` của các phần tử giao diện mục tiêu (nút bấm, ô nhập liệu, icon) theo nhãn yêu cầu.
*   **FR-1.3:** Khi YOLOv8 trả về kết quả dưới ngưỡng tin cậy cấu hình (ví dụ: Confidence < 85%), hệ thống phải tự động chuyển sang phân tích ngữ cảnh bằng mô hình VLM cục bộ (Qwen2-VL) hoặc gửi tín hiệu yêu cầu con người trợ giúp.

### Phân hệ 2: Bộ não suy luận (Cognitive Core Module)
*   **FR-2.1:** Kết nối với mô hình ngôn ngữ lớn chạy local qua Ollama (Qwen 2.5 7B/14B Instruct) để phân tích yêu cầu từ ngôn ngữ tự nhiên thành danh sách các bước hành động cụ thể (Task Planning).
*   **FR-2.2:** Sử dụng cấu trúc đồ thị trạng thái **LangGraph** để duy trì trạng thái phiên làm việc (Session State). Nếu một bước hành động bị lỗi, Agent phải có khả năng tự suy luận lại (Self-Correction) dựa trên lỗi nhận được và thử phương án thay thế.
*   **FR-2.3:** Hỗ trợ kết nối và chạy các file SQL nghiệp vụ sẵn có (ví dụ: `API_ChamDiemKH_AI.sql`, `API_CongNoChiTiet_AI.sql`) để truy vấn thông tin khách hàng thời gian thực.

### Phân hệ 3: Bàn tay thực thi (OS Automation Module)
*   **FR-3.1:** Điều khiển chuột máy Host thông qua thư viện `PyAutoGUI` hoặc `pynput` để di chuyển chuột và thực hiện các thao tác: click đơn, click đúp, kéo thả, cuộn trang.
*   **FR-3.2:** Hỗ trợ nhập liệu mô phỏng bàn phím tự nhiên (với tốc độ gõ ngẫu nhiên từ 50-120 WPM) để điền thông tin vào các trường nhập liệu trên giao diện.
*   **FR-3.3:** **Tính năng cao cấp:** Áp dụng thuật toán di chuyển chuột mô phỏng hành vi tự nhiên của con người (Bezier Curve) để tránh các cơ chế chặn tự động hóa của hệ thống đối tác.

### Phân hệ 4: Phê duyệt & Giám sát (HITL & Observability Module)
*   **FR-4.1:** Trước khi thực hiện các hành động có tính rủi ro cao (như chuyển tiền, thanh toán, gửi mail cho đối tác), Agent phải tạm dừng và gửi ảnh chụp màn hình kèm thông tin hành động lên giao diện Next.js Web UI thông qua Socket.io để chờ phê duyệt.
*   **FR-4.2:** Giao diện Next.js UI phải hiển thị luồng tư duy của AI (Thought Stream) dưới dạng real-time log, giúp người vận hành biết Agent đang ở bước nào và đang "nhìn" vào đâu.
*   **FR-4.3:** Cung cấp nút bấm "Dừng Khẩn Cấp" (Kill Switch) trên cả giao diện Web và cơ chế phím tắt vật lý (ví dụ: rê chuột sát 4 góc màn hình máy tính) để lập tức ngắt quyền kiểm soát chuột/bàn phím của Agent.

---

## 5. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

Các quy định bắt buộc hệ thống phải tuân thủ để đảm bảo an toàn vận hành:

### 5.1. Bảng Quyết định Hành động (Action Decision Table)
Quy tắc xử lý của hệ thống dựa trên mức độ tự tin (Confidence Score) của mô hình YOLOv8 khi nhận diện UI:

| Mức độ tự tin (Confidence) | Hành động của Hệ thống | Trạng thái Luồng | Ghi chú |
| :--- | :--- | :--- | :--- |
| **>= 90%** | Tự động thực thi thao tác chuột/phím. | Chạy tự động (Fully Autonomous) | Tốc độ tối ưu. |
| **70% - 89%** | Chụp ảnh vùng UI đó, gửi cho VLM (Qwen2-VL) kiểm tra chéo ngữ cảnh. Nếu VLM xác nhận đúng -> Thực thi. | Tự động có kiểm chứng | Giảm thiểu lỗi click nhầm. |
| **50% - 69%** | Tạm dừng, chụp ảnh toàn màn hình, gửi thông báo kèm yêu cầu phê duyệt cho con người. | Chờ phê duyệt (HITL) | Người dùng click vào ảnh để chỉ định tọa độ click chính xác. |
| **< 50% hoặc Lỗi hệ thống** | Dừng tiến trình ngay lập tức, hoàn trả dữ liệu SQL về trạng thái ban đầu, gửi cảnh báo âm thanh và báo động đỏ trên Dashboard. | Dừng khẩn cấp (Fail-Safe) | Đảm bảo hệ thống không bị hư hại. |

### 5.2. Giới hạn Hạn mức Nghiệp vụ (Financial & Transaction Limits)
*   **BR-1:** Agent không được phép tự động phê duyệt nâng hạng thẻ khách hàng hoặc trừ điểm tích lũy của khách hàng nếu giá trị giao dịch quy đổi lớn hơn 5,000,000 VNĐ.
*   **BR-2:** Mọi truy vấn cơ sở dữ liệu qua SQL nội bộ chỉ được cấp quyền `READ-ONLY` cho Agent, ngoại trừ các API đặc thù được đóng gói sẵn và bảo mật bằng chữ ký số.

---

## 6. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

### 6.1. Bảo mật và Quyền riêng tư (Security & Privacy)
*   **NFR-Sec-1:** 100% dữ liệu không được truyền ra ngoài mạng nội bộ của doanh nghiệp. Tuyệt đối không tích hợp các API dịch vụ AI công cộng không nằm trong tầm kiểm soát.
*   **NFR-Sec-2:** Tất cả thông tin đăng nhập (Credentials) vào các hệ thống Legacy phải được mã hóa AES-256 và lưu trữ trong cấu hình biến môi trường (`.env`), không cho phép Agent biết mật khẩu dưới dạng văn bản thuần túy (Plaintext).

### 6.2. Hiệu năng & Dung lượng Phần cứng (Performance & Resource Constraint)
*   **NFR-Perf-1:** Do giới hạn phần cứng thực tế (GTX 1650 4GB VRAM và 64GB RAM), hệ thống áp dụng cơ chế **CPU/GPU Hybrid Load Balancing**:
    *   **Bộ não suy luận (Ollama):** Chạy trên **CPU và sử dụng System RAM** (tận dụng dung lượng 64GB RAM cực lớn để chạy các model Qwen 2.5 7B/14B lượng hóa thoải mái mà không bị tràn bộ nhớ).
    *   **Thị giác và Tương tác (YOLOv8):** Chạy trên **GPU và sử dụng VRAM** (tiêu thụ tối đa 300MB VRAM) để đảm bảo tốc độ nhận diện UI dưới 30ms.
    *   Tổng dung lượng VRAM tiêu thụ bởi toàn bộ Agent (bao gồm cả YOLOv8 và các luồng phụ trợ) không được vượt quá **2.0 GB VRAM** để chừa khoảng trống cho card màn hình hiển thị hệ điều hành và trình duyệt Web mượt mà.
*   **NFR-Perf-2:** Thời gian nhận diện một phần tử UI trên màn hình bằng YOLOv8 phải nhỏ hơn **50ms**.
*   **NFR-Perf-3:** Hệ thống Node.js Orchestrator phải hỗ trợ kết nối Socket.io ổn định với Next.js Frontend với tần suất gửi log tư duy 500ms/lần mà không bị trễ luồng.

### 6.3. Tính an toàn và Khôi phục (Safety & Recovery)
*   **NFR-Safe-1:** Khi kích hoạt nút Dừng Khẩn Cấp, Agent phải giải phóng quyền điều khiển chuột vật lý ngay lập tức trong vòng dưới **10ms**.
*   **NFR-Safe-2:** Hệ thống phải duy trì cơ chế State Recovery. Nếu máy tính bị mất điện đột ngột trong khi Agent đang làm việc, sau khi khởi động lại, Node.js Orchestrator phải đọc lại log từ SQLite/PostgreSQL để khôi phục trạng thái tác vụ cuối cùng và đánh dấu trạng thái "Interrupted".

---

## 7. KẾ HOẠCH KIỂM THỬ NGHIỆP VỤ (UAT & ACCEPTANCE CRITERIA)

Để nghiệm thu hệ thống này từ góc độ người dùng doanh nghiệp, BA đề xuất các kịch bản kiểm thử UAT sau:

### Kịch bản UAT 1: Đối soát & Điền điểm Tích lũy tự động
*   **Mục tiêu:** Kiểm tra khả năng đọc SQL và tự động điền dữ liệu lên cổng thông tin Web không có API.
*   **Các bước thực hiện:**
    1.  Tạo dữ liệu giả lập cho khách hàng Nguyễn Văn A có số điểm tích lũy cần cập nhật là `1,500` điểm trong SQL.
    2.  Kích hoạt Agent từ Next.js UI với yêu cầu: *"Cập nhật điểm tích lũy cho khách hàng Nguyễn Văn A"*.
    3.  Quan sát Agent tự mở trình duyệt Chrome giả lập, đăng nhập trang đối tác, tìm ô "Điểm tích lũy" và điền con số `1,500`.
*   **Tiêu chí nghiệm thu (Acceptance Criteria):**
    *   [x] Agent lấy đúng số liệu từ SQL bằng cách chạy script `API_ChamDiemKH_AI.sql`.
    *   [x] YOLOv8 phát hiện đúng ô nhập liệu với Confidence >= 90%.
    *   [x] Chuột di chuyển tự nhiên và điền đúng số `1,500` vào ô.
    *   [x] Hệ thống tạm dừng ở bước cuối cùng để chờ con người bấm nút Approve trên Next.js UI mới được hoàn tất.

### Kịch bản UAT 2: Xử lý sự cố "Nút bấm bị ẩn/thay đổi vị trí"
*   **Mục tiêu:** Kiểm tra khả năng tự sửa lỗi (Self-Correction) và cơ chế an toàn Fail-Safe.
*   **Các bước thực hiện:**
    1.  Cố tình thay đổi kích thước cửa sổ trình duyệt khiến nút "Đăng nhập" bị ẩn hoặc dịch chuyển sang vị trí khác.
    2.  Kích hoạt Agent thực hiện tác vụ đăng nhập.
*   **Tiêu chí nghiệm thu (Acceptance Criteria):**
    *   [x] Agent không thực hiện click bừa bãi tại tọa độ cũ.
    *   [x] YOLOv8 chụp lại màn hình mới, phát hiện nút đăng nhập đã dịch chuyển và tính toán lại tọa độ click chính xác.
    *   [x] Nếu nút đăng nhập bị che hoàn toàn, Agent phải dừng lại sau 3 lần thử tìm kiếm, ghi log lỗi: *"Nút bấm bị che khuất"* và gửi yêu cầu trợ giúp HITL lên Dashboard.

---

## 8. TÙY CHỌN KIẾN TRÚC DOANH NGHIỆP C# (.NET): ĐÓNG GÓI TỰ HÀNH NGOẠI TUYẾN (OFFLINE PORTABLE BUNDLE)

Để đáp ứng yêu cầu mang hệ thống tự hành sang máy tính của khách hàng, chạy ngay lập tức bằng một cú click đúp chuột mà không cần kết nối Internet và không cần cài đặt thêm bất kỳ thư viện hay môi trường nào (Python, Docker, Ollama), hệ thống cung cấp giải pháp **C# (.NET) Offline Portable Bundle**.

### 8.1. Sơ đồ Ngăn xếp Công nghệ C# Tự hành Ngoại tuyến (Offline C# Stack)

Phương án này tận dụng việc máy tính của khách hàng đã được cài đặt sẵn môi trường **.NET Runtime (C#)** để tối ưu hóa triệt để kích thước file và hiệu năng:

*   **Bộ não suy luận Ngoại tuyến (ONNX GenAI):** Tích hợp trực tiếp thư viện **Microsoft.ML.OnnxRuntime.GenAI** vào mã nguồn C#. Mô hình ngôn ngữ lớn siêu nhẹ **Qwen 2.5 1.5B Instruct** sẽ được chuyển đổi sang định dạng `.onnx` lượng hóa và nhúng trực tiếp vào bộ cài. Khi chạy, mô hình được nạp thẳng vào RAM máy khách (chỉ chiếm ~1.0 GB RAM) và chạy suy luận trực tiếp trên CPU của máy khách với tốc độ rất cao mà không cần cài đặt Ollama.
*   **Thị giác máy tính (ONNX Runtime):** Sử dụng **Microsoft.ML.OnnxRuntime** để chạy file mô hình **YOLOv8-UI.onnx** (nặng ~10MB) trực tiếp trên CPU hoặc GPU của máy khách, giúp định vị chính xác tọa độ các phần tử UI mà không phụ thuộc vào Python.
*   **Tự động hóa trình duyệt gốc (WebView2 Automation):** Thay vì cài các bộ driver trình duyệt nặng nề của Playwright/Selenium, ứng dụng sử dụng **Microsoft WebView2** (động cơ Chromium đã được tích hợp sẵn 100% trên Windows 10/11). C# điều khiển trực tiếp WebView2 chạy ngầm để thực thi các tác vụ tự động hóa Web (như đăng nhập, cập nhật điểm tích lũy Medstand) mà không tốn dung lượng ổ cứng để tải thêm trình duyệt ngoài.
*   **Tự động hóa ứng dụng Desktop (FlaUI):** Sử dụng thư viện **FlaUI.UIA3** để đọc trực tiếp cây giao diện của hệ điều hành Windows, giúp click chính xác tuyệt đối vào các nút bấm của phần mềm desktop đối tác mà không cần chụp ảnh màn hình hay xử lý thị giác đối với các ứng dụng chuẩn Windows.

### 8.2. Cấu hình Biên dịch và Đóng gói (Publish Configuration)

Ứng dụng C# được đóng gói dưới dạng **Framework-Dependent Portable Folder** hoặc **Single File** để đảm bảo tính sẵn sàng ngay lập tức:

*   **Cấu hình Publish:**
    *   `dotnet publish -c Release -r win-x64 --self-contained false /p:PublishSingleFile=true /p:PublishTrimmed=true`
*   **Giải thích kỹ thuật:** 
    *   `--self-contained false`: Do máy khách hàng đã cài sẵn .NET Runtime, việc đặt tham số này giúp loại bỏ bộ chạy .NET ra khỏi file cài, giúp giảm kích thước tệp tin `.exe` xuống mức tối thiểu (chỉ còn khoảng 10MB - 15MB cho phần logic).
    *   `PublishSingleFile=true`: Đóng gói toàn bộ mã nguồn và thư viện phụ thuộc (DLLs) thành một file `.exe` duy nhất. Khách hàng chỉ cần bấm đúp vào file này là chạy, không cần giải nén.
    *   `PublishTrimmed=true`: Tự động quét và loại bỏ các đoạn mã thừa không sử dụng của .NET, giúp tệp tin đạt mức độ gọn nhẹ cao nhất.

### 8.3. So sánh Hiệu năng giữa Python và C# (Performance Comparison)

| Tiêu chí so sánh | Giải pháp Python truyền thống | Giải pháp C# (.NET) Offline Portable |
| :--- | :--- | :--- |
| **Môi trường yêu cầu** | Phức tạp (Cần cài Python, pip, CUDA, Git, Ollama). | Không có (Bấm là chạy trực tiếp, tận dụng .NET cài sẵn). |
| **Mức chiếm dụng RAM hệ thống** | Cao (Do nạp bộ thông dịch Python và các gói numpy/torch nặng nề). | Rất thấp (~1.0 GB RAM cho mô hình Qwen 1.5B ONNX). |
| **Kết nối mạng** | Bắt buộc (Để tải thư viện hoặc gọi API Cloud). | Ngoại tuyến 100% (Hoạt động hoàn hảo trong mạng nội bộ cô lập). |
| **Dung lượng bộ cài** | Rất lớn (Hàng chục GB bao gồm các thư viện AI nặng). | Rất nhỏ (Chỉ khoảng 800MB bao gồm cả logic code và file model ONNX). |

---

## 9. CÁC PHƯƠNG ÁN TỰ ĐỘNG HÓA KHÔNG CẦN HUẤN LUYỆN (ZERO-TRAINING AUTOMATION PATHWAYS)

Để đưa hệ thống vào vận hành ngay lập tức mà không cần tốn thời gian và tài nguyên thu thập dữ liệu hay huấn luyện (train) mô hình AI, Agent có thể áp dụng 4 phương án tự động hóa sẵn có (Out-of-the-box) sau:

### 9.1. Phương án 1: Tự động hóa Trình duyệt qua Playwright (Tối ưu cho Web)
*   **Nguyên lý hoạt động:** Tương tác trực tiếp với mã nguồn HTML (DOM) của các trang web (n8n, Supabase, cổng thông tin nhà thuốc) thông qua các Selector (ID, Class, XPath) hoặc văn bản hiển thị.
*   **Ưu điểm:** Độ chính xác tuyệt đối 100%, tốc độ thực thi cao, chạy ngầm hoàn toàn (Headless), tiêu thụ 0MB VRAM và không yêu cầu bất kỳ quy trình huấn luyện AI nào.
*   **Hạn chế:** Chỉ áp dụng được cho các ứng dụng chạy trên trình duyệt Web.

### 9.2. Phương án 2: Tự động hóa qua FlaUI hoặc pywinauto (Tối ưu cho Desktop tiêu chuẩn)
*   **Nguyên lý hoạt động:** Đọc trực tiếp cấu trúc cây giao diện hệ thống của Windows (Accessibility/Automation Tree) được các phần mềm chuẩn khai báo cho hệ điều hành.
*   **Ưu điểm:** Cho phép C# hoặc Python click chính xác vào các nút bấm bằng ID điều khiển (Control ID) hoặc tên hiển thị mà không cần dùng đến thị giác máy tính hay tính toán tọa độ vật lý.
*   **Hạn chế:** Không hoạt động được trên các ứng dụng desktop quá cũ hoặc sử dụng các công nghệ vẽ giao diện tùy biến (custom rendering) không khai báo cây giao diện với Windows.

### 9.3. Phương án 3: Sử dụng mô hình Thị giác đã huấn luyện sẵn (Pre-trained UI Vision)
*   **Nguyên lý hoạt động:** Sử dụng các bộ trọng số (weights) YOLOv8 UI hoặc OmniParser của Microsoft đã được cộng đồng và các hãng công nghệ lớn huấn luyện sẵn trên hàng triệu giao diện ứng dụng.
*   **Ưu điểm:** Nhận diện được hầu hết các nút bấm, ô nhập liệu và icon tiêu chuẩn trên mọi phần mềm Desktop mà không cần tự chụp ảnh hay huấn luyện lại mô hình.
*   **Hạn chế:** Tiêu thụ khoảng 200MB - 300MB VRAM trên GPU và có tỷ lệ sai số nhỏ đối với các giao diện quá phức tạp hoặc mờ.

### 9.4. Phương án 4: Cấu hình tọa độ tĩnh qua JSON (RPA cổ điển)
*   **Nguyên lý hoạt động:** Chụp ảnh giao diện một lần duy nhất, xác định tọa độ pixel vật lý (X, Y) của các nút bấm tĩnh trên màn hình và lưu trữ vào file cấu hình JSON để di chuột click trực tiếp.
*   **Ưu điểm:** Tốc độ tức thì, không sử dụng tài nguyên xử lý AI, lập trình cực kỳ đơn giản và hoạt động hoàn hảo cho các giao diện cố định.
*   **Hạn chế:** Nếu cửa sổ ứng dụng bị di chuyển, thu phóng hoặc thay đổi độ phân giải màn hình, tọa độ click sẽ bị sai lệch.

---
ĐĂNG KÝ BẢN QUYỀN & MẬT: Tài liệu này là tài sản trí tuệ của dự án Vibe-Agent 2026 Ecosystem. Mọi hành vi sao chép hoặc phân phối ngoài phạm vi monorepo mà không có sự đồng ý của Senior BA đều bị nghiêm cấm.

