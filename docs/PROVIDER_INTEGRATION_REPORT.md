# Provider integration report

## Registry snapshot

- 85 rows in `mobility_providers`, 46 `enabled`, 29 with `commercial_use IS TRUE`.
- 17 enabled GTFS schedule feeds; only 6 pass the journey-search eligibility query (`provider_type='public_transit' AND source_type='gtfs' AND access='open' AND status='enabled' AND health IN ('healthy','degraded') AND commercial_use IS TRUE AND license IS NOT NULL`).
- Those 6 are: Укрзалізниця (national rail), Київпастранс, Львівавтодор, Ужгородська міська рада, Стрийська міська рада, Івано-Франківськ (Dozor).

## Feeds registered but deliberately out of journey search

| Feed | Reason |
| --- | --- |
| Dozor Рівне, Кам'янець-Подільський, Біла Церква | download works, licence text names the platform only → `commercial_use` cannot be asserted |
| inbus.ua (Харків–Київ) | `LICENSE_UNVERIFIED`, recorded in `last_error` |
| VD-Express | 2 international routes only, nothing on domestic directions or the probe date |
| Kyiv metro (5 static sources) | upstream GIS endpoints unreachable |
| Буча / Одеса-область (x24.digital) | 401 anonymously |

## Import diagnostics

The worker loads each feed once into a bounded LRU (`GtfsSearchGroupCache`), merges by timezone, and reports per-provider load time. A single cold parse of the 6 MB national rail feed takes ~6.7 s; warm searches reuse the parsed feed and resolve in hundreds of milliseconds. No feed is marked working because its URL exists in the registry: every row above has a measured response, parse result and routing outcome.
