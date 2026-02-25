---
description: Master reference guide — all slash commands, skills, scripts, and agent rules
---

# 🗺️ Questerix Agent — Help Reference

> Say `/help` any time you forget what commands, workflows, or protections exist.

---

## 🚀 Slash Commands (Workflows)

### Daily Use

| Command              | When to Use                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `/fix`               | Fix a bug. Runs Ironclad scan + repro + surgical fix + verification                           |
| `/process`           | Start a new feature (planning → DB → code → verify → deploy)                                  |
| `/forensics`         | Deep-dive security + quality audit of the whole codebase                                      |
| `/reliability-audit` | Proactive reliability sweep before a release (timeouts, data integrity, graceful degradation) |
| `/ironclad`          | Paste a buggy file — get a full root cause analysis with 17-pattern scanner                   |
| `/loki`              | Autonomous developer mode (RARV cycle, self-healing, circuit breakers)                        |
| `/certify`           | Independent quality checkpoint after completing a feature                                     |
| `/resume`            | Resume after a break — restores state from TASK_STATE.json                                    |
| `/continue`          | Hand off to a different AI agent mid-task                                                     |
| `/sleep`             | End session — saves state to HANDOVER.md                                                      |
| `/wake`              | Start session — restores state, runs health check                                             |

### Quick Ops

| Command       | When to Use                                       |
| ------------- | ------------------------------------------------- |
| `/sp lint`    | Run lint on admin panel                           |
| `/sp test`    | Run all tests                                     |
| `/sp ci`      | Full CI validation pass                           |
| `/sp analyze` | Flutter analyze                                   |
| `/sp push`    | Git add + commit + push                           |
| `/autopilot`  | Full autonomous execution (all commands auto-run) |
| `/blocked`    | Document what's blocking progress                 |

---

## 🧠 Skills (Forensic Engines)

Skills are reusable analysis frameworks the agent reads before acting.

| Location                                    | Skill                  | Notes                          |
| ------------------------------------------- | ---------------------- | ------------------------------ |
| `.agent/skills/ironclad-architect/SKILL.md` | **ironclad-architect** | 17-pattern bug scanner         |
| `.antigravity/skills/loki-mode/SKILL.md`    | **loki-mode**          | Canonical location (v2.x SSoT). **Note:** `.antigravity/` is an IDE-specific folder used by Antigravity IDE and may not be accessible in Cursor/Windsurf; use ironclad-architect for RARV/bug patterns there. |

| Skill                  | When It's Used                     | What It Does                                                                                                                 |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **ironclad-architect** | Every `/fix` and `/forensics` call | 17-pattern bug scanner, IDD Protocol, RARV cycle, Forbidden Patterns checklist, Tenant Isolation audit, Silent Failure audit |
| **loki-mode**          | Every `/loki` call                 | Autonomous dev protocol — RARV loop, self-healing, budget/iteration guardrails                                               |

### Ironclad Architect — 17 Bug Patterns (Quick Reference)

| #      | Pattern                            | What it catches                                        |
| ------ | ---------------------------------- | ------------------------------------------------------ |
| BUG-01 | Remember Me Race                   | `sessionStorage` read timing vs `localStorage`         |
| BUG-02 | Silent Profile Fetch → Auto-Logout | Redirect to `/login` on transient network error        |
| BUG-03 | RLS No Tenant Scope                | `jwt_is_admin()` without `app_id` filter               |
| BUG-04 | Naming Drift                       | `best_streak` (DB) ≠ `longest_streak` (Drift)          |
| BUG-05 | Ghost Data                         | Deleted records reappear after sync                    |
| BUG-06 | Zombie Tenant                      | Hardcoded UUIDs in source code                         |
| BUG-07 | Blind Fire RPC                     | SECURITY DEFINER with no parameter validation          |
| BUG-08 | RLS `WITH CHECK(true)`             | Overly permissive insert/update policies               |
| BUG-09 | Type File Corruption               | Empty `database.types.ts`                              |
| BUG-10 | `search_path` Vuln                 | SECURITY DEFINER without `SET search_path`             |
| BUG-11 | Rate Limiter Double-Count          | Both `middleware()` and `check()` increment counter    |
| BUG-12 | Circuit Breaker No Decay           | Sub-threshold failures never cleaned up                |
| BUG-13 | Stateful Per-Request               | Rate limiter created inside request handler            |
| BUG-14 | Cross-App No SuperAdmin            | Duplication hooks always filter by `app_id`            |
| BUG-15 | Wrong Runtime API                  | `process.env` in Deno, `SIGALRM` cross-platform        |
| BUG-16 | Variable Scope try/catch           | `const` in `try {}` accessed outside it                |
| BUG-17 | Regex `lastIndex`                  | `/g` flag + `.test()` corrupts subsequent `.replace()` |

### Forbidden Patterns (Top 10 — Full list in skill)

