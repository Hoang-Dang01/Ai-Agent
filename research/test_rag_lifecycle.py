import asyncio
import os
import sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass
import time
import subprocess
from sqlalchemy import select, delete, text
from uuid import UUID
import httpx

# Add apps/backend-ai to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../apps/backend-ai")))

from app.database import AsyncSessionLocal
import app.models as models

GREEN = '\x1b[32m'
RED = '\x1b[31m'
RESET = '\x1b[0m'
YELLOW = '\x1b[33m'

async def wait_for_server(url: str, max_attempts=30) -> bool:
    print(f"[SETUP] Waiting for FastAPI test server on {url}...")
    for _ in range(max_attempts):
        try:
            res = httpx.get(url, timeout=1.0)
            if res.status_code == 200:
                print(f"{GREEN}[SETUP] FastAPI test server is ready!{RESET}")
                return True
        except Exception:
            pass
        await asyncio.sleep(0.5)
    raise TimeoutError("FastAPI test server did not boot in time.")

async def run_lifecycle_test():
    print("==================================================================")
    print("   STARTING INTEGRATION TEST: RAG KNOWLEDGE LIFECYCLE & SRE CLEANUP")
    print("==================================================================")

    # 0. Clean database before launching server
    async with AsyncSessionLocal() as db:
        print("[Test DB] Purging historical lifecycle test documents...")
        await db.execute(delete(models.Document).where(models.Document.title.like("TEST_LIFECYCLE_%")))
        await db.commit()

    # 1. Spawn FastAPI backend uvicorn server on port 8002
    server_process = None
    try:
        env = os.environ.copy()
        env["PYTHONPATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "../apps/backend-ai"))
        env["PORT"] = "8002"
        
        server_process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8002"],
            cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "../apps/backend-ai")),
            env=env,
            stdout=None,
            stderr=None
        )
        
        # Wait until port 8002 responds
        await wait_for_server("http://127.0.0.1:8002/")

        # Use httpx Client to make requests
        with httpx.Client(base_url="http://127.0.0.1:8002", timeout=10.0) as client:
            # ----------------------------------------------------
            # STEP 1: Ingest Document (POST /api/rag/documents/)
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 1] Ingesting initial Document...{RESET}")
            doc_payload = {
                "title": "TEST_LIFECYCLE_Medstand_ERP",
                "initial_content": "Medstand ERP guide: OpenApplicationTool launches the finance dashboard. Use TypeTextTool to insert VAT codes.",
                "commit_message": "V1 initial guidelines"
            }
            res_create = client.post("/api/rag/documents/", json=doc_payload)
            assert res_create.status_code == 200, f"Failed to create document: {res_create.text}"
            
            doc_data = res_create.json()
            doc_id = doc_data["id"]
            version_1_id = doc_data["versions"][0]["id"]
            print(f"   [PASS] Created Document ID: {doc_id}")
            print(f"   [PASS] Created Version 1 ID: {version_1_id}")

            # ----------------------------------------------------
            # STEP 2: Append New Version (POST /api/rag/documents/{id}/versions/)
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 2] Appending Document Version 2...{RESET}")
            ver_payload = {
                "content": "Medstand ERP guide: OpenApplicationTool launches the finance dashboard. Use TypeTextTool to insert VAT codes. Ensure Notepad runs on Windows.",
                "commit_message": "V2 added Notepad dependency"
            }
            res_append = client.post(f"/api/rag/documents/{doc_id}/versions/", json=ver_payload)
            assert res_append.status_code == 200, f"Failed to append version: {res_append.text}"
            
            ver_data = res_append.json()
            version_2_id = ver_data["id"]
            print(f"   [PASS] Created Version 2 ID: {version_2_id}")

            # Wait for asynchronous background tasks (Embedding calculation & Graph extraction)
            print("   Waiting 2 seconds for asynchronous embedding and GraphRAG extraction background tasks...")
            await asyncio.sleep(2.5)

            # Verify that embeddings & graphs were created successfully in the DB
            async with AsyncSessionLocal() as db:
                # Check V1 & V2 embeddings
                embeds = (await db.execute(
                    select(models.Embedding).where(models.Embedding.version_id.in_([UUID(version_1_id), UUID(version_2_id)]))
                )).scalars().all()
                print(f"   [PASS] Database verified: {len(embeds)} embeddings created.")
                assert len(embeds) == 2, f"Expected 2 embeddings in database, found {len(embeds)}"

                # Check V1 & V2 graph nodes & edges
                nodes = (await db.execute(
                    select(models.GraphNode).where(models.GraphNode.version_id.in_([UUID(version_1_id), UUID(version_2_id)]))
                )).scalars().all()
                edges = (await db.execute(
                    select(models.GraphEdge).where(models.GraphEdge.version_id.in_([UUID(version_1_id), UUID(version_2_id)]))
                )).scalars().all()
                print(f"   [PASS] Database verified: {len(nodes)} GraphNodes and {len(edges)} GraphEdges extracted.")
                assert len(nodes) >= 3, "Expected graph nodes to be extracted"
                assert len(edges) >= 2, "Expected graph edges to be extracted"

            # ----------------------------------------------------
            # STEP 3: Semantic Search (POST /api/rag/search/)
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 3] Performing Semantic Search Query...{RESET}")
            search_payload = {
                "query": "VAT code insertions finance dashboard",
                "top_k": 2
            }
            res_search = client.post("/api/rag/search/", json=search_payload)
            assert res_search.status_code == 200, f"Search failed: {res_search.text}"
            
            search_results = res_search.json()
            print(f"   Search returned {len(search_results)} result(s).")
            assert len(search_results) > 0, "No search results returned!"
            assert search_results[0]["title"] == "TEST_LIFECYCLE_Medstand_ERP", f"Unexpected match: {search_results[0]['title']}"
            print(f"   [PASS] Semantic Search verified. Match score: {search_results[0]['similarity']:.4f}")

            # ----------------------------------------------------
            # STEP 4: Contextual RAG Chat (POST /api/rag/chat/)
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 4] Querying Contextual GraphRAG Chat Endpoint...{RESET}")
            chat_payload = {
                "query": "Does Medstand ERP run on Windows?"
            }
            res_chat = client.post("/api/rag/chat/", json=chat_payload)
            assert res_chat.status_code == 200, f"Chat failed: {res_chat.text}"
            
            chat_data = res_chat.json()
            # Safe ascii-replace print to avoid cp1252 crash
            safe_response = chat_data['response'].encode('ascii', 'replace').decode('ascii')
            print(f"   RAG response: \"{safe_response}\"")
            print(f"   Citations (Sources): {chat_data['sources']}")
            assert len(chat_data['sources']) > 0, "Expected citation sources to be returned"
            assert chat_data['sources'][0]['title'] == "TEST_LIFECYCLE_Medstand_ERP"
            print(f"   [PASS] Contextual Chat citing confirmed.")

            # ----------------------------------------------------
            # STEP 5: Delete Document & Cascade Purge (DELETE /api/rag/documents/{id})
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 5] Deleting Document (Cascade Deletion & Cleanup)...{RESET}")
            res_delete = client.delete(f"/api/rag/documents/{doc_id}")
            assert res_delete.status_code == 200, f"Failed to delete document: {res_delete.text}"
            print("   [PASS] DELETE API returned 200 OK.")

            # ----------------------------------------------------
            # STEP 6: Verification of Clean State (Anti-Contamination & Orphan Prevention)
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 6] Verifying Database Clean State & Preventing Contamination...{RESET}")

            # A. Search check: Search query must NOT return any reference to the deleted document
            res_search_post = client.post("/api/rag/search/", json=search_payload)
            search_results_post = res_search_post.json()
            print(f"   Search results count post-delete: {len(search_results_post)}")
            assert len(search_results_post) == 0, f"CONTAMINATION ERROR: Deleted document still returned in semantic search!"
            print(f"   [PASS] CONFIRMED: Search queries are not contaminated by deleted data.")

            # B. Database check: Direct models verification
            async with AsyncSessionLocal() as db:
                # 1. Document deleted
                db_doc = (await db.execute(
                    select(models.Document).where(models.Document.id == UUID(doc_id))
                )).scalars().first()
                assert db_doc is None, "Orphan document record left behind!"

                # 2. Versions deleted
                db_vers = (await db.execute(
                    select(models.Version).where(models.Version.document_id == UUID(doc_id))
                )).scalars().all()
                assert len(db_vers) == 0, f"Orphan Version records found: {len(db_vers)}"

                # 3. Embeddings deleted
                db_embeds = (await db.execute(
                    select(models.Embedding).where(models.Embedding.version_id.in_([UUID(version_1_id), UUID(version_2_id)]))
                )).scalars().all()
                assert len(db_embeds) == 0, f"Orphan Embedding records found: {len(db_embeds)}"

                # 4. GraphNodes deleted
                db_nodes = (await db.execute(
                    select(models.GraphNode).where(models.GraphNode.version_id.in_([UUID(version_1_id), UUID(version_2_id)]))
                )).scalars().all()
                assert len(db_nodes) == 0, f"Orphan GraphNode records found: {len(db_nodes)}"

                # 5. GraphEdges deleted
                db_edges = (await db.execute(
                    select(models.GraphEdge).where(models.GraphEdge.version_id.in_([UUID(version_1_id), UUID(version_2_id)]))
                )).scalars().all()
                assert len(db_edges) == 0, f"Orphan GraphEdge records found: {len(db_edges)}"

                print(f"   [PASS] CONFIRMED: Database completely clean. All versions, embeddings, nodes, and edges purged cleanly (0 orphans left).")

            print(f"\n{GREEN}[SUCCESS] ALL KNOWLEDGE LIFECYCLE AND CLEANUP TESTS PASSED SUCCESSFULLY!{RESET}\n")

    except Exception as e:
        print(f"\n{RED}[FAIL] TEST FAILED: {e}{RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if server_process:
            print("[CLEANUP] Stopping FastAPI test server...")
            server_process.terminate()
            server_process.wait()
            print("   FastAPI test server stopped.")

if __name__ == "__main__":
    asyncio.run(run_lifecycle_test())
