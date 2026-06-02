from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import app.schemas as schemas
import app.services.planner_service as planner_service

router = APIRouter(prefix="/api/plan", tags=["Cognitive Planner Core"])

class GoalPlanningRequest(BaseModel):
    goal: str

@router.post("/generate", response_model=schemas.DAGTaskGraph)
async def generate_plan(req: GoalPlanningRequest):
    """
    Tiếp nhận mục tiêu thô của người dùng, phân tích và xuất đồ thị nhiệm vụ (DAG Task Graph) cấu trúc.
    """
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal statement cannot be empty")
        
    try:
        plan = await planner_service.generate_dag_plan(req.goal)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
