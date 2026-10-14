# Navigation Experience 6.0 — implementation audit

**Review branch:** `feature/unified-repository-governance` (central PR #4; based on `codex/navigation-experience-6`)
**Candidate pins:** integration E2E source `c93178e87f56725f3a90160473265b478a638fd3`, Server `6307bfcd3f7c76616280fb886e3a2d4cbab199b2`, Site `02c01a609cad41f1551c1861a44122242534e37a`, iOS `25630b202bef5be90be57a0147cfe69059729916` (pins that exact Site SHA). Server, Site, and iOS component CI passed. Corrected central run `38603092516` passed E2E 12/12 and browser compatibility 6/6; security runs `38603086054` and `38603092541` passed. Initial run `38598032870` failed WebKit 5/6 on the previous Site pin.
**Release status:** `NOT_RELEASED`; no production deployment or staging SLO claim.

## Implemented in this change

- Site now uses one `CanonicalRouteLip` in journey result cards and the selected-route sheet. It presents duration, integer-minor-unit fare, transfer count, strategy, favorite action, duration-weighted mode ribbon and selectable segment labels. Unknown fare stays `—`; estimated/dynamic fare is marked approximate; a locked UAH fare is formatted in hryvnias.
- The canonical labels place each transport icon to the left of the name and its time/fare. Long itineraries retain the full proportional ribbon and scroll the labels horizontally.
- The existing Journey sheet, route detail timeline and map camera/segment focus are retained. Existing compact/half/expanded snap points remain the source of sheet state.
- MapLibre now batches exact journey vehicle positions into one GeoJSON source. It accepts only identified positions with valid geographic coordinates and timestamps within the existing freshness window, and restores them after style reload. The old single-position adapter call remains compatible.
- A confirmed, participant-authorized Community rendezvous with a fresh driver fix can request a road route through the existing authenticated `/routing/calculate` API. The map draws the provider geometry in a separate teal GeoJSON layer only when the fix is at most 90 seconds old, accuracy is at most 100 m, and the response is fresh OSRM. The displayed duration/distance is explicitly a baseline without live traffic; stale or unavailable data produces no route or numeric ETA.
- Explicit route-panel theme selectors prevent the global dark class from overriding a user-selected light route. Existing Light/Dark switching and map-theme handling remain intact.
- The Server stop-arrival endpoint exposes the source timestamp even when a GTFS-RT snapshot is stale. The shared Site API client preserves response metadata and labels fresh, stale, unavailable, schedule-only and unsupported states; a stale feed keeps scheduled arrival estimates visible and explicitly identifies them as schedule-based.

## Capability status

| Area | Status | Evidence and limits |
|---|---|---|
| Results, compact route, half sheet, full details | IMPLEMENTED | Existing journey search/map UI now shares the canonical component. Existing E2E covers results plus route map in half, compact and expanded positions. |
| Light and dark appearance | PARTIAL | Eight deterministic golden states (results and three sheet positions in both themes) are exercised. The six requested scenarios do not yet have all 12 visual states. |
| Selected route segment and map focus | IMPLEMENTED | Existing route geometry, stop detail and segment focus stay wired to stable journey leg IDs; exercised by journey route-map E2E. |
| Exact scheduled-journey vehicle position | IMPLEMENTED, provider-dependent | Server `GET /api/v1/journeys/:id/live` is owner-authenticated and only matches a fresh GTFS-RT vehicle to the exact provider/route/trip/service window. The client renders all such returned leg positions in one GeoJSON source. The map does not infer other vehicles from a route number. |
| Selected stop arrivals and freshness | IMPLEMENTED, provider-dependent | Server `/api/v1/transit/stops/:stopId/arrivals` returns up to three route/headsign-matched arrivals and distinguishes the last GTFS-RT feed timestamp from the timestamp of accepted live data. Site preserves `meta`, labels stale/unavailable data, and continues to identify scheduled ETA as schedule-based. Central run 38603092516 passed the stale-fallback E2E and full browser matrix. This does not establish local feed coverage or every approaching vehicle's future stop sequence. |
| Buses approaching a selected boarding stop | PARTIAL / BLOCKED_EXTERNAL | Stop-scoped scheduled/realtime arrivals can be shown when the itinerary contains provider, route, headsign and stop identifiers. Route-pattern/stop-sequence coverage for all approaching vehicles remains provider-dependent. A live position on the selected line is not proof the vehicle can serve the passenger. No A56-specific provider acceptance was performed. |
| Confirmed rideshare rendezvous GPS and road approach | PARTIAL | Site binds a saved confirmed Community leg to its booking-scoped rendezvous snapshot, polls while visible, requires passenger authorization, and shows only a fresh or explicitly stale driver fix. A fresh fix can request and draw a fresh OSRM road route with a baseline time/distance label. Confirmed/active/terminal Journey legs no longer expose a duplicate booking action. Driver profile, completed/approach/future route segmentation, event-driven refresh, full booking states, actual OSRM availability, and physical-device background behavior remain incomplete. |
| Full multimodal provider coverage | PARTIAL / BLOCKED_EXTERNAL | Current Journey results reflect connected scheduled feeds and Community offers only. UI categories do not establish live routing. Provider registry records pending partner credentials/agreements; OSM rental locations do not establish live inventory or return rules. |
| iOS bundle compilation | IMPLEMENTED / PARTIAL acceptance | iOS PR #5 simulator CI passes after checking out the exact Site commit. Physical-device GPS, background execution, APNs and TestFlight are not accepted. |
| Load/performance SLO | NOT_TESTED | No new OSRM/provider request reduction, route latency, capacity or 100-identical-request measurement was taken. This UI/map-source change does not alter the Server routing gateway. |

## Data truth and external blockers

- Do not show a scheduled-only vehicle as LIVE or infer its arrival from straight-line distance.
- To complete bus stop approach tracking, provide an accepted city/operator feed contract and route pattern/stop sequence/vehicle updates that can identify direction, future served stops and timestamps. Feed coverage and retention terms must be approved for the launch cities.
- The Journey-bound rendezvous UI, repeat-booking guard, and OSRM baseline approach layer are implemented on the Site base SHA `22fe4f1089f3acfb342e8a8399ca8e9fe4cd1730`. Earlier exact-manifest E2E verifies stale GPS has no route/ETA and a fresh participant-authorized GPS fix receives only an OSRM test response. Production OSRM availability/configuration and traffic-aware ETA are not verified.
- Stop-arrival availability is intentionally provider-scoped. A stale GTFS-RT feed timestamp explains the fallback; it does not turn the scheduled ETA into a prediction. Site covers stale timestamps and API metadata preservation; the central E2E for the prior Site pin passed its stale-feed assertion. The corrected Site pin still needs a fresh central browser run.
- Partner transfer/taxi inventory, fares and booking require the relevant commercial API credentials, agreement, quota and display permission. APNs/background GPS and physical iPhone acceptance require Apple setup and devices.
- Production target verification on 2026-10-14: GitHub API metadata shows zero configured environments, zero deployment records, and no Actions secret names in each of MarshGO, MarshGO-Server, MarshGO-Site and MarshGO-iOS. A gcloud project ID exists locally, but Resource Manager returned `USER_PROJECT_DENIED`; Cloud Run Admin API is disabled and its service inventory could not be read. No remote setting or project resource was changed.

## Verification

Current component and central local checks:

- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm test` — PASS, 233 passed, 1 opt-in skip (234 total).
- `npm run lint` and `npm run typecheck` — PASS with the updated central E2E fixture.
- `npm run build` — PASS.
- `npm run check:bundle` — PASS, 17 JavaScript chunks and each under the 350 KB gzip budget.
- Historical Journey route-map Playwright E2E run `38553693818` passed 12/12 on the earlier root/Server/Site/iOS pins and source `6c4be052eb639224ed0ac4d04bd050355f4be6f5`; it covered rendezvous behavior, not stop-arrival freshness. Local browser run is unavailable because loopback PostGIS at `127.0.0.1:5434` does not respond.
- Browser compatibility — exact-manifest run `38553693818` passed 6/6 across Chromium, Firefox and WebKit. It covers responsive sign-in/home/search and the canonical route map. In Xvfb/software Mesa only the renderer's exact GPU-stall/context-loss console diagnostics are filtered; the route test separately asserts the final MapLibre canvas has a usable WebGL context. Local browser E2E could not start because isolated PostGIS at `127.0.0.1:5434` is unavailable.
- Server PR #6 exact SHA `6307bfcd3f7c76616280fb886e3a2d4cbab199b2` — hosted runs `38597029563` and `38597025754` passed audit, lint, typecheck, 201 unit tests plus 3 opt-in skips, migration and integration checks.
- Site PR #7 exact SHA `02c01a609cad41f1551c1861a44122242534e37a` — hosted runs `38602030648` and `38602038038` passed lint, typecheck, production build and bundle gate; local suite passed 98/98. Source-map investigation of the prior WebKit failure found a successful HTTP 200 with an empty body was exposed as `undefined`; the wrapper now rejects missing `data` envelopes.
- iOS PR #5 exact SHA `25630b202bef5be90be57a0147cfe69059729916` pins exact Site `02c01a609cad41f1551c1861a44122242534e37a`; simulator run `38602492704` passed exact checkout verification, Site build, Capacitor sync and iOS Simulator compile. No physical-device GPS, background behavior, APNs, or authenticated Journey claim.
- Central PR #4 run `38603092516` on head `030be55bfb5da953c8978fb1701f57b871da3a47` passed the complete exact-manifest verify job and security. E2E passed 12/12 and browser compatibility 6/6, including WebKit's saved Journey reload. Site `02c01a6…` rejects a missing API `data` envelope; this addresses the prior error mapped to `passengerNavigationMatches.length`. The previous Site pin's initial run `38598032870` failed browser compatibility 5/6; the obsolete retry was superseded by the corrected manifest.
- Historical exact-manifest umbrella run `38553693818` on declared Node 24.21.0 passed the earlier candidate's lint, typecheck, 231 unit tests plus one opt-in skip, migration, PostGIS/Redis integration, production build, bundle gate, release materialization, Docker builds, E2E 12/12 and browser compatibility 6/6. Security run `38553693919` passed CodeQL and Gitleaks; these runs do not test the current candidate.

The production bundle size and passing fixture E2E are not production latency or feed-availability measurements. No OSRM/provider request reduction is claimed.

## Hosted integration candidate CI

- Exact-manifest run `38553693818` on root SHA `c8aa46052e4b60b1ded708907e81e2e51a162584`, Server `64ed70c`, Site `22fe4f1`, iOS `c304ae3`, and E2E source `6c4be05` — PASS: lint, typecheck, 231 unit tests plus one opt-in skip, migration, PostGIS/Redis integration, production build, bundle check, release materialization, Docker image builds, E2E 12/12, and browser compatibility 6/6. Security run `38553693919` — PASS (CodeQL and Gitleaks).
- The previous run `38531935261` exposed software Mesa GPU/context diagnostics. Follow-up source `bc32abc710a4e3e7c27e77207ee0671f82621598` filters only those exact diagnostics under Xvfb and asserts that the final canvas WebGL context is usable; it passed in the exact-manifest rerun.
- Site PR #6 exact SHA `22fe4f1089f3acfb342e8a8399ca8e9fe4cd1730` — hosted verification run `38540584371` passes.
- iOS PR #5 exact SHA `c304ae30b19bdaca57931baedeec4ffde02bca2d` pins the exact Site SHA; simulator runs `38540734198` and `38540742501` pass.

The checks validate this review candidate and fixtures; they do not establish provider availability, production load SLOs, physical iPhone behavior, or production readiness.

## Readiness summary

- Journey map, route selection, sheet states, stop detail and theme behavior are implemented and covered by deterministic UI checks. Light/dark screenshots cover eight of the requested twelve states.
- Stop-arrival freshness is implemented across Server and Site and pinned by iOS. Corrected central run 38603092516 verified the stale disclosure and passed WebKit with the saved Journey reload. Provider coverage remains unverified.
- Multimodal routing and realtime are partial and depend on available feeds, provider contracts, and compatible route/stop identifiers.
- iOS build acceptance is simulator-only on the exact Site pin. Physical-device GPS, background behavior, APNs and authenticated Journey acceptance remain open.
- Release status is `NOT_RELEASED`: staging/production targets and credentials, integrated Admin/Partner compatibility, production image digests, provider coverage, performance SLO evidence, backup/restore rehearsal and rollback verification remain incomplete.

## Remaining work

1. Complete the 12 light/dark visual baselines and scenario-specific behavior tests.
2. Validate stop-arrival freshness against accepted city/operator feeds and add route-pattern/stop-sequence coverage for approaching-vehicle tracking; keep schedule-only fallback explicitly labeled.
3. Validate configured production OSRM availability, then add completed/approach/future rideshare route segmentation and full booking-state transitions without implying traffic-aware ETA.
4. Obtain physical-device acceptance for GPS and lifecycle behavior; hosted browser coverage does not verify native iPhone background execution.
5. Run multi-instance/provider load tests and report actual latency and upstream call counts before defining achieved SLOs.
6. The manifest pins the tested integration source commit; the final manifest-only reconciliation commit may advance the branch without changing the tested code SHA. Keep `NOT_RELEASED` until the remaining release criteria pass.
