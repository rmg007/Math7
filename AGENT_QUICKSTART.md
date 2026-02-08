# 🧭 Agent Quickstart — Universal Knowledge Discovery

> **Read this first.** This is the single entry point for any AI coding agent working on Questerix, regardless of IDE.

## How to Find What You Need

```
┌─ "What does this project do?"
│   → SELECT * FROM get_ai_system_summary();
│
├─ "What is file X for?"
│   → SELECT * FROM kb_registry WHERE name ILIKE '%keyword%';
│
├─ "How does [concept] work?"
│   → npx tsx scripts/knowledge-base/query-docs.ts "your question"
│   (Semantic search over 730+ indexed documentation chunks)
│
├─ "What are the coding standards?"
│   → Read docs/standards/ORACLE_COGNITION.md (IDD Protocol)
│
├─ "What workflow do I follow?"
│   → Read .agent/workflows/process.md (the /process lifecycle)
│
└─ "What commands are available?"
    → Read .agent/workflows/help.md
```

## Query Priority (Fast → Slow)

| Priority | Source | Latency | Use For |
|----------|--------|---------|---------|
| 1 | `kb_registry` table | <100ms | File purposes, project types, platforms, tech stacks |
| 2 | `get_ai_system_summary()` RPC | <100ms | High-level ecosystem overview |
| 3 | `kb_metrics` table | <100ms | Line counts, file counts, language distribution |
| 4 | `match_knowledge_chunks()` RPC | <2s | Semantic search over documentation |
| 5 | File system (`list_dir`, `view_file`) | Variable | Real-time source code inspection |

> **Rule**: Never scan `node_modules`, `.dart_tool`, `build`, or `dist` directories.

## Authority Hierarchy

If two sources conflict, follow the highest-ranked:

1. `docs/strategy/AGENTS.md`
2. `kb_registry` (Supabase AI Performance Registry)
3. `docs/standards/ORACLE_COGNITION.md` — IDD Protocol
4. `AI_CODING_INSTRUCTIONS.md` — Agent rules
5. `.cursorrules` — IDD constitution (compact form)
6. `PHASE_STATE.json`
7. `docs/specs/*`
8. Everything else

## IDE-Specific Notes

### Cursor
- `.cursorrules` is auto-loaded — contains the full IDD protocol
- All Oracle/Registry queries work via terminal or Supabase MCP

### Antigravity (Gemini)
- 13 workflows available in `.agent/workflows/`
- Persistent Knowledge Items (KIs) carry context across conversations
- Use `/process` for the full development lifecycle

### GitHub Codespaces
- `.devcontainer/devcontainer.json` handles environment setup
- All tools and scripts work identically to local dev

### Qodo / Other IDEs
- Read `AI_CODING_INSTRUCTIONS.md` for rules
- Read `docs/standards/ORACLE_COGNITION.md` for the IDD protocol
- All Supabase queries work from any environment with credentials

## Hard Rules (Non-Negotiable)

1. **NEVER PUBLISH LANDING-PAGES** — deployment is disabled
2. **NEVER DEPLOY TO questerix.com** — root domain is off-limits
3. **ALL queries MUST filter by `app_id`** — multi-tenant isolation
4. **ALL writes go through SyncService** (student-app) — offline-first
5. **RLS enforces authorization** — client-side checks are UX only

## Technology Stack (Locked)

| Component | Technology |
|-----------|------------|
| Student App | Flutter + Riverpod + Drift |
| Admin Panel | React + Vite + TypeScript |
| Content Engine | Python + Pydantic |
| Backend | Supabase (Postgres + Edge Functions + RLS) |
| Design System | Tokens + Icon generators |
| State (React) | @tanstack/react-query v5 |

## Knowledge Infrastructure Health Check

Run to verify all systems are operational:

```powershell
./scripts/knowledge-health-check.ps1
```
