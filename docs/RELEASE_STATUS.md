# MARSHGO Release Status — 2026-10-01

## Disposition

**NOT RELEASED.** Canonical Server and Site source are synchronized to the local integration implementation and pass local checks. Cross-repository browser tests pass with isolated deterministic routing/geocoding/map fixtures. This is not hosted staging or production. No real SMS, private production object storage, production monitoring, backup restore drill, signed iOS release, or physical-device acceptance is available.

## Local source revisions

| Repository | Local branch / commit | Working tree | Notes |
|---|---|---|---|
| MarshGO umbrella | `codex/marshgo-production` / `36082592d88068707bba2659a61dc96f92829901` | clean; 8 commits ahead of remote | Entity deep links, authorized lookup APIs and cold-open/reload E2E coverage for booking, demand and conversation links are committed. |
| MarshGO-Server | `main` / `418b8213536f016f963c8119b29c6679464165cf` | clean; 4 commits ahead of remote main | Adds authorized demand/conversation lookup endpoints and typed matched-demand reload integration coverage; migrations remain through `027`. |
| MarshGO-Site | `main` / `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | clean; 4 commits ahead of remote main | Adds refresh-safe entity routes and reload restoration for offer, demand, booking, Journey and conversation views. |
| MarshGO-iOS | `main` / `cb32564df286cdfd09e35d276e6857ae541277b4` | clean; local commits unpushed | Simulator bundle rebuilt from pinned Site `c7f76a4` and Server `ca76052`; metadata checked. API origin is loopback; signing/TestFlight and physical-device acceptance remain unavailable. |

These are local commits only. They have not been pushed, merged, signed, deployed, or accepted as a coordinated release. See [RELEASE_MANIFEST.json](RELEASE_MANIFEST.json).

## Verified locally

- Umbrella `npm run check:production`: typecheck, repository-wide lint, 72 unit tests, Vite production build, emitted JavaScript gzip/demo-marker checks all pass; one opt-in database test is skipped in the unit command.
- Umbrella PostGIS/Redis integration: 17/17 pass.
- A newly created isolated local database applied migrations `001–027`; all 17 PostGIS/Redis integration checks then passed.
- Umbrella browser E2E: 6/6 pass in Chromium against the isolated local stack and deterministic provider fixtures. The marketplace scenario directly opens `/bookings/:id`, reloads it, and confirms the server-backed booking is restored as the single matching item.
- Browser compatibility: Chromium, Firefox and WebKit each pass widths 375, 430, 768, 1024, 1440 and 1920 (18 engine/viewport combinations) against the production build. Checks assert no horizontal overflow, usable content, expected navigation and no unexpected browser or server errors.
- Site local clone: full-source lint, typecheck, production build and bundle checks pass; no Leaflet chunk is emitted; largest JavaScript file is 285.1 KB gzip.
- Site production bundle at `c7f76a4` against synchronized Server API source at `ca76052` (subsequent `418b821` only tightens an integration-test response type): 6/6 Chromium browser E2E and 3/3 browser compatibility projects (Chromium, Firefox, WebKit) pass at phone/tablet/desktop sizes. The full E2E includes independent passenger/driver contexts, demand negotiation, booking confirmation, booking/conversation/demand URL reloads and persisted chat. Tests use isolated local PostGIS/Redis and deterministic geocoder/OSRM/tile fixtures; they do not qualify live providers or hosted staging.
- Server local clone: full-source lint, typecheck, 33 unit tests pass (1 opt-in test skipped), 17 integration tests pass, high-severity npm audit reports no vulnerabilities.
- iOS local clone: Capacitor sync and Simulator build/install/launch pass using exact local Site `c7f76a4`, Server `ca76052` and iOS `cb32564` SHAs; embedded `release-manifest.json` matches the full source SHAs, API `v1` and migration `027`. The Simulator build points to loopback and is not deployable as-is. It is not signed/TestFlight or physical-device acceptance. The earlier unsigned Release archive compile used older pinned source revisions; this slice has Debug Simulator evidence only. Workflow YAML parses; GitHub-hosted execution has not been run.
- Current umbrella and standalone Server trees share integration API/domain code and migrations through `027`; integrated frontend source and standalone Site `src/` are synchronized. Site E2E/compatibility passes against that API. The iOS app now embeds the exact local Server/Site/iOS revisions; no signed iOS artifact or hosted staging evidence exists.
- A one-time live-provider smoke succeeded against public Nominatim, OSRM and OpenFreeMap endpoints. This does not qualify those shared public services for production use.
- `git diff --check` passes in the current integration checkout; all four source checkouts are clean after committing this verification slice.

## Release blockers

1. Publish/review local commits; set iOS release variables to the exact Server/Site SHAs and production API origin; run tagged GitHub CI and sign/upload through TestFlight.
2. Provision HTTPS staging, domain, secret management, managed Postgres/PostGIS and Redis; deploy API, worker and Site; exercise rollback and backup restore.
3. Configure real SMS, contracted/self-hosted geocoding/routing/map data and private object storage with encryption, retention, logging and malware scanning.
4. Implement/qualify Web Push and APNs, commercial payment adapter as required, monitoring/alerts and operational incident procedures.
5. Finish WALK and provider-fed multimodal Journey, GTFS/GTFS-RT, Journey Monitor/Replan/Rescue, and full multi-passenger/booking/rendezvous closeout. Current deterministic fixtures are test-only.
6. Complete background iOS location, deep links, camera QR and two physical iPhone acceptance. The connected physical iPhone was unavailable.

Do not report **PRODUCTION READY** until the applicable release gates above have passed with environment-specific evidence.
