# 📚 TURING HUB - TRUNG TÂM TRI THỨC (DOCS)

Thư mục này là "Bộ não thứ hai" của toàn bộ hệ thống. Nơi đây lưu trữ mọi cấu trúc kiến trúc, dữ liệu học tập của AI và các mã nguồn thử nghiệm. 
Tuyệt đối tuân thủ quy tắc phân loại dưới đây để đảm bảo chuẩn **Industrial Grade**:

## 📂 Quy Hoạch Thư Mục

### 1. `architecture/` (Bản Vẽ Kỹ Thuật)
- **Chức năng:** Nơi lưu trữ các roadmap, sơ đồ hệ thống, quy tắc thiết kế (Technical Blueprints).
- **Ví dụ:** Kế hoạch 60 ngày, Sơ đồ luồng RAG.

### 2. `integrations/` (Cầu Nối Hệ Thống)
- **Chức năng:** Nơi chứa các hướng dẫn và file backup của các hệ thống vệ tinh (n8n, webhook, APIs).
- **Ví dụ:** Backup workflow của n8n.

### 3. `vector_knowledge/` (Trạm Đổ Nhiên Liệu RAG)
- **Chức năng:** **Nơi Sếp ném các file PDF, Markdown, sách giáo khoa vào đây.** 
- **Quy trình:** Hệ thống AI Professor sẽ quét thư mục này, "băm nhỏ" tài liệu và nạp vào PostgreSQL (pgvector).

### 4. `experiments/` (Phòng Thí Nghiệm - Sandbox)
- **Chức năng:** Nơi Sếp vọc vạch code, thử nghiệm các công nghệ mới (Khóa học AI, script Python nháp) mà không sợ làm hỏng mã nguồn chính (`src/`).

---
*Giao thức quy hoạch được thiết lập bởi AI Swarm (V14.5).*
