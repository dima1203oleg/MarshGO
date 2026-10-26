# Current Server + GTFS PR #38/#39 integration — 2026-10-25

## Exact integrated candidate

- Repository: `MarshGO-Server`
- Local branch: `codex/server-current-pr39-integration-20261025`
- Integration commit: `38f17b88f98c8530f8090cfc6745cd334c87e53c`
- Integration base: current local `feature/transport-layer-availability` at `92a26a3f617f32d644a66c0af46cba096ccb0ce0` (includes the calendar/realtime/transfer oracle and verified fare metadata).
- Integrated open stack: Server PR #38 `codex/gtfs-round-search-20261024` at `8e570768c7e1e4dd2f016764d7396d9776e92abc`, plus its dependent PR #39 `codex/gtfs-pathway-retention-20261024` at `142ed4f76e9da94430048d4a31e7ad3962b4858b`.
- This is a local integration branch, not pushed, not a production artifact, and not yet paired with Site/iOS/Admin/Partner/orchestrator SHAs.

## Local verification

- Server unit suite: **315 PASS / 0 FAIL / 3 opt-in SKIP** (318 total).
- TypeScript typecheck: PASS.
- ESLint: PASS.
- Full loopback Postgres/PostGIS/Redis integration script: **30/30 PASS**, including migrations, journey schema, live journey, bookings and trip edits, concurrent last-seat booking (20 attempts), Partner tenant isolation, navigation, realtime delivery across two API instances, restart durability, and shared Redis rate limits.
- Runtime: Node `v25.4.0`; repository declares Node `24.21.0`. These local results need an exact supported-runtime/hosted CI run before acceptance.

## Frozen Lviv replay against the direct parent PR #38

Archive SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`; frozen local GTFS contains 72 routes, 1,071 stops, and 15,716 trips. Each OD ran five times serially on PR #38 and five times on the integrated #38→#39 candidate.

| OD | PR #38 median | #38→#39 median | Result IDs retained / added / dropped | Strategy winners | Search status |
|---|---:|---:|---:|---|---|
| Holosko → Sykhiv | 2,040.23 ms | 2,201.11 ms | 77 / 23 / 23 | All #38 winners retained; FASTEST and BALANCED select newly preserved, previously absent chains in #39. | Both truncated |
| Naukova → Sykhiv | 1,441.42 ms | 1,456.14 ms | 99 / 1 / 1 | FASTEST, CHEAPEST, BALANCED IDs unchanged and retained. | Both truncated |
| Rynok → Dubliany | 2,501.16 ms | 2,924.57 ms | 98 / 2 / 2 | FASTEST, CHEAPEST, BALANCED IDs unchanged and retained. | Both truncated |

Within the five candidate repetitions, result hashes and all three selected strategy winner IDs were stable for every OD. The new Holosko FASTEST/BALANCED winners are additional feasible itinerary identities retained by the temporal candidate logic; the prior winners remain in the candidate output. This is useful candidate diversity, not exhaustive route recall. Median latency changed by about +8%, +1%, and +17% respectively; no load test or memory/RSS study was made. All three requests still report truncation/result-limit reached, so completeness remains NOT_MET.

## Release decision

Keep this Server branch as the locally verified integration candidate and retain its explicit truncation signal. Do not claim production readiness or use the results to suppress incomplete-search messaging. No PR, staging deployment, production deployment, public-feed load test, physical-device test, backup/restore test, or rollback test was performed. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

Next: integrate the latest Site candidate on top of open Site PR #24, verify the Site/Server API contract on their exact local SHAs, and then continue the iOS/Admin/Partner/orchestrator release gates.
