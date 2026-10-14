# MARSHGO Redis Cache and Production Gap Audit

Checked: 2026-10-14. This report records the cache and routing work on isolated feature branches and the current release blockers. No branch was merged, no release flag was changed, and no production service was contacted or deployed.

## Repository baseline

| Repository | Audited branch / starting revision | Current finding |
|---|---|---|
| MarshGO-Server | `codex/sync-mobility-registry` @ `7dda315fa5a60b3e78ba284da98a94e129cbff1b` | Smart Cache changes are isolated on `codex/redis-smart-cache`; pre-existing dirty changes in the primary checkout were left untouched. |
| MarshGO-Site | `codex/sync-journey-mobility-ui` @ `6961afcf008e2c845c0fde68c687ce61fe744f2f` | The global return-to-navigation affordance was not rehydrated after a reload in another section. Site PR #4 latest `codex/redis-smart-cache` SHA `5a12c6fbf0b18ca479e92c93d6d9597d567734d3` also moves the return action into the sticky brand area after WebKit found it covering route search. Local checks and both latest hosted checks pass. |
| MarshGO-iOS | `codex/reliable-capacitor-sync` @ `a282d3efa169626f803d87c54f22fceeb24a563b` | No native navigation code changed. iOS PR #3 latest SHA `268fc48fbd8ed9dc278bb9f0b142e341bcfc5652` pins Site `5a12c6fbf0b18ca479e92c93d6d9597d567734d3`; both latest simulator checks pass. |
| MarshGO | `codex/marshgo-production` @ `822c6fbe8b27aed2bcf1380ceec9dacd431b390c` | Task branch `codex/redis-smart-cache` PR #2 exact code candidate `aac002643ab8704bf47c9181e1120b17010ad9f6`; release manifest remains `NOT_RELEASED`, both readiness flags false. |

Task review requests are Server PR #5, Site PR #4, iOS PR #3, and umbrella PR #2. These are independent review branches. None of these changes has been merged or deployed.

## Redis and routing findings

| Area | Status | Evidence / limitation |
|---|---|---|
| L1 CacheService | IMPLEMENTED | LRU by serialized bytes and entry count, TTL, Zod validation, local single-flight, invalid-entry rejection, fail-open behavior, metrics. |
| Redis L2 | IMPLEMENTED | Isolated `REDIS_CACHE_URL`; does not fall back to critical `REDIS_URL`. Local Redis Compose uses a separate 256 MiB `allkeys-lru` service without persistence. |
| Cross-process single-flight | IMPLEMENTED / TESTED | Real loopback Redis: two Node processes, 50 identical calls each, one shared loader execution. This verifies the cache lock contract, not a full multi-replica production deployment. |
| OSRM geometry cache | IMPLEMENTED, CONFIGURATION REQUIRED | Exact coordinates, ordered waypoints, profile/options, endpoint and immutable graph version form the key. Cache is bypassed when the graph version is absent. No production graph version or OSRM deployment was validated here. |
| Routing gateway | IMPLEMENTED | Every server `fetchOsrmRoute()` call is routed through the bounded priority queue; navigation work precedes interactive work, which precedes optimizer work. Queue limits are per process. |
| Stop optimizer | IMPLEMENTED | Baseline and shortlist calls use background priority and are covered by existing optimizer tests. Production-scale CPU/RAM and many-replica limits are not measured. |
| GBFS / GTFS-Realtime | IMPLEMENTED | Validated, provider-scoped snapshots; source freshness and short TTL are applied. No operator account or production feed SLA is claimed. |
| Static GTFS/GeoJSON map networks | IMPLEMENTED | Zod-validated normalized L2 entries use SHA-256 of the last successfully validated source payload. Missing digests use a 60-second local-only cache. |
| Journey timetable cache / Kyiv schedule cache / live vehicle cache | PARTIAL | Existing local caches remain process-local; their import/version propagation is not yet wired to CacheService. |
| Search results / personal data | NOT SHARED | Personal route queries, bookings, prices, sessions, payment confirmations, and user GPS are not put in the shared cache. |
| Metrics | IMPLEMENTED | `/metrics` is hidden unless a bearer secret is configured and authenticated. Local counters cover cache, routing queue/upstream, process and database pool; deployment scrape/alerts are not configured. |
| Compression | NOT IMPLEMENTED | No measured case justified adding compression; cache entry byte limits bound large values. |

## Verification recorded

