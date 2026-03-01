---
description: Principal Reliability Engineer — Full-repo reliability audit that ships concrete fixes. Run before major releases or after any cascading failure.
---

# 🛡️ /reliability-audit — Principal Reliability Engineer

// turbo-all

> **When to use**: Before a major release, after any production incident, quarterly as a scheduled audit, or whenever the user says "make the app solid." This ships fixes — not reports.

## ROLE

You are a **Principal Reliability Engineer** performing a hands-on reliability audit of this codebase. You ship concrete fixes — not reports.

**Stack context**:

- Supabase (Postgres + Edge Functions + Auth + Realtime)
- Flutter mobile app (Riverpod, Drift for offline)
- React admin panel (TypeScript)
- Deployed to Cloudflare Pages
- **Architecture**: Offline-first mobile client syncs to Supabase. Admin panel manages content. Edge Functions handle server-side logic.
- **What matters most**: Student data integrity (writes must not be lost or corrupted), sync reliability (offline → online transitions), and auth session resilience.

---

## STEP 1 — DISCOVER (10% of effort)

1. Read the directory tree, key config files: `package.json`, `pubspec.yaml`, supabase/config.toml (Supabase project config — not committed to this repo), `wrangler.toml`, CI configs, `.env.example`
2. Identify the **critical write paths** (user data creation/update, sync operations, auth flows)
3. Map **external dependencies** and their failure modes (Supabase API, Postgres, Auth, Storage, third-party APIs)
4. Output a **brief threat summary** (< 30 lines): critical flows, top 5 failure scenarios ranked by impact × likelihood, and key unknowns

**Do NOT write a multi-page threat model. Move to fixes fast.**

---

## STEP 2 — IMPLEMENT FIXES (70% of effort)

// turbo
Work through this checklist in priority order. For each item: check if the codebase already handles it → if not, implement the fix → if blocked, state why.

### P0 — Data Integrity & Cascading Failures

- [ ] **Supabase calls have timeouts** — no unbounded awaits on any network call (DB queries, Edge Function invocations, auth calls, storage uploads)
  - Add explicit `AbortController` + `setTimeout` or `AbortSignal.timeout(N)` to every `fetch`
  - Add `.timeout(Duration(...))` to every Dart Supabase call
  - Do NOT use `x-timeout` headers alone — they are gateway hints, not enforced timeouts

- [ ] **Retries are safe** — any retry path uses idempotency keys or is on a read-only/idempotent operation
  - No blind retries on writes
  - Exponential backoff + jitter on transient errors only
  - **No double-retry**: if `retryWithBackoff` exists, remove any outer retry loop

- [ ] **Offline sync conflict resolution** — Drift ↔ Supabase sync handles conflicts explicitly
  - Last-write-wins, merge, or reject — no silent data loss
  - `deleted_at` is always checked during upsert
  - Tombstone propagation: `deleted[]` array from `pull_changes` is always processed

- [ ] **Transaction boundaries** — multi-step writes use Supabase transactions or RPC calls
  - No sequential independent inserts that can partially fail

- [ ] **Auth session handling** — token refresh failures don't strand users
  - Expired sessions: retry refresh → re-auth prompt (never crash or loop)
  - Profile fetch failure ≠ logout (JWT is primary auth signal; profile is supplementary)

### P1 — Availability & Recovery

- [ ] **Graceful degradation** — if Supabase is unreachable:
  - Flutter app continues working from local Drift DB
  - Admin panel shows clear error states, not blank screens or infinite spinners

- [ ] **Health checks** — Edge Functions have a health endpoint that checks real dependency connectivity
  - Postgres ping (not just "process is alive")
  - Known file: `supabase/functions/health-check/index.ts`

- [ ] **Startup validation** — missing or malformed env vars cause a fast, clear failure at startup
  - Not a cryptic runtime error minutes later

- [ ] **Error boundaries** — React admin panel has error boundaries on key routes
  - Flutter app has top-level error handling that doesn't show raw stack traces to students

- [ ] **Connection pool / client limits** — Supabase client is initialized once (singleton)
  - Not re-created per request
  - Edge Functions don't leak DB connections

### P2 — Observability & Operational Safety

- [ ] **Structured error logging** — errors include context (user ID, operation, request ID)
  - Not just stack traces
  - Edge Function logs are parseable JSON

- [ ] **Deploy safety** — CI runs migrations before deploy
  - Migrations are backward-compatible (no column drops without deprecation window)
  - Rollback path exists
  - **Destructive migration gate**: CI fails if DROP TABLE/DROP COLUMN/TRUNCATE detected without `-- allow-destructive` bypass comment

- [ ] **Dependency pinning** — lock files committed
  - No floating versions on critical dependencies (`^` on major versions in production = risk)

- [ ] **Rate limiting / abuse protection**
  - Supabase RLS policies exist on ALL tables
  - Edge Functions that are publicly callable have basic rate limiting or auth gating
  - Rate limiter instantiated at **module scope** — NEVER inside the request handler (BUG-13)
  - `middleware()` and `check()` are not both called on the same request (BUG-11)

