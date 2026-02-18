# Questerix — Admin Panel Forensic Audit

## Phase 1: Planning & Strategy

- [x] Recon: Map full `admin-panel/src` directory structure
- [x] Initial BUG-01–17 scan on auth-guard, curriculum hooks
- [x] Write implementation plan and get approval

## Phase 2: Audit — Auth & Session Layer

- [x] Deep audit `auth-guard.tsx` (Remember Me race, profile fetch, session eviction)
- [x] Deep audit `LoginPage.tsx` (registration flow, invite code race, session storage)
- [x] Audit `AccountSettingsPage.tsx`, `UserManagementPage.tsx`
- [x] Audit `standard-admin-guard.tsx`, `super-admin-guard.tsx`

## Phase 3: Audit — Data Hooks (Tenant Isolation & Silent Failures)

- [x] Audit `use-apps.ts` (missing app_id scoping on list, hard-delete risk)
- [x] Audit `use-groups.ts` (mentorship — tenant isolation)
- [x] Audit `use-error-logs.ts`, `use-known-issues.ts` (monitoring)
- [x] Audit `use-landings.ts`, `use-subjects.ts` (platform)
- [x] Audit `use-publish.ts`, `use-dashboard.ts` (curriculum)
- [x] Audit `use-ai-generator.ts`, `use-bulk-import.ts` (shared hooks)

## Phase 4: Audit — Services & Lib

- [x] Audit `error-tracker.ts` (silent RPC failure in captureException)
- [x] Audit `SecurityLogger.ts` (catch-all swallowing errors)
- [x] Audit `CurriculumService.ts`, `OracleService.ts`

## Phase 5: Audit — AI & Content Generation

- [x] Audit `generateQuestions.ts`, `governedGeneration.ts`, `validateContent.ts`

## Phase 6: Audit — UI Components & Pages (Silent State Issues)

- [x] Spot-check auth guard components for state bugs

## Phase 7: Compile Findings & Report

- [/] Write walkthrough with all findings
- [ ] Update `implementation_plan.md` with final bug list

## Phase 8: Fixes & Hardening

- [x] Fix BUG-A1: `standard-admin-guard.tsx` loading forever on unauthorized
- [x] Fix BUG-A2: `super-admin-guard.tsx` loading forever on unauthorized
- [x] Fix BUG-A3: `useCreateApp()` silent landing page failure
- [x] Fix BUG-A4: Deferred — RLS provides defense-in-depth
- [x] Fix BUG-A5: `useErrorLogStats()` client-side counting (perf)
- [x] Fix BUG-A6: Duplicate `useDeleteKnownIssue` across two files

## Phase 9: Verification

- [x] Run `npx tsc --noEmit` — zero errors (exit code 0)

## Phase 10: Finalization

- [ ] Update `docs/LEARNING_LOG.md` with findings
- [ ] Commit and push

---

## Postponed (unchanged)

- [ ] (postponed task - never try to touch this again) **P1: Visual Regression Suite**
- [ ] (postponed task - never try to touch this again) **P3: Platform Settings**
- [ ] (postponed task - never try to touch this again) **P3: Rollback Procedures**
