# MARSHGO Production Progress

## Phase 0 — Local audit and baseline

**Status:** Complete for the inspected baseline; the requested root task file was absent in this checkout, so the full technical specification pasted in the user message is the active source of requirements.

**Completed:** Verified initial `main` at `1e7d0ee` with a clean starting tree. Created branch `codex/marshgo-production` and committed the initial API/UI foundation as `34c8899`. Inspected the PWA and found its core state was browser-local demo storage. Fixed the Vite/esbuild dependency mismatch, made page views lazy-loaded, revised the home/results interface toward the supplied mobile references, and added client-side safeguards for demo workflows. Production Vite builds now fail closed with a launch-status screen instead of showing seeded offers and profiles as live data.

**Modified files:** `package.json`, `bun.lock`, `src/App.tsx`, `src/components/AppHeader.tsx`, `src/services/storage.ts`, `src/views/HomeView.tsx`, `src/views/SearchView.tsx`, `vite.config.ts`, `tests/storage.test.ts`, `.env.example`, `docs/PRODUCTION_AUDIT.md`.

**Database changes:** None in this phase.

**API endpoints:** None in this phase.

**Tests:** Bun frozen-lockfile install, typecheck, build, and the four browser-storage unit tests pass.

**Remaining issues:** Frontend workflows still use demo storage. The launch-status screen remains until the authenticated API client is integrated.

**External blockers:** None for this phase.

**Next implementation step:** Build the persistent API foundation for the two-phone booking path.

## Phase 2 — Auth, profiles, roles, and garage

**Status:** Partial; phone enrollment, database sessions, profile updates, role grants, and owner-bound vehicle CRUD/active selection are implemented and tested. Real photo storage and verification review remain incomplete.

**Completed:** Added migration `003_identity_auth.sql` for normalized user roles, account status, session refresh-token families, driver profiles, verification records, vehicle-photo metadata, and deletion requests. Added OTP request/verify endpoints with hashed challenges, five-minute expiry, 60-second resend cooldown, per-phone/IP hourly limits, failed-attempt limit, opaque access tokens, HttpOnly refresh cookie, refresh rotation/reuse revocation, logout, logout-all, profile read/update, role enabling, data export, and deletion request. Added a development-only no-network OTP adapter and a Twilio provider adapter that remains disabled until configured. Corrected auth error payloads, removed the duplicate profile route, preserved omitted profile fields, and made deletion requests non-destructive pending review. Role authorization now uses normalized `user_roles`. Added migration `004_vehicle_garage.sql` and owner-bound vehicle editing, atomic active-vehicle switching, and archive protection for future published trips. New vehicles default to the first active vehicle for that owner. Added AWS SDK S3-compatible signed photo upload/download/delete, 10 MiB and image-type policy, file-signature validation, and primary photo selection; operations return a controlled 503 while bucket configuration is absent.

**Modified files:** `server/index.ts`, `server/sms.ts`, `server/objectStorage.ts`, `server/migrations/003_identity_auth.sql`, `server/migrations/004_vehicle_garage.sql`, `server/migrations/006_vehicle_photo_primary.sql`, `tests/api-bookings.integration.test.ts`, `tests/object-storage.test.ts`, `.env.example`, `package.json`, `bun.lock`, `docs/API.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** `003_identity_auth.sql`, `004_vehicle_garage.sql`, and `006_vehicle_photo_primary.sql` applied successfully to the local PostGIS database.

**API endpoints:** `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/logout-all`, `GET|PATCH /api/v1/users/me`, `POST /api/v1/users/me/roles`, `GET /api/v1/users/me/export`, `POST /api/v1/users/me/deletion-requests`, `GET|POST /api/v1/vehicles`, `PATCH /api/v1/vehicles/:id`, `POST /api/v1/vehicles/:id/activate`, `DELETE /api/v1/vehicles/:id`, and vehicle photo upload/list/primary/delete endpoints.

**Tests:** Node 24.21.0: `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` passed. Local integration command `API_TEST_URL=http://127.0.0.1:3002 API_TEST_DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo npx --yes --package=node@24.21.0 -- node node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` passed all 11 tests, including OTP registration, profile persistence, refresh rotation, self-enabling driver role, vehicle creation, fail-closed missing S3, ownership/edit/active selection, last-seat contention, cancellation, negotiation, chat, OSRM contract, and signed upload-policy contract. The run caught and fixed malformed SQL in role grant before the 11/11 pass.

