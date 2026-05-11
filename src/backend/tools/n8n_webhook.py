"""
Tool Kết nối n8n (The Orchestrator)
Chức năng: Gửi Webhook kích hoạt các kịch bản Automation bên ngoài (Gửi Email, Lưu Drive, Thông báo Telegram).
"""
import json

def trigger_n8n_workflow(webhook_url: str, payload: dict) -> str:
    """
    Gửi một yêu cầu tự động hóa (Automation request) tới hệ thống n8n.
    
    Args:
        webhook_url: URL của n8n Webhook.
        payload: Dữ liệu JSON cần gửi đi (VD: {"email": "sếp", "message": "Hoàn thành bài tập", "action": "send_email"}).
        
    Returns:
        Trạng thái của request (Thành công/Thất bại).
    """
    # TODO: Dùng thư viện requests để POST data tới n8n
    
    print(f"[ORCHESTRATOR] Bắn Webhook tới {webhook_url} với dữ liệu: {json.dumps(payload)}")
    
    return f"Đã kích hoạt thành công Automation flow trên n8n! Nhiệm vụ ngoài luồng đang được xử lý."
