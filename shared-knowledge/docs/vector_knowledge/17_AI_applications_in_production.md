# Xây dựng ứng dụng AI trong thực tế

Cho đến nay, chúng ta đã khám phá tất cả các khái niệm quan trọng khi xây dựng các ứng dụng AI.

Phần này của khóa học sẽ tập trung vào những gì cần thiết để xây dựng các ứng dụng AI trong môi trường sản xuất thực tế và một số phương pháp hay nhất.

## 1. Guardrails: Bảo vệ hệ thống AI của bạn

Chúng ta đã giải thích trước đó rằng các ứng dụng AI của bạn có thể dễ bị tấn công bởi AI độc hại, với những thứ như prompt injection hoặc jailbreaking. Người dùng của bạn có thể tiết lộ thông tin riêng tư mà bạn không muốn bị rò rỉ. Lưu ý rằng nhiều API của bên thứ ba (như OpenAI) cung cấp nhiều guardrails có sẵn cho bạn.

### Guardrails đầu vào: Tuyến phòng thủ đầu tiên

Chúng bảo vệ chống rò rỉ thông tin riêng tư cho các API bên ngoài và thực hiện các prompt xấu có thể làm tổn hại hệ thống của bạn. Có nhiều công cụ có thể tự động phát hiện dữ liệu nhạy cảm (do bạn chỉ định) thường sử dụng AI và bạn có thể chặn dữ liệu đó không cho gửi đến mô hình.

**Ví dụ thực tế - Nền tảng chăm sóc sức khỏe:** Một trợ lý AI y tế cần ngăn chặn PHI (Protected Health Information) bị gửi đến các API LLM bên ngoài:

**Triển khai:**
- Xây dựng các mô hình NER (Named Entity Recognition) tùy chỉnh để phát hiện tên bệnh nhân, SSN, số hồ sơ y tế
- Sử dụng các mẫu regex cho dữ liệu có cấu trúc như số điện thoại và địa chỉ
- Thực hiện chặn từ khóa cho tên thuốc và mã chẩn đoán
- Thiết lập quét thời gian thực với yêu cầu độ trễ 50ms

**Quy tắc phát hiện:**
- Số An sinh xã hội: khớp mẫu `\d{3}-\d{2}-\d{4}`
- ID bệnh nhân: Nhận dạng định dạng tùy chỉnh cho số viện cụ thể
- Thuật ngữ y tế: Chặn 2.847 tên thuốc cụ thể và 1.203 mã chẩn đoán
- Mã định danh cá nhân: Tên được đối chiếu với cơ sở dữ liệu bệnh nhân

**Kết quả:** Ngăn chặn 234 vụ rò rỉ PHI trong tháng đầu tiên, giảm rủi ro tuân thủ, cho phép sử dụng AI bên ngoài trong khi vẫn duy trì tuân thủ HIPAA.

**Các danh mục Guardrail đầu vào phổ biến:**
- **Phát hiện PII:** Tên, địa chỉ, số điện thoại, địa chỉ email, SSN
- **Dữ liệu tài chính:** Số thẻ tín dụng, số tài khoản, số định tuyến
- **Bí mật doanh nghiệp:** Tên sản phẩm, số liệu tài chính, kế hoạch chiến lược
- **Prompt Injection:** Các nỗ lực ghi đè hướng dẫn hệ thống
- **Nội dung độc hại:** Các nỗ lực tạo ra nội dung có hại hoặc bất hợp pháp

### Guardrails đầu ra: Kiểm soát chất lượng cho phản hồi AI

Điều này là để bắt những đầu ra không đáp ứng tiêu chuẩn của bạn. Giống như một mô hình trả về thông tin không phù hợp hoặc thậm chí thông tin gây căm thù hoặc bất hợp pháp. Một điều cần lưu ý là guardrails đầu ra có thể không hoạt động tốt ở chế độ hoàn thành streaming.

**Ví dụ thực tế - AI dịch vụ khách hàng:** Một công ty viễn thông đã triển khai lọc đầu ra cho chatbot dịch vụ khách hàng của họ:

