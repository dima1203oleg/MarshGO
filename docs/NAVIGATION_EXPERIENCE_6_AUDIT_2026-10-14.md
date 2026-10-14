# Navigation Experience 6.0 — implementation audit

**Review branch:** `codex/navigation-experience-6`
**Candidate pins:** umbrella source `e34b5c6e547f19155486176d3eca2129ba3d17db`, Server `64ed70c72fec06cb9418dc7feee67ae0acee3826`, Site `52ec4f7c888d9ca9a671b0e858a9f018406034b1`, iOS `7b9e631a99b025cb2f421dabc666360135c966fc` (pins that exact Site SHA).
**Release status:** `NOT_RELEASED`; no production deployment or staging SLO claim.

## Implemented in this change

- Site now uses one `CanonicalRouteLip` in journey result cards and the selected-route sheet. It presents duration, integer-minor-unit fare, transfer count, strategy, favorite action, duration-weighted mode ribbon and selectable segment labels. Unknown fare stays `—`; estimated/dynamic fare is marked approximate; a locked UAH fare is formatted in hryvnias.
- The canonical labels place each transport icon to the left of the name and its time/fare. Long itineraries retain the full proportional ribbon and scroll the labels horizontally.
- The existing Journey sheet, route detail timeline and map camera/segment focus are retained. Existing compact/half/expanded snap points remain the source of sheet state.
- MapLibre now batches exact journey vehicle positions into one GeoJSON source. It accepts only identified positions with valid geographic coordinates and timestamps within the existing freshness window, and restores them after style reload. The old single-position adapter call remains compatible.
- Explicit route-panel theme selectors prevent the global dark class from overriding a user-selected light route. Existing Light/Dark switching and map-theme handling remain intact.

## Capability status

| Area | Status | Evidence and limits |
|---|---|---|
| Results, compact route, half sheet, full details | IMPLEMENTED | Existing journey search/map UI now shares the canonical component. Existing E2E covers results plus route map in half, compact and expanded positions. |
| Light and dark appearance | PARTIAL | Eight deterministic golden states (results and three sheet positions in both themes) are exercised. The six requested scenarios do not yet have all 12 visual states. |
| Selected route segment and map focus | IMPLEMENTED | Existing route geometry, stop detail and segment focus stay wired to stable journey leg IDs; exercised by journey route-map E2E. |
| Exact scheduled-journey vehicle position | IMPLEMENTED, provider-dependent | Server `GET /api/v1/journeys/:id/live` is owner-authenticated and only matches a fresh GTFS-RT vehicle to the exact provider/route/trip/service window. The client renders all such returned leg positions in one GeoJSON source. The map does not infer other vehicles from a route number. |
| Buses approaching a selected boarding stop | PARTIAL / BLOCKED_EXTERNAL | No current API supplies route-pattern/stop-sequence direction matching and ETA for all vehicles approaching that selected stop. A live position on the selected line is not proof the vehicle can serve the passenger. No A56-specific provider acceptance was performed. |
| Confirmed rideshare rendezvous GPS | PARTIAL | The Server has booking-participant authorization, short-lived GPS and rendezvous lifecycle. This Journey screen does not yet bind those events to a rideshare leg with three route shapes, driver profile, route ETA and the full booking states. |
| Full multimodal provider coverage | PARTIAL / BLOCKED_EXTERNAL | Current Journey results reflect connected scheduled feeds and Community offers only. UI categories do not establish live routing. Provider registry records pending partner credentials/agreements; OSM rental locations do not establish live inventory or return rules. |
| iOS bundle compilation | IMPLEMENTED / PARTIAL acceptance | iOS PR #4 simulator CI passes after checking out the exact Site commit. Physical-device GPS, background execution, APNs and TestFlight are not accepted. |
| Load/performance SLO | NOT_TESTED | No new OSRM/provider request reduction, route latency, capacity or 100-identical-request measurement was taken. This UI/map-source change does not alter the Server routing gateway. |

## Data truth and external blockers

