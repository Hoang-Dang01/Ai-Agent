import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import PGVector
from langchain_community.embeddings import OllamaEmbeddings, HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder

# Cấu hình PostgreSQL (Gom về 1 mối)
CONNECTION_STRING = "postgresql+psycopg2://ai_admin:mysecretpassword@localhost:5432/ai_study_hub"
COLLECTION_NAME = "study_hub_docs"

# Kết nối Embedding chuyên trị Tiếng Việt
print("Đang tải Embedding Model...")
embeddings = HuggingFaceEmbeddings(model_name="keepitreal/vietnamese-sbert")

# Khởi tạo Reranker (Kẻ Sàng Lọc) cho Advanced RAG
print("Đang tải BGE-Reranker (Mô hình chấm điểm)...")
reranker_model = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-base")
compressor = CrossEncoderReranker(model=reranker_model, top_n=3)

def process_pdf_to_vector(pdf_path: str):
    """
    Đọc file PDF, băm nhỏ (chunking) và lưu vào PostgreSQL (pgvector)
    """
    print(f"Đang đọc file: {pdf_path}")
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Đã chia thành {len(chunks)} chunks.")

    # Lưu vào PostgreSQL (Tự động tạo bảng và collection)
    PGVector.from_documents(
        embedding=embeddings,
        documents=chunks,
        collection_name=COLLECTION_NAME,
        connection_string=CONNECTION_STRING,
    )
    print("Đã lưu thành công vào PostgreSQL!")
    return len(chunks)

def ask_llm(query: str):
    """
    Truy vấn Qdrant để lấy thông tin liên quan, dùng Reranker chấm điểm lại, sau đó nhờ Llama/Qwen trả lời
    """
    # Khởi tạo kết nối đọc PostgreSQL
    vector_store = PGVector(
        collection_name=COLLECTION_NAME,
        connection_string=CONNECTION_STRING,
        embedding_function=embeddings,
    )
    
    # 1. Base Retriever: Quét rộng 15 đoạn (Chunks) liên quan nhất bằng Vector Search
    base_retriever = vector_store.as_retriever(search_kwargs={"k": 15})
    
    # 2. Reranker: Dùng BGE-Reranker chấm điểm và chắt lọc lại đúng 3 đoạn đắt giá nhất
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor, base_retriever=base_retriever
    )
    
    # Đổi sang Qwen 2.5 theo kế hoạch
    llm = Ollama(model="qwen2.5:7b", temperature=0.1)
    
    # Custom Prompt (Phòng thủ & Chỉ định vai trò)
    prompt_template = """Bạn là một Gia sư AI thông minh tại trường UTH. Nhiệm vụ của bạn là trả lời câu hỏi dựa trên TÀI LIỆU được cung cấp bên dưới.
    NẾU THÔNG TIN KHÔNG CÓ TRONG TÀI LIỆU, hãy trả lời: "Dạ, thông tin này không có trong giáo trình nên em không thể trả lời được ạ." TUYỆT ĐỐI KHÔNG TỰ BỊA ĐÁP ÁN.
    
    TÀI LIỆU:
    {context}
    
    CÂU HỎI: {question}
    
    TRẢ LỜI (bằng tiếng Việt tự nhiên):"""
    PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=compression_retriever, # Sử dụng Reranker Retriever thay vì Base Retriever
        return_source_documents=True, # BẬT TÍNH NĂNG TRÍCH DẪN NGUỒN
        chain_type_kwargs={"prompt": PROMPT}
    )
    
    print(f"User hỏi: {query}")
    result = qa_chain.invoke({"query": query})
    
    # Xử lý trích dẫn nguồn (Cite Sources)
    sources = []
    for doc in result["source_documents"]:
        page = doc.metadata.get("page", "Không rõ")
        source = doc.metadata.get("source", "Tài liệu")
        # Rút gọn tên file
        filename = os.path.basename(source)
        sources.append(f"Trang {page} ({filename})")
        
    # Loại bỏ trùng lặp nguồn
    unique_sources = list(set(sources))
    
    return {
        "reply": result["result"],
        "citations": unique_sources
    }
