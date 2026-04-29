# Fine-Tuning

## Sự khác biệt cơ bản

Các phương pháp dựa trên Prompt điều chỉnh mô hình bằng cách đưa ra hướng dẫn, nhưng Fine-tuning điều chỉnh mô hình bằng cách điều chỉnh các trọng số hoặc tham số của nó.

Nó thường được sử dụng cho các khả năng chuyên biệt theo lĩnh vực như lập trình hoặc các ứng dụng y tế.

Mặc dù Fine-tuning rất mạnh mẽ, nhưng nó có thể tốn kém và khó khăn.

![image](https://github.com/user-attachments/assets/a5c5a9e8-820c-4173-9bec-eedb36987f8f)

## Tại sao Fine-Tuning hoạt động

Trong thực tế, hầu hết mọi người thường Fine-tune các mô hình nhỏ hơn vì chúng yêu cầu ít bộ nhớ hơn. Một mô hình nhỏ, được Fine-tune cho một tác vụ cụ thể, có thể vượt trội hơn một mô hình out-of-the-box lớn hơn nhiều về tác vụ đó.

Thách thức chính với Fine-tuning là thu thập dữ liệu được chú thích, có thể chậm và tốn kém để thu thập, đặc biệt đối với các lĩnh vực cụ thể. Một số người dựa vào dữ liệu tổng hợp hoặc do AI tạo ra, nhưng hiệu quả của chúng rất khác nhau.

**Bạn phải luôn bắt đầu với các thí nghiệm Prompt nghiêm ngặt trước khi nghĩ đến Fine-tuning.**

## Các chiến thuật Fine-Tuning

Mặc dù nhiều thứ xung quanh Fine-tuning – quyết định có nên Fine-tune hay không, thu thập dữ liệu và duy trì các mô hình được Fine-tune – rất khó, nhưng quá trình Fine-tuning thực tế lại đơn giản hơn. Có ba điều bạn cần chọn: một base model, một phương pháp Fine-tuning và một framework để Fine-tuning.

### Base Models: Điểm khởi đầu quan trọng

Khi bắt đầu một dự án AI, khi bạn vẫn đang khám phá tính khả thi của tác vụ của mình, việc bắt đầu với mô hình mạnh mẽ nhất mà bạn có thể chi trả là hữu ích. Nếu mô hình này gặp khó khăn trong việc tạo ra kết quả tốt, các mô hình yếu hơn có thể hoạt động kém hơn nữa. Nếu mô hình mạnh nhất đáp ứng nhu cầu của bạn, bạn có thể khám phá các mô hình yếu hơn, sử dụng mô hình ban đầu làm chuẩn để so sánh.

Đối với Fine-tuning, các mô hình khởi đầu khác nhau cho các dự án khác nhau. Có hai con đường phát triển chính:

#### Con đường tiến bộ
1. **Kiểm tra mã Fine-tuning của bạn** bằng cách sử dụng mô hình rẻ nhất và nhanh nhất để đảm bảo mã hoạt động như mong đợi
2. **Kiểm tra dữ liệu của bạn** bằng cách Fine-tuning một mô hình tầm trung. Nếu training loss không giảm khi có thêm dữ liệu, có thể có điều gì đó không ổn
3. **Chạy các thí nghiệm** với mô hình tốt nhất để xem bạn có thể đẩy hiệu suất đến đâu
4. **Xác định giới hạn:** Sau khi bạn có kết quả tốt, hãy chạy huấn luyện với tất cả các mô hình để xác định giới hạn giá/hiệu suất và chọn mô hình phù hợp nhất với trường hợp sử dụng của bạn

#### Con đường chưng cất
1. **Bắt đầu mạnh mẽ:** Bắt đầu với một bộ dữ liệu nhỏ và mô hình mạnh nhất mà bạn có thể chi trả. Huấn luyện mô hình tốt nhất có thể với bộ dữ liệu nhỏ này. Vì base model đã mạnh, nó yêu cầu ít dữ liệu hơn để đạt được hiệu suất tốt
2. **Tạo thêm dữ liệu:** Sử dụng mô hình đã được Fine-tune này để tạo thêm dữ liệu huấn luyện
3. **Huấn luyện rẻ hơn:** Sử dụng bộ dữ liệu mới này để huấn luyện một mô hình rẻ hơn

Vì Fine-tuning thường diễn ra sau các thí nghiệm với Prompt Engineering, nên vào thời điểm bạn bắt đầu Fine-tune, lý tưởng nhất là bạn nên hiểu khá rõ về hành vi của các mô hình khác nhau. Bạn nên lập kế hoạch con đường phát triển Fine-tuning của mình dựa trên sự hiểu biết này.

### Các phương pháp Fine-Tuning: Kỹ thuật Full vs. Adapter

Các kỹ thuật Adapter như LoRA tiết kiệm chi phí nhưng thường không mang lại cùng mức hiệu suất như Full Fine-tuning. Nếu bạn mới bắt đầu với Fine-tuning, hãy thử một thứ gì đó như LoRA, và sau đó thử Full Fine-tuning.

Các phương pháp Fine-tuning để sử dụng cũng phụ thuộc vào khối lượng dữ liệu của bạn. Tùy thuộc vào base model và tác vụ, Full Fine-tuning thường yêu cầu ít nhất hàng nghìn ví dụ và thường là nhiều hơn nữa. Tuy nhiên, các phương pháp PEFT (Parameter Efficient Fine-Tuning) có thể cho thấy hiệu suất tốt với một bộ dữ liệu nhỏ hơn nhiều. Nếu bạn có một bộ dữ liệu nhỏ, chẳng hạn như vài trăm ví dụ, Full Fine-tuning có thể không vượt trội hơn LoRA.

Hãy xem xét bạn cần bao nhiêu mô hình được Fine-tune và cách bạn muốn phục vụ chúng khi quyết định phương pháp Fine-tuning. Các phương pháp dựa trên Adapter như LoRA cho phép bạn phục vụ hiệu quả hơn nhiều mô hình chia sẻ cùng một base model. Với LoRA, bạn chỉ cần phục vụ một mô hình đầy đủ duy nhất, trong khi Full Fine-tuning yêu cầu phục vụ nhiều mô hình đầy đủ.

### Các Framework Fine-Tuning: API so với Giải pháp tùy chỉnh

**Các Fine-tuning API** là cách dễ nhất để Fine-tune. Bạn tải dữ liệu lên, chọn một base model và nhận lại một mô hình đã được Fine-tune. Giống như các API suy luận mô hình, các Fine-tuning API có thể được cung cấp bởi các nhà cung cấp mô hình, nhà cung cấp dịch vụ đám mây và nhà cung cấp bên thứ ba.

Hạn chế của cách tiếp cận này:
- Bạn bị giới hạn bởi các base model mà API hỗ trợ
- API có thể không hiển thị tất cả các thiết lập mà bạn có thể sử dụng để có hiệu suất Fine-tuning tối ưu

Các Fine-tuning API phù hợp cho những ai muốn một cái gì đó nhanh chóng và dễ dàng, nhưng chúng có thể gây khó chịu cho những ai muốn tùy chỉnh nhiều hơn.

**Các framework tùy chỉnh** mang lại cho bạn sự linh hoạt hơn. Bạn có thể Fine-tune bằng cách sử dụng các framework như LLaMA-Factory, unsloth, PEFT, Axolotl và LitGPT. Chúng hỗ trợ một loạt các phương pháp Fine-tuning, đặc biệt là các kỹ thuật dựa trên Adapter. Nếu bạn muốn thực hiện Full Fine-tuning, nhiều base model cung cấp mã huấn luyện mã nguồn mở của chúng trên GitHub mà bạn có thể clone và chạy với dữ liệu của riêng mình.

Tự Fine-tune mang lại cho bạn sự linh hoạt hơn, nhưng bạn sẽ phải cung cấp các tài nguyên tính toán cần thiết. Nếu bạn chỉ thực hiện các kỹ thuật dựa trên Adapter, một GPU tầm trung có thể đủ cho hầu hết các mô hình. Nếu bạn cần nhiều tính toán hơn, bạn có thể chọn một framework tích hợp liền mạch với nhà cung cấp dịch vụ đám mây của bạn.

Để Fine-tune một mô hình bằng cách sử dụng nhiều hơn một máy, bạn sẽ cần một framework giúp bạn thực hiện huấn luyện phân tán, chẳng hạn như DeepSpeed, PyTorch Distributed và ColossalAI.

## Các siêu tham số Fine-Tuning

Tùy thuộc vào base model và phương pháp Fine-tuning, có nhiều siêu tham số bạn có thể điều chỉnh để cải thiện hiệu quả Fine-tuning. Dưới đây là những cái quan trọng nhất:

### Learning Rate: Vấn đề kích thước bước

Learning rate xác định tốc độ thay đổi của các tham số của mô hình với mỗi bước học. Nếu bạn coi việc học là tìm một con đường đến mục tiêu, thì learning rate là kích thước bước. Nếu kích thước bước quá nhỏ, có thể mất quá nhiều thời gian để đạt được mục tiêu. Nếu kích thước bước quá lớn, bạn có thể vượt quá mục tiêu và mô hình có thể không bao giờ hội tụ.

Không tồn tại một learning rate tối ưu phổ quát. Bạn sẽ phải thử nghiệm với các learning rate khác nhau, thường trong khoảng từ 1e-7 đến 1e-3, để xem cái nào hoạt động tốt nhất. Một thực hành phổ biến là lấy learning rate ở cuối giai đoạn pre-training và nhân nó với một hằng số từ 0,1 đến 1.

**Đọc đường cong loss:** Nếu đường cong loss dao động nhiều, có khả năng learning rate quá lớn. Nếu đường cong loss ổn định nhưng mất nhiều thời gian để giảm, learning rate có khả năng quá nhỏ. Tăng learning rate càng cao miễn là đường cong loss vẫn ổn định.

Bạn có thể thay đổi learning rate trong quá trình huấn luyện bằng cách sử dụng **lịch trình learning rate** — các thuật toán xác định cách learning rate nên thay đổi trong suốt quá trình huấn luyện (learning rate lớn hơn ở đầu, nhỏ hơn gần cuối).

### Batch Size: Sự đánh đổi giữa Bộ nhớ và Độ ổn định

Batch size xác định số lượng ví dụ mà một mô hình học từ trong mỗi bước để cập nhật trọng số của nó. Một batch size quá nhỏ, chẳng hạn như ít hơn tám, có thể dẫn đến việc huấn luyện không ổn định. Một batch size lớn hơn giúp tổng hợp các tín hiệu từ các ví dụ khác nhau, dẫn đến các bản cập nhật ổn định và đáng tin cậy hơn.

Nói chung, batch size càng lớn thì mô hình càng có thể xử lý các ví dụ huấn luyện nhanh hơn. Tuy nhiên, batch size càng lớn thì càng cần nhiều bộ nhớ để chạy mô hình của bạn. Do đó, batch size bị giới hạn bởi phần cứng bạn sử dụng.

Đây là nơi bạn thấy sự đánh đổi giữa chi phí và hiệu quả. Tài nguyên tính toán đắt tiền hơn cho phép Fine-tuning nhanh hơn.

**Gradient accumulation:** Tại thời điểm bài viết này, tính toán vẫn là một nút thắt cổ chai cho Fine-tuning. Thường thì các mô hình quá lớn và bộ nhớ quá hạn chế, đến mức chỉ có thể sử dụng các batch size nhỏ. Điều này có thể dẫn đến các bản cập nhật trọng số mô hình không ổn định. Để giải quyết vấn đề này, thay vì cập nhật trọng số mô hình sau mỗi batch, bạn có thể tích lũy gradient trên nhiều batch và cập nhật trọng số mô hình sau khi đủ gradient đáng tin cậy đã được tích lũy.

### Số Epoch: Số lần quan sát mỗi ví dụ

Epoch là một lượt qua dữ liệu huấn luyện. Số epoch xác định số lần mỗi ví dụ huấn luyện được huấn luyện.

Các bộ dữ liệu nhỏ có thể cần nhiều epoch hơn các bộ dữ liệu lớn. Đối với một bộ dữ liệu với hàng triệu ví dụ, 1-2 epoch có thể là đủ. Một bộ dữ liệu với hàng nghìn ví dụ vẫn có thể thấy cải thiện hiệu suất sau 4-10 epoch.

**Sử dụng đường cong loss để hướng dẫn số epoch:** Nếu cả training loss và validation loss vẫn giảm đều đặn, mô hình có thể hưởng lợi từ nhiều epoch hơn (và nhiều dữ liệu hơn). Nếu training loss vẫn giảm nhưng validation loss tăng, mô hình đang overfitting vào dữ liệu huấn luyện và bạn có thể thử giảm số epoch.

### Prompt Loss Weight: Học từ Hướng dẫn so với Phản hồi

Đối với Instruction Fine-tuning, mỗi ví dụ bao gồm một Prompt và một phản hồi, cả hai đều có thể đóng góp vào loss của mô hình trong quá trình huấn luyện. Tuy nhiên, trong quá trình suy luận, Prompt thường được người dùng cung cấp và mô hình chỉ cần tạo phản hồi. Do đó, các token phản hồi nên đóng góp nhiều hơn vào loss của mô hình trong quá trình huấn luyện so với các token Prompt.

Prompt loss weight xác định mức độ Prompt nên đóng góp vào loss này so với phản hồi. Nếu trọng số này là 100%, Prompt đóng góp vào loss nhiều như phản hồi, nghĩa là mô hình học như nhau từ cả hai. Nếu trọng số này là 0%, mô hình chỉ học từ phản hồi. Thông thường, trọng số này được đặt thành 10% theo mặc định, nghĩa là mô hình nên học một chút từ Prompt nhưng chủ yếu từ phản hồi.