**Lọc đa lớp:**
1. **An toàn nội dung:** Sử dụng Azure Content Safety API để phát hiện lời nói thù địch, bạo lực, nội dung tự hại
2. **Tuân thủ thương hiệu:** Thuật toán phân loại tùy chỉnh được đào tạo trên 10.000 ví dụ về phản hồi phù hợp và không phù hợp
3. **Xác thực độ chính xác:** Công cụ kiểm tra trích dẫn RAG để đảm bảo phản hồi dựa trên cơ sở tri thức
4. **Phân tích giọng điệu:** Phân tích cảm xúc để đảm bảo phản hồi duy trì giọng điệu chuyên nghiệp, hữu ích

**Chi tiết triển khai:**
- Xử lý thời gian thực với độ trễ trung bình 80ms
- Ngưỡng độ tin cậy: Chặn phản hồi với điểm độc tính >70%
- Phản hồi dự phòng: Các phản hồi an toàn được viết sẵn khi đầu ra AI bị chặn
- Leo thang con người: Gắn cờ các cuộc trò chuyện mà nhiều phản hồi bị chặn

**Kết quả:**
- Giảm phản hồi không phù hợp 94%
- Sự hài lòng của khách hàng tăng từ 3.2 lên 4.1 (trong số 5)
- Ngăn chặn các sự cố gây tổn hại thương hiệu tiềm ẩn
- Tiết kiệm ước tính 1.2 triệu đô la chi phí quản lý danh tiếng

**Thách thức truyền phát:** Guardrails đầu ra khó triển khai hơn với phản hồi truyền phát vì bạn không thể phân tích toàn bộ phản hồi trước khi gửi. Các giải pháp bao gồm:
- Lọc cấp câu (kiểm tra từng câu khi nó được tạo)
- Phân tích cửa sổ trượt (liên tục phân tích N token cuối cùng)
- Cài đặt bảo thủ (ngưỡng chặn cao hơn cho truyền phát)

## 2. Model Router và Gateway: Quản lý lưu lượng thông minh

### Router: Mô hình phù hợp cho tác vụ phù hợp

Đây là một mẫu phổ biến trong các ứng dụng AI. Thay vì sử dụng một mô hình cho tất cả các truy vấn, bạn sử dụng các mô hình khác nhau. Trong thực tế, và theo kinh nghiệm, hầu hết các ứng dụng AI sử dụng các mô hình khác nhau cho các tác vụ khác nhau. Điều này có thể giúp tiết kiệm chi phí, nơi bạn có thể sử dụng một mô hình ít tốn kém hơn cho các truy vấn đơn giản hơn.

Bộ định tuyến bao gồm logic dự đoán những gì người dùng đang cố gắng làm và dựa trên ý định đó, truy vấn được định tuyến đến mô hình thích hợp (một lần nữa, thường sử dụng AI). Có một số công cụ có sẵn, hoặc bạn có thể xây dựng công cụ của riêng mình bằng một mô hình ngôn ngữ nhỏ.

**Ví dụ thực tế - Nền tảng thương mại điện tử:** Một nhà bán lẻ trực tuyến đã xây dựng một hệ thống định tuyến tinh vi cho các truy vấn của khách hàng:

**Phân loại ý định:**
- **Câu hỏi đơn giản** (43% truy vấn): "Tình trạng đơn hàng của tôi là gì?" → Định tuyến đến mô hình nhanh, rẻ (GPT-3.5)
- **Đề xuất sản phẩm** (31% truy vấn): "Tìm cho tôi một máy tính xách tay để chơi game" → Định tuyến đến hệ thống RAG chuyên biệt
- **Hỗ trợ phức tạp** (18% truy vấn): "Tôi cần trả lại nhưng trang web không cho phép" → Định tuyến đến mô hình cao cấp (GPT-4) + leo thang con người
- **Câu hỏi kỹ thuật** (8% truy vấn): "Làm cách nào để thiết lập bộ định tuyến này?" → Định tuyến đến mô hình tài liệu kỹ thuật

