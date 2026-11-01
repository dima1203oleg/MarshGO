# Query-weighted GTFS graph allocation experiment — rejected — 2026-10-25

## Exact replay setup

- Baseline Server SHA: `38f17b88f98c8530f8090cfc6745cd334c87e53c`.
- Isolated scratch branch: `codex/gtfs-budget-ab-20261025`, based exactly on that SHA.
- Candidate patch copied into the scratch worktree only from the pre-existing uncommitted query-relevance worktree; source worktree was not modified. The patch touched `server/journey/boundedGraphBudget.ts`, `server/journey/gtfsTimetable.ts`, and `tests/bounded-graph-budget.test.ts`.
- Node `v24.21.0`; frozen Lviv GTFS SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`.
- Same Maloholoskivska → Sykhiv query: 2026-10-23 05:00–05:30 UTC, six-hour horizon, up to two transfers, 900/1000 m access/egress, 400 m transfer, 180 s transfer buffer, 100-result limit.

## Candidate change

The patch estimates query-serving endpoint and connector opportunities before graph construction, then increases allocation weights for routes that can serve the query origin/destination while keeping the existing candidate-supply and per-route caps. This is plausible as a retention preference, but it changes which scheduled segments survive the bounded graph.

## Paired replay

| Metric | Exact baseline | Candidate patch | Decision |
|---|---:|---:|---|
| Returned | 100 | 100 | Same result cap |
| Unique trip chains | 60 | 59 | Regression |
| Unique route chains | 43 | 39 | Regression |
| FASTEST winner | baseline signature | unchanged | Preserved |
| CHEAPEST winner | baseline signature | unchanged | Preserved |
| BALANCED winner | two-leg chain via `32939` and `31679` | direct one-segment trip `32659` | Changed |
| Search truncation | true | true | Still incomplete |
| Candidate graph truncation | true | true | Still incomplete |
| One-run search time | 2.432 s | 3.688 s | Candidate slower in this replay; repeat timing before drawing SLO conclusions |
| Heap sample | 273 MB | 389 MB | Candidate higher; samples are single-run observations |

The baseline and candidate ID hashes differ. The 81 focused bounded-graph/timetable tests pass on the candidate patch, including exhaustive small-feed oracles, but they do not outweigh the frozen Lviv chain/winner regression.

## Decision and next step

Do not promote, commit, or push this candidate. The patch remains only in the isolated scratch worktree; the original uncommitted query-relevance worktree remains untouched. Preserve `searchTruncated` and `candidateGraphTruncated` in the product.

Next, inspect query-directed candidate discovery that retains immutable baseline chains and evaluates additions in a separate pool. Require exact small-feed identity/fare/three-strategy oracle parity, then compare at least three frozen ODs and repeated cold/warm latency and memory before promotion. Do not raise caps or tune arbitrary endpoint weights from a single OD.

## Production map asset evidence

The exact Site candidate requires an immutable style/data manifest and separately licensed imagery. Its repository has no deployment manifest or production map environment in the inspected checkout. `docs/PRODUCTION_MAP_SETUP.md` explicitly marks the four versioned vector styles and satellite configuration as absent. This blocks full visual acceptance of the supplied satellite-rich mockups; fixture map screenshots cannot replace it.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
