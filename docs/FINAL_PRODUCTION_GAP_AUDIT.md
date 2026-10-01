# Final production gap audit — 2026-10-01

## Evidence basis

- Current public staging: `https://b017cccb204056.lhr.life`; homepage, staging banner and readiness returned HTTP 200 with PostgreSQL and Redis connected at 2026-10-01 14:43 Europe/Kyiv. Deployed Server `de2209bc71557a14b20afac07b5067a7139b8b42`, Site `150aa7ade03871cd12b80c6b3e205f345d37f996`, migration `028`. Public Chromium OTP/geocoder/Journey search/navigation role checks passed on the preceding renewed hostname `e134c817e388ca.lhr.life`, which later expired. The tunnel is ephemeral and paired booking-to-completion acceptance is incomplete; `STAGING_READY=NO`.
- Server PR #2 exact head passes Verify, `typecheck`, repository-wide lint, unit tests (49 passed, 0 failed, 2 skipped), and isolated PostGIS/Redis integration (18/18; migrations 001–028).
- Site PR #2 exact head passes Verify; local `typecheck`, repository-wide lint and production build pass. It fixes the stale Home navigation state when returning from result screens.
- Umbrella production-browser E2E passes 6/6 in Chromium on a production Vite build with isolated PostGIS/Redis and deterministic test providers. It covers responsive smoke, onboarding, independent passenger/driver sessions, search/booking/demand negotiation/persisted chat, simulated GPS reroute, road route rendering and Journey result details. It does not cover full release trip closure or real provider integrations.
- iOS canonical `main` at `b8b1fcbfe9997e1a7a27594b5759690147de75df` has passing GitHub Simulator CI. This is not a physical-device acceptance.
- Local S3Mock contract smoke, disposable PostGIS backup/restore, Compose validation and production image builds are prior local evidence. No hosted production storage, off-host backups, or production monitoring/recovery objectives are verified.

## Architecture and state reconciliation

The release materializer clones/checks out the immutable standalone Server/Site SHAs recorded in `RELEASE_MANIFEST.json`, then generates deployment inputs and builds from those checkouts. This was verified locally against Server `bdfdf24941809f4581965b9847022c68e0b2f127` and Site `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7`; the generated production Compose configuration validated and the API/Web images built. This turn hardened that path by rejecting tracked/staged/deleted or unexpected untracked changes in reused pinned checkouts, restricting Docker contexts with per-source `.dockerignore`, and recording SHA-256 digests for materialized build inputs. Integration PR #1 CI was green at its prior head; rerun CI is required for these new changes.

Server PR #1's core planner/Rendezvous code already exists in canonical `main`; the omitted PR unit tests were ported and pushed. Site PR #1 functional rendezvous/onboarding code exists in canonical `main`, though its PR remains open for residual source diffs. iOS PR #1 screenshot settling behavior was ported and pushed; the old full PR cannot be merged wholesale because it removes current pinned release inputs.

## Capability audit

| Domain | Status | Facts |
|---|---|---|
| PostgreSQL/PostGIS, Redis and migrations | PARTIAL | Integration tests cover spatial data, booking concurrency, rendezvous, realtime, Redis rate limits and API restart. No full new-deployment migration+restore rehearsal is complete yet. |
| Auth and sessions | PARTIAL | Passwordless OTP/session/refresh behavior is locally tested; Twilio production delivery and device/session UX breadth remain external/incomplete. |
| Vehicle/verification | PARTIAL | Server ownership/review rules and private-evidence controls exist; production private storage, scanner, complete rejection/re-upload driver journey are unverified. |
| Offers, demand, booking, capacity, reviews | PARTIAL | Server-owned paths and transaction/race tests exist. Passenger and driver each submitted a review through the canonical UI against a labeled staging completed-trip fixture; each role's reviewed state survived reload from the Server API (passenger on public HTTPS, driver via a local edge on the same staging Postgres/Redis/S3Mock after public OTP rate limiting). This does not accept the booking-to-completion lifecycle. Broader cancellation/recovery and full end-to-end acceptance remain open. |
| Reverse Marketplace | PARTIAL | Proposal/counter/accept conversion is tested; full live operation→booking→rendezvous→completion cycle is incomplete. |
| Chat/realtime/inbox | PARTIAL | Persisted chat, Redis fanout and reconnect-capable REST model exist. Candidate PR revisions add persistent per-user read cursors, unread counts and trip-card badges; two-account browser E2E verifies the badge and cursor advance. Push delivery, per-message delivery receipts and hosted reconnect acceptance remain missing. |
| Routing and map | PARTIAL | MapLibre adapter and route geometry render in browser. E2E uses deterministic provider fixtures; no contracted/self-hosted production map assets or routing/geocoding acceptance. |
| Navigation/matching | PARTIAL | Latest production-browser E2E verifies a driver starting their own route, consenting to a route demand, obtaining passenger confirmation, sending a price, creating a booking and inserting route stops. Ten gradual simulated 80 m GPS steps persisted within 20 m, triggered an off-route route-version update and visible reroute, and paused matching until fresh consent. This uses a verified DB fixture and one passenger; public-staging, safe-in-motion behavior, continuous device GPS and generalized multi-passenger acceptance remain. |
| Journey / GTFS / WALK | PARTIAL | Planner/scorer/transfer engine foundation exists; WALK geometry provider, GTFS feeds and real public/commercial transport are absent. |
| Journey monitor/replan/rescue | PARTIAL | Cancelled-booking Rescue now adds route-geometry-checked Community alternatives and explains endpoint versus corridor matches in the UI. PostGIS integration and local production-browser E2E pass. Automated active Journey monitoring, downstream ETA cascade, predictive replan, partner alternatives and a public paired-user replacement-booking cycle remain missing. |
| Rendezvous | PARTIAL | Authorized Redis-ephemeral location/status and Site controls exist; not a live map/meeting ETA production flow; no two physical devices. |
| iOS | PARTIAL | Capacitor Simulator compiles, launches and renders; no signed/TestFlight/physical/background/push/QR acceptance. |
| S3/storage | PARTIAL | Adapter unit tests and S3Mock put/head/get pass; S3Mock is a test implementation, not private production storage validation. |
| Payments/commercial partners | BLOCKED_EXTERNAL | No live merchant/partner API config or credentials. |
| Security | PARTIAL | Production config is fail-closed, server guards exist, security headers/rate limits and dependency checks are present. Full release SAST/secrets/container scans and staging abuse review are not complete. |
| Operations/deployment | PARTIAL | Immutable standalone source materialization, worktree cleanliness checks, restricted Docker contexts, production Compose, Caddy, bootstrap/update, AES-GCM backups and guarded restore exist. Generated production Compose validates and pinned API/Web images build locally. Full hosted service stack, monitoring/alerts and hosted restore drill remain incomplete. |
| Visual parity | PARTIAL | Cross-browser responsive testing exists; exact desktop/tablet/iPhone reference parity across supplied screenshots has not yet been completed. |

