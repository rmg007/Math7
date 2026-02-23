# 🔮 Project Oracle: Knowledge Index Architecture

**Phase 9 Deliverable** | Last Updated: 2026-02-03

---

## 📊 Overview

Project Oracle is a self-updating documentation RAG (Retrieval-Augmented Generation) system that enables AI agents to semantically search all Questerix project documentation. It provides sub-second semantic search over 730+ documentation chunks covering all aspects of the project.

### Key Statistics

- **Files Indexed**: 61 markdown documents
- **Chunks**: 730 semantic chunks
- **Vector Dimensions**: 1536 (OpenAI text-embedding-3-small)
- **Initial Cost**: $0.0025 (less than a penny!)
- **Query Speed**: ~1-2 seconds (including embedding generation)

---

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent / CLI User                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Query: "How does offline sync work?"
                            ▼
                  ┌─────────────────────┐
                  │   query-docs.ts     │
                  │ (Generate Embedding)│
                  └──────────┬──────────┘
                             │
                             │ Embedding Vector [1536 dims]
                             ▼
                  ┌──────────────────────┐          ┌─────────────┐
                  │ match_knowledge_     │◄────────►│  PostgreSQL │
                  │ chunks RPC           │          │  + pgvector │
                  └──────────┬───────────┘          └─────────────┘
                             │
                             │ Top 5 Results (Cosine Similarity)
                             ▼
                  ┌─────────────────────┐
                  │   Format & Display   │
                  └─────────────────────┘
```

### Database Schema

**Table**: `knowledge_chunks`

```sql
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY,
  file_path TEXT NOT NULL,              -- e.g., "docs/strategy/AGENTS.md"
  breadcrumb TEXT,                       -- e.g., "AGENTS.md > Phase 1 > Planning"
  content TEXT NOT NULL,                 -- The actual chunk text
  content_hash TEXT NOT NULL,            -- SHA256 for change detection
  embedding VECTOR(1536) NOT NULL,       -- OpenAI embedding
  metadata JSONB DEFAULT '{}'::jsonb,    -- Extensible metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_file_hash UNIQUE (file_path, content_hash)
);
```

**Indexes**:

- IVFFlat index on `embedding` for fast cosine similarity search
- B-tree indexes on `file_path`, `content_hash`, `created_at`

**RPC**: `match_knowledge_chunks(query_embedding, match_threshold, match_count)`

- Returns top N results sorted by cosine similarity
- Default threshold: 0.5 (50% similarity)
- Default count: 5 results

---

## 📂 File Structure

```
scripts/knowledge-base/
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── .env                          # Secrets (git-ignored)
├── .env.example                  # Template
├── README.md                     # Usage guide
├── indexer.ts                    # Main indexer script
├── query-docs.ts                 # Search CLI
├── test-search.ts                # Debug/test script
└── lib/
    ├── supabase-client.ts        # Supabase factory
    ├── embedder.ts               # OpenAI embeddings
    ├── hasher.ts                 # SHA256 hashing
    └── splitter.ts               # Markdown chunking
