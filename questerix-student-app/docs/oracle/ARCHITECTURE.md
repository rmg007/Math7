# 🏗️ Project Oracle - Architecture Overview

**Complete System Architecture Documentation**

---

## 🎯 Design Principles

Project Oracle was designed with these core principles:

1. **Cost-Effective** - Minimize API costs through smart caching and deduplication
2. **Autonomous** - Work seamlessly with AI agents without human intervention
3. **Incremental** - Only process changed content, not entire corpus
4. **Scalable** - Handle growing documentation without performance degradation
5. **Secure** - Protect sensitive keys, implement proper access control

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER / AI AGENT                           │
└────────────────┬─────────────────────────┬──────────────────────┘
                 │                         │
                 │ Trigger Reindex         │ Search Query
                 ▼                         ▼
┌────────────────────────────┐  ┌──────────────────────────┐
│   GitHub Actions           │  │   Query CLI              │
│   Workflow                 │  │   (Local/Server)         │
│                            │  │                          │
│ 1. Checkout repo           │  │ 1. Parse query           │
│ 2. Setup Node.js           │  │ 2. Generate embedding    │
│ 3. Install deps            │  │ 3. Call RPC              │
│ 4. Run indexer ───────────►│  │ 4. Format results        │
└────────────┬───────────────┘  └──────────┬───────────────┘
             │                             │
             │ Index Updates               │ Search Request
             ▼                             ▼
┌──────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL + pgvector)            │
│                                                          │
│  ┌───────────────────┐      ┌─────────────────────┐     │
│  │ knowledge_chunks  │      │ RPCs & Functions    │     │
│  │                   │      │                     │     │
│  │ • id (uuid)       │      │ • match_knowledge   │     │
│  │ • file_path       │      │   _chunks()         │     │
│  │ • breadcrumb      │      │ • delete_chunks     │     │
│  │ • content         │      │   _by_file()        │     │
│  │ • content_hash    │      │                     │     │
│  │ • embedding       │◄─────┤                     │     │
│  │   VECTOR(1536)    │      │                     │     │
│  │ • metadata        │      │                     │     │
│  │ • timestamps      │      │                     │     │
│  └───────────────────┘      └─────────────────────┘     │
│                                                          │
│  Indexes:                                                │
│  • IVFFlat on embedding (cosine similarity)              │
│  • B-tree on file_path, content_hash, created_at         │
│                                                          │
│  RLS Policies:                                           │
│  • READ: authenticated users                             │
│  • WRITE: service_role only                              │
└──────────────────────────────────────────────────────────┘
                             ▲
                             │
                             │ Embeddings API
                             ▼
                  ┌──────────────────────┐
                  │   OpenAI API         │
                  │                      │
                  │ text-embedding-      │
                  │ 3-small              │
                  │                      │
                  │ Input: Text          │
                  │ Output: [1536]float  │
                  └──────────────────────┘
```

---

## 🔄 Indexing Pipeline

### **Phase 1: Discovery**

```typescript
// Scan filesystem for markdown files
const patterns = [
  "docs/**/*.md",
  "README.md",
  "AI_CODING_INSTRUCTIONS.md",
  ".agent/workflows/*.md",
  "**/README.md",
];

const files = await glob(patterns);
// Result: ['docs/strategy/AGENTS.md', 'README.md', ...]
```

**Output**: List of file paths to process

---

### **Phase 2: Text Splitting**

```typescript
// Hierarchy-aware Markdown splitting
const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: 1000, // Target chunk size
  chunkOverlap: 200, // Overlap between chunks
});

const chunks = await splitter.splitText(fileContent);
```

**Key Features**:

- Respects Markdown structure (headings, code blocks)
- Maintains context with overlap
- Builds hierarchical breadcrumbs

**Example Breadcrumb**:

```
docs/strategy/AGENTS.md > Phase 1: Planning > Expert Consultation
```

---

### **Phase 3: Change Detection**

```typescript
// SHA256 hashing for deduplication
const contentHash = crypto
  .createHash("sha256")
  .update(chunkContent, "utf8")
  .digest("hex");

