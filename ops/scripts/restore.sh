#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=ops/scripts/compose.sh
source "$(dirname "$0")/compose.sh"
require_commands

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <encrypted-backup.dump.gpg> <empty-existing-target-database>" >&2
  exit 2
fi
archive="$1"
target_database="$2"
BACKUP_KEY_FILE="${BACKUP_KEY_FILE:-$ROOT_DIR/.backup-key}"
[[ -r "$archive" ]] || { echo "Backup archive is not readable: $archive" >&2; exit 2; }
[[ -r "$BACKUP_KEY_FILE" ]] || { echo "BACKUP_KEY_FILE is not readable." >&2; exit 2; }
[[ "$target_database" =~ ^[a-zA-Z_][a-zA-Z0-9_]{0,62}$ ]] || { echo "Invalid target database name." >&2; exit 2; }

relation_count="$(compose exec -T db psql -U marshgo -d "$target_database" -Atqc \
  "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND c.relkind IN ('r','p','v','m','S','f')")"
if [[ "$relation_count" != "0" ]]; then
  echo "Refusing restore: target database '$target_database' contains $relation_count application relations. Restore is allowed only into an empty database." >&2
  exit 3
fi

echo "Restoring into verified-empty database '$target_database'; no existing application tables will be overwritten."
temporary="$(mktemp "${TMPDIR:-/tmp}/marshgo-restore.XXXXXX.dump")"
trap 'rm -f "$temporary"' EXIT
node "$ROOT_DIR/ops/scripts/backup-crypto.mjs" decrypt "$BACKUP_KEY_FILE" "$archive" "$temporary"
compose exec -T db pg_restore -U marshgo --exit-on-error --no-owner --dbname="$target_database" < "$temporary"
echo "Restore completed into '$target_database'. Run application migrations and smoke checks before changing traffic."
