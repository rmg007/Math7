
## ✅ Recently Completed

- **[TESTS] Fix Student App Widget Tests**: Verified all 78 tests passing in the Student App.
- **[SECURITY] Sanitize Question Content**: Implemented `DOMPurify` sanitization for `dangerouslySetInnerHTML` in the Admin Panel.
- **[AUDIT] Verify Tenant Isolation (VUL-018)**: Hardened RLS policies for `profiles`, `apps`, and `subjects`. Fixed VUL-018 in `import_questions_bulk` RPC.


- **Gitleaks** — pre-commit hook + CI workflow
- **Dependabot** — weekly dependency scanning (npm, pip, GitHub Actions)
- **Semgrep** — 6 custom rules + CI workflow
- **pgTAP** — 16 RLS isolation tests in CI
- **plpgsql_check** — enabled ext, found & fixed 7 broken functions
- **Stryker** — evaluated, deferred (Node.js 22 compat + low test count)
- **Student App query perf** — `getStatsBySkill()` rewritten with Drift JOIN
- **Deployment** — Deployed Admin and Student apps to Cloudflare (v0.9.0) [x]
