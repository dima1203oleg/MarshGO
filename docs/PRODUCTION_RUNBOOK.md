# Production runbook

## Current state

`compose.production.yml` defines PostGIS, password-protected Redis, a one-shot migration job, the API, static web, and Caddy TLS proxy. Docker images build locally and a disposable production-shaped stack has completed migrations/readiness checks. No hosted target, credentials, monitoring, or rollback rehearsal is configured; this is a deployment procedure, not evidence of a live service.

## Required before first deployment

Provision a DNS-backed domain and host, secret storage, managed PostgreSQL/PostGIS, managed Redis, approved HTTPS routing/geocoding endpoints, immutable MARSHGO map style/data manifests, Twilio credentials and verified sender, and private object storage. Fill production variables from [ENVIRONMENT.md](ENVIRONMENT.md) in the platform secret store. Do not place real values in `.env` committed to Git.

## Build and deploy

Run from the commit approved for release:

```sh
docker compose -f compose.production.yml config --quiet
docker compose -f compose.production.yml build api web
docker compose -f compose.production.yml up -d
docker compose -f compose.production.yml ps
```

The `migrate` one-shot service runs before API startup. Confirm `/healthz` and `/readyz` through the public HTTPS domain, then run the staging two-user browser acceptance and provider checks before shifting user traffic. The production proxy exposes ports 80/443 and obtains certificates through Caddy; DNS and inbound firewall rules must already point to this host.

## Rollback

Keep the last known-good API and web image digests. If health or critical journeys fail, stop traffic at the proxy/load balancer and redeploy the previous image tags. Do not roll back a schema change that has already removed or reinterpreted columns. Migrations must use expand/migrate/contract; use a forward-fix unless the migration owner has rehearsed a safe rollback against a copy of production data.

## Incident triggers and escalation

Alert on sustained failed `/readyz`, elevated 5xx/latency, PostgreSQL or Redis unavailability, routing/geocoding failures, old outbox backlog, websocket reconnect spikes, and stale navigation positions. Monitoring and paging targets are not configured yet. Until an on-call owner and tested alert route exist, this runbook is not operationally complete.