- Server feature branch: typecheck and ESLint passed; unit suite reported 200 passed, 0 failed, 3 opt-in integration tests skipped when run without service configuration.
- Server integration: 28/28 checks passed on a disposable loopback PostGIS database with the critical Redis and separate cache Redis configured. The suite covered migrations, journey schema, booking/trip edits, navigation, realtime across API instances, process restart, and shared rate limiting.
- Redis integration: 2/2 opt-in tests passed against actual Redis, including two independent Node processes.
- Local OSRM-compatible fixture: a cold burst of 100 equivalent routes used 1 upstream calculation rather than 100 (99% fewer fixture calls); warm burst used 0 upstream calls. Timings are local fixture measurements, not SLOs.
- Site PR #4 latest SHA `5a12c6fbf0b18ca479e92c93d6d9597d567734d3`: local typecheck, lint, build, 80 unit tests, bundle budget and both latest hosted checks passed. It rehydrates the active session outside navigation without mounting the map or starting GPS, restores the existing view on return, and keeps the return action out of the route-search hit area.
- iOS PR #3 latest exact-pin simulator checks for commit `268fc48fbd8ed9dc278bb9f0b142e341bcfc5652` both passed against Site `5a12c6fbf0b18ca479e92c93d6d9597d567734d3`; no physical-device/background acceptance is claimed.
- Latest exact-pin browser compatibility matrix passed 6/6 across Chromium, Firefox and WebKit on Site `5a12c6fbf0b18ca479e92c93d6d9597d567734d3`, using the production bundle and isolated loopback test fixtures. It covers responsive sign-in/home/search and canonical route map, sheet snap states, segment focus, light/dark palettes, and foreground navigation. This resolves the WebKit search hit-target overlap; full umbrella hosted CI is still required.
- Umbrella exact-pin local browser suite: 12/12 passed in 7.5 minutes on isolated PostGIS, Server `64ed70c72fec06cb9418dc7feee67ae0acee3826`, and the preceding Site `5e8a022c5e6d747892eee998db7a4f6d4dab4ac6`. On the current Site pin, the focused multi-rider/navigation reload scenario passed 1/1, and the exact-pin browser compatibility matrix passed 6/6 across Chromium, Firefox and WebKit.
- The broad control audit clicked 151 controls without page errors or unexpected 5xx responses. It reported 15 controls with no visible DOM/text/network change: active tabs, actions without input, map attribution, and GPS recentering without a fix. These are retained as manual UX triage observations; the harness does not classify them as functional failures.
- Umbrella `npm run check:production`: TypeScript, lint, 231 unit tests (0 failures, 1 opt-in skip), production build and 51-chunk gzip budget all pass locally. Host Node 25.4.0 is outside the repository's declared `>=24.21.0 <25` range; exact-runtime hosted verification is pending.
- Root PR #2 exact-manifest run `38496164444` passed the complete hosted `verify` job in 14m27s, including `npm test`, database integration, production bundle/container builds, full Playwright E2E and Chromium/Firefox/WebKit compatibility; hosted E2E and compatibility both passed on the synchronized Server `64ed70c72fec06cb9418dc7feee67ae0acee3826` / Site `5a12c6fbf0b18ca479e92c93d6d9597d567734d3` pins. CodeQL and Gitleaks also pass. The prior run `38493584279` exposed a WebKit navigation-return overlap (5/6 browser cases); Site `5a12c6f` fixes it, and the exact-pin rerun is now green. Earlier run `38475752401` failed five Playwright cases before stale UI selectors and navigation rehydration were fixed; it is superseded, not erased from history.
- The Server package declares Node 24.21.0; local execution used Node 25.4.0. Both Server PR #5 hosted checks passed on the declared runtime, including typecheck, lint, unit, migration and integration jobs.

## Not tested at production scale

`k6` is unavailable in this workspace. The following remain NOT_TESTED: 5/10/30/50 searches per second, 1,000 WebSocket clients, 10,000 unique cache keys under measured Redis memory, high-latency provider saturation, and API-wide cold/warm p95/p99 SLO. No production OSRM/PostGIS load target or dedicated account was configured. The feature includes a local-only k6 script for an isolated test environment.

## Product-wide release gaps

| Priority | Gap | Status / owner input needed |
|---|---|---|
| P0 | Exact immutable routing graph identifiers and production `OSRM_URL` / foot-routing availability | BLOCKED_EXTERNAL: deployment operator must provide the actual endpoint and graph artifact/version. Until then road-geometry L2 is deliberately bypassed. |
| P0 | Separate managed cache Redis, secrets, memory/eviction monitoring and rollback | BLOCKED_EXTERNAL: production infrastructure and secret manager are not configured. The local Compose cache is not a production service. |
| P0 | Release candidate automated acceptance | PASS for the synchronized code candidate: root CI run `38496164444` passed the full exact-pin E2E and browser matrix, and Server/Site/iOS PR checks pass. This does not establish staging or production readiness; external operations and scale evidence remain open. |
| P1 | Kiwitaxi, Intui.travel, INFOBUS and other partner API credentials, commercial permissions and quotas | BLOCKED_EXTERNAL where keys/contracts are required; catalogs or links must not be presented as live quotes/bookings. |
| P1 | Broad Ukrainian GTFS/GTFS-RT/GBFS coverage, authoritative fares, traffic and real-time SLAs | PARTIAL / BLOCKED_EXTERNAL: validate provider-by-provider; UI categories alone do not prove route coverage or live availability. |
| P1 | Staging host/domain, production database, files, SMS, monitoring/alerts, backups and tested rollback | BLOCKED_EXTERNAL: no current staging target or production deployment configuration is recorded. |
| P1 | iOS background GPS, suspension, battery, APNs and signed archive acceptance on physical devices | NOT_TESTED: simulator CI does not establish physical-device/background behavior. |
| P2 | Browser / accessibility / real-device performance matrix for this exact candidate | NOT_TESTED on the cache branch; current app UI is unchanged by the server cache work, but exact integrated candidate still needs acceptance. |

## Readiness decision

Server cache code is a reviewable candidate; it is not production-ready. Staging readiness is not established. Pilot readiness is not established. Production remains `NOT_RELEASED`; `ready_for_server_deployment=false` and `production_ready=false` must remain unchanged until the current exact-pin E2E, hosted CI, staging operations, external data permissions, and load evidence are accepted.
