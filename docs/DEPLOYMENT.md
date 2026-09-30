# Deployment

## Current status

There is no production/staging target configured in this repository or local environment. `docker-compose.yml` is loopback-only PostgreSQL/PostGIS and Redis for development/integration. Do not treat it, Vite preview, or localhost as staging/production. No production deploy was attempted because no host/domain/credentials or secret manager is available.

Production-ready multi-stage API/web Dockerfiles and `compose.production.yml` now define non-root API/web containers, PostgreSQL/PostGIS and password-protected Redis with persistent volumes, one-shot migrations before API startup, and Caddy-managed HTTPS. Compose refuses to render without explicit production configuration. Image builds and compose interpolation are validated separately; no production service was started against placeholder credentials.

## Release sequence

1. Provision HTTPS web/API origins, secret storage, private encrypted object storage, managed PostgreSQL with PostGIS, and managed Redis.
2. Configure and verify contracted routing/geocoding providers and immutable MARSHGO style/data manifests.
3. Build the web and API images from the same commit and retain image digests.
4. Run migrations as a single pre-deploy job; check backward compatibility with the currently deployed API.
5. Deploy API instances behind TLS; verify `/healthz`, `/readyz`, provider checks, and WebSocket upgrade through the public proxy.
6. Deploy static web assets with immutable cache headers and SPA fallback. Keep API and websocket traffic on the configured HTTPS origin.
7. Run authenticated staging browser tests with two independent accounts, physical iPhone acceptance, backup restore, Redis restart, and rollback rehearsal.
8. Shift traffic gradually; monitor 5xx, latency, routing/geocoding errors, outbox age, websocket reconnects, and GPS freshness. Roll back the app image if health or critical flows regress; migrations must use expand/migrate/contract compatibility.

## Release safety

- Production startup fails closed for auth, SMS, URL, map-manifest and provider configuration.
- Never run test cleanup or destructive migrations against a non-loopback database.
- Keep database backups encrypted and test restore plus post-restore deletion processing.
- No production deployment or production smoke test is evidenced in this workspace. Track it as `BLOCKED_EXTERNAL` until infrastructure and credentials exist.
