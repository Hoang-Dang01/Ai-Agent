# MCP (Model Context Protocol)

## Vấn đề: Tại sao chúng ta cần phân tách trong AI

Trong phát triển phần mềm, chúng ta luôn phân tách các hệ thống để làm cho chúng linh hoạt và dễ bảo trì hơn — điều này không có gì mới.

Các giao diện người dùng web như LinkedIn không giao tiếp trực tiếp với cơ sở dữ liệu — chúng giao tiếp với một máy chủ API để phân tách ứng dụng khỏi dữ liệu mà nó tương tác. Máy chủ API đó hiển thị dữ liệu từ các cơ sở dữ liệu này theo một cách chuẩn hóa (thường là JSON qua HTTP), giúp hệ thống dễ mở rộng hơn. Ví dụ, nếu lược đồ cơ sở dữ liệu thay đổi, giao diện người dùng sẽ không bị hỏng — chỉ API cần điều chỉnh.

## MCP là gì?

MCP là một giao thức giao tiếp chuẩn hóa cách các ứng dụng AI của bạn tương tác với các công cụ và nguồn dữ liệu bên ngoài. Giống như các ứng dụng web đã phát triển từ việc truy vấn trực tiếp cơ sở dữ liệu sang sử dụng các lớp API để có khả năng mở rộng và dễ bảo trì tốt hơn, các tác nhân AI cũng cần sự phân tách kiến trúc tương tự.

![image](https://github.com/user-attachments/assets/79418695-3d5c-4082-ad40-0eda2ea8013a)

## Trước và Sau

### Trước MCP: Cơn ác mộng liên kết chặt chẽ

Trước MCP, việc xây dựng một tác nhân AI với nhiều công cụ có nghĩa là phải viết các tích hợp tùy chỉnh cho từng công cụ. Mỗi công cụ yêu cầu phương pháp xác thực, xử lý lỗi, định dạng dữ liệu và gọi API riêng. Điều này tạo ra một cơn ác mộng về bảo trì:

- Khi Slack cập nhật API của họ, bạn phải sửa đổi mã tác nhân của mình
- Khi bạn muốn thêm một tích hợp CRM mới, bạn phải triển khai lại toàn bộ ứng dụng của mình
- Ứng dụng liên kết chặt chẽ với mọi công cụ mà nó sử dụng

### Sau MCP: Lớp giao tiếp chuẩn hóa

MCP giới thiệu một lớp giao tiếp chuẩn hóa giữa các ứng dụng AI và các công cụ theo cùng một mẫu kiến trúc mà các máy chủ API cung cấp giữa các giao diện người dùng web và cơ sở dữ liệu. Thay vì tác nhân của bạn cần hiểu cách giao tiếp với từng công cụ riêng lẻ, nó chỉ cần giao tiếp với một máy chủ MCP đóng vai trò là một lớp trừu tượng hiển thị tất cả các công cụ có sẵn.

Khi API của một công cụ thay đổi, chỉ máy chủ MCP cần cập nhật — mã tác nhân AI của bạn vẫn không bị ảnh hưởng.

## So sánh kiến trúc

### Phát triển Web truyền thống
```
Frontend ↔ Database (liên kết chặt chẽ, dễ hỏng)
Frontend ↔ API Server ↔ Database (phân tách, linh hoạt)
```

### Phát triển tác nhân AI
```
Agent ↔ Tools (liên kết chặt chẽ, dễ hỏng)
Agent ↔ MCP Server ↔ Tools (phân tách, linh hoạt)
```

## MCP: REST API cho các công cụ AI

MCP cho AI giống như REST API cho các công cụ AI. Nó cung cấp các lợi ích chuẩn hóa và phân tách tương tự mà các API web mang lại cho phát triển web. Nhưng không chỉ vậy, nó cho phép tích hợp dễ dàng với các công cụ bên ngoài vì bất kỳ ai cũng có thể hiển thị chức năng của họ thông qua máy chủ MCP và bạn chỉ cần kết nối với nó.

Giống như REST API đã tạo ra một hệ sinh thái nơi các dịch vụ như Stripe, Twilio và Google Maps có thể hiển thị khả năng của họ để bất kỳ ứng dụng web nào cũng có thể sử dụng, MCP tạo ra một hệ sinh thái nơi bất kỳ nhà cung cấp dịch vụ nào cũng có thể hiển thị các công cụ của họ để bất kỳ tác nhân AI nào cũng có thể sử dụng. Các nhà cung cấp dịch vụ này chỉ cần xuất bản các máy chủ MCP hiển thị khả năng của họ — tất cả những gì bạn phải làm là kết nối với các máy chủ này.

## Hiệu ứng hệ sinh thái

Sức mạnh của MCP nằm ở việc tạo ra một hệ sinh thái chuẩn hóa:

- **Các nhà cung cấp dịch vụ** có thể xây dựng một lần và hiển thị khả năng của họ cho tất cả các tác nhân AI
- **Các nhà phát triển AI** có thể tích hợp với hàng chục công cụ mà không cần viết mã tùy chỉnh cho từng công cụ
- **Bảo trì** trở nên tập trung — khi API thay đổi, chỉ máy chủ MCP cần cập nhật
- **Đổi mới** tăng tốc khi các công cụ mới có thể có sẵn ngay lập tức cho tất cả các tác nhân AI thông qua MCP

Đây là hiệu ứng mạng tương tự đã làm cho REST API trở nên mạnh mẽ cho phát triển web, giờ đây được áp dụng cho phát triển tác nhân AI.