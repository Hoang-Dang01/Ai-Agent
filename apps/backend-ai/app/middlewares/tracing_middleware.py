import uuid
import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logging_context import (
    request_id_var, parent_request_id_var, task_id_var, workflow_id_var, execution_epoch_var, timeout_ms_var
)

logger = logging.getLogger("fastapi.tracing")

class StructuredTracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract HTTP tracing headers
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())

        parent_request_id = request.headers.get("X-Parent-Request-ID")
        task_id = request.headers.get("X-Task-ID")
        
        # Keep trace chain linked: fallback workflowId to requestId
        workflow_id = request.headers.get("X-Workflow-ID") or request_id
        
        epoch_raw = request.headers.get("X-Execution-Epoch")
        epoch = None
        if epoch_raw:
            try:
                epoch = int(epoch_raw)
            except ValueError:
                pass

        timeout_raw = request.headers.get("X-Timeout-MS")
        timeout_ms = None
        if timeout_raw:
            try:
                timeout_ms = int(timeout_raw)
            except ValueError:
                pass

        # Expose request ID to route handlers
        request.state.request_id = request_id

        # Set thread-local context variables
        token_request_id = request_id_var.set(request_id)
        token_parent_id = parent_request_id_var.set(parent_request_id)
        token_task_id = task_id_var.set(task_id)
        token_workflow_id = workflow_id_var.set(workflow_id)
        token_epoch = execution_epoch_var.set(epoch)
        token_timeout = timeout_ms_var.set(timeout_ms)

        start_time = time.perf_counter()
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            
            # Structured API access log
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            logger.info(
                "API Access Log",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "statusCode": response.status_code,
                    "durationMs": duration_ms
                }
            )
            return response
        except Exception as e:
            # Capture exception with full context variables mapped
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            logger.exception(
                "Unhandled exception in request pipeline",
                extra={"durationMs": duration_ms}
            )
            raise e
        finally:
            # Clean context variables to prevent sharing context across concurrent tasks
            request_id_var.reset(token_request_id)
            parent_request_id_var.reset(token_parent_id)
            task_id_var.reset(token_task_id)
            workflow_id_var.reset(token_workflow_id)
            execution_epoch_var.reset(token_epoch)
            timeout_ms_var.reset(token_timeout)
