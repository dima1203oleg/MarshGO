# MARSHGO

MARSHGO is an existing React/Vite transport marketplace PWA being migrated from browser-only demo state to a PostgreSQL-backed API. Read [`docs/PRODUCTION_AUDIT.md`](docs/PRODUCTION_AUDIT.md) and [`docs/PRODUCTION_PROGRESS.md`](docs/PRODUCTION_PROGRESS.md) before treating any screen as production functionality.

## Local development

Requirements: Node.js 24.21.0 (see `.nvmrc`), Docker Compose, and Bun 1.3.5 for the checked-in `bun.lock`.

```sh
cp .env.example .env
# Keep AUTH_DEV_BYPASS=false unless using the isolated integration-test setup.
# AUTH_DEV_OTP=true enables a no-network OTP fixture in development only.
npx bun@1.3.5 install --frozen-lockfile
docker compose up -d db redis
npm run db:migrate
npm run api
```

In another terminal run `npm run dev`. Vite proxies `/api`, `/healthz`, and `/readyz` to `http://127.0.0.1:3002`. The API binds to loopback in local configuration.

## Commands

* `npm run typecheck` — TypeScript check (excludes generated `dist/`).
* `npm run lint` — ESLint on backend, tests, and changed UI entry points.
* `npm test` — unit tests; the API/PostGIS suite skips unless `API_TEST_URL` and a loopback `API_TEST_DATABASE_URL` are provided.
* `npm run test:e2e` — iPhone-sized Chromium browser flow against a dedicated local PostGIS database; requires Playwright Chromium, see below.
* `npm run build` — production PWA build.
* `npm run db:migrate` — apply additive SQL migrations.
* `npm run ios:sync` — build the web bundle and sync it into the Capacitor iOS target.
* `SIMULATOR_UDID=<device-udid> SIMULATOR_API_BASE_URL=http://localhost:3002 npm run ios:simulator` — build, install, launch, and capture the app on an iOS simulator (local API must be running).

Local API transaction suite (requires started local API and database):

```sh
API_TEST_URL=http://127.0.0.1:3002 \
API_TEST_DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo \
npm test
```

Browser E2E uses a separate database named `marshgo_e2e`, isolated service ports, and a local test geocoder. It seeds and removes only its UUID-scoped fixtures. Run after starting the local Compose database:

```sh
export E2E_DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e
E2E_DATABASE_URL="$E2E_DATABASE_URL" npx tsx scripts/ensure-e2e-database.ts
DATABASE_URL="$E2E_DATABASE_URL" npm run db:migrate
npx playwright install chromium
npm run build
npm run test:e2e
```

This test exercises server-backed sign-up, geocoded search, two-seat booking, inventory visibility and persisted booking chat using two isolated browser contexts. OTP and geocoder are local test adapters; this is not a staging, real-SMS, production-provider, or physical-device test.

Never enable development OTP or identity bypass in production. Keep `.env` private; `.env.example` contains placeholders only. `docker compose stop` preserves volumes; avoid removing volumes when local data matters.

## Production behavior and current limits

Production builds use the API-backed OTP sign-in, server offer search, transactional booking, and booking-history screen. The development build still includes the legacy demo UI. Production OTP requires a configured Twilio account and approved sender; without SMS configuration the login endpoint returns an unavailable error. Production offer creation requires a private or contracted OSRM-compatible endpoint configured through `ROUTING_ENGINE_URL`.

The production PWA now includes server-backed driver/garage, demand negotiation, booking chat, and foreground GPS/passive matching flows. These depend on real SMS, private object storage, geocoding, and routing providers, which are not configured. Partner inventory, payment processing, realtime push/WebSockets, staging, and public deployment remain unavailable. See [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) for release gates and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for local setup.

An iOS Capacitor target now packages the same API-backed production UI. See [`docs/IOS.md`](docs/IOS.md) for simulator setup and native release limitations; App Store signing and physical-device validation have not been completed.
