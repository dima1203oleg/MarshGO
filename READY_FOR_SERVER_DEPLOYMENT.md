# Server deployment readiness — 2026-10-01

**READY_FOR_SERVER_DEPLOYMENT = NO**

Deployment assets now include production Compose, Caddy HTTPS routing for the app and `api.<domain>`, loopback-only API health port, environment template, bootstrap/update scripts, pinned canonical Server/Site materialization from the release manifest, Dockerfiles built from those canonical contexts, authenticated encrypted backup format, empty-target restore guard, and a self-hosted deployment/rollback guide. Production Compose parsing and canonical Server/Site image builds passed. Local app/source gates also passed.

The software is not yet ready for a server handoff because:

1. Pinned Server/Site source materialization and canonical Docker build contexts are implemented, but only image builds have been verified so far; the complete services have not passed a container runtime smoke test together.
2. A full local Compose stack with API, web, worker, monitoring, and a private S3-compatible service has not passed together. Local developers currently run the API/Web through host scripts/browser E2E; PostGIS/Redis and S3Mock run in Compose.
3. Backup/restore is being verified on an isolated database, but there is no scheduled off-host backup, RPO/RTO, monitoring/alerts, or successful staging recovery drill.
4. Product gaps remain in provider-fed multimodal Journey, GTFS, WALK provider, Journey monitor/replan, Web Push/APNs, commercial payments, background iOS GPS, Universal Links and native QR.
5. Real provider, security, hosting, and physical-device release acceptance remains outstanding.

The scripts require real configuration and deliberately fail closed. Do not run production Compose with the example values. See [OWNER_ACTIONS_REQUIRED.md](OWNER_ACTIONS_REQUIRED.md) for the external inputs, and [RELEASE_STATUS.md](RELEASE_STATUS.md) for capability statuses.
