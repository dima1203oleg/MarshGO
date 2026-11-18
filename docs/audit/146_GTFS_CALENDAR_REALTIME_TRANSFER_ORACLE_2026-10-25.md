# GTFS calendar, realtime, and transfer oracle — 2026-10-25

## Scope

Added one deterministic small-feed oracle in `MarshGO-Server/tests/gtfs-calendar-realtime-oracle.test.ts`. It combines calendar additions/removals, a canceled trip, a downstream realtime delay, and a 900-second minimum transfer rule in one query. The oracle expects exactly one feasible chain.

## Evidence

- Focused test: **1/1 PASS**.
- Full Server unit suite: **233 PASS / 0 FAIL / 1 opt-in integration SKIP** (234 tests total).
- Server TypeScript typecheck: PASS.
- Targeted ESLint for the new test: PASS.
- The result is local fixture evidence only. No live feed, staging, production, load, or physical-device validation was performed.

## Result and limits

The candidate search agrees with this exact fixture: date-added service is eligible, date-removed service is omitted, canceled trips are excluded, realtime delay is applied before checking minimum transfer time, and an infeasible connection is omitted. The test adds no production behavior. Dense Lviv search remains truncated by access-stop selection, bounded search, and candidate sampling; this fixture does not establish completeness or production readiness.

## Exact checkout

- Repository: `MarshGO-Server`
- Branch: `feature/transport-layer-availability`
- Base HEAD at verification: `6cef355975ca546325f0e5a07130fb95a9092c04`
- Isolated test commit: `92a26a3f617f32d644a66c0af46cba096ccb0ce0` (`test(routing): cover calendar and realtime transfer parity`).
- Only the new test file was committed. Other dirty Server files were left untouched; no push or deployment.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
