class BaseNode {
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
        this.status = 'IDLE';
    }

    /**
     * Hàm bắt buộc phải có - Các con AI sẽ override (viết đè) hàm này
     * @param {Object} input Dữ liệu đầu vào từ user/hệ thống
     * @param {Object} context Ngữ cảnh hội thoại hoặc dữ liệu luồng
     */
    async execute(input, context) {
        throw new Error(`Agent [${this.name}] chưa được cài đặt logic thực thi!`);
    }

    /**
     * Các tính năng xịn mà con AI nào cũng được hưởng ké
     */
    log(message) {
        console.log(`[${new Date().toLocaleTimeString()}] [${this.name}]: ${message}`);
    }

    /**
     * Xử lý lỗi chuẩn mực, cập nhật trạng thái và emit qua Socket.io nếu có
     */
    handleError(error) {
        this.log(`❌ LỖI: ${error.message}`);
        this.status = 'ERROR';
        // Gửi thông báo về Frontend qua Socket (nếu global.io tồn tại)
        if (global.io) {
            global.io.emit('agent_error', { agent: this.name, error: error.message });
        }
    }
}

module.exports = BaseNode;
