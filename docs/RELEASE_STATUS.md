# MARSHGO Release Status — 2026-10-01

## Disposition

**NOT RELEASED.** Canonical Server and Site source are synchronized to the local integration implementation and pass local checks. Cross-repository browser tests pass with isolated deterministic routing/geocoding/map fixtures. This is not hosted staging or production. No real SMS, private production object storage, production monitoring, backup restore drill, signed iOS release, or physical-device acceptance is available.

## Local source revisions

| Repository | Local branch / commit | Working tree | Notes |
|---|---|---|---|
| MarshGO umbrella | `codex/marshgo-production` / `d5f9f67defdd6a377468162a86a79c245b68b930` | clean; local commits unpushed | Integration code and acceptance harness exercised this checkout. |
| MarshGO-Server | `main` / `363532c1e6bedd083b2f53c2449eeb6b34869ac6` | clean; 2 commits ahead of remote main | Synced integration API/domain code and migrations through `027`; its own lint/type/unit/integration tests pass locally. |
| MarshGO-Site | `main` / `e47538b1281bc8fcab8dd3f4b646575caace5646` | clean; 3 commits ahead of remote main | Synced production UI/source; Leaflet component and dependencies removed. Full-source lint, typecheck, build and bundle checks pass. |
| MarshGO-iOS | `main` / `28aa2acaa02b62732013e586576d898905099332` | clean; 2 commits ahead of remote main | Tagged CI now fails closed on missing/mismatched pinned inputs and compiles an unsigned Release archive. Local archive compile succeeded using old Site `ed602ac`, not the current Site SHA; signing/TestFlight remain unavailable. |

These are local commits only. They have not been pushed, merged, signed, deployed, or accepted as a coordinated release. See [RELEASE_MANIFEST.json](RELEASE_MANIFEST.json).

## Verified locally

- Umbrella `npm run check:production`: typecheck, repository-wide lint, 71 unit tests, Vite production build, emitted JavaScript gzip/demo-marker checks all pass; 1 opt-in database test is skipped in the unit command.
- Umbrella PostGIS/Redis integration: 17/17 pass.
- Umbrella browser E2E: 6/6 pass in Chromium against the isolated local stack and deterministic provider fixtures.
- Browser compatibility: Chromium, Firefox, WebKit pass representative phone/tablet/desktop viewports (9 engine/viewport combinations).
- Site local clone: full-source lint, typecheck, production build and bundle checks pass; no Leaflet chunk is emitted; largest JavaScript file is 285.1 KB gzip.
- Exact committed Site production bundle against synchronized Server API: 6/6 Chromium browser E2E and 3/3 browser compatibility projects (Chromium, Firefox, WebKit) pass at representative phone/tablet/desktop sizes. Tests use isolated local PostGIS/Redis and deterministic geocoder/OSRM/tile fixtures; they do not qualify live providers or hosted staging.
- Server local clone: full-source lint, typecheck, 30 unit tests pass (1 opt-in test skipped), 15 integration tests pass, high-severity npm audit reports no vulnerabilities.
- iOS local clone: Capacitor sync, unsigned Simulator compile and unsigned iOS Release archive compile pass. The archive used older Site `ed602ac`; it is not a signed/TestFlight artifact or physical-device acceptance. Workflow YAML parses; GitHub-hosted execution has not been run.
- Current umbrella and standalone Server trees now share integration API/domain code and migrations through `027`; integrated frontend source and standalone Site `src/` are synchronized. Server checks pass (33 unit pass, 1 opt-in skip; 17 integration pass). Site against that Server API passes local browser E2E/compatibility tests. iOS Simulator artifact is still built from older remote Site `ed602ac`; there is no signed iOS artifact or hosted staging evidence.
- A one-time live-provider smoke succeeded against public Nominatim, OSRM and OpenFreeMap endpoints. This does not qualify those shared public services for production use.
- `git diff --check` passes in each of the four clean local checkouts.

## Release blockers

1. Publish/review the local Server/Site commits and set iOS release variables to their immutable SHAs; build/test a new iOS artifact and run hosted staging acceptance with the exact four-repository manifest.
2. Publish/review the local commits and pin exact compatible Server/Site revisions in the iOS release build. Current iOS Simulator artifact used old remote Site `ed602ac`.
3. Provision HTTPS staging, domain, secret management, managed Postgres/PostGIS and Redis; deploy API, worker and Site; exercise rollback and backup restore.
4. Configure real SMS, contracted/self-hosted geocoding/routing/map data and private object storage with encryption, retention, logging and malware scanning.
5. Implement/qualify Web Push and APNs, payment adapter as required, monitoring/alerts and operational incident procedures.
6. Finish WALK and provider-fed multimodal Journey, GTFS/GTFS-RT, Journey Monitor/Replan/Rescue, and full multi-passenger/booking/rendezvous closeout. Current deterministic fixtures are test-only.
7. Complete signed iOS archive/TestFlight, background location, deep links, camera QR and two physical iPhone acceptance. The connected physical iPhone was unavailable.

Do not report **PRODUCTION READY** until the applicable release gates above have passed with environment-specific evidence.
