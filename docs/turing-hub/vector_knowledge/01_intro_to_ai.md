# Giới thiệu về AI

## AI là gì?

Đôi khi, khi chúng ta nghe một từ quá nhiều lần, chúng ta không đặt câu hỏi về ý nghĩa thực sự của nó. AI là gì? Để giải thích điều đó, hãy quay ngược lại lịch sử.

Trong quá khứ, để máy tính thực hiện điều gì đó — hiển thị một bài đăng trên Instagram, cho phép chúng ta mua sản phẩm trên Amazon, tính thuế của chúng ta — chúng ta phải lập trình máy tính bằng cách cung cấp cho nó các hướng dẫn rõ ràng. Vì vậy, chúng ta với tư cách là con người đã lập trình ứng dụng từng bước để giải quyết những vấn đề này. Điều đó có nghĩa là, chúng ta đã giải quyết vấn đề trước tiên với tư cách là con người, và sau đó đưa những hướng dẫn này cho máy tính.

Với AI, thay vì chúng ta giải quyết vấn đề trước tiên, chúng ta dạy máy móc giải quyết vấn đề bằng cách cung cấp cho nó nhiều ví dụ hoặc dữ liệu khác nhau.

Một ví dụ rất cơ bản mà tôi luôn đưa ra: giả sử chúng ta có một ứng dụng dự đoán giá nhà dựa trên diện tích. Chúng ta có thể tự viết logic đó, ví dụ giá nhà luôn bằng diện tích nhân 3. Nhưng nếu thay vì chúng ta viết công thức, chúng ta cho máy tính xem hàng triệu ví dụ hoặc điểm dữ liệu về giá nhà và diện tích thì sao? Máy tính sẽ từ tất cả các điểm dữ liệu này tìm ra, "Ồ, thực ra không chỉ là diện tích nhân 3, có thể là diện tích nhân 1.5." Ngay cả khi bạn cho tôi với tư cách là con người xem hàng triệu ví dụ về giá nhà và diện tích, tôi sẽ đưa ra một công thức tốt hơn là chỉ đoán rằng giá nhà bằng diện tích nhân 3, nhưng tất nhiên con người không thể xem xét hàng triệu ví dụ.

Vì vậy, AI là dạy máy tính học từ các tập dữ liệu lớn hoặc ví dụ. AI xuất sắc trong các trường hợp chúng ta muốn xem xét dữ liệu và giải quyết vấn đề. Hãy lấy ví dụ về đề xuất nguồn cấp dữ liệu Instagram: không có AI, chúng ta có thể để con người giải quyết vấn đề (tức là quyết định hiển thị gì cho bạn), hoặc chúng ta có thể để AI xem lịch sử duyệt web của bạn, và dựa trên dữ liệu đó, quyết định hiển thị gì cho bạn.

## AI Model

Tôi muốn định nghĩa AI model là gì. Bởi vì cho đến nay, chúng ta vẫn giữ nó ở cấp độ cao — chúng ta nói rằng AI là dạy máy tính giải quyết vấn đề từ các tập dữ liệu lớn.

Điều gì xảy ra đằng sau hậu trường? Thuần túy là toán học. Và đừng sợ toán học, bởi vì một hàm toán học không hơn không kém là một thứ nhận đầu vào và tạo ra đầu ra. Có những hàm làm gấp đôi đầu vào, vì vậy nếu bạn nhập 2, bạn nhận được 4 (y = 2x). Một số hàm đảo ngược đầu vào, vì vậy nếu bạn nhập 2, bạn nhận được -2 (y = -x). Tất cả đây đều là các hàm toán học.

Nếu chúng ta quay lại ví dụ về một hàm dự đoán giá nhà dựa trên diện tích của nó: thay vì chúng ta viết hàm toán học này, chúng ta cho máy tính xem hàng triệu ví dụ về giá nhà dựa trên diện tích của chúng và chúng ta để nó tự đưa ra công thức toán học.

**Công thức toán học đó chính là AI model.** Vì vậy, có một AI model để dự đoán giá nhà — đó là một hàm toán học để dự đoán giá nhà. Đầu vào là diện tích nhà, và đầu ra là giá nhà. Có một AI model đặt nội dung liên quan vào nguồn cấp dữ liệu Instagram của bạn dựa trên hoạt động duyệt web của bạn — đó là một hàm toán học khác được huấn luyện đặc biệt trên dữ liệu duyệt web Instagram. Đầu vào là hoạt động duyệt web, đầu ra là bài đăng Instagram. Nhưng một lần nữa, đây là các hàm mà máy tính đã đưa ra dựa trên hàng triệu ví dụ dữ liệu.

