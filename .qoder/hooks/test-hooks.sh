#!/usr/bin/env bash
# Harmless test harness for the MARSHGO Qoder hooks.
# Invoke it as a script: an interactive command carrying these payloads would trip the live guards.
set -uo pipefail
H=/Users/dima1203/Desktop/MarshGO/.qoder/hooks
ROOT=/Users/dima1203/Desktop/MarshGO
rc() { bash "$1" >/dev/null 2>&1 <<<"$2"; echo "exit=$? :: $3"; }

mkdir -p /tmp/hookprobe2 && cd /tmp/hookprobe2 && { [ -d .git ] || git init -q -b main .; }
cd "$ROOT"

rc "$H/guard-protected-branch.sh" "{\"cwd\":\"$ROOT\",\"tool_input\":{\"command\":\"cd /tmp/hookprobe2 && git commit -m x\"}}" "expect 2: commit in a repo whose branch is main"
rc "$H/guard-protected-branch.sh" "{\"cwd\":\"$ROOT\",\"tool_input\":{\"command\":\"git commit -m x\"}}" "expect 0: commit on the current qoder/* branch"
rc "$H/guard-protected-branch.sh" "{\"cwd\":\"$ROOT\",\"tool_input\":{\"command\":\"git push origin main\"}}" "expect 2: push at main"
rc "$H/guard-protected-branch.sh" "{\"cwd\":\"$ROOT\",\"tool_input\":{\"command\":\"git push -u origin qoder/cash-fare-api-1\"}}" "expect 0: push a qoder/* branch"
rc "$H/guard-protected-branch.sh" "{\"cwd\":\"/Users/dima1203/Desktop/MarshGO\",\"tool_input\":{\"command\":\"cd \\\"$ROOT/MarshGO-Server\\\" && git commit -m x\"}}" "expect 0: commit in a quoted worktree path on qoder/*"
rc "$H/guard-protected-branch.sh" "{\"cwd\":\"$ROOT\",\"tool_input\":{\"command\":\"cd /tmp/hookprobe2; git commit -m x\"}}" "expect 2: commit after cd with a semicolon separator"
rc "$H/guard-destructive-bash.sh" "{\"tool_input\":{\"command\":\"git reset --hard HEAD\"}}" "expect 2: hard reset"
rc "$H/guard-destructive-bash.sh" "{\"tool_input\":{\"command\":\"git clean -fd\"}}" "expect 2: forced clean"
rc "$H/guard-destructive-bash.sh" "{\"tool_input\":{\"command\":\"git clean -nd\"}}" "expect 0: dry-run clean"
rc "$H/guard-destructive-bash.sh" "{\"tool_input\":{\"command\":\"npm test 2>&1 | tail -5\"}}" "expect 0: ordinary test run"
rc "$H/guard-secrets.sh" "{\"tool_input\":{\"file_path\":\"x.ts\",\"content\":\"const answer = 42;\"}}" "expect 0: benign write"
rc "$H/guard-secrets.sh" "{\"tool_input\":{\"file_path\":\"k.pem\",\"content\":\"-----BEGIN OPENSSH PRIVATE KEY-----\"}}" "expect 2: private key"
