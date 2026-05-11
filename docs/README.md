# 📚 KHỐI DỮ LIỆU & KIẾN THỨC (DOCS)

Thư mục `docs` đóng vai trò là "Bộ não thứ hai" (Second Brain) của toàn bộ hệ thống Ai-Agent. Nơi đây lưu trữ mọi kiến thức từ lý thuyết, prompt, mã nguồn nghiên cứu cho đến cấu trúc kỹ thuật của hệ thống. Dữ liệu tại đây sẽ được AI đọc và nạp vào Vector Database (RAG) để học hỏi.

Tuyệt đối tuân thủ quy tắc phân loại dưới đây để đảm bảo chuẩn **Industrial Grade**:

## 📂 Cấu Trúc Cây Thư Mục

```text
docs/
│
├── agency-agents/          
│   # 👥 TẬP ĐOÀN ĐA TÁC NHÂN
│   # Nơi chứa hàng chục file Markdown (.md) định nghĩa cực kỳ chi tiết 
│   # vai trò, tính cách, kỹ năng (personas) của các AI Agent. 
│   # Được chia rành mạch theo từng phòng ban: design, engineering, sales, marketing...
│
├── claude-cli-research/    
│   # 🔬 KHO NGHIÊN CỨU MÃ NGUỒN 
│   # Chứa bản sao mã nguồn của công cụ Claude Code CLI.
│   # Dùng để Sếp và đội ngũ kỹ thuật nghiên cứu cấu trúc, bảo mật chuỗi cung ứng.
│
├── GenerativeAICourse/     
│   # 🎓 TÀI LIỆU HỌC TẬP 
│   # Chứa toàn bộ giáo trình, bài lab và tài liệu liên quan đến khóa học Trí Tuệ Nhân Tạo Tạo Sinh.
│
└── turing-hub/             
    # 🧠 TRẠM TRI THỨC LÕI (TURING HUB)
    # Trung tâm tri thức kỹ thuật và thí nghiệm. Bên trong bao gồm:
    ├── architecture/     # Bản vẽ kỹ thuật, sơ đồ luồng hệ thống.
    ├── experiments/      # Phòng thí nghiệm code (sandbox), nơi vọc vạch công nghệ mới.
    ├── integrations/     # Tài liệu và backup kết nối các hệ thống vệ tinh (n8n, webhook...).
    └── vector_knowledge/ # Nơi ném file PDF, Markdown vào để AI tự động quét và nạp dữ liệu.
```

---
*Giao thức quy hoạch được thiết lập bởi AI Swarm.*
