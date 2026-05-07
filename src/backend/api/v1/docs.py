from fastapi import APIRouter

router = APIRouter()

@router.post("/upload")
def upload_document():
    # Logic xử lý upload và xử lý tài liệu RAG sẽ viết ở đây
    return {"status": "success", "message": "API Upload tài liệu đã sẵn sàng!"}
