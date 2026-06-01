-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Documents Table: Stores purely metadata
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Versions Table: Append-only storage for document states
CREATE TABLE versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    commit_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_id, version_number)
);

-- 3. Embeddings Table: 1:1 mapping with versions
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID UNIQUE NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    embedding VECTOR(768)
);

-- 4. Indexes for Performance
CREATE INDEX idx_versions_document_id ON versions(document_id);
CREATE INDEX idx_embeddings_embedding ON embeddings USING hnsw (embedding vector_cosine_ops);

-- 5. Trigger to auto-update the documents.updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_modtime
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
