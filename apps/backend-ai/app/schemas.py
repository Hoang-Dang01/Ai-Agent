from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
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

class ConstraintNode(BaseModel):
    entityType: str = Field(description="The entity type being constrained, e.g. 'network', 'file', 'write', 'read'")
    entityId: str = Field(default="default", description="The specific entity identifier, e.g. 'default' or a filename")
    predicate: str = Field(description="The predicate name, e.g. 'allowed', 'exists'")
    targetValue: Any = Field(description="The target value of the constraint (boolean, string, or other types)")

class DAGTaskNode(BaseModel):
    id: str = Field(description="Unique node identifier, e.g. 'task_0', 'task_1'")
    title: str = Field(description="Human-readable title describing this task step, e.g. 'Mo Windows Notepad'")
    toolName: str = Field(description="The automation tool name to execute, e.g. 'OpenApplicationTool', 'TypeTextTool', 'ReadWindowTool'")
    args: dict = Field(default_factory=dict, description="JSON dictionary arguments matching the tool signature, e.g. {'path': 'notepad.exe'} or {'text': 'hello'}")
    dependencies: List[str] = Field(default_factory=list, description="List of parent node IDs that this task depends on, ensuring a directed acyclic workflow")

class DAGTaskGraph(BaseModel):
    goal: str = Field(description="The primary target goal statement of the user")
    tasks: List[DAGTaskNode] = Field(description="List of task nodes forming a directed acyclic graph")
    constraints: List[ConstraintNode] = Field(default_factory=list, description="Initial system constraints extracted from the goal")

# ==========================================
# PYDANTIC STRUCTURED SCHEMAS FOR TELEMETRY
# ==========================================

class AITelemetryBlock(BaseModel):
    traceId: str = Field(description="Correlation ID shared with OTEL / Langfuse")
    spanId: Optional[str] = Field(None, description="OTEL Span ID")
    parentSpanId: Optional[str] = Field(None, description="Parent Span ID")
    model: Optional[str] = Field(None, description="Model used for this request")
    promptText: str = Field("", description="Raw prompt text, empty if archiving is disabled")
    responseText: Optional[str] = Field(None, description="Raw response text, empty if archiving is disabled")
    inputTokens: Optional[int] = Field(None, description="Number of input tokens")
    outputTokens: Optional[int] = Field(None, description="Number of output tokens")
    latencyMs: Optional[int] = Field(None, description="Latency in milliseconds")
    status: str = Field("SUCCESS", description="SUCCESS or FAILED")
    errorType: Optional[str] = Field(None, description="Sanitized error type: RATE_LIMIT | TIMEOUT | VALIDATION | PROVIDER_ERROR | UNKNOWN")
    errorMessage: Optional[str] = Field(None, description="Sanitized error message")

class GoalPlanningResponse(BaseModel):
    graph: DAGTaskGraph
    telemetry: AITelemetryBlock

class CriticResponse(BaseModel):
    rootCause: str
    confidence: float
    requiresReplanning: bool

class ReplanResponse(BaseModel):
    suggestedTool: str
    arguments: Dict[str, Any]
    reason: str

class CriticTelemetryResponse(BaseModel):
    critic: CriticResponse
    telemetry: AITelemetryBlock

class ReplanTelemetryResponse(BaseModel):
    replan: ReplanResponse
    telemetry: AITelemetryBlock

