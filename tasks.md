# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.

---

## 🔥 Phase 13: Prove It Works (ACTIVE)

> **Objective**: Stop building test infrastructure. Start proving the product works. Every task here exists because a real bug has bitten us or because we shipped code we never verified.

### Step 0: Clear the Build (IMMEDIATE)

- [ ] **Husky Gate**: Last commit (`docs(tasks): archive Phase 12`) was rejected by pre-commit hooks. Run `npm run lint` + `npx tsc --noEmit` in admin-panel, identify the exact failure, fix it, and get the commit through.

### Step 1: Verify What We Just Shipped

- [ ] **Run the 14 New E2E Tests**: `question-types-regression.e2e.spec.ts` has never executed in CI. Run it locally against the test DB. Fix whatever breaks. This is the single highest-risk item — we told ourselves Step 13 regression coverage is "done" but we've never seen green.
- [ ] **SQLCipher Smoke Test**: The F-15 encryption migration swapped `sqlite3_flutter_libs` → `sqlcipher_flutter_libs`. Run `flutter test` in `student-app/` and confirm the Drift DB still opens, seeds, and queries correctly. If any test touches the DB and fails, the encryption key flow is broken.
- [ ] **Rollback RPC Dry Run**: Call `list_curriculum_snapshots(app_id)` against production via Supabase MCP. Confirm it returns data. Then call `rollback_publish(app_id, version)` against the **test** DB to verify the restore logic without risking production content.

### Step 2: Fix the Bugs We Keep Having

These are patterns from `LEARNING_LOG.md` that have bitten us **more than once**:

- [ ] **Platform Drift Guard**: Create a single Vitest test that imports the Dart `question_fixtures.dart` field names (as a JSON snapshot) and asserts they match the TypeScript `questions.ts` fixture field names. This catches the `master_level` vs `mastery_level` class of bug before it reaches production. No fancy framework — one test, one assertion.
- [ ] **Import Crash Prevention**: Add a `tsc --noEmit` step to the Husky pre-commit hook if it's not already there. We've had 3+ incidents of missing imports (`Badge`, `Loader2`, `useEffect`) that compiled in dev (HMR is forgiving) but crashed in production builds. This is a 1-line fix that prevents an entire class of bugs.
- [ ] **Flutter `getTestOverrides()` Adoption**: 11 of 13 Flutter test files bypass our standard test helper. Pick the 3 most critical test files (sync, practice, mastery) and migrate them. Don't touch the others — diminishing returns.

### Step 3: Post-Deploy Confidence

- [ ] **Smoke Test Script**: Create a simple `scripts/smoke-test.sh` that curls 5 endpoints (admin panel health, student app health, Supabase auth, Workers AI, Edge Function ping) and exits non-zero if any returns non-200. Wire it into the orchestrator as a post-deploy phase. No Playwright, no browser — just HTTP status codes.
- [ ] **CI Verification**: Push the current branch and watch the full `ci.yml` run. Document any failures in `LEARNING_LOG.md`. We haven't verified the complete CI pipeline since adding the `rls-audit` job and `secret-rotation.yml`.

---

## 📋 Phase 14: Hardening (When Phase 13 is Green)

> Don't start these until Phase 13 is fully verified. These are important but not urgent.

- [ ] **Contract Drift Detection**: If the Platform Drift Guard (Step 2) catches real bugs, expand it to cover all sync-critical tables (domains, skills, questions, attempts, skill_progress). If it catches nothing, skip this — the problem is solved.
- [ ] **SQLCipher Performance**: Profile the encrypted DB on a low-end Android emulator (API 28, 2GB RAM). If open+query takes >500ms, investigate key derivation iterations.
- [ ] **Nightly E2E**: Once the 14 Q-type tests are green and stable for 2 weeks, add them to a nightly cron job. Not before — running unreliable tests on a schedule just creates noise.
- [ ] **Secret Rotation Verification**: Trigger `secret-rotation.yml` manually and confirm the GitHub Issue is created correctly. We deployed the workflow but never tested it.

---

## 📋 Recently Archived (Feb 2026)

> Phases 9–12 complete. QA Foundation, UI Unification, Platform Resilience, Open Loops — all closed.
> Details: Security (F-15 SQLCipher, Rollback RPCs, RLS CI Gate), Testing (14 Q-type E2E, POM abstraction, data-testid sweep), Infrastructure (Dual-DB, Secret Rotation, Oracle Plus Drift Detection), Hygiene (Env vars, MD024 linting, CF Worker AI Monitoring).
