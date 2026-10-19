# MARSHGO external blockers

Only concrete external dependencies belong here. Missing proof in a local checkout is recorded as `NOT_TESTED`, not automatically as an external blocker.

| Blocker | Feature / gate | Prepared work | Needed to close | Status |
|---|---|---|---|---|
| No currently verified production hosting/origin/deployed SHA | Production release and live smoke | Production Compose and Caddy config exist; release manifest identifies current candidate SHAs. No active production proof/origin/deployed SHA found | Owner-provided/approved host and DNS/domain, production-only secrets, deployment permission, monitoring/alerts, backup/restore and rollback target | BLOCKED_EXTERNAL |
| Current stable staging environment not verified | Cross-repo E2E, provider acceptance, operational checks | `ops/staging/docker-compose.yml` provides isolated local Postgres/Redis/S3Mock; historical temporary tunnels are not a stable staging service | Stable staging host/config and HTTPS origin, isolated DB/Redis/object store, test identities and secrets. Staging Compose requires `STAGING_POSTGRES_PASSWORD` and `STAGING_REDIS_PASSWORD`; production deployment also needs public DNS for app/admin/partner subdomains, trusted proxy count, session/Twilio credentials, routing/geocoding endpoints, map manifests, and object-storage configuration | BLOCKED_EXTERNAL / VERIFY CURRENT |
| Commercial provider access/agreements/credentials unconfirmed | Real quotes, booking, cancel and tracking for commercial transit/taxi/rental | Adapters/catalogs and explicit capability/license gates exist in worktrees | Provider-specific sandbox credentials, contractual/commercial permission and quotas | BLOCKED_EXTERNAL per provider |
| Physical iPhone and signing/push credentials not evidenced | GPS background, APNs, safe area, real-device and release acceptance | Capacitor and simulator workflows exist | Physical test device, Apple signing/team setup, APNs entitlement/keys as needed | BLOCKED_EXTERNAL |
| Live municipal data coverage is feed-specific and may be stale or unmatched | Full transit route overlay, fleet and ETA | Registry, GTFS/GTFS-RT adapters, freshness gates and probe tooling exist | For each city: valid license, fresh feed, exact operator/route/trip/direction/shape crosswalk; feed-owner remediation if IDs do not align | OPEN, partly external |
| No current owner approval to move production traffic is recorded here | Final production rollout | Candidate gates and rollback requirements documented | Explicit approval after reviewable candidate, manifest, smoke plan and rollback | BLOCKED_EXTERNAL |

Do not print secrets or private endpoint credentials here. Continue independent local implementation and verification while these remain open.
