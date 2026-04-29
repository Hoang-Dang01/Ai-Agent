# Bài 03: Đóng gói kĩ năng (Hàm - Functions)

Bạn tư duy quá xuất sắc! Cách bạn vừa diễn tả chính xác 100% thuật toán Cộng dồn (Summation) được sử dụng rộng rãi nhất trong Data Analysis.
Code của con AI khi "nghe" bạn mô tả sẽ viết ra như sau:

```python
danh_sach_doanh_thu = [100, 250, 50, 300]
tong = 0 # ban đầu cái ví rỗng

for so_tien in danh_sach_doanh_thu:
    tong = tong + so_tien  # cộng từng phần tử vào tổng
    
print("Tổng doanh thu là:", tong)
```

---
## Khái niệm cuối cùng của Level 0: Hàm (Function) - Cỗ máy chế biến

Tất cả các logic bạn vừa nghĩ ra ở trên rất xịn, nhưng có một nhược điểm: Nó nằm lộ thiên. Nếu sếp đưa bạn 5 quyển sổ doanh thu khác nhau, bạn không thể ngồi copy-paste cái vòng lặp 5 lần được. Đoạn code sẽ dài lê thê và rất dễ sai.

Giải pháp: Bạn ném toàn bộ đoạn code vòng lặp đó vào bên trong một **Cái hộp đóng kín**. Cái hộp này nhận Đầu vào (Input) là danh sách tờ tiền, nó sẽ quay quay xử lý ở trong, và nhả ra Đầu ra (Output) là cục Tiền tổng.

Cái hộp đó gọi là **Hàm (Function)**.

```python
# 1. ĐỊNH NGHĨA HÀM (Tạo ra cái máy)
def Tinh_Tong_Doanh_Thu(danh_sach):
    tong = 0
    for so_tien in danh_sach:
        tong = tong + so_tien
    return tong # Trả lại (Nhả ra) kết quả

# 2. SỬ DỤNG HÀM (Cắp điện cho máy chạy)
doanh_thu_thang_1 = [100, 200, 300]
ket_qua = Tinh_Tong_Doanh_Thu(doanh_thu_thang_1) 
# Máy sẽ chạy ngầm và nhả ra số 600 vào biến ket_qua
```

> [!NOTE]
> Đây là TỪ KHÓA QUAN TRỌNG NHẤT: Tại sao chúng ta phải học Hàm (Function)? 
> Trả lời: Vì hệ thống **Claude Code** hay Chatbot AI **chỉ hiểu được Function**. Khi con AI nói chuyện với bạn, bản thân con AI không biết đếm tiền. Nhưng khi nó nhận thấy bạn cần tính tổng, nó sẽ tìm trong danh sách các cỗ máy (Functions) xem có máy nào tên là `Tinh_Tong_Doanh_Thu` không. Nếu có, nó tự động vứt cục data của bạn vào, đợi máy nhả kết quả rồi nói lại với bạn.
> 
> Trong thế giới AI, người ta không gọi là "Function", người ta gọi những "Cái máy" này là **"Tool" (Công cụ)** hoặc **"Function Calling"**.

## Câu hỏi tốt nghiệp Level 0 (Thực hành thiết kế cỗ máy):

Tưởng tượng tui là ChatGPT. Tui không hề biết tính giảm giá.
Nhiệm vụ của bạn là hãy tự tay **thiết kế một cỗ máy (Function)** giúp tui tính số tiền sau khi áp dụng mã giảm giá cho con AI Nhà Thuốc Medstand.

👉 *Bạn hãy dùng tiếng Việt mô tả cấu tạo cái máy này: Tên cái máy là gì? Đầu vào (Input) tui (AI) phải ném vào máy những con số nào? Và cái máy sẽ làm phép tính ngầm gì để nhả Đầu ra (Output)?*

Hãy trả lời vào khung chat nhé! Qua câu này là chúng ta tốt nghiệp khóa nháp và đi vào Code thật trên VS Code!
