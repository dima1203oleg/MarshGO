# MARSHGO external blockers

Only concrete external dependencies belong here. Missing proof in a local checkout is recorded as `NOT_TESTED`, not automatically as an external blocker.

| Blocker | Feature / gate | Prepared work | Needed to close | Status |
|---|---|---|---|---|
| No currently verified production hosting/origin/deployed SHA | Production release and live smoke | Existing release manifests describe earlier candidate/staging states; no active production proof | Owner-approved production environment, DNS/domain, secrets, deployment permissions, monitored rollback | BLOCKED_EXTERNAL |
| Current stable staging environment not verified | Cross-repo E2E, provider acceptance, operational checks | Historical temporary tunnel and local fixture workflows documented | Stable staging host/config, isolated DB/Redis, test identities and secrets | BLOCKED_EXTERNAL / VERIFY CURRENT |
| Commercial provider access/agreements/credentials unconfirmed | Real quotes, booking, cancel and tracking for commercial transit/taxi/rental | Adapters/catalogs and explicit capability/license gates exist in worktrees | Provider-specific sandbox credentials, contractual/commercial permission and quotas | BLOCKED_EXTERNAL per provider |
| Physical iPhone and signing/push credentials not evidenced | GPS background, APNs, safe area, real-device and release acceptance | Capacitor and simulator workflows exist | Physical test device, Apple signing/team setup, APNs entitlement/keys as needed | BLOCKED_EXTERNAL |
| Live municipal data coverage is feed-specific and may be stale or unmatched | Full transit route overlay, fleet and ETA | Registry, GTFS/GTFS-RT adapters, freshness gates and probe tooling exist | For each city: valid license, fresh feed, exact operator/route/trip/direction/shape crosswalk; feed-owner remediation if IDs do not align | OPEN, partly external |
| No current owner approval to move production traffic is recorded here | Final production rollout | Candidate gates and rollback requirements documented | Explicit approval after reviewable candidate, manifest, smoke plan and rollback | BLOCKED_EXTERNAL |

Do not print secrets or private endpoint credentials here. Continue independent local implementation and verification while these remain open.