## High-priority software gaps

1. Complete CI verification of the newly hardened immutable release materializer and retain build attestations as release artifacts.
2. Add a single local/staging-like Compose topology with actual API, Site, worker, PostGIS, Redis, S3 emulator, proxy and monitoring; run migrations and all acceptance flows through it.
3. Finish full community and reverse-marketplace lifecycle E2E from auth/vehicle review through trip closure/review, cancellation recovery and restart.
4. Implement and test WALK/provider-fed multimodal Journey, Journey monitor, ETA cascade and predictive replan. Extend route-aware booking Rescue into a complete paired-user replacement-booking and trip-recovery flow. Keep absent external modes disabled.
5. Implement Web Push/APNs adapters/worker delivery, payment provider contract, native QR/background location, account-deletion processor and data retention controls.
6. Add production metrics/alerts/error tracking, full security scan gates, off-host backup schedule, measured restore/recovery and rollback rehearsal.
7. Complete visual comparison with supplied reference images after product and deployment work.

See [RELEASE_STATUS.md](RELEASE_STATUS.md) for status values and [READY_FOR_SERVER_DEPLOYMENT.md](../READY_FOR_SERVER_DEPLOYMENT.md) for deployment decision.


## Temporary public staging result (2026-10-01)

A temporary HTTPS tunnel at https://d399d7d0ed6b9b.lhr.life exposes an isolated local staging stack as of 2026-10-01 15:31 Europe/Kyiv. Current deployed candidates are Server `237d14f1b3e4d69936433f46f290d1cd4b920d9d` and Site `79222d65beecb8bba5d234acfab47bb34070453e`; migration 028 is applied. The passenger review UI was exercised on the public URL; the driver review UI was exercised through a local edge against the same staging services after public OTP rate limiting. Both submitted reviews and both reviewed-state responses survived reload. The booking was an explicit staging fixture that bypassed moderator verification, so no real verified-driver booking-to-completion flow is accepted. Chat, cancellation/Rescue, boarding and completion remain unaccepted.

This does not close the production gaps. Full two-sided booking, chat, notifications, rendezvous, boarding/completion, passive matching, realistic GPS reroute, public-staging Rescue rebooking and WebSocket reconnect paths were not accepted. Route-aware Rescue candidate selection and distinguishing UI copy passed local PostGIS integration and production-bundle browser E2E. The public hostname is ephemeral; S3Mock and public routing/geocoding/map services are not production infrastructure. Do not set STAGING_READY or PRODUCTION_READY to YES. See STAGING_DEPLOYMENT_REPORT.md.


Chat unread/read cycle is implemented in the standalone candidates: Server PR #2 head `6c069dda22030a74928227097f699491e5e89cd3`, Site PR #2 head `bc4b254bbaae09ba8de96352cf7790f756e51312`. Migration 028, Server integration tests, production-bundle E2E and UI badge/read-cursor assertions pass locally. Candidate heads and migration are deployed on temporary staging, but paired staging read/unread acceptance remains pending.

Historical staging snapshot: at that time the temporary HTTPS endpoint was `https://c6d521646ab933.lhr.life` and Site SHA `3b9af2b61b093152d451271e398920e679cf4276` was served by the local edge. Those public browser/health checks and a fixture paired booking were partial evidence only. The current endpoint and immutable candidate pair are recorded at the beginning of this audit and in `STAGING_DEPLOYMENT_REPORT.md`; full paired-user acceptance remains incomplete, so `STAGING_READY=NO`.
