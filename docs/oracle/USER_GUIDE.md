# 📖 Project Oracle - User Guide

**How to search Questerix documentation using semantic search**

---

## 🎯 What is Project Oracle?

Project Oracle is a **documentation search system** that understands natural language. Instead of searching for exact keywords, you can ask questions in plain English and get relevant documentation chunks.

**Example**:
- ❌ Old way: Search for "offline" → Get 100 results, many irrelevant
- ✅ New way: "How does offline sync work?" → Get top 5 most relevant explanations

---

## 🚀 Quick Start

### **Option 1: Local Search (Developers)**

1. **Navigate to knowledge-base directory**:
   ```bash
   cd scripts/knowledge-base
   ```

2. **Run a search**:
   ```bash
   npm run query "your question here"
   ```

3. **Review results**:
   ```
   ✅ Found 5 results:
   
   📄 Result 1: student-app/README.md > Core Features
      Similarity: 89.2%
      Preview: The student app uses Drift for local...
   ```

### **Option 2: Trigger Reindex (Admins)**

When documentation has been updated and you want to refresh the search index:

1. Go to GitHub Actions: https://github.com/rmg007/Questerix/actions
2. Select: **"Reindex Documentation (Manual)"**
3. Click: **"Run workflow"**
4. Optional: Enter a reason (e.g., "Added new architecture docs")
5. Click: **"Run workflow"** again to confirm

---

## 💡 How to Write Good Queries

### **✅ Good Queries**

Specific, natural questions work best:

```bash
npm run query "How does the Gatekeeper RPC pattern work?"
npm run query "What is the authentication flow for students?"
npm run query "How to add a new database migration?"
npm run query "What are the testing best practices?"
```

### **❌ Poor Queries**

Avoid vague or single-word queries:

```bash
npm run query "database"        # Too broad
npm run query "RPC"             # Too generic  
npm run query "how"             # Meaningless
npm run query "file"            # Not specific
```

### **🎯 Query Tips**

1. **Be specific**: "How does X work?" is better than just "X"
2. **Use complete questions**: Include context words
3. **Use domain terms**: "RLS policy" instead of "permission"
4. **Ask how/what/why**: Natural questions get better results

---

## 📊 Understanding Results

### **Result Format**

```
📄 Result 1: docs/strategy/AGENTS.md > Phase 1 > Planning
   File: docs/strategy/AGENTS.md
   Similarity: 92.3%
   Preview:
   
   The planning phase involves expert consultation where
   the AI agent acts as a senior technical partner...
```

### **What Each Field Means**

| Field | Meaning | Example |
|-------|---------|---------|
| **Breadcrumb** | Document hierarchy | `docs > strategy > AGENTS.md > Phase 1` |
| **File** | Source file path | `docs/strategy/AGENTS.md` |
| **Similarity** | Relevance score | `92.3%` (higher = more relevant) |
| **Preview** | Content snippet | First 300 characters of the chunk |

### **Similarity Scores**

- **90-100%**: Extremely relevant, likely the exact answer
- **70-89%**: Highly relevant, related information
- **50-69%**: Somewhat relevant, may contain useful context
- **< 50%**: Not very relevant (not shown by default)

---

## 🔍 Search Examples

### **Example 1: Architecture Question**

**Query**:
```bash
npm run query "How is multi-tenancy implemented in the database?"
```

**Expected Results**:
- Relevant chunks from `docs/technical/SCHEMA.md`
- Migration files showing multi-tenant patterns
- RLS policy examples

---

### **Example 2: Feature Implementation**

**Query**:
```bash
npm run query "How to implement a new widget in the student app?"
```

**Expected Results**:
- Student app development guide
- Widget implementation examples
- Testing patterns for widgets

---

### **Example 3: Deployment**

**Query**:
```bash
npm run query "What are the deployment steps for the admin panel?"
```

**Expected Results**:
- Deployment documentation
- Environment configuration guides
- CI/CD workflow information

---

### **Example 4: Troubleshooting**

**Query**:
```bash
npm run query "Why is the database migration failing?"
```

**Expected Results**:
- Migration troubleshooting guides
- Common error solutions
- Database setup documentation

---

## ⚙️ Advanced Usage

### **Adjusting Similarity Threshold**

By default, only results with > 50% similarity are shown. To see more results:

```typescript
// Edit scripts/knowledge-base/query-docs.ts
async function searchDocs(
  query: string,
  matchThreshold: number = 0.4, // Lower threshold = more results
  matchCount: number = 10        // More results shown
)
```

### **Searching Specific Topics**

Frame your query to target specific documentation areas:

```bash
# Target security docs
npm run query "security best practices for API endpoints"

# Target student app
npm run query "student app offline data synchronization"

# Target database
npm run query "database schema for groups and assignments"
```

---

## 📁 What's Indexed?

Oracle indexes all markdown documentation files:

### **Core Documentation**
- `docs/**/*.md` - All subdirectories
  - `docs/strategy/` - Development workflows
  - `docs/specs/` - Technical specifications
  - `docs/technical/` - Implementation guides
  - `docs/architecture/` - System architecture
  - `docs/api/` - API documentation

### **Root Files**
- `README.md` - Project overview
- `AI_CODING_INSTRUCTIONS.md` - AI agent guidelines
- `ROADMAP.md` - Feature roadmap

### **Workflow Definitions**
- `.agent/workflows/*.md` - All workflow commands

### **App-Specific Documentation**
- `student-app/README.md`
- `admin-panel/README.md`
- `landing-pages/README.md`
- `content-engine/README.md`

### **Archive** (Optional)
- `docs/archive/**/*.md` - Historical documentation

**Total**: 61+ files, 730+ searchable chunks

---

## 🛠️ Troubleshooting

### **"No results found"**

**Possible causes**:
1. Query is too vague or generic
2. Topic not covered in indexed docs
3. Similarity threshold too high

**Solutions**:
- Make query more specific
- Try different phrasing
- Check if doc exists: `ls docs/**/*topic*.md`
- Lower similarity threshold (advanced)

---

### **Results seem irrelevant**

**Possible causes**:
1. Query wording doesn't match doc language
2. Looking for code, but index has docs
3. Index is outdated

**Solutions**:
- Rephrase using domain-specific terms
- Check if information exists in docs
- Trigger manual reindex (admin only)

---

### **Index is outdated**

**Symptoms**:
- Recently added docs don't appear
- Old content still showing up
- Missing new features in results

**Solution** (Admins only):
1. Go to GitHub Actions
2. Run "Reindex Documentation (Manual)" workflow
3. Wait ~2 minutes for completion
4. Try search again

---

## 💰 Cost Information

As a user, you don't need to worry about costs, but for transparency:

- **Searching**: ~$0.000001 per query (negligible)
- **Reindexing**: ~$0.0003 per full run (less than 1 penny)
- **Monthly estimate**: < $0.01/month

Costs are managed through:
- Manual reindex triggers (admin control)
- Hash-based deduplication (skips unchanged content)
- Rate limiting (prevents runaway costs)

---

## 🤝 Getting Help

- **Search not working?** Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- **Want to contribute docs?** See [Contributing Guide](CONTRIBUTING.md)
- **Need architecture details?** Read [Architecture Overview](ARCHITECTURE.md)
- **Technical issues?** Contact development team

---

## 📚 Additional Resources

- **Setup Guide**: `scripts/knowledge-base/README.md`
- **Admin Guide**: `docs/oracle/ADMIN_GUIDE.md`
- **API Reference**: `docs/oracle/API_REFERENCE.md`
- **Architecture**: `docs/oracle/ARCHITECTURE.md`

---

**Happy searching! 🔍**
