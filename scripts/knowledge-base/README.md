# 🔮 Project Oracle - Documentation RAG System

**Semantic search over all Questerix documentation for AI agents**

## 🎯 Overview

Project Oracle is a self-updating knowledge index that enables AI agents to semantically search project documentation using RAG (Retrieval-Augmented Generation). It automatically indexes all markdown documentation, maintains change detection, and provides a fast query interface.

## 🏗️ Architecture

- **Vector Store**: Supabase with `pgvector` extension
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Indexing**: Hierarchy-aware Markdown splitter with change detection (SHA256)
- **Search**: Cosine similarity via `match_knowledge_chunks` RPC

## 📋 Prerequisites

1. **OpenAI API Key**: For generating embeddings
   - Get yours at: https://platform.openai.com/api-keys
   - Required permission: `Embeddings` access

2. **Supabase Service Role Key**: For database access
   - Found in: Supabase Dashboard > Settings > API
   - ⚠️ **NEVER commit this key** - it bypasses all RLS policies

## 🚀 Setup

1. **Install dependencies**:
   ```bash
   cd scripts/knowledge-base
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your keys:
   # - OPENAI_API_KEY
   # - SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Verify setup** (dry run):
   ```bash
   npm run test
   ```

## 📚 Usage

### **Index Documentation**

```bash
npm run index
```

**What it does:**
- Discovers all `.md` files in configured paths
- Splits documents into semantic chunks (500-800 tokens)
- Generates embeddings via OpenAI API
- Upserts chunks to Supabase (skips unchanged content via hash comparison)
- Deletes orphaned chunks (from deleted/modified files)

**Output:**
```
🔍 Discovering documentation files...
✅ Found 45 files to process

📄 Processing: docs/strategy/AGENTS.md
  Split into 12 chunks
  ✅ Indexed 12 new/updated chunks (1,234 tokens)

... (processing continues) ...

═══════════════════════════════════════════════════════════════
📊 Indexing Summary
═══════════════════════════════════════════════════════════════
Files Processed:     45
Chunks Indexed:      487
Chunks Skipped:      23
Chunks Deleted:      5
Tokens Used:         12,345
Estimated Cost:      $0.0002
═══════════════════════════════════════════════════════════════
```

### **Search Documentation**

```bash
npm run query "How does offline sync work?"
```

**Output:**
```
🔍 Searching documentation for: "How does offline sync work?"

✅ Found 5 results:

═══════════════════════════════════════════════════════════════

📄 Result 1: student-app/README.md > Core Features > Offline-First
   File: student-app/README.md
   Similarity: 89.2%
   Preview:

   The student app uses Drift for local storage with automatic sync
   to Supabase when connectivity is restored...

───────────────────────────────────────────────────────────────
... (more results) ...
```

## 🔧 Configuration

### **Indexed Paths** (edit `indexer.ts`)

By default, the indexer scans:
- `docs/**/*.md` (all subdirectories)
- Root files: `README.md`, `AI_CODING_INSTRUCTIONS.md`, `ROADMAP.md`
- Workflow definitions: `.agent/workflows/*.md`
- App-specific READMEs: `student-app/README.md`, `admin-panel/README.md`, etc.

To index additional paths, modify the `INCLUDE_PATTERNS` array.

### **Search Parameters** (edit `query-docs.ts`)

- **`matchThreshold`**: Minimum similarity score (0-1, default: 0.7)
- **`matchCount`**: Max results to return (default: 5)

## 🤖 CI/CD Integration

The indexer runs **manually via GitHub Actions** for cost control.

**Workflow**: `.github/workflows/docs-index.yml`

**Trigger Method**: Manual workflow dispatch
- Go to: https://github.com/rmg007/Questerix/actions/workflows/docs-index.yml
- Click **"Run workflow"** button
- Select branch: `main`
- Optionally provide a reason for the reindex
- Click **"Run workflow"**

**Alternative**: Use workflow command `/reindex_docs` (see `.agent/workflows/reindex_docs.md`)

**Secrets Required** (GitHub Repository Settings):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

**Why Manual?**
- ✅ Cost control - only run when needed
- ✅ Hash deduplication makes repeat runs cheap
- ✅ Typical cost per run: $0.0003 or less

## 📊 Cost Estimates

- **Initial Index** (~10,000 tokens): ~$0.0002
- **Incremental Update** (~100 tokens): ~$0.000002 per file
- **Query** (~50 tokens): ~$0.000001 per search

**Total monthly cost** (assuming daily updates): **< $0.01/month** 💰

## 🔒 Security

- Service role key is **git-ignored** (`.env`)
- Only used in server-side scripts (indexer, query CLI)
- **Never exposed to client code**
- RLS policies restrict `knowledge_chunks` to **read-only** for authenticated users

## 🧪 Testing

**Dry run** (preview changes without modifying database):
```bash
npm run index -- --dry-run
```

**Test search**:
```bash
npm run query "test query"
```

## 🛠️ Troubleshooting

### "OPENAI_API_KEY environment variable is not set"
- Ensure `.env` file exists in `scripts/knowledge-base/`
- Verify `OPENAI_API_KEY` is set correctly

### "Missing required environment variables: SUPABASE_URL"
- Check that `.env` contains both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### "Search failed: relation 'knowledge_chunks' does not exist"
- Run migration: `supabase db push` or apply `20260204000006_create_knowledge_index.sql`

### Slow indexing
- Reduce `concurrency` in `generateEmbeddings()` call (default: 10)
- OpenAI rate limits: 500 requests/min (free tier)

## 📖 Related Documentation

- Migration: `supabase/migrations/20260204000006_create_knowledge_index.sql`
- Database Schema: `docs/technical/SCHEMA.md`
- Architecture: `docs/technical/KNOWLEDGE_INDEX.md` (Phase 5 deliverable)

---

**Built with ❤️ for autonomous AI agents** 🤖
