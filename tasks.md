# Questerix Task Registry & Roadmap

## 🧪 TEST COVERAGE MONITORING

| Domain                 | Status              | Coverage Gaps                                     |
| :--------------------- | :------------------ | :------------------------------------------------ |
| **Admin Panel (Unit)** | ✅ 19 files passing | Error boundary recovery, Offline sync conflicts   |
| **E2E (Playwright)**   | ✅ 28/31 passing    | Token quota exhaustion, AI generation error paths |
| **Security (RLS)**     | ✅ 5/5 bypass tests | Advanced lateral movement scenarios               |
| **A11y (WCAG)**        | ✅ 100% (5/5 tests) | Dynamic content announcements (Live regions)      |

---

## 🔴 QA AUDIT — Adversarial Findings (Feb 16, 2026)

> Source: Comprehensive adversarial QA audit. Priorities reflect root cause analysis.

### P0 — Must Fix Before Production

- [x] **RLS Write Policies**: Fix Supabase RLS INSERT/UPDATE/DELETE policies for `subjects` and `apps`. Verified CRUD functionality for `apps` using Super Admin credentials. (Feb 16).
- [x] **Platform CRUD Verification**: Confirmed Create, Read, Update, and Delete operations for Applications and Landings. Normalization (trimming/lowercasing) verified.
- [x] **Cloudflare Automation**: Implemented Supabase Edge Function + Database Trigger to automatically sync `apps` subdomains with Cloudflare Pages custom domains. (Feb 16).
- [x] **Mutation Error Surfacing**: Wire up error toasts/snackbars for all React Query mutation `onError` callbacks. (Standardized in Subjects, Skills, Questions, Apps).

### P1 — Should Fix Before Release

- [x] **Admin UI Standardization**: Centralized normalization, simplified table rows, and clickable links across the dashboard.
- [ ] **TypeError Bugs (3x)**: Fix `Cannot read 'version' of null` and `Cannot read 'split' of undefined`. These are real null-guard defects.
- [ ] **Error Log Noise Reduction**: Filter `ResizeObserver loop` (12x, browser noise) and `AbortError signal aborted` (24x, expected unmount behavior) from error tracking. Reduces 53 errors → ~7 real ones.
- [ ] **Performance Audit**: Check chunk sizes and load times for the standardized AppsPage.
- [ ] **Beta Feedback Loop**: Ensure the sidebar feedback mechanism correctly pipes to Supabase/Edge Function.

### P2 — Polish

- [x] **Loading States on Forms**: Wire `isPending` from mutation hooks to disable submit buttons + show spinner. (Applied to primary content forms).
- [ ] **Inline Form Validation**: Add HTML5 `required`/`pattern` attrs and inline error messages to content creation forms.
- [x] **Empty State Copy**: Change Questions page "Registry empty" to user-friendly language.
- [x] **Button Style Consistency**: Unify button styling across modals and page headers. (Aligned to the new 3D-esque rounded-2xl indigo style).
- [ ] **Responsive Testing**: Verify layouts at 375px, 768px, 1024px+.
- [ ] **Sort Direction Indicators**: Clarify active sort column/direction in table headers.
- [ ] **Automated Row Height Test**: Implement Playwright test to verify all table rows (`tr`) remain single-line (constant height) across the platform.

---

## 📦 BACKLOG / DEFERRED

These tasks are recognized but deferred for future consideration.

- [ ] **P1: Visual Regression Suite** — Establish baselines and run full visual diff check (Ignored for now)
- [ ] **P3: Platform Settings** — Implement the global Platform Settings page (Branding, App Config, Tenant Scoping)
- [ ] **P3: Rollback Procedures** — Create executable SQL scripts for rolling back Super Admin structural changes

---

## 🚀 SYSTEM STATE (SSoT)

### 🚀 Infrastructure

- **Status**: ✅ Production Stable
- **Deployments**: Admin Panel (Vite), Student App (Flutter), Custom Domains Active
- **CI/CD**: Self-healing Dispatch, Pre-flight Validation, Auto-Format active

### 🔒 Security

- **Supabase**: QuesterixDB-v2 (`bkfhorslctqieetzqdtd`)
- **Fixes**: 24/27 Security Advisor findings remediated (Feb 16)
- **Secrets**: Recreated and rotated (Feb 13)

---

## 🛠️ QUICK REFERENCE

### Core Operations

```powershell
./scripts/run-all-tests.ps1   # Parallelized test suite execution
./scripts/preflight.ps1       # Comprehensive code hygiene check
supabase gen types typescript --project-id bkfhorslctqieetzqdtd > admin-panel/src/lib/database.types.ts
```

### Build & Deploy

```powershell
cd admin-panel; npm run build # Validate production bundle
./orchestrator.ps1            # Full project deployment (Cloudflare/Supabase)
```

---

**Last Synchronized**: 2026-02-16 20:30 PST
**Current Sprint Focus**: Deployment Stabilization & Admin Platform Finalization
**Active Project Context**: RMG-007 / Questerix
