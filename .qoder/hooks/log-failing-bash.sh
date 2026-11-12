#!/usr/bin/env bash
# PostToolUseFailure hook: append a failing tool call to .qoder/hooks/failures.log.
# Evidence for gates and for the release auditor. Never blocks, always exits 0.
# Privacy: the command text is hashed, not stored — a failing command can contain a
# credential, and this log lives inside the repository.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$DIR/failures.log"
INPUT="$(cat)"

SESSION="$(printf '%s' "$INPUT" | /usr/bin/jq -r '.session_id // "unknown"' 2>/dev/null)"
TOOL="$(printf '%s' "$INPUT" | /usr/bin/jq -r '.tool_name // "unknown"' 2>/dev/null)"
CWD="$(printf '%s' "$INPUT" | /usr/bin/jq -r '.cwd // "unknown"' 2>/dev/null)"
ERR="$(printf '%s' "$INPUT" | /usr/bin/jq -r '(.tool_response.error_message // .error // .tool_input.description // "no-error-field")' 2>/dev/null | tr -d '\n' | cut -c1-180)"
SUMMARY="$(printf '%s' "$INPUT" | /usr/bin/jq -r '.tool_input | tostring' 2>/dev/null | cksum | cut -d' ' -f1)"

printf '%s\t%s\ttool=%s\tcwd=%s\tinput_cksum=%s\terror=%s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${SESSION:0:8}" "$TOOL" "$CWD" "$SUMMARY" "$ERR" >>"$LOG"
exit 0
