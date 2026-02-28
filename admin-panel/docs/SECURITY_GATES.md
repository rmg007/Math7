# Security Gates — Questerix Admin Panel

This document describes all automated security scanning that runs in CI and the steps required to activate optional scanners.

---

## What Runs Automatically (Zero Setup Required)

| Scanner               | Trigger                            | Gate                                                                  |
| :-------------------- | :--------------------------------- | :-------------------------------------------------------------------- |
| **GitHub CodeQL**     | Every push + PR to `main`          | Blocks on High/Critical SAST findings                                 |
| **Dependency Review** | Every PR to `main`                 | Blocks on High/Critical CVE in new deps                               |
| **npm audit**         | Every push + PR                    | Blocks on `--audit-level=high`                                        |
| **Gitleaks**          | Every push + PR                    | Blocks if secrets are committed                                       |
| **Semgrep**           | Every push + PR                    | Custom rules + `p/javascript`, `p/typescript`, `p/react`, `p/secrets` |
| **OWASP ZAP DAST**    | Daily (1 AM UTC) + manual dispatch | Creates GitHub issue on High findings                                 |
| **pip-audit**         | Every push + PR                    | Audits all `requirements*.txt` files found in repo                    |
| **Bandit**            | Every push + PR                    | SAST on all Python files in `scripts/`                                |
| **Dependabot**        | Weekly (Monday)                    | PRs for npm, GitHub Actions vulnerabilities                           |

---

## Optional: Snyk (requires secret)

Snyk provides deeper dependency graph analysis, license compliance checking, and fix PRs. It runs automatically when `SNYK_TOKEN` is set.

### Setup Steps

1. Create a free account at [snyk.io](https://snyk.io)
2. Go to **Account Settings → API Token** and copy your token
3. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `SNYK_TOKEN`
   - Value: _(paste token)_
4. Optionally, set the repository variable `SNYK_ENABLED=true` to enforce gating on forks too

### What Snyk adds over npm audit

- Transitive dependency vulnerability detection (npm audit only catches direct)
- License compliance scanning
- Container image scanning (future)
- Fix PRs with one-click remediation

---

## Python Security (scripts/)

The `python-security` CI job covers all Python files in the repo:

| Tool          | What it checks                        | Config                                   |
| :------------ | :------------------------------------ | :--------------------------------------- |
| **pip-audit** | CVEs in all `requirements*.txt` files | Fails on any finding                     |
| **Bandit**    | SAST for Python security antipatterns | Severity `medium+`, confidence `medium+` |

### Bandit suppressions

| Rule ID                                  | Reason                                                  |
| :--------------------------------------- | :------------------------------------------------------ |
| `B101` (assert_used)                     | Asserts used in CI utility scripts, not production code |
| `B603` (subprocess_without_shell)        | Intentional in ops_runner.py and audit scripts          |
| `B607` (start_process_with_partial_path) | Same as above — known safe contexts                     |

To add a new suppression: update the `--skip` flag in `.github/workflows/security.yml` **and** add a row to this table.

---

## Known Gaps / Future Work

| Gap                                                            | Planned Fix                                              | Slot     |
| :------------------------------------------------------------- | :------------------------------------------------------- | :------- |
| Snyk gating not enforced on fork PRs without secret            | Enable after Snyk org account created                    | K-3      |
| OWASP ZAP `.zap/rules.tsv` file missing — ZAP uses defaults    | Create rules file to suppress false positives on the SPA | K-3      |
| DAST scan target is `questerix-admin.pages.dev` — staging only | Add production URL as separate monthly scan              | Post-1.0 |

---

> [!IMPORTANT]
> If `npm audit` fails in CI, **do not bypass it with `npm audit --force`.**
> Investigate the CVE first. If the package cannot be updated (peer conflict), add a justified entry to this document before adding `--ignore-scripts` or overrides to `package.json`.
