#!/usr/bin/env bash
set -euo pipefail

# Keep the browser suite from colliding with a local API preview. Preserve the
# familiar port when it is free; if another service owns it, ask the OS for an
# unused loopback port. An explicitly supplied E2E_API_PORT is always respected.
if [[ -z "${E2E_API_PORT:-}" ]]; then
  E2E_API_PORT="$(node -e '
    const net = require("node:net");
    const probe = net.createServer();
    probe.once("error", (error) => {
      if (error.code !== "EADDRINUSE") { console.error(error.message); process.exit(1); }
      const fallback = net.createServer();
      fallback.once("error", (fallbackError) => { console.error(fallbackError.message); process.exit(1); });
      fallback.listen(0, "127.0.0.1", () => {
        const address = fallback.address();
        if (!address || typeof address === "string") { console.error("Could not allocate E2E API port"); process.exit(1); }
        console.log(address.port);
        fallback.close();
      });
    });
    probe.listen(3302, "127.0.0.1", () => {
      console.log(3302);
      probe.close();
    });
  ')"
  export E2E_API_PORT
  if [[ "$E2E_API_PORT" != "3302" ]]; then
    echo "E2E API port 3302 is occupied; using isolated port $E2E_API_PORT."
  fi
fi

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
if [[ -z "${E2E_SERVER_DIR:-}" ]]; then
  export E2E_SERVER_DIR="$PWD/.release/server-${SERVER_SHA}"
  export E2E_SERVER_PINNED_SHA="$SERVER_SHA"
else
  unset E2E_SERVER_PINNED_SHA
fi
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