**Remaining issues:** Vehicle API supports listing and creation only. No vehicle edit/delete, object storage upload, photo processing, verification submission/reviewer workflow, or frontend auth/profile integration. The real SMS provider is not configured. One combined check run initially raced `tsc` against `vite build` clearing `dist`; sequential typecheck passes. No production deployment.

**External blockers:** Twilio account credentials and approved sender identity for real SMS; private S3-compatible bucket, credentials/role, and browser CORS configuration; trusted staff account provisioning and verification policy. Signed policy and media-validation adapter are unit-tested using local fake credentials; no real bucket was contacted.

**Next implementation step:** Finish vehicle ownership-bound CRUD and photo-storage provider contract, then connect the frontend session/profile/vehicle flows.

## Phase 5 — Production UI integration (first marketplace vertical slice)

**Status:** Partial; production bundle uses real OTP/session, offer search, booking, and booking history APIs. The existing full demo UI remains development-only.

**Completed:** Added a typed browser API client with HttpOnly refresh-cookie credentials and one retry after access-token expiry. Added mobile-first production sign-in, verified phone flow, server-backed exact-city/date/seat search, booking with a fresh Idempotency-Key, and persisted booking list. `App` now chooses the API-backed marketplace for production builds and keeps the local demo UI out of production execution. Added Vite local API proxy routes. Search API now filters by Europe/Kyiv calendar date and requested seats.

**Modified files:** `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `src/App.tsx`, `server/index.ts`, `vite.config.ts`, `tsconfig.json`, `package.json`, `tests/api-bookings.integration.test.ts`, `docs/API.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** None in this slice.

**API endpoints:** Uses `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/refresh`, `POST /auth/logout`, `GET /offers?origin=&destination=&date=&seats=`, `GET /bookings`, and `POST /bookings`.

**Tests:** `npm run typecheck`, scoped `npm run lint`, `npm run build`, and local PostGIS integration suite passed. The API integration suite includes date/seat search filters and booking transaction tests. No browser automation or physical-device run was performed.

**Remaining issues:** Production PWA still lacks authenticated driver offer creation/vehicle management, reverse-demand UI, trip lifecycle, chat, GPS navigation, and passive matching. Existing demo UI remains only in the development build. Search is exact city-name matching. The 15-minute access token renewal path is implemented but not tested through a browser session.

**External blockers:** Production SMS credentials/sender, staging API host and HTTPS same-site deployment, S3 photo storage credentials, routing provider service.

**Next implementation step:** Add a real driver publishing/garage flow to the production UI, then integrate demand negotiation and booking chat against existing APIs.

## Phase 6 — Routing foundation

**Status:** Partial; OSRM-compatible road-route adapter and server persistence contract are implemented. A real routing service is not configured.

**Completed:** Added `server/routing.ts` with bounded-timeout OSRM-compatible route fetch, geometry/range validation, and explicit provider failures. Added `POST /api/v1/routing/route`. Added migration `005_offer_routes.sql` for arrival time, road distance, duration, and source. Production offer creation now requires a successful configured road route and stores geometry/ETA; it returns 503 when routing is unavailable. Development-only unrouted fixtures are labeled `development_unrouted`. Production search presents the server route-derived ETA only when available.

