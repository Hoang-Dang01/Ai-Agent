import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
import app.models as models
import app.schemas as schemas
from app.services.document_ingestion import document_ingestion_service
from app.services.job_dispatcher import job_dispatcher

logger = logging.getLogger("fastapi.document_agent")

router = APIRouter(prefix="/api/document-agent", tags=["Document Agent"])

async def process_async_embedding_job(version_id: UUID, content: str, doc_id: UUID):
    """
    Background job that wraps pgvector embedding computation and updates DocumentStatus.
    """
    from app.database import AsyncSessionLocal
    from app.routers.rag import calculate_and_save_embedding
    
    async with AsyncSessionLocal() as db:
        try:
            # Update status to PROCESSING
            await db.execute(
                models.Document.__table__.update()
                .where(models.Document.id == doc_id)
                .values(status=models.DocumentStatus.PROCESSING)
            )
            await db.commit()
            
            # Execute pgvector embedding calculation
            await calculate_and_save_embedding(version_id, content)
            
            # Update status to INDEXED
            await db.execute(
                models.Document.__table__.update()
                .where(models.Document.id == doc_id)
                .values(status=models.DocumentStatus.INDEXED)
            )
            await db.commit()
            logger.info(f"[DocumentAgent Telemetry] DOCUMENT_INDEXED: {doc_id}")
        except Exception as err:
            logger.error(f"[DocumentAgent Telemetry] DOCUMENT_FAILED: {doc_id}. Error: {str(err)}")
            # Update status to FAILED
            await db.execute(
                models.Document.__table__.update()
                .where(models.Document.id == doc_id)
                .values(status=models.DocumentStatus.FAILED)
            )
            await db.commit()

@router.post("/upload/", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    commit_message: str = Form("Initial upload"),
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db)
):
    file_bytes = await file.read()
    
    # 1. Validation & Hash Calculation (SHA-256)
    content_hash = document_ingestion_service.validate_file(file_bytes, file.filename)
    
    # 2. Check Deduplication
    existing = await db.execute(
        select(models.Document).where(models.Document.content_hash == content_hash)
    )
    db_doc = existing.scalars().first()
    if db_doc:
        logger.info(f"[DocumentAgent Telemetry] DOCUMENT_DEDUPLICATED: Reusing document ID {db_doc.id}")
        
        # Load associated versions to construct response
        version_result = await db.execute(
            select(models.Version)
            .where(models.Version.document_id == db_doc.id)
            .order_by(models.Version.version_number.desc())
        )
        db_doc.versions = version_result.scalars().all()
        return db_doc
    
    # 3. Convert via MarkItDown
    markdown_content = document_ingestion_service.convert_to_markdown(file_bytes, file.filename)
    if not markdown_content.strip():
        raise HTTPException(status_code=400, detail="Document could not be parsed or is empty.")
    
    try:
        # 4. Save metadata to DB
        db_doc = models.Document(
            title=file.filename, 
            status=models.DocumentStatus.PENDING,
            content_hash=content_hash,
            file_size=len(file_bytes)
        )
        db.add(db_doc)
        await db.flush() 
        
        # Write markdown text output to local disk storage (TOAST protection)
        storage_path = document_ingestion_service.write_to_storage(str(db_doc.id), markdown_content)
        db_doc.storage_path = storage_path
        
        db_version = models.Version(
            document_id=db_doc.id,
            version_number=1,
            content="[Stored in Filesystem]",  # Skip database text bloat
            commit_message=commit_message
        )
        db.add(db_version)
        await db.flush()
        
        # Commit SQL Transaction first to make DB records visible
        await db.commit()
        logger.info(f"[DocumentAgent Telemetry] DOCUMENT_UPLOADED: {db_doc.id}")
        
        # Enqueue embedding job via abstract JobDispatcher
        job_dispatcher.enqueue_embedding_job(
            version_id=db_version.id,
            content=markdown_content,
            doc_id=db_doc.id,
            background_tasks=background_tasks
        )
        
        return schemas.DocumentResponse(
            id=db_doc.id,
            title=db_doc.title,
            created_at=db_doc.created_at,
            updated_at=db_doc.updated_at,
            versions=[
                schemas.VersionResponse(
                    id=db_version.id,
                    version_number=db_version.version_number,
                    content=markdown_content, # Return parsed content to the API client
                    commit_message=db_version.commit_message,
                    created_at=db_version.created_at
                )
            ]
        )
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
