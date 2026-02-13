# Questerix Development Tasks

## 🎯 CURRENT PRIORITIES

### P0: Super Admin Capabilities

- [ ] **Super Admin must see everything** — Implement comprehensive visibility for super_admin role
  - [ ] Dashboard: Show aggregated stats across ALL apps (not just current app)
  - [ ] User Management: View all users across all tenants
  - [ ] Error Logs: View errors from all apps
  - [ ] Platform-wide analytics and monitoring
  - [ ] Cross-tenant search and filtering capabilities
  - [ ] Super admin must have access to all pages and navigations links

### P1: Accessibility & UI Polish (2026-02-14)

- [x] **Fix all accessibility violations** — WCAG 2 AA compliance
  - [x] Fixed color-contrast violations (gray-400 → gray-600)
  - [x] Added aria-labels to all icon-only buttons
  - [x] All 5 accessibility tests passing (Login, Dashboard, Domains, Questions, Bulk Import)

---

## ✅ RECENTLY COMPLETED (2026-02-14)

### Accessibility Fixes

- [x] Fixed `button-name` violations by adding `aria-label` to icon-only buttons in:
  - Sidebar (expand/collapse, logo, logout)
  - Bulk Import page (remove item)
- [x] Fixed `color-contrast` violations in:
  - Domain List (table headers, ID text)
  - Super Admin Guard (loading text)
  - Bulk Import Page (labels, IDs)
  - App Loading Page (secure environment text)

### Schema Reconciliation & Build Gate (2026-02-13)

- [x] All RPC functions verified present in QuesterixDB-v2
- [x] Column schema aligned — `database.types.ts` regenerated
- [x] Production build gate active (`tsc && vite build`)
- [x] Test suite integrated into deployment pipeline

### CI Stabilization (2026-02-14)

- [x] Synced GitHub Secrets to QuesterixDB-v2
- [x] Enhanced forensic audit with service role leakage checks
- [x] Created observability migration for DB-v2
- [x] Full test suite baseline verified

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deploy Requirements ✅

- [x] Admin panel unit tests
- [x] Admin panel E2E tests (Playwright)
- [x] Flutter student app tests
- [x] Python content-engine tests
- [x] Architecture tests
- [x] TypeScript type check
- [x] Accessibility tests (5/5 passing)

### Secret Protection ✅

- [x] Gitleaks pre-push hook
- [x] Pre-commit forbidden pattern detection
- [x] GitHub CI secret scanning
- [x] Service role key removed from client bundle

---

## 🛡️ SECURITY & AUDIT REMEDIATION

### Critical Security Fixes ✅

- [x] Removed service role key from client bundle
- [x] Removed Gemini API key from client bundle
- [x] AuthGuard fail-closed on errors
- [x] Client-side role assignment removed
- [x] Session revocation on user deactivation
- [x] Defense-in-depth app_id scoping
- [x] Search wildcard escaping (SQL injection prevention)

### Audit Fixes ✅

- [x] Registration race condition fixed (atomic SQL function)
- [x] loadApps race condition fixed (useRef guard)
- [x] MCQ correct-answer validation
- [x] localStorage error handling
- [x] Cascade delete impact warnings
- [x] KaTeX math rendering implementation

---

## 📋 TECHNICAL DEBT

### High Priority

- [ ] Copy PDF.js worker to `public/pdfjs/` in build process
- [ ] Implement full editors for `mcq_multi`, `boolean`, `reorder_steps` question types
- [ ] Implement `parse-import-prompt` Edge Function for AI import

### Medium Priority

- [ ] Form feedback: Add loading indicators to provision/update buttons
- [ ] Feature verification: Template and Upload buttons in Domain Registry
- [ ] CLI-First PRs: Transition PR lifecycle to `gh` CLI

### Low Priority

- [ ] Broader terminology pass across admin pages
- [ ] Platform Settings page (separate from Account Settings)

---

## 🔄 OBSERVABILITY & MONITORING

### Implemented ✅

- [x] Error logging to database (`error_logs` table)
- [x] Security event logging (`security_logs` table)
- [x] Promote-to-issue flow
- [x] Dashboard error widget with real-time stats
- [x] Client-side breadcrumb tracking

### Pending

- [ ] **P2: Verify 30-day auto-pruning** — Migration created, needs pg_cron schedule
- [ ] **P2: Critical alert trigger** — Migration created, needs deployment verification

---

## 🧪 TEST COVERAGE

### Current Status

- ✅ Admin panel: 70%+ coverage (CI gate active)
- ✅ Flutter student app: 60%+ coverage (CI gate active)
- ✅ Python content-engine: 80%+ coverage (CI gate active)
- ✅ Accessibility: 100% (5/5 tests passing)

### Coverage Gaps

- [ ] Multi-tenant isolation edge cases
- [ ] RLS policy bypass attempts
- [ ] Error boundary recovery flows
- [ ] Offline sync conflict resolution
- [ ] Token quota exhaustion handling
- [ ] AI question generation error paths

---

## 🚀 INFRASTRUCTURE

### Deployed ✅

- [x] Cloudflare Pages: Admin Panel (`admin.questerix.com`)
- [x] Cloudflare Pages: Student App (`app.questerix.com`)
- [x] Custom domains configured
- [x] Landing pages deleted (HARD RULE: never publish)

### CI/CD ✅

- [x] Dependabot (npm, pip, GitHub Actions, Flutter)
- [x] Auto-format workflow
- [x] Type generation workflow
- [x] Platform health report
- [x] Self-healing CI with deduplication
- [x] Make It Green button
- [x] Automated test gate in deployment pipeline

---

## 📝 DOCUMENTATION

### Updated

- [x] `LEARNING_LOG.md` — Audit lessons learned
- [x] `CHANGELOG.md` — Version history
- [x] `TEST_COVERAGE.md` — Coverage matrix
- [x] `.agent/ui-improvements-feb-13.md` — UI/UX changes

### Needs Update

- [ ] Platform architecture documentation
- [ ] Super admin capabilities guide
- [ ] Deployment runbook

---

## 🗑️ CLEANUP COMPLETED

- [x] Removed dead projects (landing-pages)
- [x] Removed duplicate documentation
- [x] Removed stale configurations
- [x] Updated .gitignore patterns
- [x] Consolidated duplicate GitHub workflows
- [x] Bulk-closed 71 stale issues, 25 PRs

---

**Last Updated**: 2026-02-14
**Status**: ✅ Ready for deployment after super admin visibility implementation
