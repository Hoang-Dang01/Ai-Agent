from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.services.reflection.verifier.rule_verifier import RuleVerifier
from app.services.reflection.critic.critic import Critic
from app.services.reflection.replanner.replanner import Replanner

router = APIRouter(prefix="/api/reflection", tags=["Reflection Engine"])

# ==========================================
# 1. SCHEMAS ĐẦU VÀO / ĐẦU RA (Pydantic Models)
# ==========================================

class VerifyRequest(BaseModel):
    toolName: str
    toolOutput: str
    activeWindow: str
    currentApp: str
    args: Dict[str, Any]

class CriticRequest(BaseModel):
    taskTitle: str
    toolName: str
    toolArgs: Dict[str, Any]
    toolOutput: str
    activeWindow: str
    ruleReason: str

class CriticResponse(BaseModel):
    rootCause: str
    confidence: float
    requiresReplanning: bool

class ReplanRequest(BaseModel):
    originalGoal: str
    failedTask: str
    criticDiagnostic: str
    availableToolsSchema: str

class ReplanResponse(BaseModel):
    suggestedTool: str
    arguments: Dict[str, Any]
    reason: str

# ==========================================
# 2. ENDPOINTS ĐIỀU HÀNH NHẬN THỨC
# ==========================================

@router.post("/verify")
def verify_action(req: VerifyRequest):
    """
    Xác minh nhanh kết quả thực thi dựa trên các bộ luật cứng (Rule-Based Verifier).
    """
    try:
        result = RuleVerifier.verify_action(
            tool_name=req.toolName,
            tool_output=req.toolOutput,
            active_window=req.activeWindow,
            current_app=req.currentApp,
            args=req.args
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/critic", response_model=CriticResponse)
def get_critic_diagnosis(req: CriticRequest):
    """
    Lấy prompt chẩn đoán lỗi chi tiết để gửi cho bộ não AI suy luận nguyên nhân (Critic Engine).
    """
    try:
        # Trong môi trường thực tế, router này có thể trực tiếp gọi mô hình ONNX / Local LLM.
        # Ở đây chúng tôi sinh prompt mẫu hoặc trả về chẩn đoán nhanh.
        prompt = Critic.generate_diagnostic_prompt(
            task_title=req.taskTitle,
            tool_name=req.toolName,
            tool_args=req.toolArgs,
            tool_output=req.toolOutput,
            active_window=req.activeWindow,
            rule_reason=req.ruleReason
        )
        
        # Mô phỏng phản hồi chẩn đoán tự động từ mô hình cục bộ
        simulated_diag = f"Phát hiện sai sót: Thao tác '{req.toolName}' trên cửa sổ '{req.activeWindow}' không đạt được đích mong muốn do sai lệch tham số hoặc ứng dụng chưa phản hồi kịp."
        
        return Critic.parse_diagnostic_response(simulated_diag)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/replan", response_model=ReplanResponse)
def get_replanner_correction(req: ReplanRequest):
    """
    Tái lập lộ trình hoặc đề xuất công cụ khắc phục lỗi (Replanner Engine).
    """
    try:
        prompt = Replanner.generate_replan_prompt(
            original_goal=req.originalGoal,
            failed_task=req.failedTask,
            critic_diagnostic=req.criticDiagnostic,
            available_tools_schema=req.availableToolsSchema
        )
        
        # Mô phỏng sinh kế hoạch thay thế từ mô hình
        simulated_raw_json = """
        {
          "suggestedTool": "OpenApplicationTool",
          "arguments": {
             "exePath": "notepad.exe"
          },
          "reason": "Tự động khởi chạy lại ứng dụng Notepad để khôi phục trạng thái làm việc sạch."
        }
        """
        
        return Replanner.parse_replan_response(simulated_raw_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
