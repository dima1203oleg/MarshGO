# Deployment runbook (local foundation only)

## Local database and cache

1. Copy `.env.example` to `.env`; replace the local sample password.
2. Start only local dependencies: `docker compose up -d db redis`.
3. Apply additive migrations: `npm run db:migrate`.
4. Start the API in a second terminal: `npm run api`.
5. Check `curl http://127.0.0.1:3002/readyz`.
6. Start the PWA with `npm run dev`; Vite proxies `/api`, `/healthz`, and `/readyz` to the local API.

The API binds to loopback by default. Set `API_HOST` explicitly for a private container/network binding in a deployment; do not expose the development bypass on a public interface.

The compose ports bind to loopback. Volumes persist across container restarts. Do not use `docker compose down -v` if you need to retain local data.

## Production status

There is no production deployment target configured. The production client supports phone OTP login, server search, booking, and passenger booking history. Real SMS is unavailable until Twilio account/sender credentials are configured. Driver publishing/garage UI, configured private S3-compatible storage and bucket CORS, verification review, demand negotiation UI, chat, GPS navigation/matching, partner integrations, CI deployment, TLS/domain, backups/restore, monitoring, and rollback remain unfinished. Before staging, choose a host and domain, provision private PostgreSQL/PostGIS and Redis, configure secrets, SMS, S3, and routing, and validate same-site HTTPS routing for the API refresh cookie. Apply migrations only to a reviewed staging database first.

No public deployment or production database operation has been performed.