// Check if chunk exists with same hash
const existing = await supabase
  .from("knowledge_chunks")
  .select("id")
  .eq("file_path", filePath)
  .eq("content_hash", contentHash);

if (existing.data?.length > 0) {
  // Skip - content unchanged
  continue;
}
```

**Why SHA256?**

- Deterministic: Same content = same hash
- Fast: O(n) complexity
- Collision-resistant: Virtually impossible for docs

---

### **Phase 4: Embedding Generation**

```typescript
// OpenAI API call with rate limiting
const limit = pLimit(10); // 10 concurrent requests

const embeddings = await Promise.all(
  chunks.map((chunk) =>
    limit(async () => {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.content,
        encoding_format: "float",
      });
      return response.data[0].embedding; // [1536] floats
    }),
  ),
);
```

**Rate Limiting**:

- Prevents API throttling
- Configurable concurrency (default: 10)
- Automatic retries with exponential backoff

---

### **Phase 5: Database Upsert**

```typescript
// Insert or update chunks
const { error } = await supabase.from("knowledge_chunks").upsert(rows, {
  onConflict: "file_path,content_hash",
});

// Delete orphaned chunks (removed from file)
await supabase.rpc("delete_chunks_by_file", {
  target_file_path: filePath,
  keep_hashes: currentHashes,
});
```

**Atomic Operations**:

- Upsert: Prevents duplicates
- Delete: Cleans up orphans
- Transaction: All-or-nothing

---

## 🔍 Query Pipeline

### **Phase 1: Query Embedding**

```typescript
// Convert natural language to vector
const { embedding } = await generateEmbedding(userQuery);
// Input: "How does offline sync work?"
// Output: [1536] floats
```

---

### **Phase 2: Vector Similarity Search**

```sql
-- RPC: match_knowledge_chunks
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
```

**Similarity Metric**: Cosine similarity (1 - cosine distance)

- 1.0 = Identical
- 0.7+ = Highly relevant
- 0.5+ = Somewhat relevant
- < 0.5 = Not relevant

---

### **Phase 3: Result Formatting**

```typescript
// Format and display results
results.forEach((result, index) => {
  console.log(`📄 Result ${index + 1}: ${result.breadcrumb}`);
  console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
  console.log(`   Preview: ${result.content.substring(0, 300)}...`);
});
```

---

## 🗄️ Database Schema

### **Table: knowledge_chunks**

```sql
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- File identification
  file_path TEXT NOT NULL,
  breadcrumb TEXT,

  -- Content
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,

  -- Vector representation
  embedding VECTOR(1536) NOT NULL,

  -- Extensible metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_file_hash UNIQUE (file_path, content_hash)
);
```

### **Indexes**

```sql
-- Vector similarity search (IVFFlat)
CREATE INDEX knowledge_chunks_embedding_idx
  ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- File path lookups
CREATE INDEX knowledge_chunks_file_path_idx
  ON knowledge_chunks (file_path);

-- Hash lookups for change detection
CREATE INDEX knowledge_chunks_content_hash_idx
  ON knowledge_chunks (content_hash);

-- Timestamp filtering
CREATE INDEX knowledge_chunks_created_at_idx
  ON knowledge_chunks (created_at DESC);
```

**IVFFlat Index**:

- `lists = 100`: Optimal for 730-10,000 chunks
- `vector_cosine_ops`: Optimized for cosine similarity
- Trade-off: ~95% recall for 10x speed improvement

---

### **RPCs**

#### **match_knowledge_chunks**

```sql
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  file_path TEXT,
  breadcrumb TEXT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.file_path,
    kc.breadcrumb,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

#### **delete_chunks_by_file**

```sql
CREATE OR REPLACE FUNCTION delete_chunks_by_file(
  target_file_path TEXT,
  keep_hashes TEXT[]
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM knowledge_chunks
  WHERE file_path = target_file_path
    AND content_hash != ALL(keep_hashes);
END;
$$ LANGUAGE plpgsql;
```

