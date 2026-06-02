# 📚 KHỐI DỮ LIỆU & KIẾN THỨC (DOCS)

Thư mục `docs` đóng vai trò là "Bộ não thứ hai" (Second Brain) của toàn bộ hệ thống Ai-Agent. Nơi đây lưu trữ mọi kiến thức từ lý thuyết, prompt, mã nguồn nghiên cứu cho đến cấu trúc kỹ thuật của hệ thống. Dữ liệu tại đây sẽ được AI đọc và nạp vào Vector Database (RAG) để học hỏi.

Tuyệt đối tuân thủ quy tắc phân loại dưới đây để đảm bảo chuẩn **Industrial Grade**:

## 📂 Cấu Trúc Cây Thư Mục

```text
docs/
│
├── plans/                  # Master Plan và Blueprints từng Phase kỹ thuật
│
├── history/                # CHANGELOG (Lịch sử quyết định kiến trúc và refactor)
│
├── architecture/           # Bản vẽ kỹ thuật, sơ đồ luồng Frontend/Backend
│
├── qa/                     # Báo cáo nghiệm thu kỹ thuật và chất lượng sản phẩm
│
└── vault/                  # [HỒ SƠ KHÔNG GIAN TRI THỨC LÕI]
    ├── ba_report_local_agent.md   # BRD đặc tả nghiệp vụ Vision Agent
    ├── src_architecture_readme.md # Cẩm nang chi tiết mã nguồn 4 phân hệ
    ├── uat_verification_report.md  # Báo cáo UAT chạy thực tế FlaUI
    ├── lessons-learned/    # Các báo cáo bài học kinh nghiệm
    └── tech-stack/         # [KHO TRI THỨC KỸ THUẬT & NGHIÊN CỨU]
        ├── advanced-rag-blueprint.md  # Tài liệu thiết kế RAG
        ├── turing-hub/     # Trạm tri thức lõi (kiến trúc, n8n workflows)
        ├── GenerativeAICourse/ # Giáo trình học tập Trí tuệ Nhân tạo Tạo sinh
        └── claude-cli-research/ # Bản sao nghiên cứu mã nguồn đối chiếu
```

---
*Giao thức quy hoạch được thiết lập bởi AI Swarm.*
