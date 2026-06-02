import asyncio
import os
import sys
from sqlalchemy import select, delete, text

# Add root path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import AsyncSessionLocal, engine, Base
import app.models as models
import app.services.rag_service as rag_service

async def run_semantic_test():
    print("==================================================================")
    print("   STARTING AUTOMATED SEMANTIC SEARCH VERIFICATION TEST (RAG)")
    print("==================================================================")
    
    # Khoi tạo cấu trúc bảng database cho phien kiem thu neu chua co
    print("[Test DB] Synchronizing database tables schema...")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.run_sync(Base.metadata.create_all)
        print("[Test DB] Schema ready.")
    except Exception as e:
        print(f"[Test DB Warning] Error during schema creation: {e}")

    async with AsyncSessionLocal() as db:
        try:
            # 1. Clean up old test data
            print("[Test DB] Cleaning up old test records...")
            await db.execute(delete(models.Document).where(models.Document.title.like("TEST_DOC_%")))
            await db.commit()

            # 2. Ingest two conceptually distinct documents
            title_a = "TEST_DOC_Medstand_ERP"
            content_a = "Medstand ERP system instructions: Users must input VAT registration codes inside the finance panel."
            
            title_b = "TEST_DOC_Personal_Tax"
            content_b = "Personal tax and social insurance guidelines for corporate contractors."

            print(f"[Test Ingest] Saving Document A: '{title_a}'")
            doc_a = models.Document(title=title_a)
            db.add(doc_a)
            await db.flush()

            ver_a = models.Version(document_id=doc_a.id, version_number=1, content=content_a, commit_message="Initial test A")
            db.add(ver_a)
            await db.flush()

            print(f"[Test Embedding] Calculating embedding for Document A...")
            vector_a = await rag_service.generate_embedding(content_a)
            embed_a = models.Embedding(version_id=ver_a.id, embedding=vector_a, model_name="text-embedding-004")
            db.add(embed_a)

            print(f"[Test Ingest] Saving Document B: '{title_b}'")
            doc_b = models.Document(title=title_b)
            db.add(doc_b)
            await db.flush()

            ver_b = models.Version(document_id=doc_b.id, version_number=1, content=content_b, commit_message="Initial test B")
            db.add(ver_b)
            await db.flush()

            print(f"[Test Embedding] Calculating embedding for Document B...")
            vector_b = await rag_service.generate_embedding(content_b)
            embed_b = models.Embedding(version_id=ver_b.id, embedding=vector_b, model_name="text-embedding-004")
            db.add(embed_b)

            await db.commit()
            print("[Test DB] Ingestion complete. Vector embeddings committed to pgvector.")

            # 3. Query conceptually related search term
            query = "finance panel registration guide"
            print(f"\n[Test Query] Querying semantic search: '{query}'")
            query_vector = await rag_service.generate_embedding(query)
            
            # cosine distance match
            distance = models.Embedding.embedding.cosine_distance(query_vector).label("distance")
            result = await db.execute(
                select(models.Document.title, models.Version.content, distance)
                .join(models.Version, models.Document.id == models.Version.document_id)
                .join(models.Embedding, models.Version.id == models.Embedding.version_id)
                .where(models.Document.title.like("TEST_DOC_%"))
                .order_by(distance.asc())
            )
            
            rows = result.all()
            
            print("\n---------------- SEMANTIC SEARCH RESULTS ----------------")
            for idx, row in enumerate(rows):
                title, content, dist = row
                similarity = 1.0 - float(dist)
                print(f"Rank {idx + 1}: {title} | Similarity: {similarity:.4f} | Content: {content}")
            print("---------------------------------------------------------\n")

            # 4. Verify results
            assert len(rows) > 0, "ERROR: No test documents retrieved from database."
            
            best_match_title = rows[0][0]
            best_match_similarity = 1.0 - float(rows[0][2])
            
            # Document A must rank first since the query is related to ERP finance registration
            assert best_match_title == title_a, f"VALIDATION ERROR: Got '{best_match_title}' as rank 1, but expected '{title_a}'"
            print(f"[SUCCESS] Semantic match aligned perfectly. Document A ranked first.")
            print(f"[SUCCESS] Similarity score: {best_match_similarity:.4f} (passed criteria).")
            
            # 5. Cleanup test data
            print("\n[Test Cleanup] Deleting test records from database...")
            await db.execute(delete(models.Document).where(models.Document.title.like("TEST_DOC_%")))
            await db.commit()
            print("[Test Cleanup] Cleanup complete. Database restored.")
            
        except Exception as e:
            await db.rollback()
            print(f"[FAILED] Semantic RAG test encountered an error: {e}")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_semantic_test())
