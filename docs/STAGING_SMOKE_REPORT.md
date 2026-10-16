# Staging smoke report

**Status: BLOCKED_EXTERNAL.** No hosted staging domain, TLS endpoint, secrets or managed services are configured in this workspace.

## Local evidence (not staging)

- A production-shaped local PostGIS/Redis/API Compose stack bootstrapped and `/readyz` returned 200.
- The umbrella local integration and browser E2E suites passed on their isolated stack.
- Public geocoder/routing/map endpoints were smoke-tested once. They are shared public services, not contracted production dependencies.

## Not verified

- Hosted HTTPS and DNS.
- Real SMS delivery.
- Managed PostgreSQL/PostGIS and Redis.
- Private object storage, push delivery and monitoring.
- Staging web golden path with independent driver/passenger users and real providers.
- Deployment rollback and service restart durability on hosted infrastructure.

No staging PASS is claimed. Re-run the acceptance suite after deploying a single compatible release manifest from `RELEASE_MANIFEST.json`.