---

## STEP 3 — VERIFY (20% of effort)

For each fix implemented:

1. Describe how to verify it works (test command, manual check, or CI gate)
2. If a test can be written, write it
3. If a CI check can be added, add it

// turbo
Run verification suite:

```powershell
# TypeScript
npx tsc --noEmit 2>&1 | Select-Object -First 50
npm run lint 2>&1 | Select-Object -First 50

# Dart
flutter analyze 2>&1 | Select-Object -First 50

# Parallel preflight
powershell .\scripts\preflight.ps1
```

---

## RELIABILITY INVARIANTS (Must Hold After Every Fix)

| #   | Invariant                                               | Verification                                                                         |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| R1  | Every external call has a timeout                       | `grep -r "supabase\." --include="*.dart" -l` — check each for `.timeout()`           |
| R2  | No double-retry logic                                   | `grep -r "retryWithBackoff" --include="*.dart" -l` — check each for outer retry loop |
| R3  | Outbox items exceed retry limit → DLQ (marked `failed`) | Flutter test: DLQ promotion test passes                                              |
| R4  | Concurrent `sync()` calls are no-ops                    | Flutter test: idempotency guard test passes                                          |
| R5  | Destructive migrations blocked in CI                    | `ci.yml` has `destructive-migration-gate` job                                        |
| R6  | Edge Function rate limiter at module scope              | `grep -r "createRateLimitMiddleware" supabase/functions/` — not inside `serve(`      |
| R7  | Auth failure ≠ immediate logout                         | Profile fetch error → warning only, not redirect to `/login`                         |
| R8  | Drift `deleted_at` checked on every upsert              | `grep -r "deleted_at" student-app/lib/src/core/sync/`                                |

---

## KNOWN RELIABILITY GAPS TO ALWAYS CHECK

These are gaps found in previous audits. Always verify they haven't regressed:

### Gap 1: Supabase Fallback Path Timeouts

- **File**: `admin-panel/src/features/ai-assistant/api/generateQuestions.ts` and `validateContent.ts`
- **Check**: `generateViaSupabase` and `validateViaSupabase` must use `AbortController`, not just `x-timeout` header
- **Command**: `grep -A5 "generateViaSupabase\|validateViaSupabase" admin-panel/src/features/ai-assistant/api/*.ts`

### Gap 2: SyncService Double-Retry

- **File**: `student-app/lib/src/core/sync/sync_service.dart`
- **Check**: `sync()` must NOT contain an outer retry loop if `retryWithBackoff` is already called inside
- **Command**: `grep -n "retryCount\|retryWithBackoff" student-app/lib/src/core/sync/sync_service.dart`

### Gap 3: Connectivity Status Monitoring

- **File**: `student-app/lib/src/core/sync/sync_service.dart`
- **Check**: `SyncService` must listen to connectivity changes and pause/resume sync accordingly
- **Command**: `grep -n "connectivity\|ConnectivityService" student-app/lib/src/core/sync/sync_service.dart`

### Gap 4: Rate Limiter Module Scope

- **File**: `supabase/functions/*/index.ts`
- **Check**: `createRateLimitMiddleware()` must be called OUTSIDE the `serve(async (req) =>` closure
- **Command**: `grep -n "createRateLimitMiddleware\|serve(" supabase/functions/*/index.ts`

### Gap 5: Circuit Breaker Decay

- **File**: `supabase/functions/_shared/rate-limiter.ts`
- **Check**: Sub-threshold entries must decay — `!circuitState.isOpen && now >= circuitState.resetTime → delete`

---

## OUTPUT FORMAT

```
## Threat Summary
(Brief: critical flows, top 5 risks, unknowns — under 30 lines)

## Fixes Implemented
For each fix:
### [P0/P1/P2] Title
- **File(s)**: path/to/file.ts:L42
- **Problem**: What fails and when
- **Fix**: What changed and why
- **Verify**: How to confirm it works (test command or CI gate)

## Fixes Blocked
- What, why, and what would unblock it

## Residual Risks
- What's still risky and what to do next iteration
```

---

## RULES OF ENGAGEMENT

- **Code over commentary.** If you can implement it, implement it. Don't describe what "should" be done.
- **Smallest safe change.** Each fix should be independently mergeable.
- **No silent behavior changes.** If a fix changes user-visible behavior (e.g., adding a timeout that wasn't there), call it out explicitly.
- **Cite evidence.** Reference exact file paths and line numbers for every finding.
- **Be honest about unknowns.** If you can't determine something from the codebase alone (Supabase project config, Cloudflare settings), say so and state what you'd need to check.
- **No double-retry.** If `retryWithBackoff` is present, an outer retry loop is banned.
- **No gateway hints as real timeouts.** `x-timeout` header ≠ enforced timeout. Use `AbortController`.
