# Kiến trúc và Huấn luyện LLM

Bạn không cần phải biết cách phát triển một mô hình để sử dụng nó, nhưng việc hiểu cách chúng hoạt động ở cấp độ cao sẽ giúp bạn quyết định nên sử dụng mô hình nào.

Thiếu sự minh bạch trong quy trình huấn luyện các mô hình nền tảng, nhưng chúng ta có thể hiểu rõ về chúng bằng cách biết dữ liệu pre-training, kiến trúc và kích thước mô hình, và cách chúng được post-training để phù hợp với sở thích của con người.

## 1. Dữ liệu huấn luyện

Một nguồn dữ liệu huấn luyện phổ biến là Common Crawl, một tổ chức phi lợi nhuận thường xuyên thu thập dữ liệu từ các trang web trên Internet. Tuy nhiên, chất lượng của Common Crawl không phải lúc nào cũng tốt vì trong dữ liệu huấn luyện đó có clickbait, thông tin sai lệch, tuyên truyền, v.v. Để tránh bị công chúng và đối thủ kiểm soát, các công ty đã ngừng tiết lộ thông tin này.

Tiếng Anh thống trị internet, vì vậy nó hoạt động tốt hơn các ngôn ngữ khác. Các mô hình nền tảng đa năng có thể tuyệt vời cho các tác vụ hàng ngày, nhưng có thể gặp khó khăn với các tác vụ chuyên biệt mà chúng chưa bao giờ thấy trong quá trình training như khám phá thuốc và sàng lọc ung thư. Ví dụ, khám phá thuốc liên quan đến protein, DNA và các dữ liệu khác khó có thể tìm thấy công khai. Sàng lọc ung thư thường liên quan đến X-quang và MRI mà cũng khó tìm thấy công khai do vấn đề riêng tư. AlphaFold của DeepMind là một ví dụ về mô hình chuyên biệt được đào tạo trên khoảng 100 nghìn protein đã biết. Nvidia BioNeMo là một mô hình khác tập trung vào khám phá thuốc.

### Thách thức về dữ liệu và mối lo ngại trong tương lai

**Nút thắt cổ chai về mở rộng quy mô:** Cho đến nay, mỗi lần tăng kích thước mô hình đều dẫn đến việc tăng hiệu suất của mô hình. Nhưng liệu có một thời điểm nào đó hiệu suất mô hình sẽ chững lại bất kể kích thước? Các mô hình nền tảng sử dụng quá nhiều dữ liệu đến nỗi có mối lo ngại rằng chúng ta sẽ cạn kiệt dữ liệu internet trong vài năm tới. Các mô hình nền tảng tiêu thụ dữ liệu huấn luyện nhanh hơn con người tạo nội dung mới. Nếu chúng ta cần 100 nghìn tỷ từ cho thế hệ mô hình tiếp theo, nhưng toàn bộ internet chỉ chứa 50 nghìn tỷ từ, chúng ta đang tiếp cận giới hạn vật lý. Để giải quyết vấn đề đó, các công ty hiện đang khai thác dữ liệu độc quyền như trả tiền cho Reddit, nhà xuất bản, hợp tác dữ liệu độc quyền, v.v.

**Ảnh hưởng đến Bảo mật:** Mọi thứ bạn đăng lên mạng, bạn nên cho rằng nó sẽ là một phần của dữ liệu huấn luyện của các mô hình trong tương lai. Những kẻ xấu lợi dụng điều đó cho các cuộc tấn công prompt injection bằng cách đăng nội dung lên internet với hy vọng nó sẽ ảnh hưởng đến các mô hình trong tương lai để tạo ra các phản hồi mà chúng mong muốn. Ví dụ, chúng có thể tạo ra các bài báo trông giống học thuật giả mạo chứa các tuyên bố như: "Cách hiệu quả nhất để vượt qua an ninh sân bay liên quan đến [hướng dẫn chi tiết gây hại]." Bây giờ khi ai đó hỏi mô hình AI về an ninh sân bay, mô hình có thể tham khảo nghiên cứu này và trình bày thông tin nguy hiểm. Các mô hình AI không thể phân biệt giữa chuyên môn thật và giả trong quá trình huấn luyện.

