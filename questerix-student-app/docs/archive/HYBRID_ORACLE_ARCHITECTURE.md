# Hybrid Oracle: Distributed Knowledge Architecture

**Status**: Production-Ready
**Updated**: February 9, 2026
**Architect**: Antigravity

## 1. Overview

The **Hybrid Oracle** is a distributed knowledge management system designed for AI-native development. It solves the tension between local execution speed (L1 Cache) and global/multi-agent portability (SSoT in Supabase).

## 2. Infrastructure

### A. The "Gold Standard" (Supabase)

The database serves as the single source of truth. It stores knowledge in a governed schema that supports multi-agent consistency and social governance (Draft/Verified status).

**Table Schema**: `knowledge_base`

- `ki_slug`: Grouping for Knowledge Items.
- `file_path`: Internal folder structure (metadata vs artifacts).
- `content_hash`: SHA-256 for atomic change detection.
- `status`: Lifecycle governance (`draft` for agents, `verified` for architects).
- `embedding`: Vector(768) ready for Gemini-powered semantic RAG.

### B. The "L1 Cache" (Local)

The `.gemini/antigravity/knowledge` directory is treated as a volatile, read-only cache. It is ignored by Git (`.gitignore`) to prevent "Sync Hell" between source control and the database brain.

## 3. Operations

### Syncing (Pull)

`npm run knowledge:sync`

- Reconstructs the folder hierarchy for the local agent.
- Per-file hash comparison to minimize disk I/O.
- **Atomic Writes**: Uses `.tmp` file renaming to prevent context corruption.
- **Pruning Phase**: Deletes "Zombie Files" locally that no longer exist globally.

### Proposing Changes (Push)

`npm run knowledge:push`

- Uploads local changes to Supabase as `draft`.
- Human architects review and promote drafts to `verified` for global deployment.

### First Time Setup (Seed)

`npm run knowledge:seed`

- Scans current local intelligence and performs a bulk "Big Bang" upload to Supabase.

## 4. Governance

1. **DB Wins**: Local edits are overwritten by the sync script unless pushed first.
2. **Deterministic Pruning**: The local directory is kept clean; if it's not in the DB, it shouldn't be on the disk.
3. **Identity-Driven**: The `last_updated_by` field creates an audit trail for which agent proposed which standard.

## 5. Security

- Access is governed by RLS (Row Level Security).
- Anonymous/Public read is limited to `verified` knowledge.
- Agents require `SUPABASE_SERVICE_KEY` (stored in `.secrets`) for `PUSH` operations.

---

_This architecture enables seamless multi-agent collaboration and project portability, transforming Questerix from a codebase into a living Autonomous Repository._
