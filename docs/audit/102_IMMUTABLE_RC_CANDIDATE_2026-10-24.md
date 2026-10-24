# Immutable release-candidate snapshot — 2026-10-24

## Latest verification addendum — 2026-10-24

- Server full integration suite: **29/29 PASS** on Node 24.21.0, loopback-only `marshgo_e2e`, local Redis. The guard constrained the DB; the migration and Journey/live-journey, booking/edit, navigation, Redis realtime, restart and rate-limit checks passed.
- Site/Server full fixture Playwright: initial run 19/20; isolated route-map test 1/1; repeat full run **20/20 PASS in 8.8 minutes** on exact Site `2af5219538aa005d285f9236ca0b0dafaca0274a` and Server `c7252783f3c8b3b1140d621bcbdae175248008be`, fresh isolated `marshgo_e2e_rc_20261024`, fixtures and trace enabled. The first timeout remains a historical intermittent event; the repeat did not reproduce it. Control audit 195 clicks/15 routes with 13 heuristic no-visible-effect observations.
- iOS clean PR #14 `0fcf5f36e0a751152b9d3cd6778a930b372afae0` pins exact Site/Server; Simulator checks `40041831739`, `40041815392` PASS. Physical device remains NOT_TESTED.
- Release remains `PRODUCTION_READY=false`, `NOT_RELEASED`; dense-Lviv truncation, provider rights/realtime, authenticated Admin/Partner, staging, physical device, security/load, backup/restore and rollback remain open. No deployment attempted.

## Continuation update — clean iOS candidate and Server integration — 2026-10-24

- iOS clean PR #14 head `0fcf5f36e0a751152b9d3cd6778a930b372afae0` (base `main` `b8b1fcbfe9997e1a7a27594b5759690147de75df`) pins exact Site `2af5219538aa005d285f9236ca0b0dafaca0274a` and Server `c7252783f3c8b3b1140d621bcbdae175248008be`; Simulator workflows `40041831739` and `40041815392` both PASS. Superseded stale PR #13 is closed; physical-device behavior remains NOT_TESTED.
- Complete `npm run test:integration` on the immutable Server candidate completed all included journey-schema, live-journey, booking/trip-edit, navigation, Redis realtime, restart-durability and rate-limit cases successfully. The loopback guard accepted only `marshgo_e2e`; migrations ran on that isolated DB, with local Redis. This local runner used Node 25.4.0; the Server package pins Node 24.21.0, so this result is supplementary and must be repeated under the supported runtime. The exact candidate's hosted CI passed separately.
- Exact candidate Site/Server browser suite remains **19/20**, not green: one route-map fit polling timeout in the long suite; same scenario passed 1/1 alone against the same SHAs. Preserve the failure and investigate timing; do not loosen the predicate. Control audit was 205 safe clicks across 15 routes, with 12 heuristic no-visible-effect observations and no JS errors/unexpected 5xx.
- Overall release remains `PRODUCTION_READY=false`, `NOT_RELEASED`. The routing completeness, provider rights/realtime coverage, authenticated Admin/Partner, staging, physical-device, security/load, backup/restore and rollback gates remain open. No deployment was attempted.

## Earlier snapshot — superseded 2026-10-24

