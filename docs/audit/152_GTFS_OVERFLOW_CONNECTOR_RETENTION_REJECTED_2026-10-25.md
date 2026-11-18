# GTFS overflow retention for query-feasible connectors — 2026-10-25

## Frozen baseline on the declared runtime

- Server base: `38f17b88f98c8530f8090cfc6745cd334c87e53c`.
- Runtime: Node `v24.21.0`, invoked through isolated `npm exec`; the installed system Node was not changed.
- Feed SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (72 routes, 1,071 stops, 15,716 trips).
- Three fixed OD pairs, five serialized repeats each; fixed date/window, transfer, walking and result-limit parameters are in `/private/tmp/marshgo-lviv-three-od-compact-replay.mts`.
- All 15 baseline runs had stable ordered hashes, stable FASTEST/CHEAPEST/BALANCED winners, and both `searchTruncated=true` and `candidateGraphTruncated=true`.

| OD | Median / range | Unique trip / route chains |
|---|---:|---:|
| Maloholoskivska → Sykhiv | 2,283.96 ms (2,182.50–2,623.55) | 60 / 43 |
| Naukova → Sykhiv | 1,849.08 ms (1,749.97–1,911.21) | 55 / 34 |
| Rynok → Dubliany | 2,808.78 ms (2,663.74–2,841.70) | 55 / 31 |

## Candidate and result

In an isolated worktree at the same base SHA, changed overflow selection to retain trip segments that have a query-reachable prior and next scheduled event, alongside the existing origin/destination endpoint segments. No other source file changed. The 75-test GTFS timetable suite passed on Node 24.21.0.

Five serialized candidate replays per OD were deterministic, but the candidate failed promotion:

| OD | Candidate median / range | Unique trip / route chains | Winner parity |
|---|---:|---:|---|
| Maloholoskivska → Sykhiv | 2,996.98 ms (2,947.11–3,205.19) | 58 / 41 | **Failed:** FASTEST and CHEAPEST changed |
| Naukova → Sykhiv | 1,944.97 ms (1,898.26–2,321.83) | 54 / 33 | Preserved |
| Rynok → Dubliany | 2,755.91 ms (2,603.63–2,916.22) | 55 / 31 | Preserved |

All candidate searches remained truncated. Median time rose about 31% for the first OD and about 5% for the second; chain diversity decreased for those two ODs. The change was reverted in the isolated worktree; its tracked source is clean at the base SHA. No release branch changed.

## Next step

Do not keep expanding endpoint/connector overflow reservoirs: this evidence shows that adding more plausible connector candidates alone does not fix graph completeness and can evict a faster/cheaper winner. Inspect how whole-trip-group sizes and per-route allocations interact with stop-pair demand, then evaluate a bounded query-specific routing design against the exhaustive small-feed oracle and all three frozen OD pairs on Node 24.21.0. Preserve truthful partial-search flags until no candidates are omitted.

Production remains `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.
