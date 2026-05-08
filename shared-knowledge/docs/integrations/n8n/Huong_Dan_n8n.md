# Hướng dẫn Dựng Workflow n8n (AI Study Hub)

Bây giờ chúng ta sẽ vào phần hay nhất: **"Lắp não"** cho AI.
Mở n8n của bạn lên (chạy `npx n8n` trong terminal nếu bạn cài qua npm), tạo một Workflow mới và kéo thả các Node theo thứ tự sau:

## 1. Node Nhận Dữ Liệu (Cửa ngõ)
Kéo node **Webhook** vào màn hình:
- **Method:** `POST`
- **Path:** `chat`
- **Respond:** `Using 'Respond to Webhook' Node` (Để AI nghĩ xong mới trả lời)
- Node này có nhiệm vụ nhận tin nhắn (Ví dụ: *"Giáo viên Code ơi, sửa lỗi này với"* từ file `index.html` lúc nãy).

## 2. Node Phân Loại (LLM Router)
Kéo node **Basic LLM Chain** (Hoặc dùng node **Switch** kết hợp với **OpenAI/Gemini**):
- **Nhiệm vụ:** Đọc tin nhắn và quyết định chuyển đi đâu.
- **Prompt:** *"Dựa vào câu hỏi sau, hãy phân loại ý định người dùng thành 2 loại: `CODE` (nếu liên quan lập trình, sửa lỗi) hoặc `THEORY` (nếu hỏi lý thuyết, tóm tắt). Trả về đúng 1 từ."*

## 3. Rẽ Nhánh (Switch Node)
Dựa vào kết quả chữ `CODE` hay `THEORY` ở trên, chia ra 2 nhánh:

### Nhánh 1: Code Mentor (Giáo viên Code)
- Kéo node **AI Agent**.
- Nối với **Window Buffer Memory** (để nó nhớ lịch sử chat).
- Mở file `code_mentor.md` của chúng ta ra, copy toàn bộ nội dung dán vào ô **System Message** của con Agent này.

### Nhánh 2: Analytics Expert (Chuyên gia Phân tích - RAG)
- Kéo node **AI Agent**.
- Mở file `analytics_expert.md` dán vào **System Message**.
- Bắt buộc nối thêm node **Vector Store** (Chọn **Supabase**). Điền URL và Password của Supabase nãy bạn vừa lưu vào đây.
- Kế bên Supabase, gắn node **Embeddings** (để nó dịch chữ thành số cho RAG).

## 4. Node Trả Kết Quả & Lưu Lịch Sử
Sau khi 2 con Agent đã có câu trả lời:
- Kéo node **Postgres** (Chọn Insert). Điền thông tin Supabase vào, cấu hình để lưu vào bảng `chat_history`.
- Kéo node cuối cùng là **Respond to Webhook** để bắn câu trả lời về lại giao diện Website.
