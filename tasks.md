# Questerix Task Registry & Roadmap

## 🧪 TEST COVERAGE MONITORING

| Domain                 | Status              | Coverage Gaps                                     |
| :--------------------- | :------------------ | :------------------------------------------------ |
| **Admin Panel (Unit)** | ✅ 19 files passing | Error boundary recovery, Offline sync conflicts   |
| **E2E (Playwright)**   | ✅ 39/39 passing    | Token quota exhaustion, AI generation error paths |
| **Security (RLS)**     | ✅ 7/7 bypass tests | Advanced lateral movement scenarios               |
| **A11y (WCAG)**        | ✅ 100% (5/5 tests) | Dynamic content announcements (Live regions)      |

---

## 🏗️ ACTIVE SPRINT

### P0 — Critical Path

- [x] **Project HADES: Phase 1 Audit (The Foundry)** — RLS Ghosting, Multi-tenant Isolation, Edge Function Auth.
- [x] **Project HADES: Phase 2 Audit (The Pipeline)** — Sync Service Loop fix, RLS Tenant Isolation (admin tables), AI Prompt Injection hardening.
- [x] **Project HADES: Phase 3 Audit (The Anatomy)** — Architecture Drift, Type Safety, CORS. [COMPLETED: Multi-tenant visibility & cross-app transparency]
- [x] **Beta Feedback Loop**: Verified sidebar feedback link points to GitHub Issues; unified footer help icon to GitHub. (Supabase pipe pending Phase 4).
      `

### P1 — UI/UX & Reliability

- [ ] **Inline Form Validation**: Add HTML5 `required`/`pattern` attrs and inline error messages to content creation forms.
- [x] **Responsive Testing**: Verify layouts at 375px, 768px, 1024px+.

### P2 — Polish

- [x] **Sort Direction Indicators**: Clarify active sort column/direction in table headers.
- [x] **Automated Row Height Test**: Implement Playwright test to verify all table rows (`tr`) remain single-line (constant height) across the platform.
- [x] **Table Icon Cleanup**: Removed decorative icons from AppsPage and verified absence across tables with strict Playwright test.

---

## 📦 BACKLOG / DEFERRED

- [ ] **P1: Visual Regression Suite** — Establish baselines and run full visual diff check.
- [ ] **P3: Platform Settings** — Global Branding, App Config, Tenant Scoping.
- [ ] **P3: Rollback Procedures** — SQL scripts for structural rollbacks.

---

## 🚀 SYSTEM STATE (SSoT)

- **Infrastructure**: ✅ Production Live (Cloudflare Pages) — Last Deployed: 2026-02-16 16:21
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

**Last Synchronized**: 2026-02-16 20:46 PST
**Project Context**: RMG-007 / Questerix
