# Final production gap audit — 2026-10-01

## Evidence basis

- Server canonical `main` at `2fcdeed` includes planner and Rendezvous unit tests; repository CI passed. Local integration suite passed 17/17 against PostGIS/Redis.
- Site canonical `main` at `c7f76a4` passed `lint:all`, TypeScript and production build. Umbrella production check passed: 72 unit tests, one opt-in skip, Vite build, gzip chunk budget.
- Umbrella production Browser E2E passed 6/6 in Chromium. It covers production-bundle boot, onboarding, separate passenger/driver contexts, booking/demand/chat persistence, browser GPS route deviation/rerouting, and Journey offer detail. It does not cover the full release golden path.
- iOS canonical `main` at `b8b1fcb` passed GitHub Simulator CI. Local simulator screenshot after adequate settle shows onboarding. This is not a physical-device acceptance.
- Local Adobe S3Mock contract smoke passed an AWS SDK put/head/get. A disposable PostGIS backup/restore drill is in progress. Production Compose syntax and shell script syntax pass.

## Architecture and state reconciliation

The standalone repositories now receive canonical pushes, but the umbrella still contains synchronized copies of `server/` and `src/`; the Dockerfiles build those copies. The release manifest records standalone SHAs, but the production container build does not yet checkout/materialize them. This is a high-priority reproducibility gap. Do not label an umbrella-built container as the exact standalone-SHA release until this is fixed.

Server PR #1's core planner/Rendezvous code already exists in canonical `main`; the omitted PR unit tests were ported and pushed. Site PR #1 functional rendezvous/onboarding code exists in canonical `main`, though its PR remains open for residual source diffs. iOS PR #1 screenshot settling behavior was ported and pushed; the old full PR cannot be merged wholesale because it removes current pinned release inputs.

## Capability audit

| Domain | Status | Facts |
|---|---|---|
| PostgreSQL/PostGIS, Redis and migrations | PARTIAL | Integration tests cover spatial data, booking concurrency, rendezvous, realtime, Redis rate limits and API restart. No full new-deployment migration+restore rehearsal is complete yet. |
| Auth and sessions | PARTIAL | Passwordless OTP/session/refresh behavior is locally tested; Twilio production delivery and device/session UX breadth remain external/incomplete. |
| Vehicle/verification | PARTIAL | Server ownership/review rules and private-evidence controls exist; production private storage, scanner, complete rejection/re-upload driver journey are unverified. |
| Offers, demand, booking, capacity | PARTIAL | Server-owned API paths, transaction/race tests and browser paths exist; full trip closure, cancellation/refund and full two-sided reviews are not end-to-end accepted. |
| Reverse Marketplace | PARTIAL | Proposal/counter/accept conversion is tested; full live operation→booking→rendezvous→completion cycle is incomplete. |
| Chat/realtime/inbox | PARTIAL | Persisted chat, Redis fanout and reconnect-capable REST model exist; push delivery and complete unread/retry acceptance are missing. |
| Routing and map | PARTIAL | MapLibre adapter and route geometry render in browser. E2E uses deterministic provider fixtures; no contracted/self-hosted production map assets or routing/geocoding acceptance. |
| Navigation/matching | PARTIAL | Browser geolocation scenario detects off-route and reroutes; complete continuous driver, safe prompt and generalized multi-passenger acceptance remain. |
| Journey / GTFS / WALK | PARTIAL | Planner/scorer/transfer engine foundation exists; WALK geometry provider, GTFS feeds and real public/commercial transport are absent. |
| Journey monitor/replan/rescue | FAILED | No autonomous active monitor/replan/rescue loop with alternatives delivered through UI. |
| Rendezvous | PARTIAL | Authorized Redis-ephemeral location/status and Site controls exist; not a live map/meeting ETA production flow; no two physical devices. |
| iOS | PARTIAL | Capacitor Simulator compiles, launches and renders; no signed/TestFlight/physical/background/push/QR acceptance. |
| S3/storage | PARTIAL | Adapter unit tests and S3Mock put/head/get pass; S3Mock is a test implementation, not private production storage validation. |
| Payments/commercial partners | BLOCKED_EXTERNAL | No live merchant/partner API config or credentials. |
| Security | PARTIAL | Production config is fail-closed, server guards exist, security headers/rate limits and dependency checks are present. Full release SAST/secrets/container scans and staging abuse review are not complete. |
| Operations/deployment | PARTIAL | Compose, Caddy, bootstrap/update, AES-GCM backups and guarded restore exist. No canonical source materialization, full service stack, monitoring/alerts or hosted restore drill. |
| Visual parity | PARTIAL | Cross-browser responsive testing exists; exact desktop/tablet/iPhone reference parity across supplied screenshots has not yet been completed. |

## High-priority software gaps

1. Make release image builds consume the immutable standalone Server/Site revisions recorded in `RELEASE_MANIFEST.json`.
2. Add a single local/staging-like Compose topology with actual API, Site, worker, PostGIS, Redis, S3 emulator, proxy and monitoring; run migrations and all acceptance flows through it.
3. Finish full community and reverse-marketplace lifecycle E2E from auth/vehicle review through trip closure/review, cancellation recovery and restart.
4. Implement and test WALK/provider-fed multimodal Journey, Journey monitor, ETA cascade, predictive replan and Rescue. Keep absent external modes disabled.
5. Implement Web Push/APNs adapters/worker delivery, payment provider contract, native QR/background location, account-deletion processor and data retention controls.
6. Add production metrics/alerts/error tracking, full security scan gates, off-host backup schedule, measured restore/recovery and rollback rehearsal.
7. Complete visual comparison with supplied reference images after product and deployment work.

See [RELEASE_STATUS.md](RELEASE_STATUS.md) for status values and [READY_FOR_SERVER_DEPLOYMENT.md](../READY_FOR_SERVER_DEPLOYMENT.md) for deployment decision.


## Temporary public staging result (2026-10-01)

A temporary HTTPS tunnel at https://0931d476510892.lhr.life exposed an isolated local staging stack. Health/readiness, dev OTP login, geocoding, OSRM road route, MapLibre/OpenFreeMap tile/style loading, responsive Chromium desktop/mobile rendering, private S3Mock test upload, and a passenger demand surviving API restart and a staging-only Redis stop/start recovery drill were verified through browser UI. The deployed Server revision is `f0a6cdb2fd918733770f65f997dfea5d7c302b0c` from the open Server security-fix PR branch; this is not the Server `main` release baseline. Site staging currently uses the navigation-alias PR #2 revision `97b29ed…`; direct `/navigation` was visually verified after the fix.

This does not close the production gaps. The full two-sided booking, chat, notifications, rendezvous, boarding/completion/review, passive matching, realistic GPS reroute, Rescue and WebSocket reconnect paths were not accepted. The public hostname is ephemeral; S3Mock and public routing/geocoding/map services are not production infrastructure. Do not set STAGING_READY or PRODUCTION_READY to YES. See STAGING_DEPLOYMENT_REPORT.md.
