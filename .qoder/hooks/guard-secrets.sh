#!/usr/bin/env bash
# MARSHGO safety hook: stop private keys and live credentials from being written into the repository.
# Contract: PreToolUse(Write|Edit) JSON on stdin; exit 2 blocks the write.
set -uo pipefail

input=$(cat)
payload=$(printf '%s' "$input" | jq -r '.tool_input.content // .tool_input.new_string // ""' 2>/dev/null || true)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null || true)

[ -n "$payload" ] || exit 0

# The hook's own guard/test files must be able to carry the patterns they detect.
case "$path" in
  */.qoder/hooks/*) exit 0 ;;
esac

deny() {
  printf 'MARSHGO secret guard blocked writing %s: %s\nUse a local untracked file or an environment variable instead.\n' "${path:-<unknown>}" "$1" >&2
  exit 2
}

case "$payload" in
  *"BEGIN RSA PRIVATE KEY"*|*"BEGIN OPENSSH PRIVATE KEY"*|*"BEGIN EC PRIVATE KEY"*|*"BEGIN PRIVATE KEY"*)
    deny "embedded private key" ;;
  *"xoxb-"*|*"xoxp-"*) deny "Slack token" ;;
  *"ghp_"*|*"github_pat_"*) deny "GitHub token" ;;
  *"AKIA"*) deny "AWS access key id" ;;
esac

exit 0
