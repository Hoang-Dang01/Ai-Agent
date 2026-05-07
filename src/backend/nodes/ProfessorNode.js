const BaseNode = require('../core/BaseNode');
const axios = require('axios'); // Dùng để gọi sang Python Backend

class ProfessorNode extends BaseNode {
    constructor() {
        super('AI Professor', { role: 'Giảng viên' });
    }

    async execute(input, context) {
        this.status = 'PROCESSING';
        this.log(`Đang phân tích câu hỏi của học viên: "${input.message}"`);
        
        try {
            // Bước 1: Giả lập gọi sang Python RAG Engine
            // Trong thực tế sẽ là: const response = await axios.post('http://localhost:8000/ask', { message: input.message });
            this.log('Đang truy vấn kiến thức từ Vector DB (Python)...');
            
            // Giả lập delay xử lý
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Bước 2: Tạo giáo án/câu trả lời
            let answer = `Dưới góc độ của một giảng viên, đây là kiến thức chuẩn xác nhất về câu hỏi "${input.message}" của sếp.`;
            
            // Bước 3: Áp dụng Giao thức "Vặn vẹo" (Active Recall)
            answer += `\n\n> 🎓 **Câu hỏi kiểm tra:** Đoạn này sếp có thấy mâu thuẫn với phần Code sếp viết hôm qua không? Hãy thử giải thích lại cho tui nghe nào!`;
            
            this.status = 'SUCCESS';
            this.log('Đã soạn xong bài giảng!');
            
            return {
                reply: answer,
                type: 'lecture',
                agent: this.name
            };
        } catch (e) {
            this.handleError(e);
            return { error: 'Giảng viên đang bận chấm bài, vui lòng thử lại sau!' };
        }
    }
}

module.exports = ProfessorNode;
