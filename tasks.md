# Questerix Task Registry & Roadmap

## 🧪 TEST COVERAGE MONITORING

| Domain                 | Status              | Coverage Gaps                                     |
| :--------------------- | :------------------ | :------------------------------------------------ |
| **Admin Panel (Unit)** | ✅ 19 files passing | Error boundary recovery, Offline sync conflicts   |
| **E2E (Playwright)**   | ✅ 28/31 passing    | Token quota exhaustion, AI generation error paths |
| **Security (RLS)**     | ✅ 5/5 bypass tests | Advanced lateral movement scenarios               |
| **A11y (WCAG)**        | ✅ 100% (5/5 tests) | Dynamic content announcements (Live regions)      |

---

## 🏗️ ACTIVE SPRINT

### P0 — Critical Path

- [ ] **Beta Feedback Loop**: Ensure the sidebar feedback mechanism correctly pipes to Supabase/Edge Function.

### P1 — UI/UX & Reliability

- [ ] **Inline Form Validation**: Add HTML5 `required`/`pattern` attrs and inline error messages to content creation forms.
- [ ] **Responsive Testing**: Verify layouts at 375px, 768px, 1024px+.

### P2 — Polish

- [ ] **Sort Direction Indicators**: Clarify active sort column/direction in table headers.
- [ ] **Automated Row Height Test**: Implement Playwright test to verify all table rows (`tr`) remain single-line (constant height) across the platform.

---

## 📦 BACKLOG / DEFERRED

- [ ] **P1: Visual Regression Suite** — Establish baselines and run full visual diff check.
- [ ] **P3: Platform Settings** — Global Branding, App Config, Tenant Scoping.
- [ ] **P3: Rollback Procedures** — SQL scripts for structural rollbacks.

---

## 🚀 SYSTEM STATE (SSoT)

- **Infrastructure**: ✅ Production Stable (Admin Panel & Student App)
- **Security**: ✅ RLS Hardened, Secrets Rotated
- **CI/CD**: ✅ Self-healing Dispatch Active

---

## 🛠️ QUICK REFERENCE

```powershell
./scripts/run-all-tests.ps1   # Parallelized test suite execution
./scripts/preflight.ps1       # Comprehensive code hygiene check
supabase gen types typescript --project-id bkfhorslctqieetzqdtd > admin-panel/src/lib/database.types.ts
```

---

**Last Synchronized**: 2026-02-16 14:47 PST
**Project Context**: RMG-007 / Questerix
