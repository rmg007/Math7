-- ============================================================================
-- Phase 9: Project Oracle - Knowledge Index (RAG System)
-- ============================================================================
-- Purpose: Enable semantic search over all project documentation for AI agents
-- Dependencies: pgvector extension
-- ============================================================================

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Table: knowledge_chunks
-- ============================================================================
-- Stores document chunks with their vector embeddings for semantic search
--
-- Design Notes:
-- - file_path: Relative path from repo root (e.g., "docs/strategy/AGENTS.md")
-- - breadcrumb: Hierarchical context (e.g., "AGENTS.md > Phase 1 > Planning")
-- - content: The actual text chunk (500-800 tokens ideal)
-- - content_hash: SHA256 hash for change detection (avoid re-embedding)
-- - embedding: OpenAI text-embedding-3-small (1536 dimensions)
-- - metadata: Extensible JSONB for future needs (section, level, tags, etc.)
-- ============================================================================

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  breadcrumb TEXT,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure content hash is unique per file (same content can appear in different files)
  CONSTRAINT unique_file_hash UNIQUE (file_path, content_hash)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- IVFFlat index for fast cosine similarity search
-- Lists parameter: sqrt(total_rows) is a good heuristic
-- For ~500 initial docs, 100 lists is reasonable
CREATE INDEX knowledge_chunks_embedding_idx 
  ON knowledge_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- B-tree indexes for filtering and cleanup
CREATE INDEX knowledge_chunks_file_path_idx ON knowledge_chunks (file_path);
CREATE INDEX knowledge_chunks_content_hash_idx ON knowledge_chunks (content_hash);
CREATE INDEX knowledge_chunks_created_at_idx ON knowledge_chunks (created_at DESC);

-- ============================================================================
-- RPC: match_knowledge_chunks
-- ============================================================================
-- Performs semantic search using cosine similarity
--
-- Parameters:
--   query_embedding: The embedding vector of the search query
--   match_threshold: Minimum similarity score (0-1, default 0.7)
--   match_count: Maximum number of results to return (default 5)
--
-- Returns:
--   id, file_path, breadcrumb, content, similarity (sorted by relevance)
-- ============================================================================

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  file_path TEXT,
  breadcrumb TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    file_path,
    breadcrumb,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================================
-- RLS Policies
-- ============================================================================
-- Knowledge chunks are READ-ONLY for all authenticated users
-- Only the service role (used by indexer scripts) can write

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read knowledge chunks
CREATE POLICY "Allow authenticated users to read knowledge chunks"
  ON knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can do everything (enforced at connection level)
-- No explicit policy needed as service_role bypasses RLS

-- ============================================================================
-- Helper RPC: delete_chunks_by_file
-- ============================================================================
-- Used by indexer to clean up chunks when files are deleted
-- Only callable by service role

CREATE OR REPLACE FUNCTION delete_chunks_by_file(target_file_path TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM knowledge_chunks
  WHERE file_path = target_file_path;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- Trigger: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_knowledge_chunks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_knowledge_chunks_updated_at
  BEFORE UPDATE ON knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_chunks_updated_at();

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================

-- Verify extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE EXCEPTION 'Vector extension not enabled';
  END IF;
END $$;

-- Grant necessary permissions (if using custom roles)
-- GRANT SELECT ON knowledge_chunks TO anon, authenticated;
-- GRANT ALL ON knowledge_chunks TO service_role;
