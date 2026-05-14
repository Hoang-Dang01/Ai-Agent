# 🏛️ Blueprint: Advanced RAG Architecture (Reference)

**Nguồn tham khảo:** Government AI Copilot (Từ User)
**Ngày lưu:** 2026-05-13
**Mục đích:** Làm bản thiết kế tham chiếu (Blueprint) khi xây dựng Backend AI (Phase 04) cho hệ thống Turing Hub (The Vault).

---

## 1. Stack Công Nghệ Lõi (The Tech Stack)
Để hệ thống RAG không bị "ngu" khi dữ liệu phình to, chúng ta sẽ áp dụng các công nghệ sau từ bài tham khảo:
- **FastAPI (Python):** Làm Backend xử lý luồng AI (nhanh, hỗ trợ async tốt nhất).
- **Qdrant:** Vector Database (Lưu trữ tọa độ không gian của dữ liệu).
- **PostgreSQL:** Lưu trữ Metadata và dùng để Full-Text Search (Tìm kiếm theo từ khóa chính xác).
- **Redis:** Làm Cache (Nhớ những câu hỏi đã hỏi để trả lời ngay mà không tốn tiền gọi API LLM).

## 2. Bước Tiến Hóa: GraphRAG (Mạng Lưới Tri Thức)
Thực thi theo chuẩn **GraphRAG (Graph Retrieval-Augmented Generation)** thay vì chỉ dùng Vector RAG truyền thống. Đây chính là mảnh ghép khớp 100% với cái giao diện "Mạng Lưới Tri Thức" ở Frontend.

**Tại sao phải dùng GraphRAG?**
Vector RAG bị "mù" toàn cục. Nó chỉ giỏi trả lời câu hỏi chi tiết. Nếu User hỏi: *"Tóm tắt 3 xung đột chính trong 1000 trang quy định này"*, Vector RAG sẽ thất bại vì các vector bị đứt gãy.
**GraphRAG** giải quyết bằng cách:
1. **Extraction (Trích xuất):** Khi nạp file vào, LLM sẽ đọc và trích xuất ra các Thực thể (Entities: Tên người, Tên phòng ban) và Mối quan hệ (Relationships: Quản lý, Trực thuộc).
2. **Graph Construction:** Lưu đống này vào **Đồ thị (Graph DB như Neo4j)**.
3. **Global Search:** Khi hỏi, hệ thống sẽ chạy thuật toán quét trên mạng lưới Đồ thị để xâu chuỗi thông tin ở mức vĩ mô.

👉 **Kiến trúc chốt hạ:** `Neo4j (Graph DB)` + `Qdrant (Vector DB)` + `FastAPI`. Một sự kết hợp hủy diệt!

---
*Lưu ý cho Phase 04: Cứ mở file này ra đọc lại trước khi code backend API!*
