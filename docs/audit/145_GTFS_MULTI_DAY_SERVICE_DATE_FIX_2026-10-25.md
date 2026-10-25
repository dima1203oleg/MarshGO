# GTFS multi-day service-date coverage — 2026-10-25

## Scope

Regression validation for GTFS timetable searches where a trip's service date precedes the local search date by two days. GTFS stop times can exceed 24:00; the current parser accepts values up to 71:59:59. A trip at `48:15:00` on Sunday therefore occurs at 00:15 Tuesday in the feed timezone.

## Candidate

- Repository: `MarshGO-Server`
- Branch: `feature/transport-layer-availability`
- HEAD: `182c77ae4f78d576a287007d8e0864fb130f43f8`
- Working tree: already contained extensive unrelated modifications and untracked files; preserved intact.
- Relevant implementation: `server/journey/gtfsTimetable.ts` enumerates the two prior local service dates through the full query/journey horizon for both direct and composed timetable searches.
- Regression tests: `tests/gtfs-timetable.test.ts` exercises direct and composed journeys with `48:15:00`/`48:55:00` and an active service-date exception two dates before query local date. A second direct-search case verifies that an active intermediate date is searched when the requested window spans multiple local days. Door-to-door itinerary time includes walking access; the test checks transit-segment event timestamps.

## Checks

Executed with Node `v25.4.0`; package engine requests `24.21.0`.

- `npx tsx --test tests/gtfs-timetable.test.ts` — PASS, 37/37.
- `npm test` — PASS, 227 pass, 1 opt-in integration skipped, 0 fail.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `git diff --check` — PASS.

The opt-in integration skip is not a passing result. All relevant regression checks are local fixture/unit tests. No real feed probe, staging, production, or physical-device validation occurred.

## Release status

This establishes only the tested service-date behavior on the current dirty candidate. It does not establish complete dense-city route search or production readiness. No changes were broadly staged, committed, pushed, or deployed. Keep `PRODUCTION_READY=false` and `RELEASE_STATUS=NOT_RELEASED`.

## Next

1. Preserve this checkpoint and do not promote the entire dirty Server tree as one change.
2. Continue algorithm parity work against frozen feed replay and exhaustive small-feed oracle; retain strategy winners and baseline itinerary identities.
3. Confirm the 71-hour parser ceiling against supported provider feeds and validator behavior; the official field definition permits extended service-day times above 24:00 without stating that ceiling. Decide a documented safe bound and test it before claiming broad GTFS conformance.
4. Continue exact-SHA cross-repository integration and external staging/provider/iOS/security/recovery gates; record blockers with evidence.

## Follow-up: current open-feed time scan and empty schedule health

At `2026-10-25T01:42:55Z`, downloaded all 15 `access: open`, `sourceType: gtfs` archives in the canonical Server Ukraine catalog using the existing SSRF-guarded `fetchBinary` helper (concurrency 2; 60 MiB cap). Parsed `arrival_time` and `departure_time` values only; no IDs or raw feed rows were logged. Across 1,207,262 non-empty time cells, the maximum was `63:30:00` in the VD-Express intercity archive; no values exceeded 71 hours and no malformed time cells were counted. Fourteen archives had at least one stop-time value. Khmelnytsky’s archive had a 1,077-byte ZIP and a header-only `stop_times.txt`.

At `2026-10-25T01:44:39Z`, the Server `testGtfsConnection` live probe for Khmelnytsky returned `offline`, zero stops/routes/trips/stop-times, and missing/invalid timezone. I added a separate explicit `Scheduled stop times` health check and made non-empty stop-time rows part of the critical-content gate, so a future archive with trips/calendar but an empty schedule cannot be called healthy. The live provider remains offline; this code change does not change provider data or enable it.

Additional evidence after these changes:

- `npx tsx --test tests/gtfs-timetable.test.ts` — PASS, 38/38, including direct/composed two-day carryover, the actual-feed maximum class (`63:30:00`), and multi-day intermediate service dates.
- `npx tsx --test tests/mobility.test.ts` — PASS, 20/20, including the empty-stop-times health gate.
- `npm test` — PASS, 229 pass, 1 opt-in integration skipped, 0 failures.
- `npm run typecheck`, `npm run lint`, `git diff --check` — PASS.

