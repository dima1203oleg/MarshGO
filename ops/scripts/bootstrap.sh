#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=ops/scripts/compose.sh
source "$(dirname "$0")/compose.sh"
require_commands

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Create $ENV_FILE from ops/templates/production.env.example and provide all required production configuration." >&2
  exit 2
fi
node "$ROOT_DIR/ops/scripts/materialize-release.mjs"
compose config --quiet
validate_production_env
validate_release_ref
compose pull db redis proxy
compose build --pull api web
compose up -d db redis
compose run --rm migrate
compose up -d api web proxy

api_port="$(sed -n 's/^API_PORT=//p' "$ENV_FILE" | tail -n 1)"
api_port="${api_port:-3002}"
for attempt in $(seq 1 60); do
  if curl --fail --silent "http://127.0.0.1:$api_port/readyz" >/dev/null; then
    echo "API readiness passed."
    break
  fi
  if [[ "$attempt" -eq 60 ]]; then echo "API readiness failed after 60 attempts." >&2; compose ps; exit 1; fi
  sleep 2
done

echo "Bootstrap complete. Verify HTTPS app/API routing and run the staging smoke suite before enabling users."
