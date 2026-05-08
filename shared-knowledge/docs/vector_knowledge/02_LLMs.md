# LLM hoạt động như thế nào

Chúng ta sẽ đi sâu vào khía cạnh kỹ thuật hơn, nhưng vẫn theo tinh thần bám sát các nguyên tắc cơ bản.

## Cơ chế cốt lõi: Dự đoán từ tiếp theo

Tất cả chúng ta đều đã sử dụng các công cụ như ChatGPT – vậy thực sự chúng hoạt động như thế nào đằng sau hậu trường? Một LLM nhận một chuỗi văn bản đầu vào như "Con mèo ngồi trên" và theo nghĩa đen là dự đoán từ tiếp theo là gì. Nó dự đoán rằng "cái" có 70% khả năng, "một" có 20% khả năng, "của tôi" có 10% khả năng, vì vậy nó chọn "cái". Nó trở thành "con mèo ngồi trên cái". Sau đó, nó dự đoán từ tiếp theo, từ "chiếu" là khả năng cao nhất. Mỗi từ mới được dựa trên tất cả các từ trước đó, giống như một công cụ tự động hoàn thành tinh vi.

![image](https://github.com/user-attachments/assets/9331a11c-f988-4099-bb76-ecc77fd835c4)

Vì vậy, nếu bạn hỏi ChatGPT, "Thủ đô của Pháp là gì?", nó sẽ xem xét chuỗi từ "thủ" "đô" "của" "Pháp" sau đó dự đoán "là" là từ hợp lý tiếp theo, sau đó là "Paris". Mô hình này theo nghĩa đen chỉ đơn thuần là dự đoán các từ tiếp theo có khả năng dựa trên các mẫu mà nó đã học. Nó làm điều này tốt vì nó được đào tạo trên lượng lớn văn bản.

Bạn có thể nói, "OK, tôi hiểu rằng khi tôi hỏi ChatGPT một câu hỏi, nó sẽ lấy Prompt hoặc câu hỏi của tôi, là một chuỗi từ, và dự đoán các từ tiếp theo là gì. Làm thế nào nó tạo ra văn bản, như viết một bài luận, khi tôi yêu cầu nó?"

**Tạo văn bản chỉ là dự đoán từ lặp đi lặp lại.** Nếu bạn hỏi mô hình: "Viết một bài luận về mèo", nó sẽ nhìn vào Prompt "viết một bài luận về mèo" sau đó nó dự đoán từ có khả năng nhất là "mèo" sau đó là "thì" sau đó là "hấp dẫn" và cứ như vậy từng từ một. Nó theo nghĩa đen là nghĩ từng từ một và chọn từ thích hợp nhất mỗi lần.

## Nền tảng toán học

Với giá nhà, f(x) = wx + b, chúng ta tìm các giá trị w và b hoạt động tốt nhất (tham số). Với các mô hình ngôn ngữ, mỗi từ trở thành một danh sách các số như [0.2, -0.5, 0.8], và các số này, cho mỗi từ, được gọi là **embeddings**. Mỗi từ được biểu diễn bằng một chuỗi các số nắm bắt ý nghĩa, cảm xúc, v.v.

Vì vậy "mèo" trở thành [0.2, -0.5, 0.8], "ngồi" trở thành [0.3, 0.6, -0.2]. Hay, mỗi từ được biểu diễn bằng một chuỗi các số nắm bắt các đặc điểm khác nhau của từ đó. Mô hình LLM nhận các số này (embeddings) làm đầu vào, sử dụng một hàm toán học phức tạp (dựa trên Neural Network) với hàng tỷ tham số và đầu ra là một dự đoán từ tiếp theo.

Các tham số hoặc biến trong một hàm toán học này nắm bắt rất nhiều thứ như quy tắc ngữ pháp, chuỗi từ nào có ý nghĩa, cách kết hợp các từ. Đây là lý do tại sao khi bạn đưa một câu vào mô hình, mô hình có hàng tỷ tham số có thể dự đoán từ tiếp theo là gì.

## Quy trình đào tạo: Tự giám sát

Hàng tỷ tham số trong hàm này là những gì được điều chỉnh trong quá trình đào tạo để đưa ra các dự đoán từ tốt hơn. Vì vậy, bạn cung cấp cho mô hình rất nhiều văn bản, bạn bắt đầu với các giá trị tham số ngẫu nhiên, mô hình đưa ra dự đoán, điều chỉnh tham số để cải thiện dự đoán.

Điều xảy ra trên thực tế: bạn thực sự đào tạo mô hình trên hàng triệu câu hoặc ví dụ văn bản. Bắt đầu với: "Con mèo ngồi trên chiếu", chúng ta cho mô hình thấy "Con mèo ngồi trên", chúng ta biết câu trả lời đúng là "Con mèo ngồi trên chiếu" và chúng ta điều chỉnh các tham số cho đến khi nó dự đoán từ "chiếu". Nếu nó dự đoán từ "hộp", điều đó sai, vì vậy chúng ta tiếp tục điều chỉnh các tham số. Sau đó, chúng ta chuyển sang câu tiếp theo "Paris thủ đô", chúng ta thay đổi giá trị tham số cho đến khi nó đưa ra từ "của" làm dự đoán tiếp theo.

### Tự giám sát: Tại sao điều này mang tính cách mạng

Machine Learning có giám sát (các thuật toán ML được đào tạo bằng dữ liệu đã được gán nhãn) rất tốn kém — nếu phải mất 5 xu để một người gán nhãn một hình ảnh, thì sẽ tốn 50 nghìn để gán nhãn một triệu hình ảnh — và thường không thể mở rộng. Các mô hình ngôn ngữ sử dụng **tự giám sát**. Giả sử bạn đào tạo mô hình với câu "Con mèo ngồi trên chiếu", mô hình thấy "Con mèo ngồi trên" và dự đoán "chiếu", do đó bản thân câu gốc cung cấp câu trả lời đúng. Vì vậy, không cần gán nhãn thủ công.

Vì vậy, Self-supervised Learning có nghĩa là các mô hình ngôn ngữ có thể học từ các chuỗi văn bản mà không yêu cầu bất kỳ việc gán nhãn nào. Vì các chuỗi văn bản có ở khắp mọi nơi (sách, bài blog, bài báo, v.v.), có một lượng lớn dữ liệu đào tạo cho phép các mô hình mở rộng quy mô để trở thành LLM.

Hãy nghĩ xem chúng ta có bao nhiêu câu – đây là lý do tại sao việc đào tạo rất nghiêm ngặt. Hàng tỷ tham số cần điều chỉnh, hàng triệu ví dụ để học hỏi, mất hàng tuần hoặc hàng tháng để đào tạo. Khi chúng ta tìm thấy các tham số có thể nắm bắt các mẫu từ tất cả các ví dụ, chúng ta tự tin rằng mô hình có thể dự đoán các từ tiếp theo có khả năng.

Một khi chúng ta tìm thấy các giá trị cho các tham số này, chúng ta ổn – chúng ta có thể nhập bất kỳ từ nào và chúng ta có thể dễ dàng dự đoán từ tiếp theo.

## Token

Các từ được chuyển đổi thành số này được gọi là **Token**. Bất cứ khi nào bạn sử dụng LLM được cung cấp bởi các công ty khác, bạn đang trả tiền theo Token.

![image](https://github.com/user-attachments/assets/7a7bd7e9-4134-4480-a22c-a71cc3872277)

## Kiến trúc Transformer

Năm 2017, Google đã công bố một bài báo có tên "Attention is All You Need". Kiến trúc Transformer đã được phát minh trong bài báo này. Bản thân các nhà phát minh không nhận ra bước đột phá mà họ đã tạo ra. Năm 2018, GPT-1 được phát hành, sau đó là GPT-2 vào năm 2019, GPT-3 vào năm 2020, và sau đó vào năm 2022 ChatGPT được phát hành tận dụng GPT-3 kết hợp với Reinforcement Learning từ Human Feedback.

Mô hình GPT đầu tiên của OpenAI có 117 triệu tham số, hiện tại là hàng nghìn tỷ.

## Tại sao Large Language Models có mục đích chung

Các mô hình ngôn ngữ, nhờ quy mô của chúng, có khả năng thực hiện nhiều tác vụ. Các mô hình trước đây chỉ dành riêng cho các tác vụ cụ thể như phân tích sắc thái hoặc dịch thuật (các mô hình ngôn ngữ có thể làm cả hai). Nếu bạn là nhà bán lẻ và muốn tạo mô tả sản phẩm, bạn có thể sử dụng một mô hình tạo ra các mô tả chính xác nhưng có thể không nắm bắt được giọng điệu hoặc thông điệp của thương hiệu. Với các mô hình ngôn ngữ, bạn có thể tạo các hướng dẫn chi tiết với các ví dụ về mô tả sản phẩm mong muốn, bạn có thể Grounding nó vào dữ liệu cụ thể hoặc thậm chí Fine-tuning nó.