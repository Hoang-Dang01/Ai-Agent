from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from uuid import UUID

from app.database import get_db
import app.models as models
import app.services.graph_service as graph_service

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph Core"])

class GraphIngestRequest(BaseModel):
    versionId: UUID

@router.get("/data")
async def get_graph_data(db: AsyncSession = Depends(get_db)):
    """
    Trả về toàn bộ các nút (nodes) và liên kết (links) thực tế trong database
    định dạng chuẩn hóa sẵn sàng cho việc kết xuất đồ thị 3D phía Client.
    """
    try:
        nodes_result = await db.execute(select(models.GraphNode))
        edges_result = await db.execute(select(models.GraphEdge))
        
        nodes = nodes_result.scalars().all()
        edges = edges_result.scalars().all()
        
        # Biến đổi nodes khớp với giao diện hiển thị 3D
        node_list = []
        for n in nodes:
            node_list.append({
                "id": str(n.id),
                "name": n.name,
                "label": n.label,
                "val": 16 if n.label == "Tool" else 12 if n.label == "Application" else 8,
                "description": n.properties or ""
            })
            
        # Biến đổi links khớp với các cung nối (edges) trong 3D
        link_list = []
        for e in edges:
            link_list.append({
                "id": str(e.id),
                "source": str(e.source_id),
                "target": str(e.target_id),
                "label": e.label
            })
            
        return {
            "nodes": node_list,
            "links": link_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest")
async def manual_ingest_graph(
    req: GraphIngestRequest, 
    background_tasks: BackgroundTasks, 
    db: AsyncSession = Depends(get_db)
):
    """
    Kích hoạt trích xuất đồ thị thủ công cho một phiên bản tài liệu cụ thể.
    Chạy bất đồng bộ ngầm dưới nền qua BackgroundTasks có idempotency check.
    """
    result = await db.execute(
        select(models.Version).where(models.Version.id == req.versionId)
    )
    version = result.scalars().first()
    if not version:
        raise HTTPException(status_code=404, detail="Document version not found")
        
    background_tasks.add_task(
        graph_service.extract_and_save_graph,
        version_id=version.id,
        content=version.content
    )
    
    return {
        "status": "OK",
        "message": "Graph extraction background task scheduled successfully."
    }
