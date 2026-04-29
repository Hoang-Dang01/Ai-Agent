# Ngày 01: Nhập môn Tư duy Máy tính (Dành cho người mới)

Đừng lo lắng nếu bạn chưa biết gì về code! Hãy tưởng tượng máy tính là một đứa trẻ cực kỳ ngoan ngoãn nhưng lại vô cùng ngốc nghếch. Nó **chỉ làm đúng những gì bạn dạy** và không tự hiểu được ngụ ý của bạn. 

Hôm nay chúng ta học cách "ra lệnh" cho đứa trẻ đó!

## 1. Biến (Variables) - Những chiếc hộp đựng đồ
Khi bạn làm Data Analysis (Phân tích dữ liệu), bạn phải dọn dẹp hàng ngàn con số. Máy tính cần nơi để "cất giữ" các con số này. Nơi đó gọi là **Biến (Variable)**.

Dưới đây là một ví dụ bằng ngôn ngữ **Python**:
```python
# Tạo ra một chiếc hộp tên là 'gia_thuoc' và bỏ số 50000 vào đó
gia_thuoc = 50000

# Bỏ chữ "Panadol" vào một chiếc hộp khác tên là 'ten_thuoc'
ten_thuoc = "Panadol" 
```

## 2. Logic Điều kiện (If / Else) - Sự lựa chọn
Làm sao để máy tính biết khi nào thì tính tiền, khi nào thì báo hết hàng? Đó là lúc bạn cần tư duy **Nếu... thì... (If / Else)**.

```python
so_luong_kho = 0

# Tư duy logic:
if so_luong_kho > 0:
    print("Bán thuốc cho khách")
else:
    print("Xin lỗi, thuốc này đã hết!")
```

## Câu hỏi thực hành ngày 1:
Hãy tưởng tượng bạn đang viết một "chức năng" bằng chữ (chưa cần code) để phân loại khách hàng ưu tiên trong bệnh viện. 
Yêu cầu: Khách hàng nào trên 60 tuổi **HOẶC** là trẻ em dưới 5 tuổi thì được vào khám ưu tiên.

👉 *Nếu viết đoạn logic này theo dạng tư duy "Nếu... thì", bạn sẽ diễn đạt bằng tiếng Việt như thế nào? (Hãy trả lời vào khung chat để tui xem logic của bạn nhé!)*
nếu là tuổi của khách trên 60 hoặc nhỏ hươn 5 thì được khám ưu tiên
