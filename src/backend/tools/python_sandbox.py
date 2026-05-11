"""
Tool Chạy Code Python (The Math Specialist)
Chức năng: Cho phép Agent viết và thực thi code Python trong môi trường Sandbox để tính toán, phân tích dữ liệu.
"""
import traceback
import sys
from io import StringIO

def execute_python_code(code: str) -> str:
    """
    Thực thi mã nguồn Python và trả về kết quả Output (stdout) hoặc Lỗi (stderr).
    Sử dụng cho các bài toán tính toán phức tạp, xử lý mảng, hoặc kiểm tra logic.
    
    Args:
        code: Đoạn mã Python cần thực thi.
        
    Returns:
        Kết quả in ra từ lệnh print() trong code, hoặc thông báo lỗi nếu code sai.
    """
    # TODO: Đưa code này vào Docker container hoặc môi trường bị cô lập (Restricted) để đảm bảo bảo mật.
    
    print("[MATH SPECIALIST] Đang thực thi mã Python...")
    
    # Tạo luồng để bắt stdout
    old_stdout = sys.stdout
    redirected_output = sys.stdout = StringIO()
    
    try:
        # Thực thi code
        exec(code, {"__builtins__": __builtins__}, {})
        output = redirected_output.getvalue()
        return output if output else "Mã chạy thành công (Không có log output)."
    except Exception as e:
        # Trả về lỗi chi tiết để AI có thể tự sửa (Self-Correction)
        error_msg = traceback.format_exc()
        return f"Lỗi thực thi Code:\n{error_msg}"
    finally:
        # Trả lại luồng stdout cũ
        sys.stdout = old_stdout