**Triển khai bộ định tuyến:**
- Xây dựng thuật toán phân loại nhẹ sử dụng mô hình 500 tham số (chi phí suy luận: $0.0001 mỗi truy vấn)
- Dữ liệu đào tạo: 50.000 truy vấn khách hàng được gắn nhãn từ phiếu hỗ trợ
- Dự đoán thời gian thực với độ trễ 25ms
- Ngưỡng độ tin cậy: Định tuyến đến mô hình cao cấp nếu độ tin cậy phân loại <85%

**Tác động chi phí:**
- Trước khi định tuyến: Trung bình 0.012 đô la mỗi truy vấn (tất cả các truy vấn đến GPT-4)
- Sau khi định tuyến: Trung bình 0.004 đô la mỗi truy vấn (giảm 67% chi phí)
- Tiết kiệm hàng tháng: 89.000 đô la với chất lượng phản hồi tương tự hoặc tốt hơn
- Sự hài lòng của khách hàng được cải thiện do phản hồi nhanh hơn cho các truy vấn đơn giản

**Chiến lược định tuyến nâng cao:**
- **Định tuyến dựa trên tải:** Định tuyến đến các mô hình khác nhau dựa trên tải API hiện tại
- **Định tuyến theo cấp người dùng:** Khách hàng cao cấp nhận được các mô hình tốt hơn
- **Định tuyến nhận biết ngữ cảnh:** Định tuyến dựa trên lịch sử hội thoại và độ phức tạp
- **Tích hợp thử nghiệm A/B:** Định tuyến phần trăm lưu lượng truy cập đến các mô hình thử nghiệm

### Gateway: Quản lý mô hình hợp nhất

Điều này cho phép bạn kết nối với các mô hình khác nhau một cách an toàn. Đó là một giao diện hợp nhất cho các mô hình khác nhau, giúp duy trì mã của bạn dễ dàng. Bạn thường có thể áp dụng điều tiết ở cấp độ gateway, theo dõi việc sử dụng, v.v.

**Ví dụ thực tế - Công ty dịch vụ tài chính:** Một công ty đầu tư đã xây dựng một gateway mô hình để quản lý 12 mô hình AI khác nhau trong toàn tổ chức của họ:

**Kiến trúc Gateway:**
- **Điểm cuối API đơn lẻ:** Tất cả các ứng dụng kết nối với một URL bất kể mô hình cơ bản
- **Xác thực:** Mã thông báo JWT với quyền truy cập mô hình dựa trên vai trò
- **Giới hạn tốc độ:** Các giới hạn khác nhau cho các cấp người dùng và mô hình khác nhau
- **Trừu tượng hóa mô hình:** Cùng định dạng yêu cầu hoạt động với OpenAI, Anthropic, Google và các mô hình nội bộ

**Các tính năng được triển khai:**
- **Chuyển đổi dự phòng tự động:** Nếu mô hình chính bị lỗi, tự động định tuyến đến bản sao lưu
- **Theo dõi sử dụng:** Theo dõi chi phí của từng phòng ban, người dùng và mô hình
- **Ghi nhật ký yêu cầu:** Lưu trữ tất cả các yêu cầu/phản hồi để kiểm toán và đào tạo
- **Phiên bản mô hình:** Hỗ trợ nhiều phiên bản của cùng một mô hình với các lần ra mắt dần dần

**Tác động kinh doanh:**
- **Năng suất nhà phát triển:** Giảm thời gian tích hợp cho các mô hình mới từ 2 tuần xuống còn 2 giờ
- **Quản lý chi phí:** Tập trung hóa thanh toán và phân tích sử dụng trên tất cả các nhóm
- **Tuân thủ:** Điểm duy nhất để ghi nhật ký kiểm toán và kiểm soát bảo mật
- **Độ tin cậy:** Thời gian hoạt động 99.7% với chuyển đổi dự phòng tự động (so với 94% với các cuộc gọi API trực tiếp)

**Triển khai kỹ thuật:**
```python
# Ví dụ yêu cầu gateway - cùng định dạng bất kể mô hình
POST /gateway/v1/chat/completions
{
    "model": "best-for-finance",  # Gateway giải quyết thành mô hình thực tế
    "messages": [...],
    "user_tier": "premium",       # Ảnh hưởng đến định tuyến và giới hạn tốc độ
    "department": "trading"       # Để theo dõi chi phí
}
```

