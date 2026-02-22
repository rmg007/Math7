# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.

---

## 🔥 Phase 13: Prove It Works (ACTIVE)

> **Objective**: Stop building test infrastructure. Start proving the product works. Every task here exists because a real bug has bitten us or because we shipped code we never verified.

### Step 0: Clear the Build (IMMEDIATE)

- [x] **Husky Gate**: Last commit (`docs(tasks): archive Phase 12`) was rejected by pre-commit hooks. Run `npm run lint` + `npx tsc --noEmit` in admin-panel, identify the exact failure, fix it, and get the commit through. (Verified green)

### Step 1: Verify What We Just Shipped

- [x] **Run the 14 New E2E Tests**: `question-types-regression.e2e.spec.ts` has never executed in CI. Run it locally against the test DB. Fix whatever breaks. (Verified 18 tests passed)
- [x] **Admin Panel E2E Stability**: Verified 45 tests in `admin-panel.e2e.spec.ts`. Fixed mobile sidebar timeouts, tablet logout detachment, and domain edit locators. Seeding logic is now idempotent and robust. (39 passed, 6 skipped as expected)
- [x] **SQLCipher Smoke Test**: The F-15 encryption migration swapped `sqlite3_flutter_libs` → `sqlcipher_flutter_libs`. Run `flutter test` in `student-app/` and confirm the Drift DB still opens, seeds, and queries correctly. (Verified via `encryption_smoke_test.dart` and `flutter test`)
- [x] **Rollback RPC Dry Run**: Call `list_curriculum_snapshots(app_id)` against production via Supabase MCP. Confirm it returns data. Then call `rollback_publish(app_id, version)` against the **test** DB to verify the restore logic without risking production content. (Verified: Fixed auth bug in RPC, confirmed production data, verified rollback logic on TEST DB)

### Step 2: Fix the Bugs We Keep Having

These are patterns from `LEARNING_LOG.md` that have bitten us **more than once**:

- [x] **Platform Drift Guard**: Created `src/__tests__/contract-drift.test.ts`. This verifies that Dart and TypeScript fixtures for Questions, QuestionType, and Difficulty remain in sync, preventing contract drift.
- [x] **Import Crash Prevention**: Added `cd admin-panel && npm run typecheck` to the Husky pre-commit hook to catch missing imports before they reach production.
- [x] **Flutter `getTestOverrides()` Adoption**: Migrated `sync_service_test.dart`, `progress_screen_test.dart`, and `practice_screen_test.dart` to use the standard `getTestOverrides()` helper for consistent provider management.

### Step 3: Post-Deploy Confidence

- [x] **Smoke Test Script**: Created `scripts/smoke-test.sh` that curls 5 endpoints (admin panel, student app, Supabase REST, Workers AI `/health`, Edge Fn `critical-alert`) and exits non-zero if any returns 5xx or a connection failure. Wired into `orchestrator.ps1` as Phase 4.5 (post-deploy). Accepts 2xx-4xx for authenticated Supabase endpoints (401 = server alive, auth gate working). Verified all 5 endpoints pass locally.
- [ ] **CI Verification**: Push the current branch and watch the full `ci.yml` run. Document any failures in `LEARNING_LOG.md`. We haven't verified the complete CI pipeline since adding the `rls-audit` job and `secret-rotation.yml`.

---

## 📋 Phase 14: Hardening (When Phase 13 is Green)

> Don't start these until Phase 13 is fully verified. These are important but not urgent.

- [ ] **Contract Drift Detection**: If the Platform Drift Guard (Step 2) catches real bugs, expand it to cover all sync-critical tables (domains, skills, questions, attempts, skill_progress). If it catches nothing, skip this — the problem is solved.
- [ ] **SQLCipher Performance**: Profile the encrypted DB on a low-end Android emulator (API 28, 2GB RAM). If open+query takes >500ms, investigate key derivation iterations.
- [ ] **Nightly E2E**: Once the 14 Q-type tests are green and stable for 2 weeks, add them to a nightly cron job. Not before — running unreliable tests on a schedule just creates noise.
- [ ] **Secret Rotation Verification**: Trigger `secret-rotation.yml` manually and confirm the GitHub Issue is created correctly. We deployed the workflow but never tested it.
- [ ] **deploy**: deploy admin panel and student app to to cloudflare and make sure they are working and connected to production database.
- [ ] push all changes to github.
---

## 📋 Recently Archived (Feb 2026)

> Phases 9–12 complete. QA Foundation, UI Unification, Platform Resilience, Open Loops — all closed.
> Details: Security (F-15 SQLCipher, Rollback RPCs, RLS CI Gate), Testing (14 Q-type E2E, POM abstraction, data-testid sweep), Infrastructure (Dual-DB, Secret Rotation, Oracle Plus Drift Detection), Hygiene (Env vars, MD024 linting, CF Worker AI Monitoring).
