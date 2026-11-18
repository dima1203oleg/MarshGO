# GTFS search cap experiment and server shutdown recheck — 2026-10-26

## Source boundary

- Server checkout: `/Users/dima1203/Desktop/MarshGO/MarshGO-Server`.
- Branch: `feature/transport-layer-availability`.
- HEAD: `92a26a3f617f32d644a66c0af46cba096ccb0ce0`; the working tree is dirty and this evidence describes the mutable local source, not a release artifact.
- Frozen Lviv feed SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (72 routes, 1,071 stops, 15,716 trips).
- No source cap increase remains in the worktree. No deployment, push, broad staging, reset, clean, container deletion, or database deletion was performed.

## Shutdown lifecycle repair

`server/index.ts` now closes the GTFS search worker as part of the shared graceful resource shutdown. `tests/gtfs-search-worker.test.ts` verifies that a search attempted after worker close rejects as closed.

Evidence after the change:

- Worker tests: 5/5 PASS.
- TypeScript typecheck: PASS.
- Focused ESLint: PASS.
- Guarded loopback Postgres/Redis integration suite, including shutdown/restart durability: 29/29 PASS.
- Separate current-source production Node 24 container smoke was built before this one-line shutdown change; its digest is `sha256:71e8e4630c0df816b58baa43f929d15b71ad35264da46d0fe7ec0c265613b83a`. It is not an image for the final current source and was not deployed.

## Dense-feed search diagnostics

Repeated frozen-feed searches still report candidate loss. With current bounds (`50,000` explored steps and `limit * 25` candidate pool), representative per-search stage counters were:

| Origin → destination | Steps | First legs | Candidate pool | 1-leg | 2-leg | 3-leg | Truncation flags |
|---|---:|---:|---:|---:|---:|---:|---|
| Holosko → Sykhiv | 42,603 | 915 | 2,500 | 6 | 1,174 | 1,320 | stop selection, search budget, candidate pool, route-chain sampling, segment span |
| Naukova → Sykhiv | 35,203 | 1,852 | 2,500 | 38 | 1,210 | 1,252 | stop selection, search budget, candidate pool, route-chain sampling, segment span |
| Rynok → Dubliany | 50,000 | 1,720 | 1,758 | 8 | 520 | 1,230 | stop selection, search budget, step limit, route-chain sampling, segment span |

All three queries return 100 journeys and still identify partial candidate generation. The API response already exposes `candidateGenerationTruncated`, typed `partialReasons`, and `gtfsSearchDiagnostics` with affected provider names. The Site renders a Ukrainian partial-results status. Therefore callers have an explicit warning; this does not make candidate coverage complete.

## Rejected cap experiment

An isolated temporary comparison doubled the bounds to 100,000 steps and `limit * 50` candidates, then restored the original source values. The candidate pool still filled to 5,000 for two O/Ds; the third hit 100,000 steps. Search remained truncated for all O/Ds. The post-warmup single-run samples with doubled bounds took approximately 2.06 s, 0.92 s, and 1.71 s; debug-instrumented repetitions ranged from 1.18 s to 2.64 s. Existing-bounds runs had previously ranged more broadly as well, so these samples are noisy and do not establish a latency regression estimate. Since doubling caps does not resolve truncation and increases worst-case work, it was rejected. No performance target or complete-search claim is made.

## Next exact work

1. Continue the isolated query-directed/shared-frontier prototype on frozen feed, leaving the current bounded production candidate untouched.
2. Require exact small-feed one/two-transfer identities, strategy winner retention, frozen O/D route-chain recall, all truncation causes, latency, and RSS before adopting any algorithm change.
3. Re-run Server unit/type/lint/integration suites after the algorithm settles, then proceed with exact-SHA reconciliation and remaining production gates.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
