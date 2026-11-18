# Audit 236 — current dirty Site full E2E and Server recheck — 2026-10-26

## Source identity and safety boundary

- Orchestrator: `codex/production-finalization-20261014` @ `c9aa130a6ec489281e2b5dda83de0c5857d2a144`, 317 paths dirty/untracked.
- Site: `codex/sync-journey-mobility-ui` @ `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e`, 46 paths dirty/untracked.
- Server: `feature/transport-layer-availability` @ `92a26a3f617f32d644a66c0af46cba096ccb0ce0`, 40 paths dirty/untracked.
- iOS: `codex/production-site-sync-20261014` @ `4353cec3cacbaf662ceea047402f361024292b22`, clean at inspection.
- Admin and Partner do not have local canonical checkouts in this workspace. This audit does not claim their current source was tested.
- Product-source changes were not made in this checkpoint. Existing dirty work was preserved. Browser E2E used current dirty Site and Server, Node `v24.22.1`, a newly isolated loopback database `marshgo_e2e_site_full_20261026`, and local map/geocoder/OSRM fixtures.
- No push, merge, release-manifest promotion, staging deployment, production deployment, container deletion, database deletion, or branch cleanup occurred.

## Current-source checks

| Area | Evidence | Result | Boundary |
|---|---|---|---|
| Server unit suite | Node 24.22.1, `npm test`: 241 tests total, 240 PASS, 0 FAIL, 1 opt-in integration SKIP | PASS (local) | One opt-in test is SKIP, not PASS. Dirty source. |
| Server loopback integration | `npm run test:integration` twice; each run: journey schema 2/2, live journey 1/1, booking/edit/cancel 21/21, navigation 2/2, cross-instance Redis realtime 1/1, restart durability 1/1, shared rate limit 1/1 | PASS 29/29 in each run | Local Postgres/PostGIS/Redis and enabled/cached Lviv provider snapshot; not live-provider SLA, staging, or production. |
| Site static gates | TypeScript, ESLint, 99/99 unit tests, production build to `/tmp/marshgo-site-build-20261026` | PASS | Dirty source; build is not a deployed artifact. |
| Site main controls | Full visible-control sweep clicked 169 controls; 0 no-effect, 0 stale-before-click | PASS (browser behavior) | Does not prove provider-side effects for unavailable integrations. |
| Site route and navigation UI | Full map workflow plus sheet snap points, route segment focus/restore, stop detail, themes, layers, navigation, rendezvous scenarios | PASS in E2E | Local deterministic map fixture. Eleven route/navigation screenshots were captured under `/tmp`; they are not approved production-map visual baselines. |
| Site passenger/driver flows | Booking, two-account demand negotiation, persisted chat, driver multi-passenger matching, ordered stops, GPS deviation/reroute, denied GPS, direct URL restore | PASS in E2E | Synthetic accounts, loopback database and fixtures. |
| Full Site/Server E2E | Playwright 25/25 PASS in 5.7 minutes on the exact dirty checkouts above | PASS (local E2E) | This is not an immutable release candidate or staging acceptance. |

## Visual and release boundary

- The normal committed comparison for `journey-results-light.png` still fails at 38,818 differing pixels (about 12%). The expected and actual images were reviewed: the composition is close, but the difference is not attributed sufficiently to accept or replace the baseline. No repository snapshot was updated and no pixel threshold was relaxed.
- Route/map screenshots use local schematic fixture tiles. Ten attached mockups have not each been matched against approved, licensed production map assets; full visual acceptance remains NOT_TESTED/PARTIAL.
- A preliminary E2E against the orchestrator's duplicate root UI was not used as product acceptance. The canonical product UI is MarshGO-Site; root orchestration assets and its selectors are a separate surface that needs an explicit product-scope decision in the repository inventory.
- Dense frozen-Lviv GTFS search remains `searchTruncated=true` for all three fixed O/Ds. The local integration run proves bus→tram API persistence for its test case, not dense-feed completeness or live citywide coverage.
- No exact six-repository tested SHA tuple: Admin/Partner absent locally; iOS not built against this Site/Server tuple. No staging, live licensed provider acceptance, physical iPhone, security/load/recovery, backup/restore, rollback, or deployed-SHA smoke was performed in this audit.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next exact action

1. Reconcile the dirty Site and Server source against PR ancestry into an isolated immutable candidate without staging or resetting unrelated changes.
2. Diagnose the 12% light-results raster delta from font/style provenance and layout geometry, then compare every supplied mockup against the corresponding real production screen; preserve current screenshots until accepted evidence exists.
3. Resolve dense GTFS completeness with a new query-directed representation only after exhaustive small-feed path and all-strategy winner parity; compare frozen-feed recall, truncation causes, latency and peak RSS.
4. Continue the six-repository exact-SHA, live-provider, Admin/Partner, iOS, staging, security, load, backup/restore and rollback gates. Do not claim production readiness or deploy.
