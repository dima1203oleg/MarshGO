# Server deployment readiness — 2026-10-01

**READY_FOR_SERVER_DEPLOYMENT = NO**

Deployment preparation exists and has been exercised in part: production Compose/Caddy templates, pinned Server/Site source materialization, Dockerfiles, fail-fast environment validation, bootstrap/update/rollback scripts, encrypted database backup and guarded restore, and home-server/runbook documentation. A separate local Docker staging stack is currently reachable through a temporary HTTPS tunnel and passed core browser smoke plus API/Redis recovery checks.

The handoff gate remains NO for concrete reasons:

1. The staging stack is an ad hoc local stack, not a clean-host rehearsal of the production bootstrap script and production Compose topology.
2. The public tunnel is ephemeral and anonymous. A persistent, access-controlled staging hostname and operator monitoring/alerts are not configured.
3. Full paired-user booking, chat, rendezvous, boarding, trip completion, reviews, cancellation/Rescue and WebSocket recovery did not pass staging UI acceptance. See [STAGING_DEPLOYMENT_REPORT.md](STAGING_DEPLOYMENT_REPORT.md).
4. Production operations still lack scheduled off-host backup/PITR, measured RPO/RTO, alerting and a production restore/rollback drill. The local disposable PostGIS restore and Redis recovery drills do not satisfy those gates.
5. Multimodal GTFS/WALK/replanning, reliable background iOS location, native QR/push, and commercial provider/payment flows remain incomplete or externally gated.
6. Server security fix PR #2 is deployed to staging and CI-green but is not yet in Server `main`; the release baseline must be deliberately advanced and reverified before tagging.

See [docs/PRE_PRODUCTION_FINAL_REPORT.md](docs/PRE_PRODUCTION_FINAL_REPORT.md) for current evidence, [OWNER_ACTIONS_REQUIRED.md](OWNER_ACTIONS_REQUIRED.md) for owner-only inputs, and [docs/RELEASE_STATUS.md](docs/RELEASE_STATUS.md) for capability states. Do not run production bootstrap with example values.