## 3. Caching: Tối ưu hóa tốc độ và chi phí

Caching không mới trong phát triển phần mềm. Nó đã được sử dụng để giảm độ trễ và chi phí (để tránh truy vấn cơ sở dữ liệu liên tục). Có các kỹ thuật caching khác nhau khi nói đến AI.

### Exact Caching: Khớp chính xác

Chẳng hạn, nếu người dùng yêu cầu mô hình tóm tắt một sản phẩm, hệ thống sẽ kiểm tra bộ nhớ đệm để xem liệu có bản tóm tắt của sản phẩm chính xác này hay không. Điều này được sử dụng để tránh tìm kiếm vector liên tục. Điều này có thể được triển khai bằng cách sử dụng bộ nhớ trong như Redis.

**Ví dụ thực tế - Nền tảng tổng hợp tin tức:** Một trang web tin tức đã triển khai exact caching cho các bản tóm tắt bài báo:

**Triển khai:**
- **Khóa bộ nhớ đệm:** Hàm băm SHA-256 của URL bài báo + tham số độ dài tóm tắt
- **Lưu trữ:** Cụm Redis với TTL 72 giờ (tin tức nhanh chóng trở nên cũ)
- **Kích thước bộ nhớ đệm:** 500GB lưu trữ ~2 triệu bản tóm tắt bài báo
- **Tỷ lệ truy cập:** 67% yêu cầu tóm tắt được phục vụ từ bộ nhớ đệm

**Tác động hiệu suất:**
- **Độ trễ:** Các lượt truy cập bộ nhớ đệm phản hồi trong 15ms so với 2.3 giây để tạo AI
- **Tiết kiệm chi phí:** Tiết kiệm 23.000 đô la/tháng cho các cuộc gọi API LLM
- **Trải nghiệm người dùng:** Tải tức thì cho các bài báo phổ biến
- **Khả năng mở rộng:** Xử lý lưu lượng truy cập tăng 10 lần trong các sự kiện tin tức lớn

**Chiến lược bộ nhớ đệm:**
- Caching chủ động cho các bài báo thịnh hành (cache trước khi người dùng yêu cầu)
- Xóa thông minh: Xóa tóm tắt cho các bài báo có <10 lượt xem
- Phân phối địa lý: Cache các bài báo phổ biến ở nhiều khu vực

### Semantic Caching: Khớp ý định tương tự

Các mục được lưu trữ được sử dụng ngay cả khi chúng tương tự về ngữ nghĩa (không phải truy vấn giống hệt nhau). Điều này đòi hỏi một cơ sở dữ liệu vector để lưu trữ các embedding của các truy vấn đã được lưu trữ, do đó phức tạp hơn và tốn nhiều tính toán. Tốc độ và chi phí có thể không đáng.

**Ví dụ thực tế - Nền tảng nghiên cứu pháp lý:** Một trợ lý AI pháp lý đã triển khai semantic caching cho nghiên cứu luật án lệ:

**Thách thức:** Luật sư thường đặt những câu hỏi tương tự theo những cách khác nhau:
- "Các tiền lệ về vi phạm hợp đồng ở California là gì?"
- "Cho tôi xem luật án lệ California về vi phạm hợp đồng"
- "Tìm các vụ án vi phạm hợp đồng từ các tòa án CA"

**Triển khai:**
- **Lưu trữ Vector:** Cơ sở dữ liệu Pinecone lưu trữ các embedding truy vấn
- **Ngưỡng tương đồng:** Gặp bộ nhớ đệm nếu độ tương đồng cosine >0.85
- **Mô hình Embedding:** text-embedding-ada-002 cho các biểu diễn nhất quán
- **Ghi điểm bộ nhớ đệm:** Trọng số theo mức độ phổ biến và độ mới của truy vấn

