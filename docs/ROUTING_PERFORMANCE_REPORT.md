# Routing performance report

Same host (8 GB Apple Silicon), same canonical Server build, same probe set (702 directions, 3 concurrent requests, warm caches after the first pass).

| Metric | Baseline (PR #198) | After long-ride fix | Delta |
| --- | --- | --- | --- |
| Median | 501 ms | 468 ms | -33 ms |
| P90 | 7077 ms | 5647 ms | — |
| Max | 26334 ms | 22172 ms | — |
| Errors | 0 | 0 | 0 |

## What changed and why it costs what it costs

- The 24 h horizon is unchanged for the primary search; the graph budget therefore stays at its previous size.
- Only an **empty** search longer than 300 km retries once on national feeds with a 36 h horizon. The national rail feed has 167 stops, so the retry is small; it is skipped entirely when the primary search already returns journeys.
- Endpoint walking candidates are bounded by count (`MAX_ENDPOINT_CANDIDATE_STOPS = 300`), not by a shrunken radius, which kept the dense Kyiv feed from inflating the candidate graph.

## Slowest observed directions (cold cache included)

- Львівська → Черкаська: 22172 ms (0 routes)
- Львівська → Івано-Франківська: 20921 ms (5 routes)
- Львівська → Київська: 18910 ms (5 routes)
- Львівська → Сумська: 18858 ms (11 routes)
- Львівська → Рівненська: 18257 ms (12 routes)
- Львівська → Кіровоградська: 18188 ms (0 routes)
- Львівська → Волинська: 18001 ms (11 routes)
- Львівська → Вінницька: 17705 ms (7 routes)

Cold-cache rows are dominated by the first parse of the 6 MB national rail feed; the same directions return in single-digit seconds afterwards.
