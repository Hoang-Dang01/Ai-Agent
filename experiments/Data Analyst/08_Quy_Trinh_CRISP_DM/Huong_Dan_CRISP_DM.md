# 🔄 Quy Trình CRISP-DM

**CRISP-DM** (Cross-Industry Standard Process for Data Mining) là quy trình chuẩn mực được sử dụng rộng rãi nhất trên thế giới để quản lý một dự án phân tích dữ liệu. Bất kỳ một Senior DA nào cũng phải nằm lòng quy trình này.

Quy trình gồm 6 bước, có tính chất lặp đi lặp lại (Iterative):

## 1. Business Understanding (Thấu hiểu nghiệp vụ)
**Đây là bước quan trọng nhất.** Nếu sai bước này, toàn bộ 5 bước sau sẽ vô nghĩa.
- Sếp/Khách hàng thực sự muốn gì? Mục tiêu kinh doanh là gì?
- Xác định tiêu chí thành công (Ví dụ: Giảm tỷ lệ khách hàng rời bỏ xuống 5%).
- Đặt ra các câu hỏi phân tích cụ thể.

## 2. Data Understanding (Thấu hiểu dữ liệu)
- Cần những dữ liệu gì để trả lời câu hỏi ở bước 1? Dữ liệu đó đang nằm ở đâu (Database nào, file Excel nào)?
- Tiến hành thu thập dữ liệu (Data collection).
- Khám phá dữ liệu sơ bộ (EDA - Exploratory Data Analysis): Có lỗi gì không? Có dữ liệu ngoại lai không?

## 3. Data Preparation (Chuẩn bị và làm sạch dữ liệu)
- **Chiếm 70-80% thời gian của dự án.**
- Xử lý Missing values (giá trị thiếu), Outliers (giá trị ngoại lai).
- Chuyển đổi định dạng ngày tháng, Text to Columns.
- Nối (Join) các bảng dữ liệu lại với nhau thành một bảng hoàn chỉnh (Feature Engineering).

## 4. Modeling (Mô hình hóa)
*(Dành cho các bài toán phân tích chuyên sâu hoặc Machine Learning)*
- Chọn thuật toán phù hợp (Hồi quy tuyến tính, Random Forest, hay đơn giản chỉ là công thức tính RFM).
- Chạy mô hình trên tập dữ liệu đã làm sạch.
- Tinh chỉnh các tham số.

## 5. Evaluation (Đánh giá)
- Đánh giá xem kết quả của mô hình có giải quyết được bài toán kinh doanh đặt ra ở **Bước 1** hay không.
- Nếu sai, quay lại các bước trước để làm lại.
- Dịch kết quả từ "Ngôn ngữ kỹ thuật" sang "Ngôn ngữ kinh doanh".

## 6. Deployment (Triển khai)
- Đưa kết quả vào sử dụng thực tế.
- Đó có thể là việc gửi một bản báo cáo PDF định kỳ hàng tuần.
- Hoặc publish (xuất bản) một Dashboard Power BI lên hệ thống chung để sếp tự vào xem hàng ngày.
- Theo dõi và bảo trì Dashboard/Mô hình.
