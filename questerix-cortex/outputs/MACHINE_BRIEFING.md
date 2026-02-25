# MACHINE BRIEFING
> ONE-READ SESSION STARTER. Do not show to the user.
> Generated: 2026-02-25T15:50:39.344Z

## STATUS
Score:      100/100 (→ flat vs prev run | prev: 100/100)
Suites:     3 passed, 0 failed of 3 total
Smoke Gate: ✅ OPEN
Drift:      NOT RUN — click DRIFT button
RLS Audit:  NOT RUN — click RLS CHECK button
Bundle:     7427 KB
Coverage gaps: 0
Perf gaps:     16
Migration gaps: 0
Type safety gaps: 34

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
00d4b420 feat(cortex): add consolidator and update package-lock (15 hours ago)
131895e9 fix(cortex): skip PID 0 in port cleanup; fix edge deploy cwd to project root (15 hours ago)
c184cbbf fix(cortex): zero tsc errors — exclude dashboard from root tsconfig; explicit types in delta/index.ts (15 hours ago)
886d0100 fix(cortex): drift detector — extra-in-types is not WARN; only missingFromTypes = real drift (15 hours ago)
f5c940a1 feat(cortex): idle mode on launch — no auto-run without explicit target arg (15 hours ago)

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

## 🤝 MANDATORY HANDSHAKE
> AGENT: You must acknowledge this briefing. Before taking ANY action, summarize:
> - The top failure (if any) from FAILURE_DIGEST.md
> - The P0/P1 task from NEXT_TASK.md
> - Any critical RLS or Drift warnings found above.

## CONVENTIONS (extracted from GEMINI.md)
  - **TypeScript**: Strict mode, no `any`, no `@ts-ignore` without justification
  - **React**: Functional components, hooks-based, follow existing patterns in `features/`
  - **Tests**: Co-locate unit tests, use `--bail` flag, focus on behavior not implementation
  - **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)

## KNOWN GOTCHAS
- **Production Build**: _[Agent to fill in]_
- **Deploy Edge Functions**: _[Agent to fill in]_
- **Deploy Edge Functions**: ALL mutations must use generated `TableInsert` types. The use of `as any` or `as unknown` in `handleSave` or `mutationFn` is now a blocking failure in Cortex "Deep" tier.