---

## 🔒 Security Architecture

### **Row-Level Security (RLS)**

```sql
-- Enable RLS
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Read policy (authenticated users)
CREATE POLICY "Allow authenticated users to read knowledge chunks"
  ON knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (true);

-- Write policy (service role only - implicit)
-- No explicit policy needed - defaults to denying non-service-role writes
```

### **Key Management**

```
┌─────────────────────────────────────────────────────┐
│           Secret Management Strategy                 │
└─────────────────────────────────────────────────────┘

Local Development:
  .env file (git-ignored)
  ├── SUPABASE_URL
  ├── SUPABASE_SERVICE_ROLE_KEY
  └── OPENAI_API_KEY

CI/CD (GitHub Actions):
  Repository Secrets
  ├── SUPABASE_URL
  ├── SUPABASE_SERVICE_ROLE_KEY
  └── OPENAI_API_KEY

Never Exposed To:
  ❌ Client-side code
  ❌ Git repository
  ❌ Public logs
  ❌ Unauthenticated endpoints
```

---

## 📊 Performance Characteristics

### **Scalability**

| Chunk Count    | Index Type | Search Time | Build Time |
| -------------- | ---------- | ----------- | ---------- |
| 100-1,000      | IVFFlat    | ~30ms       | ~5s        |
| 1,000-10,000   | IVFFlat    | ~50ms       | ~30s       |
| 10,000-100,000 | IVFFlat    | ~100ms      | ~3min      |
| 100,000+       | HNSW       | ~20ms       | ~15min     |

**Current Scale**: 730 chunks → ~30-50ms search time

### **Cost Optimization Strategies**

1. **Hash-Based Deduplication**
   - Avoids re-embedding unchanged content
   - Savings: ~95% on incremental updates

2. **Rate Limiting**
   - Prevents API throttling
   - Stays within free tier limits

3. **Manual Trigger**
   - Only runs when explicitly needed
   - Avoids wasteful auto-indexing

4. **Batch Processing**
   - Processes 10 chunks concurrently
   - Optimal throughput vs. rate limits

---

## 🔄 Data Flow Diagrams

### **Indexing Flow**

```
File System                  Indexer                    OpenAI API           Supabase
    │                           │                             │                  │
    │  Read .md files           │                             │                  │
    ├──────────────────────────►│                             │                  │
    │                           │                             │                  │
    │                           │  Split into chunks          │                  │
    │                           ├─────────┐                   │                  │
    │                           │         │                   │                  │
    │                           │◄────────┘                   │                  │
    │                           │                             │                  │
    │                           │  Generate SHA256 hashes     │                  │
    │                           ├─────────┐                   │                  │
    │                           │         │                   │                  │
    │                           │◄────────┘                   │                  │
    │                           │                             │                  │
    │                           │  Query existing hashes      │                  │
    │                           ├─────────────────────────────────────────────────►│
    │                           │                             │                  │
    │                           │◄─────────────────────────────────────────────────┤
    │                           │  (list of existing hashes)  │                  │
    │                           │                             │                  │
    │                           │  Filter changed chunks      │                  │
    │                           ├─────────┐                   │                  │
    │                           │         │                   │                  │
    │                           │◄────────┘                   │                  │
    │                           │                             │                  │
    │                           │  Generate embeddings        │                  │
    │                           ├────────────────────────────►│                  │
    │                           │                             │                  │
    │                           │◄────────────────────────────┤                  │
    │                           │  (1536-dim vectors)         │                  │
    │                           │                             │                  │
    │                           │  Upsert chunks                                │
    │                           ├─────────────────────────────────────────────────►│
    │                           │                             │                  │
    │                           │  Delete orphaned chunks                        │
    │                           ├─────────────────────────────────────────────────►│
    │                           │                             │                  │
    │                           │◄─────────────────────────────────────────────────┤
    │                           │  (success confirmation)     │                  │
```

### **Query Flow**

