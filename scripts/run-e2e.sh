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
node ops/scripts/materialize-release.mjs
SERVER_SHA="$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync("RELEASE_MANIFEST.json","utf8")).server_sha)')"
export E2E_SERVER_DIR="$PWD/.release/server-${SERVER_SHA}"
if [[ ! -f "$E2E_SERVER_DIR/node_modules/.package-lock.json" ]]; then
  npm ci --prefix "$E2E_SERVER_DIR" --no-audit --no-fund
fi
npm run db:migrate --prefix "$E2E_SERVER_DIR"
node scripts/reset-e2e-otp.ts
if [[ -n "${E2E_DIST_DIR:-}" ]]; then
  if [[ ! -d "$E2E_DIST_DIR/assets" || ! -f "$E2E_DIST_DIR/index.html" ]]; then
    echo "E2E_DIST_DIR must point to a built Site/PWA directory with index.html and assets/." >&2
    exit 2
  fi
else
  node scripts/build-pwa.mjs
  SITE_SHA="$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync("RELEASE_MANIFEST.json","utf8")).site_sha)')"
  export E2E_DIST_DIR="$PWD/.release/site-${SITE_SHA}/dist"
fi
playwright test "$@"
