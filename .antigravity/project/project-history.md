# 📜 Nhật Ký Dự Án (Project History)

> File này do Knowledge Sentinel (Agent 09) và Model Evaluator (Agent 10) cập nhật để ghi nhớ các sai lầm và quyết định quan trọng.

## Bài Học Rút Ra (Lessons Learned):
- **11/05/2026**: Di chuyển toàn bộ kiến trúc frontend sang ReactJS. Cấu trúc cũ sử dụng HTML/JS thuần không đủ khả năng mở rộng cho hệ thống Multi-Agent Realtime.
- Đã thiết lập cấu trúc `docs/` phẳng để tối ưu hóa việc nạp dữ liệu RAG.

## Lỗi Thường Gặp (Gotchas):
- Cẩn thận khi chạy `concurrently` ở thư mục root, cần đảm bảo đường dẫn `cd src/` trỏ đúng vào các module con.
