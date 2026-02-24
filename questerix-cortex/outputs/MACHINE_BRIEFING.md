# MACHINE BRIEFING
> ONE-READ SESSION STARTER. Do not show to the user.
> Generated: 2026-02-24T23:42:11.188Z

## STATUS
Score:      100/100 (→ flat vs prev run | prev: 100/100)
Suites:     1 passed, 0 failed of 1 total
Smoke Gate: — NOT RUN
Drift:      NOT RUN — click DRIFT button
RLS Audit:  NOT RUN — click RLS CHECK button
Bundle:     7427 KB
Coverage gaps: 40

## FAILURES
  none

## OPEN TASKS
  - [ ] **Automated Release**: Run `npm run health` in `questerix-cortex/`
  - [ ] **Build admin panel**: `npm run build` (Injected into Release Tier)
  - [ ] **Deploy to Cloudflare Pages**: `npx wrangler pages deploy` (Injected into Deploy Tier)
  - [ ] **Deploy edge functions**: `supabase functions deploy` (Injected into Deploy Tier)
  - [ ] **Verify production deployment**: Post-deploy health check on live URL
  - [ ] **Verify CSP/RBAC live**: Cortex smoke verification against production endpoint
  - [ ] **Automated Push**: Run `npm run health` in `questerix-cortex/`
  - [ ] **Commit**: `git commit -m "feat: auto-ship via cortex"` (Injected into Ship Tier)
  - [ ] **Confirm CI passes**: GitHub Actions `ci.yml` trigger on push
  - [ ] **Tag release**: `git tag v<version>` + `git push --tags` (Conditional Ship sub-task)

## RECENT COMMITS
bf0e7f8a test: add use-studio-generator suite; fix cortex scanner; expand track C backlog (85 seconds ago)
f88ac4b1 feat: complete Questerix Cortex v1 implementation (5 hours ago)
30c04ee7 feat: add Questerix Sentinel QA Engine scaffold and update tasks.md (5 hours ago)
6b807e5b feat: rich text editor — math authoring, tables, accessibility (19 hours ago)
36fea2bc refactor: complete student-app extraction and apply auto-assign app_id hardening (30 hours ago)

## KEY PATHS
  admin-panel/src/lib/database.types.ts
  supabase/migrations/ (2 files)
  admin-panel/tests/
  supabase/functions/
  questerix-cortex/outputs/FAILURE_DIGEST.md
  questerix-cortex/outputs/LAST_CHANGED.md
  .agent/artifacts/FORENSIC_REPORT.md
  .agent/HARDENING_BACKLOG.json

## HOW TO START
1. Read FAILURE_DIGEST.md if failures > 0
2. Read LAST_CHANGED.md to see what files shifted
3. Check NEXT_TASK.md for the highest-priority action
4. If RLS = NOT RUN, trigger it before any schema work
5. Check API_MAP.json before calling any hook method
6. Check UTILITY_REGISTRY.md before writing any new helper

## CONVENTIONS (extracted from GEMINI.md)
  - **TypeScript**: Strict mode, no `any`, no `@ts-ignore` without justification
  - **React**: Functional components, hooks-based, follow existing patterns in `features/`
  - **Tests**: Co-locate unit tests, use `--bail` flag, focus on behavior not implementation
  - **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)

## KNOWN GOTCHAS
- **Forensic Audit**: NEVER use em-dashes, smart quotes, or any non-ASCII characters in .ps1 files. Use - for dash separators in strings.
- **Certify Phase 0**: Any task that delegates to other scripts must be allocated at least 15 minutes. Never apply a global short timeout to compound orchestrator tasks.