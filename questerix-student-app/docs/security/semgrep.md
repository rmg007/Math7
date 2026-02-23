# Semgrep Security Scanning

Semgrep is enabled to provide static analysis across TypeScript/JavaScript, Python, Dart/Flutter, GitHub Actions, Dockerfiles, and SQL-related patterns.

## Goals

- Detect security issues early on PRs.
- Upload SARIF to GitHub Code Scanning for triage and history.
- Establish a suppression workflow with clear ownership.

## Rulesets

Recommended rule bundles (subject to tuning in semgrep.yml):

- p/ci
- p/security-audit
- p/javascript
- p/typescript
- p/python
- p/dart
- p/github-actions
- p/docker
- community SQL injection and ORM best practices

Add a semgrep.yml at the root to customize inclusions/exclusions and severity thresholds as needed.

## Workflow

- .github/workflows/security.yml runs Semgrep on push and pull_request. It:
  - Checks out code
  - Runs semgrep-action with required rulesets
  - Uploads SARIF results (requires permissions: security-events: write)
  - Fails the job on high/critical findings

## Suppressions

- Use inline suppression comments with justification only when necessary.
- Prefer fixing findings; suppress only when:
  - False positive is confirmed; or
  - Risk is accepted and documented.
- Track suppressions via PR review; security/code owners must approve.

## Local Usage

- pipx install semgrep or use Docker image.
- semgrep --config p/security-audit --error

## Notes

- Do not echo secrets in workflows or logs.
- Ensure secrets are only used in env: blocks and passed to tools that require them.
