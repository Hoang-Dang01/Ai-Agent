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
    
    prompt = f"""Bạn là giảng viên đại học. Dựa vào TÀI LIỆU sau đây, hãy tạo ra {num_questions} câu hỏi trắc nghiệm về chủ đề "{topic}".
    
    Yêu cầu ĐỊNH DẠNG ĐẦU RA PHẢI LÀ MỘT MẢNG JSON HỢP LỆ. KHÔNG VIẾT THÊM BẤT KỲ VĂN BẢN NÀO KHÁC NGOÀI JSON.
    Cấu trúc JSON:
    [
        {{
            "question": "Nội dung câu hỏi",
            "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
            "correct_answer": "A. Lựa chọn 1",
            "explanation": "Giải thích ngắn gọn lý do tại sao đúng dựa trên tài liệu."
        }}
    ]

    TÀI LIỆU:
    {context}
    
    JSON:"""
    
    response = llm.invoke(prompt)
    
    try:
        # Làm sạch chuỗi nếu AI trả về kèm theo backticks markdown
        clean_json = response.strip().strip("```json").strip("```").strip()
        questions = json.loads(clean_json)
        return {"success": True, "data": questions}
    except Exception as e:
        print(f"Lỗi parse JSON: {e}")
        return {"success": False, "error": "AI không trả về đúng định dạng JSON.", "raw_response": response}
