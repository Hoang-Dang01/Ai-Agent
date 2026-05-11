"""
Tool Truy xuất Kiến thức (The Librarian)
Chức năng: Truy vấn PostgreSQL (pgvector) để lấy kiến thức RAG.
"""

def retrieve_knowledge(query: str, top_k: int = 3) -> str:
    """
    Tìm kiếm và trích xuất thông tin liên quan từ Vector Database dựa trên câu hỏi của người dùng.
    
    Args:
        query: Câu hỏi hoặc từ khóa cần tìm kiếm (VD: "Số đối xứng là gì?").
        top_k: Số lượng đoạn văn bản liên quan nhất cần trả về.
        
    Returns:
        Một chuỗi chứa các đoạn văn bản tài liệu liên quan nhất.
    """
    # TODO: Khởi tạo kết nối pgvector, tính toán embedding cho `query` và thực hiện Cosine Similarity Search
    
    # Mock data tạm thời để test luồng
    print(f"[LIBRARIAN] Đang tìm kiếm tài liệu cho: {query}")
    return f"Đã tìm thấy thông tin cho '{query}': Dữ liệu giả lập từ RAG Database."