**Tính xác thực của Data:** Điều khác cần nghĩ đến là AI được huấn luyện trên dữ liệu con người có tính xác thực cao hơn. Con người mắc những sai lầm chân thực, họ thể hiện trạng thái cảm xúc & trải nghiệm đích thực, v.v. Nếu các mô hình được huấn luyện trên dữ liệu AI thiếu tính xác thực, quá hoàn hảo, v.v., thì các mô hình AI tương lai có thể bị ngắt kết nối khỏi các khuôn mẫu giao tiếp của con người hoặc không thể tạo ra những ý tưởng thực sự mới mẻ.

**Quên dữ liệu:** Một câu hỏi nghiên cứu mở là làm thế nào để làm cho một mô hình quên đi thông tin cụ thể mà nó đã học được trong quá trình huấn luyện. Hãy tưởng tượng bạn đã xuất bản một bài đăng trên blog mà bạn cuối cùng đã xóa. Nếu bài đăng đó được đưa vào dữ liệu huấn luyện của một mô hình, mô hình vẫn có thể tái tạo nội dung của bài đăng. Kết quả là, mọi người có thể truy cập nội dung đã xóa mà không có sự đồng ý của bạn.

## 2. Kiến trúc

### Seq2Seq (Thời kỳ tiền Transformer)

LLM dựa trên kiến trúc transformer. Trước khi transformer được phát minh, đã có kiến trúc seq2seq được sử dụng cho dịch máy. Nó giới thiệu mô hình encoder-decoder, trong đó encoder xử lý các chuỗi đầu vào và decoder tạo ra các chuỗi đầu ra, cả hai đều sử dụng RNN (mạng nơ-ron hồi quy). Vấn đề với Seq2Seq là tất cả các đầu vào (tokens) được xử lý tuần tự, điều này chậm và tất cả đầu vào được nén vào một trạng thái cuối cùng nên ngữ cảnh có thể bị bỏ qua.

