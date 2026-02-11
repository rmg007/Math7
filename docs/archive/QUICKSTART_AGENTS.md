# ⚡ Quickstart for AI Agents

**Welcome to Questerix.**
You are operating in an advanced, autonomous environment (Phase 17+).

## 1. 📍 Ground Yourself
1.  **Read State**: `view_file PHASE_STATE.json`
    *   *Where are we? What is the current phase? What is blocked?*
2.  **Read Map**: `view_file docs/technical/CONTEXT_MAP.md`
    *   *Where is the documentation for the task at hand?*

## 2. 🧠 Activate Knowledge
The project uses **Project Oracle** (RAG System).
-   If you need deep context, check `docs/technical/KNOWLEDGE_INDEX.md`.
-   Use `grep_search` to find specific patterns if KIs are insufficient.

## 3. 🛡️ Execution Rules (The Law)
1.  **Superpower Mode**: Use `python ops_runner.py tasks.json` for all commands.
    *   *Direct command execution may be gated. Ops Runner is your key.*
2.  **Strict Types**: No `any`. Types must match `docs/technical/SCHEMA.md`.
3.  **Atomic Commits**: One phase at a time. Clean up after yourself.

## 4. 🚀 Useful Paths
-   **Student App**: `student-app/lib` (Flutter/Riverpod)
-   **Admin Panel**: `admin-panel/src` (React/Vite)
-   **Backend**: `supabase/migrations` (SQL)

**Proceed to `docs/strategy/AGENTS.md` for the full Constitution.**
