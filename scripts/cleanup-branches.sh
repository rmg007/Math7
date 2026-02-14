#!/usr/bin/env bash
set -euo pipefail

# cleanup-branches.sh
#
# Purpose: Keep only the main branch locally and on origin.
# - By default runs in DRY-RUN mode (no deletions). Use --apply to perform deletions.
# - Skips 'main' branch always.
#
# Usage:
#   ./scripts/cleanup-branches.sh          # dry run (show what would be deleted)
#   ./scripts/cleanup-branches.sh --apply  # actually delete branches
#   GIT_REMOTE=upstream ./scripts/cleanup-branches.sh --apply  # use a different remote

DRY_RUN=true
REMOTE="${GIT_REMOTE:-origin}"

if [[ "${1:-}" == "--apply" ]]; then
  DRY_RUN=false
fi

echo "Remote: $REMOTE"
echo "Mode  : $([[ "$DRY_RUN" == true ]] && echo DRY-RUN || echo APPLY)"

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
  echo "Switching to main..."
  git checkout main
fi

echo
echo "== Local branches to delete (excluding main) =="
mapfile -t local_branches < <(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -v '^main$' || true)
printf '%s\n' "${local_branches[@]:-}"

echo
echo "== Remote branches to delete on $REMOTE (excluding main) =="
mapfile -t remote_branches < <(git for-each-ref --format='%(refname:short)' refs/remotes/$REMOTE/ | sed "s|$REMOTE/||" | sort -u | grep -v '^main$' || true)
printf '%s\n' "${remote_branches[@]:-}"

if [[ "$DRY_RUN" == true ]]; then
  echo
  echo "Dry run complete. Re-run with --apply to perform deletions."
  exit 0
fi

echo
read -r -p "Proceed to delete the above branches? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted by user."
  exit 1
fi

echo
echo "Deleting local branches..."
for b in "${local_branches[@]:-}"; do
  [[ -z "$b" ]] && continue
  echo "- Deleting local branch $b"
  git branch -D "$b" || true
done

echo
echo "Deleting remote branches on $REMOTE..."
for b in "${remote_branches[@]:-}"; do
  [[ -z "$b" ]] && continue
  echo "- Deleting remote branch $REMOTE/$b"
  git push "$REMOTE" --delete "$b" || true
done

echo
echo "Cleanup complete. Remaining branches:"
git branch -a
