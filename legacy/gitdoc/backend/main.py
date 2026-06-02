from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from database import get_db, engine, Base
import models
import schemas
import ai_service

app = FastAPI(title="GitDoc MVP")

@app.get("/documents/", response_model=List[schemas.DocumentResponse])
async def get_all_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Document).order_by(desc(models.Document.updated_at))
    )
    docs = result.scalars().all()
    for doc in docs:
        version_result = await db.execute(
            select(models.Version).where(models.Version.document_id == doc.id).order_by(models.Version.version_number.asc())
        )
        doc.versions = version_result.scalars().all()
    return docs

@app.get("/documents/{document_id}", response_model=schemas.DocumentResponse)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Document).where(models.Document.id == document_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    version_result = await db.execute(
        select(models.Version).where(models.Version.document_id == doc.id).order_by(models.Version.version_number.asc())
    )
    doc.versions = version_result.scalars().all()
    return doc

@app.post("/documents/", response_model=schemas.DocumentResponse)
async def create_document(doc: schemas.DocumentCreate, db: AsyncSession = Depends(get_db)):
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
    
    vector = await ai_service.generate_embedding(doc.initial_content)
    db_embedding = models.Embedding(version_id=db_version.id, embedding=vector)
    db.add(db_embedding)
    
    await db.commit()
    await db.refresh(db_doc)
    return db_doc

@app.post("/documents/{document_id}/versions/", response_model=schemas.VersionResponse)
async def append_version(document_id: str, version: schemas.VersionBase, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Version).where(models.Version.document_id == document_id).order_by(desc(models.Version.version_number)).limit(1)
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
    
    vector = await ai_service.generate_embedding(version.content)
    db_embedding = models.Embedding(version_id=db_version.id, embedding=vector)
    db.add(db_embedding)
    
    await db.execute(
        models.Document.__table__.update().where(models.Document.id == document_id).values(updated_at=db_version.created_at)
    )
    
    await db.commit()
    await db.refresh(db_version)
    return db_version

@app.post("/search/", response_model=List[schemas.SearchResult])
async def semantic_search(search: schemas.SearchQuery, db: AsyncSession = Depends(get_db)):
    query_vector = await ai_service.generate_embedding(search.query)
    distance = models.Embedding.embedding.cosine_distance(query_vector).label("distance")
    
    result = await db.execute(
        select(models.Document.id, models.Document.title, models.Version.id, models.Version.content, distance)
        .join(models.Version, models.Document.id == models.Version.document_id)
        .join(models.Embedding, models.Version.id == models.Embedding.version_id)
        .distinct(models.Document.id)
        .order_by(models.Document.id, models.Version.version_number.desc())
    )
    
    rows = result.all()
    sorted_rows = sorted(rows, key=lambda x: x.distance)[:search.top_k]
    
    return [
        schemas.SearchResult(
            document_id=row[0], title=row[1], version_id=row[2], content=row[3], similarity=1.0 - row[4]
        )
        for row in sorted_rows
    ]

@app.post("/chat/")
async def chat_with_docs(chat: schemas.ChatQuery, db: AsyncSession = Depends(get_db)):
    search_req = schemas.SearchQuery(query=chat.query, top_k=3)
    search_results = await semantic_search(search_req, db)
    
    if not search_results:
        return {"response": "I don't have any documents to answer that yet.", "sources": []}
        
    context_parts = [f"Document '{r.title}': {r.content}" for r in search_results]
    context = "\n\n---\n\n".join(context_parts)
    
    answer = await ai_service.generate_chat_response(chat.query, context)
    
    return {
        "response": answer,
        "sources": [{"title": r.title, "document_id": r.document_id} for r in search_results]
    }
