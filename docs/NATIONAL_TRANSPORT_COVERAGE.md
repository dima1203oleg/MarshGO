# National transport coverage — MARSHGO

Generated 2026-11-18T17:07:55.379Z. Probe: departures **2026-11-20 08:00 +02:00**, one passenger, all rail/bus/minibus/tram/trolleybus modes allowed, transfers allowed.
Source of truth: `docs/NATIONAL_ROUTE_MATRIX.json` (machine readable) and `tmp-browser-test/api_matrix_long.json` (raw API rows).

## Headline

| Metric | Baseline (PR #198) | Now |
| --- | --- | --- |
| Administrative directions | 702 | 702 |
| Directions returning routes at 08:00 | 124 (17.7%) | **147 (20.9%)** |
| Directions returning routes at 08:00, 13:00 or 18:00 | — | **156 (22.2%)** |
| API errors | 0 | 0 |
| Median response | 501 ms | 576 ms |
| P90 response | 7077 ms | 8813 ms |

Coverage is measured on 27 administrative centres and therefore only characterises administrative directions, not national transport coverage. Intra-city, suburban and arbitrary address-to-address routing is measured separately (see BROWSER_E2E_RESULTS.md and the chain checks).

## Empty directions by diagnosed reason

| Reason | Directions |
| --- | --- |
| `NO_RAIL_STOP_IN_FEED` | 396 |
| `NO_SERVICE_ANY_PROBED_TIME` | 150 |
| `NO_SERVICE_AT_08_00` | 9 |

`NO_RAIL_STOP_IN_FEED` means neither endpoint has a railway stop within the 15 km endpoint budget inside the ingested ODbL feed (Краматорськ, Житомир, Сєвєродонецьк, Миколаїв, Херсон, Черкаси, Чернігів, Сімферополь, Севастополь). `NO_SERVICE_ANY_PROBED_TIME` means both endpoints are covered by the feed but no trip connects them at 08:00, 13:00 or 18:00 on the probe date.

## Outbound coverage per administrative centre (routes found / 26)

| Київ | 15 |
| Київська | 5 |
| Вінницька | 9 |
| Волинська | 4 |
| Дніпропетровська | 8 |
| Донецька | 0 |
| Житомирська | 0 |
| Закарпатська | 8 |
| Запорізька | 7 |
| Івано-Франківська | 11 |
| Кіровоградська | 4 |
| Луганська | 0 |
| Львівська | 14 |
| Миколаївська | 0 |
| Одеська | 8 |
| Полтавська | 12 |
| Рівненська | 7 |
| Сумська | 0 |
| Тернопільська | 10 |
| Харківська | 12 |
| Херсонська | 0 |
| Хмельницька | 10 |
| Черкаська | 0 |
| Чернівецька | 3 |
| Чернігівська | 0 |
| АР Крим | 0 |
| Севастополь | 0 |

## Modes actually present in returned itineraries

- **WALK**: 147 directions
- **RAIL**: 147 directions
- **BUS**: 48 directions
- **TRAM**: 25 directions
- **TROLLEYBUS**: 19 directions

Metro does not appear: every Kyiv metro source is still unreachable (see TRANSPORT_FEED_AUDIT.md), so metro stays disabled instead of being simulated.
