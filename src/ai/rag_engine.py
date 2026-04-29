import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import OllamaEmbeddings, HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# Cấu hình Qdrant lưu trữ Local
QDRANT_PATH = "vector_db/qdrant_storage"
COLLECTION_NAME = "study_hub_docs"

# Kết nối Embedding chuyên trị Tiếng Việt
embeddings = HuggingFaceEmbeddings(model_name="keepitreal/vietnamese-sbert")

def process_pdf_to_vector(pdf_path: str):
    """
    Đọc file PDF, băm nhỏ (chunking) và lưu vào Vector Database Qdrant
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

    # Lưu vào Qdrant (Tự động tạo collection)
    Qdrant.from_documents(
        chunks,
        embeddings,
        path=QDRANT_PATH,
        collection_name=COLLECTION_NAME
    )
    print("Đã lưu thành công vào Qdrant!")
    return len(chunks)

def ask_llm(query: str):
    """
    Truy vấn Qdrant để lấy thông tin liên quan, sau đó nhờ Llama 3 trả lời
    """
    # Khởi tạo kết nối đọc Qdrant
    vector_store = Qdrant.from_existing_collection(
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        path=QDRANT_PATH,
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
        retriever=vector_store.as_retriever(search_kwargs={"k": 3}),
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
