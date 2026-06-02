import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

import asyncio
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import reflection, rag, graph, planner
import app.models as models  # Đảm bảo import để SQLAlchemy đăng ký các bảng
import app.services.event_bus_service as event_bus_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Quản lý vòng đời (lifespan) của FastAPI: thay thế cho các sự kiện
    startup/shutdown đã bị deprecated từ phiên bản 0.93.
    """
    print("[Startup] Khởi động hệ thống nhận thức Offline Agent AI...")
    
    # 1. Đồng bộ cấu trúc cơ sở dữ liệu (Dev Convenience)
    try:
        async with engine.begin() as conn:
            # Kích hoạt phần mở rộng pgvector bên trong Postgres
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            # Tạo các bảng ORM nếu chưa tồn tại
            await conn.run_sync(Base.metadata.create_all)
        print("[Startup] Cấu trúc cơ sở dữ liệu RAG đã đồng bộ thành công.")
    except Exception as e:
        print(f"[Startup Warning] Lỗi khi tạo bảng khởi động: {e}. Hãy đảm bảo cơ sở dữ liệu Postgres đã trực tuyến.")

    # 2. Khởi động vòng lặp Event Bus Redis ngầm dưới nền (GIL-safe Async IO)
    await event_bus_service.initialize()
    asyncio.create_task(event_bus_service.start_listener())

    yield

    # 3. Đóng an toàn các kết nối Redis
    await event_bus_service.close()

app = FastAPI(
    title="Offline Agent Backend AI Services",
    description="Cognitive services including rule-based and LLM-based reflection layers for Offline AI Agent",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS để cho phép Orchestrator và Frontend tương tác mượt mà
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các router nghiệp vụ
app.include_router(reflection.router)
app.include_router(rag.router)
app.include_router(graph.router)
app.include_router(planner.router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "Offline Agent Backend AI Services",
        "supported_features": [
            "rule-verification", 
            "critic-diagnostics", 
            "replanning",
            "rag-document-management",
            "semantic-vector-search",
            "contextual-gemini-rag-chat"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

