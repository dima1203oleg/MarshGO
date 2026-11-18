# Server base full local acceptance on declared runtime — 2026-10-25

- Exact Server SHA: `38f17b88f98c8530f8090cfc6745cd334c87e53c` (`codex/server-current-pr39-integration-20261025`).
- Runtime: Node `v24.21.0`, invoked through `npm exec --package=node@24.21.0`; system Node was unchanged.
- Full unit suite: **315 PASS / 0 FAIL / 3 opt-in SKIP** (318 tests).
- TypeScript typecheck: PASS. ESLint: PASS.
- Full loopback Postgres/PostGIS/Redis integration: **30 PASS / 0 FAIL**, covering journey schema and spatial constraints, live journey, booking/role/vehicle rules, a concurrent last-seat booking race (20 accounts), trip editing/cancellation, Partner tenant isolation, navigation-session GPS privacy, two-instance realtime delivery, process-restart booking durability, and shared Redis rate limits.
- Integration runner explicitly guarded the dedicated `127.0.0.1` `marshgo_e2e` database and used local fixtures plus ephemeral API/OSRM processes. After completion, ports 3304/3306/3307/3308 were no longer listening; the existing Postgres and Redis containers remained healthy and running.
- This proves supported-runtime local Server behavior, not staging or production, external licensed provider access, live GPS from physical devices, load capacity, deployment, backup/restore, or rollback.
- Lviv frozen-feed replay on the same Server SHA and Node 24.21.0 remains repeatably deterministic, but all three checked OD searches are truncated at the graph/search/result bounds; see audit 152. Routing completeness is still NOT_MET.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