```

---

## 🔄 Indexing Process

### 1. Discovery

Glob patterns scan for all documentation:

- `docs/**/*.md`
- Root files: `README.md`, `AI_CODING_INSTRUCTIONS.md`, `ROADMAP.md`
- Workflow definitions: `.agent/workflows/*.md`
- App READMEs: `student-app/README.md`, etc.

### 2. Splitting

Uses LangChain's `RecursiveCharacterTextSplitter` with Markdown-aware splitting:

- **Chunk Size**: 1000 characters
- **Overlap**: 200 characters
- **Preserves**: Heading hierarchy in breadcrumb

**Example Breadcrumb**:

```
docs/strategy/AGENTS.md > Phase 1 > Planning & Strategy > Expert Consultation
```

### 3. Change Detection

- Compute SHA256 hash of each chunk
- Query existing chunks for the file from database
- **Skip** chunks with matching hashes (no re-embedding needed)
- **Delete** orphaned chunks (hashes no longer in file)

### 4. Embedding Generation

- OpenAI API: `text-embedding-3-small`
- **Rate Limiting**: 10 concurrent requests (p-limit)
- **Retries**: Automatic with exponential backoff

### 5. Upsert

- Insert new/updated chunks to database
- Upsert on conflict (`file_path`, `content_hash`)

---

## 🔍 Query Process

### 1. Embed Query

User's natural language query is converted to a 1536-dimension vector using the same OpenAI model.

### 2. Cosine Similarity Search

The `match_knowledge_chunks` RPC performs:

```sql
SELECT *,
  1 - (embedding <=> query_embedding) AS similarity
FROM knowledge_chunks
WHERE 1 - (embedding <=> query_embedding) > match_threshold
ORDER BY embedding <=> query_embedding
LIMIT match_count;
```

### 3. Return Results

Top N results are returned with:

- **File path**: Where the content was found
- **Breadcrumb**: Hierarchical context
- **Content**: The actual text chunk
- **Similarity**: 0-1 relevance score

---

## 🧪 Testing & Verification

### Manual Tests Performed

1. **Indexer Test** ✅

   ```bash
   npm run index
   # Result: 730 chunks indexed from 61 files
   # Cost: $0.0025
   ```

2. **Search Test** ✅

   ```bash
   npm run query "How does the student app store data offline?"
   # Result: Found 1 relevant result from student-app/README.md
   # Similarity: 57.3%
   ```

3. **Change Detection Test** ✅
   - Re-ran indexer without file changes
   - Result: 0 chunks indexed, 730 chunks skipped (hash match)

---

## 🚀 CI/CD Integration

**Workflow**: `.github/workflows/docs-index.yml`

**Triggers**:

- Push to `main` branch
- Changes to any of:
  - `docs/**`
  - `README.md`, `AI_CODING_INSTRUCTIONS.md`, `ROADMAP.md`
  - `.agent/workflows/**`
  - `**/README.md`

**Actions**:

1. Checkout repo
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run indexer with secrets from GitHub Secrets

**Required Secrets** (GitHub Repository Settings):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

---

## 💰 Cost Analysis

### Initial Index

- **Tokens**: 122,925
- **Cost**: $0.0025 (less than a penny!)

### Incremental Updates

- **Average Update**: ~100-500 tokens per file change
- **Cost**: ~$0.00001-0.00005 per update

### Queries

- **Per Query**: ~50 tokens
- **Cost**: ~$0.000001 per search (negligible)

**Estimated Monthly Cost**: **< $0.01/month** 💰

---

## 🔒 Security

### Service Role Key Protection

- Stored in `.env` (git-ignored)
- Used ONLY in server-side scripts
- **Never exposed** to client code or version control

### RLS Policies

```sql
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read knowledge chunks"
  ON knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (true);
```

- **Read-only** access for all authenticated users
- **Write access** only via service role (indexer scripts)

---

## 📈 Performance

### Index Build Time

- **61 files**: ~2 minutes (including API calls)
- **Rate-limited** to 10 concurrent OpenAI requests
- **Incremental updates**: < 10 seconds for typical documentation changes

### Query Performance

- **Embedding generation**: ~0.5-1 second
- **Vector search** (IVFFlat): ~50-100ms
- **Total**: ~1-2 seconds end-to-end

### Scalability

- **Current**: 730 chunks
- **Estimated capacity**: 10,000+ chunks with current index settings
- **IVFFlat lists parameter**: 100 (optimal for current scale)

---

## 🛠️ Troubleshooting

See `scripts/knowledge-base/README.md` for detailed troubleshooting guide.

### Common Issues

**"No results found"**

- Lower the match threshold (default: 0.5)
- Try broader search terms
- Verify index is populated: `SELECT COUNT(*) FROM knowledge_chunks;`

**"OPENAI_API_KEY environment variable is not set"**

- Ensure `.env` file exists in `scripts/knowledge-base/`
- Verify key is set correctly (starts with `sk-...`)

**Slow indexing**

- Reduce concurrency in `generateEmbeddings()` (default: 10)
- Check OpenAI rate limits (500 requests/min on free tier)

---

## 🔮 Future Enhancements

### Phase 9.1: Advanced Features (Optional)

1. **Hybrid Search**: Combine vector search with full-text search (BM25)
2. **Reranking**: Use cross-encoder models for better result ordering
3. **Query Expansion**: Automatically expand queries with synonyms
4. **Caching**: Cache embeddings for common queries
5. **Analytics**: Track most searched terms, click-through rates

### Phase 9.2: UI Integration (Optional)

1. **Web Interface**: Build a simple search UI for non-technical users
2. **VS Code Extension**: Integrate search into IDE
3. **API Integration**: Query docs via API (Phase 9.3)

---

## 📚 Related Documentation

- **Setup Guide**: `scripts/knowledge-base/README.md`
- **Migration**: `supabase/migrations/20260204000006_create_knowledge_index.sql`
- **Database Schema**: `docs/technical/SCHEMA.md`
- **Workflow**: `.github/workflows/docs-index.yml`

---

**Built with ❤️ for autonomous AI agents** 🤖
