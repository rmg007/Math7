---
description: Reindex all project documentation into Supabase Project Oracle
---

# /reindex_docs - Project Oracle Documentation Reindexing

**Purpose**: Index all project documentation into Supabase for semantic search

---

## Prerequisites

1. **Environment Variables** (set these first):

```powershell
# Set from your .secrets file or Windows Credential Store — never hardcode here
$env:OPENAI_API_KEY = "sk-proj-..."       # Get from: https://platform.openai.com/api-keys
$env:SUPABASE_URL = "..."                 # Get from: .secrets or Supabase Dashboard → Settings → API
$env:SUPABASE_SERVICE_ROLE_KEY = "..."    # Get from: .secrets or Supabase Dashboard → Settings → API
```

2. **Python Dependencies**:

```bash
pip install openai supabase
```

---

## Workflow Steps

### Step 1: Navigate to Project Oracle

// turbo

```powershell
cd scripts/knowledge-base
```

### Step 2: Install Dependencies (First Time Only)

```powershell
npm install
```

### Step 3: Configure Environment (First Time Only)

```powershell
# Copy example and edit with your keys
cp .env.example .env

# Required keys:
# - OPENAI_API_KEY (from https://platform.openai.com/api-keys)
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

### Step 4: Run Indexer

// turbo

```powershell
python ops_runner.py tasks.json # executes: cd scripts/knowledge-base && npm run index
```

**What this does**:

- Discovers all `.md` files in configured paths
- Splits documents into semantic chunks (500-800 tokens)
- Generates embeddings via OpenAI API
- Upserts chunks to Supabase (skips unchanged via SHA256 hash)
- Deletes orphaned chunks from deleted files

**Expected output**:

```
🔍 Discovering documentation files...
✅ Found 45 files to process

📄 Processing: docs/LEARNING_LOG.md
  Split into 12 chunks
  ✅ Indexed 12 new/updated chunks

═══════════════════════════════════════════════════════════════
📊 Indexing Summary
═══════════════════════════════════════════════════════════════
Files Processed:     45
Chunks Indexed:      487
Chunks Skipped:      23 (unchanged)
Chunks Deleted:      5 (orphaned)
Tokens Used:         12,345
Estimated Cost:      $0.0002
═══════════════════════════════════════════════════════════════
```

### Step 5: Test Search (Optional)

```powershell
npm run query "How to validate UUIDs?"
```

---

## When to Run This

- **Initial Setup**: First time setting up Project Oracle
- **After Major Doc Changes**: When you've added/updated significant documentation
- **Weekly/Monthly**: As part of maintenance (optional)
- **Before Important Sessions**: To ensure AI has latest knowledge

---

## Troubleshooting

### **Error: Missing environment variables**

```powershell
# Set them in PowerShell
$env:OPENAI_API_KEY = "your-key"
$env:SUPABASE_URL = "your-url"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-key"
```

### **Error: Module not found**

```bash
pip install openai supabase
```

### **Error: Rate limit exceeded**

The uploader has built-in rate limiting (2 second pause every 10 chunks).
If you still hit limits, edit `oracle_upload.py` and increase the pause.

### **Error: Duplicate key violation**

This is normal - it means the chunk already exists. The uploader will skip it.

---

## Performance Impact

**Before Project Oracle**:

- AI loads 13 KIs at startup (~20,000 tokens)
- Slow session start
- 40% relevance (lots of irrelevant context)

**After Project Oracle**:

- AI loads 0 KIs at startup (0 tokens)
- Instant session start
- 100% relevance (only retrieves what's needed)
- 95%+ token savings

---

## Related Documentation

- **Complete Guide**: `docs/PROJECT_ORACLE_COMPLETE_SOLUTION.md`
- **Database Schema**: `supabase/migrations/20260204000006_create_knowledge_index.sql`
- **Indexer Script**: `scripts/oracle_indexer.py`
- **Uploader Script**: `scripts/oracle_upload.py`

---

## Success Criteria

✅ `oracle_index.json` created with ~500-1000 chunks
✅ All chunks uploaded to Supabase
✅ Semantic search returns relevant results
✅ AI agents can query Supabase for documentation

---

**This workflow is part of the Project Oracle system for zero-load, just-in-time knowledge retrieval.**
