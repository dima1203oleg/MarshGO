# GTFS event-label search screen on supported Node — 2026-10-25

## Purpose

Recheck the existing test-only lazy event-label search on the same frozen Lviv feed using the Server package's declared Node version. This is a rejection/diagnostic experiment, not a production implementation.

## Reproducible input

- Server source: `dima1203oleg/MarshGO-Server`, branch `codex/gtfs-nearby-stop-retention-20261025`, source head `70e11d8d8730e54311f13d73953ab565fd6b432a`.
- Frozen GTFS archive: `/private/tmp/marshgo-lviv-gtfs-current-20261025.zip`.
- Archive SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`.
- Runtime: Node `v24.21.0` (the package's declared engine).
- Query: Малий Голоско → Сихів, 2026-10-23 05:00–05:30Z, two transfers, 900m access / 1,000m egress / 400m transfer radius, six-hour journey bound, 100-result page.
- Event-label cap: 1,000 expanded labels.

## Observed result

- Legacy bounded router: `searchTruncated=true`, `candidateGraphTruncated=true`.
- Event-label prototype: `searchTruncated=true` at exactly 1,000 labels.
- The prototype materialized 35,754 candidate trip segments and returned 24 paths (3 unique trip chains and 3 route chains), with roughly 5.78 seconds of measured event-search time.
- Memory readings from the same process sample were internally inconsistent (`heapUsedBytes` greater than `rssBytes`), so they are excluded from performance acceptance.

This supported-runtime run confirms that merely switching traversal style does not solve dense-feed completeness: the prototype remains truncated and materializes too many downstream pairs before proving they can reach the destination. Do not promote this implementation or increase its label/segment caps as a workaround.

## Next algorithm step

Prototype destination-directed pruning before leg materialization. Any pruning must over-select rather than exclude paths based on uncertain transfer metadata, then defer exact feasibility to the existing production `transferDecision`. Establish a measurable per-query memory budget, keep an explicit `truncated` signal, and compare exact identities plus FASTEST/CHEAPEST/BALANCED winners against the small exhaustive oracles and all three frozen Lviv ODs. If completeness cannot be established within the budget, keep the explicit partial-results warning and expose the true cause.

## Release state

This is test-only negative evidence. No routing behavior changed in this experiment. Server PR #41 remains draft/unmerged. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