Chính xác hơn trong thực tế, điều xảy ra là con người chọn hàm toán học cơ bản. Ví dụ, chúng ta biết rằng giá nhà tỷ lệ thuận với diện tích (nhà càng lớn, càng đắt), vì vậy chúng ta có thể mô hình hóa nó bằng một hàm tuyến tính như (y = ax + b). Sau đó, máy tính xem xét tất cả các ví dụ về cặp đầu vào và đầu ra (giá nhà và diện tích của chúng) sau đó xác định giá trị thích hợp nhất cho a và b là gì (đây được gọi là **tham số**). Trước đây, chúng ta chỉ đoán rằng giá nhà bằng 3 lần diện tích của nó (y = 3x + 0), nhưng với AI, chúng ta để nó xem xét nhiều ví dụ và đưa ra các giá trị chính xác cho a và b.

## Các loại AI

Có 3 phương pháp chính để dạy máy tính từ một tập hợp con dữ liệu lớn:

**Supervised Learning, Unsupervised Learning, và Reinforcement Learning.**

### 1. Supervised Learning

Supervised learning là cách tiếp cận đầu tiên và phổ biến nhất để huấn luyện các AI model. Chúng ta dạy máy móc giải quyết vấn đề bằng cách cung cấp cho nó một tập dữ liệu đã được gán nhãn — không chỉ bất kỳ dữ liệu nào, mà là **dữ liệu đã được gán nhãn**. Hãy sử dụng công cụ dự đoán giá nhà theo diện tích làm ví dụ. Để dạy máy tính, chúng ta cung cấp cho nó một loạt các cặp đầu vào/đầu ra của diện tích nhà và giá nhà, tất cả dữ liệu đó đều được gán nhãn. Nó nói, "Với diện tích nhà này, đây là giá," và chúng ta có hàng triệu dữ liệu như vậy. Máy tính liên tục thử các công thức khác nhau, so sánh chúng với tập dữ liệu đã được gán nhãn cho đến khi nó đưa ra công thức hoàn hảo. Đây là điều chúng ta gọi là huấn luyện AI hoặc ML model — đây là lý do tại sao việc huấn luyện các AI model lại tốn kém vì máy tính liên tục thử các công thức khác nhau cho hàng triệu tập dữ liệu. Nhưng bây giờ chúng ta có một AI model dự đoán giá nhà dựa trên diện tích.

Nếu chúng ta muốn xây dựng một AI model, một hàm toán học có thể dự đoán hình ảnh nào là chó hoặc mèo, chúng ta cung cấp cho nó hàng triệu hình ảnh chó và mèo đã được gán nhãn. Tất cả đều được gán nhãn, đó là lý do tại sao nó được gọi là **supervised**. Chúng ta với tư cách là con người đã thực hiện công việc khó khăn là gán nhãn dữ liệu, và do đó đang giám sát máy móc học từ dữ liệu đó.