```
CLI User                 Query Script              OpenAI API           Supabase
   │                          │                          │                  │
   │  "How does X work?"      │                          │                  │
   ├─────────────────────────►│                          │                  │
   │                          │                          │                  │
   │                          │  Generate embedding      │                  │
   │                          ├─────────────────────────►│                  │
   │                          │                          │                  │
   │                          │◄─────────────────────────┤                  │
   │                          │  (1536-dim vector)       │                  │
   │                          │                          │                  │
   │                          │  Call match_knowledge_chunks RPC            │
   │                          ├─────────────────────────────────────────────►│
   │                          │  {                       │                  │
   │                          │    query_embedding,      │                  │
   │                          │    match_threshold: 0.5, │                  │
   │                          │    match_count: 5        │                  │
   │                          │  }                       │                  │
   │                          │                          │                  │
   │                          │◄─────────────────────────────────────────────┤
   │                          │  (top 5 results)         │                  │
   │                          │                          │                  │
   │                          │  Format results          │                  │
   │                          ├─────────┐                │                  │
   │                          │         │                │                  │
   │                          │◄────────┘                │                  │
   │                          │                          │                  │
   │◄─────────────────────────┤                          │                  │
   │  (formatted output)      │                          │                  │
```

---

## 🚀 Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         GitHub                                  │
│                                                                 │
│  ┌──────────────────┐         ┌─────────────────────────┐      │
│  │  Code Repository │         │   GitHub Actions        │      │
│  │                  │         │                         │      │
│  │  • Docs (.md)    │────────►│  Manual Trigger         │      │
│  │  • Scripts       │         │  (workflow_dispatch)    │      │
│  │  • Migrations    │         │                         │      │
│  └──────────────────┘         │  Steps:                 │      │
│                               │  1. Checkout            │      │
│  ┌──────────────────┐         │  2. Setup Node.js       │      │
│  │  Secrets         │────────►│  3. Install deps        │      │
│  │                  │         │  4. Run indexer ────────┼──────┼───┐
│  │  • SUPABASE_URL  │         │  5. Report results      │      │   │
│  │  • SERVICE_KEY   │         └─────────────────────────┘      │   │
│  │  • OPENAI_KEY    │                                          │   │
│  └──────────────────┘                                          │   │
└────────────────────────────────────────────────────────────────┘   │
                                                                     │
                                                                     │
┌────────────────────────────────────────────────────────────────┐  │
│                         Supabase Cloud                          │  │
│                                                                 │  │
│  ┌─────────────────────────────────────────────────────────┐   │  │
│  │             PostgreSQL + pgvector                        │   │  │
│  │                                                          │   │  │
│  │  knowledge_chunks table                                  │◄──┼──┘
│  │  • 730+ chunks                                           │   │
│  │  • 1536-dim vectors                                      │   │
│  │  • IVFFlat index                                         │   │
│  │  • RLS policies                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                                    │ Search Queries
                                    │
                            ┌───────┴────────┐
                            │  Local CLI     │
                            │  or           │
                            │  Future API    │
                            └────────────────┘
```

---

## 🔮 Future Enhancements

### **Phase 2: Advanced Search**

- Hybrid search (vector + full-text)
- Reranking with cross-encoder models
- Query expansion and synonyms
- Filters (file type, date range, etc.)

### **Phase 3: UI Integration**

- Web-based search interface
- VS Code extension

- API endpoint for external tools

### **Phase 4: Intelligence**

- Automatic query suggestions
- Related document recommendations
- Usage analytics and insights
- Quality scoring for chunks

### **Phase 5: Multi-Modal**

- Image/diagram indexing
- Code snippet search
- Mermaid diagram parsing
- Video transcript search

---

## 📚 References

- **pgvector Documentation**: https://github.com/pgvector/pgvector
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings
- **LangChain Text Splitters**: https://js.langchain.com/docs/modules/data_connection/document_transformers/
- **GitHub Actions**: https://docs.github.com/en/actions

---

**Last Updated**: 2026-02-04  
**Maintained By**: Questerix Development Team
