# Cross-surface acceptance recheck — 2026-10-25

## Exact candidates checked

- Server: `38f17b88f98c8530f8090cfc6745cd334c87e53c` (`codex/server-current-pr39-integration-20261025`).
- Site: `9963aee9431c22cf118b965f0356e586951b87de` (clean integration checkout at `/private/tmp/marshgo-site-current-pr24-integration-20261025`).
- Admin: `9dbf7db0a935498ac40c98b19bc36bce056d630d` (clean integration checkout at `/private/tmp/marshgo-admin-pr1-20261025`).
- Partner: `c639257a7f28aeda5b378a816038b01651146b83` (clean integration checkout at `/private/tmp/marshgo-partner-pr1-20261025`).
- Root orchestrator/test harness: HEAD `a63b19ca2aa4846697312b8223d2bb7ed444c584`, with pre-existing dirty changes; not a releasable SHA.

## Checks and results

- Admin exact candidate: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass; 2/2 UI tests. The tests cover presentation role gating, not a full authenticated browser session.
- Partner exact candidate: same four checks pass; 3/3 UI tests. The tests cover onboarding/access states, not a full authenticated browser session.
- Server exact candidate: prior same-day acceptance remains 315/315 unit PASS, 3 opt-in skips, typecheck/lint PASS, and 30/30 isolated loopback Postgres/PostGIS/Redis integration PASS including Partner tenant isolation and role checks; see audit 153.
- Browser suite using root's current E2E sources against the exact Site candidate and Server candidate: **24 passed, 1 failed**. The button audit clicked 179 controls with zero controls lacking a visible effect. Booking/chat between two accounts, driver matching and rerouting, 12-mode catalogue, GPS recovery, strategy metadata and consented rendezvous scenarios passed.
- The single failure was the composite route-map test's transport-layer screenshot: 16,865 pixels (5%) differed because the expected snapshot was created from root's newer dirty UI (`Пункти повернення`/new availability labels), while the served Site candidate predates those changes (`Пункти оренди`/older labels). This run therefore identifies an exact candidate/test-harness SHA mismatch; it does not establish visual acceptance for either combined release.
- To separate the mismatch, built the current root UI to `/private/tmp/marshgo-root-e2e-dist-20261025` without touching the existing `dist/`. Its same route-map E2E stopped earlier on a real contract assertion: `.journey-segment-tile-meta-value` computed font weight was 800, expected 700. This assertion applies to the dirty root copy, not the canonical Site candidate; no edit was made in the orchestrator's non-authoritative product copy.
- `git diff --check` passes in the root worktree. Temporary E2E API/fixture processes exited; checked ports 3300, 3302, 3304–3308 are not listening.

## Decision

- **NOT RELEASE READY.** Do not merge or deploy this mixed test result as a unified candidate.
- Align the E2E harness and expected snapshots to the same immutable Site SHA, then rerun the route-map visual test and full browser suite. Resolve the root-copy 800-vs-700 assertion in the canonical Site implementation only if it reproduces on that exact Site source.
- Admin and Partner need authenticated browser workflows against the exact Server API, in addition to their current short state tests and the Server-side integration suite.
- The ten attached design references have not been accepted through a matching set of production-route screenshots. This run used local map/API fixtures; it is not live-provider or staging acceptance.
- Staging, licensed-provider entitlements, live feeds, physical iPhone, load, backup/restore, rollback and production deployment remain unverified. No production deployment was attempted.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
