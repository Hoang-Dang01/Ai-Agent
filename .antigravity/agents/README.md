# 🤖 ANTIGRAVITY AGENTS DIRECTORY (THE OVERLAY LAYER)

Thư mục này chứa "Mã gen" (Cognitive Overlay) cho từng phòng ban AI trong hệ sinh thái Antigravity. Khi gọi một AI vào làm việc, hệ thống sẽ đọc các file `.mdc` tương ứng để gán vai trò và quyền hạn (Role-Playing & Authorization).

> **Lưu ý:** Tất cả các Agent ở đây đều kế thừa luật cốt lõi (Global Governance) từ file `AGENTS.md` ở thư mục gốc.

## 🗂️ BẢN ĐỒ PHÒNG BAN (AGENTS INDEX)

### 1. `00-team-dynamics.mdc` (Giao thức Giao tiếp)
- **Công dụng:** Định nghĩa cách các phòng ban nói chuyện với nhau. Chứa ma trận bàn giao (Handoff Matrix) và cách giải quyết xung đột khi code và specs đá nhau.
- **Khi nào AI cần đọc:** Đọc liên tục để biết phải "ném" task cho ai tiếp theo khi mình làm xong việc.

### 2. `01-strategy/main.mdc` (Phòng Chiến Lược & Kiến Trúc)
- **Công dụng:** Bộ não lên kế hoạch. Tiếp nhận BRD/Brief từ user, phân tích rủi ro hệ thống, chia nhỏ task và xuất ra các file Markdown `phase-xx.md` với checklist cực kỳ chi tiết.
- **Khi nào AI cần đọc:** Khi bắt đầu một Phase mới, khi cần đánh giá một tính năng lớn, hoặc khi user nói "hãy lên plan cho tính năng X".

### 3. `02-engineering/main.mdc` (Phòng Kỹ Thuật & Thực Thi)
- **Công dụng:** Cỗ máy viết code. Có nhiệm vụ đọc `phase-xx.md` và gõ ra code thật. Đảm bảo chuẩn Coding Standard (PEP8, ES6+), bắt lỗi (Try/Catch) đầy đủ và không hardcode secret.
- **Khi nào AI cần đọc:** Khi User yêu cầu "bắt tay vào code đi", sửa bug, setup Docker, hoặc viết tính năng.

### 4. `03-security-qa/main.mdc` (Phòng Bảo Mật & QA)
- **Công dụng:** Lá chắn thép. Có **Quyền Phủ Quyết (Veto Power)**. Nhiệm vụ là soi lỗi bảo mật, test API limit, kiểm tra UX thực tế. Nếu code lởm, nó sẽ bắt Engineering sửa lại.
- **Khi nào AI cần đọc:** Trước khi đóng (close) một Phase, khi cần review code PR, hoặc khi kiểm tra xem app có bị rò rỉ `.env` hay không.

### 5. `04-knowledge/main.mdc` (Phòng Tri Thức)
- **Công dụng:** Zettelkasten Steward. Người quản lý trí nhớ dài hạn. Tự động ghi chép `CHANGELOG.md` và đúc kết "Lessons Learned" từ các lỗi hệ thống nghiêm trọng.
- **Khi nào AI cần đọc:** Sau khi code chạy thành công, hoặc khi dự án vừa vượt qua một bug cực kỳ khó/thay đổi kiến trúc.

### 6. `05-research-rnd/main.mdc` (Phòng R&D & Hành vi ảo)
- **Công dụng:** Hacker tâm lý. Đóng vai các tệp khách hàng ảo để cày xới UI/UX, đánh giá chi phí Model AI mới, và tìm cách nhúng "Viral Loop" vào sản phẩm.
- **Khi nào AI cần đọc:** Khi cần test luồng người dùng (User Flow), phân tích xem nên dùng Claude hay GPT, hoặc làm sao để tăng retention rate.

---
**CÁCH SỬ DỤNG CHO AI:**
Bất cứ AI Tool nào (Cursor, Cline, Windsurf) khi được assign một Task, hãy nhìn vào Index này, chọn **ĐÚNG MỘT PHÒNG BAN** để nhập vai, và load nguyên tắc của phòng ban đó trước khi thực thi. KHÔNG ôm đồm nhiều vai trò cùng lúc!
