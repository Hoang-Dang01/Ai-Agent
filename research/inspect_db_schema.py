import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "apps", "backend-ai"))

from app.database import engine
from sqlalchemy import inspect

async def inspect_db():
    print("Inspecting PostgreSQL database for 'documents' table...")
    async with engine.connect() as conn:
        def get_cols(sync_conn):
            inspector = inspect(sync_conn)
            return inspector.get_columns("documents")
        
        columns = await conn.run_sync(get_cols)
        print("\nColumns found in 'documents' table:")
        for col in columns:
            print(f"- {col['name']}: {col['type']}")

if __name__ == "__main__":
    asyncio.run(inspect_db())
