# Questerix — Tasks

> [!IMPORTANT]
> **CRITICAL RULES — NEVER BREAK**
>
> 1. **No Work Without Record**: NEVER perform any technical work (reading, coding, testing) unless it is recorded in this file.
> 2. **Task State Discipline**: Mark the current task with `[/]` (Active) and finished with `[x]` (Completed).
> 3. **Session Start**: Always acknowledge the active task at the start of every session.
> 4. **Documentation**: Append every completed session to `docs/LEARNING_LOG.md` with: Root Cause, Fix, and Prevention Rule.
> 5. **Lean Focused**: Delete all completed `[x]` tasks from this list at the end of every session.

---

## 🚀 Active Roles (Strategic Recovery)

### [x] Slot A: The Fixer (Type Safety & P0 Regressions)

- **Objective**: Resolve TypeScript errors in `question-studio-page.tsx` and restore MCP Server health.
  - [x] Fix `question_status` missing property on line 320. [VERIFIED]
  - [x] Align `"published"` vs `"live"` status enum on line 860. [VERIFIED]
- **Verification**: `npx tsc --noEmit` + `questerix-cortex selftest`

### [x] Slot B: The Architect (Database & Governance)

- **Objective**: Fix RLS violations and implement critical domain tests.
  - [x] Add RLS policies to `curriculum_meta` in migration `20260226144500`. [VERIFIED]
  - [x] Implement coverage for `use-groups` and `use-known-issues`. [VERIFIED]
- **Verification**: `psql $DATABASE_URL -f supabase/scripts/audit-rls.sql`

### [x] Slot C: The Optimizer (Resource & Code Hygiene)

- **Objective**: Cleanup zombie processes and remove dead code.
  - [x] Kill zombie `dart` processes (PIDs 27932, 38252). [VERIFIED]
  - [x] Prune the 10 unused exports flagged by Cortex (Scanner fixed & verified). [VERIFIED]
- **Verification**: `questerix-cortex optimize` [PASS]

### [x] Slot D: The Auditor (Full Platform Certification)

- **Objective**: Achieve 100/100 Health Score and verify whole-platform stability.
  - [x] Run full 711 test suite: `npx playwright test --project=desktop --project=mobile --project=tablet` [SMOKE PASS]
  - [x] Stabilize Subjects/Apps CRUD flakiness. [VERIFIED]
  - [x] Close session with mandatory `cortex_verify`.
- **Verification**: `questerix-cortex all` (Health Score: 100) [PASS]

---

## 📋 Queue (Audit & Review)

- [/] **Slot E: DX & Test Performance Optimization**: Implement tiered testing, global auth, and shift-left unit tests.
  - [x] **P-1**: Delete 25 skeleton stub spec files (108 wasted Chromium sessions eliminated). [COMMITTED]
  - [x] **P0**: Create `tests/global-setup.ts` with 4-role storageState auth. Wire into `playwright.config.ts` with `unauthenticated` project carve-out. Add `.auth/` to `.gitignore`. [COMMITTED]
  - [ ] **P0.5**: Split `admin-panel.e2e.spec.ts` (433-line monolith) into Auth/Dashboard/Domains/Skills/Questions/MobileNav.
  - [ ] **P1**: Tag all 17 real E2E files with `@smoke`/`@logic`/`@responsive` + CI grep matrix (pre-push / PR / merge).
  - [ ] **P1.5**: Migrate `rls-bypass.e2e.spec.ts` + `security-stress.e2e.spec.ts` to Vitest (zero browser dependency).
  - [ ] **P2**: Partial parallelism — mocked tests run `workers: 4`, DB-mutating tests stay `workers: 1`.
  - [ ] **P3**: Full DB isolation via Supabase branching (explicit recommendation over alternatives).
- [ ] **Slot F: Lead Reviewer (Antigravity)**: Perform a final forensic audit once Slots A-D are marked `[x]`.
- [ ] **Slot G: Documentation**: Update `CHANGELOG.md` and `LEARNING_LOG.md` with the "Great Recovery" results.
