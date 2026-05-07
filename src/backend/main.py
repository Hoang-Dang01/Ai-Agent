from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import chat, docs

app = FastAPI(
    title="AI-Gia-Su API", 
    description="Backend for AI Tutor using FastAPI", 
    version="1.0.0"
)

# Cấu hình CORS để cho phép Frontend (cổng 3000) gọi Backend (cổng 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Hoặc ["http://localhost:3000", "http://127.0.0.1:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các routes từ thư mục api/v1
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(docs.router, prefix="/api/v1/docs", tags=["Documents"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI-Gia-Su API! Backend is running."}
