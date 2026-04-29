# 🗄️ Cẩm Nang Tự Học SQL Cho Data Analyst

SQL (Structured Query Language) là ngôn ngữ giao tiếp với CSDL. Với Data Analyst, SQL là kỹ năng SỐ 1. Bạn dùng SQL để "kéo" (trích xuất) và nhào nặn dữ liệu trước khi mang đi vẽ biểu đồ.

## 📺 Khóa Học & Nguồn Thực Hành Khuyến Nghị
1. **Thực hành trực tiếp (Cho người mới):** [SQLBolt.com](https://sqlbolt.com/) - Vừa học lý thuyết vừa gõ code trực tiếp trên web, cực kỳ dễ hiểu.
2. **Web đọc tài liệu chuẩn:** [W3Schools SQL](https://www.w3schools.com/sql/) hoặc [Mode Analytics SQL Tutorial](https://mode.com/sql-tutorial/).
3. **Khóa học Youtube:** Kênh **Alex The Analyst** (Playlist SQL cho Data Analyst).
4. **Nơi luyện tập giải đề:** HackerRank, LeetCode (Phần Database).

*(Lưu ý: Các nguồn trên đều bằng tiếng Anh. Trong ngành Data, việc làm quen với tài liệu tiếng Anh là cực kỳ quan trọng vì bản thân các câu lệnh SQL cũng là tiếng Anh. Tuy nhiên, nếu bạn muốn học bằng tiếng Việt trước để nắm tư duy cho dễ, hãy tham khảo các nguồn dưới đây)*

**Nguồn học Tiếng Việt chất lượng:**
- **Kênh Youtube 200Lab / Datapot:** Đây là những trung tâm và kênh chia sẻ kiến thức Data rất nổi tiếng tại Việt Nam, có các series dạy SQL từ con số 0 rất dễ hiểu.
- **Trang web HowKteam:** Web học lập trình miễn phí của Việt Nam, có khóa học SQL Server cực kỳ chi tiết bằng tiếng Việt.
## 🔑 Các Kiến Thức Cốt Lõi Bắt Buộc Phải Giỏi
Bạn chủ yếu dùng câu lệnh `SELECT` (DQL) để truy vấn, ít khi phải dùng `INSERT/UPDATE/DELETE`.
- **Cơ bản:** `SELECT`, `FROM`, `WHERE`, `ORDER BY`, `LIMIT`.
- **Gom nhóm & Thống kê:** `GROUP BY`, `HAVING` kết hợp với các hàm `SUM()`, `COUNT()`, `AVG()`, `MAX()`, `MIN()`.
- **Kết nối dữ liệu (Cực kỳ quan trọng):** `INNER JOIN`, `LEFT JOIN` (Dùng nhiều nhất), `RIGHT JOIN`, `FULL JOIN`, `UNION`.
- **Xử lý chuỗi và thời gian:** `CAST`, `CONVERT`, `EXTRACT()`, `DATE_TRUNC()`, `COALESCE()`.

## 🚀 Level Nâng Cao (Để qua vòng Phỏng Vấn)
Đa số các công ty sẽ test kỹ năng SQL của bạn ở phần này:
- **Subqueries (Truy vấn lồng) & CTE (`WITH` clause):** Giúp code gọn gàng, dễ đọc và xử lý logic nhiều bước.
- **Window Functions (Hàm cửa sổ - BẮT BUỘC):** `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `LEAD()`, `LAG()`. Bắt buộc phải hiểu mệnh đề `OVER (PARTITION BY ... ORDER BY ...)`.
