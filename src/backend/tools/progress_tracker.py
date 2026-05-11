"""
Tool Quản lý Lộ trình (The Academic Coach)
Chức năng: Ghi nhận tiến độ học tập của người dùng vào Database.
"""

def update_learning_progress(user_id: str, topic: str, status: str, notes: str = "") -> str:
    """
    Cập nhật tiến độ học tập hàng ngày của người dùng vào cơ sở dữ liệu.
    
    Args:
        user_id: ID của người dùng.
        topic: Tên bài học hoặc chủ đề vừa hoàn thành (VD: "Vòng lặp For", "Thuật toán BFS").
        status: Trạng thái (VD: "DONE", "IN_PROGRESS", "STRUGGLING").
        notes: Ghi chú thêm về việc người dùng còn yếu phần nào để Agent nhắc lại hôm sau.
        
    Returns:
        Thông báo trạng thái cập nhật thành công.
    """
    # TODO: Kết nối với PostgreSQL Database để lưu trạng thái
    
    print(f"[COACH] Cập nhật tiến độ cho {user_id}: {topic} -> {status}")
    
    return f"Thành công! Đã lưu tiến độ môn '{topic}' với trạng thái '{status}'. Dữ liệu này sẽ được đồng bộ lên Frontend."
