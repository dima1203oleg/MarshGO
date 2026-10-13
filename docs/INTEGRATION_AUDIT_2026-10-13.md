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
| [MarshGO-iOS](https://github.com/dima1203oleg/MarshGO-iOS) | `codex/reliable-capacitor-sync` | No native code changed; physical iPhone acceptance was not run |

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
| Umbrella `npm run check:production`, Node 24.21.0 | PASS: typecheck, lint, 231/231 active unit tests, one opt-in integration skip, Vite production build, and 51 JavaScript chunks within the 350 KB gzip limit |
| Site typecheck/lint/tests/build, Node 24.21.0 | PASS: 68/68 tests and production build |
| Server typecheck/lint/unit tests, Node 24.21.0 | PASS: 193/193 active tests, one opt-in database integration skip |
| Server database/Redis integration, Node 24.21.0 | PASS: 28/28 checks across journey schema, bookings, trip editing, navigation, realtime, process restart and shared rate limits |
| Mobile browser route/map E2E | PASS: route map and sheet synchronization, segment focus, drag/collapse states and light/dark palettes |
| Public production smoke | NOT RUN: no production target is configured |
| Physical iPhone acceptance | NOT RUN |

The Server production dependency audit reports two moderate advisories in `uuid` through `gaxios`; `npm audit fix --dry-run` did not identify an applicable lockfile update. This remains a release review item.

## Deployment decision

No production build has been deployed. `.env.production` and `.env.staging` are absent, and no current production domain, deployment host, managed secret store, database/Redis endpoints or backup key are configured. The release scripts intentionally refuse to deploy without these values, a versioned release tag pointing at the exact integration commit, and a separately protected backup-key file.

The local web preview at `http://127.0.0.1:4175/` returned HTTP 200 and is available in the Codex preview tab. It is a local review build, not a public staging or production deployment.

To run the production release, the owner must supply the real public app/API domains and hosting target, managed secrets, SMS sender credentials, routing/geocoding endpoints, versioned map manifests and required licenses, private object-storage configuration, managed PostgreSQL/PostGIS and Redis endpoints, and an encrypted-backup key. Partner credentials/agreements are separately required for Kiwitaxi and Intui.travel. The release must then pass staging migration, HTTPS, backup/restore, authenticated browser, and rollback checks before production traffic is enabled.

## Pull requests

Changes are pushed to the existing feature branches and are reviewable in these open PRs:

- [MarshGO PR #1](https://github.com/dima1203oleg/MarshGO/pull/1)
- [MarshGO-Server PR #3](https://github.com/dima1203oleg/MarshGO-Server/pull/3)
- [MarshGO-Site PR #3](https://github.com/dima1203oleg/MarshGO-Site/pull/3)

They remain reviewable changes; this audit does not merge them, create a release tag, or deploy production.
