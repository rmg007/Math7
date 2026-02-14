#!/usr/bin/env bash
set -euo pipefail

# merge-all-branches.sh
# Merge every non-main branch into main locally, then push.
# Defaults to dry-run. Use --apply to perform merges/push. Strategy: normal|ours|theirs
# Default strategy is 'ours' to keep main authoritative.
# Example:
#   ./scripts/merge-all-branches.sh --apply --strategy ours

DRY_RUN=true
STRATEGY="ours"
REMOTE="${GIT_REMOTE:-origin}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)
      DRY_RUN=false
      shift
      ;;
    --strategy)
      STRATEGY="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" && exit 1
      ;;
  esac
done

echo "Remote   : $REMOTE"
echo "Mode     : $([[ "$DRY_RUN" == true ]] && echo DRY-RUN || echo APPLY)"
echo "Strategy : $STRATEGY"

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
  echo "Switching to main..."
  git checkout main
fi

echo "Fetching all..."
git fetch --all --prune

mapfile -t remote_branches < <(git for-each-ref --format='%(refname:short)' "refs/remotes/$REMOTE/" | sed "s|$REMOTE/||" | grep -v '^main$' || true)

echo "Branches to merge into main:"
printf '%s\n' "${remote_branches[@]:-}"

if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run complete. Re-run with --apply to perform merges."
  exit 0
fi

for br in "${remote_branches[@]:-}"; do
  [[ -z "$br" ]] && continue
  echo "\n== Merging $br into main =="
  git fetch "$REMOTE" "$br:$br" || true
  case "$STRATEGY" in
    normal)
      if ! git merge --no-ff -m "Merge branch '$br' into main" "$br"; then
        echo "Conflict merging $br. Aborting merge and continuing."
        git merge --abort || true
      fi
      ;;
    ours)
      if ! git merge -s ours -m "Merge (ours) branch '$br' into main" "$br"; then
        echo "Conflict merging $br (ours). Aborting merge and continuing."
        git merge --abort || true
      fi
      ;;
    theirs)
      if ! git merge -X theirs -m "Merge (theirs) branch '$br' into main" "$br"; then
        echo "Conflict merging $br (theirs). Aborting merge and continuing."
        git merge --abort || true
      fi
      ;;
    *)
      echo "Unknown strategy: $STRATEGY" && exit 1
      ;;
  esac
done

echo "\nPushing main..."
git push "$REMOTE" main
echo "Done."