**Modified files:** `server/routing.ts`, `server/index.ts`, `server/migrations/005_offer_routes.sql`, `.env.example`, `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `tests/routing.test.ts`, `tests/api-bookings.integration.test.ts`, `docs/API.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** `005_offer_routes.sql` applied to the local PostGIS database.

**API endpoints:** `POST /api/v1/routing/route`, updated `POST /api/v1/offers`, and `GET /api/v1/offers` now returns saved route metadata.

**Tests:** Node 24.21.0 LTS: typecheck, scoped lint, production build, unit suite, and opt-in local PostGIS integration suite passed. The combined routing+API suite passed 10/10 tests, including a local HTTP OSRM contract fixture and the honest 503 behavior when no routing provider is configured. No public routing provider was called.

**Remaining issues:** `ROUTING_ENGINE_URL` is unset; production offer creation is correctly blocked until an owned routing service/provider is configured. No geocoder/address suggestion, multi-stop routing, rerouting, or real GPS stream exists. Tests validate the provider contract, not a live road network.

**External blockers:** Provisioned OSRM/Valhalla hosting or contracted routing API and service limits.

**Next implementation step:** Implement route/date/seat aware offer creation and search in the production driver UI, then connect reverse demands to route corridors and mutual matching.

## Phase 1 — Backend, PostgreSQL/PostGIS foundation

**Status:** Partial; local API/database infrastructure and persistent domain slices exist. OpenAPI, production orchestration, and shared Redis-backed services remain missing.

**Completed:** Added Docker Compose for local PostgreSQL/PostGIS and Redis with named persistent volumes; applied initial schema migration locally. Added Express API health/readiness, database-backed offer lookup, profile/vehicle reads, driver-only vehicle creation, verified-vehicle-only offer publication, server session-hash checking, explicit development-only identity bypass, request-size cap, allowlisted CORS, security headers, per-process API rate limit, and centralized errors. Added transactionally locked bookings with server-priced totals, idempotency keys, conversation creation, audit event, ownership-checked cancellation, and once-only seat restoration. Production UI now blocks demo inventory. Added ESLint for touched/backend files and a GitHub Actions workflow for lint, typecheck, tests, and build.

