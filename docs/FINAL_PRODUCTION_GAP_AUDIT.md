# MARSHGO final production gap audit — 2026-10-01

## Scope and workspace state

- Audited the current integrated workspace on branch `codex/marshgo-production`, HEAD `3f597f4` (`test: stabilize route match confirmation flow`). The local tree already contains extensive uncommitted and untracked work; those changes are preserved and treated as the source of truth. This follow-up adds account data-export UI, reversible deletion cooling-off/cancellation, proposal expiry processing and the two new acceptance reports; nothing has been committed.
- The umbrella workspace contains Server/Site/iOS working copies. Separate clean clones were also made for the four named repositories to compare their canonical `main` heads. Local focused-repository commits described below are not pushed; GitHub `main` therefore remains unchanged at the audited SHAs until those commits are published/reviewed.
- Current verification after migration 027: `npm run check:production` passed (typecheck, full-source lint, 71 unit tests passed, 1 opt-in test skipped, production build and per-chunk gzip budget); `npm run test:integration` passed 17/17 across PostGIS/API booking, proposal expiry, navigation, Redis realtime, process restart and Redis rate limit; `npm run test:e2e` passed 6/6 on its isolated local stack, including JSON export ownership and deletion request → cancel → reload; `npm run test:browser-compat` passed 3/3 engines (Chromium, Firefox, WebKit) at phone/tablet/desktop sizes with back/refresh/404 checks. The live-provider smoke also passed fresh Nominatim geocoding/reverse-geocoding, a public OSRM road route and MapLibre/OpenFreeMap rendering (28 real provider asset requests; screenshot `/tmp/marshgo-live-map-route.png`). `npm run ios:simulator` built, installed and launched the iPhone 16 Pro Max Simulator against a local API; visual smoke screenshot: `/tmp/marshgo-ios-simulator.png`. This is not an authenticated iOS user journey or a physical-device test.
- Staging, real SMS, physical-device acceptance and hosted production have not been exercised. None of these local checks imply production deployment.
- The iOS Simulator compile used the remote Site `main` snapshot, SHA `ed602ac`; it did not consume the newer local Site commits. The physical iPhone listed by `devicectl` is `unavailable`; available devices are simulators only.
- CI configuration now adds `bun audit --audit-level=high` and installs/runs Chromium, Firefox and WebKit. A separate workflow adds CodeQL and Gitleaks. These workflow changes have not yet run on GitHub Actions.
- Bun 1.3.5 `bun audit` and `bun audit --audit-level=high` both passed against the checked-in lockfile with no advisories reported. Focused current-tree and commit-history checks found no recognized API key, token, private-key, or credential-bearing URL pattern beyond local/test placeholders. This does not cover container OS/package CVEs or every custom secret format.

## Current-state matrix

