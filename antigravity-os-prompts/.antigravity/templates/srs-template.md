# 📄 MẪU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS - Software Requirements Specification)

> **Bảo trì bởi:** Agent 01 (Product Manager) & Agent 02 (System Architect)
> **Trạng thái:** [DRAFT / REVIEWING / APPROVED]
> **Ngày cập nhật:** [YYYY-MM-DD]

---

## 1. TỔNG QUAN (EXECUTIVE SUMMARY)
- **Vấn đề cốt lõi (Pain-point):** Tính năng này sinh ra để giải quyết nỗi đau gì của người dùng?
- **Mục tiêu kinh doanh (Business Goals):** Đo lường sự thành công bằng chỉ số gì? (Ví dụ: Tăng tốc độ phản hồi RAG lên 20%).
- **Chân dung người dùng (Target Audience):** Ai là người trực tiếp sử dụng tính năng này?

## 2. USER STORIES (CÂU CHUYỆN NGƯỜI DÙNG)
| ID | Là một (As a...) | Tôi muốn (I want to...) | Để (So that...) | Ưu tiên |
|----|------------------|-------------------------|-----------------|---------|
| US01 | Người dùng cuối | Tải file PDF lên hệ thống | Hệ thống có thể RAG dữ liệu này | P1 (Cao) |
| US02 | Quản trị viên | Xem log truy vấn LLM | Kiểm toán được lỗi ảo giác | P2 (Vừa) |

## 3. TIÊU CHUẨN NGHIỆM THU (ACCEPTANCE CRITERIA)
*Yêu cầu định dạng theo Gherkin (Given-When-Then):*
- **Scenario 1: Upload file hợp lệ**
  - **Given:** Người dùng đang ở màn hình Dashboard và có 1 file PDF 5MB.
  - **When:** Kéo thả file vào khu vực Dropzone.
  - **Then:** Hệ thống hiển thị thanh Progress Bar, sau đó bắn Notification "Thành công" và lưu vào VectorDB.

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)
- **Hiệu năng (Performance):** Phản hồi API không được vượt quá 500ms. Luồng RAG (Generate) phải bắt đầu stream token đầu tiên (TTFT) dưới 2s.
- **Bảo mật (Security):** Mọi file upload phải được quét PII (Dữ liệu cá nhân) trước khi đưa vào Chunking.
- **Giao diện (UI/UX):** Bắt buộc sử dụng Vibe Mode (Dark theme, Glassmorphism, Framer Motion transitions).

## 5. PHẠM VI NGOÀI LỀ (OUT OF SCOPE)
*Ghi rõ những gì chúng ta KHÔNG LÀM trong Phase này để tránh Scope Creep.*
- Không hỗ trợ file `.docx` hay hình ảnh `.png` trong đợt release này.
- Không hỗ trợ tính năng chia sẻ thư mục giữa các user.
