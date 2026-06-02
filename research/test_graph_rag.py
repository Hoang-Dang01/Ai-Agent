import asyncio
import os
import sys
from sqlalchemy import select, delete, text
from uuid import UUID

# Add root path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import AsyncSessionLocal, engine, Base
import app.models as models
import app.services.graph_service as graph_service

async def run_graph_test():
    print("==================================================================")
    print("   STARTING AUTOMATED GraphRAG RPGM & CONCURRENCY SYSTEM TEST")
    print("==================================================================")
    
    # 1. Initialize schema
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
            # 2. Clean up old test data
            print("[Test DB] Cleaning up old test records...")
            await db.execute(delete(models.Document).where(models.Document.title.like("TEST_DOC_Graph_%")))
            await db.commit()

            # 3. Ingest a test document and version
            title = "TEST_DOC_Graph_System_Guide"
            content = "This system uses TypeTextTool to write notes. The Notepad runs on Windows operating system."
            
            print(f"[Test Ingest] Ingesting Document: '{title}'...")
            doc = models.Document(title=title)
            db.add(doc)
            await db.flush()

            ver = models.Version(document_id=doc.id, version_number=1, content=content, commit_message="Initial Graph Test")
            db.add(ver)
            await db.flush()
            await db.commit()
            
            version_id = ver.id
            print(f"[Test DB] Document created. Version ID: {version_id}")

            # ---------------------------------------------------------
            # TEST 1: Standard Extraction (Offline mode rule-based)
            # ---------------------------------------------------------
            print("\n--- TEST 1: Standard Graph Extraction ---")
            await graph_service.extract_and_save_graph(version_id, content)
            
            # Verify nodes were saved
            nodes_result = await db.execute(
                select(models.GraphNode).where(models.GraphNode.version_id == version_id)
            )
            nodes = nodes_result.scalars().all()
            print(f"[Test Result] Nodes extracted: {[n.name for n in nodes]} (Count: {len(nodes)})")
            assert len(nodes) >= 3, f"Expected at least 3 nodes, got {len(nodes)}"
            
            # Verify edges were saved
            edges_result = await db.execute(
                select(models.GraphEdge).where(models.GraphEdge.version_id == version_id)
            )
            edges = edges_result.scalars().all()
            print(f"[Test Result] Edges extracted count: {len(edges)}")
            assert len(edges) >= 2, f"Expected at least 2 edges, got {len(edges)}"
            print("[SUCCESS] Test 1: Standard Graph Extraction passed.")

            # ---------------------------------------------------------
            # TEST 2: Concurrent / Double Ingest Idempotency & Locking
            # ---------------------------------------------------------
            print("\n--- TEST 2: Concurrent Ingest Idempotency ---")
            print("[Test Lock] Triggering concurrent extraction tasks simultaneously...")
            
            # Run two extractions in parallel to simulate concurrent HTTP/Background task trigger
            task_a = graph_service.extract_and_save_graph(version_id, content)
            task_b = graph_service.extract_and_save_graph(version_id, content)
            
            await asyncio.gather(task_a, task_b)
            
            # Verify no duplicates were written (locks and delete-then-insert must maintain clean bounds)
            nodes_check = await db.execute(
                select(models.GraphNode).where(models.GraphNode.version_id == version_id)
            )
            nodes_after = nodes_check.scalars().all()
            print(f"[Test Result] Nodes count after concurrent executions: {len(nodes_after)}")
            assert len(nodes_after) == len(nodes), f"Expected exact count {len(nodes)}, got {len(nodes_after)} (duplicates detected!)"
            print("[SUCCESS] Test 2: Concurrent Ingest Idempotency Lock verified perfectly.")

            # ---------------------------------------------------------
            # TEST 3: Malformed Gemini structured response defensive fallback
            # ---------------------------------------------------------
            print("\n--- TEST 3: Malformed LLM Response Fallback ---")
            # We mock llm_structured to raise an exception, simulating Gemini connection or JSON parse failures
            original_llm_structured = graph_service.llm_structured
            original_mock_mode = graph_service.is_mock_mode
            
            class ExceptionRaiserMock:
                async def ainvoke(self, prompt: str):
                    raise ValueError("Simulated Gemini malformed JSON error")

            graph_service.llm_structured = ExceptionRaiserMock()
            graph_service.is_mock_mode = False # Force online simulation
            
            print("[Test Fallback] Triggering extraction with throwing Gemini Mock...")
            try:
                # Should fallback to offline rules and succeed without crashing the API/Transaction
                await graph_service.extract_and_save_graph(version_id, content)
                print("[Test Fallback] Graph Service survived the simulated error gracefully.")
                
                # Check nodes count is still healthy
                nodes_fallback = await db.execute(
                    select(models.GraphNode).where(models.GraphNode.version_id == version_id)
                )
                assert len(nodes_fallback.scalars().all()) >= 3, "Nodes should have been extracted via offline fallback parser."
                print("[SUCCESS] Test 3: Defensive Malformed Response Fallback passed.")
            except Exception as e:
                print(f"[FAILED] Test 3 failed: extract_and_save_graph crashed: {e}")
                sys.exit(1)
            finally:
                # Restore original services configuration
                graph_service.llm_structured = original_llm_structured
                graph_service.is_mock_mode = original_mock_mode

            # ---------------------------------------------------------
            # TEST 4: Cascade Delete
            # ---------------------------------------------------------
            print("\n--- TEST 4: Cascade Deletion ---")
            print("[Test Cascade] Deleting Document from database...")
            # Deleting document must automatically purge matching versions, and cascaded nodes & edges
            await db.execute(delete(models.Document).where(models.Document.id == doc.id))
            await db.commit()
            
            # Verify nodes count is 0
            n_check = await db.execute(select(models.GraphNode).where(models.GraphNode.version_id == version_id))
            n_list = n_check.scalars().all()
            print(f"[Test Cascade] Nodes left in DB: {len(n_list)}")
            assert len(n_list) == 0, f"Expected 0 nodes, but found {len(n_list)} orphans!"

            # Verify edges count is 0
            e_check = await db.execute(select(models.GraphEdge).where(models.GraphEdge.version_id == version_id))
            e_list = e_check.scalars().all()
            print(f"[Test Cascade] Edges left in DB: {len(e_list)}")
            assert len(e_list) == 0, f"Expected 0 edges, but found {len(e_list)} orphans!"
            print("[SUCCESS] Test 4: Cascade Deletion confirmed. Zero orphan records left in database.")

            print("\n==================================================================")
            print("   ALL GRAPHRAG CONCURRENCY AND RESILIENCE TESTS PASSED (100%)")
            print("==================================================================")
            
        except Exception as e:
            await db.rollback()
            print(f"\n[FAILED] GraphRAG automated test encountered a failure: {e}")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_graph_test())
