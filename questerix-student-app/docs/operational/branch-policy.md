# Single-Branch Policy (main only)

Date: 2026-02-14
Owner: Platform Engineering

## Policy

- The repository must only have one permanent branch: `main`.
- Any non-`main` branches pushed or created will be deleted automatically.
- If temporary branches are required, they must be maintained in a fork.

## Automation

- Workflow: [.github/workflows/enforce-single-branch.yml](../../.github/workflows/enforce-single-branch.yml)
  - Triggers on any branch `push` or `create` event
  - Deletes the branch via GitHub API if it is not `main`
  - Verifies deletion

- Workflow (one-shot): [.github/workflows/purge-non-main.yml](../../.github/workflows/purge-non-main.yml)
  - Run manually to purge all non-main branches with a dry-run option

- Workflow (merge): [.github/workflows/merge-all-branches.yml](../../.github/workflows/merge-all-branches.yml)
  - Run manually to merge all branches into `main` (supports strategies, dry-run)
  - Default strategy is `ours` so `main` remains authoritative on conflicts

- Workflow (branch protection): [.github/workflows/set-branch-protection.yml](../../.github/workflows/set-branch-protection.yml)
  - Run manually to apply branch protection rules to `main`
  - Requires `ADMIN_TOKEN` secret (Personal Access Token with repo admin scope)

## Manual Cleanup

Use the provided script to remove all non-main branches locally and on the remote.

Dry run (no deletions):

```bash
./scripts/cleanup-branches.sh
```

Apply deletions (requires push permissions):

```bash
./scripts/cleanup-branches.sh --apply
```

The script will:

- Switch to `main` if needed
- List local and remote branches that will be deleted (excluding `main`)
- Ask for confirmation before applying deletions

## Admin Enforcement (GitHub UI)

Recommended settings to prevent accidental changes:

- Settings → Branches → Branch protection rules:
  - Protect `main`
  - Require pull request reviews before merging (optional if single-branch)
  - Require status checks to pass before merging (optional)
  - Include administrators (recommended)
  - Prevent force pushes (recommended)
  - Require linear history (recommended)
  - Restrict who can push to `main` (optional)

Optional: Organization Rulesets can be used to block branch creation entirely except for `main`.

## Caveats

- The enforcement workflow deletes branches immediately, including those used for open PRs. If you prefer to skip branches with open PRs, adjust the workflow to query PR status before deletion.
- For external contributions, recommend using forks.
