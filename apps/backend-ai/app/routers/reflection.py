from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Dict, Any, Optional
import time
import uuid
import json

import app.schemas as schemas
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

class ReplanRequest(BaseModel):
    originalGoal: str
    failedTask: str
    criticDiagnostic: str
    availableToolsSchema: str

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


@router.post("/critic", response_model=schemas.CriticTelemetryResponse)
def get_critic_diagnosis(
    req: CriticRequest,
    x_trace_id: Optional[str] = Header(None, alias="X-Trace-Id"),
    x_span_id: Optional[str] = Header(None, alias="X-Span-Id"),
    x_parent_span_id: Optional[str] = Header(None, alias="X-Parent-Span-Id")
):
    """
    Lấy prompt chẩn đoán lỗi chi tiết để gửi cho bộ não AI suy luận nguyên nhân (Critic Engine) kèm telemetry.
    """
    start_time = time.perf_counter()
    trace_id = x_trace_id or str(uuid.uuid4())
    span_id = x_span_id or str(uuid.uuid4())
    
    try:
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
        parsed_critic = Critic.parse_diagnostic_response(simulated_diag)
        
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        
        telemetry = schemas.AITelemetryBlock(
            traceId=trace_id,
            spanId=span_id,
            parentSpanId=x_parent_span_id,
            model="gemini-1.5-flash",
            promptText=prompt,
            responseText=simulated_diag,
            inputTokens=len(prompt) // 4,
            outputTokens=len(simulated_diag) // 4,
            latencyMs=latency_ms,
            status="SUCCESS"
        )
        
        return schemas.CriticTelemetryResponse(critic=parsed_critic, telemetry=telemetry)
    except Exception as e:
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        error_msg = str(e)
        telemetry = schemas.AITelemetryBlock(
            traceId=trace_id,
            spanId=span_id,
            parentSpanId=x_parent_span_id,
            model="gemini-1.5-flash",
            promptText="",
            responseText="",
            inputTokens=0,
            outputTokens=0,
            latencyMs=latency_ms,
            status="FAILED",
            errorType="UNKNOWN",
            errorMessage=error_msg
        )
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/replan", response_model=schemas.ReplanTelemetryResponse)
def get_replanner_correction(
    req: ReplanRequest,
    x_trace_id: Optional[str] = Header(None, alias="X-Trace-Id"),
    x_span_id: Optional[str] = Header(None, alias="X-Span-Id"),
    x_parent_span_id: Optional[str] = Header(None, alias="X-Parent-Span-Id")
):
    """
    Tái lập lộ trình hoặc đề xuất công cụ khắc phục lỗi (Replanner Engine) kèm telemetry.
    """
    start_time = time.perf_counter()
    trace_id = x_trace_id or str(uuid.uuid4())
    span_id = x_span_id or str(uuid.uuid4())
    
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
        parsed_replan = Replanner.parse_replan_response(simulated_raw_json)
        
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        
        telemetry = schemas.AITelemetryBlock(
            traceId=trace_id,
            spanId=span_id,
            parentSpanId=x_parent_span_id,
            model="gemini-1.5-flash",
            promptText=prompt,
            responseText=simulated_raw_json,
            inputTokens=len(prompt) // 4,
            outputTokens=len(simulated_raw_json) // 4,
            latencyMs=latency_ms,
            status="SUCCESS"
        )
        
        return schemas.ReplanTelemetryResponse(replan=parsed_replan, telemetry=telemetry)
    except Exception as e:
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        error_msg = str(e)
        telemetry = schemas.AITelemetryBlock(
            traceId=trace_id,
            spanId=span_id,
            parentSpanId=x_parent_span_id,
            model="gemini-1.5-flash",
            promptText="",
            responseText="",
            inputTokens=0,
            outputTokens=0,
            latencyMs=latency_ms,
            status="FAILED",
            errorType="UNKNOWN",
            errorMessage=error_msg
        )
        raise HTTPException(status_code=500, detail=error_msg)
