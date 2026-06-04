import os
import hashlib
import tempfile
import filetype
from fastapi import HTTPException
from markitdown import MarkItDown

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")

# Ensure storage directory exists
if not os.path.exists(STORAGE_DIR):
    os.makedirs(STORAGE_DIR, exist_ok=True)

ALLOWED_MIMES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/markdown"
}

class DocumentIngestionService:
    def __init__(self):
        self.markitdown = MarkItDown()

    def validate_file(self, file_bytes: bytes, file_name: str) -> str:
        # 1. Size Check
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File size exceeds limit of {MAX_FILE_SIZE / (1024*1024)} MB."
            )
        
        # 2. MIME Verification
        kind = filetype.guess(file_bytes)
        mime = kind.mime if kind else None
        ext = os.path.splitext(file_name)[1].lower()
        if not mime:
            if ext in {".txt", ".md"}:
                mime = "text/plain"
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to identify file type for '{file_name}'."
                )
        
        if mime not in ALLOWED_MIMES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type '{mime}'. Allowed: PDF, DOCX, PPTX, XLSX, TXT, MD."
            )

        # 3. Content Hash Computation (SHA-256)
        return hashlib.sha256(file_bytes).hexdigest()

    def convert_to_markdown(self, file_bytes: bytes, file_name: str) -> str:
        """
        Writes file bytes to temporary file, converts it via MarkItDown, and deletes temp file.
        """
        suffix = os.path.splitext(file_name)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        try:
            result = self.markitdown.convert(temp_path)
            return result.text_content
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"MarkItDown conversion error: {str(e)}"
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def write_to_storage(self, file_id: str, content: str) -> str:
        """
        Saves Markdown text output to local filesystem storage.
        """
        file_path = os.path.join(STORAGE_DIR, f"{file_id}.md")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return file_path

document_ingestion_service = DocumentIngestionService()
