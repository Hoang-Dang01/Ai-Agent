# RAG (Retrieval Augmented Generation)

## Vấn đề RAG giải quyết

Các mô hình AI được đào tạo trên dữ liệu công khai cho đến một ngày cắt cụt cụ thể. Chúng không thể truy cập thông tin ngoài những gì chúng được đào tạo - điều này bao gồm dữ liệu công ty tư nhân của bạn, thông tin gần đây ngoài ngày cắt cụt đào tạo của chúng hoặc bất kỳ kiến thức chuyên biệt nào không có trong tập dữ liệu đào tạo của chúng.

Câu hỏi đặt ra là: làm thế nào chúng ta có thể tận dụng khả năng suy luận của mô hình AI đối với dữ liệu mà nó chưa được đào tạo? Ví dụ, giúp khách hàng tìm sản phẩm trong danh mục của bạn, hoặc suy luận về các tài liệu nội bộ của công ty bạn.

## Cách RAG hoạt động

Chúng ta biến các tài liệu riêng tư này thành các đoạn nhỏ hơn (sẽ nói chi tiết hơn sau), sử dụng mô hình AI embedding để biến các đoạn này thành các vector (một chuỗi số thể hiện sắc thái và ý nghĩa của các đoạn này), chúng ta lưu trữ các đoạn vector này trong một cơ sở dữ liệu vector. Sau đó, khi người dùng đặt câu hỏi về các tài liệu riêng tư này (ví dụ: "Đề xuất cho tôi các sản phẩm để đi bộ đường dài lên đỉnh Everest"), chúng ta biến câu hỏi của người dùng thành các vector (cũng nắm bắt sắc thái và ý nghĩa của câu hỏi), so sánh vector đó với các vector được lưu trữ trong cơ sở dữ liệu vector của chúng ta và sau đó cuối cùng đưa cả câu hỏi của người dùng và vector đoạn được trả về (từ so sánh vector) cho mô hình.

