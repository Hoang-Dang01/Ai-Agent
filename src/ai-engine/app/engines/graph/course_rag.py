import os
import glob
from langchain.text_splitter import MarkdownHeaderTextSplitter
from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# Sử dụng Qdrant Local để lưu Vector không cần setup Docker/Postgres phức tạp
QDRANT_PATH = "local_qdrant_db"
COLLECTION_NAME = "generative_ai_course"

def get_embeddings():
    # Sử dụng model sbert đã được cache từ code cũ của sếp
    return HuggingFaceEmbeddings(model_name="keepitreal/vietnamese-sbert")

def ingest_course_data():
    """Hàm này do Agent 09 chạy để nhúng toàn bộ Markdown vào não."""
    content_dir = r"c:\Git cua tui\Ai-Agent\docs\GenerativeAICourse\content"
    md_files = glob.glob(os.path.join(content_dir, "*.md"))
    
    docs = []
    headers_to_split_on = [
        ("#", "Chương"),
        ("##", "Phần chính"),
        ("###", "Mục con"),
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    
    for file_path in md_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        splits = markdown_splitter.split_text(text)
        # Gắn thẻ nguồn (Source Metadata)
        for split in splits:
            split.metadata["source"] = os.path.basename(file_path)
        docs.extend(splits)
        
    print(f"[Agent 09] Đã băm thành {len(docs)} chunks. Đang tiến hành Vector hóa...")
    
    Qdrant.from_documents(
        docs,
        get_embeddings(),
        path=QDRANT_PATH,
        collection_name=COLLECTION_NAME
    )
    print("[Agent 09] Nhúng thành công vào Local Vector DB!")

def ask_course_rag(query: str):
    """Truy vấn RAG thực tế thay vì dùng Mock Data"""
    # Nếu DB chưa tồn tại, tự động học (ingest)
    if not os.path.exists(QDRANT_PATH):
        ingest_course_data()
        
    vector_store = Qdrant.from_existing_collection(
        embedding=get_embeddings(),
        collection_name=COLLECTION_NAME,
        path=QDRANT_PATH
    )
    
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})
    
    # ======= CHUYỂN SANG DÙNG OPEN ROUTER =======
    from langchain_openai import ChatOpenAI
    from langchain_community.llms import Ollama
    from dotenv import load_dotenv
    import os
    
    # Load biến môi trường từ file .env
    load_dotenv()
    
    # Lấy Key từ .env (Bảo mật 100%)
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    if not OPENROUTER_API_KEY:
        print("[WARNING] Không tìm thấy OPENROUTER_API_KEY trong .env! Sẽ chạy hoàn toàn bằng Fallback (Ollama).")
    
    # Mô hình chính (Primary Brain)
    primary_llm = ChatOpenAI(
        model_name="google/gemini-2.5-flash", 
        openai_api_key=OPENROUTER_API_KEY or "dummy-key-de-tranh-loi",
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0.1,
        default_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "AI Study Hub"}
    )
    
    # Mô hình dự phòng chống sập (Fallback Brain)
    fallback_llm = Ollama(model="qwen2.5:7b", temperature=0.1)
    
    # Kết hợp tính năng Fallback của Langchain
    llm = primary_llm.with_fallbacks([fallback_llm])
    # ============================================
    
    prompt_template = """Bạn là Đặc vụ AI (Knowledge Sentinel). Dựa vào dữ liệu từ Khóa học Generative AI dưới đây, hãy trả lời câu hỏi.
    NẾU THÔNG TIN KHÔNG CÓ TRONG TÀI LIỆU, hãy nói rõ là không có, không tự bịa (No Hallucination).
    
    TÀI LIỆU (Context):
    {context}
    
    CÂU HỎI (User Query): {question}
    
    TRẢ LỜI CỦA BẠN:"""
    PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": PROMPT}
    )
    
    # Luồng chống sập tuyệt đối (Ultimate Anti-Crash Flow)
    try:
        result = qa_chain.invoke({"query": query})
        reply = result["result"]
        # Phân tích cú pháp lấy thuộc tính 'content' nếu Langchain trả về object AIMessage
        if hasattr(reply, 'content'):
            reply = reply.content
        sources = list(set([doc.metadata.get("source", "Tài liệu ẩn") for doc in result["source_documents"]]))
    except Exception as e:
        print(f"[CRITICAL ERROR] RAG Chain Failed: {str(e)}")
        reply = "🚨 Hệ thống gặp sự cố kết nối tới Đám mây (OpenRouter) và cả Local LLM. Đặc vụ 04 đã kích hoạt rào chắn bảo vệ để chống sập App. Vui lòng thử lại sau ít phút!"
        sources = ["Fallback System"]
    
    return {
        "reply": reply,
        "sources": sources
    }