**Modified files:** `package.json`, `bun.lock`, `.env.example`, `docker-compose.yml`, `.github/workflows/ci.yml`, `eslint.config.js`, `server/index.ts`, `server/migrate.ts`, `server/migrations/001_initial.sql`, `server/migrations/002_reverse_marketplace.sql`, `src/App.tsx`, `src/components/AppHeader.tsx`, `src/services/storage.ts`, `src/views/SearchView.tsx`, `tests/api-bookings.integration.test.ts`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DEPLOYMENT.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/PRODUCTION_AUDIT.md`.

**Database changes:** Added `001_initial.sql`: users, vehicles, offers with PostGIS points and route geometry, bookings, passenger demands, proposals, conversations/members, messages, OTP challenges, sessions, audit events, indexes and constraints. Added `002_reverse_marketplace.sql` with proposal vehicle/time/revision columns, revision history and one-accepted-proposal-per-demand guard. Both migrations were applied to the local Docker database.

**API endpoints:** `GET /healthz`, `GET /readyz`, `GET /api/v1/offers`, `GET /api/v1/users/me`, `GET|POST /api/v1/vehicles`, `POST /api/v1/offers`, `POST|GET /api/v1/demands`, `POST /api/v1/demands/:id/proposals`, `POST /api/v1/proposals/:id/counter`, `POST /api/v1/proposals/:id/accept`, `GET /api/v1/proposals/:id/revisions`, `GET /api/v1/bookings`, `POST /api/v1/bookings`, `POST /api/v1/bookings/:id/cancel`, `GET /api/v1/bookings/:id/conversation`, `GET|POST /api/v1/conversations/:id/messages`.

**Tests:** Lint/typecheck/build pass. Automated local PostGIS API integration tests verify OTP/session, anonymous denial, two simultaneous users competing for the last seat (one 201, one 409), same-key replay, repeated cancellation and seat restoration, vehicle ownership/role/verification, date/seat search, demand negotiation/revision history, accepted-proposal booking conversion, participant message send/history, and third-party privacy denial. All 8 tests pass. `docker compose config` and migrations pass. No API-driven two-device UI test yet. Repository-wide lint found legacy UI warnings/errors; current lint scope is new/backend and touched files only.

**Remaining issues:** Most legacy PWA screens are not API-wired. Vehicle verification review, demand cancellation, realtime message delivery, geographic corridor search, shared Redis rate limiting, generated OpenAPI, production orchestration, backup/restore, and production-grade observability are not implemented. Booking lifecycle exists as an API but is not integrated into the production UI. Redis is currently provisioned but unused. Current offer search uses exact city names.

**External blockers:** SMS provider/account and sender identity; staging/production host and database; secrets manager; routing/geocoding source decision. No public deploy or production database action performed.

**Next implementation step:** Complete user/session enrollment after the SMS provider is selected, then connect the frontend account/profile and vehicle screens to these endpoints.

## Booking transaction backend (spec Phase 3)

**Status:** Backend transaction slice implemented; cross-device application flow remains blocked on authentication and frontend integration.

**Completed:** Database-backed offer lookup, offer publishing for an owned verified vehicle, seat-locked booking, replay-safe idempotency, fixed server pricing, cancellation and single seat restoration. Tested with two independent local user identities racing for the last seat.

**Remaining issues:** Search is exact city text only; frontend still uses browser-local offers and booking state; lifecycle actions and QR presentation are not integrated in the production UI. This is not the user acceptance test on two physical phones.

**Next implementation step:** Create secure user enrollment/session issuance, wire the PWA to session-protected offer/booking endpoints, and run the cross-device scenario in staging.

## Reverse marketplace backend (spec Phase 4)

**Status:** Backend API flow implemented and locally transaction-tested; frontend and messaging integration remain incomplete.

**Completed:** Passenger demand submission, driver proposal using a verified vehicle, alternating counter-offers with server-stored revision history, expiry checks, passenger-only acceptance, atomic booking creation, seat consumption, competing proposal rejection, and conversation participant creation.

**Remaining issues:** PWA screens still use local data. Persisted message routes exist, but there is no realtime transport or live notification. No geographic relevance ranking, driver matching, or route deviation calculation.

**Next implementation step:** Wire demand and driver negotiation views to API and test the flow through the authenticated PWA.

## Chat persistence backend (spec Phase 7)

**Status:** Persistent chat API slice implemented; realtime and push remain incomplete.

**Completed:** Conversations are created with booking acceptance. Booking participants can resolve their conversation, send bounded messages, and read persisted history. Both routes verify membership; a third-party access test returns 404.

**Remaining issues:** The PWA chat still uses local demo state. No WebSocket, push provider, unread counts, notification subscriptions, or rescue alternatives.

**Next implementation step:** Connect the PWA Messages view to these endpoints, then add realtime delivery using shared Redis-backed coordination.

## Phase 3 continuation — booking lifecycle and reviews

**Status:** Partial; transactional API lifecycle is implemented and locally integration-tested. The passenger/driver UI and physical-device acceptance run remain outstanding.

**Completed:** Added booking transition history and participant completion confirmations. The driver can validate a short-lived, PII-free HMAC ticket at boarding, start a boarded trip, and each participant can confirm completion; the booking becomes completed only after both confirmations. Participants can each submit one rating (1–5) after completion. Offer search now derives driver rating and review count from persisted reviews. Added validation for invalid ticket, wrong actor, early review, duplicate review, lifecycle ordering, and rating aggregate.

**Modified files:** `server/index.ts`, `server/migrations/007_booking_lifecycle_reviews.sql`, `tests/api-bookings.integration.test.ts`, `docs/API.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** `007_booking_lifecycle_reviews.sql` adds booking lifecycle statuses, immutable transition records, one completion confirmation per participant, and one review per booking participant. Applied to the local PostGIS database.

