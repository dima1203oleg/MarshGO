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

# --- post-edit-site-lint.sh: advisory only, must never block (always exit 0) ---
rc "$H/post-edit-site-lint.sh" '{"tool_input":{"file_path":"/tmp/elsewhere.ts"}}' "expect 0: path outside MarshGO-Site/src is ignored"
rc "$H/post-edit-site-lint.sh" '{"tool_input":{"file_path":"/Users/dima1203/Desktop/MarshGO/MarshGO-Site/src/notThere.tsx"}}' "expect 0: missing file still non-blocking"
rc "$H/post-edit-site-lint.sh" '{"tool_input":{"file_path":"/Users/dima1203/Desktop/MarshGO/MarshGO-Site/src/views/HomeView.tsx"}}' "expect 0: clean real file"
NEG=/Users/dima1203/Desktop/MarshGO/MarshGO-Site/src/hookNegativeProbe.ts
printf 'export const p = () => {\n  debugger\n  return 1\n}\n' >"$NEG"
rc "$H/post-edit-site-lint.sh" "{\"tool_input\":{\"file_path\":\"$NEG\"}}" "expect 0 with eslint no-debugger reported on stderr (negative control)"
rm -f "$NEG"

# --- log-failing-bash.sh: records evidence, never the command text ---
BEFORE=$(wc -l <"$H/failures.log" 2>/dev/null || echo 0)
rc "$H/log-failing-bash.sh" '{"session_id":"ffffffff-0000","tool_name":"Bash","cwd":"/tmp","tool_input":{"command":"curl -H token=SUPERSECRETVALUE"},"error":"exit 1"}' "expect 0: failure logged"
AFTER=$(wc -l <"$H/failures.log")
echo "log grew by $((AFTER - BEFORE)) line(s) :: expect 1"
if grep -q "SUPERSECRETVALUE" "$H/failures.log"; then echo "FAIL: secret leaked into failures.log"; else echo "PASS: command text not stored, only cksum"; fi

