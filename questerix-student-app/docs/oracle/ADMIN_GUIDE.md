# 🔧 Project Oracle - Admin Guide

**Complete guide for administrators managing the Oracle documentation index**

---

## 👥 Who This Guide Is For

This guide is for:

- ✅ Repository administrators
- ✅ DevOps engineers
- ✅ Technical leads managing documentation
- ✅ Anyone with access to GitHub Actions

If you're just searching docs, see the [User Guide](USER_GUIDE.md) instead.

---

## 🎯 Administrator Responsibilities

As an admin, you're responsible for:

1. **Triggering Reindex** - When documentation changes need to be searchable
2. **Monitoring Costs** - Keeping OpenAI API usage reasonable
3. **Managing Secrets** - Ensuring GitHub Secrets are configured correctly
4. **Troubleshooting** - Resolving indexing or search issues
5. **Performance** - Monitoring search performance and index health

---

## 🚀 Triggering Manual Reindex

### **When to Trigger**

Trigger a reindex when:

- ✅ Significant documentation changes have been made
- ✅ New documentation files have been added
- ✅ Documentation has been restructured
- ✅ Search results seem outdated
- ✅ Troubleshooting search issues

**Don't trigger** reindex:

- ❌ After every single commit
- ❌ For minor typo fixes
- ❌ Multiple times in quick succession
- ❌ Without a clear reason

---

### **Method 1: GitHub Actions UI** (Recommended)

1. **Navigate to Actions**:

   ```
   https://github.com/rmg007/Questerix/actions/workflows/docs-index.yml
   ```

2. **Click "Run workflow"** button (top right)

3. **Fill in details**:
   - **Branch**: Select `main`
   - **Reason** (optional): Enter why you're reindexing
     - Examples:
       - "Added Phase 12 documentation"
       - "Restructured architecture docs"
       - "Troubleshooting search issues"

4. **Click "Run workflow"** again to confirm

5. **Monitor progress**:
   - Workflow appears in the list below
   - Click on it to see live logs
   - Wait ~2 minutes for completion

---

### **Method 2: GitHub CLI**

If you have `gh` CLI installed:

```bash
gh workflow run docs-index.yml \
  --ref main \
  --field reason="Your reason here"
```

**Check status**:

```bash
gh run list --workflow=docs-index.yml --limit 5
```

**View logs**:

```bash
gh run view --log
```

---

### **Method 3: REST API**

For automation or scripts:

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/rmg007/Questerix/actions/workflows/docs-index.yml/dispatches \
  -d '{
    "ref":"main",
    "inputs":{
      "reason":"Automated reindex via API"
    }
  }'
```

---

## 📊 Monitoring Reindex Runs

### **Viewing Workflow History**

1. Go to: https://github.com/rmg007/Questerix/actions
2. Click on "Reindex Documentation (Manual)" workflow
3. View list of past runs with:
   - **Status**: ✅ Success, ❌ Failed, 🔄 Running
   - **Trigger**: Who/what triggered it
   - **Duration**: How long it took
   - **Reason**: Why it was triggered

---

### **Analyzing Workflow Logs**

Click on any run to see detailed logs:

```
✅ Set up job                   1s
✅ Log reindex reason           0s
    🔄 Manual reindex triggered
    Reason: Added Phase 12 documentation
    Triggered by: rmg007
✅ Checkout repository          4s
✅ Setup Node.js                3s
✅ Install dependencies        22s
✅ Index documentation         1m 37s
    🔍 Discovering documentation files...
    ✅ Found 64 files to process

    📄 Processing: docs/strategy/AGENTS.md
      Split into 12 chunks
      ✅ Indexed 12 new/updated chunks (1,789 tokens)

    ... (more files) ...

    📊 Indexing Summary
    Files Processed:     64
    Chunks Indexed:      42
    Chunks Skipped:      688
    Tokens Used:         6,234
    Estimated Cost:      $0.0001