**Phân tích hiệu suất:**
- **Tỷ lệ truy cập bộ nhớ đệm:** 34% truy vấn khớp với các truy vấn trước đó tương tự về ngữ nghĩa
- **Chi phí mỗi lượt truy cập:** 0.15 đô la (tra cứu embedding + tìm kiếm vector)
- **Chi phí mỗi lượt bỏ lỡ:** 3.20 đô la (nghiên cứu pháp lý đầy đủ với RAG)
- **Hòa vốn:** Semantic caching có lợi nhuận với tỷ lệ truy cập >4.6%

**Kết quả:**
- Thời gian phản hồi trung bình giảm từ 8.2 giây xuống 1.7 giây cho các lượt truy cập bộ nhớ đệm
- Giảm 31% tổng chi phí tính toán
- Cải thiện trải nghiệm người dùng với kết quả nghiên cứu nhanh hơn
- Thách thức: Hủy bỏ bộ nhớ đệm phức tạp khi các tiền lệ pháp lý thay đổi

**Khi nào Semantic Caching có ý nghĩa:**
- Các hoạt động AI chi phí cao (RAG phức tạp, tài liệu dài)
- Các mẫu người dùng lặp lại (hỗ trợ khách hàng, nghiên cứu)
- Các miền tri thức ổn định (pháp lý, y tế, tài liệu kỹ thuật)

**Khi nào nên tránh Semantic Caching:**
- Các hoạt động AI chi phí thấp (hoàn thành chat đơn giản)
- Nội dung năng động cao (dữ liệu thời gian thực, tin tức nóng hổi)
- Các truy vấn nhạy cảm về quyền riêng tư (mỗi người dùng cần kết quả mới)

## 4. Khả năng quan sát: Giám sát hiệu suất AI

Một lần nữa, khả năng quan sát là một thực tiễn phổ biến trong kỹ thuật phần mềm. Cụ thể đối với AI, đó thường là số lượng token đầu vào và đầu ra cho mỗi yêu cầu, lỗi định dạng (nếu bạn mong đợi đầu ra JSON, hãy theo dõi tần suất mô hình đưa ra JSON không hợp lệ). Đối với các thế hệ mở, hãy xem xét những điều như tính ngắn gọn, sáng tạo hoặc tích cực - nhiều chỉ số này có thể được tính toán bằng cách sử dụng các AI judges.

### Các chỉ số AI cốt lõi

**Ví dụ thực tế - Nền tảng SaaS:** Một công cụ quản lý dự án có các tính năng AI theo dõi các chỉ số toàn diện:

**Chỉ số Token và Chi phí:**
- **Token đầu vào mỗi yêu cầu:** Trung bình 342 token, phân vị thứ 95 là 1.247 token
- **Token đầu ra mỗi yêu cầu:** Trung bình 156 token, tối đa giới hạn ở 500
- **Chi phí mỗi yêu cầu:** Trung bình 0.0034 đô la, có xu hướng giảm 12% hàng tháng
- **Sử dụng mô hình:** GPT-4: 23%, GPT-3.5: 61%, Claude: 16%

**Chỉ số chất lượng:**
- **Tuân thủ định dạng:** 94.3% phản hồi JSON hợp lệ (mục tiêu: >95%)
- **Mức độ liên quan của phản hồi:** AI judge chấm điểm phản hồi từ 1-5, trung bình 4.2
- **Độ chính xác của trích dẫn:** 87% phản hồi RAG bao gồm các trích dẫn hợp lệ
- **Tỷ lệ ảo giác:** 3.1% phản hồi chứa các tuyên bố không có căn cứ

### Các mẫu khả năng quan sát nâng cao

**Phân tích hành vi người dùng:**
- **Độ dài cuộc trò chuyện:** Trung bình 3.4 lượt, 15% người dùng có cuộc trò chuyện >10 lượt
- **Chấm dứt sớm:** 8% người dùng dừng tạo giữa phản hồi (cho thấy chất lượng kém)
- **Tỷ lệ thử lại:** 12% người dùng tạo lại phản hồi (chỉ báo chất lượng)
- **Áp dụng tính năng:** Các tính năng AI được 67% người dùng hoạt động sử dụng

