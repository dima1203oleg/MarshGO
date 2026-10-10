# Staging Redis recovery drill — 2026-10-01

## Scope

This drill stopped only `marshgo-staging-redis-1`. Unrelated local Docker projects and the staging PostgreSQL/object-storage volumes were left running. PostgreSQL is the canonical store for accounts, demands, bookings and messages; Redis provides realtime coordination and ephemeral state.

## Procedure and result

1. Confirmed the public staging `/readyz` endpoint returned `200` with `database=connected` and `realtime=connected`.
2. Stopped `marshgo-staging-redis-1`.
3. Confirmed `/readyz` returned `503` with `status=degraded`, `database=connected`, and `realtime=disconnected`.
4. Restarted the same staging Redis container and waited for its Docker health check to return `healthy`.
5. Confirmed `/readyz` returned `200` with both database and realtime connected.
6. Reloaded the authenticated browser directly at `/demands/mine`. The existing `Стрий → Львів` test demand remained visible after reload, demonstrating PostgreSQL-backed state survived the Redis outage and browser refresh restored UI state.

## Outcome

**PASS — staging-only Redis outage detection and recovery.** No booking/chat transaction or paired-user realtime flow was active during this drill, so it does not prove message fanout replay, outbox backlog draining, or rendezvous TTL recovery under Redis loss. The Redis test volume was retained; no reset or data deletion was performed.

## Reproduction

```sh
docker stop marshgo-staging-redis-1
curl -i https://<current-staging-host>/readyz
docker start marshgo-staging-redis-1
curl -i https://<current-staging-host>/readyz
```

The localhost.run hostname is temporary and can rotate. Read the current URL from `STAGING_DEPLOYMENT_REPORT.md` before replaying the drill.
