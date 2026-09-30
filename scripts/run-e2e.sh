#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${E2E_DATABASE_URL:-postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e}"
DATABASE_HOST="$(node -e 'process.stdout.write(new URL(process.argv[1]).hostname)' "$DATABASE_URL")"
DATABASE_NAME="$(node -e 'process.stdout.write(new URL(process.argv[1]).pathname.slice(1))' "$DATABASE_URL")"
if [[ ! "$DATABASE_HOST" =~ ^(127\.0\.0\.1|localhost|::1)$ || ! "$DATABASE_NAME" =~ ^marshgo_e2e(_[a-z0-9_]+)?$ ]]; then
  echo "Refusing E2E setup outside a loopback marshgo_e2e-prefixed database." >&2
  exit 2
fi

export E2E_DATABASE_URL="$DATABASE_URL"
export DATABASE_URL
node scripts/ensure-e2e-database.ts
npm run db:migrate
node scripts/reset-e2e-otp.ts
node scripts/build-pwa.mjs
playwright test "$@"
