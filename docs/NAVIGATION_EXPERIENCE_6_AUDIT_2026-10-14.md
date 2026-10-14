# Navigation Experience 6.0 — implementation audit

**Review branch:** `codex/navigation-experience-6`
**Candidate pins:** integration E2E source `95b23252d834e09ae1feda84a38e6d8da4489b52`, Server `64ed70c72fec06cb9418dc7feee67ae0acee3826`, Site `22fe4f1089f3acfb342e8a8399ca8e9fe4cd1730`, iOS `c304ae30b19bdaca57931baedeec4ffde02bca2d` (pins that exact Site SHA). Site CI is green; exact-pin iOS and umbrella validation are pending.
**Release status:** `NOT_RELEASED`; no production deployment or staging SLO claim.

## Implemented in this change

- Site now uses one `CanonicalRouteLip` in journey result cards and the selected-route sheet. It presents duration, integer-minor-unit fare, transfer count, strategy, favorite action, duration-weighted mode ribbon and selectable segment labels. Unknown fare stays `—`; estimated/dynamic fare is marked approximate; a locked UAH fare is formatted in hryvnias.
- The canonical labels place each transport icon to the left of the name and its time/fare. Long itineraries retain the full proportional ribbon and scroll the labels horizontally.
- The existing Journey sheet, route detail timeline and map camera/segment focus are retained. Existing compact/half/expanded snap points remain the source of sheet state.
- MapLibre now batches exact journey vehicle positions into one GeoJSON source. It accepts only identified positions with valid geographic coordinates and timestamps within the existing freshness window, and restores them after style reload. The old single-position adapter call remains compatible.
- A confirmed, participant-authorized Community rendezvous with a fresh driver fix can request a road route through the existing authenticated `/routing/calculate` API. The map draws the provider geometry in a separate teal GeoJSON layer only when the fix is at most 90 seconds old, accuracy is at most 100 m, and the response is fresh OSRM. The displayed duration/distance is explicitly a baseline without live traffic; stale or unavailable data produces no route or numeric ETA.
- Explicit route-panel theme selectors prevent the global dark class from overriding a user-selected light route. Existing Light/Dark switching and map-theme handling remain intact.

## Capability status

| Area | Status | Evidence and limits |
|---|---|---|
| Results, compact route, half sheet, full details | IMPLEMENTED | Existing journey search/map UI now shares the canonical component. Existing E2E covers results plus route map in half, compact and expanded positions. |
| Light and dark appearance | PARTIAL | Eight deterministic golden states (results and three sheet positions in both themes) are exercised. The six requested scenarios do not yet have all 12 visual states. |
| Selected route segment and map focus | IMPLEMENTED | Existing route geometry, stop detail and segment focus stay wired to stable journey leg IDs; exercised by journey route-map E2E. |
| Exact scheduled-journey vehicle position | IMPLEMENTED, provider-dependent | Server `GET /api/v1/journeys/:id/live` is owner-authenticated and only matches a fresh GTFS-RT vehicle to the exact provider/route/trip/service window. The client renders all such returned leg positions in one GeoJSON source. The map does not infer other vehicles from a route number. |
| Buses approaching a selected boarding stop | PARTIAL / BLOCKED_EXTERNAL | No current API supplies route-pattern/stop-sequence direction matching and ETA for all vehicles approaching that selected stop. A live position on the selected line is not proof the vehicle can serve the passenger. No A56-specific provider acceptance was performed. |
| Confirmed rideshare rendezvous GPS and road approach | PARTIAL | Site binds a saved confirmed Community leg to its booking-scoped rendezvous snapshot, polls while visible, requires passenger authorization, and shows only a fresh or explicitly stale driver fix. A fresh fix can request and draw a fresh OSRM road route with a baseline time/distance label. Confirmed/active/terminal Journey legs no longer expose a duplicate booking action. Driver profile, completed/approach/future route segmentation, event-driven refresh, full booking states, actual OSRM availability, and physical-device background behavior remain incomplete. |
| Full multimodal provider coverage | PARTIAL / BLOCKED_EXTERNAL | Current Journey results reflect connected scheduled feeds and Community offers only. UI categories do not establish live routing. Provider registry records pending partner credentials/agreements; OSM rental locations do not establish live inventory or return rules. |
| iOS bundle compilation | IMPLEMENTED / PARTIAL acceptance | iOS PR #5 simulator CI passes after checking out the exact Site commit. Physical-device GPS, background execution, APNs and TestFlight are not accepted. |
| Load/performance SLO | NOT_TESTED | No new OSRM/provider request reduction, route latency, capacity or 100-identical-request measurement was taken. This UI/map-source change does not alter the Server routing gateway. |

## Data truth and external blockers

- Do not show a scheduled-only vehicle as LIVE or infer its arrival from straight-line distance.
- To complete bus stop approach tracking, provide an accepted city/operator feed contract and route pattern/stop sequence/vehicle updates that can identify direction, future served stops and timestamps. Feed coverage and retention terms must be approved for the launch cities.
- The Journey-bound rendezvous UI, repeat-booking guard, and OSRM baseline approach layer are implemented on Site SHA `22fe4f1089f3acfb342e8a8399ca8e9fe4cd1730`. The updated umbrella E2E checks stale GPS has no route/ETA and a fresh participant-authorized GPS fix receives only an OSRM test response. Site CI is green; exact-pin iOS and umbrella E2E are pending. Production OSRM availability/configuration and traffic-aware ETA are not verified.
- Partner transfer/taxi inventory, fares and booking require the relevant commercial API credentials, agreement, quota and display permission. APNs/background GPS and physical iPhone acceptance require Apple setup and devices.
- Production target verification on 2026-10-14: GitHub API metadata shows zero configured environments, zero deployment records, and no Actions secret names in each of MarshGO, MarshGO-Server, MarshGO-Site and MarshGO-iOS. A gcloud project ID exists locally, but Resource Manager returned `USER_PROJECT_DENIED`; Cloud Run Admin API is disabled and its service inventory could not be read. No remote setting or project resource was changed.