**Giám sát hiệu suất:**
- **Độ trễ đầu cuối:** P50: 1.2 giây, P95: 4.7 giây, P99: 12.3 giây
- **Độ trễ mô hình:** Được theo dõi riêng từ truy xuất RAG và xử lý guardrail
- **Tỷ lệ lỗi:** Lỗi API mô hình (2.1%), lỗi hết thời gian (0.8%), chặn guardrail (1.4%)
- **Tính khả dụng:** Thời gian hoạt động 99.2% trên tất cả các tính năng AI

**Các chỉ số tác động kinh doanh:**
- **Mức độ tương tác của người dùng:** Người dùng AI có tỷ lệ giữ chân cao hơn 34% so với người dùng không phải AI
- **Giảm phiếu hỗ trợ:** Giảm 23% phiếu hỗ trợ từ người dùng có bật AI
- **Sự hài lòng về tính năng:** Điểm NPS là 67 cho các tính năng AI (so với NPS sản phẩm tổng thể là 45)
- **Tác động doanh thu:** Các tính năng AI thúc đẩy chuyển đổi sang gói trả phí cao hơn 18%

### Khả năng quan sát cụ thể cho RAG

**Ví dụ thực tế - Nền tảng quản lý tri thức:** Một công cụ tìm kiếm doanh nghiệp có khả năng RAG:

**Chất lượng truy xuất:**
- **Độ trễ truy xuất:** Tìm kiếm vector: 45ms, xếp hạng lại ngữ nghĩa: 120ms
- **Mức độ liên quan của đoạn:** Người chú thích đánh giá 3 đoạn hàng đầu, điểm liên quan 78%
- **Phân tích phạm vi:** 23% truy vấn yêu cầu thông tin từ nhiều nguồn
- **Độ mới của chỉ mục:** Theo dõi tuổi dữ liệu trong kết quả tìm kiếm (trung bình 4.2 ngày)

**Chất lượng câu trả lời:**
- **Tỷ lệ trích dẫn:** 91% phản hồi bao gồm ít nhất một trích dẫn
- **Độ chính xác của trích dẫn:** 83% trích dẫn thực sự hỗ trợ câu trả lời
- **Tính đầy đủ:** AI judge đánh giá tính đầy đủ của câu trả lời, trung bình 4.1/5
- **Thông tin mâu thuẫn:** Gắn cờ khi các nguồn mâu thuẫn với nhau (7% truy vấn)

### Công cụ và nền tảng triển khai

**Ngăn xếp giám sát:**
- **Chỉ số ứng dụng:** DataDog cho độ trễ, thông lượng, tỷ lệ lỗi
- **Chỉ số cụ thể cho AI:** Weights & Biases để theo dõi hiệu suất mô hình
- **Phân tích người dùng:** Mixpanel cho hành vi người dùng và áp dụng tính năng
- **Theo dõi chi phí:** Bảng điều khiển tùy chỉnh tổng hợp mức sử dụng trên tất cả các nhà cung cấp mô hình

**Cấu hình cảnh báo:**
- **Cảnh báo ngay lập tức:** Tỷ lệ lỗi >5%, độ trễ >10 giây, chặn guardrail >20%
- **Cảnh báo hàng ngày:** Chi phí tăng đột biến >30%, điểm chất lượng giảm >10%
- **Báo cáo hàng tuần:** Xu hướng sử dụng, cơ hội tối ưu hóa chi phí, cải thiện chất lượng

**Thiết kế bảng điều khiển:**
- **Bảng điều khiển điều hành:** Các chỉ số cấp cao, xu hướng chi phí, tác động kinh doanh
- **Bảng điều khiển kỹ thuật:** Các chỉ số kỹ thuật, phân tích lỗi, tối ưu hóa hiệu suất
- **Bảng điều khiển sản phẩm:** Hành vi người dùng, áp dụng tính năng, xu hướng chất lượng

Chìa khóa để quan sát AI thành công là cân bằng các chỉ số kỹ thuật với kết quả kinh doanh. Theo dõi những gì quan trọng đối với trường hợp sử dụng cụ thể của bạn và luôn kết nối hiệu suất AI với sự hài lòng của người dùng và kết quả kinh doanh.