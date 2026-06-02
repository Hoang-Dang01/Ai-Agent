import logging
import json
import sys
import os
from io import StringIO

# Add workspace root to python path for app imports
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "backend-ai"))

from app.utils.logging_context import setup_logging, request_id_var, parent_request_id_var, task_id_var, workflow_id_var, execution_epoch_var, timeout_ms_var

def test_json_log_schema():
    print("[TEST] Running log schema compliance tests...")
    
    # 1. Setup StringIO to capture console stdout
    captured_stdout = StringIO()
    original_stdout = sys.stdout
    sys.stdout = captured_stdout
    
    try:
        # Re-initialize standard dictConfig logging
        setup_logging()
        
        # Set all context variables representing standard request contexts
        t_req = request_id_var.set("req_uuid_1")
        t_par = parent_request_id_var.set("req_uuid_parent")
        t_tsk = task_id_var.set("task_uuid_2")
        t_wf  = workflow_id_var.set("wf_uuid_3")
        t_ep  = execution_epoch_var.set(4)
        t_to  = timeout_ms_var.set(30000)
        
        logger = logging.getLogger("test.schema")
        logger.info("Verifying standard schema parameters.")
        
        # Clean contexts
        request_id_var.reset(t_req)
        parent_request_id_var.reset(t_par)
        task_id_var.reset(t_tsk)
        workflow_id_var.reset(t_wf)
        execution_epoch_var.reset(t_ep)
        timeout_ms_var.reset(t_to)
    finally:
        sys.stdout = original_stdout
        
    log_output = captured_stdout.getvalue().strip()
    
    # Verify log output parses cleanly as JSON
    try:
        parsed = json.loads(log_output)
    except json.JSONDecodeError as err:
        print(f"[FAIL] Log output is not valid JSON. Raw output: '{log_output}'. Error: {err}")
        sys.exit(1)
        
    # Assert standard parameters
    assert parsed["service"] == "backend-ai", f"Invalid service field. Got: {parsed.get('service')}"
    assert parsed["version"] == "1.0.0", f"Invalid version field. Got: {parsed.get('version')}"
    assert "timestamp" in parsed, "Log must contain timestamp."
    assert parsed["level"] == "INFO", "Log level mismatch."
    assert parsed["message"] == "Verifying standard schema parameters.", "Log message mismatch."
    assert parsed["requestId"] == "req_uuid_1", "Log requestId correlation mismatch."
    assert parsed["parentRequestId"] == "req_uuid_parent", "Log parentRequestId correlation mismatch."
    assert parsed["taskId"] == "task_uuid_2", "Log taskId correlation mismatch."
    assert parsed["workflowId"] == "wf_uuid_3", "Log workflowId correlation mismatch."
    assert parsed["executionEpoch"] == 4, "Log executionEpoch mismatch."
    assert parsed["timeoutMs"] == 30000, "Log timeoutMs mismatch."
    assert "traceId" in parsed, "Reserved OTel traceId missing."
    assert "spanId" in parsed, "Reserved OTel spanId missing."
    
    print("[PASS] test_json_log_schema completed successfully.")

if __name__ == "__main__":
    test_json_log_schema()
