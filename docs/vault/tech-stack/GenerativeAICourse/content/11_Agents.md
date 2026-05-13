# AI Agents

## Tổng quan: Từ thủ công đến tự động

Hầu hết phần mềm ngày nay yêu cầu con người nhấp qua giao diện, hoặc đưa ra quyết định, hoặc tự động thực thi các quy trình làm việc.

Hãy nghĩ về các đội dịch vụ khách hàng tự động xem xét các yêu cầu hoàn tiền.

Chúng ta đã cố gắng giải quyết vấn đề này bằng các công cụ tự động hóa truyền thống, nhưng chúng chỉ hoạt động trên các quy trình làm việc hoàn toàn có thể dự đoán được, vì nó dựa trên một chuỗi các câu lệnh if và else.

Tuy nhiên, rất nhiều quy trình kinh doanh phức tạp, không thể đoán trước và yêu cầu ra quyết định động.

Nhiều người định nghĩa AI agents là các LLMs có thể thực hiện hành động. Trong lịch sử, LLMs là về việc tạo ra một phản hồi, agents là về việc thực hiện.

**Nhưng từ những nguyên tắc đầu tiên, một AI agent chỉ đơn giản là một ứng dụng sử dụng LLM làm công cụ ra quyết định để thực hiện các hành động một cách độc lập.** Từ khóa quan trọng là độc lập — nó không phụ thuộc vào bạn để thực hiện hành động (nói với nó phải làm gì).

Một AI agent phê duyệt hoàn tiền là một ứng dụng có thể thực hiện các hành động (giống như tất cả các ứng dụng) như phê duyệt hoàn tiền, chuyển tiếp cho con người, thực hiện hoàn tiền, v.v. Điểm khác biệt duy nhất là không phải con người đưa ra các quyết định này mà là LLM.

### Tự động hóa truyền thống so với AI Agents

Bạn có thể xây dựng quy trình phê duyệt hoàn tiền bằng cách sử dụng tự động hóa truyền thống với logic đơn giản như:

```
Nếu số tiền > $500 VÀ không có sự chấp thuận của quản lý THÌ từ chối
```

Với một AI agent, nó có thể xem xét lịch sử mua hàng của khách hàng, xem xét lý do trả hàng, đánh giá chính sách của công ty trong ngữ cảnh, sau đó đưa ra quyết định. Agent có thể nhận ra việc hoàn thành quy trình làm việc (hoàn tiền được xử lý và khách hàng được thông báo) và có thể tự sửa (Tôi đã gửi sai số tiền hoàn tiền, hãy để tôi phát hành một khoản điều chỉnh).

