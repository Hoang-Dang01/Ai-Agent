from abc import ABC, abstractmethod
from uuid import UUID
from fastapi import BackgroundTasks

class JobDispatcher(ABC):
    @abstractmethod
    def enqueue_embedding_job(self, version_id: UUID, content: str, doc_id: UUID, background_tasks: BackgroundTasks):
        pass

class BackgroundTasksJobDispatcher(JobDispatcher):
    def enqueue_embedding_job(self, version_id: UUID, content: str, doc_id: UUID, background_tasks: BackgroundTasks):
        from app.routers.document_agent import process_async_embedding_job
        background_tasks.add_task(
            process_async_embedding_job,
            version_id=version_id,
            content=content,
            doc_id=doc_id
        )

# Export default implementation
job_dispatcher = BackgroundTasksJobDispatcher()
