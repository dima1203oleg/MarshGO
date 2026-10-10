#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=ops/scripts/compose.sh
source "$(dirname "$0")/compose.sh"
require_commands

BACKUP_KEY_FILE="${BACKUP_KEY_FILE:-$(sed -n 's/^BACKUP_KEY_FILE=//p' "$ENV_FILE" | tail -n 1)}"
BACKUP_KEY_FILE="${BACKUP_KEY_FILE:-$ROOT_DIR/.backup-key}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
BACKUP_DATABASE="${BACKUP_DATABASE:-$(sed -n 's/^BACKUP_DATABASE=//p' "$ENV_FILE" | tail -n 1)}"
BACKUP_DATABASE="${BACKUP_DATABASE:-marshgo}"
if [[ ! -r "$BACKUP_KEY_FILE" ]]; then
  echo "BACKUP_KEY_FILE must point to a readable, separately protected GPG passphrase file." >&2
  exit 2
fi
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="$BACKUP_DIR/marshgo-postgres-$stamp.dump.gpg"
temporary="$archive.tmp"
trap 'rm -f "$temporary"' EXIT

compose exec -T db pg_dump -U marshgo -d "$BACKUP_DATABASE" -Fc \
  | node "$ROOT_DIR/ops/scripts/backup-crypto.mjs" encrypt "$BACKUP_KEY_FILE" - "$temporary"
chmod 600 "$temporary"
mv "$temporary" "$archive"
trap - EXIT
echo "Encrypted PostgreSQL backup created: $archive"
