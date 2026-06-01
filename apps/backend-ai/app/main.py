import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import reflection

app = FastAPI(
    title="Offline Agent Backend AI Services",
    description="Cognitive services including rule-based and LLM-based reflection layers for Offline AI Agent",
    version="1.0.0"
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

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "Offline Agent Backend AI Services",
        "supported_features": ["rule-verification", "critic-diagnostics", "replanning"]
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