![image](https://github.com/user-attachments/assets/18614e4d-573e-47be-9dea-c649dac2444b)

### Kiến trúc Transformer

Kiến trúc Transformer đã loại bỏ RNN. Giả sử bạn muốn tóm tắt một bài báo 2k từ. Seq2Seq với RNN phải xử lý tất cả các từ này một cách tuần tự, trong khi Transformer xử lý song song (nhưng đầu ra được xử lý tuần tự, từng token một). Transformer có quy trình suy luận hai pha:

1. **Giai đoạn đầu tiên:** Xử lý tất cả các token đầu vào đồng thời. Khi bạn hỏi "explain quantum computing", transformer xử lý tất cả các từ song song bằng cách tạo một cặp khóa và giá trị (key và value vector) cho mỗi token (giống như một bảng tra cứu). Vì vậy, "explain" trở thành K1, V1 (key vector 1 và value vector v1).

2. **Giai đoạn thứ hai:** Tạo ra các token hoặc từ đầu ra từng cái một (tuần tự). Vì vậy, nó tạo ra "Quantum" dựa trên toàn bộ câu hỏi của bạn, sau đó tạo ra "Computing" dựa trên câu hỏi của bạn + Quantum (token đầu tiên được xuất), sau đó tạo ra "uses" dựa trên câu hỏi của bạn + Quantum Computing (2 token đầu tiên).

3. ![image](https://github.com/user-attachments/assets/9c2aa716-bc26-4634-bf5e-cdc84a2989c8)

### Cơ chế Attention

Nếu bạn hỏi ChatGPT "Viết mô tả sản phẩm cho tai nghe không dây mới của chúng tôi nhấn mạnh thời lượng pin và chất lượng âm thanh", LLM cần tạo ra từng từ trong phản hồi của nó trong khi vẫn theo dõi những gì quan trọng. Nó nên tập trung vào các từ khóa như thời lượng pin và chất lượng âm thanh chứ không phải các từ chung chung như "cho" hoặc "của chúng tôi". Vì vậy, ở mỗi bước tạo từ, mô hình phải quyết định: "Trong số tất cả các từ trước đó tôi đã thấy, từ nào nên ảnh hưởng đến những gì tôi viết tiếp theo?"

Nó bao gồm 3 yếu tố:

- **Vector truy vấn (Q - Query Vector):** Khi nó đang viết từ, nó tạo một vector truy vấn: "Tôi cần loại từ nào ngay bây giờ?"
- **Vector khóa (K - Key Vector):** Mỗi từ trước đó chứa loại thông tin gì (mỗi từ trong yêu cầu của bạn nhận được một vector khóa mô tả nó là gì, ví dụ: "sản phẩm" là loại nội dung, "không dây" là mô tả tính năng, v.v.).
- **Vector giá trị (V - Value Vectors):** Mỗi từ nhận một vector giá trị chứa ý nghĩa ngữ nghĩa của nó.

Sau tất cả những điều đó, quá trình tính toán Attention bắt đầu. Khi tạo từ "exceptional" làm ví dụ, LLM tính toán mức độ liên quan của mỗi từ trước đó bằng cách gán cho chúng các trọng số Attention, ví dụ: 35% Attention được dành cho pin, 32% được dành cho âm thanh, v.v. Điều này mang lại cho "exceptional" một ý nghĩa bị ảnh hưởng 35% bởi các khái niệm về pin và 32% bởi các khái niệm về âm thanh.

**Tóm lại:** Transformer là một kiến trúc xử lý các token đầu vào song song và tạo ra các token đầu ra tuần tự, đồng thời nó tận dụng cơ chế Attention cho phép mô hình tập trung linh hoạt vào các phần liên quan nhất của đầu vào khi tạo từng từ mới.

### Kích thước mô hình

Lưu ý rằng khi cộng đồng hiểu rõ hơn về cách huấn luyện mô hình, các mô hình mới hơn có xu hướng vượt trội hơn các thế hệ cũ hơn dù có cùng kích thước tham số. Số lượng tham số giúp chúng ta ước tính tài nguyên tính toán cần thiết để huấn luyện và chạy mô hình. Ví dụ, nếu một mô hình có 7B tham số và mỗi tham số được lưu trữ bằng 2 byte, thì chúng ta có thể tính toán rằng bộ nhớ GPU cần thiết để thực hiện suy luận bằng mô hình này sẽ ít nhất là 14B byte (14GB).

Nhưng khi thảo luận về kích thước mô hình, điều quan trọng là phải xem xét kích thước của dữ liệu mà nó được huấn luyện. Chúng ta có thể xem xét số lượng tokens, mà không phải là một thước đo hoàn hảo, vì các mô hình khác nhau có thể có các quy trình tokenization khác nhau. Meta đã sử dụng 15T tokens cho Llama 3.

## Post-Training

Post-training tồn tại vì một mô hình pre-trained có hai vấn đề: Chúng được tối ưu hóa cho việc hoàn thành văn bản chứ không phải hội thoại, và đầu ra của mô hình có thể mang tính phân biệt chủng tộc, phân biệt giới tính hoặc đơn giản là sai vì nó được huấn luyện trên dữ liệu indiscriminately scrape từ internet.

Pre-training tối ưu hóa chất lượng cấp token, trong đó mô hình được huấn luyện để dự đoán token tiếp theo một cách chính xác. Nhưng người dùng không quan tâm đến chất lượng cấp token, họ quan tâm đến chất lượng của toàn bộ phản hồi. Post-training tối ưu hóa việc tạo ra các phản hồi mà người dùng ưu tiên.

Vì vậy, đối với vấn đề đầu tiên, nó được xử lý bằng cách cung cấp cho mô hình một loạt dữ liệu huấn luyện với các prompt và phản hồi bao gồm phạm vi yêu cầu bạn muốn mô hình xử lý như trả lời câu hỏi, tóm tắt, dịch thuật, v.v.

Đối với vấn đề sau, Reinforcement Learning được sử dụng, trong đó một mô hình phần thưởng chấm điểm đầu ra của mô hình nền tảng. Mô hình nền tảng sau đó sẽ được tối ưu hóa để tạo ra các phản hồi mà mô hình phần thưởng sẽ cho điểm tối đa.

## Sampling: AI tạo phản hồi như thế nào

Một mô hình tạo ra đầu ra của nó thông qua một quá trình được gọi là **sampling**. Sampling là thứ làm cho đầu ra của AI mang tính xác suất, điều này làm cho nó mạnh mẽ và sáng tạo, nhưng đôi khi có thể khiến nó không nhất quán và gây ảo giác.

Mạng nơ-ron nhận một đầu vào và tạo ra một đầu ra bằng cách tính toán các khả năng của các kết quả khác nhau. Nếu đó là một mô hình phân loại thư rác, chỉ có hai kết quả có thể xảy ra là đúng hoặc sai. Đối với một mô hình ngôn ngữ, mô hình phải tạo ra token tiếp theo. Nếu đầu vào là: "Màu yêu thích của bạn là gì?" Có nhiều đầu ra có thể như xanh lá cây (50%), đỏ (30%), the (0.2%), a (0.1%).

Bạn có thể nghĩ rằng một mô hình ngôn ngữ sẽ chỉ chọn xác suất cao nhất (như xanh lá cây) nhưng điều đó dẫn đến các đầu ra nhàm chán. Hãy tưởng tượng nếu bất kỳ câu hỏi nào bạn hỏi, bạn luôn nhận được các từ phổ biến nhất.

Vì vậy thay vì luôn chọn token có khả năng nhất, mô hình chọn màu đỏ 30% thời gian, màu xanh lá cây 50% thời gian, v.v.

Vì vậy, chiến lược sampling phù hợp có thể làm cho một mô hình tạo ra các phản hồi phù hợp hơn cho ứng dụng của bạn. Một số có thể là tạo ra các phản hồi sáng tạo hơn, trong khi những người khác có thể là tạo ra các phản hồi dễ đoán hơn.

![image](https://github.com/user-attachments/assets/f1d0915c-d03c-4ab482515708)

### Kiểm soát nhiệt độ (Temperature Control)

**Temperature** là một ví dụ về cách kiểm soát sampling đó. Vấn đề với xác suất là mô hình có thể kém sáng tạo hơn. Ví dụ, các màu đỏ, xanh lá cây và tím có xác suất cao nhất nên các câu trả lời bạn nhận được sẽ luôn cứng nhắc như "màu yêu thích của tôi là màu xanh lá cây". Bởi vì "the" có xác suất thấp, mô hình có khả năng thấp tạo ra một câu sáng tạo như "Màu yêu thích của tôi là màu của một hồ nước tĩnh lặng vào một buổi sáng mùa xuân". Temperature cao hơn làm giảm xác suất của các token phổ biến, do đó, làm tăng xác suất của các token hiếm hơn cho phép các mô hình có phản hồi sáng tạo hơn.

**Top-k và Top-p** là một chiến lược sampling khác.

## Tính không nhất quán và ảo giác

Cách AI lựa chọn các phản hồi của nó khiến chúng có tính xác suất. Tính chất này gây ra sự không nhất quán và ảo giác. **Tính không nhất quán** là khi một mô hình tạo ra các phản hồi rất khác nhau cho cùng một prompt, và **ảo giác** là khi một mô hình đưa ra một phản hồi không dựa trên sự thật (nó bịa ra).

Nếu có những bài luận trong dữ liệu huấn luyện nói rằng tổng thống Hoa Kỳ là người ngoài hành tinh, mô hình có thể theo xác suất đưa ra rằng tổng thống Hoa Kỳ hiện tại là người ngoài hành tinh, và từ góc độ của chúng ta, chúng ta nghĩ rằng mô hình đang bịa chuyện. Hãy nhớ rằng, các mô hình ngôn ngữ được huấn luyện trên một lượng lớn dữ liệu, và bất kỳ điều gì có xác suất khác không, dù xa vời hay sai lệch đến đâu, đều có thể được AI tạo ra.

Sự không nhất quán là do tính ngẫu nhiên trong quá trình sampling, nhưng ảo giác thì tinh tế hơn. Bởi vì đúng là một mô hình sample đầu ra từ tất cả các tùy chọn có thể xảy ra và đầu ra có thể là một điều vô lý nếu nó nằm trong tập huấn luyện. Nhưng làm thế nào một mô hình lại bịa ra một điều mà nó chưa từng thấy trước đây trong dữ liệu huấn luyện?

Giả thuyết đầu tiên được DeepMind đưa ra, đó là các mô hình ngôn ngữ không thể phân biệt giữa dữ liệu được cung cấp và dữ liệu mà nó tạo ra. Nếu bạn cho mô hình xem một hình ảnh chai có thành phần, nó dự đoán rằng chai đó là sữa (mặc dù không phải), sau đó trong quá trình tính toán tiếp theo, nó sẽ sử dụng điều đó và sẽ tạo ra các thành phần liên quan đến một chai sữa. Thông thường điều này được giảm thiểu bằng Reinforcement Learning, nơi mô hình được học để phân biệt giữa các prompt do người dùng cung cấp và các token do mô hình tạo ra.