#!/usr/bin/env bash
# MARSHGO safety hook: never write to main/master or codex/* directly.
# Allowed: read-only git commands anywhere; commits/pushes on qoder/*, feature/*, fix/*, docs/*.
set -uo pipefail

input=$(cat)
command=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null || true)
cwd=$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null || true)

[ -n "$command" ] || exit 0

# Only mutating git commands matter.
case "$command" in
  *"git commit"*|*"git push"*|*"git merge"*|*"git cherry-pick"*|*"git revert"*) ;;
  *) exit 0 ;;
esac

# Reject explicit pushes at protected refs regardless of the local branch.
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+push[^|;&]*[[:space:]](main|master|codex/[^[:space:]]*)([[:space:]]|$)'; then
  printf 'MARSHGO branch guard blocked a push to a protected ref: %s\n' "$command" >&2
  exit 2
fi

# A command may operate in another directory (worktree); honour its leading cd.
repo="$cwd"
target=$(printf '%s' "$command" | sed -nE 's/^[[:space:]]*cd[[:space:]]+"([^"]*)".*/\1/p' | head -1)
[ -n "$target" ] || target=$(printf '%s' "$command" | sed -nE 's/^[[:space:]]*cd[[:space:]]+([^&|;[:space:]]*).*/\1/p' | head -1)
if [ -n "$target" ]; then
  case "$target" in
    /*) repo="$target" ;;
    *) repo="$cwd/$target" ;;
  esac
fi
[ -d "$repo" ] || repo="$cwd"

branch=$(git -C "$repo" symbolic-ref --quiet --short HEAD 2>/dev/null \
  || git -C "$repo" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
case "$branch" in
  main|master|codex/*)
    printf 'MARSHGO branch guard blocked a write on protected branch "%s" in %s: %s\nCreate a qoder/* branch or worktree first (AGENTS.md).\n' "$branch" "$repo" "$command" >&2
    exit 2 ;;
esac

exit 0
