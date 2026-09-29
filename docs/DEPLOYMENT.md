# Deployment runbook (local foundation only)

## Local database and cache

1. Copy `.env.example` to `.env`; replace the local sample password.
2. Start only local dependencies: `docker compose up -d db redis`.
3. Apply additive migrations: `npm run db:migrate`.
4. Start the API in a second terminal: `npm run api`.
5. Check `curl http://127.0.0.1:3002/readyz`.

The API binds to loopback by default. Set `API_HOST` explicitly for a private container/network binding in a deployment; do not expose the development bypass on a public interface.

The compose ports bind to loopback. Volumes persist across container restarts. Do not use `docker compose down -v` if you need to retain local data.

## Production status

There is no production deployment target configured. Do not deploy this build as a public app: its demo client is intentionally disabled in production, and real account creation, session issuance, offer publication, and client-to-API integration remain unfinished. Before staging, choose a host and domain, provision private PostgreSQL/PostGIS and Redis, configure a real SMS provider, TLS, secrets, backups, monitoring, and a tested rollback process. Apply migrations only to a reviewed staging database first.

No public deployment or production database operation has been performed.
