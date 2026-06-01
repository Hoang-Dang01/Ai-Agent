from typing import Dict, Any

class Critic:
    """
    LLM-Based Critic: Analyzes failure states, active windows, 
    and logs to diagnose the exact root cause when a rule-based check fails.
    """
    
    @staticmethod
    def generate_diagnostic_prompt(
        task_title: str,
        tool_name: str,
        tool_args: Dict[str, Any],
        tool_output: str,
        active_window: str,
        rule_reason: str
    ) -> str:
        """
        Xây dựng Prompt chi tiết gửi cho mô hình Qwen/Local LLM để chẩn đoán lỗi.
        """
        return f"""[DIAGNOSTIC SYSTEM INSTRUCTIONS]
Bạn là một Critic AI chuyên phân tích lỗi hệ điều hành và gỡ lỗi tự động hóa.
Nhiệm vụ của bạn là đọc nhật ký chạy của Agent, phân tích trạng thái và chẩn đoán NGÀY lập tức tại sao hành động thất bại.

--- THÔNG TIN BỐI CẢNH ---
- Nhiệm vụ đang chạy: {task_title}
- Công cụ đã gọi: {tool_name}
- Tham số truyền vào: {tool_args}
- Phản hồi từ công cụ: {tool_output}
- Cửa sổ hoạt động hiện hành: {active_window}
- Kết quả từ Rule Verifier: {rule_reason}

--- YÊU CẦU TRẢ LỜI ---
1. Chỉ ra lỗi nằm ở đâu (Ví dụ: sai tên nút bấm, ứng dụng Notepad chưa mở hẳn, hoặc gõ phím trượt tiêu điểm).
2. Viết ngắn gọn tối đa trong 2-3 câu bằng Tiếng Việt.
"""

    @staticmethod
    def parse_diagnostic_response(llm_raw_response: str) -> Dict[str, Any]:
        """
        Chuẩn hóa câu trả lời thô từ LLM thành DTO chẩn đoán lỗi.
        """
        return {
            "rootCause": llm_raw_response.strip(),
            "confidence": 0.85,
            "requiresReplanning": True
        }
