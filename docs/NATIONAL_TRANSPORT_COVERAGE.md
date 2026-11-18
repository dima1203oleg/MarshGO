# National transport coverage — MARSHGO

Generated 2026-11-18T21:48:51.498Z from measured API responses, not estimates.
Probe: departures **2026-11-20 08:00 +02:00**, one passenger, rail/bus/minibus/tram/trolleybus allowed, transfers allowed, community transport off.
Server: `MarshGO-Server` at `851b0a4` (branch `kilo/national-recall-20261118`, based on `origin/main`).
Machine-readable sources: `docs/NATIONAL_ROUTE_MATRIX.json`, `docs/evidence/national-coverage-2026-11-18/`; raw harness rows `tmp-browser-test/api_matrix_mainport.json` and the main baseline `api_matrix_mainbase.json`.

## Headline

| Metric | `origin/main` baseline | This branch |
| --- | --- | --- |
| Administrative directions | 702 | 702 |
| Directions returning routes at 08:00 | 107 (15.2%) | **227 (32.3%)** |
| Directions gained / lost | — | +120 / 0 |
| API errors | 0 | 0 |
| Routed response p50 | — | 1753 ms |
| Routed response p90 | — | 15686 ms |
| Routed response max | — | 55541 ms |

The matrix is measured on the 27 administrative centres (26 from each side, 702 directed pairs). It characterises administrative directions only; intra-city, suburban and address-to-address routing is covered by the browser harness and chain checks, not by this table.

## What changed in routing

1. **Oblast stations and national transfer hubs off the corridor are admitted** for intercity searches: 15 km endpoint reach (was 5 km) and the full stop set of national feeds (city = `Україна`) join the candidate graph. Rivne has no direct train to Lviv at all; every real itinerary changes in Kyiv, which a 60 km corridor band around the straight line excludes.
2. **A national-only long-distance retry** runs when a 300 km+ query returns nothing: the first pass shares one 100k segment budget with 11 city feeds and could discard the sparse UZ timetable entirely. The retry searches feeds whose bbox spans more than 3° with a 36 h horizon, so next-service-day overnight connections are reachable.
3. **The journey horizon no longer bounds the last pedestrian metre.** A vehicle arriving inside the window is a real ride even when the walk from its stop to the door crosses the boundary by a few minutes.

Regression tests: `tests/gtfs-timetable.test.ts` (95 pass), including a test proving rule 3 fails on the old code.

## Outbound coverage per administrative centre (routes found / 26)

| Centre | Routed |
| --- | --- |
| Київ | 17/26 |
| Полтавська | 17/26 |
| Харківська | 17/26 |
| Вінницька | 16/26 |
| Дніпропетровська | 16/26 |
| Запорізька | 16/26 |
| Львівська | 16/26 |
| Тернопільська | 16/26 |
| Хмельницька | 16/26 |
| Закарпатська | 14/26 |
| Івано-Франківська | 13/26 |
| Рівненська | 13/26 |
| Одеська | 12/26 |
| Київська | 9/26 |
| Чернівецька | 9/26 |
| Волинська | 6/26 |
| Кіровоградська | 4/26 |
| Донецька | 0/26 |
| Житомирська | 0/26 |
| Луганська | 0/26 |
| Миколаївська | 0/26 |
| Сумська | 0/26 |
| Херсонська | 0/26 |
| Черкаська | 0/26 |
| Чернігівська | 0/26 |
| АР Крим | 0/26 |
| Севастополь | 0/26 |

Ten centres route nothing: Донецька, Житомирська, Луганська, Миколаївська, Сумська, Херсонська, Черкаська, Чернігівська, АР Крим, Севастополь. The ingested ODbL Укрзалізниця feed simply has no stop in those areas (Суми has one stop event, no usable service), and no licensed road feed covers intercity coaches there. This is a **data gap, not a routing defect** — see `docs/GEOGRAPHIC_COVERAGE_BASE.md`.

## Scope and honesty boundaries

- Only licensed feeds are ingested: Укрзалізниця (ODbL), Київпастранс, Львівавтодор, Ужгород, Стрий, Івано-Франківськ (Dozor CC BY 4.0).
- inbus.ua and VD-Express are enabled and degraded but excluded from claims: their `commercial_use` and `license` fields are NULL.
- Distances in settlement coverage are straight-line stop proximity; pedestrian geometry is marked `NOT_ROUTED` until an OSRM foot profile is deployed.
- No route, price or availability is fabricated. Empty directions stay empty.