![image](https://github.com/user-attachments/assets/04699a4f-256b-4a74-9986-60e2b550094e)

## Tại sao AI Agents đột nhiên bùng nổ

1. **Khả năng ra quyết định:** Sự ra đời của các mô hình lập luận đã giúp AI agents có khả năng đưa ra các quyết định phức tạp.
2. **Giao thức giao tiếp:** Sự ra đời của các giao thức giao tiếp như MCP (sẽ có thêm thông tin trong module tiếp theo) đã làm cho quá trình xây dựng các agents phức tạp trở nên đơn giản hơn nhiều.

### Định nghĩa và Tầm nhìn của Agent của Microsoft

Cách chúng tôi định nghĩa agents tại Microsoft, và những gì chúng tôi sử dụng làm khung tham chiếu để xây dựng sản phẩm và khả năng cho khách hàng, là **một hệ thống mà con người có thể giao phó các nhiệm vụ, và các nhiệm vụ này sẽ ngày càng phức tạp theo thời gian**.

**Lập luận:** Nhờ sự phát triển của các mô hình lập luận, agents giờ đây có thể thực hiện các nhiệm vụ ngày càng phức tạp, đặc biệt là kỹ thuật phần mềm.

### The Agentic Web

**Các thành phần Runtime:**
- **Lớp lập luận (Reasoning layer):** Khả năng ra quyết định cốt lõi xác định hành động cần thực hiện
- **Bộ nhớ (Memory):** Đây là kỹ thuật phần mềm cơ bản. Chúng tôi đã khám phá các giải pháp như RAG và các cửa sổ ngữ cảnh dài, và có những phát triển đang diễn ra như Talk agents. Mục tiêu là ghi nhớ các tương tác và giải quyết vấn đề theo cùng một cách như lần trước — giống như những gì bạn mong đợi từ một người mà bạn giao phó nhiệm vụ
- **Công cụ (Tools):** Các khả năng thực tế cho phép agents thực hiện hành động trong thế giới thực

**Giao thức:** 
- **MCP (Model Context Protocol):** Bạn cần agents để thực hiện hành động, điều đó có nghĩa là chúng phải giao tiếp với các hệ thống khác. MCP giống như HTTP cho AI agents — nó cung cấp một cách tiêu chuẩn để agents tương tác với các dịch vụ và công cụ khác nhau
- **A2A (Agent-to-Agent):** Các giao thức giao tiếp cho phép agents làm việc cùng nhau

## Khi nào nên xây dựng AI Agents

### 1. Ra quyết định phức tạp
Khi các quy trình làm việc yêu cầu các quyết định khó có thể được thể hiện bằng các quy tắc. Ví dụ, một hệ thống truyền thống có thể tự động phê duyệt các khoản hoàn tiền dưới 50 đô la, nhưng một agent có thể đánh giá yêu cầu hoàn tiền 45 đô la cho một sản phẩm mà khách hàng đã trả lại 3 lần trước đó.

### 2. Hệ thống quy tắc không thể duy trì
Nếu hệ thống quy tắc của bạn đã phát triển thành hàng trăm câu lệnh điều kiện.

### 3. Quy trình làm việc dữ liệu phi cấu trúc
Nếu bạn đang xử lý tài liệu, email hoặc ngôn ngữ tự nhiên. Ví dụ, các agent yêu cầu bảo hiểm có thể đọc báo cáo tai nạn, hồ sơ y tế, v.v. Điều này là không thể với việc phân tích cú pháp truyền thống.

### Tính toán kinh tế
Agents dĩ nhiên tốn kém hơn mỗi hoạt động so với tự động hóa truyền thống, nhưng chúng loại bỏ lao động của con người cần thiết cho các quyết định phức tạp. Nếu bạn trả cho nhân viên 50 đô la/giờ để xem xét các trường hợp mà một agent có thể xử lý với chi phí 2 đô la/trường hợp, và bạn xử lý 1000 trường hợp mỗi tháng, bạn tiết kiệm được 48.000 đô la mỗi tháng trừ đi 2000 đô la chi phí agent.

## Các thành phần của Agents

### 1. Mô hình (Bộ não)
Đây là bộ não. Các mô hình khác nhau có các khả năng và chi phí khác nhau. Luôn xây dựng nguyên mẫu của bạn bằng mô hình có khả năng nhất để thiết lập một đường cơ sở hiệu suất, thiết lập các chỉ số đánh giá (độ chính xác và tỷ lệ hoàn thành nhiệm vụ), và thay thế bằng các mô hình nhỏ hơn khi duy trì được kết quả chấp nhận được.

Thông thường, các mô hình lớn hơn được sử dụng cho các điểm quyết định phức tạp. Ví dụ, sử dụng SLM để truy xuất dữ liệu đơn giản (lấy lịch sử đơn hàng của khách hàng) nhưng sử dụng LLM cho các quyết định hoàn tiền (chúng ta có nên chấp thuận khoản hoàn tiền 500 đô la này cho một khách hàng đã trả lại 5 mặt hàng trong tháng này không).

### 2. Công cụ
Chúng có thể là các công cụ dữ liệu như truy vấn cơ sở dữ liệu, chúng có thể là các công cụ giao tiếp như gửi email hoặc sửa đổi dữ liệu (cập nhật bản ghi CRM), hoặc có thể là các công cụ điều phối như gọi một agent khác. Mỗi công cụ cần có các định nghĩa được tiêu chuẩn hóa trong mã của bạn với các tham số và giá trị trả về rõ ràng. Tài liệu công cụ kém gây ra việc agents sử dụng sai API.

**Lưu ý:** Bạn có thể đã nghe các thuật ngữ như function calling. Sự khác biệt giữa function calling và tools, là tools là việc triển khai thực tế (như các hàm python thực hiện công việc) trong khi function calling là khả năng của LLM để nói với ứng dụng của bạn "Tôi cần truy cập vào hàm thời tiết". Bạn cần cả hai trong một agent, nhưng Semantic Kernel trừu tượng hóa function calling để chúng có thể xuất hiện như cùng một thứ.

**Ví dụ:**
```python
@function_tool
def process_refund(customer_id: str, order_id: str, amount: float, reason: str):
    """
    Xử lý hoàn tiền cho đơn hàng của khách hàng.
    
    Arguments:
        customer_id: Mã định danh khách hàng duy nhất
        order_id: Đơn hàng cần hoàn tiền
        amount: Số tiền hoàn tiền bằng đô la (phải <= tổng giá trị đơn hàng gốc)
        reason: Lý do kinh doanh cho việc hoàn tiền (bắt buộc cho kế toán)
    
    Returns:
        {"success": bool, "refund_id": str, "message": str}
    """
    # Thực hiện ở đây
    return {"success": True, "refund_id": "REF123", "message": "Refund processed"}
```

### 3. Hướng dẫn
Điều này định nghĩa cách agent hoạt động, những gì nó được phép làm và cách nó nên xử lý các trường hợp biên. Thay vì viết các thủ tục mới, hãy điều chỉnh các chính sách hiện tại của bạn. Nếu đội dịch vụ khách hàng của bạn tuân theo quy trình hoàn tiền 12 bước, thì đó sẽ trở thành bộ hướng dẫn của agent của bạn.

Nắm bắt các trường hợp biên như: Điều gì xảy ra nếu khách hàng cung cấp thông tin không đầy đủ? Điều gì xảy ra nếu cuộc gọi API bị lỗi? Điều gì xảy ra nếu khách hàng hỏi một cái gì đó ngoài lĩnh vực của bạn?

## Trình điều phối (Orchestrator)

Khi bạn có một agent với một mô hình, công cụ và hướng dẫn, bạn cần điều phối các quy trình làm việc này từ đầu đến cuối. Một LLM duy nhất không thể xử lý các quy trình nhiều bước yêu cầu kiểm tra điều kiện, gọi nhiều công cụ và thích ứng dựa trên kết quả.

### Hệ thống một Agent
Dễ xây dựng hơn, và thường dựa vào các mẫu prompt, nơi thay vì tạo các agent riêng biệt cho các trường hợp sử dụng khác nhau, bạn sử dụng một prompt linh hoạt duy nhất chấp nhận các biến.

### Hệ thống nhiều Agent
Được sử dụng khi cần logic phức tạp và khi số lượng công cụ trở nên lớn. Có hai mô hình chính:

1. **Hub and Spoke:** Một agent quản lý trung tâm điều phối các agent làm việc chuyên biệt
2. **Mô hình phi tập trung (Peer to Peer):** Không có bộ điều phối trung tâm

Trường hợp đầu tiên được sử dụng khi bạn cần tổng hợp kết quả từ nhiều agent hoặc khi bạn cần một agent duy trì ngữ cảnh hội thoại với người dùng.

## Xử lý bộ nhớ

Một trong những thách thức lớn nhất trong việc xây dựng các AI agents sản xuất là quản lý bộ nhớ. Chúng tôi đã khám phá cách giải quyết vấn đề bộ nhớ hội thoại, chẳng hạn như tóm tắt các cuộc hội thoại trước đó, hoặc thậm chí sử dụng RAG để lưu trữ lâu dài hơn. Hãy nhớ rằng, LLMs là vô trạng thái — chúng không nhớ bất cứ điều gì giữa các cuộc gọi API vì mỗi yêu cầu là độc lập.

Loại bộ nhớ khác là **bộ nhớ học tập**. Lý tưởng nhất, chúng ta muốn agent học hỏi từ tất cả các tương tác trước đây để nó trở nên tốt hơn. Một ví dụ về cách điều này được triển khai là sử dụng RAG, vì vậy chúng ta lưu trữ các ví dụ giải quyết thành công và truy xuất chúng cho các trường hợp tương tự.

<h2>RAG có tính Agentic: Vượt xa việc truy xuất truyền thống</h2>

Chúng ta đã khám phá một hệ thống RAG truyền thống. Người dùng gửi lời nhắc, chúng ta kiểm tra kho vector để tìm dữ liệu liên quan đến lời nhắc, dữ liệu đó được kết hợp với lời nhắc và gửi đến LLM. LLM trong trường hợp này chỉ đơn thuần tóm tắt câu trả lời, không hơn không kém.

Nhưng LLMs có nhiều khả năng hơn là chỉ tóm tắt lời nhắc và các đoạn liên quan được truy xuất từ kho vector. **Agentic RAG** là một triển khai RAG tinh vi hơn, trong đó khi người dùng đặt câu hỏi, agent phân tích câu hỏi, sau đó quyết định chiến lược truy xuất (có thể tôi cần lấy dữ liệu từ cơ sở dữ liệu vector 2 và 3), sau đó lập luận dựa trên thông tin đã truy xuất, sau đó truy xuất thêm, cho đến khi họ nhận được câu trả lời cuối cùng. Vì vậy, nó là một dạng RAG tinh vi hơn.

## Hàng rào bảo vệ (Guardrails)

AI agents có thể thực hiện các hành động ảnh hưởng đến khách hàng thực tế, chúng có thể truy cập dữ liệu nhạy cảm và chúng có thể đại diện cho thương hiệu của bạn. Không giống như chatbots chỉ tạo văn bản, agents cần được bảo vệ chống lại các hành động đầu ra nguy hiểm.

Bạn cần có sự cân bằng. Các hàng rào bảo vệ quá hạn chế có thể chặn các yêu cầu hợp pháp của người dùng. Nhưng thực tế kinh doanh là một lần rò rỉ cơ sở dữ liệu khách hàng hoặc hoàn tiền 10.000 đô la trái phép có thể tốn kém hơn nhiều tháng phát triển hàng rào bảo vệ.

### Các loại hàng rào bảo vệ

1. **Bộ phân loại mức độ liên quan (Relevance Classifier):** Điều này giữ cho agents hoạt động trong phạm vi dự định của chúng. Do đó, nó ngăn chặn các agent dịch vụ khách hàng trả lời các câu hỏi ngẫu nhiên thay vì giải quyết các vấn đề của khách hàng. SLMs thường được sử dụng để phân loại mức độ liên quan của đầu vào.

2. **Bộ phân loại an toàn (Safety Classifier):** Phát hiện các cuộc tấn công prompt injection và jailbreak. Thông thường, các mô hình được tinh chỉnh được huấn luyện trên các mẫu prompt injection được sử dụng.

3. **Bộ lọc PII (PII Filter):** Ngăn chặn việc vô tình tiết lộ thông tin PII.

4. **Bộ lọc kiểm duyệt (Moderation Filter):** Chặn nội dung có hại bao gồm lời nói căm thù hoặc quấy rối. OpenAI có các API kiểm duyệt có thể được sử dụng.

5. **Con người tham gia (Human in the Loop):** Đối với các tác vụ có rủi ro thấp hoặc trung bình (như gửi email, cập nhật hồ sơ khách hàng) có thể không cần sự can thiệp của con người. Sự chấp thuận của con người có thể được sử dụng cho các rủi ro cao như xử lý hoàn tiền hoặc hủy đơn hàng.

6. **Bảo vệ dựa trên quy tắc (Rule Based Protection):** Điều này để nhanh chóng chặn các mối đe dọa đã biết. Giống như bộ lọc SQL injection, giới hạn độ dài đầu vào, bộ lọc mã hóa ký tự (ngăn chặn các cuộc tấn công dựa trên unicode).

7. **Xác thực đầu ra (Output Validation):** Đảm bảo phản hồi của agent phù hợp với hướng dẫn thương hiệu và chính sách kinh doanh. Những thứ như phân tích giọng điệu, tuân thủ chính sách, tuân thủ pháp luật, v.v.

<h3>Chiến lược xây dựng rào chắn</h3>

**Giai đoạn 1:** Tập trung vào quyền riêng tư dữ liệu và an toàn nội dung. Đây là những rủi ro có tác động cao nhất có thể gây thiệt hại kinh doanh ngay lập tức (tiết lộ PII, prompt injection, nội dung gây hại làm tổn hại hình ảnh thương hiệu).

**Giai đoạn 2:** Thêm rào chắn dựa trên các lỗi thực tế. Giám sát agent đã triển khai của bạn và thực hiện rào chắn cho các vấn đề thực tế gặp phải như người dùng cố gắng lấy sản phẩm miễn phí thông qua kỹ thuật xã hội.

**Giai đoạn 3:** Tối ưu hóa cho bảo mật và UX. Giảm các lỗi sai dương tính chặn các yêu cầu hợp pháp, tùy chỉnh độ nhạy của rào chắn dựa trên ngữ cảnh người dùng (khách hàng VIP được đối xử khác).

<h3>Sự can thiệp của con người</h3>
Rào chắn rất tốt, nhưng các agent hiện tại vẫn cần con người tham gia. Ngay cả đối với các agent hoàn toàn tự động, bạn vẫn cần con người có mặt để đề phòng, và điều này được kích hoạt khi bạn vượt quá ngưỡng lỗi hoặc đối với các hành động rủi ro cao.

<h2>Xây dựng Agent từ đầu so với việc sử dụng Agent "được quản lý" như Azure AI Agent</h2>

Bạn có thể xây dựng AI agents bằng Semantic Kernel từ đầu, nơi bạn quản lý mọi thứ như quyền truy cập công cụ (bạn tự viết mã) hoặc bộ nhớ. Hoặc bạn có thể sử dụng Azure AI Agent là một dịch vụ được quản lý. Đây là cơ sở hạ tầng chạy trên Azure. Microsoft quản lý các máy chủ, bộ nhớ đệm (những thứ như lưu trữ tệp, luồng hội thoại và cơ sở dữ liệu vector được quản lý phía máy chủ), các công cụ tích hợp như trình thông dịch mã đều chạy trong môi trường bảo mật của Microsoft và tích hợp doanh nghiệp vào tìm kiếm AI, các chức năng, v.v.

Bạn chắc chắn có thể sử dụng Semantic Kernel với các API LLM tiêu chuẩn nhưng bạn cần quản lý quản lý trạng thái hội thoại, thực thi và bảo mật công cụ, thay đổi quy mô, cơ sở dữ liệu vector, v.v. Azure AI Agent có thể xử lý tất cả những điều đó cho bạn nhưng bạn có thể lo ngại về chi phí cao hơn hoặc việc bị khóa nhà cung cấp. Tất nhiên, Semantic Kernel có thể được sử dụng để kết nối với dịch vụ Azure AI Agent.