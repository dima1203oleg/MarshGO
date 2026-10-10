# MARSHGO Foundation v1.0 — implementation status

Date: 2026-09-30  
Decision: **Foundation is not frozen; public production and physical-device release are not approved.** This pass implements and locally verifies several missing foundation boundaries in the umbrella repository. A passing local build or simulator launch does not satisfy the external production and device gates.

## Implemented in this pass

- Replaced the production Leaflet map with a lazy-loaded MapLibre renderer behind `MapAdapter`; removed Leaflet and the fake moving-car map from the production path. MapLibre handles route, vehicle, waypoints, camera/theme, and renderer status. `MapPreview` renders only server-provided route geometry.
- Added a serializable, side-effect-free navigation reducer, `NavigationStore`, local GPS validation/provider, route projection matcher, session reconciliation, GPS-to-rendered-position updates without waiting for the server response, reroute effects, and connectivity transitions. Server-authoritative route/session versions and matching decisions remain on the server.
- Added a local offline route/session cache with runtime validation and 24-hour expiry. It omits precise `current_location`, disables matching on restore, and reconciles against the server after reconnect.
- Wrapped OSRM-compatible routing in a canonical provider path; added provider-neutral maneuvers and polyline6 route responses at `/api/v1/routing/calculate`. The legacy route path remains for compatibility.
- Added an owner-checked reroute endpoint with stale route-version/current-location checks. Successful reroutes increment the version and disable old matching candidates until driver opt-in.
- Split precise-position expiry from active navigation lifecycle. Accepted GPS activity refreshes a server timestamp; precise points expire after two minutes, while abandoned sessions/routes expire after 24 hours. A retention integration scenario verifies that a GPS gap preserves the active route and clears the stale precise point.
- Made all marketplace departure and offer times explicitly Europe/Kyiv-based instead of inheriting the phone/browser time zone; tested standard/daylight time, the spring DST gap, and the repeated autumn hour. Logout now best-effort closes active navigation and clears the local offline route cache.
- Added map style tokens/builders for the four MARSHGO themes, runtime checks for immutable style/data manifests, and PMTiles protocol registration. When production assets are not configured, the map reports a degraded/unconfigured state rather than pretending to have production road data.
- Added a partial Navigation/Routing OpenAPI document, GPS replay CLI with synthetic JSONL fixtures/goldens, navigation/provider/offline/manifest tests, and fail-closed map/routing environment validation with legacy routing URL compatibility.
- Updated mobile planner interactions and truthful route previews. The former demo route simulator was removed rather than exposed as live vehicle tracking.

## Verification evidence

| Gate | Result | Scope |
|---|---|---|
| `npm run check:production` | PASS | Node 24.21.0: TypeScript, lint, unit tests (66 pass, 1 skipped), production Vite build |
| `npx eslint src` | FAIL, 144 findings | 31 legacy/demo UI files outside the production lint target: 138 unused-symbol findings, 3 empty blocks, 3 useless assignments; no ESLint errors in the configured production lint scope |
| `npm run navigation:replay` | PASS | Four synthetic replay fixtures and expected golden output |
| `npm run test:e2e` | PASS, 5/5 | Runner created and migrated a fresh isolated loopback-only DB; onboarding, two-account marketplace/chat/booking, route matching/reroute, iPhone viewports, Journey Planner |
| `npm run test:integration` | PASS, 16 scenarios across 6 suites | Fresh isolated loopback DB; Journey, 11 API/booking cases, navigation, multi-instance Redis realtime, API restart durability, shared rate limit |
| `npm run ios:simulator` | PASS | Latest web bundle synced, built, installed and launched on iPhone 16 Pro Max simulator; previous run also launched on iPhone 15 Pro Max |
| Interactive iOS GPS/navigation flow | NOT VERIFIED | Simulator screenshot confirms first-launch screen only; no permissions, driving route or background transition tested |
| Physical iPhone acceptance | NOT RUN | Requires a device and staging credentials/provider configuration |

The production build reports the MapLibre chunk at about 285 KB gzip, below the stated 350 KB target; its uncompressed chunk is about 1.05 MB. The build still emits a large-chunk warning and a MapLibre worker URL resolution warning. Browser E2E uses deterministic local API, geocoder, router and tile fixtures; it verifies the renderer and interaction path, not live production data coverage. The test database/API used during simulator checks were local only; the temporary API process has been stopped. The latest simulator screenshot is `/tmp/marshgo-release-iphone16-20260930.png` and shows the first-launch welcome screen, not a signed-in navigation session.

## Remaining Foundation v1.0 gates

1. **Complete NavigationCore boundary:** `ProductionNavigation` still coordinates substantial session, API, matching and presentation logic. Move orchestration to dedicated controllers/effect runner and add import-boundary checks.
2. **Production map assets:** no deployed OSM/Planetiler vector PMTiles, signed/licensed attribution policy, immutable production style/data manifests, CDN/object storage or asset rollback has been provisioned. Current local/map fallback is not a production basemap. Traffic/incident layers and 3D buildings are not implemented.
3. **Canonical contracts end-to-end:** legacy navigation/session responses still carry compatibility geometry arrays; migrate clients/server fully to validated `RouteResult`/polyline6, legs and maneuvers while retaining old-client compatibility. The OpenAPI file covers only navigation/routing, not the whole `/api/v1` surface.
4. **Replay quality:** current fixtures are synthetic and cover only a subset (clean route, weak GPS, teleport, offline). Add consented/anonymized trace and all required urban/highway/tunnel/garage/off-route/multi-stop scenarios with stable golden metrics.
5. **Offline/degraded:** local route/session restore exists, but map-region/offline tile caching, voice guidance, complete maneuver continuation and interrupted-session device reconciliation are incomplete. No claim of fully offline navigation.
6. **Provider and UX extensions:** NoTraffic is the intended baseline, but traffic/incident rendering, ETA enhancement, voice/haptics, moving/stopped safe-driving interaction policy and full navigation camera policy remain incomplete. HERE/TomTom stay disabled.
7. **API/domain boundaries:** runtime schema validation is added to new contracts, but not every HTTP/WebSocket/stored/environment boundary is covered. Typed errors, ownership/actor propagation and versioned domain-event envelope/outbox consumer semantics are not end-to-end.
8. **Privacy operations:** navigation position/session retention now has executable TTL cleanup, but the complete location data inventory, deletion metrics, account deletion workflow, backup expiry policy and restore-and-redelete drill have not been accepted.
9. **Performance and operations:** no physical network/battery/performance baselines, production telemetry/alerts, deployed HTTPS staging, map/routing/geocoding service limits, rollback or restore drill.
10. **iOS and release management:** simulator launch is not physical acceptance. Test login, GPS permission, route start, location loss, background/foreground, session resume and precise-location cleanup on a real iPhone. Align/review all Site/Server/iOS release SHAs before shipping.

## Release decision

**FROZEN = NO. Production release = NO.** Do not create `foundation-v1.0` until every Definition of Done gate is evidenced. Do not advertise live traffic, offline maps, production road coverage, native background navigation or verified physical-device behavior. HERE/TomTom secrets remain server-only and providers remain off. This checkout has no `.env` or configured deployment domain, production database/Redis, SMS credentials, routing/geocoding endpoints, immutable map manifests, private object storage or monitoring service, and contains no host deployment manifest. Therefore no externally reachable production deployment or production smoke test was possible.
