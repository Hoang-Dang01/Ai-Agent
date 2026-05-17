# 🗄️ Lược Đồ Cơ Sở Dữ Liệu (DB Schema)

> File này được thiết kế và quản lý bởi Agent 06 (System Architect). Developer (Agent 07) dựa vào đây để truy vấn.

## Các Bảng (Tables) Hiện Có:
*(Hiện tại hệ thống sử dụng PostgreSQL với pgvector).*

- **Bảng `users`**: Quản lý tài khoản (id, username, password_hash).
- **Bảng `knowledge_base`**: Chứa dữ liệu RAG đã được nhúng vector (id, content, embedding_vector).

*(Cần cập nhật thêm khi dự án phình to).*
