# 🐍 Cẩm Nang Python Cho Data Analyst

Với Data Analyst, bạn không cần học Python để làm web hay viết phần mềm. Bạn chỉ cần Python như một công cụ xử lý lượng dữ liệu lớn mà Excel bị "treo", hoặc để tự động hóa các báo cáo.

## 📺 Khóa Học & Nguồn Học Khuyến Nghị
1. **Dành cho người chưa biết gì về Code:** Khóa học kinh điển [Python for Everybody (Charles Severance - Dr. Chuck)](https://www.py4e.com/). Khóa này có trên Coursera và Youtube.
2. **Kênh Youtube Corey Schafer:** Playlist về Pandas của kênh này là Huyền Thoại.
3. **Kênh Youtube Alex The Analyst:** Playlist Python for Data Analyst Bootcamp.
4. **Trang web thực hành:** W3Schools Python, Kaggle Learn.

## 🔑 Các Kiến Thức Cốt Lõi (Base Python)
- Biến (Variables), Kiểu dữ liệu (Data types: String, Integer, Float, Boolean).
- Cấu trúc dữ liệu cơ bản: **List** (Danh sách) và **Dictionary** (Từ điển).
- Vòng lặp (For loop, While loop).
- Câu lệnh điều kiện (If, Elif, Else).
- Viết hàm (Functions - `def`).

## 🐼 Thư viện cốt lõi: Pandas (Bắt Buộc)
Pandas là Excel của Python. Bạn dùng Pandas để thao tác với dữ liệu dạng bảng.
- Đọc và ghi dữ liệu: `pd.read_csv()`, `pd.to_excel()`.
- DataFrame (Bảng) và Series (Cột).
- Khám phá dữ liệu: `df.head()`, `df.info()`, `df.describe()`.
- Lọc dữ liệu: `df[df['column'] > 10]`.
- Gom nhóm: `df.groupby()`.
- Xử lý dữ liệu khuyết thiếu (Missing values): `df.dropna()`, `df.fillna()`.

## 📈 Các thư viện khác
- **NumPy:** Xử lý các phép toán và mảng (array) tốc độ cao.
- **Matplotlib / Seaborn:** Vẽ biểu đồ bằng code (Thực ra DA thường dùng Power BI/Tableau để vẽ cho đẹp và nhanh, nhưng thi thoảng Python vẫn hữu ích khi làm phân tích khám phá - EDA).
