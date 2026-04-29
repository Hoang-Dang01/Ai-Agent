# ĐÂY LÀ FILE CODE THỰC SỰ - MÁY TÍNH CÓ THỂ CHẠY ĐƯỢC

# Bạn đã thiết kế cái máy tên là "áp mã giảm giá"
# Trong Python, dùng chữ 'def' để báo hiệu ta đang tạo ra một cái máy (Hàm).
# Input (Đầu vào) ở đây là 'danh_sach_tien' và 'phan_tram_giam'
def Ap_Ma_Giam_Gia(danh_sach_tien, phan_tram_giam):
    
    # BƯỚC 1: Tính tổng số tiền (như bạn mô tả)
    tong_tien = 0
    for tien in danh_sach_tien:
        tong_tien = tong_tien + tien
        
    # BƯỚC 2: Sau đó nhân với mã giảm giá
    so_tien_duoc_giam = tong_tien * phan_tram_giam
    so_tien_cuoi_cung = tong_tien - so_tien_duoc_giam
    
    # BƯỚC 3: Xuất ra cho người dùng (Trả về Output)
    return so_tien_cuoi_cung


# ==========================================
# THỬ NGHIỆM CHẠY CỖ MÁY DƯỚI GÓC ĐỘ NGƯỜI DÙNG
# ==========================================

# Khách mua 4 hộp thuốc: giá lần lượt là 100k, 250k, 50k, 30k
hoa_don_khach_hang = [100, 250, 50, 30] 

# Sếp cho mã giảm giá 10% (0.1)
ma_giam = 0.1 

# Bỏ hóa đơn và mã giảm vào máy để xử lý
ket_qua = Ap_Ma_Giam_Gia(hoa_don_khach_hang, ma_giam)

# In kết quả ra màn hình (Console)
print("-------------------------------------------------")
print("Hệ thống Dược sĩ Mini-AI xin thông báo:")
print("Số tiền cuối cùng khách phải trả là:", ket_qua, "ngàn đồng.")
print("-------------------------------------------------")
