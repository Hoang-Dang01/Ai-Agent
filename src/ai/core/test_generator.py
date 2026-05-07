import json
from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate

QDRANT_PATH = "vector_db/qdrant_storage"
COLLECTION_NAME = "study_hub_docs"

embeddings = HuggingFaceEmbeddings(model_name="keepitreal/vietnamese-sbert")

def generate_mock_test(topic: str, num_questions: int = 5):
    """
    Sinh đề thi trắc nghiệm dựa trên chủ đề yêu cầu và dữ liệu trong Qdrant.
    """
    # Khởi tạo kết nối Qdrant
    vector_store = Qdrant.from_existing_collection(
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        path=QDRANT_PATH,
    )
    
    # Tìm kiếm các đoạn văn bản liên quan đến chủ đề để làm cơ sở ra đề
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    docs = retriever.invoke(topic)
    
    context = "\n".join([doc.page_content for doc in docs])
    
    # Sử dụng Qwen 2.5
    llm = Ollama(model="qwen2.5:7b", temperature=0.3)
    
    prompt = f"""# ROLE
Bạn là một Giáo sư (Professor) chuyên đánh giá năng lực sinh viên đại học. Nhiệm vụ của bạn là đọc tài liệu cung cấp và tạo ra một bộ đề thi trắc nghiệm ({num_questions} câu) xuất sắc nhất về chủ đề "{topic}".

# CONTEXT
Tôi cần xây dựng một bài kiểm tra (Mock Test) đa dạng độ khó để sinh viên ôn thi. Dữ liệu phải chính xác tuyệt đối, bám sát nội dung gốc và bao gồm cả giải thích chi tiết.

# TASK
Dựa trên tài liệu, hãy tạo ra mảng JSON chứa các câu hỏi trắc nghiệm theo phân bổ độ khó sau:
- Câu Dễ: Hỏi về định nghĩa, sự kiện rõ ràng có trong tài liệu.
- Câu Trung bình: Yêu cầu tóm tắt, hiểu quy trình hoặc phân tích nhỏ.
- Câu Khó: Đòi hỏi suy luận logic từ tài liệu.

# CONSTRAINTS (RÀNG BUỘC)
1. ĐỊNH DẠNG ĐẦU RA PHẢI LÀ MỘT MẢNG JSON HỢP LỆ. KHÔNG VIẾT THÊM BẤT KỲ VĂN BẢN NÀO KHÁC (KỂ CẢ GIẢI THÍCH).
2. Tuyệt đối không bịa đặt kiến thức nằm ngoài tài liệu. Nếu tài liệu không đủ ý, hãy ra câu hỏi dựa trên những gì có sẵn.
3. Không sử dụng các cụm từ sáo rỗng như "Dựa trên tài liệu...".

# FEW-SHOT EXAMPLE (VÍ DỤ MẪU ĐẦU RA):
[
    {{
        "difficulty": "Trung bình",
        "question": "Cơ chế Self-Attention trong Transformer hoạt động như thế nào?",
        "options": [
            "A. Nó loại bỏ hoàn toàn các từ không quan trọng",
            "B. Tính toán trọng số liên kết giữa mỗi từ với tất cả các từ khác",
            "C. Chỉ phân tích từ đứng ngay trước nó",
            "D. Thay thế mạng CNN"
        ],
        "correct_answer": "B. Tính toán trọng số liên kết giữa mỗi từ với tất cả các từ khác",
        "explanation": "Self-Attention cho phép mô hình tính trọng số thông qua ba ma trận Query, Key và Value để hiểu ngữ cảnh."
    }}
]

# INPUT DATA (TÀI LIỆU):
{context}

# OUTPUT JSON:"""
    
    response = llm.invoke(prompt)
    
    try:
        # Làm sạch chuỗi nếu AI trả về kèm theo backticks markdown
        clean_json = response.strip().strip("```json").strip("```").strip()
        questions = json.loads(clean_json)
        return {"success": True, "data": questions}
    except Exception as e:
        print(f"Lỗi parse JSON: {e}")
        return {"success": False, "error": "AI không trả về đúng định dạng JSON.", "raw_response": response}
