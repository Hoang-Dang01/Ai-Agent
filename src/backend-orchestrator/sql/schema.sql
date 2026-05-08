-- 1. Bật extension vector (để hỗ trợ RAG - lưu trữ kiến thức cho AI)
create extension if not exists vector;

-- 2. Tạo bảng lưu trữ Lịch sử Chat (để n8n lưu lại tin nhắn của bạn và AI)
create table if not exists chat_history (
  id uuid default gen_random_uuid() primary key,
  session_id text not null, -- Dùng để gom nhóm các tin nhắn trong cùng 1 lần chat
  sender_type text not null, -- Phân biệt ai gửi: 'user' hoặc 'ai'
  agent_type text, -- Ghi chú lại con AI nào đang chat: 'code_mentor' hoặc 'analytics_expert'
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tạo bảng lưu trữ tài liệu (Knowledge Base cho RAG)
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  content text not null, -- Nội dung đoạn văn bản học được
  metadata jsonb, -- Chứa thông tin tên file gốc (VD: { "filename": "bai_1.md" })
  embedding vector(768) -- Chứa chuỗi số (vector) đại diện cho ý nghĩa câu văn
);

-- 4. Tạo hàm tìm kiếm Vector (Match Documents) để sau này n8n gọi vào tìm tài liệu
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
