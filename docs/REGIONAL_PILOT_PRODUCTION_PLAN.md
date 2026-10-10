# Kyiv and Lviv regional multimodal pilot

**State on 2026-10-09: NOT IN PRODUCTION.** The local route-engine candidate now produces a live-feed tram→rail itinerary from Lviv to Stryi, but it has not passed the production release gates. This is a bounded city/corridor pilot plan, not coverage of every mode or every settlement in either oblast.

## Pilot boundary

Start with the Kyiv and Lviv urban networks and the verified Lviv–Stryi corridor. Expand to other settlements only after an operator feed has been checked for route geometry, stop locations, current calendars, useful departures, licensing, and journey results. This does not yet cover all of Kyivska or Lvivska oblast.

The product must keep its full transport catalogue visible. A mode is selectable for route search only when a healthy, licensed route source or contracted operator is configured for the searched area. Discovery/map inventory alone is not route-planning support.

## What the current candidate can actually route

| Area/source | Live feed probe on 2026-10-09 | Route-planner status and limits |
|---|---|---|
| Lviv — Lvivavtodor static GTFS | Healthy; 1,071 stops, 72 routes, 15,835 trips, 429,810 stop times; the current parser identifies bus/tram/city-train routes | Live route-chain probe found Lviv tram Т01 → 83 m station walk → OSM-derived rail GTFS train 3, continuing to Stryi. City feed coverage is not the oblast. |
| Stryi — city static GTFS | Healthy; 295 stops, 34 routes, 1,061 trips, 13,874 stop times; 34 bus routes | Local bus journeys can be searched when enabled. It does not provide general rural service for Lvivska oblast. |
| Kyiv — Kyivpastrans GTFS HTTPS mirror | Healthy; 1,492 stops, 162 routes, 24,403 trips; 102 bus, 43 trolleybus, 17 tram routes | These three modes can be scheduled from the mirror. Live Kyiv-centre → Lviv-centre query returned bus №24 to Kyiv-Pasazhyrskyi, then train №63 to Lviv-Holovnyi. The HTTPS mirror's provenance and refresh cadence still need operator validation; the Lviv last mile in this sample was a long estimated walk, so the whole user journey is not yet accepted. |
| Ukraine — OSM-derived rail GTFS aggregator | Healthy; 168 stops, 123 trips/routes, 1,138 stop times; 120 train and 3 suburban entries | Useful for route discovery and transfer experiments. It is not an official Ukrzaliznytsia feed and has no live inventory, confirmed fares, or ticket purchase. Do not represent it as an operator-backed bookable rail product. |
| Kyiv metro, City Express, funicular | Official Kyiv Open Data publishes separate schedule/headway and GeoJSON resources | These REST/GeoJSON resources are not GTFS and are not yet consumed by the journey planner. Geometry or station visibility does not mean the planner can schedule these legs. Keep them unavailable for route search until a tested schedule adapter exists. |
| Community rides | Search can return direct published MARSHGO offers | These are ranked as direct alternatives. A community ride is not yet chained with GTFS transit, and availability requires real published driver offers. |

The catalogue also includes 21 transport categories: carpool, taxi, carsharing, car rental, transfer, bus, marshrutka, trolleybus, tram, metro, city train, funicular, train, suburban train, intercity bus, bike, scooter, moped, plane, ferry, and walk. The engine does not have an actionable provider-backed leg for all 21. GBFS bike/scooter inventory is not itself a schedulable route; taxi, carsharing, rental, transfer, air and similar categories require operator integrations. They must stay visible but inactive in the affected area until those integrations pass readiness checks.

Walking access/egress and station transfers use straight-line distance estimates at 1.25 m/s, not pedestrian-network routing. A city stop whose name identifies a railway station can join a nearby nationally rail-served stop within 150 m; the 83 m Lviv platform transfer was returned explicitly. Other transfers still require the same canonical stop or a close name/coordinate match. Public GTFS fares are unknown; when any candidate fare is unknown, the API now suppresses the **CHEAPEST** label and returns the existing fare-unavailable explanation. These limitations must remain visible in results.

## Verified behavior and remaining engineering gates

