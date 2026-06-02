import os
import hashlib
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

# Kiểm duyệt an toàn khoá API để tránh crash hệ thống
api_key = os.getenv("GOOGLE_API_KEY")
is_mock_mode = not api_key or len(api_key.strip()) < 10

if not is_mock_mode:
    print("[RAG Service] Google API Key detected. Booting Gemini models...")
    try:
        embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=api_key
        )
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.2
        )
    except Exception as e:
        print(f"[RAG Service] Error initializing Gemini models: {e}. Falling back to mock mode.")
        is_mock_mode = True
else:
    print("[RAG Service] No valid GOOGLE_API_KEY found in .env. Booting in local mock fallback mode.")

async def generate_embedding(text: str) -> list[float]:
    if is_mock_mode:
        # Chế độ Ngoại tuyến: Tạo chuỗi vector giả lập 768-chiều dựa trên MD5 hash của văn bản gốc
        hashed = hashlib.md5(text.encode("utf-8")).digest()
        vector = []
        for i in range(768):
            byte_idx = i % len(hashed)
            val = (hashed[byte_idx] / 255.0) * 2.0 - 1.0
            vector.append(val)
        return vector
    try:
        return await embeddings_model.aembed_query(text)
    except Exception as e:
        print(f"[RAG Service] Gemini embedding API error: {e}. Generating mock embedding instead.")
        hashed = hashlib.md5(text.encode("utf-8")).digest()
        vector = []
        for i in range(768):
            byte_idx = i % len(hashed)
            val = (hashed[byte_idx] / 255.0) * 2.0 - 1.0
            vector.append(val)
        return vector

async def generate_chat_response(query: str, context: str) -> str:
    if is_mock_mode:
        return f"[OFFLINE RAG ANSWER] Dựa trên tài liệu huấn luyện được cung cấp:\n\n{context}\n\nTrả lời câu hỏi: '{query}'. (Hệ thống hiện đang chạy ở chế độ ngoại tuyến không có API Key, phản hồi được giả lập dựa trên ngữ cảnh trích xuất từ database)."
    
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant for a personal knowledge base. Answer the user's question based strictly on the provided context. If the answer is not in the context, say so.\n\nContext:\n{context}"),
            ("human", "{query}")
        ])
        chain = prompt | llm
        response = await chain.ainvoke({"context": context, "query": query})
        return response.content
    except Exception as e:
        print(f"[RAG Service] Gemini Chat API error: {e}. Returning mock response.")
        return f"[RAG Fallback Answer] Đã xảy ra lỗi kết nối Gemini API ({e}). Nội dung tài liệu đối chứng thu hoạch được từ cơ sở dữ liệu:\n\n{context}"
