# Geographic coverage baseline — MARSHGO

Generated 2026-11-18T21:49:11.850Z. Server `MarshGO-Server` @ `851b0a4`.
Machine-readable: `docs/evidence/national-coverage-2026-11-18/settlement-coverage.json`.

## What is counted

Every settlement of the КОАТУУ registry (29696 entries) is matched against the stop set of the **enabled, commercially licensed** GTFS feeds (Укрзалізниця ODbL; Київпастранс, Львівавтодор, Ужгород, Стрий, Івано-Франківськ under CC BY 4.0) and classified by straight-line distance to the nearest stop:

| Band | Settlements | Share |
| --- | --- | --- |
| ≤ 900 m | 141 | 0.5% |
| ≤ 2 km | 72 | 0.2% |
| ≤ 5 km | 359 | 1.2% |
| ≤ 15 km | 2854 | 9.6% |
| > 15 km | 11395 | 38.4% |
| No stop anywhere in the feed area | 13260 | 44.7% |
| No coordinate matched | 1615 | 5.4% |

`NO_STOP_IN_FEED_AREA` means the settlement's oblast has no stop from any licensed feed at all — the feed itself does not cover that territory.

## Per oblast (KOATUU pre-2020 codes, as published)

| Oblast | Settlements | Reachable ≤15 km | Share |
| --- | --- | --- | --- |
| Закарпатська Область | 608 | 328 | 1.1% |
| Івано-франківська Область | 804 | 354 | 1.2% |
| Львівська Область | 1927 | 585 | 2.0% |
| Полтавська Область | 1839 | 393 | 1.3% |
| Рівненська Область | 1026 | 176 | 0.6% |
| Київська Область | 1182 | 178 | 0.6% |
| Сумська | 1489 | 190 | 0.6% |
| Вінницька Область | 1503 | 190 | 0.6% |
| Волинська Область | 1087 | 123 | 0.4% |
| Дніпропетровська Область | 1499 | 150 | 0.5% |
| Кіровоградська Область | 1029 | 98 | 0.3% |
| Одеська Область | 1174 | 111 | 0.4% |
| Тернопільська Область | 1058 | 92 | 0.3% |
| Хмельницька Область | 1451 | 122 | 0.4% |
| Чернівецька Область | 417 | 34 | 0.1% |
| Черкаська | 853 | 49 | 0.2% |
| Житомирська | 1667 | 83 | 0.3% |
| Харківська Область | 1751 | 79 | 0.3% |
| Чернігівська | 1508 | 54 | 0.2% |
| Миколаївська | 910 | 21 | 0.1% |
| Запорізька Область | 949 | 16 | 0.1% |
| АР Крим | 1018 | 0 | 0.0% |
| Донецька | 1294 | 0 | 0.0% |
| Луганська | 925 | 0 | 0.0% |
| Херсонська | 697 | 0 | 0.0% |
| М.київ | 0 | 0 | 0.0% |
| Севастополь | 31 | 0 | 0.0% |

## Honesty boundaries

- **Distance geometry:** all bands are crow-flight stop proximity. Walking geometry is `NOT_ROUTED` — no pedestrian graph was consulted, so "≤900 m" is not a proven walk.
- **Administrative layer:** КОАТУУ is frozen pre-2020 (490 raions, no KATOTTH hromada codes). The post-2020 136-raion / 1469-hromada layer has no open bulk registry — a declared DATA_GAP, not silently substituted.
- **Network reach ≠ journey:** reaching a settlement means a licensed stop lies within 15 km. It does not claim a planner query returned a route; that is measured separately in `docs/NATIONAL_ROUTE_MATRIX.json`.
- **Coverage is data coverage:** the Укрзалізниця feed is a community OSM-derived extract, not the carrier's official publication. It has no stops in 9 oblast centres.
