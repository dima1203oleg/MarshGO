#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${API_TEST_DATABASE_URL:-${E2E_DATABASE_URL:-postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e}}"
DATABASE_HOST="$(node -e 'process.stdout.write(new URL(process.argv[1]).hostname)' "$DATABASE_URL")"
DATABASE_NAME="$(node -e 'process.stdout.write(new URL(process.argv[1]).pathname)' "$DATABASE_URL")"
if [[ ! "$DATABASE_HOST" =~ ^(127\.0\.0\.1|localhost|::1)$ || "$DATABASE_NAME" != "/marshgo_e2e" ]]; then
  echo "Refusing integration tests outside loopback marshgo_e2e database." >&2
  exit 2
fi

API_PORT="${API_TEST_PORT:-3306}"
API_URL="http://127.0.0.1:${API_PORT}"
API_PID=""
OSRM_PID=""
cleanup() {
  if [[ -n "$API_PID" ]]; then kill "$API_PID" 2>/dev/null || true; wait "$API_PID" 2>/dev/null || true; fi
  if [[ -n "$OSRM_PID" ]]; then kill "$OSRM_PID" 2>/dev/null || true; wait "$OSRM_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

start_api() {
  local routing_url="${1:-}"
  env NODE_ENV=development AUTH_DEV_BYPASS=true AUTH_DEV_OTP=true \
    DATABASE_URL="$DATABASE_URL" API_HOST=127.0.0.1 API_PORT="$API_PORT" \
    ROUTING_ENGINE_URL="$routing_url" ./node_modules/.bin/tsx server/index.ts &
  API_PID=$!
  for _ in $(seq 1 60); do
    if curl --fail --silent "$API_URL/healthz" >/dev/null; then return 0; fi
    if ! kill -0 "$API_PID" 2>/dev/null; then wait "$API_PID"; return 1; fi
    sleep 1
  done
  echo "API did not become healthy at $API_URL." >&2
  return 1
}
stop_api() {
  kill "$API_PID" 2>/dev/null || true
  wait "$API_PID" 2>/dev/null || true
  API_PID=""
}

start_api
API_TEST_URL="$API_URL" API_TEST_DATABASE_URL="$DATABASE_URL" \
  npm run test:integration:bookings
stop_api

OSRM_STUB_PORT=3304 node tests/fixtures/osrm-stub.mjs &
OSRM_PID=$!
start_api "http://127.0.0.1:3304/route/v1/driving"
API_TEST_URL="$API_URL" API_TEST_DATABASE_URL="$DATABASE_URL" API_TEST_NAVIGATION=true \
  npm run test:integration:navigation
