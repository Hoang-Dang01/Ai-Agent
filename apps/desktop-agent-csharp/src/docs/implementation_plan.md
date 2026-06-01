# KẾ HOẠCH TRIỂN KHAI PHÁT TRIỂN AGENT TỰ HÀNH NGOẠI TUYẾN C#

Dự án này nhằm xây dựng một **Local Offline AI Agent** hoàn chỉnh bằng ngôn ngữ C# (.NET 9.0), có khả năng tự động hóa hệ điều hành Windows, kiểm soát ứng dụng desktop (qua FlaUI), tự động hóa trình duyệt (WebView2), và tự động nhận diện phần tử UI thời gian thực (qua YOLOv8 ONNX Runtime) hoàn toàn ngoại tuyến và không có thư viện cài ngoài phức tạp.

---

## 1. Các phần cần Người dùng xác nhận (User Review Required)

Để tối ưu hóa thời gian phát triển và tài nguyên phần cứng, chúng tôi đề xuất triển khai các gói thư viện NuGet sau vào dự án:
1.  **FlaUI.UIA3:** Thư viện giao tiếp trực tiếp với Microsoft UI Automation để điều khiển ứng dụng Windows chuẩn mà không cần AI.
2.  **Microsoft.ML.OnnxRuntime:** Thư viện chạy file mô hình YOLOv8 `.onnx` để tìm kiếm và định vị các hộp giới hạn UI nhanh chóng.
3.  **Microsoft.ML.OnnxRuntime.GenAI:** Thư viện cao cấp của Microsoft giúp chạy trực tiếp các mô hình ngôn ngữ lớn và mô hình thị giác đa phương thức (VLM như Qwen2-VL 2B hoặc Moondream2 ONNX) trên CPU/GPU.
4.  **FlaUI.Core & System.Drawing.Common:** Hỗ trợ chụp ảnh màn hình và xử lý pixel vật lý.

> [!IMPORTANT]
> Toàn bộ quá trình cài đặt này sẽ được thực hiện tự động bằng lệnh `dotnet add package` của .NET Core CLI, đảm bảo sạch sẽ và không ảnh hưởng đến các cài đặt phần mềm khác trên Windows của bạn.

---

## 2. Câu hỏi cần thảo luận (Open Questions)

> [!NOTE]
> Bạn có muốn chúng ta sử dụng một ứng dụng Desktop có sẵn trên máy của bạn (ví dụ: **Notepad - Sổ ghi chép** hoặc **Microsoft Excel**) làm đối tượng thử nghiệm đầu tiên cho kịch bản Agent tự động điền chữ bằng FlaUI không? Điều này giúp việc kiểm thử trực quan và thực tế hơn rất nhiều.

---

## 3. Các thay đổi và Mã nguồn dự kiến (Proposed Changes)

Dưới đây là kế hoạch chi tiết các tệp tin sẽ được khởi tạo mới hoặc cập nhật trong cấu phần `src/` của dự án `c:\Git cua tui\Offline-Agent-CSharp\`:

### 3.1. Cấu phần: OfflineAgent.Core (Thư viện xử lý Lõi)

#### [NEW] [WindowAutomationHelper.cs](file:///c:/Git%20cua%20tui/Offline-Agent-CSharp/src/OfflineAgent.Core/Automation/WindowAutomationHelper.cs)
*   **Chức năng:** Chứa các phương thức Wrapper cho thư viện FlaUI để tìm kiếm tiến trình (Process), xác định cửa sổ ứng dụng mục tiêu (Window), tìm kiếm các nút bấm/ô nhập liệu bằng text và ra lệnh Click/Type tự nhiên.

#### [NEW] [YoloDetector.cs](file:///c:/Git%20cua%20tui/Offline-Agent-CSharp/src/OfflineAgent.Core/Vision/YoloDetector.cs)
*   **Chức năng:** Sử dụng `Microsoft.ML.OnnxRuntime` để nạp tệp tin mô hình YOLOv8 dạng `.onnx`, thực hiện tiền xử lý ảnh chụp màn hình (Resize, Normalize) và trả về danh sách các Bounding Box chính xác.

#### [NEW] [LocalVisionModel.cs](file:///c:/Git%20cua%20tui/Offline-Agent-CSharp/src/OfflineAgent.Core/Vision/LocalVisionModel.cs)
*   **Chức năng:** Sử dụng `Microsoft.ML.OnnxRuntime.GenAI` để nạp mô hình thị giác đa phương thức (như Qwen2-VL 2B lượng hóa INT4 dạng ONNX), hỗ trợ nạp ảnh chụp màn hình và đặt câu hỏi cho AI bằng tiếng Việt để đọc hiểu ngữ cảnh màn hình ngoại tuyến.

### 3.2. Cấu phần: OfflineAgent.Console (Khung khởi chạy chính)

#### [MODIFY] [Program.cs](file:///c:/Git%20cua%20tui/Offline-Agent-CSharp/src/OfflineAgent.Console/Program.cs)
*   **Chức năng:** Điểm khởi chạy của ứng dụng Console. Thiết lập menu điều khiển đơn giản, cho phép người dùng kích hoạt thử nghiệm từng tính năng độc lập (Ví dụ: 1. Thử nghiệm FlaUI click chuột; 2. Thử nghiệm YOLO quét màn hình; 3. Thử nghiệm Mô hình Thị giác Đa phương thức Qwen2-VL ONNX).

---

## 4. Kế hoạch Kiểm thử & Xác minh (Verification Plan)

### Kiểm thử Tự động bằng CLI
Chúng ta sẽ biên dịch dự án và chạy thử nghiệm thông qua .NET CLI để bắt các lỗi cú pháp và liên kết DLL:
```bash
cd "c:\Git cua tui\Offline-Agent-CSharp\src"
dotnet build
dotnet run --project OfflineAgent.Console
```

### Kiểm thử Thủ công (UAT)
*   Mở một cửa sổ Notepad trống trên màn hình Windows.
*   Chạy thử nghiệm Agent và chọn tính năng "1. Thử nghiệm FlaUI".
*   Xác minh xem chuột có tự di chuyển, nhấp vào cửa sổ Notepad và tự động gõ dòng chữ "Hello từ Offline C# Agent!" một cách tự nhiên hay không.
