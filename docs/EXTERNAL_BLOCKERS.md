## Codex tandem integration blocked by usage limit — 2026-11-14 07:58 UTC

- **Blocker (external, account quota):** Codex app (com.openai.codex, pid 1063) shows «Ліміт використання Codex і Роботи вичерпано. Ваш ліміт запитів відновиться 17 лист., 21:02.» Send button disabled, goal paused. Reset **2026-11-17 21:02** (local) unless the owner upgrades/resets. Verified by reading the live AX state this session.
- **Effect on tandem:** Qoder cannot deliver new steer handoffs or obtain Codex ACK/review/main-merge until the limit resets. The owner's tandem directive (Codex reviews + merges main) is externally paused. Qoder still must NOT merge protected main or deploy independently (standing owner constraint).
- **What completed before the limit:** CP5-A01 (G10/G15) PR #152 MERGED main 53b8eed0a65550d1365e54c202fab5a65dd5ed58 at 2026-11-14T07:55:26Z; post-merge main CI run 43573347454 SUCCESS (npm test 736/730/0/6; route-ordinals step 1/1 executed post-migrate; interval suite 14 executed on main). Codex's final message ACCEPTED the A01 handoff and CONFIRMED Qoder's idempotency-replay verification («replay повертає лише вже створене бронювання … не блокує A01»). A02 (PR #150) and A03 already merged earlier.
- **Autonomous path while blocked:** continue bounded atoms in isolated qoder/* worktrees at merged main, verify locally + via GitHub CI (CI runs independently of Codex quota), push qoder/* + OPEN PRs queued for Codex review on return. Avoid inventing agreed product logic that needs Codex ACK (e.g. CP5-A04 / C11 safe-pickup walking-access contract is ambiguous and awaits ACK). Record each PR as awaiting Codex integration.
- **Pending Codex on return:** (1) CP5-A04 / C11 safe-pickup walking-access contract ACK (proposal documented in CODEX_PROGRESS.md); (2) review/merge any new qoder/* PRs; (3) fare-UI visual check via zrok once a Site 07b1bf4 build is served (7777 currently older Qoder dirty; not restarted); (4) idempotency-replay interval-mismatch follow-up (non-blocking).
- No merge/deploy/secret/runtime change performed. 7777/3002/zrok + чужі dirty untouched. `RELEASE_STATUS=NOT_RELEASED`.

## Latest verification update — portal PR checks — 2026-10-26

- Server PR #43, Admin PR #1 and Partner PR #1 exact-head `verify` checks all pass after the mobile Settings fix. Local authenticated responsive coverage is 54/54 across the six viewport widths; see audit 225.
- This clears component CI and the local portal browser gap only. The root hosted release workflow still lacks read-only `MARSHGO_REPOS_READ_TOKEN` for private Admin/Partner checkout. There is still no verified staging/deployed SHA, production secrets/host, approved provider entitlements, physical iPhone/APNs, complete security/load/recovery/backup/rollback evidence, or owner rollout approval.
- No merge, deployment, production data mutation, secret provisioning, or cleanup was performed. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Latest cross-repository portal status — 2026-10-26

Admin/Partner authenticated workflows are locally verified on exact component candidates; Server PR #43 and updated Admin PR #1 now include the audit-feed correction (audit 224). Their latest hosted checks were pending. Central private checkout still needs read-only `MARSHGO_REPOS_READ_TOKEN`; staging/deployed SHA, external provider rights, physical iPhone/APNs, backup/restore/rollback, and owner rollout approval remain separate open gates.

## Latest portal gate update — 2026-10-26

Admin/Partner authenticated local acceptance is now PASS on open component PR snapshots against the Server PR #42 API tree (audit 223). This closes the previous local portal-browser gap only; it does not close exact cross-repository manifest alignment, staging/deployed SHA, real provider access/rights, physical iPhone/APNs, backup/restore/rollback, or owner-approved rollout. Central orchestrator private checkout remains blocked by missing read-only `MARSHGO_REPOS_READ_TOKEN`.

# Latest blocker recheck — 2026-10-26

## Server portal backend location (2026-10-26)

- Recheck resolved the apparent gap: partner organization APIs and Admin connector controls are already present in open Server PR #42 at exact head `a403a51a203d9d89685c10c69658c8fd95b70e9b`; a local verification derivative has the identical source tree.
- No additional PR is needed. Current blocker is that PR #42 remains unmerged and the release manifest still points to another Server SHA. Portal web-client acceptance against that API and the immutable cross-repository tuple remain open.
- Prepared: full local Node 24.22.1 tests on the tree-identical derivative, including tenant isolation, admin role denial, source credential redaction, and moderation; details in [audit 222](audit/222_SERVER_PARTNER_PLATFORM_INTEGRATION_2026-10-26.md).
- Status: OPEN (release integration/browser acceptance; not a missing API credential blocker).

## Current release-check status

- Central orchestrator PR #5 still fails at the private-repository checkout step because the read-only `MARSHGO_REPOS_READ_TOKEN` Actions secret is not configured. Server PR #42, Site PR #27, iOS PR #14, Admin PR #1 and Partner PR #1 pass their exact-head component checks; that does not make the central six-repository verification pass.
- The root release manifest remains `NOT_RELEASED`, with no verified staging URL/provider and no deployed SHA. Production Compose lists required runtime configuration/secrets; names are recorded in the manifest, never values.
- Production deployment remains separately approval-gated. No deployment, traffic change, migration, secret provisioning or external-account modification was attempted.
- Independent local work can continue, but provider rights/freshness, physical iPhone/APNs, full security/load, backup/restore/rollback and hosted staging acceptance remain open until directly evidenced.

- **Staging/production host and deployed SHA:** no verified environment URL, artifact digest, or live HTTPS smoke was exercised. Local fixture build is not staging; no production deployment attempted.
- **Provider access and commercial rights:** E2E used fixtures. Real feed freshness, coverage, booking/cancel and partner permissions remain unproven for the release candidate.
- **Licensed map assets:** browser map checks used a local fixture style. Need approved production style/manifest and live tile acceptance.
- **Admin/Partner acceptance:** manifest-pinned snapshots passed local typecheck/lint/build/unit checks (Admin 4/4, Partner 3/3), but authenticated RBAC, tenant isolation and operational flows were not exercised.
- **iOS release acceptance:** wrapper built, installed and opened in the iPhone 16 Pro Max simulator, but embeds a different Site SHA from the browser-tested bundle. The first immediate screenshot showed the white launch surface; the landing page appeared after about 12 seconds. Matching bundle sync, measuring cold-start behavior, authenticated API/GPS checks and physical-device/APNs/signing acceptance remain open.
- **Operations and rollout:** staging, secrets, backup/restore, rollback rehearsal, security/load/monitoring acceptance are not evidenced. Production rollout remains separately approval-gated by the master spec.
- Local successes and their limits: [audit 208](audit/208_DIRTY_SOURCE_FULL_ACCEPTANCE_2026-10-26.md). These do not clear external blockers.

# MARSHGO external blockers

### Exact tuple build and available capacity — 2026-10-26

- The release source materializer now validates the pinned Server/Site/Admin/Partner trees and generated the isolated `.release` Compose config. Exact candidate images are still `NOT_BUILT_FOR_CURRENT_EXACT_SHA_TUPLE`.
- Host volume reports 3.2 GiB free; Docker uses 3.755 GiB for images, 8.796 GiB for volumes and 4.701 GiB for cache. The image build was deferred and nothing was removed after the cleanup task was stopped. Continue on a host with enough free space or after explicit disk-capacity planning.
- Root hosted CI now passes source, integration, build and bundle checks but fails at the private Admin/Partner read-only checkout because Actions secret `MARSHGO_REPOS_READ_TOKEN` is unavailable. The image-build and hosted E2E stages were skipped; no gate was bypassed.
- Staging URL/deployed SHA, production credentials, approved provider/map entitlements, physical iPhone/APNs, backup/restore/rollback, security/load and owner rollout approval remain open. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

### Production-target recheck — 2026-10-25

- Read-only GitHub API check: all six canonical repositories still show **0 Environments / 0 deployments**. This rules out a GitHub-recorded deployment, not an independently managed host outside GitHub.
- Local root has no `.env.production` or `.env.staging`; `.env.staging.local` exists. Only development containers `marshgo-db-1` (PostGIS, `127.0.0.1:5434`) and `marshgo-redis-1` (`127.0.0.1:6380`) are currently running; these are not a public staging environment.
- `docker compose -f compose.production.yml config -q` fails closed because required production configuration is absent: `APP_DOMAIN`, immutable map data/style manifests, Redis password, session secret, Twilio credentials/from number, and web map style manifest URL. Error output contained variable names only; no secret values were inspected or recorded.
- Server PR #42 exact-head CI did build its production API image and pass isolated PostGIS/Redis image smoke. This is CI runtime evidence only; it does not supply a deploy host, production secrets, map entitlement or deployed SHA.
- Current consequence: no staging URL/browser acceptance and no production origin/deployed SHA can be verified. Keep release `NOT_RELEASED`; deployment remains unperformed and still needs separate owner approval.

### Current candidate follow-up — 2026-10-25

- Site PR #23 is now `44a5e4a4b7281d78b72554d7ddfad3ee1bbe9492`; iOS PR #14 is now `94658424c73d7a7e5c1c916560993a460d11f7cb` and pins that Site SHA. Exact source checks and hosted CI pass (see audit 120).
- The local OCI web image and integrated image-smoke record still point to the previous Site `10454f37b59a848e4a5b381689dfe7f701fe2b81`. Rebuild the Site image from the new exact source and repeat the isolated image smoke before claiming a current image tuple.
- API port 3002 was not running during native simulator acceptance; authenticated API/GPS/map/resume flows remain NOT_TESTED. Physical iPhone, background GPS, APNs, signing/TestFlight remain external/device gates.
- Ten-mockup visual acceptance remains open because the browser fixture uses synthetic tiles and the requested live vehicle/map appearance cannot be proven from fixture screenshots.
- All environment, commercial-provider, staging, backup/restore/rollback, production and owner-approval blockers listed below remain open; no deployment was performed.
- The current exact Site image was built and its static routes/assets were smoke-tested, but its map-style manifest build argument was empty. An approved immutable map manifest and staging configuration are required before it can be used as a release image.

Only concrete external dependencies belong here. Missing proof in a local checkout is recorded as `NOT_TESTED`, not automatically as an external blocker.

| Blocker | Feature / gate | Prepared work | Needed to close | Status |
|---|---|---|---|---|
| No currently verified production hosting/origin/deployed SHA | Production release and live smoke | Production Compose and Caddy config exist; release manifest identifies current candidate SHAs. No active production proof/origin/deployed SHA found | Owner-provided/approved host and DNS/domain, production-only secrets, deployment permission, monitoring/alerts, backup/restore and rollback target | BLOCKED_EXTERNAL |
| CI cannot clone the private Admin/Partner repos | Exact five-repository CI materialization/build | Workflow now supports `MARSHGO_REPOS_READ_TOKEN` through a temporary `GIT_ASKPASS` helper and fails closed with a clear message; no repository secrets are currently configured | Add an Actions secret named `MARSHGO_REPOS_READ_TOKEN` whose token has read-only Contents access to `MarshGO-Admin` and `MarshGO-Partner`, then rerun the candidate CI | BLOCKED_EXTERNAL |
| Current stable staging environment not verified | Cross-repo E2E, provider acceptance, operational checks | `ops/staging/docker-compose.yml` provides isolated local Postgres/Redis/S3Mock; read-only GitHub API recheck on 2026-10-19 found zero GitHub Environments and zero deployment records for Server, Site, Admin, Partner, or iOS. Historical temporary tunnels are not a stable staging service | Stable staging host/config and HTTPS origin, isolated DB/Redis/object store, test identities and secrets. Staging Compose requires `STAGING_POSTGRES_PASSWORD` and `STAGING_REDIS_PASSWORD`; production deployment also needs public DNS for app/admin/partner subdomains, trusted proxy count, session/Twilio credentials, routing/geocoding endpoints, map manifests, and object-storage configuration | BLOCKED_EXTERNAL |
| No verified OSRM-compatible pedestrian routing endpoint configured (`WALKING_ROUTING_URL` is empty) | Verified first/last-mile walk paths and unmodeled walking transfers in multimodal journey search | Server foot-profile adapter, bounded request budget, caching contract, timetable revalidation and truthful estimate fallback are implemented and covered by contract/unit tests. Strict walking/time filters exclude unverified walks | Provide a hosted foot-profile endpoint and graph version; verify its coverage, licensing/terms, latency and walking geometry for each launch city; set `WALKING_ROUTING_URL` and `WALKING_GRAPH_VERSION` in staging, then run route acceptance against real pedestrian paths | BLOCKED_EXTERNAL for live/staging verification; local adapter implementation available |
| Commercial provider access/agreements/credentials unconfirmed | Real quotes, booking, cancel and tracking for commercial transit/taxi/rental | Adapters/catalogs and explicit capability/license gates exist in worktrees | Provider-specific sandbox credentials, contractual/commercial permission and quotas | BLOCKED_EXTERNAL per provider |
| Physical iPhone and signing/push credentials not evidenced | GPS background, APNs, safe area, Safari/PWA lifecycle and real-device release acceptance | Capacitor and simulator workflows exist. Site PR #11 now catches React/lazy-import failures and shows manual recovery; the controlled failed-chunk flow passes local Chromium/Firefox/WebKit E2E. The Site has no service worker, and the historical physical Safari white-screen incident has not been reproduced | Physical test device and repeatable Safari reproduction; Apple signing/team setup and APNs entitlement/keys as needed. Validate permission denial, background GPS, PWA resume/update, map loading and deep links on-device | BLOCKED_EXTERNAL / NOT_TESTED |
| Live municipal data coverage is feed-specific and may be stale or unmatched | Full transit route overlay, fleet and ETA | Registry, GTFS/GTFS-RT adapters, freshness gates and probe tooling exist; read-only 2026-10-19 12:59 UTC probe checked 38 open feeds (32 healthy, 4 degraded, 2 offline, 5 skipped); current UI fixture confirms two line directions/four markers/three emphasized. A separate read-only local API probe at 16:00 UTC returned zero provider rows from the dirty local DB; no seed or write was run. | For each launch city: valid license, fresh feed, exact operator/route/trip/direction/shape crosswalk; initialize provider records in an isolated DB and verify current feeds before staging. Feed-owner remediation if IDs do not align. Fresh probe: `docs/audit/17_TRANSPORT_FEED_RECHECK_2026-10-19.json` | OPEN, partly external; local runtime has no provider records |
| No current owner approval to move production traffic is recorded here | Final production rollout | Candidate gates and rollback requirements documented | Explicit approval after reviewable candidate, manifest, smoke plan and rollback | BLOCKED_EXTERNAL |

Do not print secrets or private endpoint credentials here. Continue independent local implementation and verification while these remain open.

## Recheck — 2026-10-22 20:45 UTC

- Production deployment gate re-run with `docker compose -f compose.production.yml config -q` (configuration validation only; no containers started). It FAILS closed because the current `.env` does not provide: `APP_DOMAIN`, `MAP_DATA_MANIFEST_URL`, `MAP_STYLE_MANIFEST_URL`, `REDIS_PASSWORD`, `SESSION_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `VITE_MAP_STYLE_MANIFEST_URL`. No secret values were displayed. Compose also does not prove a domain points to an owned host or that upstream endpoints/object storage are reachable.
- Staging config first failed when Compose implicitly read the development `.env`, because staging secrets are intentionally separate. `.env.staging.local` exists with both required staging key names. Re-running `docker compose --env-file .env.staging.local -f ops/staging/docker-compose.yml config -q` **passes**. This validates local Postgres/Redis/S3Mock configuration only; no staging stack was started and there is still no public HTTPS host or deployed staging API/site.
- Environment inventory intentionally recorded only whether names are set, never values. `.env.production` and `.env.staging` are absent. Existing `.env` contains some required settings, but none were tested against provider/hosting services here.
- Candidate Server PR #29 exact-head CI run `39850929617` completed successfully, including a production API image build and isolated PostGIS/Redis image smoke. That is a build/runtime smoke, not a deployment or production origin.
- **Current deployment blocker:** owner/environment must provide an owned staging host and HTTPS/DNS configuration, staging-only DB/Redis secrets, and the production-required domain, session/SMS secrets, map manifests and provider/object-storage configuration. Deployment still requires the separately stated owner approval and rollback-ready candidate.

## Recheck — 2026-10-19 22:17 UTC

- Read-only GTFS-RT VehiclePositions probes to the public Lviv and Stryi endpoints both returned HTTP 200 with a current FeedHeader timestamp, but the decoded protobuf payloads had 0 entities and 0 vehicle positions (15 bytes each). This may reflect the overnight service window; it does not establish that the feeds are broken. Daytime vehicle matching to static route/trip/direction remains NOT_TESTED until a populated snapshot is observed.
- Server PR #15 (`966366977a059807793463f0867b1b79fdf92d48`) is open and mergeable; both exact-head CI checks passed. It remains stacked on PR #14 and is not deployed.
- Read-only candidate checks rechecked: Site #12, iOS #7, Admin #1 and Partner #1 pass their listed CI checks but remain unmerged. MarshGO PR #5 still fails its fail-closed private-repository checkout step because `MARSHGO_REPOS_READ_TOKEN` is unset; the log explicitly requires a token with read-only Contents access to MarshGO-Admin and MarshGO-Partner. No bypass was attempted.
- GitHub Deployments and Environments API rechecked for all six repositories: **0 deployments / 0 environments in each**. No GitHub-tracked staging or production origin/deployed SHA is available. An independently managed server outside GitHub records cannot be ruled out without its host/origin.

## Recheck — 2026-10-19 16:49 UTC

- Read-only GitHub API returned **0 environments and 0 deployment records** for MarshGO, MarshGO-Server, MarshGO-Site, MarshGO-iOS, MarshGO-Admin and MarshGO-Partner. An independently managed host may exist outside these GitHub records, but its origin and deployed SHA are not known here.
- Production Compose syntax validates with disposable placeholder values only (`docker compose -f compose.production.yml config --quiet`); no services were started and no credentials were supplied. It requires a real domain/DNS, Postgres and Redis secrets, session/SMS credentials, routing/geocoding endpoints, immutable map manifests, object storage, and a trusted-proxy count before bootstrap can run.
- Latest candidate PRs remain open: Server #10 (`ff6a3e2…`, exact-head CI PASS), Site #11 (`5879ad…`, exact-head CI PASS), iOS #7 (`51bb028…`, exact-head Simulator CI PASS); Admin #1 and Partner #1 remain open against `main`. No component was merged or deployed in this recheck.
- A live authenticated owner request through exact Server `ff6a3e2…` did return `LIVE` from the real Lviv feed on isolated local tmpfs services, including two route directions, eight fresh vehicles, and three approaching/emphasized for the selected real stop. This local probe cannot replace the missing staging host, operational secrets, backup/restore rehearsal, or production HTTPS smoke.

## Latest check — 2026-10-20

- Server PR #15 was updated to commit `ecdc1da` with deterministic route-wide GTFS segment sampling. Its exact-head CI was still pending at this checkpoint; do not treat the prior green PR #15 checks for `9663669` as evidence for the new commit.
- The live Lviv+Stryi comparison remains a local probe over static GTFS snapshots. Both baseline and candidate indicate truncated route results; no staging origin/deployed SHA was verified. Existing staging and production access blockers remain open.
- Exact-head CI recheck for Server PR #15 commit `ecdc1da`: both runs `39334694086` and `39334702837` PASS, including Postgres/Redis integration. PR remains unmerged; staging, deployment origin, and live fleet matching remain unverified.
- Docker daemon recheck after laptop restart still fails to connect to the local socket. Container runtime state is UNKNOWN; no containers or restart settings were changed.
- Server PR #15 route-wide graph-fill experiment was reverted in `76b4e1e` after local latency/RSS regression. The PR now carries the narrower oversized-trip sampler; rerun exact-head CI for the revert SHA before relying on hosted evidence.
- Latest Server PR #15 head `7d47db9` adds deterministic, endpoint-only graph-budget overflow fill. Local checks pass; exact-head CI is pending on runs `39335525958` and `39335537588`. The search remains explicitly truncated and no staging/production result exists.
- Server PR #15 commit `7d47db9` now has both exact-head CI checks PASS (`39335525958`, `39335537588`), including Postgres/Redis integration. It remains an open stacked PR; the deployment/staging and live-data blockers remain unchanged.
- Cross-repository candidate tuple now recorded in `RELEASE_MANIFEST.json`: Server `7d47db98ada941a212ba621385671f55d740aecf`, Site `a42719853f7bce331eefe27a8f51a888cb244aad`, iOS `e046367478e36282d1538f0d1d5114dbdd64c395`, API v1, migration 055. These are open PR candidate SHAs, not deployed versions.
- iOS PR #7 exact-head simulator CI proves the intended Site pin, not an API-connected product. No active local Site/API process or Docker daemon was available for this turn's local cross-repo smoke. Staging origin, live account flows and physical iPhone remain unverified.

## Continuation recheck — 2026-10-20

- Local Docker daemon is unreachable at the configured socket. Current running-container state is unknown; no containers, restart policies, or volumes were changed. Root development Compose defines PostGIS 17-3.5, Redis 7.4, and S3Mock. Production Compose is only a template and requires external secrets, host/DNS, maps, routing/geocoding, SMS and object-storage configuration.
- GitHub has no verified deployment/environment or deployed SHA for the candidate tuple. Server/Site/iOS exact-head PR checks are green but the PRs remain open and unmerged.
- `docs/RELEASE_MANIFEST.json` was stale (RC 2026-10-01 / migration 028). Its exact previous contents are preserved in `docs/archive/releases/RELEASE_MANIFEST_RC-2026-10-01-staging.9.json`; the current documentation copy now matches root `RELEASE_MANIFEST.json` (candidate RC 2026-10-19, migration 055, still NOT_RELEASED).

## Recheck — 2026-10-20, 23:00 Europe/Kyiv

- Read-only `docker ps` and `docker compose ps` both fail to connect to `unix:///Users/dima1203/.docker/run/docker.sock`. The current session therefore cannot enumerate active containers or run local DB/Redis/S3 integration. This may be resolved by starting Docker Desktop; no containers were changed by this check.
- The root development stack intended for local MARSHGO work is PostGIS at `127.0.0.1:5434`, Redis at `127.0.0.1:6380`, and S3Mock at `127.0.0.1:9090`/`9191`, as defined in `docker-compose.yml`. These are the configured services, not confirmed-running services.


## Recheck — 2026-10-20

- Local Docker daemon is currently unavailable at `unix:///Users/dima1203/.docker/run/docker.sock`; configured PostGIS/Redis/S3Mock ports have no listeners. Local DB-backed integration is therefore NOT_TESTED in this session. Do not alter containers or data until Docker is available and their identities are verified.
- No stable staging/production deployment target, secrets, or deployed SHA has been verified. Hosted CI does run isolated migration and Postgres/Redis integration for the Server PR, but that does not remove the staging/production blocker.

## Recheck — 2026-10-20, latest candidate

- Exact Server PR #17 SHA `a4d9d765902426e4ae6108d94b008f3c52950836` passed push and PR CI runs `39347569905` and `39347574593`, including migrations and Postgres/Redis integration. PR #17 and its base PR #15 remain open and unmerged.
- GitHub Deployments and Environments APIs returned empty lists for all six repositories: Server, Site, iOS, Admin, Partner and MarshGO. This confirms no GitHub-managed deployment/environment is configured in these repos; it cannot identify an external hosting account.
- Admin PR #1 (`9dbf7db0a935498ac40c98b19bc36bce056d630d`) and Partner PR #1 (`c639257a7f28aeda5b378a816038b01651146b83`) are clean and open. Fresh local checks passed: Admin 2/2 tests, typecheck, lint and production build; Partner 3/3 tests, typecheck, lint and production build. Their hosted checks are older (2026-10-14); no authenticated staging flow was run.
- Production/staging host, HTTPS origin, DNS, environment secrets, external provider agreements, and physical iPhone remain unverified. Keep the release `NOT_RELEASED` until those gates have current evidence.

## Rendezvous route approach — 2026-10-20

- Server PR #17 provides the route contract and reuses the configured OSRM CAR endpoint plus optional `WALKING_ROUTING_URL` FOOT endpoint. No public route geometry or ETA is emitted when an endpoint or fresh position is absent.
- A real pedestrian router endpoint and immutable graph version are not currently verified/configured. Without that external provider, passenger approach is explicitly `ROUTING_UNAVAILABLE`; there is no fallback to a straight-line path.
- Docker daemon is unavailable locally, so local migration/DB/Redis booking integration is NOT_TESTED. Exact-head push/PR CI passed on PR #17 SHA `e44a0082d97bede142e0f1587f361b0530d595d5` (runs 39340669345 and 39340681622), including the hosted migration and Postgres/Redis integration suites.
- Matching Site changes remain in a dirty working checkout and are not yet attached to an exact commit/PR. Staging credentials/domain, deployed SHA, two-device consented GPS test, and physical iPhone background behavior remain unverified.


## Updated 2026-10-20 — rendezvous map integration

- Site PR #13 (`cf4f9fa502fe0572614c8757ad42265f62c0831d`) is stacked on Site PR #12; checks were still running when last read. Its server contract depends on Server PR #17 (`e44a0082d97bede142e0f1587f361b0530d595d5`) and parent PR #15. Both Server #17 exact-head workflows passed, but neither deployment nor live provider is confirmed.
- `docker ps` and `docker compose ps` still cannot connect to Docker Desktop socket. Compose declares local PostGIS at `127.0.0.1:5434`, Redis at `127.0.0.1:6380`, and S3Mock at `127.0.0.1:9090` / `9191`; these are configured services, not confirmed running containers.
- No verified HTTPS staging URL, deployed SHA, production credentials, or live pedestrian routing provider is available in this session.


## Site PR #13 result — 2026-10-20

- Exact SHA `cf4f9fa502fe0572614c8757ad42265f62c0831d` passed all three Site CI jobs; browser acceptance passed 12/12 across Chromium, Firefox and WebKit. These run against the production build artifact without a live API; the logs show expected auth/connection failures, so they do not verify account or booking behavior.
- No GitHub Deployments or GitHub Releases were found across the six inspected repositories. This is not proof that no external host exists; its URL and deployed SHA are still unknown.
- Required before live acceptance: known staging host/domain and API origin, credentials/secrets, and a verified walking routing endpoint. Production deployment remains a separate explicit owner gate.


## Admin/Partner/iOS follow-up — 2026-10-20

- Admin and Partner repository `main` branches are README-only; their functional UI candidates are open PR #1 at `9dbf7db0a935498ac40c98b19bc36bce056d630d` and `c639257a7f28aeda5b378a816038b01651146b83`. Local checks pass but do not exercise live role/tenant authorization. The Server partner-platform foundation must be integrated before those UIs can be staged end-to-end.
- iOS PR #8 head `acea218b69b2ca70be7ca4ad90a30dc3ecc180a5` pins Site PR #13 SHA `cf4f9fa502fe0572614c8757ad42265f62c0831d`; exact simulator checks are pending. Physical device and live API acceptance remain unavailable.


## iOS exact Site pin result — 2026-10-20

- iOS PR #8 SHA `acea218b69b2ca70be7ca4ad90a30dc3ecc180a5` passed both simulator workflows (runs 39341725548 and 39341732044) with exact Site `cf4f9fa502fe0572614c8757ad42265f62c0831d`. This was an unsigned simulator compile; App Store archive/signing and physical-device checks were not performed.


## Local Docker and routing configuration — 2026-10-20

- Compose defines the local PostGIS 17-3.5, Redis 7.4, and S3Mock 5.2.2 services at loopback ports 5434, 6380, 9090, and 9191. Docker daemon is unreachable, so current running containers are UNKNOWN. No restart policy or container state was changed; Compose currently has no explicit service restart policy.
- A value-free scan of local env files found local OSRM/road-routing and DB/cache config keys, but no `WALKING_ROUTING_URL` or public API base URL. Do not treat this as a deployed or production configuration.

## Updated 2026-10-20 — Server graph follow-up

- Docker Desktop daemon is currently unreachable at the configured user socket. Local running container inventory, DB/PostGIS/Redis/S3 integration, migrations and restore tests are NOT_TESTED. Repository `docker-compose.yml` defines PostGIS 17-3.5 (`127.0.0.1:5434`), Redis 7.4 (`127.0.0.1:6380`) and S3Mock 5.2.2 (`127.0.0.1:9090`, `9191`); these are test dependencies, not verified active containers or production services.
- Server PR #18 exact-head CI is pending. A static-feed performance/recall re-probe is still required after CI.

- Server PR #18 is CLOSED before merge because the exact same transfer-only overflow experiment was already rejected for negligible recall improvement; its branch/commit are retained. No new route-search fix is accepted from it.

- Repeated current Lviv+Stryi GTFS probe still returns a bounded, explicitly partial result. A transfer-feasibility memoization candidate was reverted after no measured improvement; it does not clear the route-search completeness gate. No public-feed probe is a substitute for GTFS-RT, staging or production acceptance.

## Recheck — 2026-10-20, current session

- Local Docker Desktop daemon is unavailable at `~/.docker/run/docker.sock`; active container state cannot be enumerated and local DB/Redis/S3 integration cannot run until Docker is available. Compose definitions alone do not establish that services are running.
- Production/staging blocker remains unchanged: no verified deployment URL/API origin, environment, or deployed SHA is present in checked GitHub metadata. Do not infer that no externally hosted service exists; owner must provide its location/access for live acceptance.
- The route-search improvement is an engineering task, not an external blocker: test schedule-aware query-directed pruning under existing bounds before accepting a code change.

- Site PR #13 exact new head `8a509f6476a05b4bff1638804249520764a32593` was pushed with the active-strategy label fix. Hosted `Site CI` run `39343386437` was still IN_PROGRESS at the last check; staging API origin and credentials are still absent, so authenticated live acceptance remains blocked.
- Resolved for Site candidate: hosted CI run `39343386437` passed on exact PR #13 head `8a509f6476a05b4bff1638804249520764a32593`. Remaining blocker is live API/staging acceptance, not candidate CI.

- Candidate SHA synchronization is prepared, but iOS PR #8 hosted simulator CI run `39343592728` is still pending. Staging remains unconfigured, so the updated manifest is only a review-candidate manifest; it must remain `NOT_RELEASED`.
- Resolved for candidate CI: iOS PR #8 exact-head simulator run `39343592728` passed with the exact Site #13 SHA. Still blocked externally by absent staging URL/API origin and credentials; no deployed SHA or production acceptance.
- iOS candidate CI blocker resolved: PR #8 push run `39343592728` and pull-request run `39343597375` both passed at the exact SHA/pin pair. Physical iPhone and staging acceptance remain NOT_TESTED.

## Recheck — 2026-10-20, latest candidate tuple

- Current manifest pins Server PR #17 `1a3598cc270af0d353a2b22cda740f81daa0da73`, Site PR #13 `bee23b463059a1eb29b87d60a4249b042b6840d1`, and iOS PR #8 `b1c64a0ded8fb5f35e0bbde2d9f831a7011153e2`; iOS pins the exact Site SHA. All three PRs remain OPEN/UNMERGED. Site exact-head CI and local `check:production` pass (124/124 unit, 12/12 Chromium/Firefox/WebKit fixture browser checks); iOS exact-head simulator CI passes. Server commit `1a3598c` adds authenticated 30/60/120-minute API integration assertions; local typecheck/lint and 274 unit tests pass, and exact-head runs `39348608536` and `39348612060` pass migrations plus Postgres/Redis integration. The CI DB had no enabled healthy Lviv GTFS feed, so the API acceptance did not exercise a live/healthy GTFS worker search; deterministic fixture-backed API search and staging remain open.
- Rechecked Docker after the operator restarted the laptop: daemon still unavailable at the configured socket, so local Postgres/Redis/S3 service state remains UNKNOWN and DB-backed local integration is NOT_TESTED. No container or volume was changed.
- No verified staging or production URL/API origin/deployed SHA is available. A local Site preview is available at `http://127.0.0.1:3000` for UI inspection only; the API is not running there. This is not a stable external preview and must not be counted as staging.
- Required to close production gates: provide access to the intended staging host/API origin and its test configuration/credentials; verify real data/provider behavior and database operations there; perform backup/restore and rollback acceptance; then obtain explicit owner approval for a specific production rollout. Physical iPhone/signing/APNs and provider-specific commercial credentials remain separate open gates.

## Recheck — 2026-10-20, container and cross-repository CI

- Local Docker daemon still cannot be reached, so current running containers are UNKNOWN. The root `MarshGO/docker-compose.yml` configures `db` (PostGIS), `redis`, and `s3mock`; the Server candidate's separate compose configures `db`, `redis`, and disposable `redis-cache`. These are development/test services. Do not assume either configuration is running.
- Candidate Server PR #17 exact head `1a3598cc270af0d353a2b22cda740f81daa0da73`, Site PR #13 `bee23b463059a1eb29b87d60a4249b042b6840d1`, and iOS PR #8 `b1c64a0ded8fb5f35e0bbde2d9f831a7011153e2` have hosted checks PASS. Parent Server PRs #10/#12/#14/#15, Site PRs #9/#11/#12, and iOS PR #7 also report checks PASS; Admin #1 and Partner #1 report verify PASS. These PRs remain in dependency stacks and do not establish that code is merged to the default branches or deployed.
- Legacy MarshGO PR #5 head `f944560a3babf7423befc53741217d9281f44dab` has a failed `verify`: its workflow requires the GitHub Actions secret `MARSHGO_REPOS_READ_TOKEN` with read-only Contents access to private `MarshGO-Admin` and `MarshGO-Partner`. Gitleaks and CodeQL checks passed. The failure is an external credential/configuration blocker; do not weaken or skip the required check. The secret value was not accessed or logged.
- Locally, Server focused GTFS parser/worker/routing/RT/fare tests passed 73/73, lint passed, and typecheck passed on Node 25.4.0 (repository requires Node 24.21.0). Local API/Postgres/Redis acceptance remains NOT_TESTED because Docker is unavailable.

- Legacy MarshGO PR #5 verification is blocked on the repository Actions secret `MARSHGO_REPOS_READ_TOKEN` (read-only Contents access to private Admin/Partner repos); exact head `f944560a3babf7423befc53741217d9281f44dab`. The failed workflow exits before cloning those private repositories. The check was not bypassed; Gitleaks/CodeQL passed. This credential must be configured by an authorized repository owner.


## Recheck — 2026-10-20, aligned RC.5 candidate

- Exact cross-repository candidate CI is green: Server PR #21 `cbf17c2ccf05d7a7e3126fa0caf74ef8049bc7a2` runs `39356020667` and `39356033329`; Site PR #13 `7e704142bd6ad07ae544e78bd569fa29718ced62` runs `39355497894`, `39355501509`, `39355501591`; iOS PR #8 `fc603e5b07d818b9d9577355449a58d7b1e0cf1e` runs `39355771601`, `39355775363` and pins the exact Site SHA. These PRs remain open/unmerged.
- GitHub Environments and Deployments APIs currently return zero entries for all six inspected repositories (MarshGO, Server, Site, iOS, Admin, Partner). This confirms there is no registered GitHub staging/deployment target, but does not rule out an external host. No verified staging URL, API origin, test credentials, or deployed SHA is available to run live acceptance.
- Legacy MarshGO PR #5 still requires the authorized read-only `MARSHGO_REPOS_READ_TOKEN` for private Admin/Partner clone checks. Rechecked Actions secret names only: the required token is not configured in the MarshGO repository. It remains an external CI configuration blocker; do not bypass it.
- Local Docker daemon is still unavailable. No containers or volumes were started, stopped, or modified in this continuation.
- Production remains `NOT_RELEASED`; no deploy or traffic change was performed.


## Recheck — 2026-10-20, RC.6 and container configuration

- Current review tuple is Server PR #21 `cbf17c2ccf05d7a7e3126fa0caf74ef8049bc7a2`, Site PR #13 `0a773f55f512fd14a57600d6817f7e938cf10886`, iOS PR #8 `68749c5ee1bbd59afb8e47584403795034b7c88b` pinning that Site SHA. Exact-head CI is PASS; the PRs remain OPEN/UNMERGED.
- Read-only Compose service inventory: root development `db` (PostGIS), `redis`, `s3mock`; Server development `db`, `redis`, `redis-cache`; production Compose `db`, `redis`, `migrate`, `api`, `web`, `admin`, `partner`, `proxy`. Production config rendered only with disposable placeholder environment values; it was not started.
- `docker ps` cannot connect to `unix:///Users/dima1203/.docker/run/docker.sock`; actual container state is UNKNOWN. No containers, restart settings, volumes, or data were changed.
- Production Compose requires verified runtime values for required variables `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `TRUST_PROXY_HOPS`, `SESSION_SECRET`, `APP_DOMAIN`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `OSRM_URL`, `GEOCODING_ENGINE_URL`, `GEOCODING_REVERSE_URL`, `MAP_STYLE_MANIFEST_URL`, `MAP_DATA_MANIFEST_URL`, `S3_BUCKET`, `S3_REGION`, and `VITE_MAP_STYLE_MANIFEST_URL`. `GEOCODING_API_KEY` and S3 endpoint/credentials are optional in Compose but may be required by the chosen services/policies. The service-list command reads config only and starts nothing; a rendered config is not deployment readiness. Obtain and validate the real staging environment/configuration before attempting deployment.
- No registered environment/deployment record or verified deployed SHA has been identified. Keep staging and production gates `BLOCKED_EXTERNAL`/`NOT_TESTED`; do not report the Compose stack as deployed.

## Recheck — 2026-10-21, current production gates

- Rechecked GitHub Deployments, Environments and repository Actions secret names for MarshGO, Server, Site, iOS, Admin and Partner. All six report zero deployments, zero environments and no repository Actions secrets. This rules out a configured GitHub deployment target in those repositories; an unregistered external host may still exist, but its URL and deployed SHA have not been supplied or verified.
- MarshGO PR #6 exact head `af5f0abd11396fd65c022648688d48fbb1c071a1`: CodeQL/Gitleaks PASS; clean installs, dependency audits, lint, typecheck, unit tests, database migration, Postgres/Redis integration, production build and bundle gate all pass. Hosted verify then fails closed because `MARSHGO_REPOS_READ_TOKEN` is absent; release materialization/image build/browser E2E are skipped. Authorized owner must add a read-only Contents token for the private Admin and Partner repositories and rerun the check.
- Current Docker recheck cannot connect to the local Docker daemon. Development Compose parses and defines PostGIS, Redis and S3Mock; staging Compose requires staging-only Postgres/Redis secrets and does not render without them. No active container inventory, restart policy, service health or volume state can be verified; no container or volume was changed.
- These external gates are not a reason to stop independent work, but staging, deployed artifact, live-provider acceptance, physical-device acceptance and production smoke remain blocked/not tested. Keep release state `NOT_RELEASED`.

### Exact iOS candidate refreshed — 2026-10-21

- iOS PR #9 exact head `8d195019fd6c6710f545e1ec6e5caf2f057627f2` pins Site PR #14 exact head `3d4148664b9c68f1a1083ea979228d2078a1125e`. Previously stale PR workflow `39624491061` was rerun as attempt 2 and passed, along with same-SHA workflows `39625763494`, `39625815295`, `39625815376`, `39625821051`: revision assertion, web build, Capacitor sync, and Simulator compile all passed. PR rollup is CLEAN.
- This closes the stale simulator-CI check only. Physical iPhone, signing/TestFlight, APNs, background GPS, live API and staging remain NOT_TESTED. No merge or deployment occurred.

## Paired rendezvous E2E update — 2026-10-21

- Site PR #14 now includes a production-entry two-browser-context test for driver/passenger meeting-map consent, GPS posts, shared fresh-position reads, pickup approaches and role-relative UI. Local full Site production check passes with 15/15 browser scenarios across Chromium, Firefox and WebKit. This fixture test closes the browser-coverage gap only; it does not remove the external live-staging or physical-device blockers.
- iOS PR #9 now pins the updated exact Site SHA `15a4d5207f35620e37fb43960327f4a6645ded5e`; its head is `57c3cc800b40c5468d10e2604f53ee272968f20a`. New Site and iOS exact-head workflows were pending when recorded.
- Still required: real HTTPS staging URL/API origin and test credentials; verified live transport-provider data; two physical devices for GPS permission/consent/network handoff; physical iPhone background behavior and APNs/signing as applicable; production host/config/secrets, backup/restore rehearsal and explicit rollout approval. Current release state remains `NOT_RELEASED`.

### Hosted checks completed for paired rendezvous candidate — 2026-10-21

- Site PR #14 exact head `15a4d5207f35620e37fb43960327f4a6645ded5e` passed all exact-head hosted checks: `39630678642`, `39630670846`, `39630678801`. Full browser acceptance is 15/15, including paired deterministic GPS/rendezvous contexts.
- iOS PR #9 exact head `57c3cc800b40c5468d10e2604f53ee272968f20a` passed simulator checks `39630732616`, `39630737999` and pins that exact Site SHA.
- This removes the pending-CI issue only. No live staging endpoint, provider authorization/freshness evidence, physical two-device GPS, physical iPhone background/APNs/signing, or production deployment/deployed SHA is available. Production remains `NOT_RELEASED`.

### Production candidate refresh — 2026-10-21

- Site PR #14 `a3cd07f56edd2eb7a4f1c1ffba52e32787a1da29` and iOS PR #9 `303e368952d35f0e97a4855901cb2ce8fd4b24db` passed exact-head checks; iOS pins the exact Site SHA. This closes candidate CI for the updated web entry recovery only.
- GitHub deployments API returned zero deployment records across MarshGO, Server, Site, Admin, Partner and iOS. This does not prove there is no deployment outside GitHub; a verified staging/production URL and API origin are still required for acceptance.
- Docker daemon remains unavailable at its configured socket. Root development Compose declares PostGIS 17-3.5 and Redis 7.4 for integration work, plus optional S3Mock 5.2.2. No active-container or restart-policy state can be confirmed, and no container/volume was changed. Dev Compose declares no restart policy; production Compose declarations are not proof of a running deployment.
- Remaining external gates: staging origin/credentials, production host and secrets, physical iPhone/two-device GPS acceptance, live provider commercial/auth access, backup/restore rehearsal, and explicit owner approval for production traffic.
- Release status remains `NOT_RELEASED`.


## Recheck — 2026-10-21, after Server candidate update

- Server PR #23 is at `0d13b1b58bb1d8ba5fd2d93d14e344c7c8237521`; both exact-head CI runs `39635832510` and `39635839030` pass, including disposable CI Postgres/Redis integration.
- Local Docker daemon remains unreachable at `/Users/dima1203/.docker/run/docker.sock`; local container identity and health are UNKNOWN. No local container or volume was changed.
- No verified staging URL/API origin, deployed SHA, live test accounts, or production host configuration has been provided in this workspace. This remains an external prerequisite for staging and production acceptance; CI does not satisfy it.


## Recheck — Server mixed-mode sampler candidate

- Server PR #23 now points to `1ab6034348a8e48adca0c46df472273054eb023f`; push CI `39636489795` passed the full suite plus Postgres/Redis integration. PR-event CI `39636499906` also PASS, including migrations and Postgres/Redis integration.
- Docker remains unavailable locally at the configured socket; local container state is UNKNOWN. This change was independently checked by hosted CI. No containers or data were changed.
- Staging origin/configuration and deployed SHA remain unavailable; these are still required for live acceptance and production release.


## Lviv upstream data quality observation — 2026-10-21

- Fresh VehiclePositions are available at the sampled endpoint, but none of 604 reported `currentStopSequence`; therefore highlighting vehicles as approaching a chosen stop is not currently supported by that field. TripUpdates are available, but are not by themselves proof of a coordinate-to-stop progression.
- One TripUpdates response failed protobuf decoding and its immediate retry succeeded. This requires resilient fallback and ongoing observation; it is not a confirmed sustained outage. No credentials or agreements were requested by this probe.
- The user-facing route/vehicle UI and production API were not exercised; live marker and ETA behavior still needs staging acceptance.


## Exact Server test-oracle SHA verified — 2026-10-21

- Server PR #23 SHA `7af472973d5d4f955ff89edc82b10e6d378c6ebe` is now verified by push/PR CI runs `39637115094` and `39637125775`; both pass the full test and PostgreSQL/Redis integration gates. PR remains OPEN/DRAFT and mergeable.
- Staging origin and deployment remain absent; no live product acceptance or production smoke has occurred.


## Recheck — GTFS vehicle approach identity and local containers, 2026-10-21

- Lviv's official TripUpdates and VehiclePositions are separate configured feeds. Stop-arrival/search already consumes TripUpdates, but the selected-journey map currently consumes positions + static schedule only. In the sampled VehiclePositions, no `currentStopSequence` or `startDate` was reported. A fresh position sharing only `tripId` with a dated TripUpdate is insufficient evidence to attach that prediction to a specific vehicle when the trip ID can recur on another service date. Keep icon-specific approach emphasis and vehicle ETA unverified until the provider offers a safe dated/progress crosswalk or staging proves another exact mapping.
- `docker ps` still cannot reach the local Docker Desktop socket after the laptop restart. The project dev Compose definitions are PostGIS, Redis, and optional S3Mock; they do not set an automatic restart policy. Do not infer these are active. Production Compose is a configuration template, not a running stack. No containers, volumes, or restart settings were changed.
- These findings do not block independent route/source work, but local DB-backed acceptance needs Docker availability, and production acceptance still needs a real staging origin/configuration, test accounts, backup/restore rehearsal, physical-device checks, and explicit rollout approval.

### Release execution blockers refreshed — 2026-10-21

- No verified staging or production URL, API origin, deployment host, or provisioned runtime credentials are available in the inspected repositories/GitHub deployment records. Production rollout remains blocked pending owner-provided target/configuration and the separately required final authorization.
- Exact latest Server and Site candidate CI passed; iOS push simulator check passed and PR simulator check remains in progress. See `docs/PRODUCTION_EXECUTION_STATE.md`. Do not mark the tuple released from CI alone.
- Local Docker daemon is unreachable at `~/.docker/run/docker.sock`; therefore local active Postgres/Redis/S3Mock state is unknown. Compose files describe services but do not prove they are running.
- Lviv vehicle-position data currently omits vehicle `startDate` and `currentStopSequence`; safe route-wide fresh positions can be shown muted, but exact per-vehicle approach emphasis cannot be established from that feed until the source provides compatible progress identity. Do not join to a TripUpdate by `tripId` alone.


### Exact candidate and deployment recheck — 2026-10-21

- Server #23, Site #14, and iOS #9 exact-head CI is green on the synchronized tuple recorded in both release manifests; all are still open/draft, unmerged, and undeployed. iOS simulator runs `39640363802` and `39640352034` both passed with exact Site SHA `9f5f2c8e834dce266e8facbf124416304fc6992a`. This does not prove physical-device or production behavior.
- The production blocker remains external: no verified staging URL/API origin, credentials, deployment host, or deployed SHA. The root umbrella validation is blocked on the read-only private-repository token `MARSHGO_REPOS_READ_TOKEN`; CI security scans were not bypassed.
- Physical iPhone/signing/APNs, live-provider acceptance, staging backup/restore and rollback, and authorized production rollout remain open. Do not change `NOT_RELEASED`.
- Docker local runtime is still unknown while Docker Desktop's daemon socket is unreachable; Compose files identify configured services, not active containers.

### Exact-candidate route-search limitation — 2026-10-21

- Exact Server PR #23 SHA `5e838142df0689869f0637951668163bd80d3a6c` returns two schedule-based North Lviv→Sykhiv alternatives on the current static feed, but reports stop selection and candidate sampling truncation. Raising only the walking radius or displayed result limit did not change the candidate set or clear the truncation.
- The diagnostic `resultLimitReached` flag is true here because candidate sampling omitted alternatives; the actual returned card count is two, and the internal `candidateResultLimitReached` counter is zero. Do not tell users that two cards exhausted the display limit.
- This is a code-level bounded-search limitation, not an external credential blocker. It needs a controlled server fix/recall test; staging remains separately blocked by the missing verified host, API origin, and test access.


### Admin/Partner candidate refresh — 2026-10-21

- Admin PR #1 exact SHA `9dbf7db0a935498ac40c98b19bc36bce056d630d` and Partner PR #1 exact SHA `c639257a7f28aeda5b378a816038b01651146b83` remain OPEN/CLEAN. Local exact-source tests, typecheck, lint and production builds pass (Admin 2/2 tests; Partner 3/3). Their hosted verify runs are from 2026-10-14, so the new local results do not refresh hosted CI.
- No staging API/test accounts are available to validate server-side tenant membership, role enforcement, real provider/ingestion administration, or partner operations. Root umbrella CI still requires the missing read-only `MARSHGO_REPOS_READ_TOKEN` to materialize private Admin/Partner repositories.

### Current Site/iOS candidate checks — 2026-10-21

- Site PR #14 is updated to `01b32997ec3e6efaa8ac5f217de1e7ee502f4227`; local production checks pass, two GitHub checks passed and the exact-head `Verify Site` run `39651835297` was still in progress when recorded.
- iOS PR #9 is updated to `9eee78dc7ea3ab9e1012ebe70cd04cfae6c6b3fd`, pinning that exact Site SHA; local unsigned simulator compilation passed, and GitHub runs `39652059040` and `39652053125` were still in progress.
- These are transient CI checks, not external blockers. Do not mark exact hosted checks PASS until terminal SUCCESS.


### Root integrated candidate exact local gate — 2026-10-21

- MarshGO PR #6 exact SHA `af5f0abd11396fd65c022648688d48fbb1c071a1` passes local production gate on Node 24.21.0: 235 tests pass, one opt-in DB test skips, typecheck/lint/build/bundle pass, npm production dependency audit reports zero vulnerabilities, and its worktree is clean.
- Hosted root umbrella verify remains blocked by absent read-only `MARSHGO_REPOS_READ_TOKEN`, which it needs to check out private Admin and Partner repositories. CodeQL and Gitleaks pass; the required checkout gate was not bypassed.
- Root browser E2E and local DB integration cannot run now because PostgreSQL on loopback port 5434 is unreachable and Docker Desktop is unavailable. No test database or OTP rows were modified.
- This resolves the dependency vulnerability only on the PR #6 integration candidate; the dirty base workspace is not a release SHA. No staging/production host, API origin, credentials, deployed SHA, or owner-approved rollout is available.


### Fresh feed and local-service recheck — 2026-10-21 18:05 UTC

- Read-only feed probe: 43 catalog rows, 38 attempted, 31 healthy, 4 degraded, 3 offline, 5 skipped. Lviv schedule loaded but both sample searches truncated. Supplementary GBFS probe did not confirm Ukrainian CityBikes/Zelectra/Nextbike supply. Details are in `docs/audit/36_TRANSPORT_FEED_RECHECK_2026-10-21.md`; this is not exact release-Server or staging acceptance.
- Local Site `127.0.0.1:3000`, API health/ready `127.0.0.1:3002`, and Postgres `127.0.0.1:5434` are unreachable. Docker Desktop socket is unreachable. Starting Docker could restart unrelated user containers and was not attempted. No local database or container was modified.
- Complete browser-to-API/DB acceptance is therefore externally/runtime-blocked until an approved isolated staging/runtime is available. Production remains `NOT_RELEASED`.

### Exact Site/iOS candidate CI refreshed — 2026-10-21

- Site PR #14 at `01b32997ec3e6efaa8ac5f217de1e7ee502f4227`: hosted runs `39651835297`, `39651835499`, `39651826197` all PASS; PR remains OPEN/DRAFT.
- iOS PR #9 at `9eee78dc7ea3ab9e1012ebe70cd04cfae6c6b3fd` pins that exact Site SHA; hosted simulator runs `39652059040`, `39652053125` both PASS. Physical iPhone, signing/TestFlight, live API origin, APNs and background GPS remain NOT_TESTED.
- External runtime still required: staging host and API origin, credentials/test accounts, isolated PostgreSQL/PostGIS/Redis runtime, backup/restore and rollback rehearsal. No deployment URL/SHA is verified; production stays NOT_RELEASED.

### Server route-stop coverage candidate update — 2026-10-21

- Server PR #23 now points to 8889fce11cf78d2c29c8d0ca8cad8b567b0ef67b; local Node 24.21.0 typecheck/lint, 290 unit tests and production dependency audit pass, with 3 opt-in DB/Redis tests skipped. Hosted exact-head runs 39653279552 and 39653291171 both completed successfully, including migrations and PostgreSQL/PostGIS plus Redis integration.
- The bounded stop-pattern quota change improves stop coverage in four of five frozen Lviv query pairs; the absolute stop and candidate sampling limits still leave route search partial. It is not a staging/live feed acceptance result.

### Fresh release execution blockers — 2026-10-21 18:40 UTC

- **Staging/production target:** no verified deployment origin, API origin, deploy host, environment, credentials or deployed SHA is present in inspected GitHub configuration. Needed for authenticated end-to-end acceptance, provider freshness checks, backup/restore and smoke tests.
- **Release secrets:** deployment credentials and runtime provider secrets must be supplied through the hosting secret manager; none are available in the checkout. Do not paste secrets into chat, source, or reports.
- **Root umbrella checkout:** hosted root PR #6 still requires the read-only `MARSHGO_REPOS_READ_TOKEN` to retrieve private Admin/Partner repositories. Existing security checks remain enabled.
- **Physical iOS acceptance:** requires a physical iPhone and authorized signing/TestFlight setup for GPS permissions/background, deep links and push. Simulator CI is green but does not close this.
- Candidate CI itself is no longer blocking: Server `8889fce…`, Site `4ea5248…`, and iOS `cacd3f0…` exact checks passed. Release remains `NOT_RELEASED` until staging and deployment evidence exist.
- **Production Compose configuration preflight:** read-only `docker compose ... config --quiet` is blocked because required domain, routing/geocoding/map endpoints, Postgres/Redis credentials, S3 bucket/region, session secret, trusted proxy count, Twilio credentials/from-number and versioned map style URL are unset. Variable names are recorded in `PRODUCTION_EXECUTION_STATE.md`; secret values are intentionally not collected. The user/operator must identify the actual host and enter secrets in its secret manager before a deploy can be assembled.
- **Staging environment file:** `.env.staging.local` exists but none of the required deployment variables has a nonempty value. The production template's preflight is therefore not actionable yet. A separate local `.env` is not assumed to be staging or production configuration and was not copied, printed, or used for deployment.


### Candidate refresh and remaining release gates — 2026-10-21

- Site PR #14 is at `9b708741c039daf6033585cb2d6be48a879715d9`; iOS PR #9 is at `c0676f5d12bb3548937f3192e90447c7399c5a35` and pins that Site SHA. Their exact CI checks pass. The WebView still showed a short white cold-start period in the simulator; physical iPhone validation is still required.
- Server PR #23 is at `8889fce11cf78d2c29c8d0ca8cad8b567b0ef67b` with hosted DB/Redis integration checks passed, but static Lviv route search remains partial due bounded stop/candidate sampling. This is a code-quality item still under investigation, not an external blocker.
- True staging/production verification still needs an identified host and API origin, deployment access/secrets in the host secret manager, isolated test accounts/data, and backup/restore + rollback rehearsal. The production Compose preflight names are in the prior checkpoint; no secret values are collected.
- Root umbrella PR #6 remains blocked on owner-provided read-only `MARSHGO_REPOS_READ_TOKEN`; do not bypass private repository access checks. Physical iPhone acceptance additionally needs the device and signing/setup for native permissions, deep links, APNs and background GPS.
- Candidate builds and CI are not deployment evidence. No merge, deploy or release has occurred; status remains `NOT_RELEASED`.


### Deployment source pin safety — 2026-10-21 19:08 UTC

- Integration PR #6 commit `b2535369f4636f1f2bb63f96525f2a1b4f929f08` adds fail-closed checks so deployment/backup/restore cannot silently select a stale generated Compose artifact. Local Node 24.21.0 full gate passed (241 tests pass, one opt-in DB integration skipped); hosted Security `39658734706` passed. CI `39658734667` completed; all checks through Postgres integration/build/bundle passed, then the private Admin/Partner checkout step failed because `MARSHGO_REPOS_READ_TOKEN` is absent. Materialization, image builds and E2E were skipped.
- The existing outer generated `.release/compose.production.yml` is an older local artifact; it is not a deployable release candidate. Use only a freshly materialized artifact whose pins and hashes pass the new check.
- The actual staging host/API origin and secret-manager access are still unknown, so this safety fix does not enable deployment. Root private-repository checkout still requires read-only `MARSHGO_REPOS_READ_TOKEN`.


### iOS first-paint candidate refresh — 2026-10-21 19:15 UTC

- iOS PR #9 uses exact Site `c50ba344b7dfde9859826363fea119d95e2cc54e`; local simulator launch shows the welcome screen at 1s and 3s. Hosted iOS run `39659884926` succeeded on the exact candidate. The physical-device, staging and signed-release gates remain open.
- No physical iPhone acceptance, staging API credentials/origin, APNs configuration, background-GPS verification, or signed release workflow is available. The splash-screen change addresses the observed simulator first-paint gap only.

- Latest PR #9 repeat run `39660236409` and earlier exact-SHA run `39659884926` both passed. Current machine recheck: local web/API are not running and the Docker daemon is unreachable, so no local DB-backed staging acceptance can be executed now. Hosted Server Postgres/PostGIS + Redis CI remains the available integration evidence.


### Route-search continuation — 2026-10-21 19:25 UTC

- Server PR #24 exact head `c33651b1387e0d2b377216a0b88f6ae02cdbec32` adds a strategy-sampling regression and a tiny exhaustive transfer oracle; local suite/typecheck/lint pass, final hosted run `39661572594` passed, including DB migration and PostgreSQL/PostGIS + Redis integration.
- This did not clear dense-feed search truncation. Local Docker remains unavailable for opt-in DB/Redis tests; hosted Server integration remains the DB-backed proof for its prior exact candidate.

- The exhaustive oracle verifies only a tiny one-transfer feed; dense-feed completeness remains a code limitation to solve, not an external dependency.
# Current release gates — 2026-10-21 19:30 UTC

- Server candidate CI is not a blocker: PR #24 exact SHA `c33651b1387e0d2b377216a0b88f6ae02cdbec32`, hosted run `39661572594`, passed dependency audit, lint, typecheck, unit tests, migrations and PostgreSQL/PostGIS + Redis integration. Dense Lviv search remains a code-level PARTIAL finding, not an external blocker.
- **Staging/production target and runtime access:** no verified host, HTTPS URL, API origin, isolated staging DB/runtime, deploy credentials or deployed SHA. Needed for real account/provider acceptance, backup/restore, rollback and smoke testing.
- **Production configuration:** required secret-manager values and service endpoints are not available in this environment. Only variable names are documented in the execution state; secret values are not requested or recorded.
- **Private repository CI access:** MarshGO umbrella PR #6 requires authorized read-only `MARSHGO_REPOS_READ_TOKEN` for private Admin/Partner contents. The required Actions secret is absent; do not bypass that gate.
- **Physical iOS:** physical iPhone and authorized signing/TestFlight setup are needed to validate native GPS permissions, background behavior, deep links and APNs. Simulator CI is not a substitute.
- **Operator actions:** production deployment/traffic change, irreversible DB migration, and App Store publication remain gated on a concrete reviewed release candidate and explicit owner approval.

## Recheck — 2026-10-21 20:22 UTC

- Docker is now available after the laptop restart. Local E2E dependencies PostGIS `db` and Redis were started only for verification and stopped afterward; `docker ps` is empty, S3Mock remains stopped, and named volumes were preserved. This removes the local Docker availability blocker only. The test runtime is isolated on loopback and does not establish staging or production readiness.
- Staging/production target, HTTPS/API origin, runtime secrets, private Admin/Partner CI token, physical iPhone acceptance, backup/restore, rollback, and explicit production rollout approval remain unresolved as listed above.

## Recheck — 2026-10-22, current GitHub and local runtime

- Read-only GitHub inventory across seven repositories found **zero deployment records** in MarshGO, MarshGO-Server, MarshGO-Site, MarshGO-iOS, MarshGO-Admin, MarshGO-Partner and MarshGO2. This confirms there is no GitHub-tracked deploy/deployed SHA; it cannot rule out an independently hosted service whose origin was not supplied.
- Candidate component checks now rechecked: Server PRs #21–#24 each have both listed `verify` checks SUCCESS, including current PR #24 SHA `6bf44d9781b6493f35a67bd01f6e8e0a3c7fc863` (runs `39683473969` and `39683481586`). Site #11–#14 checks PASS; iOS #7–#9 simulator checks PASS; Admin #1 and Partner #1 checks PASS. PRs remain unmerged, and several are stacked rather than one integrated mainline tuple.
- MarshGO root PR #5 run `39219238512` and PR #6 run `39658734667` both fail only at the explicit read-only private Admin/Partner materialization gate because the `MARSHGO_REPOS_READ_TOKEN` Actions secret is empty. Required token scope: read-only Contents access for those two repositories. CodeQL/Gitleaks runs listed for the same PRs pass. No secret value is recorded here.
- Local Docker inventory after the isolated integration run: no running containers. Root development `docker-compose.yml` provides PostGIS, Redis, and optional S3Mock; stopped persistent `marshgo-db-1`/`marshgo-redis-1` use named volumes and `restart=no`. They were not started or modified. Temporary test containers used no volumes and were removed. Existing `pro_clickhouse_data`/`pro_clickhouse_log` volumes were not inspected internally or removed; no active container named `pro` was observed.
- These checks do not satisfy staging/production acceptance. Required external gates remain: verified HTTPS staging host/API origin and test credentials, production domain/secrets and deployment permission, live provider contracts/credentials as applicable, physical iPhone/two-device acceptance, backup/restore and rollback rehearsal, and final owner approval before production traffic.

## Перевірка GitHub deployment configuration — 2026-10-22

- Read-only GitHub metadata check: у `MarshGO-Server`, `MarshGO-Site`, `MarshGO-iOS`, `MarshGO-Admin`, `MarshGO-Partner` і `MarshGO` немає налаштованих GitHub Environments або repository Actions secrets. Перевірено лише метадані і назви; секретні значення не читалися. Це не виключає зовнішні сервери чи сховища облікових даних.
- Блокер: немає підтвердженого staging URL/API origin і deploy credentials/config. Потрібно надати цільове тестове середовище та доступ до його deployment pipeline; до цього реальний staging/prod smoke і deployed SHA перевірити неможливо. Локальні перевірки та підготовка коду продовжуються незалежно.

## Актуалізація — 2026-10-22

- Server PR #24 exact head `d128e9b2b94cd3bc08bb3d7f5a16e1a3ea73508c` і Site PR #14 `c50ba344b7dfde9859826363fea119d95e2cc54e` пройшли локальні marketplace E2E (9/9) та Chromium/Firefox/WebKit acceptance (6/6). Це не знімає жодного зовнішнього deployment-блокера: немає перевіреного staging origin, доступу/секретів для розгортання, HTTPS smoke чи deployed SHA.
- Після прогону перевірено Docker: використовувані loopback PostGIS (`marshgo-cache-e2e-postgres`, 5544) і Redis (`marshgo-server-cache-redis-cache-1`, 6381) вже працювали до цієї сесії, обидва мають окремі persistent volumes; Redis належить іншому Compose-проєкту `marshgo-server-cache`. Їх не змінювали й не зупиняли. Дані E2E обмежені окремою БД із префіксом `marshgo_e2e_`.
- Strict screenshot approval лишається PARTIAL через непідтверджене походження старих/змінених golden images; фізичний iPhone/Safari, комерційні договори/ключі, backup/restore rehearsal та окреме підтвердження production rollout залишаються відкритими.


## Перевірка після pinned-runtime повтору — 22.10.2026

Exact candidate Server `d128e9b2b94cd3bc08bb3d7f5a16e1a3ea73508c` + Site `c50ba344b7dfde9859826363fea119d95e2cc54e` тепер має 9/9 marketplace E2E та 6/6 cross-browser behavior PASS на Node 24.21.0 ізольовано на loopback. Це усуває попередню різницю runtime для цих тестів, але не deployment блокери. MarshGO umbrella PR #6 усе ще чекає на read-only `MARSHGO_REPOS_READ_TOKEN` для private Admin/Partner materialization. Немає підтвердженого staging URL/API origin/deploy access; отже hosted staging, deployed SHA, HTTPS smoke, backup/restore та rollback acceptance лишаються не виконаними. Продакшн статус `NOT_RELEASED`.

- Перевірені лише назви ключів локальних `.env` файлів: `.env.staging.local` має тільки `STAGING_POSTGRES_PASSWORD` та `STAGING_REDIS_PASSWORD`; staging URL/API origin/deployment target у ньому не задані. Значення секретів не читалися й не записувалися.

- Server exact-head local PostGIS/Redis integration повторена на `d128e9b2b94cd3bc08bb3d7f5a16e1a3ea73508c` під Node 24.21.0: 30/30 PASS, clean checked-in migrations through 055. Це знімає невизначеність щодо локального DB/Redis сценарію, але staging/deploy/backup/restore gates не закриває.

### Поточний production E2E / release блокер — 2026-10-22

- Root full E2E on exact Server/Site candidate pair завершився **15/16**: є строгий dark screenshot mismatch 63,327 px (19%). Actual екран — список пошукових результатів, expected golden — інше компактне route summary/detail подання. Затверджений еталон для цього кроку не встановлений; зміна snapshot без узгодження була б приховуванням невідповідності. Потрібне рішення через доступні design references або власника, поки visual acceptance `FAIL/PARTIAL`.
- Для deployment лишається зовнішній блокер: немає підтвердженого staging URL/API origin, deployment credentials/configuration, deployed SHA або HTTPS smoke target. GitHub Actions metadata не містить environment/secrets. Production не розгортався.
- Umbrella CI потребує власником налаштованого read-only `MARSHGO_REPOS_READ_TOKEN` для Admin/Partner приватних репозиторіїв. Перевірку не обходили.
- Фізичний iPhone, реальний фоновой GPS/push, провайдерські договори/ключі, backup/restore та rollback rehearsal залишаються неперевіреними або заблокованими окремо.

### Site candidate acceptance clarification — 2026-10-22

- The production frontend candidate is Site PR #14 (`c50ba344b7dfde9859826363fea119d95e2cc54e`), not the old root `SearchResultsList`. Its complete local gate now passes 21/21 browser scenarios and 125/125 units; exact-head hosted PR checks pass. This does not close real staging acceptance: the local Site Playwright run deliberately has no API service at `127.0.0.1:3002`.
- The root orchestration repository's full E2E remains 15/16 due a strict visual mismatch in its legacy UI/snapshot. Do not treat this mismatch as a Site regression or rewrite canonical Site screenshots from it. Site pixel comparison against the locked owner references remains NOT_TESTED and must be carried as a visual acceptance gate.

### Поточний GPS/Site/iOS pin — 2026-10-22

- Site GPS-normalization зміна на `d96ac454ecb733987d00897e564ba90ddbf8d864` локально й у exact-head Site CI повністю перевірена. iOS PR #9 зараз пінить саме цей Site SHA; локальний unsigned simulator build/launch пройшов. Два hosted simulator jobs на iOS SHA `7e64b642319b45a1646a784d994d65d9b526ced6` лишалися `in_progress` на момент збереження цього checkpoint.
- iOS build manifest для локального симулятора має `serverCommit=null` і `databaseMigrationVersion=null`; це підтверджує, що синхронізований WebView ще не є повним узгодженим release artifact.

### Recheck after iOS exact-head CI — 2026-10-22

- iOS PR #9 exact SHA `7e64b642319b45a1646a784d994d65d9b526ced6` now has hosted Simulator CI SUCCESS (runs `39776303109`, `39776311845`) and pins the verified Site SHA `d96ac454ecb733987d00897e564ba90ddbf8d864`. This removes the pending-CI item only; PR remains open and no signed/physical-device acceptance occurred.
- Candidate manifests now record Server `d128e9b2b94cd3bc08bb3d7f5a16e1a3ea73508c`, Site `d96ac454ecb733987d00897e564ba90ddbf8d864`, iOS `7e64b642319b45a1646a784d994d65d9b526ced6`, API `v1`, DB migration `055_provider_commercial_use`. Deployed Site SHA remains null, status `NOT_RELEASED`.
- A one-time public Lviv GTFS-RT probe matched 548/557 fresh vehicle records to an exact static GTFS trip and route, but 0 matched records supplied current-stop/stop-sequence progress. Thus the requested “prioritize vehicles approaching my boarding stop” remains unsupported by evidence from this snapshot; see the sanitized report `docs/audit/61_LVIV_GTFS_RT_LIVE_MATCH_2026-10-22.md`.
- Still externally blocked: verified staging/deploy URL/API origin and credentials/config; owner-configured read-only `MARSHGO_REPOS_READ_TOKEN` for private Admin/Partner checks; actual provider commercial entitlements where needed; physical iPhone access/signing for GPS/background/APNs; explicit production rollout authorization. Independent code gates continue, but release cannot be declared or deployed until these are addressed.

### Server GPS candidate exact-head CI — 2026-10-22

- Server PR #26 SHA `a1961324a2a46bd062231d35720fe349d39d9d76` exact CI runs `39777928826` and `39777958708` both completed successfully, including dependency audit, full unit tests, clean DB migrations and PostGIS/Redis integration. This closes the pending-CI item for that candidate only.
- PR #26 remains OPEN/DRAFT/CLEAN and stacked on open PR #25/#24. The date-less VehiclePosition change is safely gated by exact trip+route, fresh GPS in the selected Journey time window and a fresh dated TripUpdate at the exact boarding stop.
- Staging/deployment credentials and URL remain absent; root #6 still needs read-only `MARSHGO_REPOS_READ_TOKEN`; Lviv dense transfer search, owner visual acceptance, physical iPhone, backup/restore/rollback and production approval remain open. Production stays `NOT_RELEASED`.

## Recheck — 2026-10-22

- **Staging / production deployment remains BLOCKED_EXTERNAL:** no verified staging URL/API origin, deploy target or credentials are available. No deployed SHA, HTTPS smoke, backup/restore or rollback drill exists. Production rollout also needs its explicit separate owner authorization.
- **Root cross-repository browser acceptance is FAIL:** against candidate Server `a1961324a2a46bd062231d35720fe349d39d9d76` + Site `d96ac454ecb733987d00897e564ba90ddbf8d864`, five root assertions target legacy DOM labels/test IDs and one booking flow was interrupted waiting for the old passenger-picker label. This is a test-maintenance blocker; do not weaken the checks. Site-owned `npm run check:production` passes 21/21 fixture-driven browser tests but does not substitute for live Server E2E.
- **Private Admin/Partner exact materialization:** root umbrella CI still requires owner-configured read-only `MARSHGO_REPOS_READ_TOKEN`; no bypass was attempted.
- **Field/provider acceptance:** physical iPhone background GPS/APNs, signed distribution build and commercial provider access/agreements remain NOT_TESTED or BLOCKED_EXTERNAL as applicable.
- **Operational acceptance:** production monitoring, restore rehearsal and tested rollback are not evidenced. Keep manifests at `NOT_RELEASED` until these checks are completed.

## Recheck — 2026-10-22 15:42 UTC

- **No staging/production target or credentials:** still no confirmed canonical staging URL/API origin, deployment account/configuration, deployed SHA or HTTPS smoke URL. This blocks staging and production acceptance; no deployment was attempted. Production rollout still requires its separate owner approval.
- **Umbrella repository access:** MarshGO PR #6 exact head `b2535369f4636f1f2bb63f96525f2a1b4f929f08` has a failed `verify` because the owner-configured read-only `MARSHGO_REPOS_READ_TOKEN` needed to materialize private Admin/Partner is absent. CodeQL and Gitleaks are green. Configure that read-only secret in the repository; do not bypass the gate.
- **Physical iPhone/signing:** GPS in motion/background, APNs, permissions across app lifecycle, signed TestFlight/App Store archive and two-device rendezvous remain NOT_TESTED; simulator compile/launch does not substitute.
- **Provider/commercial rights:** feed URLs/probes do not establish contracts, API entitlements or booking/cancel capability across each city/mode. Exact provider-specific credentials/agreements remain BLOCKED_EXTERNAL where required. Dense Lviv route results still report truncation and cannot be represented as complete.
- **Operations:** production backup/restore and rollback rehearsal, monitoring/alerting, load profile and on-call/runbook are not evidenced. Local PostGIS/Redis test containers are test-only and were not modified.
- **Visual approval:** strict route screenshot mismatch remains unresolved against the owner-approved visual baseline. No golden was rewritten or tolerance relaxed. A non-pixel behavior pass is not visual acceptance.
- All independent local gates remain usable while these external blockers are pending; release stays `NOT_RELEASED`.

## Recheck — 2026-10-22: production deployment gates

- **Staging/production host and origin:** no verified URL, deployed SHA, access credentials, DNS/TLS or hosting ownership identified. Localhost and Simulator build are not deployment evidence. Prepared code and candidate manifest remain `NOT_RELEASED`.
- **Operations:** no current staging backup/restore and rollback rehearsal or production HTTPS smoke. Need the owner-controlled staging origin, deployment access, and a safe isolated database to close these gates.
- **External transport services:** live provider acceptance, commercial terms/API credentials, and physical iPhone GPS/background/push acceptance are not evidenced by local fixtures or CI.
- Candidate tuple now recorded in `RELEASE_MANIFEST.json`: Server `a1961324a2a46bd062231d35720fe349d39d9d76`, Site `1d2aaa012b88519273eae7a2b8d703ec32c212f6`, iOS `976ede9e8c61fcae7653d815a46c22a9a234ba7e`, API v1, migrations 055. Exact-head iOS CI is still pending; no release or deployment claim is made.

### Оновлення — 2026-10-22

- Оновлений iOS/Site кандидат підтверджено hosted Simulator CI; це знімає лише build gate, не фізичний iPhone чи live API gate.
- Для browser visual acceptance потрібне затвердження еталонного вигляду саме списку результатів: поточний golden показує стару структуру. До підтвердження baseline не замінювався.
- Production/staging origin, контрольовані deployment credentials, backup/restore та rollback evidence, фізичний iPhone й live external provider acceptance все ще відсутні.

- 2026-10-22 recheck: GitHub Deployments API показав 0 deployment records у шести репозиторіях. Якщо production/staging розміщений поза GitHub, потрібні його URL/origin та власник/процедура доступу для перевірки SHA і HTTPS smoke.

### Локальний E2E інфраструктурний блокер — 2026-10-22

- Повторний root E2E для точних Server #27 / Site #15 SHAs зірвався, коли Docker VM зупинилася після `no space left on device`; Docker IPC далі не відповідає. Тестові PostGIS/Redis порти 5544/6381 недоступні.
- Read-only inventory: Data volume має 2.3 GiB вільно; Docker VM займає близько 29 GiB, Docker log directory близько 33 MiB. Локальний Postgres на 5432 не має PostGIS. Жодних файлів, образів, volumes чи даних не очищали.
- Для відновлення потрібне контрольоване звільнення місця або збільшення доступного сховища, потім запуск Docker Desktop і перевірка loopback PostGIS/Redis. Жоден cleanup не був виконаний; очистка видаляє локальні дані/кеші й потребує явного схвалення власника.
- Цей локальний блокер не замінює окремі зовнішні релізні блокери: staging/production origin та доступи, HTTPS smoke, backup/restore/rollback acceptance, live providers і фізичний iPhone.
- Штатний `docker desktop restart` також не відновив Engine: CLI бачить активні завислі backend/build процеси, а status не повертає стан. Не застосовували force-kill і не чистили дані. У повторному вимірі лишалося 1.1 GiB вільного місця.

### Свіжа перевірка runtime і deployment-конфігурації — 2026-10-22

- Local-only тестові контейнери PostGIS і Redis працюють, обидва з restart policy `no`; API і сайт на loopback не відповідають. Це не production.
- Production Compose не може бути валідований без власника домену, SMS-провайдера/ключів, Redis password, session secret і версійованих HTTPS map manifests. Staging env не має staging origin чи deploy access. Потрібно надати власник-контрольоване staging середовище і конфігурацію; до цього deploy/HTTPS acceptance неможливі.
- Не читав і не копіював значення локальних секретів; жодного контейнера, мережі або тому не змінював.

### Актуалізація після CI та перезапуску ноутбука — 2026-10-22

- iOS exact-head CI для кандидата вказаного в маніфесті вже PASS (`39813329879`, `39813552470`, `39813560229`); попередня примітка про pending застаріла. Це не закриває фізичний пристрій, підписаний реліз або production.
- Server PR #27 exact-head CI PASS (`39817276374`, `39817284271`), але зміна відкрита й не змерджена; актуальний release tuple не перенесений на цей SHA.
- Docker daemon зараз доступний. Два запущені локальні тестові контейнери: PostGIS/PostgreSQL `marshgo-cache-e2e-postgres` (`127.0.0.1:5544`, restart `no`) і Redis `marshgo-server-cache-redis-cache-1` (`127.0.0.1:6381`, healthy, restart `no`). Вони не є staging/production.
- Staging/deployment target, зовнішній host/origin і deploy credentials усе ще відсутні. Жодного контейнера чи тому не змінено; секретні значення не читались.
- Оновлений release review tuple: Server PR #27 `30fa1cfa52621e7ed4ca47ad61794711ac484e62`, Site PR #15 `1d2aaa012b88519273eae7a2b8d703ec32c212f6`, iOS PR #11 `ec586d63e1c07a4807c8991b20c35d1193e0f73d`; iOS hosted manifest/Simulator checks PASS. Усі PR відкриті, не злиті, production status `NOT_RELEASED`.

### Перевірка deployment access і кандидатних доказів — 2026-10-22 19:37 UTC

- GitHub Deployments API повторно перевірено для MarshGO, Server, Site, iOS, Admin і Partner: **0 deployment records у кожному**. GitHub Environments API для цих репозиторіїв повернув порожні списки; GitHub Actions secret inventory не показав налаштованих repository secrets. Значення секретів не читалися.
- Це не виключає зовнішній хостинг поза GitHub. Потрібні фактичний staging/production URL, власник середовища та виданий ним шлях до deployment/HTTPS smoke. До цього не можна довести, де розгорнутий продукт і який SHA він виконує.
- Оновлений локальний інтеграційний кандидат: Server PR #28 `d83fa585e866265e83ccc3e5e0ba5d2a8c59ecfe` + Site PR #15 `1d2aaa012b88519273eae7a2b8d703ec32c212f6`, повний fixture-backed E2E **16/16 PASS**; iOS PR #11 workflow-pin SHA `1d1e9763ec99d7e77b22998c4212ce71a7fa924a`, hosted Simulator CI run `39839632165` SUCCESS. Доказ E2E: `docs/audit/68_EXACT_PR28_SITE15_FULL_E2E_2026-10-22.md`.
- PR-и лишаються відкритими/незлитими. Львівський timetable search усе ще позначає результат обрізаним. Немає live-provider/комерційної acceptance, physical iPhone/APNs/background GPS, staging migration, backup/restore/rollback, HTTPS smoke чи deployed SHA. Release candidate — `NOT_RELEASED`.
- Наступна потрібна зовнішня дія після підготовки staging-кандидата: надати staging origin/deploy access і конфігурацію та потрібний read-only `MARSHGO_REPOS_READ_TOKEN` для повного umbrella PR #6 матеріалізування приватних Admin/Partner репозиторіїв. Цей документ не авторизує production rollout.

### Перевірка після Server PR #29 sampling update — 2026-10-22

- Server candidate SHA `e21536d5f97e7876aae0a360ed3ff4126ba5c78c` пройшов локальні typecheck, lint, 296 unit tests (3 opt-in skipped) та 30 PostGIS/Redis/API integration tests. PR #29 hosted exact-head CI ще `IN_PROGRESS` під час останньої перевірки; злиття не виконано.
- Жоден зовнішній production blocker не знятий новим серверним комітом: немає підтвердженого staging URL/deploy access, HTTPS smoke, deployed SHA, backup/restore/rollback rehearsal, live commercial-provider credentials/agreements чи фізичного iPhone/APNs/background GPS acceptance. Production лишається `NOT_RELEASED`.
- Dense Lviv GTFS graph/search truncation залишається кодовою прогалиною, не зовнішнім blocker-ом. Її треба закрити/обмежити чесним partial coverage перед production заявами.

### Оновлення після browser acceptance — 2026-10-23

- Release materializer помилково відхиляв власний generated `.dockerignore` і знімав leading space у porcelain status. Root fix локально проходить materializer unit 5/5, lint та typecheck; він ще незакомічений.
- Browser compatibility після локального fix: 6/6 PASS у Chromium/Firefox/WebKit на Site #15 + Server #28 manifest tuple. Запуск ішов на Node 26.7.0, тоді як Server вимагає 24.21.0; engine parity не доведена. Server #29 exact CI/local tests зелені, але browser suite на його SHA ще не запускали.
- Зовнішні gate-и не знято: staging origin і deployment access, HTTPS smoke, backup/restore/rollback drill, live provider commercial acceptance та фізичний iPhone/APNs/background GPS. Production лишається `NOT_RELEASED`.

## Перевірено повторно 2026-10-23

- **Root umbrella CI:** GitHub Actions PR #5 run `39854554389` не має `MARSHGO_REPOS_READ_TOKEN`, необхідного для read-only checkout приватних MarshGO-Admin і MarshGO-Partner. Job зупиняється до решти umbrella-перевірок; CodeQL та Gitleaks на тому ж кандидатові пройшли. Потрібна конфігурація Actions secret із мінімальним read-only Contents доступом власником репозиторіїв. Token не збирати в логах/репозиторії/чаті.
- **Staging/production:** досі не підтверджені HTTPS host/API origin, deploy credential, environment secrets, deployed SHA та механізм rollback. Потрібні owner-controlled staging access/config і потім перевірений deploy/rollback rehearsal. Production rollout усе ще потребує окремого підтвердження.
- **GTFS completeness / live data:** Lviv static/RT feed дає корисні результати, але планувальник ще повертає `searchTruncated=true`; для live providers окремо потрібні актуальні договори/ключі й приймання.
- Деталі приймання та точні SHA — в [`docs/audit/78_CURRENT_RELEASE_ACCEPTANCE_2026-10-23.md`](audit/78_CURRENT_RELEASE_ACCEPTANCE_2026-10-23.md).

### UI acceptance blockers added 2026-10-23

- **Admin/Partner authenticated journeys:** локальні RC21 web surfaces only confirmed the login screens. No authorized test tenant/credentials for privileged internal pages were present in this run; do not invent or self-grant access. Prepare role-isolated test accounts through the normal owner-controlled test setup, then verify onboarding, tenant isolation, moderation, provider operations, and audit flows.
- **Candidate identity:** local RC21 web/admin/partner image labels point to revision `d5fb0119cf5c6a94cba03474ccc841bbe037fa87`, while the current release manifest pins different Server/Site/iOS SHAs. Rebuild or obtain the exact mutually pinned candidate before treating its smoke checks as release evidence.
- **Reference visual acceptance:** ten user-provided screenshots have not been compared image-by-image against captures from the exact candidate. Current E2E map tiles are fixtures, not licensed production map assets; exact map visual acceptance remains blocked until candidate and map manifest are aligned.

### CI update 2026-10-23

Root PR #5 hosted run `39855221314` passed frozen dependency install/audit, lint, typecheck, unit tests, DB migrations/integration, production build and bundle gate. The only failure is the private Admin/Partner read-only checkout due to missing `MARSHGO_REPOS_READ_TOKEN`; later image and browser gates were not run in hosted CI. Fresh GitHub Deployments API returned zero records for all six product repositories. Local production Compose remains unconfigurable without owner-managed domain, HTTPS manifests, session/Redis and SMS values.

### Повторна browser acceptance та перевірка старих тунелів — 2026-10-23

- Exact Server `e21536d5f97e7876aae0a360ed3ff4126ba5c78c` + Site `1d2aaa012b88519273eae7a2b8d703ec32c212f6`: повний fixture-backed Playwright E2E **16/16 PASS за 8,5 хв** на окремій loopback DB `marshgo_e2e_rc23_20261023`, clean migrations до 055. Успішні login для тестових акаунтів, passenger/driver booking, negotiation/chat, route search/map/segment focus, 12 категорій, GPS rerouting, geolocation denial, URL restore, partial-search warning, rendezvous consent/revoke. Не production data/provider evidence.
- Button heuristic: 152 controls натиснуто, жодної зафіксованої JS/HTTP runtime error; 14 “no visible effect” евристик лишаються не підтвердженими дефектами.
- Перший прогін помилково відправляв OTP у відкритий preview через зайнятий порт 3302; тестовий proxy було перенесено на loopback 3309. Після виправлення suite пройшов повністю. `playwright.config.ts` тепер конфігурує E2E API port через `E2E_API_PORT` для API і web proxy.
- Повторний production Compose config-validation знову fail-closed: немає `APP_DOMAIN`, двох immutable HTTPS map manifests, `REDIS_PASSWORD`, `SESSION_SECRET`, Twilio credentials та browser map manifest. Секретні значення не читались і не логувались.
- Із усіх згаданих у старих документах тимчасових тунелів 7 `lhr.life` origin-ів не дали валідної відповіді `/readyz` (curl HTTP 000); попередній ngrok origin повернув 404. Жоден із них не є зараз перевіреним staging. Жодної спроби входу, зміни даних чи deployment не було.
- Повторний local `npm run check:production` на root dirty checkout / Node 25.4.0: typecheck, lint, 256 unit tests, production build і bundle budget PASS; 1 opt-in DB integration test SKIP. Це не замінює Node 24 clean-tree CI, staging, live providers, фізичний iPhone, backup/restore/rollback чи HTTPS production smoke.
- Release залишається `NOT_RELEASED`. Потрібні власник-контрольований staging/deploy origin і конфігурація, private repo read-only CI token для Admin/Partner, підтверджені права/ключі провайдерів, фізичний iPhone, операційне відновлення та окремий rollout approval.

### Історичний checkpoint RC.24 — 2026-10-23

- Server PR #31 (`b65882584a3ad1e8dd7512d13176f52299cded51`) і iOS PR #12 (`dec6a1cb5857603167853976e74972831a668917`) мають успішний exact-head hosted CI; iOS pin-ить перевірений Site `1d2aaa012b88519273eae7a2b8d703ec32c212f6`. Це лишаються відкриті stacked PR-и, не merge/deployment.
- У новому read-only RT snapshot (`2026-10-23T00:54:47Z` UTC): Львів 0 position entities, Рівне 0, Івано-Франківськ 4/8 fresh, Ужгород 2/4 fresh; усі feed checks повернули `degraded`. Це мінливий snapshot і не доводить маршрутний crosswalk чи map consumption.
- Незмінені зовнішні blockers: `MARSHGO_REPOS_READ_TOKEN` з мінімальним read-only доступом до приватних Admin/Partner; власний HTTPS staging host/API origin і deploy credentials/config; ліцензований immutable map style/data manifest; реальні OTP/SMS та provider entitlements, якщо відповідні функції мають бути увімкнені; фізичний iPhone для GPS/background/APNs; власницькі backup/restore/rollback перевірки та окремий дозвіл production rollout.
- Кодова прогалина, не зовнішній blocker: frozen dense-Lviv route search залишається truncated. Перевірені нові graph/lazy-selection експерименти відхилені; не знімати partial-search disclosure і не збільшувати ліміти без exhaustive-oracle та frozen multi-OD доказів.
- Стан та acceptance: [`PRODUCTION_EXECUTION_STATE.md`](PRODUCTION_EXECUTION_STATE.md), [`PRODUCTION_ACCEPTANCE_MATRIX.md`](PRODUCTION_ACCEPTANCE_MATRIX.md), RC.24 exact candidate в [`RELEASE_MANIFEST.json`](RELEASE_MANIFEST.json) лишається `NOT_RELEASED`.
### Site dual-rendezvous route map — 2026-10-23

- Кодова зміна доступна в Site PR #15, commit `1d0f1fe`; локальний unit/build/browser і hosted exact-head CI PASS. Hosted run 39881586340: 21/21 browser E2E, artifact `12471766907`; fixture не замінює реальний staging.
- Перша Site run 39881586340 була скасована після 20-хвилинного install timeout, але точний rerun завершився успішно; цей інфраструктурний timeout не потребує кодувального bypass.
- iOS PR #12 оновлено до exact Site SHA `1d0f1febfd757dfcbaa3d9fbb06fef756d0c9fae` (iOS commit `8904466a1fc9525733281f64f673b5a63d6f5a0d`); exact Simulator CI run `39881781598` ще pending.
- Для production лишаються зовнішні вимоги: власницький HTTPS staging/deploy origin і секрети, ліцензовані immutable map assets, live SMS/provider доступи за заявленими сценаріями, фізичний iPhone для GPS/background/APNs, operational backup/restore/rollback та окремий дозвіл production rollout. Жоден блокер не є приводом відображати вигадані реальні дані.

### Актуальні блокери RC.25 — 2026-10-23

- Поточна source tuple: Server PR #31 `b65882584a3ad1e8dd7512d13176f52299cded51`, Site PR #15 `1d0f1febfd757dfcbaa3d9fbb06fef756d0c9fae`, iOS PR #12 `ba2f08d47cf290d44053ec0dbbb120aac87915d2`. Server/Site exact-head CI пройшли; Site має immutable hosted artifact та 21/21 browser checks; iOS exact-head Simulator runs `39884276804` і `39884281286` SUCCESS. PR-и відкриті й не злиті.
- Кодовий блокер: повнота щільного GTFS пошуку Львова не доведена; `searchTruncated=true`. Відхилені spatial-retention і lazy-expansion прототипи не потрапили в кандидат.
- Runtime блокери: staging/deployment origin і власницький доступ відсутні; не проведені HTTPS smoke, live provider/SMS, deployed-SHA verification, production backup/restore/rollback drill, physical iPhone GPS/background/APNs. Ліцензований immutable map style/data manifest теж не налаштований, тож production-візуальна acceptance карти не пройдена.
- CI матеріалізація root PR #5 лишається заблокованою без read-only `MARSHGO_REPOS_READ_TOKEN` до приватних Admin/Partner репозиторіїв. Потрібно надати цей repository secret з мінімальним Contents-read правом або дозволений інший workflow, який не обходить приватнісні обмеження.
- Не виконувались видалення, масова чистка, merge, production deployment чи зміна трафіку. Поточний статус релізу — `NOT_RELEASED`.

### Rechecked 2026-10-23 after full local E2E

- No new human action is needed for the 17 local browser tests; they passed on pinned RC Server/Site sources with isolated fixture services.
- Still externally blocked from verified deployment: there is no confirmed staging origin/deploy identity and deployed SHA/HTTPS smoke in this checkpoint, and no rollback drill evidence. Do not promote the RC manifest to RELEASED.
- Provider-dependent claims still need actual provider credentials/agreements, non-fixture live probe results, and freshness/capability evidence for each operator. The E2E route/map and rendezvous data were fixtures.
- Device acceptance still needs physical iPhone/Safari (including background/resume, permissions, SW update) and a final iOS build tied to exact Site/API pins. No device access is evidenced here.
- Complete screenshot comparison still needs all ten supplied mock states captured from one immutable candidate at matching viewport/sheet/map states. Current inspected screenshots are a sample and use test tiles.
- Local environment note: root E2E install/build warned that host Node was v26.7.0 while manifests require v24.21.0. Re-run release checks under Node 24.21.0 before treating them as release gates.
# 2026-10-23 checkpoint update

- Local production-browser and Server integration coverage is now green on isolated follow-up commits; these results do not close any external release blocker.
- Still required: owner-managed read-only GitHub Actions token for private Admin/Partner materialization; staging host/domain, HTTPS/API origin and deploy identity/secrets; commercial/provider credentials and rights for the requested live capabilities; licensed immutable map style/data source; physical iPhone plus APNs/signing for device acceptance; owner-controlled backup/restore and rollback evidence; separate approval before production traffic changes.
- The ten reference images have not all passed pixel/visual acceptance, and live provider availability/freshness was not established by this local fixture run.
- Dense Lviv GTFS search is a code limitation (`searchTruncated`): not an external blocker and not resolved in this checkpoint.
# Additional status 2026-10-23

- Site PR #20 head advanced to `d761d4b6d8d909caa22e7c72713f0ea3badede41`; exact hosted run `39993143251` was pending at checkpoint time. It is not an external blocker unless the CI service reports a permission or infrastructure failure.
- No new external blocker cleared. A legacy root visual baseline differs from the current PR #19 transport-map layers design; this is a design/test reconciliation task, not a missing credential. Do not refresh the old snapshot without comparing it to the owner-approved screenshots.
- Staging origin, deploy credentials, provider contracts/keys, licensed map-style/tiles, physical iPhone/APNs/signing, and production backup/restore/rollback/owner approval remain open. Release remains `NOT_RELEASED`.

### Latest umbrella release CI blocker — 2026-10-24

- Root PR #5 exact current head `566a17e5c584efd4d68a97b381aabc068c87cf5c`: Security run `40045390353` PASS; hosted CI run `40045390360` failed closed at private Admin/Partner checkout because GitHub Actions secret `MARSHGO_REPOS_READ_TOKEN` is unset. Remaining hosted materialization/E2E steps were skipped.
- Required external action: configure a least-privilege read-only Contents token for `dima1203oleg/MarshGO-Admin` and `dima1203oleg/MarshGO-Partner` as that Actions secret, then rerun exact-head CI. No gate bypass attempted.
- Independent production blockers remain: no verified staging/production origin and deployment identity, provider contracts/keys for commercial functions, licensed production map assets, physical iPhone/APNs/background GPS acceptance, and verified backup/restore/rollback. Dense Lviv routing truncation is a code gap, not an external blocker.

### Exact current umbrella integration gate — 2026-10-24

- Rechecked canonical repositories' open PRs. Component candidate checks are green: Server #35/#36/#38, Site #21/#23, iOS #14, Admin #1 and Partner #1; they are still open, with parent/dependency chains and no integrated deployment SHA tuple.
- MarshGO #5 hosted verification again shows the specific missing secret gate: `MARSHGO_REPOS_READ_TOKEN` is unset, so private Admin/Partner checkout is intentionally blocked. Required external action is a least-privilege read-only Contents token configured as that Actions secret, then an exact-head rerun.
- MarshGO #6 is `CONFLICTING` and needs normal conflict resolution. No force push or protection bypass.

### Follow-up after Site stack merge — 2026-10-24

- Site PR #23 conflict with current #22 base was resolved through an ordinary merge and pushed as Site SHA `10454f37b59a848e4a5b381689dfe7f701fe2b81`. This was a code conflict, now cleared; no external action is needed for it.
- Exact Site CI run `40124900205` was pending at this checkpoint. Local full candidate E2E and Site production checks pass.
- Remaining true external blockers are unchanged: root umbrella CI needs a least-privilege `MARSHGO_REPOS_READ_TOKEN` for private Admin/Partner checkout; no staging/deployment target and credentials have been verified; some commercial providers require partner contracts/keys; production map license/credentials, signing/APNs and physical iPhone, and owner-approved deployment/rollback gates remain unverified.
- Dense Lviv GTFS search truncation and root MarshGO PR #6 merge conflict are engineering blockers, not external blockers.

### Candidate status update — 2026-10-24

- Site PR #23 conflict is resolved; exact merged head `10454f37b59a848e4a5b381689dfe7f701fe2b81` passes hosted CI `40124900205` and is mergeable. Remaining mock-visual/device/staging items are acceptance/environment gaps, not code conflicts.
- Root PR #6 base conflict is resolved. Its obsolete dependency downgrades were dropped; exact materialized-release guard remains, with hosted CI `40125100349` and Security `40125098012` pending at checkpoint.
- Root PR #5 still requires the externally configured least-privilege `MARSHGO_REPOS_READ_TOKEN` for private Admin/Partner materialization. Staging deployment identity/domain, provider contracts/keys, licensed map style, physical iPhone/APNs signing and owner-approved rollback/deployment evidence also remain unavailable.

### Updated 2026-10-24 — iOS CI complete; remaining external gates

- **iOS CI no longer blocks the current Site pin:** iOS PR #14 SHA `53b28ec86ee806e95284eee8ab6c8a12739f6df4` compiles against Site `10454f37b59a848e4a5b381689dfe7f701fe2b81` and Server `134ed017828a020e1d5f696b3cb9ea95527bb093`; hosted runs `40125380685` and `40125383444` pass. Physical iPhone, Apple signing/APNs and TestFlight still require device/account access.
- **Private source materialization:** configure `MARSHGO_REPOS_READ_TOKEN` as a repository Actions secret with read-only Contents access to private Admin and Partner, then rerun root PR #5/#6 exact-head CI. Image/browser gates are currently skipped because the verifier correctly fails closed.
- **Staging and hosting:** establish an authorized staging identity, domain/API origin, DNS/TLS and secrets. No verified current staging URL or deployed SHA exists. Production deployment remains separately approval-gated.
- **Commercial transport coverage:** partner credentials/contracts/licenses are needed where public feeds do not provide commercial booking, fares or availability. An adapter or fixture does not establish commercial entitlement.
- **Map assets:** configure an approved licensed style/tile source and attribution to replace fixture-only synthetic tiles and complete map/visual acceptance.
- **Release assurance:** backup/restore, rollback rehearsal, monitoring/alert targets and owner approval remain unverified.
- **Compose runtime configuration:** `docker compose -f .release/compose.production.yml config --quiet` cannot interpolate without real `APP_DOMAIN`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, approved `GEOCODING_ENGINE_URL`/reverse URL, `MAP_DATA_MANIFEST_URL`, licensed `MAP_STYLE_MANIFEST_URL` and `VITE_MAP_STYLE_MANIFEST_URL`, `OSRM_URL`, `SESSION_SECRET`, `TRUST_PROXY_HOPS`, Twilio credentials and private S3 bucket/region. No placeholder build or Compose startup was attempted.

### Root PR #6 exact-head hosted CI — 2026-10-24

- Site PR #23 hosted CI is clear (run `40124900205` SUCCESS). Root PR #6 is mergeable and its hosted Security scan is clean: `40125098012` PASS (Gitleaks + CodeQL).
- Root PR #6 CI `40125100349` passed dependency audit, lint, typecheck, unit, migration, integration, build and bundle gates, then intentionally failed closed when `MARSHGO_REPOS_READ_TOKEN` was unavailable. Private repo materialization, image build and browser E2E were skipped.
- Owner action remains: configure a short-scope least-privilege token with read-only Contents permission to `MarshGO-Admin` and `MarshGO-Partner` in the repository Actions secret. Then rerun CI for exact head `2b87b8b016ce8b4c309adc4399ad31b81781cd09`. No alternate credentials or gate bypass were used.
# External blockers rechecked — 2026-10-24

- Partner API/UI acceptance is no longer blocked locally: exact Server/Partner candidate tests passed in an isolated dev-mode environment. Production SMS/OTP delivery is still unverified because production credentials and deployment environment are absent.
- A verified staging origin, API origin, deployment credentials and real server-side configuration are still required for staging E2E and deployed-SHA checks.
- Provider contract/API credentials and approved production map/routing/geocoding assets are still required before those capabilities can be advertised as live.
- Root orchestration hosted CI still needs a least-privilege `MARSHGO_REPOS_READ_TOKEN` to clone private Admin and Partner source. Local materialization succeeded; the hosted secret was not accessed or changed.
- Physical iPhone, signing/TestFlight/APNs access is still required for device acceptance.
- Production approval remains a final owner gate after candidate, staging, backup/restore and rollback evidence exist. No production deployment was performed.
- Authenticated Admin UI acceptance needs a secure test OTP/admin identity or authorized staging account. The server correctly withholds admin role in visible development-OTP mode; do not disable this protection to manufacture a passing browser run.
### iOS end-to-end release acceptance — 2026-10-24

- Current exact-candidate simulator check is limited to bundle, native packaging and first-screen rendering. API `http://localhost:3002` was not running, so authenticated native scenarios were not attempted.
- To close the remaining gates: run an isolated reachable staging/test API with safe test OTP and contracted map/routing endpoints; perform interactive sign-in, booking, map/GPS, resume/reconnect checks; verify on a physical iPhone; configure signing/APNs only for the release candidate. No credentials or external service access were inferred.
- Prepared: exact Site SHA `10454f37b59a848e4a5b381689dfe7f701fe2b81` and Server SHA `134ed017828a020e1d5f696b3cb9ea95527bb093` embedded with iOS `53b28ec86ee806e95284eee8ab6c8a12739f6df4`; simulator screenshots for iPhone 15 and 16 Pro Max. Full evidence: `docs/audit/119_IOS_EXACT_RC_SIMULATOR_2026-10-24.md`.
- Status: `BLOCKED_EXTERNAL` for physical-device/signing/provider acceptance; `NOT_TESTED` for reachable staging and authenticated native E2E. Production remains `NOT_RELEASED`.

### 2026-10-25 after full UI/cross-repo test checkpoint

- Site PR #24 exact candidate and local fixture checks are now green, but deployment remains blocked on a verified staging/API origin, credentials and real server configuration; no deployed SHA was found or promoted.
- Production-quality live map styles/tiles and any provider requiring commercial access remain blocked on approved licenses/contracts/keys. The synthetic map fixture does not clear these blockers.
- Physical iPhone acceptance and Apple signing/APNs/TestFlight require device/account access. The current Xcode result is an unsigned compile only.
- Authenticated Admin acceptance still requires a secure authorized admin test identity; frontend unit/build checks are not an authorization test.
- Security/load/recovery, backup/restore, rollback rehearsal and owner-approved rollout evidence remain release gates. No production deployment was performed.

## Exact RC check — 2026-10-25

- `docker compose -f .release/compose.production.yml config --quiet` is BLOCKED before deployment. Compose reports missing required values for `APP_DOMAIN`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, approved HTTPS `GEOCODING_ENGINE_URL`/`GEOCODING_REVERSE_URL`/`MAP_DATA_MANIFEST_URL`/`MAP_STYLE_MANIFEST_URL`/`OSRM_URL`, `S3_BUCKET`/`S3_REGION`, `SESSION_SECRET`, `TRUST_PROXY_HOPS`, and Twilio credentials/from-number. No secret values were read into the report or filled with placeholders.
- Current exact RC is not deployed. The historical temporary tunnel mentioned in older staging notes belongs to a different Site/Server SHA and is not accepted as staging for the current candidate.
- Current local browser/API ports checked at `3000`, `3002`, `3300`, `3302`, `3312`, `4301`, `4302`, `4176`, and `4177` have no listener. The simulator smoke used a local test API origin and does not establish a remote staging service.
- Required owner-controlled actions: supply/authorize the staging hostname and ingress; populate the secret store with valid staging credentials and approved map/geocoding/routing endpoints; provide the required provider entitlements; and configure the iOS release variables with the final exact SHA tuple and HTTPS API origin. Production rollout remains separately gated by owner approval.

## 2026-10-25 current acceptance blockers

- Production map style/tile manifest and approved satellite imagery/license are not configured in the Site candidate. A local map layer fix is verified, but it does not make the supplied map mockups visually acceptable. Needed: owner-authorized asset provider, immutable style/data URLs, attribution and production configuration; then run screenshot and performance acceptance.
- No current staging origin/deployment credentials are configured; production Compose still lacks required domain, secret-store values, map/geocoding/routing origins, object-storage and SMS settings (see exact config validation recorded in this file's earlier checkpoint). No deployment was attempted.
- Live provider coverage/booking rights, physical iPhone background GPS/APNs/signing, load/recovery, backup/restore/rollback rehearsal, and owner release approval remain external gates.
- Completed preparation: city-scoped map-layer implementation and local passenger acceptance recorded in audit 159; no external credentials were inferred or used.

## GitHub Actions private repository access — 2026-10-25

- Exact PR #5 verify run 40164409617 cannot materialize private MarshGO-Admin and MarshGO-Partner trees because the repository secret `MARSHGO_REPOS_READ_TOKEN` is unset. All checks before that step passed; hosted Docker/E2E were skipped.
- Required external action: configure a least-privilege token with read-only Contents access to those two repositories in the central repository's Actions secrets, then rerun the workflow. Do not reuse a broad personal token in workflow configuration.
- Prepared locally: exact pinned private SHAs were materialized through existing local Git credentials; four images built and Web/Admin/Partner static container smoke passed. This does not replace hosted CI evidence or make the candidate deployable.

### Latest root CI recheck — 2026-10-25

- Root PR #5 commit `3068d4d8190534fcab731618368ed6f44fc3949a`, workflow run `40190716714`: dependency audit, lint, typecheck, unit, migrations, opt-in API integration, build, and bundle steps passed; the job then failed at “Configure read-only access to private Admin and Partner repositories”. Hosted materialization, production image build, Playwright, and cross-browser stages were skipped as a consequence.
- The blocker is still the unset `MARSHGO_REPOS_READ_TOKEN` repository Actions secret. No token value was inspected or written. Required action: configure a least-privilege read-only Contents token for Admin/Partner in GitHub Actions; rerun the workflow after that external change.
- Security workflow run `40190716717` passed. Root production status remains `NOT_RELEASED`.


## 2026-10-25 — exact candidate API production configuration

- Production-mode API container validation refuses startup without configured Twilio (`SMS_PROVIDER=twilio`, account SID, auth token, sender number) and requires approved public HTTPS routing, geocoding/reverse-geocoding, and map style/data manifests. The local image was separately smoke-tested only in development mode against loopback Postgres/Redis. No fake credentials were supplied and no external provider was called.
- Evidence: [audit 162](audit/162_RC10_API_IMAGE_RUNTIME_AND_PROD_CONFIG_GATE_2026-10-25.md).

## 2026-10-25 — current release tuple and staging availability

- GitHub component checks pass on Server PR #40, Site #25, iOS #14, Admin #1 and Partner #1 exact SHAs. Central MarshGO PR #5 is blocked at private-source materialization because read-only Actions secret `MARSHGO_REPOS_READ_TOKEN` is not configured. Hosted Docker/E2E steps were skipped; no bypass was attempted.
- No web/API process currently listens on local ports 3000/4301/3002; the saved tunnel URL returns Bad Gateway. `.env.staging.local` contains no staging configuration. A verified staging host/API origin, DNS/TLS and real runtime secrets are still required.
- Production Compose needs approved HTTPS map/geocoding/routing sources, SMS credentials, object storage settings, and session/database/cache secrets. The existing healthy local DB/cache are development services, not staging.
- Exact source links were refreshed in root `RELEASE_MANIFEST.json`; `docs/RELEASE_MANIFEST.json` remains a historical RC.9 snapshot. Image artifacts remain local and unpublished. Production deployment remains blocked by staging, provider/asset entitlement, device, security/performance/recovery, backup/restore, rollback and final owner gates.

## 2026-10-26 — exact iOS source and release-environment blockers

- **iOS Site source alignment:** simulator build currently embeds pre-existing dirty Site checkout `02e97d63c050ae87b0d9fa6c698c97a0b5fdfb5f`, not the release-manifest Site SHA `6961afcf008e2c845c0fde68c687ce61fe744f2f`. Two modified files must be reconciled by review before creating an immutable iOS candidate. Prepared: simulator build/launch evidence on iPhone 15/16 Pro Max, local API was isolated and stopped after use.
- **Embedded Site dependency findings:** npm audit reports 5 high production findings in the old embedded Site dependency tree. Prepared: canonical dirty Site lock-only update shows 0 findings and full local Site checks pass; this does not remediate the distinct embedded checkout. Need exact source reconciliation and re-audit.
- **Staging and production evidence:** no verified staging origin/deployed SHA, production secrets/rollout, production smoke, backup/restore or rollback evidence is available in this local run. Prepared: loopback fixture and integration evidence only. Required next: authorized staging environment/credentials and owner approval for any production rollout.

## 2026-10-26 release follow-up

- **iOS artifact tuple/security:** manifest iOS SHA `be5478bed577b91a89035fe6785ab938f0335799` differs from local checkout `4353cec3cacbaf662ceea047402f361024292b22`; locally tested embedded Site `02e97d63c050ae87b0d9fa6c698c97a0b5fdfb5f` is dirty and reports 5 high production dependency findings. Prepared: exact manifest SHA is present in the object database and historical exact-SHA CI passed. Required: materialize/build the exact release tuple with reviewed canonical Site and zero unresolved production dependency findings. Status: BLOCKED (candidate reconciliation/engineering).
- **Admin/Partner acceptance:** candidate snapshots build and their unit tests pass, but no authenticated tenant-isolation browser acceptance was executed. Required: isolated authorized identities/session and acceptance run. Status: BLOCKED (test credentials/acceptance setup), while independent local build/unit checks are complete.
- **Visual reference acceptance:** supplied UI mockups have not been compared against actual production map assets/screens across all states and themes. Required: approved map style/tiles and reference-by-reference visual review. Status: BLOCKED (provider/configuration and visual acceptance).

## GTFS dense-search implementation gate — 2026-10-26

- No external credential is required for the current algorithm blocker. A bounded local diversity improvement retained three baseline strategy winners but increased per-query latency 19–36% and all three frozen-feed queries remain `searchTruncated=true`. Status: OPEN (engineering, not external). Next: query-directed search design, exact small-feed oracle, frozen-feed winner/recall/resource acceptance; do not ship as complete.

## GitHub cross-repository release verification — 2026-10-26

- Status: BLOCKED_EXTERNAL.
- Root orchestrator PR #5 at `7db4e3ece9cd6bff7d5b0fca437663e3e286d4ef` fails at `Configure read-only access to private Admin and Partner repositories`: the GitHub Actions secret `MARSHGO_REPOS_READ_TOKEN` is absent. PR #6 has the same failure.
- Required capability: owner-managed least-privilege read-only Contents access for `dima1203oleg/MarshGO-Admin` and `dima1203oleg/MarshGO-Partner` (or an approved GitHub App installation credential). No code-side workaround should skip the cross-repository checks.
- Prepared: current candidate PR heads and dependency DAG inspected; per-repository CI checked; local Admin fast-forwarded to exact PR #1 head and validated; Partner exact PR #1 head validated.
- Next: configure the Actions credential and rerun the orchestrator before resolving manifest pins or claiming an integrated release candidate. Evidence: `docs/audit/247_CANONICAL_PR_STACK_AND_RELEASE_GATE_2026-10-26.md`.

## Final release-run evidence — 2026-10-26

- Current orchestrator PR #5 head `7ab9685909849e75f8797907c97109b331d1391e`, run `40299717731`: dependency audit, lint, typecheck, unit suite, isolated PostGIS migrations/integration, build, and bundle passed; the workflow failed at the required private Admin/Partner read credential gate before materialization and E2E.
- Physical owner iPhone 15 Pro Max reports `unavailable`; only simulated phones are connected. Physical device acceptance remains NOT_TESTED.
- No GitHub deployment records across six repos; no staging/production URL, physical device or backup/restore proof.

## Search and geolocation runtime — 2026-10-26 (audit 275)

- Current local browser has no valid MARSHGO API session; `/places/suggest` is intentionally auth-protected. Prepared and tested authenticated fixture flow, but the visible browser needs the user to sign in. Do not bypass API auth to make autocomplete appear.
- Host browser geolocation timed out despite the coarse/cache retry. Prepared and tested synthetic GPS fallback and map-point selection. Physical device/OS location-service acceptance remains NOT_TESTED.
- UZ schedule provider failed during the live Lviv search although its earlier catalog probe passed. Search correctly returned partial results; re-probe provider health/freshness before claiming railway routing.

## Revalidated root read-only checkout blocker — 2026-10-26

- Latest root PR #5 head `688b58ca6eeae0175ee34cf1c423a3e35c9f765d`, Verify run `40301391620`: source/unit, isolated migration and backend integration, build and bundle pass; step 15 fails because `MARSHGO_REPOS_READ_TOKEN` is not configured. Cross-repo materialization, image build and browser suites are skipped. CodeQL and Gitleaks pass.
- Required change is still an owner-managed least-privilege read-only credential for private `MarshGO-Admin` and `MarshGO-Partner` or approved GitHub App credential. This code-only session cannot safely create/provision that secret; no bypass attempted.
- Exact evidence: `docs/audit/249_RELEASE_VERIFY_FINAL_BLOCKER_2026-10-26.md`.

## Local browser-acceptance runtime blocker — 2026-10-26 (audit 270)

- Status: BLOCKED_ENVIRONMENT / NOT_TESTED (not a provider credential blocker).
- Required service: isolated PostGIS + Redis test runtime for API readiness, migrations and authenticated browser E2E.
- Observed: API `127.0.0.1:3310/healthz` responds 200 but `/readyz` responds 500; configured PostgreSQL `127.0.0.1:5434` has no listener. Host PostgreSQL 14.23 on 5432 has no PostGIS extension and was not used or modified. Docker Desktop UI shows Engine running and nine entries, but CLI/Engine API socket calls time out; ports 3317, 3318 and 3339 are closed.
- Local fallback is not currently provisioned: `redis-server`/`redis-cli` are absent; Homebrew PostGIS requires 11 dependencies, and only ~2 GiB disk remains. No installation attempted to avoid consuming most remaining disk without a bounded storage plan.
- Prepared: local unit/build suites pass; browser guest pages and controls were inspected; guest-only trip polling bug was fixed and committed centrally as `6dd47db`; Site endpoint provider discovery fix is locally tested in its dirty checkout.
- Safe next step: restore the intended isolated Docker/PostGIS runtime and verify Docker Engine responsiveness, then align Vite proxy target and rerun `/readyz`. No containers, volumes, databases or files were deleted or changed.
- Evidence: `docs/audit/270_GUEST_TRIPS_POLLING_AND_RUNTIME_ACCEPTANCE_2026-10-26.md`.

## Local runtime recheck — 2026-10-26 (audit 271)

- Status: BLOCKED_ENVIRONMENT, not external credentials.
- Vite on 3000 serves the UI but proxies API routes to 3002, which is closed. A separate API process on 3310 returns `/healthz` 200 but `/readyz` 500 and runs from `/private/tmp/marshgo-server-partner-integration-20261026`; configured PostGIS DB 5434 has no listener.
- Docker Unix socket `_ping` timed out at 3 seconds; disk has 3.0 GiB available. Do not repoint Vite to the unrelated unready API and do not remove Docker data or install a large stack without a safe storage plan.
- Prepared: current production check passes; guest profile/search controls inspected; Search unavailable and Add Vehicle returns 502. Evidence: `docs/audit/271_CURRENT_GUEST_UI_ACCEPTANCE_AND_RUNTIME_RECHECK_2026-10-26.md`.
- Next: restore isolated PostGIS/Redis and run the canonical API on configured port 3002 before continuing browser acceptance.

### 2026-10-29 official commercial mobility API check
Taxi and transfer categories remain excluded from route search until provider capability is verifiable. Uber's official API documents estimates under `ride_request.estimate`, requiring registered-app credentials and scope; ride booking has separate privileged scope. Bolt Support says it offers no public/private rider API; Bolt Fleet API is a separate fleet-partner product. Public Uklon partner material reviewed covers driver/fleet terms, not a consumer quote API. Therefore do not enable taxi or create estimates from static map data; secure provider-specific agreement/credentials and validate launch-city coverage first. References: [Uber Ride Requests](https://developer.uber.com/docs/riders/ride-requests/tutorials/api/introduction), [Uber scopes](https://developer.uber.com/docs/riders/guides/migration-steps), [Bolt public API](https://bolt.eu/en/support/articles/360017256060/), [Bolt Fleet API](https://developer.bolt.eu/fleet-integration/main/), [Uklon partner terms](https://uklon.com.ua/en/terms-and-conditions-en/offer-partner/).
