# GTFS route-budget profile — 2026-10-25

## Exact observation

- Exact Server source/base: `38f17b88f98c8530f8090cfc6745cd334c87e53c`.
- Runtime: Node `v24.21.0`.
- Feed SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`.
- Query: frozen default Maloholoskivska → Sykhiv OD, 2026-10-23 05:00–05:30Z, up to two transfers, existing 900/1000/400m walk bounds and 180s buffer.
- A temporary diagnostic field was added only in the isolated worktree, read from a single replay, and reverted. The base worktree is clean at the exact SHA.

## Findings

- Candidate stop-pair demand: **415,997**; global segment graph budget and built segments: **100,000**. All 70 candidate routes are budget-limited; 10 routes hit the existing 5,000-segment per-route ceiling.
- Across 70 route allocations, 29 routes end 937 segments below their proportional allocation because whole-trip-group retention cannot fill the remaining route budget. The overflow redistribution adds exactly those 937 slots to 31 routes with retained endpoint candidates, so global capacity is still exactly full: **100,000/100,000**, not underused.
- 31 route overflow reservoirs hit their current 200-segment bound. The endpoint-only redistribution is deterministic. A candidate that admitted query-feasible connector segments to that same reservoir was separately rejected in audit 152: it changed two FASTEST/CHEAPEST winners and lowered candidate-chain diversity in two OD pairs.
- Search separately hits the 100-result limit and its bounded candidate sampling. The 1,000,000-step hard ceiling is not reached. `searchTruncated`, `candidateGraphTruncated` and `resultLimitReached` remain true.

## Engineering conclusion

Changing only overflow eligibility or raising the graph cap is not a justified fix. Unused per-route allocation is already transferred; the remaining loss occurs because the full graph has about 4.16× as many estimated segment candidates as its global bound and the retained graph is then searched and sampled. A completeness improvement must change how the query discovers and preserves feasible itinerary identities, not just move 937 existing slots among routes.

## Next step

Evaluate a bounded query-directed itinerary discovery path on the isolated Server candidate, reusing exact GTFS calendars, pathway/transfer rules, fare computation and the production three-strategy scorer. First prove all-feasible identity and winner parity on exhaustive small-feed one-/two-transfer oracles; then compare against the exact frozen three-OD baseline on Node 24.21.0. Promotion requires preserving every baseline winner and increasing useful chain recall without material latency regression; until then, preserve the current search-completeness disclosure.

This is local diagnostic evidence only. Production remains `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.