- Site candidate `2af5219538aa005d285f9236ca0b0dafaca0274a` on `codex/site-final-rc-20261024`, PR [#21](https://github.com/dima1203oleg/MarshGO-Site/pull/21), based exactly on `codex/sync-journey-mobility-ui` `6961afcf008e2c845c0fde68c687ce61fe744f2f`. Server candidate `c7252783f3c8b3b1140d621bcbdae175248008be` on `codex/server-final-rc-20261024`, PR [#35](https://github.com/dima1203oleg/MarshGO-Server/pull/35), based exactly on `feature/transport-layer-availability` `182c77ae4f78d576a287007d8d0864fb130f43f8`. Both are immutable snapshots of earlier dirty checkouts; original worktrees remain untouched.
- Site exact-candidate local checks on Node 24.21.0 after lockfile security updates: 98/98 unit tests, typecheck, lint, production build and `npm audit` all PASS (0 vulnerabilities). Hosted exact-SHA checks passed: runs `40040066282` and `40040182059`.
- Server exact-candidate local checks on Node 24.21.0 after lockfile security updates: 224 PASS / 0 FAIL / 1 opt-in integration test SKIP, typecheck, lint and `npm audit` PASS (0 vulnerabilities). Hosted check `40040067773` passed; run `40040185238` is still in progress at this checkpoint.
- iOS pin candidate `ccb233495dfbc638b565b0a15ef5ba29e9109451` on `codex/ios-pin-site-pr15-20261023`, PR [#13](https://github.com/dima1203oleg/MarshGO-iOS/pull/13), now pins exactly the two candidate SHAs above. Simulator checks `40040185354` and `40040110763` are in progress; do not count them as PASS yet.
- Admin remains `9dbf7db0a935498ac40c98b19bc36bce056d630d` (local typecheck/lint/build and 2/2 tests PASS); Partner remains `c639257a7f28aeda5b378a816038b01651146b83` (same checks and 3/3 tests PASS). Authenticated Admin/Partner operations and tenant-isolation E2E remain NOT_TESTED.
- Candidate snapshots remove existing npm audit findings through compatible lockfile-only updates: Site `vite`/`zod`; Server `body-parser`/`ip-address`/`markdown-it`/`zod`; current audits report zero vulnerabilities.
- Release remains `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`. No staging deployment target, production origin, credentials, or deployment approval is present. The 2026-10-24 daytime Lviv replay still returned 100-item truncated searches for both OD pairs; both Lviv RT feeds returned zero vehicle positions and trip updates. Live provider contracts/rights, physical iPhone acceptance, security/load/recovery/backup-restore/rollback gates remain open.
- Exact next action: wait for Server run `40040185238` and iOS simulator runs `40040185354` / `40040110763`; address failures on the candidate branches, then run the cross-repository candidate E2E and verify API/schema compatibility. Continue only after recording exact run results.


## Exact candidate browser and release checks

- Cross-repo Playwright functional suite used PWA build from Site `2af5219538aa005d285f9236ca0b0dafaca0274a`, Server `c7252783f3c8b3b1140d621bcbdae175248008be`, loopback PostGIS `marshgo_e2e`, Redis, and fixture map/geocoder/OSRM. Result: 19/20 passed; one failure in the long route-map visual/interaction test, where `waitForMapFitToSheet` hit a 5-second poll timeout. The captured screenshot shows the route sheet at half snap with a visible map band.
- The same route-map test passed alone against the exact same candidate tuple: 1/1 in 1.1 minutes. This supports a slow-suite/timing flake, but the original failed result remains in the matrix; no assertion was weakened.
- The button audit passed 205 safe control clicks over 15 routes. 12 heuristic no-visible-effect observations were current/selected/empty states and are separately listed in the test output; no page exceptions or unexpected 5xx occurred.
- Site hosted CI: runs 40040066282 and 40040182059 PASS. Server: 40040067773 and 40040185238 PASS. iOS simulator: 40040185354 and 40040110763 PASS for the pinned Site/Server candidate revisions.
- This is local fixture-backed integration plus hosted build checks. No staging, deployed release, physical iPhone, live GPS guarantee, provider commercial authorization, or production smoke is proven.

## iOS PR branch hygiene

The first iOS pin PR (#13) inherited 84 unrelated commits from a stale work branch. It was closed as superseded and replaced with clean PR #14 from `main`, head `0fcf5f36e0a751152b9d3cd6778a930b372afae0`. This clean PR pins Site `2af5219538aa005d285f9236ca0b0dafaca0274a` and Server `c7252783f3c8b3b1140d621bcbdae175248008be` and verifies the embedded release manifest. Exact Simulator runs `40041831739` and `40041815392` were in progress at checkpoint time.
