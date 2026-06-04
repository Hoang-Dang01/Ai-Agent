import asyncio
import os
import sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass
import subprocess
import httpx
from sqlalchemy import delete
from uuid import UUID

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

async def run_e2e_pipeline():
    print("\n==================================================================")
    print("   STARTING END-TO-END RAG PRODUCTION PIPELINE VALIDATION")
    print("==================================================================")

    # 0. Clean database from any old lifecycle runs
    async with AsyncSessionLocal() as db:
        print("[Test DB] Purging old test documents...")
        await db.execute(delete(models.Document).where(models.Document.title == "ba_report_local_agent.docx"))
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
        with httpx.Client(base_url="http://127.0.0.1:8002", timeout=30.0) as client:
            
            # ----------------------------------------------------
            # STEP 1: Upload real DOCX file
            # ----------------------------------------------------
            real_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "ba_report_local_agent.docx"))
            print(f"\n{YELLOW}[STEP 1] Uploading real document: {real_file_path}{RESET}")
            
            if not os.path.exists(real_file_path):
                # Fallback to local copy under src/docs
                real_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../apps/agent-runtime/src/docs/ba_report_local_agent.docx"))
                print(f"File not found in root. Using fallback path: {real_file_path}")
                
            with open(real_file_path, "rb") as f:
                files = {"file": (os.path.basename(real_file_path), f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                data = {"commit_message": "Ingesting real business analyst guidelines"}
                res_upload = client.post("/api/document-agent/upload/", files=files, data=data)
            
            assert res_upload.status_code == 200, f"Failed to upload document: {res_upload.text}"
            doc_data = res_upload.json()
            doc_id = doc_data["id"]
            print(f"   {GREEN}PASS:{RESET} Document uploaded successfully. ID: {doc_id}")
            print(f"   Converted text output length: {len(doc_data['versions'][0]['content'])} characters")

            # ----------------------------------------------------
            # STEP 2: Wait for Async Embedding Generation
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 2] Waiting for asynchronous embedding job...{RESET}")
            indexed = False
            for i in range(15):
                res_status = client.get(f"/api/rag/documents/{doc_id}")
                assert res_status.status_code == 200, f"Failed to query document: {res_status.text}"
                status_data = res_status.json()
                current_status = status_data["status"]
                print(f"   Polling document status (attempt {i+1}): {current_status}")
                if current_status == "INDEXED":
                    indexed = True
                    break
                elif current_status == "FAILED":
                    raise Exception("Background embedding calculation failed.")
                await asyncio.sleep(1.5)
                
            assert indexed, "Document status did not transition to INDEXED in time."
            print(f"   {GREEN}PASS:{RESET} Document status transitioned to INDEXED.")

            # ----------------------------------------------------
            # STEP 3: Run Semantic Search
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 3] Running Semantic Search query...{RESET}")
            res_search = client.post("/api/rag/search/", json={"query": "business analyst agent dashboard", "top_k": 3})
            assert res_search.status_code == 200, f"Search failed: {res_search.text}"
            search_results = res_search.json()
            
            print(f"   Search returned {len(search_results)} results:")
            for s in search_results:
                print(f"     - Title: {s['title']} | Score (Cosine Distance): {s['similarity']:.4f}")
                
            assert len(search_results) > 0, "No search results returned."
            assert search_results[0]["document_id"] == doc_id, "Search did not match the uploaded document."
            print(f"   {GREEN}PASS:{RESET} Semantic search successfully located the uploaded document.")

            # ----------------------------------------------------
            # STEP 4: Chat with GraphRAG Context
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 4] Querying Contextual Chat...{RESET}")
            chat_payload = {"query": "Summarize the primary responsibilities of the business analyst agent."}
            res_chat = client.post("/api/rag/chat/", json=chat_payload)
            assert res_chat.status_code == 200, f"Chat failed: {res_chat.text}"
            chat_data = res_chat.json()
            
            print(f"   RAG Chat Response: {chat_data['response'][:250]}...")
            print("   Citations:")
            for c in chat_data.get("sources", []):
                print(f"     - Document ID: {c['document_id']} | Title: {c['title']}")
                
            assert len(chat_data.get("sources", [])) > 0, "No citation sources returned in chat response."
            print(f"   {GREEN}PASS:{RESET} Chat responded successfully with valid citations.")

            # ----------------------------------------------------
            # STEP 5: Cascade Deletion Clean State Check
            # ----------------------------------------------------
            print(f"\n{YELLOW}[STEP 5] Performing SRE Cascade Deletion...{RESET}")
            res_delete = client.delete(f"/api/rag/documents/{doc_id}")
            assert res_delete.status_code == 200, f"Failed to delete document: {res_delete.text}"
            print(f"   {GREEN}PASS:{RESET} Cascade deletion completed.")

            # Verify no orphan records exist
            res_search_post = client.post("/api/rag/search/", json={"query": "business analyst", "top_k": 5})
            assert len(res_search_post.json()) == 0, "Search index is contaminated after document deletion."
            print(f"   {GREEN}PASS:{RESET} Database confirmed clean (no contamination).")

    finally:
        if server_process:
            print("\n[CLEANUP] Stopping FastAPI test server...")
            server_process.terminate()
            server_process.wait()
            print("FastAPI test server stopped.")

if __name__ == "__main__":
    asyncio.run(run_e2e_pipeline())
