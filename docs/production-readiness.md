# MARSHGO production readiness

**Last checked:** 2026-10-13
**Release status:** `NOT_RELEASED` / `BLOCKED_EXTERNAL`

The earlier production sign-off in this file was not supported by a configured deployment target. It is superseded by this status and the evidence in [INTEGRATION_AUDIT_2026-10-13.md](INTEGRATION_AUDIT_2026-10-13.md).

Local production checks now pass on Node 24.21.0 for the umbrella app, Site and Server, including Server PostGIS/Redis integrations. This verifies code and locally provisioned test infrastructure only. It does not verify public HTTPS, real SMS delivery, production maps/routing, storage, backups, provider contracts, payment behavior, or operation on a physical iPhone.

The integration report contains the tested provider statuses, Ukraine bicycle-rental inventory audit, route and UI verification, security findings, exact external dependencies, and open PR links. Production deployment stays blocked until a real host/domain, production secrets and services, encrypted backup configuration, an exact release tag, and staging acceptance are available.
