# Navigation Verification

## Implemented and checked locally

- Production screen uses `WebGeolocationProvider`, validates fresh fixes and rejects stale/out-of-order/impossible jumps using the previous accepted fix.
- A local route-projection matcher moves the vehicle marker and calculates route progress; progress distance is normalized to the provider road distance.
- UI shows remaining distance, remaining duration and available ETA from `NavigationCore` rather than freezing at the route's initial estimate.
- Arrival requires a confident match within 30 metres of the routed endpoint and within an accuracy-aware road corridor. It changes local navigation state and emits telemetry; trip/booking completion remains a server-authoritative user action.
- Server-confirmed off-route observations require consecutive misses and are protected by a 30-second reroute cooldown.
- Routes persist locally through connectivity loss; online ETA is not presented as current while offline.

## Reproducible checks

- `npm test` covers deterministic navigation progress/arrival, GPS validation, replay fixtures, reroute guards and offline storage.
- `npm run test:integration` exercises the location/session API against local PostGIS and Redis.
- `npm run test:e2e` exercises browser UI, navigation matching and iPhone-sized responsive layout with isolated fixtures.
- `npm run acceptance:live-providers` verifies a real public routing result and real MapLibre vector map in Chromium; screenshot: `/tmp/marshgo-live-map-route.png` when successful.

## Boundaries

Local map matching is route projection, not a road-graph map matcher. Live public-provider acceptance is not proof of SLA, production hosting, or app GPS permission behavior on a phone. Background GPS, voice guidance, real device battery/network budgets, two-phone staging, and the full production golden path are still release gates.
