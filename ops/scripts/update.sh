#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=ops/scripts/compose.sh
source "$(dirname "$0")/compose.sh"
require_commands

if [[ ! -f "$ROOT_DIR/.env.production" ]]; then echo "Missing .env.production" >&2; exit 2; fi
if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
  echo "Refusing deployment from a dirty working tree. Deploy an immutable, committed release checkout." >&2
  exit 2
fi
node "$ROOT_DIR/ops/scripts/materialize-release.mjs"
compose config --quiet
validate_production_env
validate_release_ref
MARSHGO_RELEASE_TAG="$(env_value MARSHGO_RELEASE_TAG)"
export MARSHGO_RELEASE_TAG
"$ROOT_DIR/ops/scripts/backup.sh"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
for service in api web; do
  image_id="$(compose images -q "$service" | head -n 1)"
  if [[ -n "$image_id" ]]; then docker image tag "$image_id" "marshgo/$service:rollback-$stamp"; fi
done
restore_previous_images() {
  for service in api web; do
    previous="marshgo/$service:rollback-$stamp"
    if docker image inspect "$previous" >/dev/null 2>&1; then
      docker image tag "$previous" "marshgo/$service:$MARSHGO_RELEASE_TAG"
    fi
  done
  compose up -d api web proxy
}
compose build --pull api web
if ! { compose run --rm migrate && compose up -d api web proxy; }; then
  echo "Update failed. Previous image IDs are tagged rollback-$stamp; restoring the previous app images." >&2
  restore_previous_images || true
  exit 1
fi

api_port="$(sed -n 's/^API_PORT=//p' "$ENV_FILE" | tail -n 1)"; api_port="${api_port:-3002}"
attempt=0
until curl --fail --silent "http://127.0.0.1:$api_port/readyz" >/dev/null; do
  attempt=$((attempt + 1))
  if [[ "$attempt" -ge 60 ]]; then break; fi
  sleep 2
done
if curl --fail --silent "http://127.0.0.1:$api_port/readyz" >/dev/null; then echo "Update passed API readiness."; exit 0; fi
echo "API readiness failed after update; restoring previous application images. Database migrations are forward-only and must remain backward-compatible." >&2
restore_previous_images || true
exit 1
