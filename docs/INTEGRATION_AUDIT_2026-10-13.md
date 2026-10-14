# MARSHGO integration and release audit

**Reviewed:** 2026-10-13
**Release status:** `NOT_RELEASED` / `BLOCKED_EXTERNAL`

This audit records the code and data verified in the current worktrees. A passing local build does not mean that a public production deployment exists.

## Repository work

| Repository | Branch | Work in this release candidate |
|---|---|---|
| [MarshGO](https://github.com/dima1203oleg/MarshGO) | `codex/marshgo-production` | Production checks, route/map E2E coverage, release evidence |
| [MarshGO-Server](https://github.com/dima1203oleg/MarshGO-Server) | `codex/sync-mobility-registry` | Provider registry, GBFS/OSM adapters, rental compatibility, fares and schedule routing |
| [MarshGO-Site](https://github.com/dima1203oleg/MarshGO-Site) | `codex/sync-journey-mobility-ui` | Shared route cards, synchronized map/sheet selection, transport overlays and provider UI |
| [MarshGO-iOS](https://github.com/dima1203oleg/MarshGO-iOS) | `codex/reliable-capacitor-sync` | CI pins the bundled Site to `dc937069e16ebb5bec5b66c674f664497c079207`; simulator CI passes, no native code changed, and physical iPhone acceptance was not run |

## Provider status

| Provider / data | Status | Verified behavior and limits |
|---|---|---|
| Zelectra GBFS v3 | `ACTIVE_LIVE` | Auto-discovery and live feed parsing work. Two live samples contained 804–805 vehicles, of which 732–733 coordinates were inside Ukraine; the feed also included Lima records, so country filtering is applied. The feed reported no stations and exposed scooter/moped types and geofences. Availability is time-bound and stale records are hidden. This does not prove a valid rental return or permit booking through MARSHGO. |
| Ukraine bicycle rentals from OSM | `ACTIVE_STATIC` | Full Geofabrik PBF extraction found 317 bicycle-rental objects. The audit found 66 Nextbike, 9 BikeNow, 6 Veliki and 236 without a resolved provider. All 317 are static; live stock, pickup rights and return rights confirmed: 0. Ordinary bicycle parking was excluded. |
| Veliki.ua | `ACTIVE_STATIC` | Some OSM records resolve to the provider. The official page does not establish current inventory, station-to-station return compatibility or one-way rental. |
| BikeNow | `CATALOG_ONLY` | OSM discovery points are static. No authorized live API or rental-return rules were available; no private app API was used. |
| Kiwitaxi | `AWAITING_CREDENTIALS` | The documented legacy country CSV endpoint tested without partner credentials returned HTTP 404. No catalog, price, affiliate link or booking is asserted as live. |
| Intui.travel | `AWAITING_CREDENTIALS` / `AWAITING_AGREEMENT` | Partner API Light credentials were not present; API Wide requires partner documentation and an additional agreement. No endpoint names, quotes or bookings were fabricated. |

The OSM source snapshot was `ukraine-261012.osm.pbf`, dated 2026-10-12. Its full report and machine-readable exports are in the Server change: [BIKE_RENTAL_UKRAINE_AUDIT.md](https://github.com/dima1203oleg/MarshGO-Server/blob/codex/sync-mobility-registry/docs/data/osm-bike-rentals-2026-10-12/BIKE_RENTAL_UKRAINE_AUDIT.md). OSM locations include places in occupied territories; a mapped point is not evidence of operating service. See [Geofabrik Ukraine](https://download.geofabrik.de/europe/ukraine.html) and the [GBFS specification](https://github.com/MobilityData/gbfs).

An authenticated smoke request against an isolated local database returned 48 nearby rental locations: 37 unresolved, 5 BikeNow, 4 Nextbike and 2 Veliki. All were static and had unknown availability. No database or external provider booking was used.

## Rental and journey correctness

The routing model now distinguishes `BICYCLE` and `SCOOTER`, keeps provider/network identity on rental points, and fails closed when pickup/drop-off compatibility is unknown. An OSM point can be found on the map but is not treated as a confirmed available vehicle or a legal return location. A single rental session cannot cross from BikeNow to Veliki or from Zelectra to a bicycle provider.

Consequently, a live `scooter → bicycle → scooter` itinerary is **not yet available** from current provider evidence: no bicycle network has confirmed pickup, drop-off and return compatibility. The planner must reject that session instead of drawing a plausible but unusable route. Public-transport and Community journey integration tests remain separate and passed.

Unknown fares remain unknown; they are not converted to `0 ₴` or used to claim the cheapest journey. Kyiv metro times use published operating windows and estimated headways where exact departures are not published.

## UI and verification

The search route card and map bottom sheet use the same route presentation model for duration, fare, transfer count, colored segment ribbon and per-segment details. Selecting a segment updates the map focus and selected segment; the sheet supports expanded, half-height and collapsed states, with a compact strip at the collapsed state. The test checks light and dark palettes.

| Check | Result |
|---|---|
| Umbrella `npm run check:production`, local Node 24.19.0 | PASS: typecheck, lint, 231/231 active unit tests, one opt-in integration skip, Vite production build, and 51 JavaScript chunks within the 350 KB gzip limit. Repository CI will verify the declared Node 24.21.0 runtime. |
| Site typecheck/lint/tests/build, local Node 24.19.0 | PASS: 68/68 tests and production build. GitHub Site CI run [38418881869](https://github.com/dima1203oleg/MarshGO-Site/actions/runs/38418881869) passes on exact Site SHA `dc937069e16ebb5bec5b66c674f664497c079207`. |
| Server typecheck/lint/unit tests, Node 24.21.0 | PASS: 193/193 active tests, one opt-in database integration skip |
| Server database/Redis integration, Node 24.21.0 | PASS: 28/28 checks across journey schema, bookings, trip editing, navigation, realtime, process restart and shared rate limits |
| Exact-pinned full Playwright E2E | PASS: 12/12 in 6.4 minutes on a new isolated loopback database against Server `7dda315fa5a60b3e78ba284da98a94e129cbff1b`, Site `dc937069e16ebb5bec5b66c674f664497c079207`, and integration test baseline `2293217250097cdf5c10a6dd9a41b3775c1f05f0`. Covers search, light/dark results, map/sheet synchronization, segment focus/dimming/zoom, date/time, transport catalog, two-account booking/chat, driver GPS rerouting, URL restore, denied GPS, and Community offers. The stale realtime toast race is fixed; the test observes the persisted `passenger_confirmed` state. Host Node 24.19.0; exact Node 24.21.0 validation is pending in GitHub CI. |
| Map and route-sheet interaction | PASS: segment selection focuses and zooms the matching map portion; the sheet expands, moves to half height and collapses to a compact route strip. Pure Drive hides the finish action while collapsed and exposes it in the expanded controls. |
| Broad visible-button audit | PASS: 137 clicks, no page exceptions or unexpected HTTP 5xx responses (the isolated reverse-geocoder stub's expected 503 is excluded). Fourteen controls showed no detectable URL, DOM, text, or request change under this heuristic sweep; the list is attached to the Playwright report and is not a claim that each control is broken. |
| Local screenshot regression | PASS for the checked-in macOS route/map snapshots and behavioral geometry assertions. This is not a pixel-overlay measurement against the supplied reference photo crops, so exact one-to-one visual identity has not been certified. |
| Exact-pinned production image build | PASS locally. Built with Node 24.21.0 Alpine build images from the pinned Server/Site commits. No containers were started; local image digests are omitted from public documentation. |
| GitHub umbrella CI | PENDING after the exact source pins and snapshot baseline are pushed. |
| Updated iOS simulator CI | PASS: runs [38420813107](https://github.com/dima1203oleg/MarshGO-iOS/actions/runs/38420813107) and [38420819395](https://github.com/dima1203oleg/MarshGO-iOS/actions/runs/38420819395), on iOS `6a59bcf24d063f096893582322af9849469897bd` with Site `dc937069e16ebb5bec5b66c674f664497c079207`.
| Public production smoke | NOT RUN: no production target is configured |
| Physical iPhone acceptance | NOT RUN |

The Server production dependency audit reports two moderate advisories in `uuid` through `gaxios`; `npm audit fix --dry-run` did not identify an applicable lockfile update. This remains a release review item.

## Deployment decision

No production build has been deployed. The exact-pinned API and web production container images have been built locally; this is a packaging check only. `.env.production` and `.env.staging` are absent, and no current production domain, deployment host, managed secret store, database/Redis endpoints or backup key are configured. The release scripts intentionally refuse to deploy without these values, a versioned release tag pointing at the exact integration commit, and a separately protected backup-key file.

The exact-pinned local web review build is served at `http://127.0.0.1:4176/` and is available in the Codex preview tab. It is a local review build, not a public staging or production deployment.

To run the production release, the owner must supply the real public app/API domains and hosting target, managed secrets, SMS sender credentials, routing/geocoding endpoints, versioned map manifests and required licenses, private object-storage configuration, managed PostgreSQL/PostGIS and Redis endpoints, and an encrypted-backup key. Partner credentials/agreements are separately required for Kiwitaxi and Intui.travel. The release must then pass staging migration, HTTPS, backup/restore, authenticated browser, and rollback checks before production traffic is enabled.

## Pull requests

Changes are pushed to the existing feature branches and are reviewable in these open PRs:

- [MarshGO PR #1](https://github.com/dima1203oleg/MarshGO/pull/1)
- [MarshGO-Server PR #3](https://github.com/dima1203oleg/MarshGO-Server/pull/3)
- [MarshGO-Site PR #3](https://github.com/dima1203oleg/MarshGO-Site/pull/3)
- [MarshGO-iOS PR #2](https://github.com/dima1203oleg/MarshGO-iOS/pull/2)

They remain reviewable changes; this audit does not merge them, create a release tag, or deploy production.
