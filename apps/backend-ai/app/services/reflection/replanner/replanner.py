from typing import Dict, Any, List

class Replanner:
    """
    LLM-Based Replanner: Proposes correction plans, fallback tools, 
    or argument adjustments after a critic diagnoses a system failure.
    """

    @staticmethod
    def generate_replan_prompt(
        original_goal: str,
        failed_task: str,
        critic_diagnostic: str,
        available_tools_schema: str
    ) -> str:
        """
        Xây dựng Prompt gửi cho Local LLM để tái thiết lập đồ thị nhiệm vụ (DAG Task Graph) hoặc đề xuất công cụ thay thế.
        """
        return f"""[REPLANNER SYSTEM INSTRUCTIONS]
Bạn là một Replanner AI chuyên nghiệp chạy cục bộ. Bạn chịu trách nhiệm định tuyến lại hành động cho tác nhân Windows Automation khi gặp lỗi.
Đọc bối cảnh dưới đây và đưa ra đề xuất công cụ thay thế tiếp theo.

--- BỐI CẢNH LỖI ---
- Mục tiêu lớn ban đầu: {original_goal}
- Bước nhiệm vụ bị lỗi: {failed_task}
- Chẩn đoán nguyên nhân lỗi: {critic_diagnostic}

--- DANH SÁCH CÔNG CỤ HIỆN CÓ ---
{available_tools_schema}

--- YÊU CẦU ĐẦU RA (JSON CHUẨN) ---
Trả về một JSON duy nhất có dạng:
{{
  "suggestedTool": "Tên công cụ đề xuất chạy lại (ví dụ OpenApplicationTool)",
  "arguments": {{
     "exePath": "notepad.exe",
     ...
  }},
  "reason": "Giải thích ngắn gọn tại sao đề xuất công cụ này bằng tiếng Việt"
}}
"""

    @staticmethod
    def parse_replan_response(llm_raw_response: str) -> Dict[str, Any]:
        """
        Lọc sạch phản hồi JSON từ LLM và trả về DTO sửa lỗi chuẩn.
        """
        import json
        import re

        clean_text = llm_raw_response.strip()
        # Tìm khối JSON nếu LLM trả về markdown ```json ... ```
        json_match = re.search(r'\{.*\}', clean_text, re.DOTALL)
        if json_match:
            clean_text = json_match.group(0)

        try:
            parsed = json.loads(clean_text)
            return {
                "suggestedTool": parsed.get("suggestedTool", ""),
                "arguments": parsed.get("arguments", {}),
                "reason": parsed.get("reason", "Được đề xuất tự động bởi Replanner AI.")
            }
        except Exception:
            # Fallback nếu LLM trả về text thường không đúng định dạng JSON
            return {
                "suggestedTool": "OpenApplicationTool",
                "arguments": {"exePath": "notepad.exe"},
                "reason": f"Lỗi parse JSON. Fallback khởi chạy lại Notepad. Nội dung thô: '{clean_text}'."
            }
