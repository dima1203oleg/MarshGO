# GTFS query-topology pruning experiment — rejected — 2026-10-25

## Candidate and safety

- Isolated Server checkout: `/private/tmp/marshgo-server-routing-pr41-20261025`.
- Base branch/SHA: `codex/gtfs-nearby-stop-retention-20261025` / `70e11d8d8730e54311f13d73953ab565fd6b432a` (PR #41; draft, stacked, not a release candidate).
- Runtime and fixture: Node `v24.21.0`; frozen Lviv feed SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (72 routes, 1,071 stops, 15,716 trips).
- No shared checkout, database, container, branch, PR, or manifest was modified. The experiment was discarded and the isolated Server tree is clean at the base SHA.

## Experiment

Prototyped a query-directed, over-inclusive route/stop topology pass before bounded GTFS segment materialization. It used directed within-route movement, virtual transfer hubs, and deliberately permissive transfer/pathway/proximity edges. The existing production transfer decision remained the final feasibility gate. This was intended to remove candidates that could not connect query endpoints before they consumed the 100k graph budget.

An initial explicit route-pair transfer clique exhausted the default Node heap on a 13,000-route stress fixture. Replacing the clique with virtual hubs made the full suite pass, but that only fixed the prototype's memory failure; it did not make the approach acceptable.

## Validation and decision

- On the virtual-hub prototype: typecheck and lint passed; full Server unit suite reported **316 PASS / 0 FAIL / 3 opt-in SKIP**. Small exhaustive one- and two-transfer oracles passed.
- Frozen-feed replay used one warm-up and five measured repetitions per OD on Node 24.21.0. Results:

| OD | Previous median | Prototype median | Previous → prototype chains | Stable ordered result hash | Truncation |
|---|---:|---:|---:|---|---|
| Малий Голоско → Сихів | 2,467.58 ms | 2,693.52 ms | 65/44 → 61/43 | changed | `true`, 100 results |
| Наукова → Сихів | 1,916.50 ms | 2,822.46 ms | 58/41 → 58/41 | unchanged | `true`, 100 results |
| площа Ринок → Дубляни | 3,009.02 ms | 4,123.91 ms | 66/36 → 66/36 | changed | `true`, 100 results |

The prototype retained the existing FASTEST/CHEAPEST/BALANCED winner pattern on these three ODs, but did not clear truncation and changed returned journey identities on two. Its repeated medians regressed by approximately 9%, 47%, and 37%. Reject this implementation; do not merge or reuse it as production pruning.

After restoring the Server source, typecheck and the dense-graph plus exhaustive-oracle tests passed (3/3). The Server checkout returned clean to the same base SHA. The full unit-suite result above belongs to the experimental prototype, not the restored source.

## Next step

Continue from the existing exact query-feasible retention and destination-directed search diagnostics. Any new design must show measurable improvement on frozen-feed useful-chain recall and latency, preserve all three objective winners, pass the independent exhaustive oracles, remain within memory bounds, and avoid reporting complete search while any candidate truncation remains. Keep the current explicit partial-search disclosure. PR #41 remains draft/unmerged; production remains `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.