| Area | Status | Evidence / gap |
|---|---|---|
| PostgreSQL/PostGIS and Redis | DONE locally | Migrations are present through 027; local clean-profile Compose and integration checks are documented. Managed staging restore/drill remains external. |
| OTP, refresh sessions, role model | DONE locally / BLOCKED_EXTERNAL for SMS | OTP/session APIs and refresh-cookie tests exist. The provider adapter requires real account/sender credentials before delivery can be verified. |
| User, vehicle, verification, offers, bookings, idempotency, lifecycle, QR token, reviews | DONE locally | API, Site flows and integration/E2E coverage exist. Native QR camera scanner is missing. |
| Account deletion request | PARTIAL / BLOCKED_EXTERNAL | Migration 027 adds a reversible 7–90 day cooling-off state, owner-only request/status/cancel API and Site UI. No data purge runs; retention/backup erasure policy and worker are not approved or implemented. |
| Reverse Marketplace and price proposals | PARTIAL | Demand, proposal/counter, acceptance race protection and E2E paths exist. Expiry worker now updates state and emits participant notifications; full hosted trip-closeout path is still missing. |
| Chat, Redis realtime, transactional outbox, inbox | DONE locally | Persisted messages, cross-instance delivery and inbox flows exist. Web Push/APNs delivery is missing. |
| Navigation core, routing adapter, foreground GPS, offline snapshot, stop optimization | PARTIAL | Core contracts/replay and foreground route/match behavior exist. Chromium E2E now replays a deviation through browser geolocation, confirms server off-route detection, observes reroute and route-version replacement. Production routing/map asset contract, background iOS GPS and hosted/device acceptance remain unverified. |
| Live passive matching | PARTIAL | Consent-bound candidate discovery/interest and single-rider insertion foundations exist. Full production multi-passenger UI and continuous production drive acceptance are incomplete. |
| Journey schema, scoring and planner | PARTIAL | Journey persistence, scoring strategies, transfer feasibility and a bounded multi-leg composer exist. Current search is still direct Community inventory; no provider feed is injected into the composer. |
| WALK routing and real connectors | MISSING | Planner accepts measured walking connectors but there is no walking route provider delivering pedestrian geometry/time to active Journey search. |
| GTFS / GTFS-Realtime / bus, minibus, rail, taxi inventory | NEEDS_REAL_PROVIDER | No configured feeds/contracts are present. Schedule/live inventory must not be fabricated. |
| Future Community transfer matching / SOFT_MATCH | MISSING | No uncertainty-window matcher is connected to scheduled/other provider Journey legs. |
| Journey Monitor, ETA cascade, predictive replan and Journey Rescue | MISSING | Journey lifecycle binding exists, but no active observation monitor, risk cascade or alternative replacement search. Booking Rescue is limited. |
| Rendezvous | PARTIAL | Booking-bound session, participant authorization, Redis latest-only locations, explicit arrival/boarding states and Site actions exist. No map-based live rendezvous, road ETA, automatic activation worker or full physical acceptance. |
| ProductionMarketplace frontend architecture | PARTIAL | Production API shell is real, but `src/views/ProductionMarketplace.tsx` still owns many screens, domain effects and state in one component. Feature modules/hooks/forms/dialogs are not split out. |
| Production URL router / deep links | PARTIAL | Added refresh-safe URL mapping for top-level screens (`/journeys/search`, `/trips`, `/messages`, `/profile`, `/demands/*`, `/offers/new`, `/navigate`, `/admin/verification`), browser back/forward and a not-found state, with Chromium/Firefox/WebKit tests. Marketplace E2E now verifies tab retention on reload and active navigation restoration. Entity URLs (`/journeys/:id`, `/trips/:bookingId`, `/messages/:bookingId`), query/deep-link restoration and UI auth/role guards remain absent; API authorization remains the security boundary. |
| OpenAPI contract and generated Site client | PARTIAL | OpenAPI material exists, but it does not cover the entire `/api/v1` surface and no generated TypeScript client is wired into Site. |
| API request/response runtime validation | PARTIAL | Domain schemas and selected route validations exist; external boundaries and response DTOs are not comprehensively generated/validated from a shared contract. |
| Provider health, failure isolation and cache | PARTIAL | Routing/geocoding adapters have bounded failures and config validation. There is no provider registry/cache/fan-out layer for optional multimodal sources yet. |
| Object storage and document handling | PARTIAL / BLOCKED_EXTERNAL | S3-compatible signed-upload adapter and document API exist. Private production bucket, encryption, lifecycle, audit logging and malware scanning are not configured/verified. |
| Payment / commercial settlement | BLOCKED_EXTERNAL | Community 0% fee snapshot is implemented. No payment intent, webhook, refund or settlement provider exists; no online-payment claim should be shown. |
| PWA service worker | PARTIAL | PWA manifest/build support exists; production offline shell and safe last-Journey snapshot cache are not implemented as a complete service worker lifecycle. |
| iOS Capacitor build | DONE as simulator smoke | Current bundle builds/launches in iPhone Simulator. Authenticated native journey, TestFlight signing, APNs, background GPS, QR camera and two-device physical testing are not complete. |
| Web visual/browser quality | PARTIAL | Chromium, Firefox and WebKit were checked at three representative viewport sizes. This is not exhaustive OS/device/browser-version coverage or pixel-identity with all supplied composites. |
| Security pipeline | PARTIAL | Runtime config, authorization, rate limits, CSP/security headers and selected auth/race tests exist. Full SAST, secret/dependency scanning, authorization matrix and upload-abuse review are not release-verified. |
| Monitoring, backups, restore, rollback and incident response | MISSING / BLOCKED_EXTERNAL | Local health/readiness and structured logging exist. Hosted metrics/alerts/error tracking, encrypted PITR backups, successful restore drill and deploy rollback are not configured. |
| Hosted staging / production | BLOCKED_EXTERNAL | No domain/TLS/host, secret manager, managed DB/Redis, contracted assets/providers, production SMS or approval workflow is configured in this workspace. |

## Repository signals checked

- `server/index.ts` remains a large modular-monolith entrypoint despite `server/journey`, `server/navigation`, `server/providers`, `server/routing`, `server/traffic` and `server/domain` boundaries. Extracting handlers must preserve its middleware, transaction and auth closures; do this incrementally with route-level regression tests.
- `ProductionMarketplace.tsx` remains a large view/controller; the demo implementation remains reachable only through explicit `VITE_DEMO_MODE=true` and older prototype components contain localStorage/seed behavior. Keep production entry points isolated; do not confuse demo-only seed data with live inventory.
- The production web entry now imports only the API-backed `ProductionMarketplace`; the seeded/localStorage prototype is outside the production module graph, and a bundle check fails if known demo IDs are emitted. Prototype source still exists for development, so keep the production entry boundary covered by CI.
- Public Nominatim/OSRM/OpenFreeMap smoke results demonstrate adapter/render compatibility only. These public endpoints are not a contracted provider or a production SLA.
- Full Site lint initially exposed 177 unused/dead-code findings across legacy views; those were removed and full Site lint now passes. The standalone Server repo now has its own ESLint/CI gate and passes `eslint server tests`. The umbrella lint also passes across `src`, `server`, `shared`, `tests`, `e2e`, `scripts`, and `tools` without disabling unused-code checks.
- Canonical snapshots checked at the start were umbrella `main` `1e7d0ee`, Server `ef9d105`, Site `ed602ac`, and iOS `647ffbb`. Open PRs existed in each repo. Focused local commits now sit ahead of the Site/Server/iOS snapshots, but they are not pushed or merged; keep this difference explicit in release manifests.

## Safe implementation order

1. Extract one cohesive production frontend slice at a time, then expand URL routing to entity deep links without changing API behavior.
3. Complete OpenAPI coverage and generation/validation before adding provider inventory.
4. Add a real pedestrian route contract/adapter and connect only measured WALK routes to the existing multi-leg planner.
5. Add GTFS and GTFS-Realtime adapters with explicit source freshness and provider isolation; keep disabled until an authorized feed is configured.
6. Connect confirmed/soft Community matching windows, then Rendezvous/monitor/replan based on real observations.
7. Finish physical iOS and hosted operational gates only when the required device/accounts/infrastructure are available.

Do not call the product production-ready until every release gate in the user's master task has evidence from its named real environment.