## Verification

Site checks on the current feature worktree:

- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm test` — PASS, 92 tests, 0 failures.
- `npm run build` — PASS.
- `npm run check:bundle` — PASS, 17 JavaScript chunks and each under the 350 KB gzip budget.
- Journey route-map Playwright E2E — previous exact-manifest run `38534486384` passed 12/12 on the previous pins. Updated source `95b23252d834e09ae1feda84a38e6d8da4489b52` adds fresh OSRM-route/stale-GPS assertions; exact-pin hosted run is pending. Local run is unavailable because loopback PostGIS at `127.0.0.1:5434` does not respond.
- Browser compatibility — exact-manifest run `38534486384` passed 6/6 across Chromium, Firefox and WebKit. It covers responsive sign-in/home/search and the canonical route map. In Xvfb/software Mesa only the renderer's exact GPU-stall/context-loss console diagnostics are filtered; the route test now separately asserts the final MapLibre canvas has a usable WebGL context. Local browser E2E could not start because isolated PostGIS at `127.0.0.1:5434` is unavailable.
- Site PR #6 hosted verification — PASS on exact SHA `22fe4f1089f3acfb342e8a8399ca8e9fe4cd1730`; run `38540584371` passes. Local lint, typecheck, 92/92 tests, production build and 17-chunk gzip budget pass.
- iOS PR #5 now pins Site `22fe4f1089f3acfb342e8a8399ca8e9fe4cd1730` on iOS SHA `c304ae30b19bdaca57931baedeec4ffde02bca2d`; simulator CI is pending. Physical-device GPS, background behavior and authenticated Journey UI are not covered by simulator build checks.
- Local umbrella lint, typecheck, 231 unit tests (0 failures, 1 opt-in skip), production build and 51-chunk bundle gate pass on Node 25.4.0, outside its declared `>=24.21.0 <25` range. The revised test source passes local lint, typecheck and unit tests. Exact-pin hosted CI on the supported runtime passed all verification steps.

The production bundle size and passing fixture E2E are not production latency or feed-availability measurements. No OSRM/provider request reduction is claimed.

## Hosted integration candidate CI

- Previous exact-pin run `38534486384` on the previous pins passed the full pipeline. The updated candidate uses Site `22fe4f1`, iOS `c304ae3`, and E2E source `95b2325`; current exact-manifest CI result is pending.
- The previous run `38531935261` exposed software Mesa GPU/context diagnostics. Follow-up source `bc32abc710a4e3e7c27e77207ee0671f82621598` filters only those exact diagnostics under Xvfb and asserts that the final canvas WebGL context is usable; it passed in the exact-manifest rerun.
- Site PR #6 exact SHA `22fe4f1089f3acfb342e8a8399ca8e9fe4cd1730` — hosted verification run `38540584371` passes.
- iOS PR #5 exact SHA `c304ae30b19bdaca57931baedeec4ffde02bca2d` pins the exact Site SHA; simulator validation is pending.

The checks validate this review candidate and fixtures; they do not establish provider availability, production load SLOs, physical iPhone behavior, or production readiness.

## Readiness estimate

These percentages are milestone coverage estimates, not an SLO or release approval.

| Scope | Estimate | Basis |
|---|---:|---|
| UI | 74% | Shared route lip, route results/map/detail and sheet states are implemented; saved Journey rendezvous now draws an authorized OSRM baseline approach, while live bus focus, full rideshare pickup flow and four of 12 theme screenshots remain. |
| Routing | 55% | Existing Journey search, leg geometry, transfers and selected-segment map focus work for available sources; complete regional/multimodal coverage and live transfer recovery are absent. |
| Transport feeds | 40% | Some catalogued GTFS/GTFS-RT, GBFS and static OSM sources exist; there is no evidence of nationwide live coverage, A56 stop-arrival matching or partner access. |
| GPS/realtime | 55% | Foreground navigation GPS and participant-scoped rideshare rendezvous now include stale-data handling and fresh-fix OSRM geometry; predictive bus arrival, traffic-aware ETA, event-driven updates and background GPS are incomplete. |
| iOS | 46% | Capacitor packaging and simulator CI pass with the exact new Site SHA; physical-device GPS, background and authenticated Journey acceptance are absent. |
| Overall production readiness | 25% | Release remains `NOT_RELEASED`; production hosting, partner credentials, full provider coverage, load/SLO evidence and physical iPhone acceptance are not established. |

## Remaining work

1. Complete the 12 light/dark visual baselines and scenario-specific behavior tests.
2. Add a provider-backed transit stop-arrival API only after route-pattern/stop sequence data are available; retain explicit stale/unavailable states.
3. Validate configured production OSRM availability, then add completed/approach/future rideshare route segmentation and full booking-state transitions without implying traffic-aware ETA.
4. Obtain physical-device acceptance for GPS and lifecycle behavior; hosted browser coverage does not verify native iPhone background execution.
5. Run multi-instance/provider load tests and report actual latency and upstream call counts before defining achieved SLOs.
6. The manifest pins the tested integration source commit; the final manifest-only reconciliation commit may advance the branch without changing the tested code SHA. Keep `NOT_RELEASED` until the remaining release criteria pass.