**API endpoints:** `GET /api/v1/bookings/:id/events`, `GET /api/v1/bookings/:id/ticket`, `POST /api/v1/bookings/:id/boarding`, `POST /api/v1/bookings/:id/start`, `POST /api/v1/bookings/:id/complete`, and `POST /api/v1/bookings/:id/reviews`; offer search returns DB-derived rating aggregates.

**Tests:** Local PostGIS integration suite `API_TEST_URL=... API_TEST_DATABASE_URL=... npx --yes --package=node@24.21.0 -- node node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` passed 11/11, including ticket signature rejection, unauthorized boarding/start, two-party completion, one-time reviews, and event history. `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed under Node 24.21.0. No real QR scanner, browser flow, or physical-device test was run.

**Remaining issues:** The API issues a signed ticket token but no UI renders/scans it. Driver/passenger trip-state controls and reviews are not wired into production UI. The route transition schema does not yet include a no-show policy or operational notifications. This slice does not establish production readiness.

**External blockers:** None for this local API slice. Deployment, real SMS, routing provider, photo bucket, and staging credentials remain external blockers for the full release.

**Next implementation step:** Replace the production UI’s browser-only state with authenticated server flows for driver garage/offer publishing and passenger demand negotiation, then surface booking lifecycle and persisted chat.

## Native iOS target and simulator smoke check

**Status:** Partial; a Capacitor iOS app builds, installs, launches, and displays the production login screen in the iPhone 18 Pro / iOS 27 CoreSimulator. Interactive sign-in/booking is not verified.

**Completed:** Added Capacitor 8.5.2 core/CLI/iOS dependencies and an Xcode project for bundle ID `ua.marshgo.app`, native MARSHGO app icon, portrait orientation, and iOS 15 minimum target. Capacitor build uses relative bundled assets and points at a local API for simulator builds only. Added a safe startup/loading fallback and an iOS simulator build/install/launch/screenshot script. CORS preflight accepts `capacitor://localhost` with credentials.

**Modified files:** `package.json`, `bun.lock`, `capacitor.config.ts`, `vite.config.ts`, `index.html`, `src/main.tsx`, `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/App/Info.plist`, `ios/App/App/Assets.xcassets/AppIcon.appiconset/*`, `scripts/build-ios-simulator.sh`, `docs/IOS.md`, `README.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/PRODUCTION_PROGRESS.md`.

**Tests:** Frozen Bun lockfile install, `npm run typecheck`, and `npm run lint` passed. Local PostGIS integration/unit suite passed 11/11 after starting the isolated API with development-only test identity bypass. `npm run ios:simulator` completed the Vite production build, Xcode simulator build, install, and launch on iPhone 18 Pro (iOS 27); the screenshot showed the production phone sign-in screen. From inside the booted simulator, `curl http://localhost:3002/healthz` returned 200; an OPTIONS preflight for `Origin: capacitor://localhost` returned 204 with credentialed CORS headers. The regular production PWA build and `git diff --check` passed. No real SMS was sent.

**Remaining issues:** The graphical `Simulator.app` is absent in this environment, so we could not tap/enter text or run a UI automation flow. The native client uses the current browser auth transport; refresh-cookie persistence needs physical-device validation. Driver flows, verified garage, demand negotiation, chat, navigation, passive matching, push, and payments are not wired in the production UI. iOS signing, archive, privacy declarations, and App Store submission are not done.

**External blockers:** Graphical simulator/interactive device test runner for tap-level UI acceptance, physical iPhone for device permissions/session checks, production HTTPS API origin, real SMS credentials, routing service, and private photo bucket.

**Next implementation step:** Automate the iOS OTP→server-search→booking journey on a full simulator UI runner, then continue production UI integration for driver vehicle/offer publishing and reverse demand.
