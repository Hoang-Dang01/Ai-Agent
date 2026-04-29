from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import uvicorn
from rag_engine import process_pdf_to_vector, ask_llm

app = FastAPI(title="AI Study Hub - Deep Learning Core")

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "AI Core is running!", "model": "Llama 3 via Ollama"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # Save the uploaded PDF to vector_db folder temporarily
    file_path = f"vector_db/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Process PDF and insert to ChromaDB
    try:
        chunks_count = process_pdf_to_vector(file_path)
        return {"success": True, "message": f"Đã học xong file {file.filename} ({chunks_count} chunks)"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/ask")
def ask_question(req: ChatRequest):
    try:
        # result chứa cả reply và citations
        result = ask_llm(req.message)
        return result
    except Exception as e:
        return {"error": str(e)}

from test_generator import generate_mock_test

class TestRequest(BaseModel):
    topic: str
    num_questions: int = 5

@app.post("/generate-test")
def create_test(req: TestRequest):
    result = generate_mock_test(req.topic, req.num_questions)
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
