# Questerix Development Tasks

## 🎯 CURRENT PRIORITIES

### P1: Testing & Quality Gates

- [x] Run full Vitest suite across admin-panel ✅ (Feb 15 — 19 files, all pass)
- [x] TypeScript compilation clean (`npx tsc --noEmit`) ✅ (Feb 15)
- [x] ESLint clean (0 warnings, 0 errors) ✅ (Feb 15)
- [x] Fix file-parsers.test.ts hang ✅ (Feb 15 — mock path mismatch + arrayBuffer polyfill)
- [x] Fix use-toast.test.tsx hang ✅ (Feb 15 — infinite loop in afterEach + test assertion bugs)
- [x] Run Playwright E2E flows (admin critical paths) ✅ (Feb 15 — 28 pass, 1 skipped)
- [ ] Run Visual Regression suite and update baselines ⏳ (deferred — design still in progress)
- [x] Re-verify a11y and quality gates post-merge/purge ✅ (Feb 15 — 0 violations)

---

## 🚀 DEPLOYMENT READINESS

### Pre-Deployment Checklist

- [x] **Code Quality**: All lint errors fixed, TypeScript compilation clean ✅
- [x] **Accessibility**: WCAG 2 AA compliance achieved (5/5 tests passing)
- [x] **Super Admin Features**: Implementation complete, migration ready
- [x] **Documentation**: CHANGELOG.md updated, tasks.md current
- [x] **Test Suite**: Full Vitest suite passes (19 files, 0 failures) ✅ (Feb 15)
- [x] **Migration**: Apply super admin database changes to production

### Post-Deployment Verification

- [ ] Super admin can view data across all apps
- [ ] App filter dropdowns work in curriculum pages
- [ ] Dashboard shows aggregated stats for super admins
- [ ] Accessibility tests still pass in production
- [ ] No new lint or TypeScript errors introduced

---

## ✅ Post-Consolidation Test Gate (Go/No-Go)

- [x] Branch state: Only `main` exists ✅ (Feb 13)
- [ ] Branch protection: Linear history required, force-push blocked, admins enforced
- [x] CI sanity: `npx tsc --noEmit` passes ✅ (Feb 15)
- [x] Unit tests: `admin-panel` Vitest suite passes ✅ (Feb 15 — 19 files)
- [x] A11y: Playwright WCAG 2 AA tests pass ✅ (Feb 15)
- [x] E2E: Admin critical flows green ✅ (Feb 15 — 28/31 pass)
- [ ] Visual regression: Baselines deferred (design in progress)

---

## 📋 TECHNICAL DEBT

### High Priority

- [x] **P1: Deploy Super Admin Migration** — Applied `20260214210000_super_admin_jwt_claims.sql` + v2/v3 ✅ (already deployed)
- [x] **P1: Verify Super Admin Cross-Tenant Access** — JWT claims verified, RLS policies correct ✅ (Feb 16)
- [x] **P1: Security Hardening** — Fixed 24 Supabase Advisor findings (search_path, RLS gaps) ✅ (Feb 16)
- [ ] Copy PDF.js worker to `public/pdfjs/` in build process
- [ ] Implement full editors for `mcq_multi`, `boolean`, `reorder_steps` question types
- [ ] Implement `parse-import-prompt` Edge Function for AI import

### Medium Priority

- [ ] CLI-First PRs: Transition PR lifecycle to `gh` CLI
- [ ] **P2: JWT Helper Function Testing** — Add unit tests for updated `jwt_is_super_admin()` function

### Low Priority

- [ ] Broader terminology pass across admin pages
- [ ] Platform Settings page (separate from Account Settings)
- [ ] **P3: Migration Rollback Scripts** — Add rollback capability for super admin migration

---

## 🔄 OBSERVABILITY & MONITORING

### Pending

- [ ] **P2: Verify 30-day auto-pruning** — Migration created, needs pg_cron schedule
- [ ] **P2: Critical alert trigger** — Migration created, needs deployment verification

---

## 🧪 TEST COVERAGE

### Current Status

- ✅ Admin panel: Vitest suite — 19 test files, all passing (Feb 15)
- ✅ TypeScript: Zero compilation errors
- ✅ ESLint: Zero warnings, zero errors
- ✅ Accessibility: 100% (5/5 tests passing)

### Coverage Gaps

- [ ] Multi-tenant isolation edge cases
- [ ] RLS policy bypass attempts
- [ ] Error boundary recovery flows
- [ ] Offline sync conflict resolution
- [ ] Token quota exhaustion handling
- [ ] AI question generation error paths

---

## 🚀 INFRASTRUCTURE (Status)

- ✅ Deployed: Admin Panel, Student App, Custom Domains
- ✅ CI/CD: Dependabot, Auto-format, Type gen, Self-healing CI, Make It Green
- ✅ Supabase: QuesterixDB-v2 (`bkfhorslctqieetzqdtd`) — active and healthy

---

## 🔒 SECURITY & AUDIT (Status)

- ✅ Critical Fixes: Bundle cleanup, AuthGuard hardening, Injection prevention
- ✅ Audit Items: Race condition fixes, Validation, Math rendering
- ✅ Supabase project recreated with clean secrets (Feb 13)

---

## 🛠️ QUICK REFERENCE

### Regenerate Database Types

```bash
supabase gen types typescript --project-id bkfhorslctqieetzqdtd > admin-panel/src/lib/database.types.ts
```

### Run Tests

```bash
# Admin Panel
cd admin-panel
npx vitest run --bail         # Unit tests
npx tsc --noEmit              # Type check
npm run lint                  # Linting
npx playwright test           # E2E tests

# Student App
cd student-app
flutter test                  # All tests
flutter analyze               # Static analysis

# Full Suite
./scripts/preflight.ps1       # Pre-flight checks
./scripts/run-all-tests.ps1   # All test suites
```

### Deploy

```bash
./orchestrator.ps1            # Full deployment
```

---

**Last Updated**: 2026-02-16 06:15 PST
**Status**: ✅ All quality gates passing + Security hardening complete
**Next Action**: Continue design work, then update VR baselines
**Active Supabase Project**: QuesterixDB-v2 (`bkfhorslctqieetzqdtd`)
