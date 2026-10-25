# GTFS dense-search repeat and label-screen — 2026-10-25

## Exact source and fixture

- Server source: PR #41 candidate `c217d6e4aa33ba032464428415c0694c35ad4fd3` in the existing isolated checkout.
- Fixture: frozen Lviv GTFS archive SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (72 routes, 1,071 stops, 15,716 trips).
- Runtime: Node `v25.4.0`; the Server package declares Node 24.21.0. This is diagnostic evidence only, not a supported-runtime performance acceptance.
- The existing warm-up plus two repeated calls per OD used identical 05:00–05:30Z departure window, walk radii, transfer buffer, two-transfer maximum and result limit 100.

## Deterministic repeat results

| OD | Ordered result hash stable | Trip / route chains | FASTEST / CHEAPEST / BALANCED stable | Search state | Two measured calls |
|---|---|---:|---|---|---:|
| Малий Голоско → Сихів | yes | 65 / 44 | yes | truncated; result limit reached | 2,819 / 2,302 ms |
| Наукова → Сихів | yes | 58 / 41 | yes | truncated; result limit reached | 2,256 / 1,927 ms |
| площа Ринок → Дубляни | yes | 66 / 36 | yes | truncated; result limit reached | 3,432 / 3,150 ms |

The runs support deterministic output on this exact frozen input. Because the runtime is outside the package's declared Node version and only two measurements were collected, they do not establish supported-runtime latency or a production SLA. Stable output does not make a truncated candidate pool complete.

## Event-label prototype screen

The existing test-only lazy event-label helper was tried on the Naukova → Sykhiv OD with exact-radius-selected origin/destination stops, one service date and a 1,000 expanded-label cap. It found 72 journey identities before the cap, expanded 1,000 labels, materialized 1,090 boarding expansions and 17,620 leg objects, and reported `searchTruncated=true`. At the end of the screen Node reported about 280 MB heap and 464 MB RSS. This was Node 25.4.0 and a bounded diagnostic; it is not an exhaustive comparison or a candidate implementation.

## Decision and next action

- Do not promote the test helper into the production route path as-is. Its current all-stop downstream leg materialization makes memory growth too high before it can demonstrate completeness.
- Keep current production truncation flags visible. Do not raise graph/search caps based on this screen.
- Next algorithm step: use the existing directed event and transfer feasibility indexes to identify destination-reachable boarding/alighting stop events first, then lazily materialize only stop pairs that can extend a query-feasible path. Compare against the exact one-/two-transfer small-feed oracle and all three frozen ODs; preserve baseline options and strategy winners, report identity/route-chain diversity, truncation, supported-Node repeated latency and memory.
- No production or release status change: `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.
