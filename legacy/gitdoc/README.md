# GitDoc - AI-Powered Second Brain MVP

GitDoc is a personal document management application that combines the linear version control of a system like GitHub with the intelligence of an AI-powered Second Brain (RAG). It allows you to store knowledge safely, track append-only historical edits, and chat natively with your own document repository using Google Gemini.

## Core Features

* **Linear Version Control:** Documents are stored using an append-only architecture. Old data is never overwritten; all changes are committed as distinct, immutable versions.
* **Version Diffing:** A visual side-by-side comparison interface allows you to easily track changes, additions, and deletions between adjacent document versions.
* **Semantic Search:** Go beyond exact keyword matching. Powered by vector embeddings, the search engine retrieves documents based on conceptual meaning and context.
* **Smart RAG Chat:** Ask questions directly to your Second Brain. The AI dynamically pulls context from your document database to generate accurate answers with proper source citations.

## Tech Stack

**Frontend:** React + Vite, Tailwind CSS, React Router & Axios, Lucide React
**Backend:** Python (FastAPI), SQLAlchemy 2.0 & asyncpg, LangChain & Google GenAI
**Database & AI Ecosystem:** PostgreSQL + `pgvector`, Google Gemini `text-embedding-004`, Google Gemini `gemini-1.5-flash`

---

## Local Development Setup

### Step 1: Database Initialization
1. Create a new database in PostgreSQL (e.g., `gitdoc_db`).
2. Execute the provided SQL script located at `backend/schema.sql` to initialize the tables.

### Step 2: Backend Setup
1. `cd backend`
2. `pip install -r requirements.txt`
3. Create a `.env` file:
```env
DATABASE_URL=postgresql+asyncpg://<username>:<password>@localhost:5432/gitdoc_db
GOOGLE_API_KEY=your_gemini_api_key_here
```

4. `fastapi dev main.py`

### Step 3: Frontend Setup

1. `cd frontend`
2. `npm install`
3. (Optional) Create a `.env` file: `VITE_API_URL=http://localhost:8000`
4. `npm run dev`
