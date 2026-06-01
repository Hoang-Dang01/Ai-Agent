from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class VersionBase(BaseModel):
    content: str
    commit_message: Optional[str] = None

class DocumentCreate(BaseModel):
    title: str
    initial_content: str
    commit_message: Optional[str] = "Initial commit"

class VersionResponse(BaseModel):
    id: UUID
    version_number: int
    content: str
    commit_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    versions: Optional[List[VersionResponse]] = []

    class Config:
        from_attributes = True

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5

class SearchResult(BaseModel):
    document_id: UUID
    version_id: UUID
    title: str
    content: str
    similarity: float

class ChatQuery(BaseModel):
    query: str
