import contextvars
import logging
import logging.config
import json
import sys
from typing import Optional

# Async-safe request variables
request_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("request_id", default=None)
parent_request_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("parent_request_id", default=None)
task_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("task_id", default=None)
workflow_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("workflow_id", default=None)
execution_epoch_var: contextvars.ContextVar[Optional[int]] = contextvars.ContextVar("execution_epoch", default=None)
timeout_ms_var: contextvars.ContextVar[Optional[int]] = contextvars.ContextVar("timeout_ms", default=None)

class StructuredJsonFormatter(logging.Formatter):
    """
    Custom Formatter that outputs logs in standard structured JSON format,
    seamlessly injecting request, parent, task, workflow, epoch, and timeout contexts,
    while reserving traceId/spanId fields for future OTel integration.
    """
    def format(self, record: logging.LogRecord) -> str:
        request_id = request_id_var.get()
        parent_request_id = parent_request_id_var.get()
        task_id = task_id_var.get()
        workflow_id = workflow_id_var.get()
        epoch = execution_epoch_var.get()
        timeout_ms = timeout_ms_var.get()

        log_data = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S") + f".{int(record.msecs):03d}Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "service": "backend-ai",
            "version": "1.0.0",
            # Reserve OTel trace fields
            "traceId": None,
            "spanId": None
        }

        # Inject tracing correlation if present
        if request_id:
            log_data["requestId"] = request_id
        if parent_request_id:
            log_data["parentRequestId"] = parent_request_id
        if task_id:
            log_data["taskId"] = task_id
        if workflow_id:
            log_data["workflowId"] = workflow_id
        if epoch is not None:
            log_data["executionEpoch"] = epoch
        if timeout_ms is not None:
            log_data["timeoutMs"] = timeout_ms

        # Extract structured access log properties from 'extra' block
        for attr in ["method", "path", "statusCode", "durationMs"]:
            if hasattr(record, attr):
                log_data[attr] = getattr(record, attr)

        # Include exceptions if any occurred
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)

def setup_logging():
    """
    Safely configures the logging hierarchy using Python's standard logging.config.dictConfig
    and standard 'root' mapping.
    """
    LOGGING_CONFIG = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": "app.utils.logging_context.StructuredJsonFormatter",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "loggers": {
            "uvicorn": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
                "propagate": True,
            },
            "uvicorn.access": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "fastapi": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }
    logging.config.dictConfig(LOGGING_CONFIG)

def build_trace_headers() -> dict:
    """
    Outbound Tracing propagation helper mapping context variables to standard HTTP headers.
    """
    headers = {}
    req_id = request_id_var.get()
    wf_id = workflow_id_var.get()
    t_id = task_id_var.get()
    epoch = execution_epoch_var.get()
    timeout = timeout_ms_var.get()

    if req_id:
        headers["X-Request-ID"] = req_id
        # The current request is the parent to downstream requests
        headers["X-Parent-Request-ID"] = req_id
    if wf_id:
        headers["X-Workflow-ID"] = wf_id
    if t_id:
        headers["X-Task-ID"] = t_id
    if epoch is not None:
        headers["X-Execution-Epoch"] = str(epoch)
    if timeout is not None:
        headers["X-Timeout-MS"] = str(timeout)
        
    return headers