![image](https://github.com/user-attachments/assets/567589c9-4282-4a86-86d5-d9ea098e909f)

**Vì vậy, từ những nguyên lý cơ bản: RAG thực sự là việc xây dựng một hàm, trong đó khi người dùng đặt câu hỏi, chúng ta biến câu hỏi thành các vector, so sánh nó với các vector trong cơ sở dữ liệu vector của chúng ta, sau đó khi chúng ta tìm thấy các vector liên quan, chúng ta thêm nó vào câu hỏi cùng với prompt. Nó đơn giản như vậy.**

## Tại sao Chunking là cần thiết

Lý do dữ liệu được phân đoạn (chunked) là do cửa sổ ngữ cảnh (context window). Có một giới hạn về cửa sổ ngữ cảnh, và nếu dữ liệu vượt quá giới hạn đó, mà trong hầu hết các trường hợp thì nó sẽ vượt quá, thì chúng ta chia nó thành các đoạn (chunks). Tìm kiếm vector cũng hoạt động tốt hơn trên thông tin tập trung. Lưu ý rằng khi chúng ta nói tìm kiếm vector, chúng ta thường có nghĩa là tìm kiếm từ ngữ nghĩa, chứ không phải tìm kiếm từ khóa truyền thống.

## Các loại tìm kiếm: Vector vs. Keyword vs. Hybrid

**Tìm kiếm vector** rất tốt, nhưng có thể bỏ lỡ các từ khóa khớp chính xác (có thể quá thông minh và trả về nội dung liên quan nhưng không khớp chính xác).

**Tìm kiếm từ khóa** rất tốt cho việc khớp từ khóa chính xác. Tất nhiên, nó không thể hiểu các mối quan hệ ngữ nghĩa.

Đây là lý do tại sao **tìm kiếm Hybrid** phổ biến - nó kết hợp cả hai kỹ thuật để có được chất lượng truy xuất tổng thể tốt hơn. Các tài liệu được sắp xếp lại theo điểm số kết hợp, mang lại cho bạn những gì tốt nhất của cả hai thế giới.

Thực tế có các chiến lược chunking để xác định kích thước đoạn phù hợp nhất. Có một sự đánh đổi: nếu quá nhỏ, nó sẽ thiếu ngữ cảnh, nhưng nếu quá lớn, nó sẽ làm loãng thông tin liên quan.

Một số cơ sở dữ liệu vector, như Azure AI Search chẳng hạn, tự động xử lý việc chunking cho chúng ta. Chúng ta sẽ làm điều đó bằng code trong ví dụ này.

## Lập chỉ mục RAG: Nền tảng của chất lượng

Chất lượng của hệ thống RAG của bạn phụ thuộc vào cách bạn lập chỉ mục dữ liệu của mình.

### Lập chỉ mục là gì

Khi bạn có một bộ sưu tập dữ liệu lớn, việc tìm kiếm nó có thể là một thách thức. Cách đơn giản nhất là sử dụng tìm kiếm tuyến tính, nhưng ở quy mô lớn, điều này trở nên quá chậm.

Lập chỉ mục tạo ra một cấu trúc dữ liệu riêng biệt ánh xạ tiêu chí có thể tìm kiếm đến vị trí của dữ liệu. Vì vậy, thay vì quét tất cả dữ liệu, chúng ta quét chỉ mục trước để xác định nơi dữ liệu liên quan được lưu trữ và chỉ truy xuất các phần này.

### Ví dụ thực tế: Công ty Dược phẩm

Ví dụ, một công ty dược phẩm tạo một chỉ mục ánh xạ:

```
"tương tác_thuốc" → [doc_3, doc_127, doc_2891, doc_5643, doc_8901]
"thử_nghiệm_lâm_sàng" → [doc_45, doc_298, doc_3372, doc_7123]
"phản_ứng_bất_lợi" → [doc_12, doc_567, doc_4321, doc_9876]
"dược_động_học" → [doc_78, doc_1456, doc_6789]
```

Sau đó, khi một nhà khoa học tìm kiếm tương tác thuốc, nó kiểm tra chỉ mục và chỉ truy xuất các tài liệu liên quan thay vì tìm kiếm tất cả chúng.

### Ví dụ lập chỉ mục cơ sở dữ liệu

Trong các cơ sở dữ liệu quan hệ, ví dụ, bạn có thể tạo một chỉ mục ánh xạ các giá trị cột (như lương, tên, địa chỉ) đến các vị trí hàng (các giá trị thực tế).

Giả sử bạn có một bảng với 50.000 bản ghi nhân viên:

```sql
CREATE TABLE employees (
    emp_id INT,
    last_name VARCHAR(100),
    department VARCHAR(50),
    hire_date DATE,
    salary DECIMAL(10,2)
);
```

Bạn có thể tạo một chỉ mục trên họ:

```sql
CREATE INDEX idx_last_name ON employees(last_name);
```

Điều này sau đó tạo ra một cấu trúc dữ liệu riêng biệt trông như thế này:

**Cấu trúc chỉ mục (idx_last_name):**
```
"Adams" → Hàng 15.847
"Brown" → Hàng 2.156
"Chen" → Hàng 41.923
"Davis" → Hàng 8.901
"Evans" → Hàng 33.412
... (được sắp xếp theo thứ tự bảng chữ cái)
"Wilson" → Hàng 7.234
"Young" → Hàng 28.567
```

Bây giờ, khi bạn tìm kiếm họ Adams chẳng hạn, bạn có thể truy xuất nó một cách nhanh chóng.

### Ngữ cảnh lập chỉ mục RAG

Trong ngữ cảnh của RAG, giống như trong một cơ sở dữ liệu quan hệ nơi chúng ta sử dụng các chỉ mục để tránh quét mọi hàng, các hệ thống RAG sử dụng chỉ mục cơ sở dữ liệu vector để tránh so sánh truy vấn của bạn với mọi đoạn tài liệu.

Trong các hệ thống RAG, chất lượng lập chỉ mục ảnh hưởng đến việc AI của bạn có tìm thấy thông tin phù hợp để trả lời câu hỏi hay không. Lập chỉ mục kém có nghĩa là AI nhận được ngữ cảnh không liên quan hoặc không đầy đủ, dẫn đến phản hồi sai hoặc vô dụng.

## Lập chỉ mục RAG: 3 lớp quan trọng

### 1. Phân đoạn tài liệu (Document Chunking)

Làm thế nào để bạn thực sự tổ chức dữ liệu. Bạn có thể làm điều đó bằng cách giới hạn ký tự, nhưng điều đó có nghĩa là bạn rất có thể sẽ bỏ lỡ một số ngữ cảnh hoặc thông tin quan trọng. Do đó, tại sao chunking ngữ nghĩa được sử dụng như đã minh họa trước đó. Các bộ chia ngữ nghĩa này sử dụng các mô hình ngôn ngữ.

### 2. Nhúng Vector (Chuyển đổi văn bản thành số)

Nhúng chung chung có thể truy xuất kết quả kém (ví dụ, "IP" trong luật pháp có thể không được hiểu là sở hữu trí tuệ). Nhúng chuyên biệt theo lĩnh vực dẫn đến kết quả tốt hơn, ví dụ như mô hình nhúng được tinh chỉnh trên dữ liệu công ty.

### 3. Lập chỉ mục cơ sở dữ liệu Vector

HNSW là tiêu chuẩn công nghiệp.

## Mức độ liên quan và kiểm soát chất lượng

Một điều cần lưu ý là không phải tất cả các kết quả tìm kiếm đều thực sự liên quan. Bạn cần xác định những gì cấu thành nội dung liên quan.

Có một **ngưỡng liên quan** mà bạn đặt cho các tìm kiếm vector. Nếu bạn đặt nó quá cao (0.0) thì nó có thể bỏ lỡ một số nội dung nhưng nó có giá trị trong các tình huống độ chính xác cao nơi thông tin sai có thể tốn kém. Nếu nó quá thấp, nó có thể bao gồm ngữ cảnh không liên quan làm rối mô hình. Bạn cũng cần một cách để đo lường điều này.

**Sự hài lòng của người dùng:** Người dùng có nhận được thông tin hữu ích không? Các đoạn được truy xuất có thực sự liên quan thường xuyên đến mức nào?

## Những cân nhắc về Production

### Thử thách về Data Pipeline
- Cơ sở kiến thức của bạn thay đổi thường xuyên như thế nào?
- Đảm bảo dữ liệu sạch và chính xác đi vào hệ thống
- Quản lý phiên bản (xử lý cập nhật và xóa tài liệu)

### Quản trị
- Thời gian lưu trữ nhật ký tìm kiếm và truy vấn của người dùng
- Theo dõi ai đã tìm kiếm gì và khi nào