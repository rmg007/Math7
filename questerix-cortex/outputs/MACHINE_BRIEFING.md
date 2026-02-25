# MACHINE BRIEFING

> ONE-READ SESSION STARTER. Do not show to the user.
> Generated: 2026-02-25T17:47:29.297Z

## STATUS

Score: 100/100 (→ flat vs prev run | prev: 100/100)
Suites: 3 passed, 0 failed of 3 total
Smoke Gate: ✅ OPEN
Drift: CLEAN (missing-from-types: 0, extra-in-types: 16)
RLS Audit: PASS (critical: 0)
Bundle: 7427 KB
Coverage gaps: 0
Perf gaps: 0
Migration gaps: 0
Type safety gaps: 16

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

2aa57ec8 docs: sync tasks.md with codebase intelligence completion (2 hours ago)
ca7b8010 feat(cortex): update session protocols to skeleton-first workflow (2 hours ago)
b0e0f8ac feat(cortex): finalize codebase intelligence system (skeleton + fts search) (2 hours ago)
00d4b420 feat(cortex): add consolidator and update package-lock (17 hours ago)
131895e9 fix(cortex): skip PID 0 in port cleanup; fix edge deploy cwd to project root (17 hours ago)

## KEY PATHS

admin-panel/src/lib/database.types.ts
supabase/migrations/ (2 files)
admin-panel/tests/
supabase/functions/
questerix-cortex/outputs/FAILURE_DIGEST.md
questerix-cortex/outputs/LAST_CHANGED.md
.agent/artifacts/FORENSIC_REPORT.md
.agent/HARDENING_BACKLOG.json

## CODEBASE SKELETON

> Load SKELETON_SUMMARY.md at session start (< 10KB). Load SKELETON.md section on demand when editing a feature.
> questerix-cortex/outputs/SKELETON_SUMMARY.md ← always load first
> questerix-cortex/outputs/SKELETON.md ← load section for the feature you are editing
> questerix-cortex/outputs/SKELETON.json ← machine-readable, used by skeleton:search

1. Read SKELETON_SUMMARY.md for codebase orientation.
2. Use `skeleton:search` CLI if you need to find a specific symbol.
3. Check UTILITY_REGISTRY.md before writing any new helper.

## WORKFLOW

1. Read FAILURE_DIGEST.md if failures > 0
2. Read LAST_CHANGED.md to see what files shifted
3. Check NEXT_TASK.md for the highest-priority action
4. Continue with the next feature or sub-task in `tasks.md`.
5. If modifying the database, run the RLS audit immediately.

## 🤝 MANDATORY HANDSHAKE

> AGENT: You must acknowledge this briefing. Before taking ANY action, summarize:
>
> - The top failure (if any) from FAILURE_DIGEST.md
> - The P0/P1 task from NEXT_TASK.md
> - Any critical RLS or Drift warnings found above.

## CONVENTIONS (extracted from GEMINI.md)

- **TypeScript**: Strict mode, no `any`, no `@ts-ignore` without justification
- **React**: Functional components, hooks-based, follow existing patterns in `features/`
- **Tests**: Co-locate unit tests, use `--bail` flag, focus on behavior not implementation
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)

## KNOWN GOTCHAS

- **Deploy Edge Functions**: _[Agent to fill in]_
- **Deploy Edge Functions**: ALL mutations must use generated `TableInsert` types. The use of `as any` or `as unknown` in `handleSave` or `mutationFn` is now a blocking failure in Cortex "Deep" tier.
- **Cortex RLS Audit**: **Rule of Remote Evidence**: When local infrastructure fails, provide a verified "Evidence Bridge". **Rule of Target Awareness**: Never run codebase-wide analysis for isolated sub-tasks.
