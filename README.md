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
* `npm run build` — production PWA build.
* `npm run db:migrate` — apply additive SQL migrations.

Local API transaction suite (requires started local API and database):

```sh
API_TEST_URL=http://127.0.0.1:3002 \
API_TEST_DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo \
npm test
```

Never enable development OTP or identity bypass in production. Keep `.env` private; `.env.example` contains placeholders only. `docker compose stop` preserves volumes; avoid removing volumes when local data matters.

## Production behavior and current limits

Production builds use the API-backed OTP sign-in, server offer search, transactional booking, and booking-history screen. The development build still includes the legacy demo UI. Production OTP requires a configured Twilio account and approved sender; without SMS configuration the login endpoint returns an unavailable error. Production offer creation requires a private or contracted OSRM-compatible endpoint configured through `ROUTING_ENGINE_URL`.

The production PWA does not yet include driver offer creation/garage, configured vehicle photo storage, demand negotiation, chat, GPS navigation/passive matching, partner inventory, or payments. An S3-compatible signed photo adapter exists but fails closed until a private bucket, credentials/role, and bucket CORS are configured. No staging or public deployment exists. See [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) for release gates and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for local setup.