- Do not show a scheduled-only vehicle as LIVE or infer its arrival from straight-line distance.
- To complete bus stop approach tracking, provide an accepted city/operator feed contract and route pattern/stop sequence/vehicle updates that can identify direction, future served stops and timestamps. Feed coverage and retention terms must be approved for the launch cities.
- To complete rideshare tracking, bind the authenticated confirmed booking to the existing rendezvous session, define passenger-visible status/fields, and use an available road route/ETA provider. This must remain participant-scoped; exact GPS must not enter a public cache.
- Partner transfer/taxi inventory, fares and booking require the relevant commercial API credentials, agreement, quota and display permission. APNs/background GPS and physical iPhone acceptance require Apple setup and devices.

## Verification

Site checks on the current feature worktree:

- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm test` — PASS, 84 tests, 0 failures.
- `npm run build` — PASS.
- `npm run check:bundle` — PASS, 17 JavaScript chunks and each under the 350 KB gzip budget.
- Journey route-map Playwright E2E — PASS 1/1 on the production bundle and isolated PostGIS/Redis fixture, including results, segment focus, stop details, map sheet positions and both themes. The full browser run passed 11/12; its only failure was an outdated test selector that picked the favorite action. Replacing it with the explicit accessible Open Route selector made that previously failing scenario pass 1/1 on a focused rerun. Combined evidence covers all 12 scenarios, but the full suite was not rerun after the selector fix.
- Site PR #5 hosted verification — PASS on exact SHA `52ec4f7c888d9ca9a671b0e858a9f018406034b1`, both jobs.
- iOS PR #4 hosted simulator checks — PASS on exact iOS SHA `7b9e631a99b025cb2f421dabc666360135c966fc`, pinning the exact Site SHA above. A local iPhone 15 Pro Max simulator build/install/launch also passed and rendered the Welcome screen (`/tmp/marshgo-nav6-iphone15-simulator.png`); the API was not running, so this does not verify authenticated Journey UI or GPS.
- Local umbrella commands used Node 25.4.0, outside its declared `>=24.21.0 <25` range. Umbrella local production check passes, but the new candidate’s exact-runtime hosted CI is pending. Site PR #5 and iOS PR #4 hosted checks pass on their exact pinned SHAs. Rerun exact-runtime integration CI before release.

The production bundle size and passing fixture E2E are not production latency or feed-availability measurements. No OSRM/provider request reduction is claimed.

## Readiness estimate

These percentages are milestone coverage estimates, not an SLO or release approval.

| Scope | Estimate | Basis |
|---|---:|---|
| UI | 70% | Shared route lip, route results/map/detail and sheet states are implemented; live bus and rideshare scenarios plus four of 12 theme screenshots remain. |
| Routing | 55% | Existing Journey search, leg geometry, transfers and selected-segment map focus work for available sources; complete regional/multimodal coverage and live transfer recovery are absent. |
| Transport feeds | 40% | Some catalogued GTFS/GTFS-RT, GBFS and static OSM sources exist; there is no evidence of nationwide live coverage, A56 stop-arrival matching or partner access. |
| GPS/realtime | 50% | Foreground navigation GPS, exact journey-vehicle matching and protected rendezvous primitives exist; full journey rideshare tracking, predictive bus arrival and background GPS are incomplete. |
| iOS | 45% | Capacitor packaging and simulator CI pass with the exact Site SHA; physical-device GPS, background and authenticated Journey acceptance are absent. |
| Overall production readiness | 25% | Release remains `NOT_RELEASED`; production hosting, partner credentials, full provider coverage, load/SLO evidence and physical iPhone acceptance are not established. |

## Remaining work

1. Complete the 12 light/dark visual baselines and scenario-specific behavior tests.
2. Add a provider-backed transit stop-arrival API only after route-pattern/stop sequence data are available; retain explicit stale/unavailable states.
3. Bind confirmed rideshare booking and rendezvous events to a privacy-scoped Journey tracking view.
4. Build the exact Site SHA in iOS simulator CI and obtain physical-device acceptance for GPS and lifecycle behavior.
5. Run multi-instance/provider load tests and report actual latency and upstream call counts before defining achieved SLOs.
6. The manifest pins the tested integration source commit; the final manifest-only reconciliation commit may advance the branch without changing the tested code SHA. Keep `NOT_RELEASED` until the remaining release criteria pass.
