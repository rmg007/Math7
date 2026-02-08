# 🔮 Project Oracle - Complete Documentation Index

**Phase 11: Documentation RAG System**  
**Last Updated**: 2026-02-04  
**Status**: ✅ Production Ready

---

## 📖 Documentation Structure

This directory contains all documentation for Project Oracle, the self-updating knowledge index for Questerix.

### **Quick Start Guides**
- [**Quick Start**](#quick-start) - Get started in 5 minutes
- [**User Guide**](USER_GUIDE.md) - How to use the search system
- [**Admin Guide**](ADMIN_GUIDE.md) - How to manage and maintain the system

### **Technical Documentation**
- [**Architecture Overview**](ARCHITECTURE.md) - System design and components
- [**Database Schema**](DATABASE_SCHEMA.md) - Vector store and RLS policies
- [**API Reference**](API_REFERENCE.md) - RPCs, functions, and interfaces
- [**Indexing Pipeline**](INDEXING_PIPELINE.md) - How documents are processed

### **Operations & Maintenance**
- [**Deployment Guide**](DEPLOYMENT.md) - GitHub Actions setup
- [**Cost Analysis**](COST_ANALYSIS.md) - Detailed cost breakdown
- [**Security Guide**](SECURITY.md) - Authentication and authorization
- [**Troubleshooting**](TROUBLESHOOTING.md) - Common issues and solutions

### **Development**
- [**Development Guide**](DEVELOPMENT.md) - Local setup for contributors
- [**Testing Guide**](TESTING.md) - How to test the system
- [**Contributing**](CONTRIBUTING.md) - How to contribute improvements

---

## 🚀 Quick Start

### **Local Setup (5 minutes)**

1. **Install dependencies**:
   ```bash
   cd scripts/knowledge-base
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Run indexer**:
   ```bash
   npm run index
   ```

4. **Search documentation**:
   ```bash
   npm run query "How does authentication work?"
   ```

### **GitHub Actions (Manual Trigger)**

1. Go to: https://github.com/rmg007/Questerix/actions
2. Select: "Reindex Documentation (Manual)"
3. Click: "Run workflow"
4. Done! ✅

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Project Oracle                        │
│           Documentation RAG Search System                │
└─────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│   Indexer      │  │   Vector    │  │   Query CLI     │
│   Pipeline     │  │   Store     │  │   Interface     │
│                │  │             │  │                 │
│ • Discovery    │  │ PostgreSQL  │  │ • Embedding     │
│ • Splitting    │  │ + pgvector  │  │ • Search RPC    │
│ • Hashing      │  │             │  │ • Results       │
│ • Embedding    │  │ 1536-dim    │  │   Formatting    │
│ • Upserting    │  │ vectors     │  │                 │
└────────────────┘  └─────────────┘  └─────────────────┘
```

---

## 🎯 Key Features

✅ **Semantic Search** - Natural language queries over all docs  
✅ **Auto-Discovery** - Finds all `.md` files automatically  
✅ **Change Detection** - SHA256 hashing prevents duplicate work  
✅ **Hierarchical Chunking** - Preserves document structure  
✅ **Cost-Optimized** - Manual triggers, hash deduplication  
✅ **Production Ready** - RLS policies, error handling, logging  

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| **Files Indexed** | 61+ markdown files |
| **Total Chunks** | 730+ semantic chunks |
| **Vector Dimensions** | 1536 (text-embedding-3-small) |
| **Initial Index Cost** | $0.0025 |
| **Query Latency** | 1-2 seconds |
| **Monthly Cost** | < $0.01 |

---

## 🔐 Security Features

- ✅ Service role key never exposed to client
- ✅ Row-Level Security (RLS) policies
- ✅ Read-only access for authenticated users
- ✅ GitHub Secrets for CI/CD credentials
- ✅ Audit logging for manual triggers

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Vector Store** | Supabase + pgvector |
| **Embeddings** | OpenAI text-embedding-3-small |
| **Runtime** | Node.js 20 + TypeScript |
| **Text Processing** | LangChain RecursiveCharacterTextSplitter |
| **CI/CD** | GitHub Actions |
| **Language** | TypeScript |

---

## 📚 Additional Resources

- **Original Implementation Plan**: `.agent/artifacts/phase_9_oracle_plan.md`
- **Migration File**: `supabase/migrations/20260204000006_create_knowledge_index.sql`
- **Source Code**: `scripts/knowledge-base/`
- **Workflow**: `.github/workflows/docs-index.yml`
- **Command Reference**: `.agent/workflows/reindex_docs.md`

---

## 🤝 Support

- **Issues**: Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- **Questions**: Review [User Guide](USER_GUIDE.md)
- **Contributions**: See [Contributing Guide](CONTRIBUTING.md)

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| **1.0.0** | 2026-02-04 | Initial release - Phase 11 complete |

---

**Built with ❤️ for autonomous AI agents** 🤖