- GTFS legs can be composed through up to two transfers across compatible providers. Exact/close stops and named railway-station aliases are matched; every nonzero inter-platform transfer is persisted and returned as a WALK leg. `Europe/Kiev` is normalized to `Europe/Kyiv` so equivalent Ukrainian feeds can be merged.
- Live Lviv-centre → Stryi-centre probe for Monday 12 October 2026 returned tram Т01 (08:21–08:41 Kyiv time), an estimated 83 m walk between differently named station platforms, then train 3 (09:45–10:50). The combined feed load took 12.3 s and one warm itinerary search took 4.2 s. This proves a schedule candidate can be composed; it does not prove a request-latency SLO, pedestrian safety, ticket availability, or correct operation on every departure.
- Direct live-feed route-engine probe (not an end-to-end API/UI test) for Kyiv-centre → Lviv-centre returned bus №24 (07:21–07:33) → train №63 (08:14–14:30), Kyiv time. The composed candidate reaches Lviv-Holovnyi and then estimates a roughly 2.7 km walk to the requested endpoint; a city transit last-mile leg was not selected. The warm query took about 6.8 s. This confirms a cross-provider bus-to-rail chain, not a production-quality door-to-door journey.
- The current Server suite passes 99 tests, with 1 opt-in integration test skipped; Server typecheck/lint pass. The run used Node 25.4.0, while the Server package declares Node 24.21.0. The Site suite passes 43 tests; Site typecheck/lint/production build pass. These unit/build results do not replace the pinned full browser acceptance, which remains 1/9 in the latest recorded release audit; that browser run was against Site 9c966972, not the current pinned Site SHA.
- Live feeds and schedules do not provide confirmed fares. FASTEST can select by scheduled door-to-door duration; CHEAPEST is deliberately not presented when any compared candidate has an unknown fare. A globally cheapest transit result remains blocked on authoritative fares.
- The pinned Site browser acceptance is 1/9 scenarios; the remaining scenarios use old UI expectations and fail on current sign-in/search/navigation flow. The umbrella UI passing its own tests does not waive this exact Site release gate.
- The candidate uses migration 043 locally; there is no configured production database against which to run a deployment migration.

## Production rollout sequence

1. **Make search bounded and measurable.** The dead-end search pruning is in place, but measured warm searches (~4.2–6.8 s) and a cold three-feed load (~12.3 s) still need a defined and passed p95 SLO. Add route-chain acceptance for Kyiv, Lviv, Stryi, city transit→rail at both city stations, timezone/date rollover, missed transfers, and FASTEST/CHEAPEST with known versus unknown fares. Validate a useful last-mile connection on Kyiv→Lviv rather than accepting the current long walk.
2. **Qualify source coverage.** Revalidate provider status and feed freshness on the server, not just from a one-time probe. Verify that every result leg has a usable stop sequence, calendar, pickup/drop-off rule, mode, source timestamp, and license. Obtain authoritative Kyiv rail/metro/funicular schedule adapters and operator-backed rail inventory before making those modes active. Identify open regional feeds beyond the three checked urban areas.
3. **Make optimization honest.** Obtain public fare tables or ticket APIs, use known fares for ranking, and label unknown fares. `CHEAPEST` must not assert a winner across unknown-priced services. Add priced taxi/rental/share providers only under operator contracts and actual availability APIs.
4. **Synchronize the user interface.** Keep all catalogue modes visible, show per-city availability and reasons, and ensure disabled types cannot enter the search request. Rebase/update the pinned browser acceptance suite to the real app flows and pass every relevant scenario on the exact Site/Server SHAs.
5. **Provision production.** The repository contains a production Compose template, but no `.env.production` or required production environment variables are present in this workspace. Configure a production host/domain, TLS/DNS, managed PostgreSQL/PostGIS, Redis, object storage, secret manager, SMS sender, licensed route/geocode/map providers, backups and a successful off-host restore drill, monitoring/alerts, and rollback access.
6. **Stage and accept.** Deploy the exact immutable candidate to hosted staging, apply reviewed migrations, then test real Kyiv/Lviv searches, transfers, disabled modes, provider failure/staleness, booking/payment where offered, and mobile layouts. Record source SHAs and environment evidence.
7. **Release gradually.** Start with the explicitly covered corridors, canary the provider set, monitor no-route/incorrect-transfer/latency/freshness rates, and expand only when each additional area passes the same feed and route acceptance.

## External sources checked

- [Kyiv Open Data — public transport schedules and official GTFS Static resource](https://data.kyivcity.gov.ua/dataset/rozklad-rukhu-miskoho-elektrychnoho-ta-avtomobilnoho-transportu-dep-transport/resource/58f0c3d0-9409-4de9-92c8-de4afa035efd) documents the city GTFS endpoint, last published update, and separate metro/City Express/funicular resources.
- [Lviv public transport GTFS Static resource](https://data.gov.ua/en/dataset/lviv-public-transport-gtfs-real-time/resource/eb31a65b-a22b-44b1-83ce-41add24ae652) describes the Lviv static GTFS dataset and update cadence.

## Release decision

**Do not deploy this candidate to production yet.** Production credentials/target are absent, the Site release's latest recorded full browser acceptance is 1/9, warm search is 4.2–6.8 s and cold feed load 12.3 s, the Kyiv→Lviv last mile is still a long walk, fare data is unavailable, and all-oblast coverage is not present. The next release stage is a persistent hosted staging pilot for the explicitly covered corridors, followed by these acceptance gates; it is not a full-oblast/all-mode release.