✅ Report results               0s
✅ Complete job                 0s
```

**Key metrics to check**:

- **Files Processed**: Should match expected count (~61-64)
- **Chunks Indexed**: New/modified chunks only
- **Chunks Skipped**: Unchanged chunks (hash match)
- **Tokens Used**: Lower is better (means less changed)
- **Estimated Cost**: Should be < $0.001 for incremental updates

---

## 💰 Cost Management

### **Current Cost Structure**

| Operation                           | Cost per Token | Cost per Run |
| ----------------------------------- | -------------- | ------------ |
| Embeddings (text-embedding-3-small) | $0.00000002    | Variable     |
| Full reindex (730 chunks)           | -              | ~$0.0025     |
| Incremental update (50 chunks)      | -              | ~$0.0002     |
| Typical monthly usage               | -              | < $0.01      |

---

### **Cost Monitoring**

1. **Check OpenAI Dashboard**:
   - Go to: https://platform.openai.com/usage
   - Look for `text-embedding-3-small` usage
   - Filter by date range

2. **Estimate from Workflow Logs**:

   ```
   Tokens Used: 6,234
   Cost = 6,234 × $0.00000002 = $0.00012
   ```

3. **Monthly Budget Alert**:
   - Set up OpenAI usage alerts
   - Recommended: $1.00/month threshold
   - Current usage: <$0.01/month

---

### **Cost Optimization Tips**

✅ **Do**:

- Only reindex when necessary
- Let hash deduplication do its job
- Review "Chunks Skipped" in logs (higher = more savings)
- Consolidate documentation changes before reindexing

❌ **Don't**:

- Reindex after every commit
- Disable hash deduplication
- Run multiple reindexes simultaneously
- Reindex if no docs have changed

---

## 🔐 Managing GitHub Secrets

### **Required Secrets**

Three secrets must be configured in GitHub:

1. **SUPABASE_URL**
   - Format: `https://PROJECT_ID.supabase.co`
   - Example: `https://qvslbiceoonrgjxzkotb.supabase.co`
   - Found in: Supabase Dashboard > Settings > API

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Format: Long JWT token (starts with `eyJ...`)
   - Found in: Supabase Dashboard > Settings > API
   - ⚠️ **CRITICAL**: This key bypasses all RLS policies!

3. **OPENAI_API_KEY**
   - Format: `sk-proj-...` (project API key)
   - Found in: OpenAI Dashboard > API Keys
   - ⚠️ **CRITICAL**: Direct billing access!

---

### **Adding/Updating Secrets**

1. **Navigate to Secrets page**:

   ```
   https://github.com/rmg007/Questerix/settings/secrets/actions
   ```

2. **Add new secret**:
   - Click "New repository secret"
   - Name: Enter exact name (e.g., `OPENAI_API_KEY`)
   - Secret: Paste the value
   - Click "Add secret"

3. **Update existing secret**:
   - Click on secret name
   - Click "Update secret"
   - Enter new value
   - Click "Update secret"

---

### **Secret Rotation**

Rotate secrets periodically for security:

**OpenAI API Key** (Every 90 days):

1. Go to OpenAI Dashboard
2. Create new project API key
3. Update GitHub Secret
4. Test with a reindex run
5. Delete old key from OpenAI

**Supabase Service Role Key** (Rarely, only if compromised):

1. ⚠️ **WARNING**: Requires Supabase project reset
2. Contact Supabase support
3. Get new service role key
4. Update GitHub Secret
5. Update local `.env` files

---

## 🔍 Index Health Monitoring

### **Checking Index Status**

Run this SQL query in Supabase to check index health:

```sql
-- Total chunks
SELECT COUNT(*) as total_chunks
FROM knowledge_chunks;

-- Chunks per file
SELECT
  file_path,
  COUNT(*) as chunk_count,
  MAX(updated_at) as last_updated
FROM knowledge_chunks
GROUP BY file_path
ORDER BY chunk_count DESC
LIMIT 20;

-- Recent updates
SELECT
  file_path,
  COUNT(*) as chunks_updated,
  MAX(updated_at) as last_update
FROM knowledge_chunks
WHERE updated_at > NOW() - INTERVAL '7 days'
GROUP BY file_path
ORDER BY last_update DESC;

-- Index size
SELECT
  pg_size_pretty(pg_total_relation_size('knowledge_chunks')) as table_size,
  pg_size_pretty(pg_indexes_size('knowledge_chunks')) as index_size;
```

**Expected values**:

- Total chunks: 700-800
- Chunks per file: 5-20 (typical)
- Table size: 10-50 MB
- Index size: 20-100 MB

---

### **Detecting Issues**

| Symptom           | Possible Cause       | Solution                    |
| ----------------- | -------------------- | --------------------------- |
| Chunks = 0        | Index never run      | Trigger reindex             |
| Chunks < 500      | Incomplete index     | Check workflow logs, rerun  |
| Old timestamps    | Index outdated       | Trigger reindex             |
| No recent updates | Workflow not running | Check GitHub Actions status |
| Large index size  | Too many chunks      | Normal if docs grew         |

---

## 🛠️ Troubleshooting

### **Workflow Fails with "Missing environment variables"**

**Cause**: GitHub Secrets not configured

**Solution**:

1. Go to repository Settings > Secrets
2. Verify all 3 secrets exist:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
3. If missing, add them (see "Managing Secrets" section)
4. Rerun workflow

---

### **Workflow Fails with "OpenAI API error"**

**Possible causes**:

- API key invalid/expired
- Rate limit exceeded
- OpenAI service outage
- Insufficient credits

**Solutions**:

1. Check OpenAI Dashboard for issues
2. Verify API key is valid
3. Check rate limits (500 req/min for free tier)
4. Add credits to OpenAI account if needed
5. Wait a few minutes and retry

