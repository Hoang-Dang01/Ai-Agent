# Bài 02: Xử lý hàng đống dữ liệu (Danh sách & Vòng lặp)

Trong file trước, bạn đã tư duy logic cực kỳ chính xác: "Nếu tuổi > 60 hoặc < 5 thì ưu tiên". 
Máy tính sẽ "dịch" câu nói đó của bạn thành Python như sau:
```python
if tuoi > 60 or tuoi < 5:
    print("Ưu tiên")
```
Thấy không? Code thực chất chỉ là tiếng Anh đơn giản hóa thôi!

---
## Vấn đề 1: Danh sách (List / Array) - Cái Tủ Đựng Đồ
Hôm trước chúng ta học **Biến (Variables)** như một cái hộp đựng 1 món đồ. Vậy nếu bạn có 100 khách hàng thì sao? Tạo ra 100 cái hộp `khach_1`, `khach_2`... `khach_100` ư?
Thế thì chết mệt! Người ta tạo ra một cái **Tủ (Danh sách - List)** để chứa nhiều đồ.

Trong Python, danh sách được tạo bằng dấu ngoặc vuông `[ ]`:
```python
# Tủ chứa danh sách tuổi của 5 khách hàng đang xếp hàng
danh_sach_tuoi = [25, 65, 4, 30, 71]
```

---
## Vấn đề 2: Vòng lặp (Loop) - Phân thân chi thuật
Giờ bạn đã có danh sách 5 khách hàng. Làm sao để áp dụng luật ưu tiên (tuổi > 60 hoặc < 5) cho **từng người một**?

Bạn không thể tự viết 5 câu `if/else`. Bạn sẽ dùng Vòng lặp **`for`**. 
Vòng lặp `for` có nghĩa là: *"Này máy tính, hãy lặp đi lặp lại công việc này CHO MỖI món đồ trong danh sách"*.

```python
danh_sach_tuoi = [25, 65, 4, 30, 71]

# Cú pháp tiếng Anh: For each person in the list...
for tuoi in danh_sach_tuoi:
    # Bắt đầu kiểm tra người này
    if tuoi > 60 or tuoi < 5:
        print("Tuổi", tuoi, "-> Được khám ưu tiên!")
    else:
        print("Tuổi", tuoi, "-> Vui lòng xếp hàng đợi.")
```
*Kết quả máy tính sẽ in ra:*
*Tuổi 25 -> Vui lòng xếp hàng đợi.*
*Tuổi 65 -> Được khám ưu tiên!*
*Tuổi 4 -> Được khám ưu tiên!*
...

---
## Câu hỏi thực hành Bài 2:
Đây là bài rèn luyện tư duy Phân tích dữ liệu (Data Analysis) đầu tiên của bạn. Hãy không cần gõ code, chỉ dùng ngôn ngữ đời thường (tiếng Việt) viết ra quy trình logic cho bài toán sau:

**Bài toán:** Bạn có một danh sách doanh thu bán thuốc của 4 ngày: `doanh_thu = [100, 250, 50, 300]` (đơn vị ngàn đồng). 
Sếp yêu cầu bạn: **Tính TỔNG doanh thu của 4 ngày này.**

👉 *Gợi ý: Ban đầu, hãy tưởng tượng bạn có một cái ví rỗng (tổng = 0). Sau đó, bạn đưa tay vào tủ (danh_sach), lặp qua từng ngày một. Bạn sẽ làm gì với cái ví rỗng và từng con số được lấy ra?*

Hãy trả lời quy trình (các bước làm) của bạn vào khung chat nhé!
