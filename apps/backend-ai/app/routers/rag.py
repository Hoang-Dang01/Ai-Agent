from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from uuid import UUID

from app.database import get_db, AsyncSessionLocal
import app.models as models
import app.schemas as schemas
import app.services.rag_service as rag_service
import app.services.graph_service as graph_service

router = APIRouter(prefix="/api/rag", tags=["RAG Document Core"])

# ==========================================
# BACKGROUND TASK: ASYNC EMBEDDING CALCULATOR
# ==========================================

async def calculate_and_save_embedding(version_id: UUID, content: str):
    """
    Tính toán vector ẩn không đồng bộ (background task) để không gây block luồng chính HTTP.
    """
    print(f"[RAG Background] Khởi động tính toán embedding cho Version: {version_id}...")
    async with AsyncSessionLocal() as db:
        try:
            vector = await rag_service.generate_embedding(content)
            
            # Kiểm duyệt xem embedding đã tồn tại chưa
            result = await db.execute(
                select(models.Embedding).where(models.Embedding.version_id == version_id)
            )
            db_embedding = result.scalars().first()
            
            if db_embedding:
                db_embedding.embedding = vector
                db_embedding.model_name = "text-embedding-004"
            else:
                db_embedding = models.Embedding(
                    version_id=version_id,
                    embedding=vector,
                    model_name="text-embedding-004"
                )
                db.add(db_embedding)
                
            await db.commit()
            print(f"[RAG Background] Hoàn tất và lưu trữ vector cho Version {version_id} thành công.")
            
            # Đồng thời kích hoạt trích xuất GraphRAG Core không đồng bộ
            await graph_service.extract_and_save_graph(version_id, content)
        except Exception as e:
            await db.rollback()
            print(f"[RAG Background] Lỗi tính toán vector cho Version {version_id}: {e}")

# ==========================================
# ENDPOINTS ĐIỀU HÀNH TÀI LIỆU RAG
# ==========================================

