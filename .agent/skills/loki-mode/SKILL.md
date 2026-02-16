---
name: Loki Mode — Autonomous Developer
description: The RARV operational mandate for zero-intervention development with self-healing research and circuit breakers.
---

# 🐺 Loki Mode: Autonomous Developer Skill

## Overview

Loki Mode transforms the AI agent from a reactive assistant into an autonomous developer. It uses the **RARV cycle** (Reason → Act → Reflect → Verify) for zero-intervention feature implementation, bug fixing, and self-healing.

---

## 🔄 The RARV Cycle

For each sub-task, execute this cycle:

### 1. REASON (Plan)

Before writing any code:

- **Read context**: Check `tasks.md`, `LEARNING_LOG.md`, and relevant Knowledge Items
- **Identify the scope**: What files need changing? What's the blast radius?
- **Check for prior art**: Has this been solved before? Search KI summaries
- **Write the plan**: Document what you're about to do in `state.json`

### 2. ACT (Execute)

Write the code:

- **One logical change at a time** — don't batch unrelated changes
- **Follow existing patterns** — check neighboring files for conventions
- **Use TypeScript strict mode** — no `any`, no `@ts-ignore` without comment
- **Test as you go** — create or update tests alongside implementation

### 3. REFLECT (Evaluate)

After acting, ask:

- **Did it compile?** Run `npx tsc --noEmit` (admin-panel) or `flutter analyze` (student-app)
- **Did linting pass?** Run `npm run lint` or `dart analyze`
- **Does it make sense?** Re-read your own diff mentally
- **Is there a simpler way?** If the change is > 100 lines, reconsider

### 4. VERIFY (Prove)

Run the relevant test suite:

```bash
# Admin Panel
cd admin-panel && npx vitest run --bail 2>&1

# Student App
cd student-app && flutter test

# Full preflight
./scripts/preflight.ps1
```

**Critical**: Use `--bail` flag so tests fail fast. Never wait more than 60 seconds for tests.

---

## 🔬 Research Protocol (When Stuck)

When encountering an error, unfamiliar API, or unexpected behavior:

### Step 1: Check Internal Knowledge First (5 seconds)

1. **LEARNING_LOG.md** — Has this error been documented before?
2. **Knowledge Items** — Search KI summaries for relevant patterns
3. **Existing code** — Is there a similar pattern already in the codebase?

### Step 2: Search the Web (30 seconds)

Use `search_web` with targeted queries:

```text
Priority domains (search these first):
├── supabase.com/docs          — Database, Auth, Edge Functions
├── vitejs.dev                 — Build tool, HMR, plugins
├── react.dev                  — React patterns, hooks
├── flutter.dev                — Flutter/Dart development
├── playwright.dev             — E2E testing
├── vitest.dev                 — Unit testing
├── tailwindcss.com/docs       — Styling
└── stackoverflow.com          — Community solutions
```

**Query pattern**: `"[exact error message]" site:[priority-domain]`

### Step 3: Read Documentation (60 seconds)

Use `read_url_content` to pull specific documentation pages into context:

- Read the most relevant result from Step 2
- Focus on API references, not blog posts
- Extract the specific solution pattern

### Step 4: Apply and Retry (back to ACT phase)

- Apply the fix based on research
- Re-run VERIFY
- If still failing, try a **different approach** (not the same fix again)

### Step 5: Escalate (circuit breaker)

If 3 different approaches fail:

1. Document what you tried in `state.json`
2. Write a clear error summary
3. **STOP** and ask the user

---

## 🛑 Circuit Breakers

### Hard Limits

| Trigger                | Limit          | Action                       |
| ---------------------- | -------------- | ---------------------------- |
| Same sub-task failures | 5 consecutive  | Stop, document, escalate     |
| Same error message     | 3 consecutive  | Stop — you're in a loop      |
| Total iterations       | 25 per session | Checkpoint and stop          |
| Test suite timeout     | 60 seconds     | Kill tests, investigate hang |
| No progress timer      | 15 minutes     | Checkpoint and escalate      |

### Soft Limits

| Trigger                    | Limit | Action                           |
| -------------------------- | ----- | -------------------------------- |
| Web searches per bug       | 3     | Try a different approach         |
| Files opened per bug       | 8     | You're over-scoping, narrow down |
| Lines changed per sub-task | 200   | Split into smaller sub-tasks     |

### Deny List (NEVER auto-run these)

```text
rm -rf /
git push --force (without explicit user approval)
DROP TABLE / DROP DATABASE
Any command modifying .env files with secrets
Any command deleting the .git directory
```

---

## 📋 Self-Healing Decision Tree

```text
Error Occurred
│
├─ Is it a TypeScript/compilation error?
│  ├─ Type mismatch → Check database.types.ts, run type gen
│  ├─ Missing import → Search codebase for the symbol
│  └─ Module not found → Check package.json, npm install
│
├─ Is it a test failure?
│  ├─ Assertion failed → Read the expect vs received
│  ├─ Timeout → Check for async leaks, missing await
│  ├─ Mock mismatch → Verify mock paths match source imports
│  └─ Test hangs → Kill it, check for worker/native module issues
│
├─ Is it a build error?
│  ├─ Vite/webpack → Check vite.config.ts, aliases
│  ├─ Flutter → flutter clean && flutter pub get
│  └─ Missing env vars → Check .env.local exists
│
├─ Is it a runtime error?
│  ├─ RLS error → Check Supabase policies for the table
│  ├─ Auth error → Check token, session, role
│  └─ Network error → Check CORS, API URL, Supabase status
│
└─ Unknown error
   ├─ Step 1: Copy exact error message
   ├─ Step 2: search_web "[error message]"
   ├─ Step 3: Read top result with read_url_content
   └─ Step 4: Apply fix and re-verify
```

---

## 📦 State Management

After each sub-task, update `.agent/skills/loki-mode/state.json`:

```json
{
  "session_id": "2026-02-15T20:30:00",
  "mission": "Description of the overall task",
  "subtasks": [
    {
      "id": 1,
      "description": "Fix file-parsers test hang",
      "status": "completed",
      "iterations": 2,
      "files_changed": ["file-parsers.test.ts"],
      "learnings": ["Mock paths must match source import paths"]
    }
  ],
  "current_subtask": 2,
  "total_iterations": 5,
  "errors_encountered": [],
  "research_queries": [],
  "circuit_breaker_triggered": false
}
```

---

## 🔗 Integration with Existing Workflows

| When you need...            | Use...                        |
| --------------------------- | ----------------------------- |
| Full autonomous permissions | `/autopilot` (turbo-all)      |
| Batch command execution     | `/autoloop` (tasks.json)      |
| IDE workaround              | `/superpower` (ops_runner.py) |
| Process lifecycle phases    | `/process`                    |
| Post-implementation audit   | `/certify`                    |
| Report blockers             | `/blocked`                    |
| Session save/restore        | `/sleep` + `/wake`            |

---

## 🚀 Quick Start

When `/loki` is invoked:

1. Read this file (you're doing it now ✅)
2. Read `config.json` for boundaries
3. Check `state.json` — resume or init fresh
4. Break user's request into sub-tasks
5. Execute RARV loop per sub-task
6. Checkpoint progress after each sub-task
7. When done: commit, push, announce completion
