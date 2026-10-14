# Navigation Experience 6.0 — implementation audit

**Review branch:** `codex/navigation-experience-6`
**Candidate pins:** integration E2E source `142d20529c0a33006e0e9c1cd34877cc85c45865`, Server `64ed70c72fec06cb9418dc7feee67ae0acee3826`, Site `07644b0b91af777ede77edd51cca01e1d5bcff13`, iOS `375c2a34cf47a554e22b6319ba2a5f3e99c15029` (pins that exact Site SHA). Manifest/audit reconciliation is pending final umbrella CI.
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
| Confirmed rideshare rendezvous GPS | PARTIAL | Site binds a saved confirmed Community leg to its booking-scoped rendezvous snapshot, polls while visible, requires passenger authorization, shows only a fresh or explicitly stale driver fix, and does not invent a road route or ETA. Confirmed/active/terminal Journey legs no longer expose a duplicate booking action. Driver profile, three route shapes, event-driven refresh, full booking states and physical-device background behavior remain incomplete. |
| Full multimodal provider coverage | PARTIAL / BLOCKED_EXTERNAL | Current Journey results reflect connected scheduled feeds and Community offers only. UI categories do not establish live routing. Provider registry records pending partner credentials/agreements; OSM rental locations do not establish live inventory or return rules. |
| iOS bundle compilation | IMPLEMENTED / PARTIAL acceptance | iOS PR #5 simulator CI passes after checking out the exact Site commit. Physical-device GPS, background execution, APNs and TestFlight are not accepted. |
| Load/performance SLO | NOT_TESTED | No new OSRM/provider request reduction, route latency, capacity or 100-identical-request measurement was taken. This UI/map-source change does not alter the Server routing gateway. |

## Data truth and external blockers

- Do not show a scheduled-only vehicle as LIVE or infer its arrival from straight-line distance.
- To complete bus stop approach tracking, provide an accepted city/operator feed contract and route pattern/stop sequence/vehicle updates that can identify direction, future served stops and timestamps. Feed coverage and retention terms must be approved for the launch cities.
- The Journey-bound rendezvous UI and repeat-booking guard are implemented on Site SHA `07644b0b91af777ede77edd51cca01e1d5bcff13`; the final focused production-bundle E2E asserts stale GPS display, no invented ETA, participant scope, and no duplicate booking. Local execution is blocked by unavailable isolated PostGIS; final exact-pin hosted validation is pending. Use a road route/ETA provider only when configured and scope exact GPS to confirmed booking participants.
- Partner transfer/taxi inventory, fares and booking require the relevant commercial API credentials, agreement, quota and display permission. APNs/background GPS and physical iPhone acceptance require Apple setup and devices.
- Production target verification on 2026-10-14: GitHub API metadata shows zero configured environments, zero deployment records, and no Actions secret names in each of MarshGO, MarshGO-Server, MarshGO-Site and MarshGO-iOS. A gcloud project ID exists locally, but Resource Manager returned `USER_PROJECT_DENIED`; Cloud Run Admin API is disabled and its service inventory could not be read. No remote setting or project resource was changed.

## Verification

Site checks on the current feature worktree:

- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm test` — PASS, 91 tests, 0 failures.
- `npm run build` — PASS.
- `npm run check:bundle` — PASS, 17 JavaScript chunks and each under the 350 KB gzip budget.
- Journey route-map Playwright E2E — prior hosted run `38529588348` passed 11/12; its only failure was the expected anonymous `/auth/refresh` 401 logged as a generic console error. The test now classifies only that first anonymous probe as expected, while retaining failures for any later 401. Final exact-pin execution is pending. Local runner stopped before tests because `127.0.0.1:5434` had no isolated PostGIS service.
- Site PR #6 hosted verification — PASS on exact SHA `07644b0b91af777ede77edd51cca01e1d5bcff13`; jobs `38530585543` and `38530591699` pass. Local lint, typecheck, 91/91 tests, production build and 17-chunk gzip budget pass.
- iOS PR #5 exact simulator pin — iOS SHA `375c2a34cf47a554e22b6319ba2a5f3e99c15029` pins Site `07644b0b91af777ede77edd51cca01e1d5bcff13`; simulator runs `38530627859` and `38530633018` pass. Physical-device GPS, background behavior and authenticated Journey UI are not covered by simulator build checks.
- Local umbrella lint, typecheck, 231/231 unit tests, production build and 51-chunk bundle gate pass on Node 25.4.0, outside its declared `>=24.21.0 <25` range. Hosted root CI on a supported runtime is validating earlier Site/iOS pins; the final exact-pin run is pending.

The production bundle size and passing fixture E2E are not production latency or feed-availability measurements. No OSRM/provider request reduction is claimed.

## Hosted integration candidate CI

- Umbrella PR #3 run `38529588348` — IN PROGRESS on the earlier Site `a9859ba` / iOS `a33e78c` pins; checks through Docker image build passed, Playwright and browser compatibility are not complete. Security run `38529588183` — PASS (Gitleaks and CodeQL).
- Final umbrella PR #3 run for Site `07644b0`, iOS `375c2a3` and E2E source `142d205` — pending manifest push. Run `38530975014` is still validating the same Site/iOS pins with the previous E2E classifier.
- Site PR #6 exact SHA `07644b0b91af777ede77edd51cca01e1d5bcff13` — both hosted verification jobs pass.
- iOS PR #5 exact SHA `375c2a34cf47a554e22b6319ba2a5f3e99c15029`, pinned to the exact Site SHA — both simulator jobs pass.

These checks validate this review candidate and fixtures; they do not establish provider availability, production load SLOs, physical iPhone behavior, or production readiness.

## Readiness estimate

These percentages are milestone coverage estimates, not an SLO or release approval.

| Scope | Estimate | Basis |
|---|---:|---|
| UI | 73% | Shared route lip, route results/map/detail and sheet states are implemented; saved Journey rendezvous status is now connected, while live bus focus, full rideshare pickup flow and four of 12 theme screenshots remain. |
| Routing | 55% | Existing Journey search, leg geometry, transfers and selected-segment map focus work for available sources; complete regional/multimodal coverage and live transfer recovery are absent. |
| Transport feeds | 40% | Some catalogued GTFS/GTFS-RT, GBFS and static OSM sources exist; there is no evidence of nationwide live coverage, A56 stop-arrival matching or partner access. |
| GPS/realtime | 53% | Foreground navigation GPS and participant-scoped rendezvous are now bound to saved Community legs with stale-data handling; predictive bus arrival, event-driven updates and background GPS are incomplete. |
| iOS | 46% | Capacitor packaging and simulator CI pass with the exact new Site SHA; physical-device GPS, background and authenticated Journey acceptance are absent. |
| Overall production readiness | 25% | Release remains `NOT_RELEASED`; production hosting, partner credentials, full provider coverage, load/SLO evidence and physical iPhone acceptance are not established. |

## Remaining work

1. Complete the 12 light/dark visual baselines and scenario-specific behavior tests.
2. Add a provider-backed transit stop-arrival API only after route-pattern/stop sequence data are available; retain explicit stale/unavailable states.
3. Complete rideshare pickup geometry/ETA and full booking-state transitions when a road-routing ETA source is configured.
4. Validate the saved Journey rendezvous flow against the exact integration production bundle, then obtain physical-device acceptance for GPS and lifecycle behavior.
5. Run multi-instance/provider load tests and report actual latency and upstream call counts before defining achieved SLOs.
6. The manifest pins the tested integration source commit; the final manifest-only reconciliation commit may advance the branch without changing the tested code SHA. Keep `NOT_RELEASED` until the remaining release criteria pass.
