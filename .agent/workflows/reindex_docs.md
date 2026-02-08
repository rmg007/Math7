---
description: Manually trigger documentation reindexing for Project Oracle
---

// turbo-all

# /reindex_docs - Manual Documentation Reindex

> **⚡ Superpower Fallback**: If commands need approval, use `/sp` - I output JSON, you paste into `tasks.json`, watcher runs it.

This workflow manually triggers the Project Oracle documentation indexer to rebuild the vector search index.

## When to Use

Run this workflow when:
- ✅ You've made significant documentation changes
- ✅ You want to make docs searchable immediately
- ✅ You've added new documentation files
- ✅ You're troubleshooting search issues

## Cost Estimate

**Before running, note:**
- Full reindex: ~122,925 tokens = **$0.0025** (less than 1 penny)
- Partial update: ~1,500 tokens/file = **$0.00003** per file
- Hash deduplication: Unchanged chunks cost **$0**

## How to Trigger

### Option 1: GitHub Actions UI (Easiest)

1. Go to: https://github.com/rmg007/Questerix/actions/workflows/docs-index.yml
2. Click **"Run workflow"** button (top right)
3. Select branch: `main`
4. Enter optional reason (e.g., "Added new architecture docs")
5. Click **"Run workflow"**

### Option 2: GitHub CLI

```bash
gh workflow run docs-index.yml \
  --ref main \
  --field reason="Your reason here"
```

### Option 3: REST API

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/rmg007/Questerix/actions/workflows/docs-index.yml/dispatches \
  -d '{"ref":"main","inputs":{"reason":"Your reason here"}}'
```

## What Gets Indexed

The indexer scans and indexes:
- `docs/**/*.md` - All documentation subdirectories
- `README.md`, `AI_CODING_INSTRUCTIONS.md`, `ROADMAP.md` - Root docs
- `.agent/workflows/*.md` - Workflow definitions
- `student-app/README.md`, `admin-panel/README.md`, etc. - App READMEs

**Total:** ~61 files, ~730 chunks

## Workflow Details

**GitHub Actions Workflow:** `.github/workflows/docs-index.yml`

**Steps:**
1. Log reindex trigger reason and user
2. Checkout repository
3. Setup Node.js 20
4. Install dependencies (`npm ci`)
5. Run indexer script
6. Show summary (files processed, chunks indexed, cost)

**Duration:** 2-3 minutes

**Secrets Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## Monitoring

After triggering:
1. Go to **Actions** tab on GitHub
2. Click the running workflow
3. View live logs
4. Check summary for:
   - Files processed
   - Chunks indexed/skipped
   - Tokens used
   - Estimated cost

## Change Detection (Hash-Based)

The indexer uses **SHA256 hashing** to detect changes:
- ✅ **New chunks**: Embedded and inserted
- ✅ **Modified chunks**: Re-embedded and updated
- ✅ **Unchanged chunks**: Skipped (no API calls = $0)
- ✅ **Deleted chunks**: Removed from database

**Result:** Running reindex multiple times is safe and cheap!

## Local Testing (Before GitHub Run)

Want to test locally first?

```bash
cd scripts/knowledge-base
npm install
npm run index
```

This runs the same indexer locally using your `.env` credentials.

## Troubleshooting

**Workflow not appearing?**
- Ensure you're on the `main` branch
- Check `.github/workflows/docs-index.yml` exists
- Verify GitHub Actions is enabled for the repo

**Workflow fails?**
- Check GitHub Secrets are set correctly
- Verify OpenAI API key has credits
- Check Supabase service role key is valid

**No results in search after reindex?**
- Verify database has chunks: `SELECT COUNT(*) FROM knowledge_chunks;`
- Check RPC function exists: `SELECT * FROM pg_proc WHERE proname = 'match_knowledge_chunks';`
- Test search: `cd scripts/knowledge-base && npm run query "your query"`

## Example Usage

### Scenario 1: After Major Docs Update
```
Reason: "Updated all Phase 9 documentation with final implementation details"
Expected: ~50 chunks re-indexed, ~$0.001
```

### Scenario 2: New Feature Documentation
```
Reason: "Added Phase 11 Project Oracle architecture guide"
Expected: ~20 new chunks, ~$0.0004
```

### Scenario 3: Troubleshooting Search
```
Reason: "Rebuilding index to fix search issues"
Expected: Most chunks skipped (hash match), ~$0
```

## Best Practices

✅ **Do:**
- Add a descriptive reason for audit trail
- Run after significant doc changes
- Wait for previous run to complete before triggering again

❌ **Don't:**
- Run multiple times in quick succession
- Run without a reason (makes audit harder)
- Run if docs haven't changed (waste of time/money)

## Related Documentation

- **Setup Guide**: `scripts/knowledge-base/README.md`
- **Architecture**: `docs/technical/KNOWLEDGE_INDEX.md`
- **Query Docs**: Use `npm run query "your question"` after indexing
- **Migration**: `supabase/migrations/20260204000006_create_knowledge_index.sql`

---

**Built for cost-effective, on-demand documentation indexing** 💰
