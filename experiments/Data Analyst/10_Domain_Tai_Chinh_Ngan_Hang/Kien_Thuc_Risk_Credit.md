# 🏦 Cẩm Nang Risk/Credit Analyst (Tài Chính Ngân Hàng)

Ngành Tài chính/Ngân hàng/Fintech là nơi trả lương cao nhất cho Data Analyst nhưng cũng đòi hỏi nghiệp vụ (Domain Knowledge) cực kỳ khắt khe. 

## 🔑 Các Khái Niệm Cốt Lõi
1. **NPL (Non-Performing Loan - Nợ xấu):** Các khoản vay đã quá hạn trả nợ thường từ 90 ngày trở lên. Tỷ lệ NPL càng cao, ngân hàng càng rủi ro.
2. **DPD (Days Past Due - Số ngày quá hạn):** Khoản vay đã quá hạn thanh toán bao nhiêu ngày. (Ví dụ: DPD30+ là nợ quá hạn 30 ngày).
3. **Write-off (Xóa nợ):** Ngân hàng xác định khoản nợ không thể thu hồi được nữa và phải xóa sổ khỏi bảng cân đối kế toán.

## 🎯 Credit Scorecard (Thẻ Điểm Tín Dụng)
Đây là công cụ quan trọng nhất để quyết định xem có cho một khách hàng vay tiền hay không (Duyệt tự động hoặc Bán tự động).
- **Cách hoạt động:** Gán điểm số cho từng tiêu chí của khách hàng (Tuổi, thu nhập, lịch sử trả nợ CIC, nghề nghiệp). Tổng điểm càng cao, rủi ro vỡ nợ càng thấp -> Lãi suất cho vay thấp hoặc hạn mức thẻ tín dụng cao.
- **Kỹ thuật xây dựng:** Thường sử dụng thuật toán Hồi quy Logistic (Logistic Regression) để tính xác suất vỡ nợ (Probability of Default - PD), kết hợp với kỹ thuật Weight of Evidence (WOE) và Information Value (IV).
- **Phân loại thẻ điểm:** 
  - Application Scorecard (A-Score): Chấm điểm lúc mới nộp hồ sơ xin vay.
  - Behavioral Scorecard (B-Score): Chấm điểm hành vi của khách hàng hiện tại để mời chào vay thêm hoặc tăng/giảm hạn mức.
  - Collection Scorecard (C-Score): Chấm điểm mức độ hợp tác để đưa cho bộ phận thu hồi nợ.

## ⏳ Phân Tích Vintage (Vintage Analysis)
Giống như rượu vang được đánh giá theo năm thu hoạch (Vintage), phân tích khoản vay cũng đánh giá chất lượng hồ sơ theo **tháng giải ngân**.
- Mục đích: Trả lời câu hỏi *"Chất lượng khoản vay giải ngân tháng này có tốt hơn tháng trước không?"*. 
- Cách xem biểu đồ: Thông thường, các tháng sẽ được vẽ thành các đường cong trên đồ thị (X: Số tháng sau giải ngân, Y: Tỷ lệ nợ xấu). Nếu đường cong của đợt giải ngân gần đây dốc lên quá nhanh, có nghĩa là chính sách duyệt vay đang gặp lỗ hổng lớn.

## 📉 Value at Risk (VaR)
- Dùng trong đầu tư chứng khoán hoặc quản trị rủi ro danh mục.
- Trả lời câu hỏi: *"Trong trường hợp tồi tệ nhất, tôi có thể mất tối đa bao nhiêu tiền với xác suất 95%?"*.
