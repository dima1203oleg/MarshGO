# National transport coverage — MARSHGO

Generated 2026-11-18T19:01:40.401Z. Probe: departures **2026-11-20 08:00 +02:00**, one passenger, all rail/bus/minibus/tram/trolleybus modes allowed, transfers allowed.
Source of truth: `docs/NATIONAL_ROUTE_MATRIX.json` (machine readable) and `tmp-browser-test/api_matrix_final.json` (raw API rows).

## Headline

| Metric | Baseline (PR #198) | Now |
| --- | --- | --- |
| Administrative directions | 702 | 702 |
| Directions returning routes at 08:00 | 124 (17.7%) | **227 (32.3%)** |
| Directions returning routes at 08:00, 13:00 or 18:00 | — | **267 (38.0%)** |
| API errors | 0 | 0 |
| Median response | 501 ms | 468 ms |
| P90 response | 7077 ms | 5647 ms |

Coverage is measured on 27 administrative centres and therefore only characterises administrative directions, not national transport coverage. Intra-city, suburban and arbitrary address-to-address routing is measured separately (see BROWSER_E2E_RESULTS.md and the chain checks).

## Empty directions by diagnosed reason

| Reason | Directions |
| --- | --- |
| `NO_RAIL_STOP_IN_FEED` | 396 |
| `NO_SERVICE_AT_08_00` | 40 |
| `NO_SERVICE_ANY_PROBED_TIME` | 39 |

`NO_RAIL_STOP_IN_FEED` means neither endpoint has a railway stop within the 15 km endpoint budget inside the ingested ODbL feed (Краматорськ, Житомир, Сєвєродонецьк, Миколаїв, Херсон, Черкаси, Чернігів, Сімферополь, Севастополь). `NO_SERVICE_ANY_PROBED_TIME` means both endpoints are covered by the feed but no trip connects them at 08:00, 13:00 or 18:00 on the probe date.

## Outbound coverage per administrative centre (routes found / 26)

| Київ | 17 |
| Київська | 9 |
| Вінницька | 16 |
| Волинська | 6 |
| Дніпропетровська | 16 |
| Донецька | 0 |
| Житомирська | 0 |
| Закарпатська | 14 |
| Запорізька | 16 |
| Івано-Франківська | 13 |
| Кіровоградська | 4 |
| Луганська | 0 |
| Львівська | 16 |
| Миколаївська | 0 |
| Одеська | 12 |
| Полтавська | 17 |
| Рівненська | 13 |
| Сумська | 0 |
| Тернопільська | 16 |
| Харківська | 17 |
| Херсонська | 0 |
| Хмельницька | 16 |
| Черкаська | 0 |
| Чернівецька | 9 |
| Чернігівська | 0 |
| АР Крим | 0 |
| Севастополь | 0 |

## Modes actually present in returned itineraries

- **WALK**: 227 directions
- **RAIL**: 227 directions
- **BUS**: 55 directions
- **TRAM**: 29 directions
- **TROLLEYBUS**: 21 directions

Metro does not appear: every Kyiv metro source is still unreachable (see TRANSPORT_FEED_AUDIT.md), so metro stays disabled instead of being simulated.
