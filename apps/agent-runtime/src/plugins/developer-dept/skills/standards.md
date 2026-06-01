# CHUẨN MỰC THIẾT KẾ PHẦN MỀM & QUY TẮC PHÁT TRIỂN

## 1. Nguyên Tắc Lập Trình Cơ Bản
- **SOLID Principles**: Mọi module phải được quy hoạch rõ ràng theo 5 nguyên lý SOLID, ưu tiên tính đơn trách nhiệm (Single Responsibility).
- **Dry (Don't Repeat Yourself)**: Tránh lặp lại mã nguồn. Sử dụng các hàm dùng chung tại tầng Shared.
- **KISS (Keep It Simple, Stupid)**: Ưu tiên sự đơn giản và trực quan trước khi thực hiện các tối ưu hiệu năng phức tạp.

## 2. Quy Tắc Đặt Tên & Viết Code C# (.NET)
- **PascalCase**: Dùng cho tên Lớp (Class), Phương thức (Method), Thuộc tính (Property) và Namespace (ví dụ: `WindowAutomationHelper`, `GetMainWindow`).
- **camelCase**: Dùng cho tham số truyền vào hàm và biến cục bộ (ví dụ: `timeoutMs`, `editElement`).
- **Bắt Buộc Xử Lý Lỗi (Defensive Coding)**:
  - Phải kiểm tra `null` trước khi sử dụng bất cứ con trỏ hoặc đối tượng nào.
  - Sử dụng khối `try-catch` tại các điểm biên tương tác vật lý (như I/O file, Automation Windows, hoặc tải mô hình ONNX).
  - Không bao giờ được phép `catch` lỗi rỗng (silent error). Phải in ra màn hình hoặc ghi vào log cấu trúc.

## 3. Kiến Trúc Cô Lập & Bảo Mật Ngoại Tuyến
- **Không phụ thuộc Internet**: Mọi logic xử lý, từ nhận diện ảnh (YOLO) đến suy luận từ (LLM), phải được chạy hoàn toàn dưới máy Host, không tạo cuộc gọi API ra mạng công cộng.
- **Quản lý tài nguyên nghiêm ngặt**:
  - Các đối tượng kết nối phần cứng và API Windows (như `WindowAutomationHelper` của FlaUI) phải triển khai giao diện `IDisposable` và được bọc trong khối lệnh `using` để giải phóng tài nguyên hệ điều hành ngay khi hoàn tất tác vụ.
