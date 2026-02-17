# Questerix Task Registry & Roadmap

## 🧪 TEST COVERAGE MONITORING

| Domain                 | Status              | Coverage Gaps                                     |
| :--------------------- | :------------------ | :------------------------------------------------ |
| **Admin Panel (Unit)** | ✅ 19 files passing | Error boundary recovery, Offline sync conflicts   |
| **E2E (Playwright)**   | ✅ 39/39 passing    | Token quota exhaustion, AI generation error paths |
| **Security (RLS)**     | ✅ 7/7 bypass tests | Advanced lateral movement scenarios               |
| **A11y (WCAG)**        | ✅ 100% (5/5 tests) | Dynamic content announcements (Live regions)      |

---

## 🏗️ ACTIVE SPRINT: Preventative Test Suite — Lessons Learned Regression Guard

**Goal:** Create 52 targeted test cases across 8 categories to prevent recurring mistakes.

### Phase 1: Static Analysis & Secret Guard (Vitest) — **HIGH PRIORITY**

- [x] **1.1** Scan `src/` for `VITE_SUPABASE_SERVICE_ROLE_KEY` usage (Secret in client bundle)
- [x] **1.2** Scan `src/` for direct Gemini/OpenAI API key imports (API key in client bundle)
- [x] **1.3** Scan `src/` for `role:` in `.signUp()` payloads (Client-side role escalation)
- [x] **1.4** Verify no `console.log` of invitation codes (Credential leakage)
- [x] **1.5** `escapePostgrestSearch` strips `%`, `_`, `\` (SQL wildcard injection)
- [x] **1.6** `buildIlikeFilter` produces safe filter string (Search data exfiltration)

### Phase 2: Data Integrity Guards (Vitest) — **HIGH PRIORITY**

- [x] **2.1** All `.insert()` ops on Tenant tables must include `app_id` (Multi-tenant leakage)
- [x] **2.2** All `.update()` ops on Tenant tables must include `app_id` (Cross-tenant data corruption)

### Phase 3: Schema & Type Safety (Vitest)

- [x] **3.1** `database.types.ts` exports `Database` interface (Build failure prevention)
- [x] **3.2** `database.types.ts` file size > 10KB (Truncated file guard)
- [x] **3.3** Contains `validate_and_use_invitation_code` RPC (Drift detection)

### Phase 3: React Resilience (Vitest) — **MEDIUM PRIORITY**

- [x] **4.1** `useAuth` handles missing session (Graceful degradation)
- [x] **4.2** `AdminHeader` renders back button correctly (Navigation regression)
- [x] **4.3** `Sidebar` highlights active route (UX regression)

### Phase 4: Performance Baseline (Vitest + Checkly)

- [x] **5.1** Chunk analysis: verify separation of heavy vendors (Lazy loading guard)
- [x] **5.2** `index-*.js` < 1MB (Performance regression)
- [x] **5.3** `normalizeFormData` trims + lowercases identifiers (Data casing corruption)
- [x] **5.4** `normalizeIdentifier` handles null/undefined/empty (Form submission crashes)
- [x] **5.5** Concurrent `loadApps()` calls are deduplicated (State overwrites)
- [x] **5.6** Unmounted component doesn't update state (Memory leaks)

### Phase 4: Expand Existing E2E (Playwright) — **MEDIUM PRIORITY**

- [ ] **2.3** Admin cannot UPDATE another user's profile role (Privilege escalation)
- [ ] **2.4** Anonymous user cannot read `domains`, `skills`, `questions` (Anon data leak)
- [ ] **2.5** Admin B cannot DELETE data in Tenant A (Cross-tenant deletion)
- [ ] **2.6** Super Admin CAN read across tenants (Broken admin access)
- [ ] **1.8** Login with invalid invitation code is rejected (Bad invitation flow)
- [ ] **1.9** AuthGuard redirects to `/login` on profile error (Fail-open auth)

### Phase 5: Infrastructure Lint (Vitest) — **LOW PRIORITY**

- [ ] **7.1** `scripts/*.ps1` contain no non-ASCII characters (Script parse failures)
- [ ] **7.2** `scripts/*.py` have `timeout=` in all `subprocess.run` calls (Hung processes)
- [ ] **7.3** Python f-strings in `content-engine/` don't contain `#` comments inside `{}` (Prompt leakage)
- [ ] **7.4** `deploy-all.ps1` defaults to NOT deploying landing pages (Unauthorized deployment)

### Phase 6: Content Engine (pytest) — **LOW PRIORITY**

- [ ] **7.5** `question_generator.py` retries on transient failure (Unbounded retry)
- [ ] **7.6** `question_generator.py` rejects responses > 50KB (Memory bomb)
- [ ] **7.7** `custom_instructions` sanitization strips dangerous patterns (Prompt injection)

---

## 📦 BACKLOG / DEFERRED

- [ ] **Out of Scope**: Flutter student-app tests (separate codebase)
- [ ] **Out of Scope**: Supabase SQL unit tests (requires pgTAP)
- [ ] **P1: Visual Regression Suite** — Establish baselines and run full visual diff check.
- [ ] **P3: Platform Settings** — Global Branding, App Config, Tenant Scoping.
- [ ] **P3: Rollback Procedures** — SQL scripts for structural rollbacks.

---

## 🚀 SYSTEM STATE (SSoT)

- **Infrastructure**: ✅ Production Live (Cloudflare Pages) — Last Deployed: 2026-02-17 (Automated)
- **Security**: ✅ HADES Phase 1 & 2 Remediation Complete
- **CI/CD**: ✅ Parallel Orchestrator & Cross-App Curriculum Transparency Stabilized

---

## 🛠️ QUICK REFERENCE

```powershell
./scripts/run-all-tests.ps1   # Parallelized test suite execution
./scripts/preflight.ps1       # Comprehensive code hygiene check
python ops_runner.py tasks.json # Autonomous execution
```

---

### Phase: Finalization & Deployment

- [x] **10.1** Review completed work
- [x] **10.2** Update `docs/LEARNING_LOG.md` with test tags (`[test created]`, `[need test]`, `[no test needed]`)
- [x] **10.3** Execute full test suite (`npm run test`)
- [x] **10.4** Deploy to Production (`deploy-all.ps1`)

**Last Synchronized**: 2026-02-17 06:17 PST
**Project Context**: RMG-007 / Questerix
