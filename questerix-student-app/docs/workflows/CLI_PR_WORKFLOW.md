# CLI-First PR Workflow

This document outlines the standard procedure for creating and managing Pull Requests using the GitHub CLI (`gh`). This is the preferred method for Questerix development to ensure consistency and speed.

## 1. Prerequisites

- GitHub CLI installed and authenticated (`gh auth login`).
- Clean working directory on a feature branch.

## 2. Standard PR Lifecycle

### A. Create a Branch

```powershell
git checkout -b feat/your-feature-name
```

### B. Make Changes & Commit

Follow conventional commits:

```powershell
git add .
git commit -m "feat: implement logic for X"
```

### C. Open a PR

Use the `gh pr create` command. We use `--fill` to automatically use commit titles and bodies.

```powershell
gh pr create --title "feat: descriptive title" --body "Detailed explanation of changes" --draft
```

_Note: Use `--draft` for work-in-progress._

### D. Check Status

```powershell
gh pr status
gh pr checks
```

### E. Merge Locally (Squashed)

We enforce **Linear History**. Always squash or rebase.

```powershell
gh pr merge --squash --delete-branch
```

## 3. Advanced Operations

### Reviewing PRs

```powershell
gh pr list
gh pr checkout <number>
gh pr diff
```

### CI/CD Integration

If CI fails, use `gh run list` to see details:

```powershell
gh run list --workflow CI
gh run view <run_id> --log
```

## 4. Why CLI-First?

- **Speed**: No context switching to the browser.
- **Automation**: Scripts can easily create PRs (e.g., Dependabot-like agents).
- **History**: Enforces clean, squashed commits without manual UI misclicks.

---

_Last Updated: 2026-02-16_
