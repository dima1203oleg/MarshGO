# Routing performance report

Same host (8 GB Apple Silicon), same canonical Server build, same probe set (702 directions, 3 concurrent requests, warm caches after the first pass).

| Metric | Baseline (PR #198) | After long-ride fix | Delta |
| --- | --- | --- | --- |
| Median | 501 ms | 576 ms | 75 ms |
| P90 | 7077 ms | 8813 ms | — |
| Max | 26334 ms | 57527 ms | — |
| Errors | 0 | 0 | 0 |

## What changed and why it costs what it costs

- The 24 h horizon is unchanged for the primary search; the graph budget therefore stays at its previous size.
- Only an **empty** search longer than 300 km retries once on national feeds with a 36 h horizon. The national rail feed has 167 stops, so the retry is small; it is skipped entirely when the primary search already returns journeys.
- Endpoint walking candidates are bounded by count (`MAX_ENDPOINT_CANDIDATE_STOPS = 300`), not by a shrunken radius, which kept the dense Kyiv feed from inflating the candidate graph.

## Slowest observed directions (cold cache included)

- Львівська → Херсонська: 57527 ms (0 routes)
- Львівська → Харківська: 55786 ms (5 routes)
- Львівська → Хмельницька: 44069 ms (9 routes)
- Львівська → Київська: 43070 ms (5 routes)
- Львівська → Запорізька: 39395 ms (3 routes)
- Запорізька → Львівська: 38343 ms (10 routes)
- Львівська → Дніпропетровська: 38076 ms (5 routes)
- Запорізька → Миколаївська: 37418 ms (0 routes)

Cold-cache rows are dominated by the first parse of the 6 MB national rail feed; the same directions return in single-digit seconds afterwards.
