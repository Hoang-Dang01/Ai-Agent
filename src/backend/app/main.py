from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router

app = FastAPI(title="Turing Loop Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nối toàn bộ Router của v1 vào ứng dụng
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "Multilayered Engine Active", "version": "2.0.0"}
