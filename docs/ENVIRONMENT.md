# Environment Configuration

Copy `.env.example` for local development. Never copy local development values into staging or production.

## Required production values

- `NODE_ENV=production`, a strong random `SESSION_SECRET`, explicit HTTPS `CORS_ORIGINS`.
- `DATABASE_URL` for managed PostgreSQL with PostGIS; `REDIS_URL` for managed Redis.
- `SMS_PROVIDER=twilio`, account SID, auth token and verified sender.
- `OSRM_URL` or the supported compatibility `ROUTING_ENGINE_URL`, pointing to an approved HTTPS routing endpoint.
- `GEOCODING_ENGINE_URL` and `GEOCODING_REVERSE_URL` for approved HTTPS forward/reverse geocoding, plus optional server-only `GEOCODING_API_KEY`.
- `MAP_RENDERER=maplibre`, `MAP_DATA_PROVIDER=marshgo`, `ROUTING_PRIMARY=osrm`, `TRAFFIC_PROVIDER=none`.
- HTTPS immutable `MAP_STYLE_MANIFEST_URL` and `MAP_DATA_MANIFEST_URL` hosted by MARSHGO or its contracted storage/CDN.
- `ACCOUNT_DELETION_COOLING_OFF_DAYS` may be set from 7 to 90 (default 30). This schedules only a reversible waiting phase; it does not delete data. Do not enable a purge worker until retention and backup-erasure policy is approved.
- Private object-storage credentials and Sentry/metrics configuration are needed before enabling document uploads and operating alerts; these are not currently fully wired as release services.

`AUTH_DEV_BYPASS` and `AUTH_DEV_OTP` must not be enabled in production. HERE/TomTom feature switches are rejected until server adapters and credentials are implemented. Never put provider secrets into `VITE_*`; browsers only call MARSHGO APIs. Public Nominatim/OSRM/OpenFreeMap endpoints are not SLA-backed production configuration.
