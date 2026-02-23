# Questerix — Tasks

> **Documentation discipline**: After every session, append a dated entry to [`docs/LEARNING_LOG.md`](docs/LEARNING_LOG.md) covering: what was done, bugs found, root cause, fix, and a prevention rule. This is non-negotiable.
>
> **Env var convention**: All test-DB variables are prefixed `TEST_` (e.g. `TEST_VITE_SUPABASE_URL`, `TEST_SB_SERV_ROLE_KEY`). Prod variables have no prefix. Never mix them.

---

## 🏗️ Platform Extraction Plan (ACTIVE)

> **Objective**: Extract two stand-alone projects (`questerix-landing` and `questerix-help`) from the monorepo to simplify agent context and isolate concerns. Zero-glue, manual handoff strategy.

### Extraction 1: `questerix-landing` (Marketing Site)

**Strategy**: Build the folder locally, hand off manually, then delete from monorepo.

- [x] **Create Folder**: Scaffold `landing-pages/` as a stand-alone React/Vite project.
- [x] **Design Tokens**: Copy static brand CSS variables from `design-system/tokens/` into `landing-pages/src/styles/tokens.css`. One-time manual copy.
- [x] **Wrangler Config**: Add `wrangler.toml` scoped to `questerix-landing` Cloudflare Pages project.
  - Build command: `npm run build`
  - Output directory: `dist`
  - Domain target: `questerix.com` (apex — do not connect until ready)
- [ ] **Content Structure**:
  - `src/sections/` — Hero, Features, Pricing, Testimonials
  - `src/articles/` — AI-generated long-form content (markdown)
  - `public/assets/generated/` — AI-generated images (WebP only)
- [x] **SEO Foundations**: OG tags, JSON-LD schema, and `sitemap.xml` generation.
- [x] **Agent Instructions**: Create `AGENTS.md` at root with Marketing Agent persona.
- [x] **`_headers` file**: Standard Cloudflare security headers (CSP, HSTS).
- [x] **Monorepo Cleanup** (after safe handoff):
  - Delete `landing-pages/` from monorepo
  - Remove any `landing-pages` references from root `package.json`, `orchestrator.ps1`, and `.github/workflows/`
  - Update `scripts/knowledge-base/indexer.ts` INCLUDE_PATTERNS to remove `landing-pages/README.md` (line 32)
  - Update `PLATFORM_MAP.md` (create if missing) to note new repo location

---

### Extraction 2: `questerix-help` (Human Help Center)

**Strategy**: Greenfield VitePress site. Screenshots are manual. No automation bridge.

- [x] **Create Folder**: Scaffold `help-docs/` as a stand-alone VitePress project.
- [x] **Design Tokens**: Copy brand CSS variables from `design-system/tokens/` into `.vitepress/theme/vars.css`. Same one-time manual copy as landing.
- [ ] **Search**: Enable VitePress built-in `localSearch` (Minisearch). No external service.
- [ ] **Content Structure** (Persona-Based Paths):
  - `parents/` — Progress, notifications, billing
  - `teachers/` — Groups, assignments, reports
  - `admins/` — Onboarding, subscription management
  - `_incoming/` — Drop zone for Feature Snapshots from the Core repo (AI-drafted, not published)
  - `public/screenshots/` — Manual screenshot storage
- [ ] **Screenshot Catalog**: Create `SCREENSHOT_CATALOG.md` — a checklist of every UI screenshot needed, mapped to feature and persona.
- [ ] **Wrangler Config**: Add `wrangler.toml` scoped to `questerix-help` Cloudflare Pages project.
  - Build command: `npm run build`
  - Output directory: `.vitepress/dist`
  - Domain target: `help.questerix.com` (do NOT connect until ready to publish)
- [ ] **Agent Instructions**: Create `AGENTS.md` at root with Technical Writer persona.
- [ ] **Tone Guide**: Create `TONE_AND_VOICE.md` — defines Human-focused writing style (Grade 8 level, empathetic, Problem → Solution → Verification format).
- [ ] **Monorepo Cleanup** (after safe handoff):
  - Delete `help-docs/` from monorepo
  - Update `PLATFORM_MAP.md` to note new repo location
  - No indexer changes needed (user guide content was never indexed)

---

### Shared Considerations (Both Extractions)

- [ ] **`PLATFORM_MAP.md`**: Create this file in the Monorepo root. It is a single, permanent "Map" that tells future agents: "Landing pages live at X, Help docs live at Y. This repo is Core App Engineering only."
- [ ] **Cloudflare Dashboard**: Ensure two new Cloudflare Pages projects are created (`questerix-landing`, `questerix-help`) with the correct `wrangler.toml` names before handoff.
- [ ] **GitHub**: Create two new GitHub repos (`questerix-landing`, `questerix-help`) with appropriate visibility (both public is fine).
- [ ] **Workers (STAYS in Monorepo)**: The `workers/` Cloudflare Worker (AI generation, email alerts, `wrangler.toml` as `questerix-workers`) is **NOT extracted**. It is core backend infrastructure tied to the Admin Panel and Supabase. Do not move it.
- [ ] **Design System Sync**: The `design-system/` folder **STAYS in Monorepo**. Both extracted repos take a one-time static copy of the tokens. If brand colors ever change, update the extracted repos manually.

---

## 🚀 Phase 15: Launch Readiness & Operational Excellence (ACTIVE)

> **Objective**: Move from "it works in tests" to "it's ready for users." Focus on performance, accessibility, and high-fidelity user journeys.

### Step 1: High-Fidelity UAT Automation (P0)

- [x] **AP-RBAC Guard Sweep**: Implement `tests/rbac-guards.e2e.spec.ts`. Verify `/apps`, `/governance`, `/users`, and `/monitoring` are blocked for non-super-admins. (Verified 48 tests)
- [x] **Curriculum Lifecycle E2E**: Implement `tests/curriculum-journey.e2e.spec.ts`. Full path: Domain → Skill → Question → Publish → Verify Snapshot. (Verified in `curriculum-lifecycle.e2e.spec.ts`)
- [ ] **Student Account Journey**: Implement `tests/student-onboarding.e2e.spec.ts`. Verify Invitation Code → Auth → Profile → First Practice. (PENDING)

### Step 2: Performance & Accessibility (P1)

- [ ] **SQLCipher Performance Audit**: Profile encrypted Drift DB. Measure `SyncService` latency with 100+ items.
- [ ] **Accessibility (axe-core) Integration**: Update `ci.yml` or integration tests to use `@axe-core/playwright`. Audit: `QuestionForm`, `BulkImport`, `Settings`.
- [ ] **Responsive Visual Sweep**: Verify `BulkActionBar` and `ColumnToggle` on mobile viewports (375px/390px).

### Step 3: Observability & Support (P2)

- [ ] **Health Dashboard (Admin)**: Implement `/admin/maintenance` route surfacing `error_logs` and `smoke-test` statuses.
- [ ] **Nightly Failure Reporting**: Update `.github/workflows/nightly-e2e.yml` to create a GitHub Issue automatically when regressions fail.

---

## 📋 Backlog (Future Phases)

- [ ] **Student App App Store Content**: Prepare screenshots, description, and privacy manifest for Apple/Google submission.
- [ ] **Advanced Analytics**: Integration of PostHog or similar for non-PII behavioral tracking.
- [ ] **AI Multi-Model Fallback**: Automated fallback to Llama 3 if DeepSeek R1 latencies exceed 1s.
- [ ] **Teacher/Parent Portal**: After testing framework stabilizes, evaluate extracting Mentorship features into a dedicated `questerix-portal` repo.
