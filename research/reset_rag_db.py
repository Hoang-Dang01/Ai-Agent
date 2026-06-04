import asyncio
import os
import sys

# Add apps/backend-ai to PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "apps", "backend-ai"))

from app.database import engine
from sqlalchemy import text

async def reset_db():
    print("Connecting to database and dropping old RAG tables...")
    async with engine.begin() as conn:
        # Cascade drops all dependent tables (versions, embeddings, graph_nodes, graph_edges)
        await conn.execute(text("DROP TABLE IF EXISTS documents CASCADE;"))
        await conn.execute(text("DROP TABLE IF EXISTS versions CASCADE;"))
        await conn.execute(text("DROP TABLE IF EXISTS embeddings CASCADE;"))
        await conn.execute(text("DROP TABLE IF EXISTS graph_nodes CASCADE;"))
        await conn.execute(text("DROP TABLE IF EXISTS graph_edges CASCADE;"))
        await conn.execute(text("DROP TYPE IF EXISTS document_status_enum CASCADE;"))
        print("RAG tables dropped successfully.")

if __name__ == "__main__":
    asyncio.run(reset_db())