| #   | Never Do This                                  | Do This Instead                             |
| --- | ---------------------------------------------- | ------------------------------------------- |
| 1   | Empty `catch {}`                               | Log + rethrow or return typed error         |
| 2   | `console.log` as only error handling           | `captureException()`                        |
| 3   | `return null` for errors                       | `Result<T,E>` or throw typed error          |
| 4   | Double retry (outer loop + `retryWithBackoff`) | Remove outer loop                           |
| 5   | `thenReturn` for Future-returning mock         | `thenAnswer((_) => Future.value(...))`      |
| 6   | Unused import after refactor                   | Remove import when caller is deleted        |
| 7   | Bare throw before React mounts                 | `renderStartupError()` DOM fallback first   |
| 8   | Stateful object inside request handler         | Module-level instantiation                  |
| 9   | `as any` in TypeScript                         | Proper type guard                           |
| 10  | `WITH CHECK (true)` in RLS                     | Scope to `auth.uid()` or `current_app_id()` |

---

## ⚡ Automation Scripts

| Script                          | What It Does                                   | When                 |
| ------------------------------- | ---------------------------------------------- | -------------------- |
| `scripts/preflight.ps1`         | TSC + Lint + Flutter Analyze + Deps (parallel) | Before every commit  |
| `scripts/run-all-tests.ps1`     | All test suites simultaneously                 | Before release       |
| `scripts/code-hygiene-scan.ps1` | Secrets, empty catches, security leaks         | Phase 4 of `/fix`    |
| `scripts/certify-evidence.ps1`  | Collect all audit artifacts                    | `/certify` workflow  |
| `scripts/gen-types-verify.ps1`  | `supabase gen types` + compile check           | After schema changes |
| `scripts/deploy-all.ps1`        | Full production deployment via Cloudflare      | Release only         |

---

## 🧪 Test Commands

| Command              | What                              |
| -------------------- | --------------------------------- |
| `npm run test:quick` | Changed files only (fast)         |
| `npm run test:full`  | Full suite + coverage             |
| `npm run test:e2e`   | Playwright end-to-end             |
| `npm run test:arch`  | Architecture boundary enforcement |
| `npm run typecheck`  | `tsc --noEmit`                    |
| `npm run lint`       | ESLint                            |
| `flutter analyze`    | Dart static analysis              |
| `flutter test`       | All Flutter unit tests            |

---

## 🛡️ Key Protections in Place

| Protection                    | Where                                             | What It Prevents                            |
| ----------------------------- | ------------------------------------------------- | ------------------------------------------- |
| Route Error Boundaries        | `admin-panel/src/App.tsx`                         | Blank screen on component crash             |
| Startup DOM Fallback          | `admin-panel/src/main.tsx`                        | Blank screen when env vars missing          |
| Env Validation                | `admin-panel/src/config/env.ts` → `validateEnv()` | Cryptic runtime crash from missing config   |
| Sync Timeouts (30s)           | `sync_service.dart` → `_supabaseCall()`           | Infinite sync hang                          |
| Auth Timeouts (15s)           | `supabase_auth_repository.dart`                   | Auth call hanging forever                   |
| AI Timeouts (45s)             | `generateQuestions.ts`, `validateContent.ts`      | Slow AI API stalling the UI                 |
| Health Check Timeout (5s)     | `health-check/index.ts`                           | Unhealthy health endpoint hanging           |
| Cloudflare Timeouts (15s)     | `manage-app-domains/index.ts`                     | Cloudflare API hanging                      |
| Auto-sync on Reconnect        | `sync_service.dart` → `syncServiceProvider`       | Student data stuck offline after reconnect  |
| CI Destructive Migration Gate | `.github/workflows/database.yml`                  | Accidental `DROP` reaching production       |
| Rate Limiting                 | `supabase/functions/_shared/rate-limiter.ts`      | Abuse of Edge Functions                     |
| RLS on all tables             | `supabase/migrations/`                            | Cross-tenant data leaks                     |
| Ironclad Scan in `/fix`       | `.agent/workflows/fix.md` Phase 1                 | Agent-introduced bugs from refactor residue |

---

## 💤 Session Flow

```
New session?    → /wake
Starting work?  → /process (feature) or /fix (bug)
Need forensics? → /forensics or /ironclad
Pre-release?    → /reliability-audit then /certify
Ending session? → /sleep
Switching AI?   → /continue
Something stuck? → /blocked
```

---

## 🏗️ Architecture (Quick Reference)

| Layer          | Tech                                            | Key Files                                         |
| -------------- | ----------------------------------------------- | ------------------------------------------------- |
| Admin Panel    | React 18, Vite 5, TanStack Query v5, TypeScript | `admin-panel/src/`                                |
| Student App    | Flutter, Riverpod 2.6.1, Drift 2.24             | External repo: **questerix-student-app** (not in this repo) |
| Backend        | Supabase (Postgres, Auth, Edge Functions)       | `supabase/`                                       |
| Deployment     | Cloudflare Pages via `scripts/deploy-all.ps1`   | `scripts/`                                        |
| DB Types       | Auto-generated                                  | `admin-panel/src/lib/database.types.ts`           |
| Env Config     | Admin Panel                                     | `admin-panel/src/config/env.ts`                   |
| Error Tracking | Supabase-native, zero-cost                      | `admin-panel/src/lib/error-tracker.ts`            |
| Sync State     | Outbox → Supabase RPC                           | In **questerix-student-app** repo                 |

---

> 📌 This file is the single source of truth for what the agent **knows** and can **do**.
> **Governance**: `AGENTS.md` (universal rules) + `GEMINI.md` user memory (Antigravity permissions) = complete governance.
> Last updated: **2026-02-20**. Run `/help` to read it again anytime.
