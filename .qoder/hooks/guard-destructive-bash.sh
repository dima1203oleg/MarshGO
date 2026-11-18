#!/usr/bin/env bash
# MARSHGO safety hook: block irreversible repository, data and shell operations.
# Contract: PreToolUse(Bash) JSON on stdin; exit 2 blocks and returns stderr to the agent.
set -uo pipefail

input=$(cat)
command=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null || true)

if [ -z "$command" ]; then
  exit 0
fi

# Normalise whitespace so multi-line or padded commands cannot slip through.
flat=$(printf '%s' "$command" | tr '\n\r\t' '   ' | tr -s ' ')

deny() {
  printf 'MARSHGO safety hook blocked this command: %s\nRule: %s\nSee AGENTS.md — never rewrite history, discard dirty files, or destroy data without owner approval.\n' "$flat" "$1" >&2
  exit 2
}

# Match a pattern against the normalised command.
hits() { printf '%s' "$flat" | grep -Eiq -- "$1"; }

hits 'git[[:space:]]+reset[[:space:]]+--(hard|merge)' && deny "no hard reset"
hits 'git[[:space:]]+clean[[:space:]]+(-[a-z]*f[a-z]*|--force)' && deny "no forced clean"
hits 'git[[:space:]]+push([[:space:]]+[^|;&]*)?[[:space:]](--force(-with-lease)?|-f)([[:space:]]|$)' && deny "no force push"
hits 'git[[:space:]]+(checkout|restore)[[:space:]]+(--[[:space:]]+)?(\.|/|\./)$' && deny "do not discard working-tree changes"
hits 'git[[:space:]]+(checkout|restore)[[:space:]]+--[[:space:]]+\S' && deny "do not discard working-tree changes"
hits 'git[[:space:]]+branch[[:space:]]+(-D|--delete[[:space:]]+--force)' && deny "do not delete branches"
hits 'git[[:space:]]+worktree[[:space:]]+remove[[:space:]]+[^|;&]*--force' && deny "do not force-remove worktrees"
hits 'git[[:space:]]+(filter-branch|rebase[[:space:]]+-i)' && deny "no history rewrite"
hits 'rm[[:space:]]+(-[a-z]*r[a-z]*[[:space:]]+)+(-[a-z]*f[a-z]*[[:space:]]+)*(/|~|\$HOME)([[:space:]]|$)' && deny "no recursive deletion of root or home"
hits 'rm[[:space:]]+(-[a-z]*r[a-z]*[[:space:]]+)+(-[a-z]*f[a-z]*[[:space:]]+)*(\.|\.\.)/?([[:space:]]|$|\*)' && deny "no recursive deletion of the working tree"
hits 'rm[[:space:]]+(-[a-z]*r[a-z]*f?[a-z]*[[:space:]])+/Users/dima1203/Desktop[[:space:]]*$' && deny "no recursive deletion of the workspace parent"
hits 'docker(-| )compose[[:space:]]+down[^|;&]*[[:space:]]-v' && deny "keep named volumes; they hold PostgreSQL/Redis state"
hits 'docker[[:space:]]+volume[[:space:]]+(rm|prune)' && deny "do not delete data volumes"
hits 'drop[[:space:]]+(database|schema)' && deny "no database or schema destruction"
hits 'truncate[[:space:]]+table' && deny "no mass data deletion"
hits '(curl|wget)[^|;&]*\|[[:space:]]*(sudo[[:space:]]+)?(sh|bash)([[:space:]]|$)' && deny "no piping remote scripts into a shell"
hits 'chmod[[:space:]]+-R[[:space:]]+777[[:space:]]+/([[:space:]]|$)' && deny "no world-writable recursive chmod on root"

exit 0