---

### **Workflow Fails with "Supabase error"**

**Possible causes**:

- Service role key invalid
- Network issues
- Supabase project paused
- Database connection limit

**Solutions**:

1. Verify Supabase project is active
2. Check service role key in Supabase Dashboard
3. Update GitHub Secret if key changed
4. Check Supabase status page
5. Rerun workflow

---

### **Indexing is very slow**

**Causes**:

- Large number of new/changed files
- Network latency to OpenAI
- Rate limiting

**Solutions**:

- Normal for first run (2-3 minutes expected)
- Subsequent runs should be faster (hash deduplication)
- If consistently slow, check:
  - OpenAI rate limits
  - Network issues
  - Consider increasing concurrency (advanced)

---

### **Search returns no results after reindex**

**Diagnostic steps**:

1. **Check index populated**:

   ```sql
   SELECT COUNT(*) FROM knowledge_chunks;
   ```

   Should be > 700

2. **Check embeddings exist**:

   ```sql
   SELECT COUNT(*) FROM knowledge_chunks WHERE embedding IS NOT NULL;
   ```

   Should match total count

3. **Test RPC directly**:

   ```sql
   SELECT * FROM match_knowledge_chunks(
     ARRAY[0.1, 0.2, 0.3, ...]::vector(1536), -- dummy vector
     0.0, -- very low threshold
     10
   );
   ```

4. **Check workflow logs**:
   - Did indexing complete successfully?
   - Were embeddings generated?
   - Any errors in logs?

---

## 📈 Performance Tuning

### **Adjusting IVFFlat Index**

For optimal performance as the index grows:

```sql
-- Current settings (optimal for 700-10,000 chunks)
CREATE INDEX knowledge_chunks_embedding_idx
  ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- For larger indexes (10,000-100,000 chunks)
DROP INDEX knowledge_chunks_embedding_idx;
CREATE INDEX knowledge_chunks_embedding_idx
  ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 500);

-- Rebuild statistics
ANALYZE knowledge_chunks;
```

**When to adjust**:

- **lists = 100**: 700-10,000 chunks (current)
- **lists = 500**: 10,000-100,000 chunks
- **lists = 1000**: 100,000+ chunks

---

### **Monitoring Query Performance**

Track search performance with this query:

```sql
EXPLAIN ANALYZE
SELECT *
FROM match_knowledge_chunks(
  (SELECT embedding FROM knowledge_chunks LIMIT 1),
  0.5,
  5
);
```

**Expected performance**:

- Index scan: 20-50ms
- Total time: 30-100ms

If slower:

- Rebuild index (REINDEX)
- Adjust `lists` parameter
- Check for database load

---

## 🔄 Maintenance Tasks

### **Weekly**

- ✅ Review workflow runs for errors
- ✅ Check "Chunks Skipped" ratio (should be high)
- ✅ Monitor OpenAI costs

### **Monthly**

- ✅ Verify index health (run diagnostic queries)
- ✅ Review documentation coverage
- ✅ Check for orphaned chunks
- ✅ Audit GitHub Secret usage

### **Quarterly**

- ✅ Rotate OpenAI API key
- ✅ Review and optimize indexed paths
- ✅ Consider IVFFlat index tuning
- ✅ Archive old/unused documentation

---

## 📚 Admin Checklist

### **New Admin Onboarding**

- [ ] Access to GitHub repository (Admin role)
- [ ] Access to Supabase dashboard
- [ ] Access to OpenAI account
- [ ] Read this Admin Guide
- [ ] Review Architecture documentation
- [ ] Test trigger reindex
- [ ] Verify can view workflow logs
- [ ] Set up cost monitoring alerts

### **Monthly Health Check**

- [ ] Trigger test reindex
- [ ] Review past month's runs
- [ ] Check total OpenAI costs
- [ ] Verify index chunk count
- [ ] Test search functionality
- [ ] Review any error logs
- [ ] Update documentation if needed

---

## 🆘 Escalation

If you encounter issues you can't resolve:

1. **Check documentation**:
   - This Admin Guide
   - [Troubleshooting Guide](TROUBLESHOOTING.md)
   - [Architecture docs](ARCHITECTURE.md)

2. **Review logs**:
   - GitHub Actions workflow logs
   - Supabase logs
   - OpenAI usage dashboard

3. **Ask for help**:
   - Document the issue (what, when, errors)
   - Include relevant logs
   - Note what you've tried
   - Contact development team

---

## 📚 Additional Resources

- **User Guide**: For search usage
- **Architecture**: System design details
- **API Reference**: Database schema and RPCs
- **Deployment Guide**: Initial setup
- **Cost Analysis**: Detailed cost breakdown

---

**Questions?** Contact the development team or create an issue in the repository.
