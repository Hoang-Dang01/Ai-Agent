# 🏛️ Blueprint: Advanced RAG Architecture (Reference)

**Nguồn tham khảo:** Government AI Copilot (Từ User)
**Ngày lưu:** 2026-05-13
**Mục đích:** Làm bản thiết kế tham chiếu (Blueprint) khi xây dựng Backend AI (Phase 04) cho hệ thống Turing Hub (The Vault).

---

## 1. Stack Công Nghệ Lõi (The Tech Stack)
Để hệ thống RAG không bị "ngu" khi dữ liệu phình to, chúng ta sẽ áp dụng các công nghệ sau từ bài tham khảo:
- **FastAPI (Python):** Làm Backend xử lý luồng AI (nhanh, hỗ trợ async tốt nhất).
- **Neo4j (Graph & Vector DB):** (All-in-one) Lưu trữ mạng lưới Thực thể/Quan hệ để truy vấn vĩ mô, đồng thời sử dụng tính năng Vector Index (từ bản 5.11+) để tìm kiếm ngữ nghĩa mà không cần cài thêm Qdrant cồng kềnh.
- **PostgreSQL:** Lưu trữ Metadata và dùng để Full-Text Search (Tìm kiếm theo từ khóa chính xác).
- **Redis:** Làm Cache (Nhớ những câu hỏi đã hỏi để trả lời ngay mà không tốn tiền gọi API LLM).

## 2. Bước Tiến Hóa: GraphRAG (Mạng Lưới Tri Thức)
Thực thi theo chuẩn **GraphRAG (Graph Retrieval-Augmented Generation)** thay vì chỉ dùng Vector RAG truyền thống. Đây chính là mảnh ghép khớp 100% với cái giao diện "Mạng Lưới Tri Thức" ở Frontend.

**Tại sao phải dùng GraphRAG?**
Vector RAG bị "mù" toàn cục. Nó chỉ giỏi trả lời câu hỏi chi tiết. Nếu User hỏi: *"Tóm tắt 3 xung đột chính trong 1000 trang quy định này"*, Vector RAG sẽ thất bại vì các vector bị đứt gãy.
**GraphRAG** giải quyết bằng cách:
1. **Extraction (Trích xuất):** Khi nạp file vào, LLM sẽ đọc và trích xuất ra các Thực thể (Entities: Tên người, Tên phòng ban) và Mối quan hệ (Relationships: Quản lý, Trực thuộc).
## 4. Chiến Lược Triển Khai: Kiến Trúc "Chimera" (Hấp Thu Tinh Hoa)
Thay vì nhắm mắt chạy nguyên một bộ Docker cồng kềnh của bên thứ 3, chúng ta sẽ thực thi theo tư duy của một **Kỹ sư lõi (Core Engineer)**: Tự build lõi và đi "săn" những module xịn nhất của giới Open-Source gắn vào:
- **Tự Build API:** Code Backend bằng `FastAPI + Neo4j` để kiểm soát hoàn toàn luồng dữ liệu và tích hợp hoàn hảo với Giao diện Frontend Cinematic của chúng ta.
- **Hấp thu "DeepDoc" từ RAGFlow:** Mượn module xử lý tài liệu của RAGFlow chuyên xử lý OCR, băm nhỏ tài liệu giữ nguyên cấu trúc Bảng biểu, Tiêu đề. Không để tài liệu bị nát vụn.
- **Hấp thu "Intent Router" từ RAG v2 (Government Copilot):** Mượn tư duy định tuyến ý định cực thông minh. Dùng model nhỏ (như PhoBERT hoặc model local nhẹ) để phân loại ý định User trước khi gọi LLM (VD: Hỏi bâng quơ -> Trả Cache; Hỏi tóm tắt -> Gọi Summarizer; Hỏi tra cứu -> Mới chạy GraphRAG).

👉 **Kiến trúc chốt hạ (The Ultimate Chimera):** `FastAPI` (Core Router) + `Neo4j` (Graph & Vector) + `RAGFlow DeepDoc` (Document Parser) + `RAG v2 Intent Router` (Bộ lọc câu hỏi). Một hệ thống bất khả chiến bại!

---
*Lưu ý cho Phase 04: Cứ mở file này ra đọc lại trước khi code backend API!*
