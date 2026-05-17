# 🌌 Antigravity OS - Agentic Prompt Framework

Đây là bộ khung System Prompts và Rules (Luật lệ) giúp biến mọi AI Agent (như Cursor, Windsurf, Cline) thành một kỹ sư phần mềm thực thụ chạy bằng hệ điều hành Antigravity OS.

## 📁 Cấu trúc Thư mục

- `AGENTS.md`: Tệp Kernel (Hạt nhân) cốt lõi chứa "Hệ tư tưởng" (Operating Doctrine) của Antigravity. Đây là tài liệu quan trọng nhất quy định luật lệ lập trình.
- `.antigravity/`: Thư mục chứa các file `.mdc` (Markdown Context / Cursor Rules). Đây là các "kỹ năng chuyên môn" và "vai trò" cụ thể của AI.
  - `agents/`: Phân chia AI thành các đặc vụ nhỏ (System Architect, Backend Expert, Test Engineer, v.v).
  - `capabilities/`: Các module chuyên ngành cắm-rút (ví dụ: `rag.mdc` cho hệ thống AI Search, VectorDB).
  - `project/` & `templates/`: Cấu trúc dự án và các template tự động sinh Docs chuẩn mực.

## 🚀 Cách mang sang máy khác / Dự án khác

### Dành cho Cursor (Và các AI Code Editor tương tự)
Rất đơn giản, bạn chỉ cần copy tệp `AGENTS.md` và thư mục `.antigravity/` từ trong thư mục này, thả thẳng vào **Thư mục gốc (Root directory)** của dự án mới. 

Cursor sẽ tự động quét các file `.mdc` và tự động áp dụng đúng Rule khi bạn đặt câu hỏi liên quan đến code.
*(Tip: Ở câu chat đầu tiên trên máy mới, hãy gõ `Đọc file AGENTS.md và nạp hệ tư tưởng` để Agent khởi động mượt mà nhất).*

### Dành cho ChatGPT / Claude (Giao diện Web)
Hãy mở file `AGENTS.md` (hoặc các file `.mdc` mà bạn cần), copy toàn bộ nội dung text và dán thẳng vào ô Chat (hoặc phần Custom Instructions / Project Knowledge). Hệ thống AI sẽ lập tức đổi vai thành "Antigravity Agent".
