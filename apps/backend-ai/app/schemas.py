from pydantic import BaseModel, Field
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

# ==========================================
# PYDANTIC STRUCTURED SCHEMAS FOR GEMINI GRAPH
# ==========================================

class ExtractedEntity(BaseModel):
    name: str = Field(description="Name of the entity, e.g. 'Notepad', 'TypeTextTool', 'VAT code'")
    label: str = Field(description="Categorical label, e.g. 'Application', 'Tool', 'Concept', 'Organization'")
    description: Optional[str] = Field(None, description="Brief context or description of this entity")

class ExtractedRelation(BaseModel):
    source: str = Field(description="Name of the source entity")
    target: str = Field(description="Name of the target entity")
    label: str = Field(description="Verb/connection label connecting them, e.g. 'inputs_into', 'runs_on', 'defines'")

class ExtractedKnowledgeGraph(BaseModel):
    entities: List[ExtractedEntity]
    relations: List[ExtractedRelation]

# ==========================================
# PYDANTIC STRUCTURED SCHEMAS FOR PLANNER
# ==========================================

class DAGTaskNode(BaseModel):
    id: str = Field(description="Unique node identifier, e.g. 'task_0', 'task_1'")
    title: str = Field(description="Human-readable title describing this task step, e.g. 'Mo Windows Notepad'")
    toolName: str = Field(description="The automation tool name to execute, e.g. 'OpenApplicationTool', 'TypeTextTool', 'ReadWindowTool'")
    args: dict = Field(default_factory=dict, description="JSON dictionary arguments matching the tool signature, e.g. {'path': 'notepad.exe'} or {'text': 'hello'}")
    dependencies: List[str] = Field(default_factory=list, description="List of parent node IDs that this task depends on, ensuring a directed acyclic workflow")

class DAGTaskGraph(BaseModel):
    goal: str = Field(description="The primary target goal statement of the user")
    tasks: List[DAGTaskNode] = Field(description="List of task nodes forming a directed acyclic graph")
