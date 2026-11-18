# GTFS nearby-retention cache A/B — 2026-10-25

## Scope and exact inputs

- Server candidate branch: `codex/gtfs-nearby-stop-retention-20261025`.
- Candidate `c217d6e4aa33ba032464428415c0694c35ad4fd3`; comparison source `4cd3b998313ef5e2596f2cf9d7fc998e2f3e11b7`. This isolates the query-local nearby-neighbor cache change.
- Runtime: Node `v24.21.0`, the package's declared engine.
- Frozen Lviv GTFS archive SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`; 72 routes, 1,071 stops, 15,716 trips.
- Query parameters and fare/routing options were identical; seven paired repetitions per OD, alternating parent/candidate order in one process. Result limit 100.

## Results

| OD | Parent median | Candidate median | Candidate latency change | Ordered top-100 identity hash and strategy winners | Search state |
|---|---:|---:|---:|---|---|
| Малий Голоско → Сихів | 3,092.83 ms | 3,011.76 ms | 2.7% faster | Identical for all seven pairs | Both truncated; result limit reached |
| Наукова → Сихів | 2,119.80 ms | 2,008.69 ms | 5.5% faster | Identical for all seven pairs | Both truncated; result limit reached |
| площа Ринок → Дубляни | 3,418.66 ms | 3,240.45 ms | 5.5% faster | Identical for all seven pairs | Both truncated; result limit reached |

The candidate improves paired median latency modestly in these frozen-feed measurements without changing the ordered top-100 or FASTEST/CHEAPEST/BALANCED winners. Every OD still reports `searchTruncated=true` and `resultLimitReached=true`. These are local single-process replay measurements, not production latency/SLA or exhaustive route-completeness proof.

## Exact candidate verification

- Hosted Server CI for candidate SHA `c217d6e4aa33ba032464428415c0694c35ad4fd3`: run `40189573482`, SUCCESS.
- Node 24.21.0 full unit suite on this exact source: 316 PASS, 0 FAIL, 3 opt-in integration SKIP.
- Node 24.21.0 TypeScript typecheck: PASS.
- Node 24.21.0 ESLint: PASS.
- `git diff --check`: PASS.
- The 30/30 isolated PostGIS/Redis integration run belongs to previous head `4cd3b99`, before the cache-only commit; it is not reported as an exact-`c217d6e` integration run.

## Decision

Keep PR #41 draft. The cache optimization passes the measured identity/winner invariance and lowers median latency in all three frozen OD pairs, but dense-search truncation remains unresolved. Continue query-completeness and end-to-end production work; do not claim this change makes routing complete or production-ready. `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.


## Exact-head integration suite

On exact source SHA `c217d6e4aa33ba032464428415c0694c35ad4fd3`, Node 24.21.0 integration runner exited 0: **30 PASS, 0 FAIL, 0 SKIP** across migration, journey schema, live journey, bookings, partner tenant isolation, navigation, clustered realtime, booking restart durability and shared Redis rate limiting. It used a fresh loopback-only Postgres test DB `marshgo_e2e_c217_verify` and isolated Redis DB 14. Existing `marshgo_e2e`, Redis DB 0 and the long-running Docker containers were not cleared or restarted.

The follow-on 25k→50k objective-reservoir-window screen was rejected because it changed top-100 output, reduced trip/route diversity for two ODs, did not change strategy winners, and remained truncated. See [audit 178](178_GTFS_SEARCH_WINDOW_SCREENING_REJECTED_2026-10-25.md).
