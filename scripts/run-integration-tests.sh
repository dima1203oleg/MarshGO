#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${API_TEST_DATABASE_URL:-${E2E_DATABASE_URL:-postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e}}"
DATABASE_HOST="$(node -e 'process.stdout.write(new URL(process.argv[1]).hostname)' "$DATABASE_URL")"
DATABASE_NAME="$(node -e 'process.stdout.write(new URL(process.argv[1]).pathname)' "$DATABASE_URL")"
if [[ ! "$DATABASE_HOST" =~ ^(127\.0\.0\.1|localhost|::1)$ || ! "$DATABASE_NAME" =~ ^/marshgo_e2e(_[a-z0-9_]+)?$ ]]; then
  echo "Refusing integration tests outside loopback marshgo_e2e-prefixed database." >&2
  exit 2
fi
SERVER_SHA="$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync("RELEASE_MANIFEST.json","utf8")).server_sha)')"
if [[ ! "$SERVER_SHA" =~ ^[a-f0-9]{40}$ ]]; then
  echo "Integration tests require an immutable canonical Server SHA." >&2
  exit 2
fi
export E2E_SERVER_DIR="$PWD/.release/server-${SERVER_SHA}"
export E2E_SERVER_PINNED_SHA="$SERVER_SHA"
export API_TEST_DATABASE_URL="$DATABASE_URL"
node ops/scripts/materialize-release.mjs
node scripts/run-e2e-server.mjs --preflight
if [[ ! -f "$E2E_SERVER_DIR/node_modules/.package-lock.json" ]]; then
  npm ci --prefix "$E2E_SERVER_DIR" --no-audit --no-fund
fi
npm run test:integration --prefix "$E2E_SERVER_DIR"
