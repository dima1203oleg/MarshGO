# GTFS pathway-linked transfer retention — 2026-10-24

## Change

- Server PR #39 candidate branch `codex/gtfs-pathway-retention-20261024`, current head `84f5b85544dac520af3a3e28119cb6ee6d4bf522` (implementation `b57f9c2`, directed-path regression `fe2d352`, and merged-provider pathway mapping `84f5b85`).
- Stacked on exact Server PR #38 head `8e570768c7e1e4dd2f016764d7396d9776e92abc`; PR #38 was not changed.
- Query-time retention previously recognized only identical physical stop IDs. It now indexes origin arrivals across directed GTFS pathways and checks pathway walking distance/time before promoting a platform-to-platform candidate. Final itinerary feasibility remains governed by the existing transfer decision logic.
- Added bounded-graph regression tests on a provider-merged feed with distinct platform IDs: the forward pathway chain is retained and the reverse-only pathway is rejected. Retention matches the namespaced source stop IDs used by merged transfer rules/pathways while also indexing canonical IDs for cross-provider exact-stop transfers.

## Evidence

- GTFS timetable + journey scoring + bounded graph budget tests: **99/99 PASS**, including acceptance of forward pathways and rejection of reverse-only pathways.
- Complete Server unit suite: **311 PASS / 0 FAIL / 3 SKIP**. The skips are opt-in integration scenarios and were exercised in the isolated integration run below.
- Isolated local Server integration workflow: **30/30 PASS** across migrations/schema, live journey, bookings/trip editing, Partner tenant isolation, navigation/GPS, Redis realtime across API instances, restart durability, and Redis rate limits. Only loopback `marshgo_e2e` DB, existing local Postgres/Redis test services, and temporary API processes were used; DB/Redis containers remain healthy.
- Server TypeScript typecheck: **PASS**.
- Targeted ESLint on changed files: **PASS**.
- `git diff --check`: **PASS**.
- Frozen Lviv static GTFS SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`: exact PR #38 replay and candidate both returned 100 results with identical ID hash `6a6c4a1ab31ef22b42c13d50a05b7cba2fb9a3d95c52a841cfee2c1924124ce6`, 59 trip chains / 38 route chains, and identical FASTEST/CHEAPEST/BALANCED winners. This feed has no `pathways.txt`, so output parity is expected. Both searches still report `candidateGraphTruncated=true` and `searchTruncated=true`.
- Exact final-head frozen Lviv replay again matches PR #38: same 100-result hash, same 59 trip / 38 route chains and strategy winners; both truncation flags remain true.
- Hosted CodeQL/security Verify `40128763529` and Server CI `40128767640` both PASS on exact final head `84f5b85544dac520af3a3e28119cb6ee6d4bf522`. The CI run covered audit, lint, typecheck, all unit tests, migrations, integration workflow, production API image build, and PostGIS/Redis smoke.
- Draft PR: https://github.com/dima1203oleg/MarshGO-Server/pull/39.

## Limits and next action

- This improves retention for a connection explicitly represented in `pathways.txt`; it does not solve dense-feed truncation or prove global route completeness.
- Exact final head `84f5b85544dac520af3a3e28119cb6ee6d4bf522` has passed hosted CodeQL/security Verify `40128763529` and Server CI `40128767640`, including image build and PostGIS/Redis smoke. Multi-feed external feed fixtures, broad origin/destination replay, and staging/runtime acceptance remain outstanding.
- Next: inspect PR #39 CI, extend directed/disconnected and transfer-rule regression coverage as needed, then continue dense-feed search work against the exhaustive small-feed oracle and frozen multi-OD replays. Keep release `NOT_RELEASED`.
