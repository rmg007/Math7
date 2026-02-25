# Archived: Agent Quickstart

> **Archived.** Discovery and authority hierarchy are now in **AGENTS.md** (root), in the "Discovery" and "File Placement" sections. This file is kept for reference only.

---

# 🧭 Agent Quickstart — Universal Knowledge Discovery

> **Read this first.** This is the single entry point for any AI coding agent working on Questerix, regardless of IDE.

## How to Find What You Need

**Primary (Cortex — always available):**

- **Codebase orientation**: Read `questerix-cortex/outputs/SKELETON_SUMMARY.md` (exports and key files).
- **Symbol lookup**: From project root, run `npm run health -- skeleton:search "query"` in `questerix-cortex/` (hybrid exact + FTS over signatures).
- **Session start**: Read `questerix-cortex/outputs/MACHINE_BRIEFING.md` and `questerix-cortex/outputs/NEXT_TASK.md` before coding.

**Secondary (when Supabase is accessible):**

- **Semantic doc search**: `npx tsx scripts/knowledge-base/query-docs.ts "your question"` (semantic search over indexed documentation).

**Legacy (Supabase RPCs — migrations archived; may not be live):**

- `get_ai_system_summary()`, `kb_registry`, `match_knowledge_chunks()` — use only if your environment has these deployed.

**Workflows and standards:**

- **What workflow do I follow?** → Read `.agent/workflows/process.md` (the /process lifecycle).
- **What commands are available?** → Read `.agent/workflows/help.md`.
- **Coding standards / IDD Protocol** → Read `docs/standards/ORACLE_COGNITION.md` (supplementary reference).

> **Rule**: Never scan `node_modules`, `build`, or `dist` directories.

## Query Priority (Fast → Slow)

| Priority | Source                                    | Latency  | Use For                          |
| -------- | ----------------------------------------- | -------- | -------------------------------- |
| 1        | `SKELETON_SUMMARY.md` + `skeleton:search` | Local    | Orientation, symbol discovery    |
| 2        | `MACHINE_BRIEFING.md`, `NEXT_TASK.md`     | Local    | Session context, next action     |
| 3        | `query-docs.ts` (if Supabase available)   | Variable | Semantic search over docs        |
| 4        | File system (`list_dir`, `view_file`)     | Variable | Real-time source code inspection |

## Authority Hierarchy

If two sources conflict, follow the highest-ranked:

1. `AGENTS.md` (root) — universal rules for all IDEs and agents
2. `GEMINI.md` (root) — Antigravity-specific extensions; wins over AGENTS.md for Antigravity sessions only
3. `docs/standards/ORACLE_COGNITION.md` — IDD Protocol (supplementary)
4. `.cursorrules` / `.windsurfrules` — thin redirects to `AGENTS.md` (no duplicate content)
5. `tasks.md`
6. `docs/specs/*`
7. Everything else

## IDE-Specific Notes

### Cursor

- `.cursorrules` is auto-loaded and redirects to `AGENTS.md` at project root.
- Use `skeleton:search` from `questerix-cortex/` for symbol discovery.

### Antigravity (Gemini)

- Workflows in `.agent/workflows/` (see `/help` for the full list).
- Persistent Knowledge Items (KIs) carry context across conversations.
- Use `/process` for the full development lifecycle.
- Read `GEMINI.md` for session bootstrap and Antigravity-specific rules.

### GitHub Codespaces

- `.devcontainer/devcontainer.json` handles environment setup.
- All tools and scripts work identically to local dev.

### Qodo / Other IDEs

- Read `AGENTS.md` at project root for rules.
- Read `docs/standards/ORACLE_COGNITION.md` for the IDD protocol.
- Use `skeleton:search` for codebase discovery when Cortex is available.

## Hard Rules (Non-Negotiable)

1. **NEVER PUBLISH LANDING-PAGES** — deployment is disabled
2. **NEVER DEPLOY TO questerix.com** — root domain is off-limits
3. **ALL queries MUST filter by `app_id`** — multi-tenant isolation
4. **ALL writes go through validated APIs** — multi-tenant isolation
5. **RLS enforces authorization** — client-side checks are UX only

## Technology Stack (Locked)

| Component      | Technology                                 |
| -------------- | ------------------------------------------ |
| Admin Panel    | React + Vite + TypeScript                  |
| Content Engine | Python + Pydantic (separate repo)          |
| Backend        | Supabase (Postgres + Edge Functions + RLS) |
| Design System  | Tokens + Icon generators                   |
| State (React)  | @tanstack/react-query v5                   |

## Knowledge Infrastructure Health Check

Run to verify systems (requires Supabase connectivity for RPC/registry checks):

```powershell
./scripts/knowledge-health-check.ps1
```
