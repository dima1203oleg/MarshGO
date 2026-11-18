# Server PR #41 supported-Node frozen GTFS replay — 2026-10-25

## Candidate and fixture

- Server branch: `codex/gtfs-nearby-stop-retention-20261025`.
- Exact source head: `70e11d8d8730e54311f13d73953ab565fd6b432a`.
- Runtime: Node `v24.21.0`, matching `package.json`.
- Fixture SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (72 routes, 1,071 stops, 15,716 trips).
- Query bounds: 2026-10-23 05:00–05:30Z, maximum 2 transfers, 900m access / 1,000m egress / 400m transfer radius, 180-second transfer buffer, 6-hour maximum journey, 4-hour maximum wait, 100-result limit.
- Reproducer: existing untracked `.tmp-route-repeat-bench.mts` in the isolated Server checkout; 1 warm-up plus 3 measured repeats per OD.

## Results

| OD | Ordered ID hash (stable across 3 repeats) | Returned trip / route chains | Median query | Strategy behavior | Truncation |
|---|---|---:|---:|---|---|
| Малий Голоско → Сихів | `8c6a34794c534462cf24873d5c17fd1c8fe2d15c07a558a6d65e68e0ac4ce2ac` | 65 / 44 | 2,467.58 ms | FASTEST = CHEAPEST; BALANCED differs | `searchTruncated=true`, `resultLimitReached=true` |
| Наукова → Сихів | `fe39dcd31269de4f43df03129f0c5c8b67ce5f792978399ead639070cf9601d4` | 58 / 41 | 1,916.50 ms | FASTEST = CHEAPEST; BALANCED differs | `searchTruncated=true`, `resultLimitReached=true` |
| площа Ринок → Дубляни | `3f7c5120913cc2ded010633bf137e1d0ee8cd4fbebd87f85d026e136b12270ce` | 66 / 36 | 3,009.02 ms | FASTEST = CHEAPEST; BALANCED differs | `searchTruncated=true`, `resultLimitReached=true` |

All three runs per OD returned 100 journeys and identical ordered result hashes and winners. These are bounded replay findings only: identical deterministic output is not evidence that no valid route was omitted. CHEAPEST and FASTEST sharing a winner on these three fixtures does not establish general strategy equivalence.

## Decision

The candidate is deterministic on this supported-runtime replay but still demonstrably incomplete on all three dense-feed queries. Keep `gtfsTruncation` visible and do not promote this candidate as a complete route search. Do not raise caps without resource evidence.

## Next algorithm work

Prototype a destination-directed, query-feasible candidate generator that prunes before constructing the 100k+ stop-pair segment graph. Keep transfer/pathway/parent-station rules conservative so pruning cannot exclude a feasible connection, use the production transfer authority for final acceptance, and validate identities plus FASTEST/CHEAPEST/BALANCED winners against exact one-/two-transfer oracles and these frozen ODs. Measure supported Node latency, heap/RSS, retained edges, and explicit truncation causes before production integration.

PR #41 remains draft and unmerged; this replay is not staging, live-provider, deployment, or production acceptance. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
