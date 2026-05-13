# 📋 TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BRD)

## 1. TỔNG QUAN HỆ THỐNG
Dự án được xây dựng trên kiến trúc Monorepo, đóng vai trò như một "Hệ điều hành cá nhân" quản lý 3 Module lõi, đảm bảo khả năng cắm-rút (Plug & Play) vô hạn cho tương lai.

## 2. CHI TIẾT TÍNH NĂNG (FEATURES)

### 🧩 Module 1: AI Study Hub (Trợ lý học tập RAG)
- **Nguồn dữ liệu:** Data do User dùng tool cào từ Internet (PDF, Text, Website).
- **Xử lý:** Lưu thô tại `apps/backend-ai/dataset/`, Python Engine sẽ băm nhỏ và nhúng qua Vector DB.
- **Giao diện Web:** Khung Chatbot thông minh. Khi trả lời phải trích xuất và hiển thị được Nguồn tài liệu (Citations) để đảm bảo độ tin cậy.

### 🧩 Module 2: The ML Lab (Phòng Thí nghiệm Bot)
- **Nguồn dữ liệu:** Các Bot/Model ML đang nằm trong thư mục `bots/`.
- **Giao diện Web:** Màn hình Control Panel tổng quan.
- **Chức năng:** 
  - Hiển thị danh sách các Bot hiện có.
  - Có Nút Bấm (Bật/Tắt) để điều khiển Bot từ xa qua giao diện Web thay vì gõ lệnh Terminal.
  - Cửa sổ Log thời gian thực (Real-time Stream) để theo dõi xem Bot đang làm gì (VD: Bot Minecraft đang chặt cây hay đang đánh quái).

### 🧩 Module 3: University Sentinel (Trợ lý Deadline)
- **Nguồn dữ liệu:** Web trường học. Tự động cào định kỳ qua kịch bản Automation.
- **Giao diện Web:** Bảng Timeline hoặc Notifications nhắc nhở deadline bài tập/thông báo quan trọng.
- **Tính năng tương lai:** Tích hợp Webhook đẩy thông báo thẳng về một kênh Discord cá nhân (Nằm trong thư mục `integrations/`).

## 3. LỘ TRÌNH TIẾP CẬN (Quy mô nhỏ trước)
- **Bước 1:** Dựng móng Web Dashboard cơ bản (Next.js) và API Gateway (Node.js).
- **Bước 2:** Xử lý **Module 1** trước (Bơm data cào được vào AI để nó khôn lên).
- **Bước 3:** Kết nối **Module 2** (Móc API từ Web xuống để bật/tắt các con bot trong `bots/`).
- **Bước 4:** Xây dựng Cronjob cào data trường học cho **Module 3**.
