# GTFS truncation-reason contract — 2026-10-25

## Change

- Server branch: `codex/gtfs-nearby-stop-retention-20261025` (existing draft PR #41).
- Commit: `b69fc195b9bef85f3345c75bbc77d85a2a951409`.
- `GtfsItinerarySearchResult` now provides a structured `truncation` object with independent booleans for stop selection, candidate graph, search budget, global step limit, candidate pool, candidate sampling and response-page omission.
- Existing `searchTruncated`, `resultLimitReached`, and `candidateGraphTruncated` fields remain intact for compatibility. No cap or search policy changed.
- This is the internal GTFS worker/search result contract. The aggregate journey-search HTTP response still reports its existing broad partial/truncation fields; propagating per-provider reason counts to that public response remains future implementation work.

## Local verification

- Exact edited files: `server/journey/gtfsTimetable.ts`, `tests/gtfs-timetable.test.ts`.
- Focused GTFS suite: **76 passed, 0 failed, 0 skipped** on Node `v25.4.0`.
- Targeted graph/page/two-transfer oracle: **3 passed, 0 failed**.
- TypeScript typecheck: PASS.
- ESLint for edited files: PASS.
- `git diff --check`: PASS.
- Node 24.21.0 exact-head hosted CI is running as workflow `40194176559`; report only after completion.

## Limits

This change makes incomplete-search causes distinguishable to Server consumers but does not reduce candidate loss. The frozen Lviv OD searches remain bounded/truncated, and event-label naive enumeration is not suitable for production. No staging, production, provider entitlement, physical-device, load, recovery, or release gate was changed by this commit. `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.
