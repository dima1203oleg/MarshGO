#!/usr/bin/env bash
# PostToolUse hook: selective lint for MarshGO-Site source edits.
# Contract: never writes or edits files (no self-triggering loop), always exits 0,
# never runs npm test / build / vite / Playwright (8 GB Mac, one heavy process).
# Fires only for TypeScript/TSX files under MarshGO-Site/src/.
SITE="/Users/dima1203/Desktop/MarshGO/MarshGO-Site"
INPUT="$(cat)"
PATH_OF_FILE="$(printf '%s' "$INPUT" | /usr/bin/jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)"

case "$PATH_OF_FILE" in
  *"$SITE/src/"*.ts|*"$SITE/src/"*.tsx) ;;
  *) exit 0 ;;
esac

cd "$SITE" 2>/dev/null || exit 0
# 15 s ceiling; macOS has no timeout(1), so use perl's alarm.
OUT="$(/usr/bin/perl -e 'alarm 15; exec @ARGV' ./node_modules/.bin/eslint --no-warn-ignored "$PATH_OF_FILE" 2>&1)"
CODE=$?

if [ $CODE -eq 124 ]; then
  echo "[hook:site-lint] eslint timed out after 15 s for $PATH_OF_FILE — not blocking." >&2
elif [ -n "$OUT" ]; then
  echo "[hook:site-lint] eslint reported (exit $CODE), advisory only:" >&2
  printf '%s\n' "$OUT" | head -40 >&2
fi
exit 0
