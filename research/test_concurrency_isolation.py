import asyncio
import logging
import json
import sys
import random
import os
from io import StringIO

# Add workspace root to python path for app imports
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "backend-ai"))

from app.utils.logging_context import setup_logging, request_id_var, task_id_var

# Initialize JSON logging context
setup_logging()

async def simulate_worker_request(req_num: int):
    """
    Simulates a concurrent worker request that sets unique contexts,
    sleeps dynamically to yield loop execution, and logs trace messages.
    """
    request_id = f"req_uuid_concurrency_{req_num}"
    task_id = f"task_uuid_concurrency_{req_num}"
    
    # 1. Set ContextVars unique to this execution thread
    t_req = request_id_var.set(request_id)
    t_tsk = task_id_var.set(task_id)
    
    # Use unique logger name matching worker id
    logger = logging.getLogger(f"concurrency.worker.{req_num}")
    
    # First write
    logger.info(f"Worker {req_num} starting execution.")
    
    # 2. Interleave: yield execution to allow concurrent tasks to run
    await asyncio.sleep(random.uniform(0.01, 0.05))
    
    # Second write (verifies variable wasn't mutated/overwritten by another task)
    logger.info(f"Worker {req_num} completing execution.")
    
    # 3. Clean contexts
    request_id_var.reset(t_req)
    task_id_var.reset(t_tsk)

async def run_concurrency_stress_test():
    print("[TEST] Running 100 concurrent requests context isolation stress test...")
    
    # Capture standard output stream to verify formatted log isolation
    captured_stdout = StringIO()
    original_stdout = sys.stdout
    sys.stdout = captured_stdout
    
    try:
        # Re-initialize logging with the captured sys.stdout stream
        setup_logging()
        # Launch 100 parallel async workers concurrently
        await asyncio.gather(*(simulate_worker_request(i) for i in range(100)))
    finally:
        sys.stdout = original_stdout
        # Restore logging to normal stdout
        setup_logging()
        
    log_output_lines = captured_stdout.getvalue().strip().split("\n")
    
    # Parse and audit every single log line for context isolation
    audit_count = 0
    for line in log_output_lines:
        if not line.strip():
            continue
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError as err:
            print(f"[FAIL] Invalid JSON log line captured: '{line}'. Error: {err}")
            sys.exit(1)
            
        # Ignore external framework logs (like uvicorn/fastapi) that don't hold worker scopes
        if not parsed.get("logger", "").startswith("concurrency.worker."):
            continue
            
        logger_name = parsed["logger"]  # Format: concurrency.worker.X
        worker_id = logger_name.split(".")[-1]
        
        # Verify ContextVars matches the expected unique IDs for this worker_id
        expected_request_id = f"req_uuid_concurrency_{worker_id}"
        expected_task_id = f"task_uuid_concurrency_{worker_id}"
        
        assert parsed["requestId"] == expected_request_id, f"Cross-context leak! Log of worker {worker_id} had requestId: {parsed.get('requestId')}"
        assert parsed["taskId"] == expected_task_id, f"Cross-context leak! Log of worker {worker_id} had taskId: {parsed.get('taskId')}"
        audit_count += 1
        
    # We have 100 workers, each logging twice, so we expect exactly 200 audited logs
    print(f"Audited {audit_count} concurrent log entries.")
    assert audit_count == 200, f"Expected 200 worker logs, but audited {audit_count}."
    print("[PASS] 100 concurrent requests context isolation is 100% verified (0 context leaks).")

if __name__ == "__main__":
    asyncio.run(run_concurrency_stress_test())