The 71-hour ceiling is sufficient for the 15 currently open catalog archives at this probe time, not a proof of a universal GTFS limit. The official [GTFS Schedule Reference](https://gtfs.org/documentation/schedule/reference/) describes service-day times above 24:00 but does not state a 71-hour maximum in the field definition. Keep the parser-bound decision documented and re-check when new feeds are enabled.

## Frozen live-feed route-search benchmark

At `2026-10-25T01:46Z`, replayed the saved Lviv OD benchmark against the local `marshgo_e2e` database and the same current static GTFS snapshot. With search debug enabled, the GTFS stage completed in 1,158 ms and returned its requested 100 journeys from 800 retained itinerary candidates. It built 308,387 timed segments from 15,716 trips across three service dates, found 20 origin and 20 destination access stops, and selected a 421-stop corridor from 1,071 feed stops. The result contained 329 segments, all 329 with geometry and valid stop-time details; no itinerary had a comparable UAH price.

The search correctly reports `searchTruncated=true` and `resultLimitReached=true`. Debug counters identify three causes: access-stop selection (`stopSelectionTruncated=1`), candidate search budget (`searchBudgetTruncated=1`), and candidate sampling (`candidateSamplingTruncated=1`). It did not hit the global 50,000 step cap or the `limit * 25` result cap. The current benchmark is therefore evidence of useful bounded results, not complete candidate coverage or a validated cheapest strategy. It does not establish that returned chains preserve the exhaustive baseline or optimal winners.

The earlier depth-fair and route-group budget experiments (audits 140/141) are rejected and remain unpromoted because they lost baseline chains and changed all three strategy winners. Next routing work must compare stable itinerary-chain identities and FASTEST/CHEAPEST/OPTIMAL winners against a frozen unbounded or exhaustive small-feed oracle, then replay multiple frozen Lviv OD pairs. Do not merely raise caps or suppress truncation: that risks higher memory/CPU while leaving ranking bias intact.

## Server loopback integration checkpoint

After the GTFS health and timetable regressions, ran `npm run test:integration` from the canonical Server checkout against its loopback-only `marshgo_e2e` database and local Docker Postgres/PostGIS + Redis. The script applied current Server migrations and ran: Journey schema 2/2, live journey 1/1, booking + trip editing 21/21, navigation 2/2, two-instance realtime 1/1, booking process-restart durability 1/1, Redis shared rate-limit 1/1 — **29/29 integration tests passed**. The script explicitly disabled mobility health polling while APIs were under test, so it did not write provider health or represent a live-provider acceptance. Temporary API processes exited through the script cleanup trap. These are local infrastructure integrations, not staging/production or device evidence.

## Full current-working-tree Web E2E retest

After review, updated only the two light-mode layer screenshots whose visual design intentionally changed (transport-mode tones, icons and availability labels): `transport-map-layers-light-darwin.png` and `navigation-light-layers-darwin.png`. The combined route-map scenario then passed with sheet states, stop details, segment focus and Light/Dark palettes.

Ran the complete root Playwright suite against the current dirty Site build and current dirty Server checkout, using a newly isolated loopback database `marshgo_e2e_candidate_20261025` and local map/geocoder/OSRM fixtures. The first run found only the stale layer screenshot (5% pixel difference); after updating the two reviewed baselines, the full repeat completed **25/25 PASS in 5.3 minutes**. The button audit clicked **169 controls**, with zero showing no visible effect. Covered responsive sign-in/home/search, route map and sheet states, all 12 transport categories, search/date/time/deep link, navigation, booking, demand/driver offers, persisted chat, two-rider GPS rerouting, GPS denial, truncation messaging, strategy metadata, and rendezvous consent/revocation.

The E2E command used local dirty worktrees (Server branch `feature/transport-layer-availability`, HEAD `182c77ae4f78d576a287007d8e0864fb130f43f8`; Site branch `codex/sync-journey-mobility-ui`, HEAD `6961afcf008e2c845c0fde68c687ce61fe744f2f`), not the root manifest's pinned release artifacts. The check confirms browser behavior against local fixtures and local Postgres/PostGIS/Redis only. It does not provide immutable clean-candidate SHA evidence, external provider acceptance, staging, physical iPhone, or production evidence. Keep `PRODUCTION_READY=false` and `RELEASE_STATUS=NOT_RELEASED`.

## Cross-browser compatibility

Ran the browser-compatibility matrix on the same current dirty Site build and local current Server/API plus the isolated loopback E2E DB and fixture services: **6/6 PASS across Chromium, Firefox, and WebKit** (responsive sign-in/home/search and the full route-map/sheet/stop-detail/segment-focus/light-dark scenario). This does not equal physical Safari/iPhone acceptance; no licensed production map tiles, live providers, staging, or deployed SHA were involved.
