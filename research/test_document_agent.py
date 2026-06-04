import asyncio
import os
import sys
import shutil

# Add apps/backend-ai to PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "apps", "backend-ai"))

import app.models as models
from app.database import engine, AsyncSessionLocal
from app.services.document_ingestion import document_ingestion_service, STORAGE_DIR
from app.routers.document_agent import process_async_embedding_job
from sqlalchemy import select
from fastapi import HTTPException

# Color constants
GREEN = '\x1b[32m'
RED = '\x1b[31m'
RESET = '\x1b[0m'
YELLOW = '\x1b[33m'

failed_tests = 0

def assert_test(condition, message):
    global failed_tests
    if condition:
        print(f"{GREEN}PASS:{RESET} {message}")
    else:
        print(f"{RED}FAIL:{RESET} {message}")
        failed_tests += 1

async def run_tests():
    global failed_tests
    print("\n==================================================================")
    print("STARTING DYNAMIC DOCUMENT AGENT INTEGRATION TEST SUITE")
    print("==================================================================")

    # 1. Clean DB and sync schemas
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    
    # 2. Setup mock files
    test_content = b"This is standard plain text content for testing RAG MarkItDown ingestion."
    test_hash = document_ingestion_service.validate_file(test_content, "test_file.txt")
    
    # ----------------------------------------------------
    # TEST 1: File Validation (Size Limit)
    # ----------------------------------------------------
    print(f"\n{YELLOW}[TEST 1] File Size Limit Check (>50MB){RESET}")
    huge_payload = b"X" * (50 * 1024 * 1024 + 10)  # 50MB + 10 bytes
    try:
        document_ingestion_service.validate_file(huge_payload, "huge.txt")
        assert_test(False, "Should fail size validation (>50MB)")
    except HTTPException as http_err:
        assert_test(http_err.status_code == 413, f"Caught size exception. Status: {http_err.status_code}")

    # ----------------------------------------------------
    # TEST 2: Strict MIME Spoofing Prevention
    # ----------------------------------------------------
    print(f"\n{YELLOW}[TEST 2] MIME Spoofing Rejection{RESET}")
    # An executable header (MZ) spoofed as a PDF file
    spoofed_bytes = b"MZ\x90\x00\x03\x00\x00\x00" + b"A" * 100
    try:
        document_ingestion_service.validate_file(spoofed_bytes, "virus.pdf")
        assert_test(False, "Should reject spoofed executable renamed to .pdf")
    except HTTPException as http_err:
        assert_test(http_err.status_code == 400, f"Successfully caught MIME mismatch. Status: {http_err.status_code}")
        assert_test("Unsupported file type" in http_err.detail, f"Correct error detail: {http_err.detail}")

    # ----------------------------------------------------
    # TEST 3: Valid Document Ingestion & MarkItDown Conversion
    # ----------------------------------------------------
    print(f"\n{YELLOW}[TEST 3] Valid Ingestion & Local Storage Conversion{RESET}")
    
    # Clean previous storage folder if exists
    if os.path.exists(STORAGE_DIR):
        shutil.rmtree(STORAGE_DIR)
    os.makedirs(STORAGE_DIR, exist_ok=True)

    markdown_text = document_ingestion_service.convert_to_markdown(test_content, "test_file.txt")
    assert_test(len(markdown_text) > 0, "MarkItDown parsed text successfully")
    assert_test("RAG MarkItDown" in markdown_text, "Markdown output contains matching keywords")
    
    # Save document entry to Database
    async with AsyncSessionLocal() as db:
        db_doc = models.Document(
            title="test_file.txt",
            status=models.DocumentStatus.PENDING,
            content_hash=test_hash,
            file_size=len(test_content)
        )
        db.add(db_doc)
        await db.flush()
        
        storage_path = document_ingestion_service.write_to_storage(str(db_doc.id), content=markdown_text)
        db_doc.storage_path = storage_path
        
        db_version = models.Version(
            document_id=db_doc.id,
            version_number=1,
            content="[Stored in Filesystem]",
            commit_message="Initial upload"
        )
        db.add(db_version)
        await db.commit()
        
        assert_test(os.path.exists(storage_path), f"File written successfully to: {storage_path}")
        assert_test(db_doc.status == models.DocumentStatus.PENDING, f"Initial document status is PENDING")

        # ----------------------------------------------------
        # TEST 4: Async Embedding Job Status Transitions
        # ----------------------------------------------------
        print(f"\n{YELLOW}[TEST 4] Ingestion Job Status Transitions (PENDING -> PROCESSING -> INDEXED){RESET}")
        
        # Simulate processing synchronously in test
        await process_async_embedding_job(db_version.id, markdown_text, db_doc.id)
        
        # Refresh and check DB status
        await db.refresh(db_doc)
        assert_test(db_doc.status == models.DocumentStatus.INDEXED, f"Ingestion job completed successfully. Status is: {db_doc.status}")

        # ----------------------------------------------------
        # TEST 5: SHA-256 Content Hash Deduplication
        # ----------------------------------------------------
        print(f"\n{YELLOW}[TEST 5] SHA-256 Content Hash Deduplication{RESET}")
        
        # Uploading the exact same file content
        same_hash = document_ingestion_service.validate_file(test_content, "duplicate_name.txt")
        assert_test(same_hash == test_hash, f"Hash values match for identical content: {same_hash}")
        
        # Query existing hash in DB
        dup_result = await db.execute(
            select(models.Document).where(models.Document.content_hash == same_hash)
        )
        dup_doc = dup_result.scalars().first()
        assert_test(dup_doc is not None, "Deduplication logic located the existing database entry")
        assert_test(dup_doc.id == db_doc.id, f"Correctly mapped duplicate request to Document ID: {dup_doc.id}")

        # ----------------------------------------------------
        # CLEANUP
        # ----------------------------------------------------
        print(f"\n{YELLOW}Starting test cleanup...{RESET}")
        # Delete DB entries
        await db.execute(models.Document.__table__.delete().where(models.Document.id == db_doc.id))
        await db.commit()
        
        # Clean local storage file
        if os.path.exists(storage_path):
            os.remove(storage_path)
            assert_test(not os.path.exists(storage_path), "Test local storage files cleaned successfully.")

    print("\n==================================================================")
    print("DOCUMENT AGENT TEST REPORT")
    print("==================================================================")
    if failed_tests == 0:
        print(f"{GREEN}ALL DOCUMENT AGENT TESTS PASSED SUCCESSFULLY! (0 failures){RESET}\n")
        sys.exit(0)
    else:
        print(f"{RED}TEST SUITE EXITED WITH {failed_tests} FAILURES{RESET}\n")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_tests())
