import os
from typing import Dict, Any

class RuleVerifier:
    """
    Rule-Based Verifier: Performs fast, deterministic checks on OS states, 
    active windows, file system flags, and UI components without calling heavy LLMs.
    """
    
    @staticmethod
    def verify_action(tool_name: str, tool_output: str, active_window: str, current_app: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Đối chiếu kết quả thực thi của công cụ vật lý với luật cứng của môi trường.
        """
        if tool_name == "OpenApplicationTool":
            exe_path = args.get("exePath", "")
            expected_app = os.path.basename(exe_path).replace(".exe", "").lower() if exe_path else ""
            
            if current_app.lower() == expected_app:
                return {
                    "success": True,
                    "confidence": 0.95,
                    "reason": f"Ứng dụng {expected_app} đã được mở và kiểm soát thành công (Active Window: '{active_window}')."
                }
            return {
                "success": False,
                "confidence": 0.40,
                "reason": f"Không trùng khớp ứng dụng mong đợi. Mong muốn: '{expected_app}', Thực tế hoạt động: '{current_app}'."
            }
            
        elif tool_name == "TypeTextTool":
            # Gõ chữ thành công nếu FlaUI không bắn ngoại lệ trong C# host
            if "thành công" in tool_output.lower() or "success" in tool_output.lower():
                return {
                    "success": True,
                    "confidence": 0.85,
                    "reason": "Văn bản đã được nhập liệu thành công vào bộ đêm gõ phím hệ thống."
                }
            return {
                "success": False,
                "confidence": 0.20,
                "reason": f"Lỗi phản hồi nhập liệu từ host runtime: '{tool_output}'."
            }
            
        elif tool_name == "ReadWindowTool":
            # Đọc kiểm chứng từ khóa
            expected_keyword = args.get("expectedKeyword", "")
            if expected_keyword:
                if expected_keyword.lower() in tool_output.lower():
                    return {
                        "success": True,
                        "confidence": 0.99,
                        "reason": f"Xác minh tuyệt đối: Văn bản chứa cụm từ khóa mục tiêu '{expected_keyword}' trùng khớp."
                    }
                return {
                    "success": False,
                    "confidence": 0.30,
                    "reason": f"Văn bản đọc được không chứa cụm từ khóa mong đợi '{expected_keyword}'."
                }
                
        # Phản hồi mặc định nếu công cụ không có bộ kiểm chứng chuyên biệt
        return {
            "success": True,
            "confidence": 0.50,
            "reason": "Hành động hoàn tất không có lỗi hệ thống nhưng thiếu bộ kiểm chứng chuyên biệt."
        }
