from pydantic import BaseModel, Field
from typing import List, Optional

class AgentStep(BaseModel):
    agent_id: str = Field(..., description="Mã Đặc vụ (vd: Agent_07)")
    action: str = Field(..., description="Hành động đang thực hiện")
    status: str = Field("success", description="Trạng thái (success, fail, running)")
    output: Optional[str] = Field(None, description="Kết quả của hành động")

class ChatRequest(BaseModel):
    message: str = Field(..., description="Câu hỏi hoặc yêu cầu từ người dùng")
    session_id: Optional[str] = Field(None, description="ID phiên làm việc để duy trì Context")

class ChatResponse(BaseModel):
    status: str = Field("success", description="Trạng thái phản hồi")
    reply: str = Field(..., description="Câu trả lời cuối cùng từ bầy Đặc vụ")
    confidence_score: float = Field(..., description="Điểm tin cậy do Agent 10 chấm")
    steps: List[AgentStep] = Field(default_factory=list, description="Truy vết luồng suy nghĩ của các Đặc vụ")