@router.get("/documents/", response_model=List[schemas.DocumentResponse])
async def get_all_documents(db: AsyncSession = Depends(get_db)):
    """
    Lấy danh sách tất cả tài liệu kèm toàn bộ lịch sử các phiên bản.
    """
    try:
        result = await db.execute(
            select(models.Document).order_by(desc(models.Document.updated_at))
        )
        docs = result.scalars().all()
        
        # Nạp động các phiên bản của tài liệu tương ứng
        for doc in docs:
            version_result = await db.execute(
                select(models.Version)
                .where(models.Version.document_id == doc.id)
                .order_by(models.Version.version_number.asc())
            )
            doc.versions = version_result.scalars().all()
            
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{document_id}", response_model=schemas.DocumentResponse)
async def get_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Lấy chi tiết một tài liệu kèm tất cả phiên bản.
    """
    result = await db.execute(
        select(models.Document).where(models.Document.id == document_id)
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    version_result = await db.execute(
        select(models.Version)
        .where(models.Version.document_id == doc.id)
        .order_by(models.Version.version_number.asc())
    )
    doc.versions = version_result.scalars().all()
    return doc


@router.post("/documents/", response_model=schemas.DocumentResponse)
async def create_document(
    doc: schemas.DocumentCreate, 
    background_tasks: BackgroundTasks, 
    db: AsyncSession = Depends(get_db)
):
    """
    Khởi tạo tài liệu mới. Commits phiên bản 1 ngay lập tức và đưa việc tính vector nhúng vào hàng đợi ngầm.
    """
    try:
        db_doc = models.Document(title=doc.title)
        db.add(db_doc)
        await db.flush() 
        
        db_version = models.Version(
            document_id=db_doc.id,
            version_number=1,
            content=doc.initial_content,
            commit_message=doc.commit_message
        )
        db.add(db_version)
        await db.flush()
        
        # Gửi tác vụ tính vector nhúng xuống luồng ngầm bất đồng bộ
        background_tasks.add_task(
            calculate_and_save_embedding, 
            version_id=db_version.id, 
            content=doc.initial_content
        )
        
        await db.commit()
        await db.refresh(db_doc)
        
        # Gán versions để khớp kiểu trả về
        db_doc.versions = [db_version]
        return db_doc
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/documents/{document_id}/versions/", response_model=schemas.VersionResponse)
async def append_version(
    document_id: UUID, 
    version: schemas.VersionBase, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Nạp thêm phiên bản mới cho tài liệu (lưu nội dung đầy đủ). Đưa việc tính vector nhúng của phiên bản mới vào hàng đợi ngầm.
    """
    try:
        result = await db.execute(
            select(models.Version)
            .where(models.Version.document_id == document_id)
            .order_by(desc(models.Version.version_number))
            .limit(1)
        )
        latest_version = result.scalars().first()
        if not latest_version:
            raise HTTPException(status_code=404, detail="Document not found")
            
        next_version_num = latest_version.version_number + 1
        
        db_version = models.Version(
            document_id=document_id,
            version_number=next_version_num,
            content=version.content,
            commit_message=version.commit_message
        )
        db.add(db_version)
        await db.flush()
        
        # Gửi tác vụ tính vector nhúng xuống luồng ngầm bất đồng bộ
        background_tasks.add_task(
            calculate_and_save_embedding, 
            version_id=db_version.id, 
            content=version.content
        )
        
        # Cập nhật thời gian làm mới tài liệu
        await db.execute(
            models.Document.__table__.update()
            .where(models.Document.id == document_id)
            .values(updated_at=db_version.created_at)
        )
        
        await db.commit()
        await db.refresh(db_version)
        return db_version
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search/", response_model=List[schemas.SearchResult])
async def semantic_search(search: schemas.SearchQuery, db: AsyncSession = Depends(get_db)):
    """
    Tìm kiếm ngữ nghĩa sử dụng khoảng cách Cosine trên cột pgvector.
    """
    try:
        query_vector = await rag_service.generate_embedding(search.query)
        distance = models.Embedding.embedding.cosine_distance(query_vector).label("distance")
        
        # Tìm kiếm phiên bản gần nhất và tính độ khớp ngữ nghĩa
        result = await db.execute(
            select(models.Document.id, models.Document.title, models.Version.id, models.Version.content, distance)
            .join(models.Version, models.Document.id == models.Version.document_id)
            .join(models.Embedding, models.Version.id == models.Embedding.version_id)
            .distinct(models.Document.id)
            .order_by(models.Document.id, models.Version.version_number.desc())
        )
        
        rows = result.all()
        # Sắp xếp các tài liệu khớp nhất và giới hạn số lượng top_k
        sorted_rows = sorted(rows, key=lambda x: x.distance)[:search.top_k]
        
        return [
            schemas.SearchResult(
                document_id=row[0], 
                title=row[1], 
                version_id=row[2], 
                content=row[3], 
                similarity=1.0 - float(row[4])
            )
            for row in sorted_rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/")
async def chat_with_docs(chat: schemas.ChatQuery, db: AsyncSession = Depends(get_db)):
    """
    Trò chuyện RAG ngữ cảnh. Truy xuất top 3 tài liệu tương đồng nhất, làm giàu ngữ cảnh và trích xuất trích dẫn.
    """
    try:
        search_req = schemas.SearchQuery(query=chat.query, top_k=3)
        search_results = await semantic_search(search_req, db)
        
        if not search_results:
            return {
                "response": "Hiện tại tôi chưa có tài liệu nào trong Kho Trí Thức để trả lời câu hỏi này.", 
                "sources": []
            }
            
        # Lấy tối đa 15 liên kết chòm sao cận kề từ đồ thị tri thức (GraphRAG)
        version_ids = [r.version_id for r in search_results]
        relations = await graph_service.get_neighborhood_graph(db, version_ids, limit=15)
        
        relations_context = ""
        if relations:
            relations_lines = []
            for rel in relations:
                relations_lines.append(
                    f"- [{rel['source']}] --({rel['relation']})--> [{rel['target']}] ({rel['source_label']} -> {rel['target_label']})"
                )
            relations_context = "Mối quan hệ thực thể (Đồ thị tri thức):\n" + "\n".join(relations_lines)
            
        context_parts = [f"Tài liệu '{r.title}': {r.content}" for r in search_results]
        context = "\n\n---\n\n".join(context_parts)
        
        if relations_context:
            context += f"\n\n---\n\n{relations_context}"
        
        answer = await rag_service.generate_chat_response(chat.query, context)
        
        return {
            "response": answer,
            "sources": [{"title": r.title, "document_id": str(r.document_id)} for r in search_results]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
