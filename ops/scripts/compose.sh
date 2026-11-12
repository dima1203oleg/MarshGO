#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${MARSHGO_ENV_FILE:-$ROOT_DIR/.env.production}"
PROJECT_NAME="${MARSHGO_PROJECT_NAME:-marshgo}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE (copy ops/templates/production.env.example and fill required values)." >&2
  exit 2
fi

compose() {
  local compose_file="$ROOT_DIR/compose.production.yml"
  if [[ -f "$ROOT_DIR/.release/compose.production.yml" ]]; then compose_file="$ROOT_DIR/.release/compose.production.yml"; fi
  docker compose --project-name "$PROJECT_NAME" --env-file "$ENV_FILE" -f "$compose_file" "$@"
}

require_commands() {
  for command_name in docker curl git node; do
    command -v "$command_name" >/dev/null 2>&1 || { echo "Missing prerequisite: $command_name" >&2; exit 2; }
  done
  docker compose version >/dev/null
}

env_value() {
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1 | sed -e 's/^"//' -e 's/"$//'
}

validate_production_env() {
  local name value domain secret_file
  local required=(APP_DOMAIN POSTGRES_PASSWORD REDIS_PASSWORD SESSION_SECRET TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_FROM_NUMBER OSRM_URL GEOCODING_ENGINE_URL GEOCODING_REVERSE_URL MAP_STYLE_MANIFEST_URL MAP_DATA_MANIFEST_URL VITE_MAP_STYLE_MANIFEST_URL S3_BUCKET S3_REGION)
  for name in "${required[@]}"; do
    value="$(env_value "$name")"
    if [[ -z "$value" || "$value" == *replace-* || "$value" == *example.com* || "$value" == *example.invalid* || "$value" == *\.invalid* ]]; then
      echo "$name is unset or still contains an example placeholder." >&2
      return 2
    fi
  done
  domain="$(env_value APP_DOMAIN)"
  if [[ ! "$domain" =~ ^[A-Za-z0-9.-]+$ || "$domain" == *localhost* || "$domain" == *.test || "$domain" == *.invalid || "$domain" == *.example ]]; then echo "APP_DOMAIN must be a public DNS name." >&2; return 2; fi
  for secret in POSTGRES_PASSWORD REDIS_PASSWORD SESSION_SECRET TWILIO_AUTH_TOKEN; do
    value="$(env_value "$secret")"
    if (( ${#value} < 32 )); then echo "$secret must contain at least 32 characters." >&2; return 2; fi
  done
  for name in OSRM_URL GEOCODING_ENGINE_URL GEOCODING_REVERSE_URL MAP_STYLE_MANIFEST_URL MAP_DATA_MANIFEST_URL VITE_MAP_STYLE_MANIFEST_URL; do
    value="$(env_value "$name")"
    if [[ "$value" != https://* || "$value" != *.* ]]; then echo "$name must be an HTTPS provider URL." >&2; return 2; fi
  done
  secret_file="${BACKUP_KEY_FILE:-$(env_value BACKUP_KEY_FILE)}"
  secret_file="${secret_file:-$ROOT_DIR/.backup-key}"
  if [[ ! -r "$secret_file" ]]; then echo "Backup encryption key file is missing or unreadable: $secret_file" >&2; return 2; fi
}

validate_release_ref() {
  local release_tag tag_commit head_commit
  release_tag="$(env_value MARSHGO_RELEASE_TAG)"
  if [[ ! "$release_tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([.-][A-Za-z0-9.-]+)?$ ]]; then
    echo "MARSHGO_RELEASE_TAG must be an immutable semantic version tag (for example v1.2.3)." >&2
    return 2
  fi
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
    echo "Refusing deployment from a dirty checkout." >&2
    return 2
  fi
  if ! git -C "$ROOT_DIR" rev-parse --verify "refs/tags/$release_tag^{commit}" >/dev/null 2>&1; then
    echo "Release tag $release_tag is not present in this checkout." >&2
    return 2
  fi
  tag_commit="$(git -C "$ROOT_DIR" rev-parse "refs/tags/$release_tag^{commit}")"
  head_commit="$(git -C "$ROOT_DIR" rev-parse HEAD)"
  if [[ "$tag_commit" != "$head_commit" ]]; then
    echo "Release tag $release_tag must point to the checked-out integration commit." >&2
    return 2
  fi
}
