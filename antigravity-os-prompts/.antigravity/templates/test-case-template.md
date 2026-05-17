# 🧪 KỊCH BẢN KIỂM THỬ (TEST CASE AUTOMATION)

> **Soạn thảo bởi:** Agent 06 (QA & Test Engineer)
> **Component/Module:** [Tên Module, VD: DataFlowVisualizer]
> **Loại Test:** [Unit Test / Integration Test / E2E Test]

---

## 1. THÔNG TIN CHUNG
- **Mã Test Case:** `TC-001`
- **Tên Test Case:** Xác thực luồng RAG khi Redis Cache bị Miss.
- **Tiền điều kiện (Pre-requisites):** 
  - Server Backend đang chạy ở `localhost:8000`.
  - Redis Server đang bật nhưng rỗng (Đã flushall).
  - User đã đăng nhập với role `User`.

## 2. KỊCH BẢN THỰC THI (TEST STEPS)
| Bước | Hành động (Action) | Dữ liệu kiểm thử (Test Data) | Kết quả mong đợi (Expected Result) |
|------|--------------------|------------------------------|------------------------------------|
| 1 | Mở trang Model Lab | URL: `/model-lab` | Component `DataFlowVisualizer` render không lỗi. |
| 2 | Bấm nút "Run Deep Simulation" | N/A | Trạng thái `step` chuyển từ 0 sang 1. |
| 3 | Kiểm tra Console Log | Hook vào biến `logs` | Phải xuất hiện chuỗi: `[2. SEMANTIC CACHE] Cache Miss`. |
| 4 | Chờ 18 giây để flow hoàn tất | N/A | Trạng thái `step` đạt giá trị 12, hiện nút "Reset Flow". |

## 3. EDGE CASES (TRƯỜNG HỢP CỰC ĐOAN)
*(Bắt buộc phải test những kịch bản này để đánh sập code của Dev)*
- [ ] **Mất kết nối mạng (Offline):** Ngắt mạng giữa chừng (Step 6), hệ thống có văng lỗi 500 hay hiện Toast notification báo lỗi Gracefully?
- [ ] **Spam Click:** User bấm nút "Run" liên tục 10 lần. Hàm `runSimulation()` có bị Race Condition không? (Kỳ vọng: Nút Run bị Disable ngay sau click đầu tiên).
- [ ] **Dữ liệu RAG rỗng:** VectorDB không tìm thấy Chunk nào. LLM có xin lỗi đàng hoàng hay tự bịa ra câu trả lời (Hallucinate)?

## 4. KẾT QUẢ THỰC TẾ (TEST EXECUTION LOG)
- **Ngày chạy:** [YYYY-MM-DD]
- **Người/Agent chạy:** Agent 06
- **Trạng thái:** 🟢 PASS / 🔴 FAIL
- **Bug ID (Nếu Fail):** `#BUG-042` (Chuyển cho Agent 05 xử lý).
