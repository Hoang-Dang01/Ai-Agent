from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import uuid

import app.schemas as schemas
import app.services.planner_service as planner_service

router = APIRouter(prefix="/api/plan", tags=["Cognitive Planner Core"])

class GoalPlanningRequest(BaseModel):
    goal: str

@router.post("/generate", response_model=schemas.GoalPlanningResponse)
async def generate_plan(
    req: GoalPlanningRequest,
    x_trace_id: Optional[str] = Header(None, alias="X-Trace-Id"),
    x_span_id: Optional[str] = Header(None, alias="X-Span-Id"),
    x_parent_span_id: Optional[str] = Header(None, alias="X-Parent-Span-Id")
):
    """
    Tiếp nhận mục tiêu thô của người dùng, phân tích và xuất đồ thị nhiệm vụ (DAG Task Graph) cùng với dữ liệu telemetry.
    """
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal statement cannot be empty")
        
    trace_id = x_trace_id or str(uuid.uuid4())
    span_id = x_span_id or str(uuid.uuid4())
        
    try:
        response_data = await planner_service.generate_dag_plan_with_telemetry(
            goal=req.goal,
            trace_id=trace_id,
            span_id=span_id,
            parent_span_id=x_parent_span_id
        )
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
