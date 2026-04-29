# 📊 Cẩm Nang Data Visualization (Power BI / Tableau)

Trực quan hóa dữ liệu là cách bạn "kể chuyện" (Data Storytelling). Mục tiêu là biến những bảng số liệu nhàm chán thành các Dashboard tương tác để Sếp/Khách hàng nhìn vào hiểu ngay vấn đề.

## 📺 Khóa Học & Nguồn Học Khuyến Nghị
**Nếu chọn Power BI:**
1. **Khóa học chuẩn:** Khóa ôn thi chứng chỉ `PL-300` của Microsoft (Có thể học trên Microsoft Learn miễn phí).
2. **Kênh Youtube:** `Guy in a Cube` (Kênh hay nhất về Power BI), `Kevin Stratvert`, `Maven Analytics`.

**Nếu chọn Tableau:**
1. Khóa học của `Maven Analytics` trên Udemy.
2. Kênh Youtube `Alex The Analyst` (Playlist Tableau).

## 🔑 Các Kiến Thức Cốt Lõi (Áp dụng cho Power BI)
- **Data Modeling (Mô hình dữ liệu):** Hiểu thế nào là Star Schema (Lược đồ hình sao). Phân biệt bảng **Fact** (Bảng chứa sự kiện, con số) và bảng **Dimension** (Bảng chứa thông tin mô tả như Khách hàng, Sản phẩm, Ngày tháng). Hiểu quan hệ 1-Nhiều (1-to-Many).
- **Power Query:** Dùng để Extract-Transform-Load (ETL) dữ liệu đầu vào.
- **DAX (Data Analysis Expressions):** Ngôn ngữ viết hàm của Power BI. Cần nắm vững:
  - Phân biệt `Calculated Column` và `Measure`.
  - Hàm `CALCULATE()` - Hàm quan trọng nhất trong DAX.
  - Các hàm Time Intelligence: `SAMEPERIODLASTYEAR()`, `YTD()`, `MTD()`.

## 🚀 Tư Duy Thiết Kế Dashboard (UI/UX for Data)
Công cụ chỉ là phụ, tư duy vẽ mới là chính.
- Không lạm dụng biểu đồ tròn (Pie Chart) nếu có quá nhiều hạng mục.
- Biểu đồ Bar Chart (Cột ngang) là vua trong việc so sánh.
- Line Chart dùng để xem xu hướng theo thời gian.
- Luôn có thẻ số (Card) hiển thị các chỉ số KPIs quan trọng nhất ở trên cùng.
- Tránh dùng quá nhiều màu sắc sặc sỡ, ưu tiên dùng màu sắc để "nhấn mạnh" điểm bất thường.