![image](https://github.com/user-attachments/assets/4c1b4c17-b1f6-4070-b528-689c6b681668)



### 2. Unsupervised Learning

Unsupervised learning là khi dữ liệu chỉ có đầu vào mà không có đầu ra. Chúng ta không cố gắng dự đoán điều gì đó như liệu một email có phải là spam hay không; thay vào đó, chúng ta chỉ đơn giản là khám phá các mẫu trong dữ liệu. Dữ liệu mua sắm là ví dụ dễ hình dung nhất. Máy tính có thể khám phá các mẫu từ dữ liệu khổng lồ này và kết luận rằng những khách hàng mua bánh mì thường mua sữa. Dữ liệu này không được gán nhãn hoặc không có đầu ra — nó chỉ đơn giản là hành vi mua sắm bao gồm thông tin như "khách hàng này mua trứng, khách hàng này mua yến mạch, khách hàng này mua sữa," và từ tất cả dữ liệu đó, nó khám phá các mẫu.

Vì vậy, supervised learning là: "Đây là diện tích nhà và giá, hãy học cách dự đoán giá dựa trên diện tích." Unsupervised là: "Đây là dữ liệu mua sắm, hãy tìm các mẫu thú vị."

Trên Amazon, các đề xuất sản phẩm ("khách hàng đã mua x cũng mua y") là một ví dụ về một ML model không giám sát. Lần tới khi bạn xem Netflix, bạn sẽ bị tràn ngập bởi các ML model không giám sát nói với bạn "những người đã xem loạt phim này cũng đã xem phim này."

![image](https://github.com/user-attachments/assets/c5538fab-6499-4179-be97-b74a1761fd0e)


### 3. Reinforcement Learning

Thay vì học từ dữ liệu có nhãn hoặc tìm các mẫu trong dữ liệu không có nhãn, reinforcement learning là về việc học thông qua thử và sai. Nó giống như huấn luyện một con chó. Khi một con chó làm điều gì đó tốt, bạn cho nó một phần thưởng. Theo thời gian, con chó học được những hành động nào dẫn đến phần thưởng và những hành động nào không.

Trong reinforcement learning, ML model thực hiện các hành động, và dựa trên các hành động này, nó nhận được phần thưởng hoặc hình phạt. Ví dụ, một người chơi cờ vua AI sử dụng reinforcement learning. Nó đã chơi hàng triệu trận đấu và nhận được phần thưởng tích cực cho những nước đi thắng và phần thưởng tiêu cực cho những nước đi thua. Theo thời gian, máy móc khám phá các chiến lược mà người chơi chưa bao giờ xem xét. Xe tự lái là một ví dụ khác. Một chiếc xe tự lái nhận được phần thưởng khi đi đúng làn đường, duy trì khoảng cách an toàn và đến đích.

Khi chúng ta nói về phần thưởng, tất nhiên chúng ta không cho máy tính một phần thưởng. Phần thưởng chỉ đơn giản là một giá trị số cho thuật toán biết liệu một hành động là tốt hay xấu. Vì vậy, số dương chỉ ra hành động tốt, số âm chỉ ra hành động xấu.

Với reinforcement learning, chúng ta không cung cấp cho AI một tập dữ liệu để nghiên cứu trước. Thay vào đó, chúng ta đặt nó vào một môi trường (thực hoặc mô phỏng) nơi nó thực hiện các hành động, kết quả được quan sát, và nó nhận được phần thưởng hoặc hình phạt.

Với các AI model như ChatGPT, model được huấn luyện bằng một supervised model nơi nó được huấn luyện trên hàng triệu dữ liệu có nhãn như sách hoặc trang web. Sau đó, model sử dụng reinforcement learning nơi nó tạo ra nhiều phản hồi có thể có cho một prompt nhất định, và những phản hồi này được đánh giá dựa trên mức độ hữu ích hoặc chính xác của chúng bởi con người hoặc bởi một hệ thống AI khác. Model nhận các đánh giá này làm phần thưởng.

![image](https://github.com/user-attachments/assets/d72c893d-1390-4583-8007-50aa0c6bf6d1)


## Tại sao AI trở nên phổ biến

Bạn có biết rằng AI đã tồn tại từ những năm 1950? Câu hỏi đặt ra là, tại sao nó đột nhiên trở nên phổ biến? Chúng ta đã có Google Dịch từ lâu, đó là AI. Chúng ta đã có phát hiện gian lận trong thẻ tín dụng, đó là AI. Chúng ta đã có các thuật toán nguồn cấp dữ liệu Instagram từ lâu. Tại sao nó đột nhiên bùng nổ?

Chắc chắn, các sản phẩm như ChatGPT đã trở nên viral, nhưng đây là lý do thực sự: Để AI hoạt động, bạn cần 3 thứ:

1. **Thuật toán**
2. **Máy tính** 
3. **Dữ liệu**

Những gì các công ty như OpenAI đã làm là họ đã tạo ra một model đa năng, công khai chúng cho tất cả mọi người có thể sử dụng. Và những model này hiểu ngôn ngữ tự nhiên rất tốt, và hóa ra các model có thể hiểu ngôn ngữ tự nhiên là các model đa năng, nghĩa là chúng có thể được sử dụng để giải quyết nhiều trường hợp sử dụng hàng ngày như viết code, hỗ trợ khách hàng, v.v.

Trong quá khứ, bạn phải huấn luyện một đội ngũ kỹ sư Machine Learning và đầu tư vào một lượng lớn cơ sở hạ tầng để huấn luyện AI model của riêng bạn.

Vì vậy, điều xảy ra bây giờ là, mọi công ty đều có thể trở thành một công ty AI.