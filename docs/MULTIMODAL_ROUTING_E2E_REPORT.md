# Multimodal routing E2E evidence

2026-11-14 19:08 UTC. **PARTIAL / NOT_RELEASED**.

## Automated fixtures

Command, executed from the orchestration workspace:

```sh
node --import /Users/dima1203/Desktop/MarshGO/node_modules/tsx/dist/loader.mjs --test /tmp/mgwt/chains/tests/journey-walking-routes.test.ts /tmp/mgwt/chains/tests/multimodal-walk-router.test.ts /tmp/mgwt/chains/tests/real-trunk-chains.test.ts
```

45 tests passed, zero failed/skipped, 740.432208 ms. Isolated HEAD `ad981095ede883b03e58f93417faf101872c7103` plus dirty patch. These are fixture tests, not production HTTP or browser evidence. Two new rejection-detail tests failed before implementation. Earlier cache/reuse negative controls are recorded in session history.

## Historical isolated live search: NOT ACCEPTED

Kyiv→Lviv, departure 2026-11-15 08:00 UTC, all 12 modes permitted:

| Stage | Recorded result |
|---|---|
| Before walking reuse/cache | 13 generated real chains; 13 route_unavailable; zero accepted real chains; 48.024 s |
| After reuse | 13 generated; 10 route_unavailable, 3 invalid_geometry; zero accepted real chains; 54.773 s |
| After request-local cache | 16 generated; 16 invalid_geometry; zero accepted real chains; 52.794 s |

These earlier probes used the now-stopped isolated API 3019, not the canonical contour. They diagnose failure, not acceptance or a demonstrated performance improvement. API 3019 and preview 4174 must not be restarted.

## Canonical Qoder browser

The current selected page is the existing zrok search backed by Web 7777. Its accessibility snapshot includes all 12 mode controls, search origin/destination controls and five-item navigation. Structural presence is not rendered acceptance.

Pointer testing failed with `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`: viewport 468×843, visible=false, attached=false, visibilityState=hidden. Computer Use inspection found a visible browser belonging to another chat session; it was not manipulated. No screenshot or search-result correctness is claimed for this checkpoint. The isolated patch is not loaded in active API 3002.

## Required 20-scenario matrix

All remain **NOT_TESTED against the current canonical patch**: bus-only; marshrutka-only; trolleybus-only; tram-only; metro-only; own-bike; eligible scooter; bus+tram; trolleybus+marshrutka; metro+bus; marshrutka+metro; train+urban transit; bike+transit; scooter+transit; carpool+train; intercity bus+urban transit; inter-oblast mixed; all 12 permitted; bus disabled; one mode enabled.

Each must verify API selected modes, source availability, schedule and transfer feasibility, visible chain, strategy, map geometry and disabled-mode exclusion. Empty results require diagnosis; HTTP 200 alone never passes.
