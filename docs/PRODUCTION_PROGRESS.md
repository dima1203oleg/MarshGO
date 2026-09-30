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

**Status:** Partial; a Capacitor iOS app builds, installs, launches, and displays the production welcome screen in the iPhone 18 Pro / iOS 27 CoreSimulator. Interactive sign-in/booking is not verified.

**Completed:** Added Capacitor 8.5.2 core/CLI/iOS dependencies and an Xcode project for bundle ID `ua.marshgo.app`, native MARSHGO app icon, portrait orientation, and iOS 15 minimum target. Capacitor build uses relative bundled assets and points at a local API for simulator builds only. Added a safe startup/loading fallback and an iOS simulator build/install/launch/screenshot script. CORS preflight accepts `capacitor://localhost` with credentials.

**Modified files:** `package.json`, `bun.lock`, `capacitor.config.ts`, `vite.config.ts`, `index.html`, `src/main.tsx`, `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/App/Info.plist`, `ios/App/App/Assets.xcassets/AppIcon.appiconset/*`, `scripts/build-ios-simulator.sh`, `docs/IOS.md`, `README.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/PRODUCTION_PROGRESS.md`.

**Tests:** Frozen Bun lockfile install, `npm run typecheck`, and `npm run lint` passed. Local PostGIS integration/unit suite passed 11/11 after starting the isolated API with development-only test identity bypass. `npm run ios:simulator` completed the Vite production build, Xcode simulator build, install, and launch on iPhone 18 Pro (iOS 27); the screenshot showed the production welcome screen. From inside the booted simulator, `curl http://localhost:3002/healthz` returned 200; an OPTIONS preflight for `Origin: capacitor://localhost` returned 204 with credentialed CORS headers. The regular production PWA build and `git diff --check` passed. No real SMS was sent.

**Remaining issues:** The graphical `Simulator.app` is absent in this environment, so we could not tap/enter text or run a UI automation flow. The native client uses the current browser auth transport; refresh-cookie persistence needs physical-device validation. Driver offer publishing, verified vehicle photos, demand negotiation, navigation, passive matching, push, booking lifecycle controls, and payments are not wired in the production UI. Booking chat and basic vehicle CRUD have since been connected in the reference-design slice below. iOS signing, archive, privacy declarations, and App Store submission are not done.

**External blockers:** Graphical simulator/interactive device test runner for tap-level UI acceptance, physical iPhone for device permissions/session checks, production HTTPS API origin, real SMS credentials, routing service, and private photo bucket.

**Next implementation step:** Automate the iOS OTP→server-search→booking journey on a full simulator UI runner, then continue production UI integration for driver vehicle/offer publishing and reverse demand.

## iOS reference design pass — mobile marketplace shell

**Phase:** 5 continuation / iOS presentation and partial API integration.

**Status:** PARTIAL. The sign-in screen and authenticated shell were redesigned toward the supplied iPhone references. This is not a complete implementation of the reference screens or a production release.

**Completed:** Added mobile-first home and exact-route results screens, Community offer details with server booking, booking history, booking-participant chat using persisted REST messages, profile/vehicle list, driver-role enablement, vehicle creation and active-vehicle selection. Added a five-item bottom navigation plus create action. Booking DTO now indicates whether the caller is the driver, so passenger/driver labels and chat counterpart resolve from server identity rather than display-name guesses. Nonconnected bus/taxi categories and unfinished demand/navigation/offer-publishing flows are explicitly shown as unavailable.

**Modified files:** `src/views/ProductionMarketplace.tsx`, `src/services/productionApi.ts`, `server/index.ts`, `docs/IOS.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** None.

**API endpoints used:** Existing `/api/v1/auth/otp/*`, `/users/me`, `/users/me/roles`, `/vehicles`, `/offers`, `/bookings`, `/bookings/:id/conversation`, and `/conversations/:id/messages`. `GET /bookings` now includes `current_user_is_driver` for participant-specific UI.

**Tests:** `npm run typecheck`, `npm run lint`, `npm test` (11/11 with local PostGIS/API and development-only identity bypass; bypass disabled immediately after test), `npm run build`, and `git diff --check` passed. `npm run ios:simulator` built, installed, and launched `ua.marshgo.app` on iPhone 18 Pro / iOS 27; screenshot: `/tmp/marshgo-ios-design-simulator.png`. Simulator exercised app startup and welcome-screen rendering only; no interactive OTP/booking test was possible because this host lacks graphical `Simulator.app`/tap automation.

**DEMO/TRUTH status:** offer search, booking, bookings list, account, vehicle records, and booking chat use the API. Search is exact city-name matching. No seeded data or fake route/results were added. Test OTP is development-only. Bus/taxi, passenger demand, offer publishing, photo upload in this screen, GPS navigation, passive matching, WebSocket/push, and notifications are not live in this UI.

**Open issues:** No geocoder/place picker; no demand form, driver offer publisher, vehicle photos, booking lifecycle actions, proposal negotiation, or navigation screens connected to production API. No physical-device session test or tap-level simulator flow. UI is a visual direction match, not pixel-identical to the supplied composite image.

**External dependencies:** SMS provider credentials and sender; production HTTPS API; geocoder/routing deployment; private photo storage; interactive simulator runner or physical iPhone.

**Next implementation step:** Add place suggestion/geocoding and route selection, then build driver offer creation and passenger demand negotiation screens on the existing server contracts; add tap-driven simulator E2E on an interactive runner.

## Phase 4 / 5 — Demand negotiation UI and geocoded place input

**Phase:** 4 Reverse Market; 5 Production UI replacement continuation.

**Status:** PARTIAL. Passenger demand and negotiation are now represented in the production UI and persist through the API. Actual address suggestions need a configured provider, and verified driver vehicles need a real review flow before drivers can propose.

**Completed:** Added a Nominatim-compatible geocoder adapter and authenticated `/places/suggest` API with query validation, Ukraine restriction, HTTPS enforcement in production, five-second timeout, independent rate limit, and fail-closed behavior. Passenger form requires selecting actual provider results before publishing coordinates; it persists departure interval, passenger count, total/per-seat budget, requirements and notes. Added passenger demand list/proposal inbox/cancel, driver open-request list, driver proposal form, persisted counter revisions/history, explicit driver agreement after passenger counter, and separate passenger confirmation that creates the booking. Demand list is deliberately labeled as unranked; no route matching is claimed. Added migration `008_demand_details.sql`.

**Modified files:** `server/geocoding.ts`, `server/index.ts`, `server/migrations/008_demand_details.sql`, `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `tests/geocoding.test.ts`, `tests/api-bookings.integration.test.ts`, `.env.example`, `docs/API.md`, `docs/DATA_MODEL.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** `008_demand_details.sql` adds constrained `budget_type`, `notes`, and object-valued JSONB `requirements` columns to `passenger_demands`; migration was applied to the local PostGIS database.

**Endpoints:** `GET /api/v1/places/suggest`; extended `POST /api/v1/demands`; added `GET /api/v1/demands/mine`, `POST /api/v1/demands/:id/cancel`, `GET /api/v1/demands/:id/proposals`, and `POST /api/v1/proposals/:id/agree`; proposal acceptance now rejects a passenger's unconfirmed counter-offer.

**Tests:** `npm run typecheck`, `npm run lint`, and `npm run build` passed. Unit suite passed 10/10. Local API/PostGIS integration suite passed 14/14 with development OTP and test identity bypass enabled only for that run; it covers budget/requirements persistence, driver request visibility, cancellation replay, proposal revision history, driver agreement, premature passenger confirmation rejection, and final booking creation. Place adapter tests cover coordinate validation, UA-scoped query contract, and unconfigured fail-closed response. Migration 008 applied. `npm run ios:simulator` rebuilt, installed, and launched the updated production bundle on iPhone 18 Pro / iOS 27; simulator health check returned `{"status":"ok"}`. Screenshot is `/tmp/marshgo-demand-ui-ios.png`. Interactive controls remain untested because only headless `simctl` is available.

**DEMO/TRUTH status:** Request, proposal, negotiation, cancellation, and booking state are server-backed. Place entry refuses to publish without a provider-selected coordinate. Geocoder has no production endpoint configured; UI therefore cannot complete address selection in current workspace. Driver proposals require a verified vehicle; user-facing verification review is not implemented. Open driver requests are not route-filtered. No GPS matching, WebSocket, or partner service is represented as live.

**Open issues:** No configured geocoder, no vehicle approval/admin UI, no route-aware demand sorting, incomplete privacy refinement for exact demand locations after agreement, and no interactive UI test. App-level request/accept UI awaits a working verified vehicle in a development environment or manual moderation path.

**External blockers:** Owner-selected contracted/self-hosted Nominatim-compatible endpoint; routing provider for road-distance matching; operational driver verification reviewer and policy; tap-driven simulator runner/physical device.

**Next implementation step:** Add a protected vehicle verification decision workflow for authorized admins and connect real route-based driver-demand eligibility; then implement driver offer publishing UI against the existing route/offer contracts.

## iOS reference alignment — welcome and navigation

**Phase:** 5 continuation / native iOS visual integration.

**Status:** PARTIAL. The native iPhone welcome surface now follows the supplied scenic welcome direction; internal screens retain the same light card-and-blue-action system. This is a visual pass, not pixel-by-pixel completion of every supplied screen.

**Completed:** Added a locally bundled, compressed Carpathian road hero image; centered MARSHGO map-pin branding; title and authentication actions; native edge-to-edge status bar with light icons on authentication screens and dark icons after sign-in; and a five-control bottom bar (Home, Search, Create, Trips, Profile). Chat remains reachable from the booking action so the primary navigation matches the reference.

**Modified files:** `public/images/welcome-road.jpg`, `src/views/ProductionMarketplace.tsx`, `src/index.css`, `capacitor.config.ts`, `package.json`, `bun.lock`, `ios/App/CapApp-SPM/Package.swift`, `docs/IOS.md`, `docs/PRODUCTION_PROGRESS.md`.

**Tests:** `npx tsc --noEmit`, `npx eslint src/views/ProductionMarketplace.tsx capacitor.config.ts`, `npm run build`, `npx cap sync ios`, and `npm run ios:simulator` passed. iPhone 18 Pro / iOS 27 screenshot `/tmp/marshgo-ios-welcome-final.png` confirms photo bleed under the status bar, white status glyphs and working welcome actions rendered without overflow. This headless host still cannot tap through authentication or verify signed-in screens.

**Remaining issues:** SMS delivery is not configured; internal screen interactions still require a tap-capable simulator or physical iPhone. The larger 10-screen reference collection has not all been individually matched or verified.

**External blockers:** Tap-driven simulator/physical device and real SMS provider credentials for end-to-end sign-in.

**Next implementation step:** Run the complete authenticated iOS flow in an interactive simulator, then align and verify the signed-in home/search/detail/trips/profile views against the supplied device references.

## Phase 2 continuation — protected driver verification

**Phase:** 2 Auth/Garage; production UI and security continuation.

**Status:** PARTIAL. Driver documents can be uploaded and reviewed through protected APIs/UI when private object storage is configured. No real documents or external storage were used in local verification.

**Completed:** Added an 8 MiB JPEG/PNG/PDF evidence policy with signed upload URLs, object metadata/signature validation, owner-only submissions, duplicate-pending prevention, private owner status history, and a staff-only review queue. Admin/moderator roles are required on all queue/evidence/decision endpoints. Staff views omit phone numbers and object keys; evidence URLs are short-lived, self-review is blocked, and document access/decisions are audit logged. A vehicle stays pending until both latest registration and licence decisions are approved; rejecting either closes its paired request so the driver can resubmit. The production profile offers document submission; a staff-gated review page presents evidence and requires a reason to reject.

**Modified files:** `server/objectStorage.ts`, `server/index.ts`, `server/migrations/009_verification_review.sql`, `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `tests/object-storage.test.ts`, `tests/api-bookings.integration.test.ts`, `docs/API.md`, `docs/SECURITY.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** `009_verification_review.sql` adds the evidence-access audit timestamp, a review-queue index, and a partial unique guard against duplicate pending records per user/type/vehicle. Migration applied to local PostGIS.

**Endpoints:** `GET /api/v1/users/me/verification`; `POST /api/v1/vehicles/:id/verification/evidence/upload-url`; `POST /api/v1/vehicles/:id/verification`; `GET /api/v1/admin/verification`; `GET /api/v1/admin/verification/:id/evidence`; `POST /api/v1/admin/verification/:id/decision`.

**Tests:** Local API/PostGIS integration and unit suite passed 16/16 with development OTP and identity bypass enabled only on the loopback test API. Verification tests cover anonymous/staff denial, no evidence/phone leakage, storage-not-configured response, required evidence-open access, both approvals before publication, one-time decisions, paired rejection, and driver identity level. Object-storage tests check allowlisted types and 8 MiB policy. `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed. `npm run ios:simulator` built with Xcode, installed and launched `ua.marshgo.app` on iPhone 18 Pro / iOS 27; screenshot `/tmp/marshgo-ios-current.png` confirms the reference-aligned scenic welcome screen renders in the native shell. This headless environment provides only `simctl`, so tap-driven auth/booking and the signed-in reference screens remain unverified.

**DEMO/TRUTH status:** No verification uses fake documents or auto-approval. The local form returns 503 for uploads until S3-compatible storage is configured. API code does not expose evidence to offers/search; the staff screen is role-gated and API RBAC is authoritative.

**Remaining issues:** Private S3 bucket, server-side encryption/access logs, app-origin bucket CORS, malware scanning and retention/delete processing are unconfigured. First `admin`/`moderator` role must be granted by an authorized owner/DBA; the UI cannot bootstrap staff. Commercial/legal verification rules still need review. No native tap-driven end-user review was exercised. iOS simulator showed the welcome screen; unauthenticated API refresh correctly received 401, and no credentials were entered, so the driver review flow was not exercised on-device.

**External blockers:** Owner/DBA staff role provisioning; private object storage setup and policy; document retention and malware-scanning decision; authorized moderators.

**Next implementation step:** Review the new vehicle document flow on iOS when the interactive simulator is available; implement real vehicle photo UI; then build driver offer publishing against the existing routing and offer API, keeping production publication blocked without a verified vehicle and configured route engine.

## Phase 3 / 5 — Driver offer publishing from iOS

**Phase:** 3 Offers/Booking; 5 Production UI replacement continuation.

**Status:** PARTIAL. A driver can now create a server-backed Community offer in the iOS/PWA production UI and view their own published offers. Live publication in this workspace remains blocked by the missing geocoder and routing provider configuration.

**Completed:** Added an iOS-friendly offer form with provider-selected origin/destination coordinates, future departure, price per seat, vehicle seat limit, and a verified owner vehicle requirement. Added authenticated `GET /api/v1/offers/mine`, which returns only the caller's offers and status. The trips screen now separates driver-owned offers from bookings. The create action offers passenger demand, driver trip publishing, and driver demand browsing. API errors remain visible and no route/ETA is invented.

**Modified files:** `server/index.ts`, `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `tests/api-bookings.integration.test.ts`, `docs/API.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** None.

**Endpoints:** Added `GET /api/v1/offers/mine`; UI uses existing `GET /api/v1/places/suggest` and `POST /api/v1/offers`.

**Tests:** `npm test` passed 16/16 with the local loopback API/PostGIS test configuration. The offer integration case verifies publication only with a verified owner vehicle and now verifies own-offer visibility plus denial to a passenger role. `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed. `npm run ios:simulator` rebuilt, installed and launched the app on iPhone 18 Pro / iOS 27; screenshot `/tmp/marshgo-ios-offer-ui.png` shows the reference-aligned welcome screen inside the native shell. Tap-driven offer submission could not be exercised because the host only exposes headless `simctl`.

**DEMO/TRUTH status:** Offer creation and own-offer history use the production API; place coordinates require actual geocoder results; route geometry, distance, arrival and duration come from the configured OSRM-compatible service in production. No external bus/taxi inventory is shown as live.

**Remaining issues:** Geocoder and routing URLs are unset in this workspace. Photo UI and server-side publication gating are implemented in the continuation below, but no real upload can be performed until the private bucket is configured. No owner-side offer cancellation/edit screen, route stops, or tap-driven two-account iOS test is included.

**External blockers:** Contracted/self-hosted geocoding and routing services; private S3-compatible vehicle-photo bucket; interactive iOS simulator/physical devices and real SMS credentials for end-to-end acceptance.

**Next implementation step:** Add vehicle photo upload/primary photo UI and enforce the real-photo publication policy server-side; then run authenticated two-device offer/search/booking acceptance against staging.

## Phase 2 / 3 / 5 — Private vehicle photo flow and publication gate

**Phase:** 2 Auth/Garage; 3 Offers; 5 Production UI replacement.

**Status:** PARTIAL. The signed S3-compatible vehicle-photo endpoints are now connected to the production profile UI, and the backend requires a verified vehicle with at least one validated photo before publishing.

**Completed:** Added upload-to-private-bucket flow for JPEG/PNG/WebP (10 MiB max), owner-only photo gallery with short-lived read URLs, primary-photo selection and deletion. The offer form only allows a verified vehicle with a recorded real photo; the server independently enforces this invariant. Search and own-offer results include a short-lived primary-photo URL when available, without exposing storage keys; result cards render the real photo. The API integration test verifies publication is denied without a photo and succeeds only after a photo record exists, and checks that raw object keys are absent from search results.

**Modified files:** `server/index.ts`, `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `tests/api-bookings.integration.test.ts`, `docs/API.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** None.

**Endpoints:** Existing `/vehicles/:id/photos*` upload/list/primary/delete endpoints are now used by the iOS/PWA profile; `POST /offers` enforces photo presence.

**Tests:** `npm test` passed 16/16 including photo-required offer creation; `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed after the signed-photo response change. `npm run ios:simulator` then rebuilt, installed and launched the app on iPhone 18 Pro / iOS 27; screenshot `/tmp/marshgo-ios-search-photos.png` confirms native launch and welcome rendering. Tap-driven profile upload was not run because only headless `simctl` is available. Test photo metadata is an isolated DB fixture because no S3 bucket is configured and no real image was uploaded.

**DEMO/TRUTH status:** No placeholder vehicle images are used. Uploads fail with an explicit storage-not-configured error until S3 settings and bucket CORS are supplied. Server publication checks the vehicle has a photo whose object passed the existing server-side content-signature verification before metadata was stored.

**Remaining issues:** S3 bucket, credentials/workload identity, encryption, access logs, CORS, malware controls and retention are still external operational requirements. Public search can display a verified primary photo only when its bucket is configured; no real image has been uploaded in this environment.

**External blockers:** Private S3-compatible photo/document storage and production geocoder/routing provider.

**Next implementation step:** Run integration/build/iOS simulator checks for this slice; then continue the core acceptance path and remaining route-aware search/navigation work.

## Phase 3 / 5 — PostGIS route endpoint search

**Phase:** 3 Offers/Search; 5 Production UI replacement.

**Status:** PARTIAL. Production UI search now requires actual provider-selected origin and destination points; the API supports geospatial endpoint proximity. Full route overlap/segment feasibility is still outstanding.

**Completed:** Added PostGIS search by origin and destination `ST_DWithin` within 20 km, with date and seat filters. The mobile home/search inputs now call the place provider and send selected WGS84 coordinates; typing alone is not treated as a canonical place. All four coordinate query parameters are required together and validated. The API keeps exact-name matching only for compatibility with legacy clients. Integration tests verify a near coordinate match succeeds despite different city labels, a remote origin is excluded, and partial coordinate input returns 400.

**Modified files:** `server/index.ts`, `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `tests/api-bookings.integration.test.ts`, `docs/API.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** None; query uses the existing GiST-indexed PostGIS offer points.

**Endpoints:** Extended `GET /api/v1/offers` with `originLon`, `originLat`, `destinationLon`, and `destinationLat`.

**Tests:** `npm test` passed 16/16 with local PostGIS/API; geo tests cover successful proximity, remote exclusion and incomplete coordinate validation. `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed. `npm run ios:simulator` rebuilt, installed, and launched the app on iPhone 18 Pro / iOS 27; screenshot `/tmp/marshgo-ios-geosearch.png` confirms the reference-aligned welcome screen in the native shell. Search interaction itself is not tap-tested on this headless host.

**DEMO/TRUTH status:** Current production search uses coordinates selected from the configured geocoder and live DB inventory. No straight-line route, fabricated ETA or demo provider data is returned. Exact-name compatibility remains available to non-UI callers.

**Remaining issues:** Endpoint radius is only a coarse match. Route polyline overlap, intermediate pickup/dropoff feasibility, time window, full total-cost sorting, pagination/cursors and real geocoder configuration remain outstanding. A user cannot complete point selection until a geocoder is configured.

**External blockers:** Contracted/self-hosted HTTPS geocoder and routing provider for production use.

**Next implementation step:** Add route-corridor candidate evaluation using stored road geometry and measured detours; connect real provider configuration before claiming production search availability.

## Phase 3 / 5 — Passenger booking cancellation in iOS

**Phase:** 3 Offers/Booking; 5 Production UI replacement.

**Status:** PARTIAL. A passenger can cancel a confirmed booking from the iOS trips screen through the existing server state transition.

**Completed:** Added an explicit cancellation confirmation and status feedback. The UI refreshes canonical server bookings after cancellation; it does not locally invent an inventory update. The endpoint only permits the booking passenger and returns seats once transactionally; drivers do not receive a passenger cancellation action.

**Modified files:** `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** None.

**Endpoints:** Existing `POST /api/v1/bookings/:id/cancel`.

**Tests:** `npm test` passed 16/16 including idempotent cancellation and exactly-once seat restoration; typecheck, lint and production build passed. `npm run ios:simulator` rebuilt, installed and launched on iPhone 18 Pro / iOS 27; screenshot `/tmp/marshgo-ios-booking-cancel.png` confirms successful native launch. The cancellation action itself is not tap-tested because this host only provides headless `simctl`.

**DEMO/TRUTH status:** Cancellation and booking state remain server-authoritative.

**Remaining issues:** Cancellation UI is not tap-tested on-device; refund behavior is intentionally not represented because no payment service exists. Driver boarding/start and two-party trip completion are API-backed but are not yet integrated into the iOS UI.

**External blockers:** Tap-capable simulator/physical iPhone for interaction checks; payment provider contract for any future refunds.

**Next implementation step:** Rebuild and launch in the iOS simulator, then implement driver trip lifecycle controls with clear participant-specific actions.

## Phase 6 — Opt-in route matching and mutual interest

**Phase:** 6 Navigation/Matching; part of Phase 5 Production UI replacement.

**Status:** PARTIAL. An opt-in passenger-candidate flow now evaluates actual passenger demand against the remaining foreground navigation route, checks candidate detours with ordered road-routing waypoints, and requires both driver's stationary interest and passenger confirmation. It intentionally does not create a price proposal or booking.

**Completed:** Added migration `012_navigation_matching.sql` with a verified-vehicle snapshot on each navigation session and durable, expiring `navigation_match_candidates`. Opt-in defaults off and requires an active verified vehicle. Matching queries actual open demands, filters direction, remaining route corridor, departure window, and seat capacity, then calls the configured OSRM-compatible routing provider for baseline, pickup ETA, and pickup/dropoff route distances/durations. Missing routing fails closed. Candidates are scoped to their driver and passenger; driver identity stays hidden until passenger confirmation. Driver interest requires the session be explicitly paused and the latest GPS fix be fresh. Passenger confirmation is idempotent and leaves both demand and booking inventory unchanged. The iOS UI can enable/disable matching, pause before driver response, restore candidate state, list and confirm driver interest, and resume navigation. After mutual confirmation, the paused driver can open the existing demand screen and send an explicit price proposal; it never silently creates a booking.

**Modified files:** `server/index.ts`, `server/routing.ts`, `server/migrations/012_navigation_matching.sql`, `src/services/productionApi.ts`, `src/views/ProductionNavigation.tsx`, `src/views/ProductionMarketplace.tsx`, `tests/fixtures/osrm-stub.mjs`, `tests/navigation.integration.test.ts`, `tests/routing.test.ts`, `docs/API.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_PROGRESS.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCTION_CHECKLIST.md`.

**Database changes:** Added `vehicle_id` and `vehicle_seat_count` to `navigation_sessions`; added `navigation_match_candidates` with unique session/demand pair, route version, detour values, pickup ETA, state, expiry, and GiST route-geography index.

**Endpoints:** `PATCH /api/v1/navigation/sessions/:id/matching`; `POST /api/v1/navigation/sessions/:id/pause`; `POST /api/v1/navigation/sessions/:id/resume`; `GET /api/v1/navigation/sessions/:id/matches`; `POST /api/v1/navigation/sessions/:id/matches/refresh`; `POST /api/v1/navigation/sessions/:id/matches/:candidateId/interest`; `GET /api/v1/demands/mine/navigation-matches`; `POST /api/v1/navigation/matches/:candidateId/passenger-confirm`.

**Tests:** `DATABASE_URL=... npm run db:migrate` applied `012_navigation_matching.sql`. `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed. `API_TEST_URL=... npm test` passed 17/17 with local PostGIS/API; the opt-in navigation integration is skipped in that aggregate run. `API_TEST_NAVIGATION=true npx tsx --test tests/navigation.integration.test.ts` passed 1/1 against local PostGIS/API and a local test-only OSRM contract fixture. It checked forward-only road candidate inclusion, reverse and over-capacity exclusion, verified vehicle gate, opt-in, measured detour response, pause-required interest, role denial, withheld driver identity, idempotent passenger confirmation, no booking creation, navigation resume/end, GPS validation, and exact-location purge. `API_TEST_URL=... npx tsx --test tests/api-bookings.integration.test.ts` separately passed 5/5 with no routing provider configured. An initial attempt to run the entire API integration suite while the navigation routing fixture was active failed three routing-dependent assertions because those existing booking tests expect an unconfigured provider; the suites were rerun separately with their intended provider environment. `SIMULATOR_UDID=95D35F57-0F2F-467B-95C1-109C223D18F0 npm run ios:simulator` passed the Vite/Capacitor sync, Xcode build, install, launch, and screenshot flow on iPhone 18 Pro / iOS 27. Screenshot `/tmp/marshgo-ios-simulator.png` shows the reference-aligned MARSHGO welcome screen in the native shell. Tap-through matching and location permission cannot be tested without interactive Simulator controls; actual GPS requires a physical-device run.

**DEMO/TRUTH status:** Candidate records are generated only from persisted user demands and a configured road-routing provider. The local OSRM fixture is test-only; there is no configured production router/geocoder or live GPS device run. Candidate matching has no WebSocket/push, no price proposal linkage, and no route waypoint insertion. No booking is implied by either side's interest.

**Open issues:** Route candidate detour evaluation has API integration coverage only; no on-device GPS run was possible in this headless simulator host. Demand matching does not yet evaluate driver preference flags or existing passenger stop occupancy. The demand proposal is not linked to the candidate row, no in-app realtime/chat notification is sent, and the route is not automatically recalculated or updated with accepted stops. Router/geocoder/map tiles are unconfigured.

**External dependencies:** Approved production OSRM-compatible route provider, geocoder, map tile service, tap-capable iOS Simulator or physical iPhone with GPS, staging environment and independent user/device acceptance.

**Next implementation step:** Link mutually confirmed navigation interest into the existing quote/proposal flow without implying a booking, then add realtime notification delivery and on-device GPS acceptance when providers/devices are available.

## Phase 5 / 9 — Mobile browser E2E for booking and chat

**Phase:** 5 Production UI replacement; 9 test/quality pipeline.

**Status:** PARTIAL. The first local two-account UI acceptance path is now browser-tested against the real API and isolated PostGIS. Staging/physical iPhone acceptance and the remaining E2E matrix are not complete.

**Completed:** Added an iPhone-sized Chromium Playwright test that signs in two independent users through development-only OTP, resolves origin/destination through an isolated local geocoder fixture, searches a persisted route, books two seats, verifies the database-frozen total and remaining inventory, sends a persisted message, then verifies both booking inventory and chat from a second browser context. Added a dedicated loopback-only `marshgo_e2e` creation helper, unique E2E service ports (3300–3304), Playwright browser config, and GitHub Actions PostGIS + browser E2E steps. Fixed the development OTP response to include its code in the standard `{ data }` envelope consumed by the frontend; the test OTP is returned only by the no-network development adapter. Refined the production iPhone home layout to place route search directly below the greeting and reduce transport category cards to reference scale. The initial browser run exposed an unrelated site bound to port 3000; E2E now uses dedicated ports and refuses server reuse.

**Modified files:** `e2e/marketplace.spec.ts`, `tests/fixtures/geocoder-stub.mjs`, `tests/fixtures/e2e-web-server.mjs`, `playwright.config.ts`, `scripts/ensure-e2e-database.ts`, `server/index.ts`, `src/views/ProductionMarketplace.tsx`, `package.json`, `bun.lock`, `.github/workflows/ci.yml`, `.gitignore`, `README.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** No production schema change. Created a separate local `marshgo_e2e` database and applied existing migrations `001`–`012`; it contains only test fixture data. The test cleans up the exact UUID-scoped fixture rows after execution.

**Endpoints:** Existing `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`, `POST /api/v1/auth/refresh`, `GET /api/v1/places/suggest`, `GET /api/v1/offers`, `POST /api/v1/bookings`, `GET /api/v1/bookings`, booking conversation/history, and `POST /api/v1/conversations/:id/messages` verified through the user interface.

**Tests:** `npx bun@1.3.5 install --frozen-lockfile` passed. `npm run typecheck`, `npm run lint`, and `npm test` passed (12/12 unit tests; integration tests require explicit API test env). `npm run build` passed. `E2E_DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e npm run test:e2e` passed 1/1 on an iPhone-sized Playwright viewport after the visual adjustment: independently authenticated passenger and driver see the same confirmed two-seat booking, two remaining seats, and persisted chat. The test also confirms the HttpOnly refresh cookie survives a page reload and the passenger sees the booking and chat restored from the API. A same-origin test reverse proxy forwards requests to the separate API process, matching the intended deployment shape; direct cross-origin preview did not preserve the test cookie, so it is not used for this cookie-auth test. `/tmp/marshgo-e2e-home-refined.png` captures the refreshed home screen. The first test attempt failed because port 3000 served an unrelated local site; no product code was inferred as passing from that failed run. `npm run ios:simulator` rebuilt, installed, and launched the latest UI on iPhone 18 Pro / iOS 27; `/tmp/marshgo-ios-design-latest.png` confirms the reference-aligned welcome screen in the native shell. No UI taps were automated in Simulator.

**DEMO/TRUTH status:** This is a genuine API/PostGIS-backed local test using fixtures and a local geocoder. OTP code disclosure and geocoder fixture are restricted to test/development configuration; neither represents production SMS/address coverage. Booking and chat state was read back from independent user sessions and PostgreSQL. No real message push or WebSocket delivery is included.

**Remaining issues:** The critical browser scenario is local-only and does not exercise production SMS, uploads, driver publishing UI, reverse-demand negotiation, GPS permission, or passive matching. iPhone Simulator confirms latest build and launch but only the welcome screen has been visually captured; interaction flow remains unverified in the simulator. Full E2E/security/load/restore suites are still incomplete.

**External blockers:** Real SMS sender/account; contracted routing/geocoder/map tiles; private photo/document object storage; HTTPS staging/API host, secrets and monitoring; two physical-device or interactive-simulator acceptance.

**Next implementation step:** Run the same state checks after a full logout/restart, add tested E2E coverage for demand counter-proposals and authorization denial, then validate the new sign-up path in the running iOS simulator once tap automation is available.

### Verification update — Reverse Marketplace UI + iOS simulator

**Phase:** 4 Reverse Marketplace and 5 Production UI replacement; iOS wrapper verification.

**Status:** PARTIAL. The local two-account browser test now verifies booking, persisted chat, and the full demand price negotiation. iOS builds and launches in Simulator, but only startup rendering has been visually verified; tap-driven simulator acceptance is still unavailable.

**Implemented:** Extended the iPhone-sized E2E path so a passenger publishes a Stryi → Lviv demand for two people with a 300 UAH total budget; a driver offers 350 UAH; the passenger counters 320 UAH; the driver explicitly agrees; the passenger confirms; the test verifies exactly one resulting booking for two seats at 32,000 minor units and the driver sees the matching booking. The passenger then enables driver capability and the test confirms the same User ID retains both roles; a cross-account vehicle edit returns 404 without changing the driver's vehicle. Fixed driver proposal action selection in the E2E flow, the production proposal turn indicator (driver must agree after a passenger counter-offer), and a post-confirmation UI refresh that incorrectly fetched a driver-only demand list from the passenger account. Both account contexts persist the same booking/chat state from API-backed storage.

**Changed files:** `src/views/ProductionMarketplace.tsx`, `e2e/marketplace.spec.ts`, `playwright.config.ts`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** None. E2E used the isolated local PostGIS `marshgo_e2e` database and removed its account, booking, demand, proposal, and vehicle fixtures at test teardown.

**Endpoints:** Existing `POST /api/v1/demands`, `GET /api/v1/demands/mine`, `GET /api/v1/demands`, `POST /api/v1/demands/:id/proposals`, `POST /api/v1/proposals/:id/counter`, `POST /api/v1/proposals/:id/agree`, `POST /api/v1/proposals/:id/accept`, `GET /api/v1/bookings` and persisted conversation messages exercised through UI.

**Tests:** `npm run typecheck` passed; `npm run lint` passed; `npm test` passed 12/12; `npm run build` passed; `E2E_DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e npm run test:e2e` passed 1/1 including role retention, cross-account write denial, counter-offer and final booking verification. `SIMULATOR_UDID=95D35F57-0F2F-467B-95C1-109C223D18F0 SIMULATOR_API_BASE_URL=http://localhost:3002 SIMULATOR_SCREENSHOT_PATH=/tmp/marshgo-ios-iphone-reference.png npm run ios:simulator` built the Capacitor iOS app, installed/launched `ua.marshgo.app` on iPhone 18 Pro / iOS 27, and captured `/tmp/marshgo-ios-iphone-reference.png`. Visual inspection confirms the branded onboarding screen and native status/navigation shell render. Simulator taps and the authenticated workflows have not been exercised on-device.

**DEMO/TRUTH status:** Negotiation, agreement, booking, and chat are server/PostGIS-backed in this isolated development E2E environment. OTP and geocoding are test adapters; no production SMS, external routing/map provider, photo-storage, push, or live partner is active. Simulator API pointed at the isolated local E2E database with development OTP; this is not a staging or production release.

**Open issues:** Remaining Gate A E2E matrix (especially independent-device restart, authorization denial, concurrent last-seat booking, and GPS candidate mutual confirmation), interactive iOS flow, physical-device location behavior, routing/geocoding/map contracts, production SMS, object storage, HTTPS staging, push, backup/restore, and operational monitoring.

**External dependencies:** Real SMS provider credentials, an owned/contracted routing and geocoding provider, map tiles and attribution, private object storage, a staging host/secret manager, push credentials, and a physical iOS device or interactive simulator controls for full tap/GPS testing.

**Next implementation step:** Expand deterministic API/E2E coverage for role/ownership denial and concurrent booking; then add an interactive simulator/XCUITest path for sign-in and the actual home/search screens.

## Phase 9 — Run API/PostGIS integration suites in CI

**Phase:** 9 Hardening / continuous verification.

**Status:** PARTIAL. CI now exercises existing booking/lifecycle and foreground navigation API integration tests in addition to the browser flow. This does not replace production-provider tests or staging acceptance.

**Completed:** Added `npm run test:integration` with scoped subcommands. The runner refuses any database other than loopback `marshgo_e2e`, starts a development-only API process with `x-dev-user-id` test identity, runs transactional booking tests without routing, stops that API, starts a local OSRM contract fixture, and runs navigation/matching tests against a second API process. GitHub Actions invokes this runner after migrations against its isolated PostGIS service. README documents the safe local invocation and makes clear this is fixture-backed verification.

**Modified files:** `scripts/run-integration-tests.sh`, `package.json`, `.github/workflows/ci.yml`, `README.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** None; the runner intentionally does not apply migrations. CI applies migrations to the isolated PostGIS service before the test step.

**API endpoints:** Existing booking/lifecycle and navigation session/matching routes are exercised by the two integration suites.

**Tests:** `API_TEST_DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e npm run test:integration` passed booking suite 5/5 and navigation suite 1/1. This includes OTP/profile/session rotation, one-winner last-seat concurrency, vehicle/role ownership, verification workflow, demand negotiation/booking conversion, real-route candidate filters, opt-in, mutual confirmation, GPS validation, and location purge. After wiring CI, `npm run typecheck`, `npm run lint`, `bash -n scripts/run-integration-tests.sh`, `npm test` (12/12), `npm run build`, `npm run test:e2e` (1/1), and `git diff --check` all passed locally.

**DEMO/TRUTH status:** All integration users and route responses are test-only; the OSRM fixture estimates routes only for deterministic assertions and is never presented to the app as a production provider. The runner pins DB targeting to loopback and the dedicated test database.

**Remaining issues:** No CI result from GitHub Actions has been observed for this change yet; physical device, real providers, production host, load/performance, backup restore, and interactive iOS workflows are still outstanding.

**External blockers:** None for local CI wiring. Production service credentials and deployment/restore resources remain separately blocked as listed above.

**Next implementation step:** Validate the complete local command set including browser E2E after adding the runner, then continue the critical acceptance matrix with multi-device booking/cancellation and safe mutual-match behavior.

## Phase 7 — Participant-authorized realtime chat

**Phase:** 7 Real-time chat (message delivery slice).

**Status:** PARTIAL. Local two-account realtime send and reconnect/history replay are browser-tested. Production multi-instance fan-out and push remain incomplete.

**Completed:** Added an authenticated one-use 30-second realtime ticket bound to a persisted access session. WebSocket upgrade checks allowlisted browser origin, consumes the ticket, revalidates active session, limits frames/connections, sends ping/pong heartbeats, and closes connections on logout. Persisted booking messages are broadcast only to participants after the database insert. The production client automatically reconnects using a newly-issued ticket, fetches persisted conversation history on reconnect, deduplicates socket/REST messages, and shows online/offline chat status. E2E reverse proxy now forwards WebSocket upgrades; the two-account mobile-sized test proves an online passenger message appears for an already-connected driver without refresh and is still present when the driver reloads/reopens chat.

**Modified files:** `server/index.ts`, `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `tests/fixtures/e2e-web-server.mjs`, `e2e/marketplace.spec.ts`, `package.json`, `bun.lock`, `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** None; the single-use tickets are short-lived in-memory credentials bound to existing database sessions. Messages remain durable in PostgreSQL.

**API endpoints/events:** Added `POST /api/v1/realtime/ticket`; added authenticated WebSocket `GET /api/v1/realtime?ticket=…`; `POST /api/v1/conversations/:id/messages` emits `conversation.message.created` to booking conversation members after persistence.

**Tests:** `npx --yes bun@1.3.5 install --frozen-lockfile` passed. Under pinned Node.js 24.21.0, `npm run typecheck`, `npm run lint`, `npm test` (12/12), and `npm run build` passed. `API_TEST_DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e npm run test:integration` passed booking/lifecycle (5/5) and navigation (1/1). `E2E_DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e npm run test:e2e` passed (1/1), including immediate cross-account WebSocket delivery and persisted replay after reload. `SIMULATOR_UDID=95D35F57-0F2F-467B-95C1-109C223D18F0 SIMULATOR_API_BASE_URL=http://localhost:3002 SIMULATOR_SCREENSHOT_PATH=/tmp/marshgo-ios-realtime-build.png npx --yes --package=node@24.21.0 -- npm run ios:simulator` passed Capacitor sync, Xcode build, install, and launch on iPhone 18 Pro / iOS 27; screenshot confirms the branded onboarding screen renders. Simulator taps/auth/chat/GPS could not be exercised with the available headless simulator controls.

**DEMO/TRUTH status:** Real server sessions and PostgreSQL-backed conversations are used. Ticket issuance cannot use the development identity bypass without a database session. No fixture-only event is exposed by this implementation. Fan-out currently reaches clients connected to the same API process only; a multi-instance production deployment must not scale this server horizontally until shared pub/sub is added.

**Remaining issues:** Web Push, unread/read receipts, demand-bound pre-booking conversations, Redis pub/sub/scale-out, cross-process reconnection/load testing, and independent production staging remain incomplete.

**External dependencies:** No provider credentials for this slice. Redis provisioning is already local but its pub/sub integration is outstanding engineering work.

**Next implementation step:** Add block/unblock controls to the production profile/chat views and shared Redis fan-out before any multi-instance deployment.

## Phase 7 — User-ID block enforcement

**Phase:** 7 Real-time and account-safety continuation.

**Status:** PARTIAL. Authenticated server-side block management is implemented and integration-tested. The production UI, report/moderation case flow, and rules for existing bookings still need product work.

**Completed:** Added `user_blocks` with user-ID keys, cascade deletion, and a reverse lookup index. Authenticated list/block/unblock endpoints are idempotent where applicable and audit logged. Either direction in a blocked pair prevents demand proposals and negotiation, suppresses passive route candidates, and denies booking-chat history and message sends. Blocks leave an already-confirmed booking intact; standard booking cancellation remains a separate explicit action.

**Modified files:** `server/migrations/013_user_blocks.sql`, `server/index.ts`, `tests/api-bookings.integration.test.ts`, `tests/navigation.integration.test.ts`, `docs/API.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** `user_blocks(blocker_id, blocked_id, created_at)`, composite primary key, self-block check, cascading foreign keys, and reverse lookup index.

**Endpoints:** `GET /api/v1/users/me/blocks`; `POST /api/v1/users/:id/block`; `DELETE /api/v1/users/:id/block`.

**Tests:** Applied migration `013_user_blocks.sql` to local `marshgo` and isolated `marshgo_e2e` PostGIS databases. `npm run test:integration` passed booking/chat 5/5 and navigation 1/1; assertions verify block/unblock, proposal denial, chat history/send denial, and matching suppression while blocked. `npm test` passed 12/12, `npm run test:e2e` passed 1/1, `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed.

**DEMO/TRUTH status:** Block data and enforcement are server/PostgreSQL-backed. No demo blacklist data is used by these endpoints. Existing bookings are not cancelled by a block. UI controls are not yet connected.

**Remaining issues:** Expose block/unblock actions in production profile, chat, and demand UI; add abuse report/moderation workflow; define the customer-support policy for blocking an existing booking pair.

**External dependencies:** None for the server slice. Staff moderation still requires initial authorized staff provisioning and the unfinished admin workflow.

**Next implementation step:** Connect block controls to the production client, then continue reliability hardening for shared WebSocket fan-out and external geocoder/routing configuration.

## Phase 6 — Foreground GPS navigation session

**Phase:** 6 Navigation/Matching (foreground navigation slice).

**Status:** PARTIAL. Real GPS session and route persistence are implemented and API-tested. Passenger matching, navigation instructions, rerouting, map-provider configuration, background GPS, and physical-device GPS permission testing remain incomplete.

**Completed:** Added migrations `010_navigation_sessions.sql` and `011_navigation_retention.sql` with one-active-session-per-driver and spatial indexes. Added owner/driver-authorized start, restore, inspect, location-update, and idempotent end API. Starting requires a real GPS origin and successful OSRM-compatible road route; no estimate is invented if routing is absent. The API validates WGS84, sample accuracy ≤100 m, freshness (≤60 s), future skew (≤15 s), ordering, and implausible movement. It returns an on-route check against the road line. End removes precise position, destination label/point, and road geometry; a five-minute no-fix cleanup runs at startup and every 15 seconds. Added a mobile navigation screen in the production shell with destination geocoder selection, native-browser foreground location watch, visible stale/off-route state, real route geometry, map-tile-provider configuration, and explicit disclosure that passenger matching/voice/background navigation are unavailable. iOS now requests foreground location permission with a purpose string.

**Modified files:** `server/migrations/010_navigation_sessions.sql`, `server/migrations/011_navigation_retention.sql`, `server/index.ts`, `src/services/productionApi.ts`, `src/views/ProductionMarketplace.tsx`, `src/views/ProductionNavigation.tsx`, `ios/App/App/Info.plist`, `.env.example`, `package.json`, `tests/fixtures/osrm-stub.mjs`, `tests/navigation.integration.test.ts`, `docs/API.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/IOS.md`, `docs/PRODUCTION_AUDIT.md`, `docs/PRODUCTION_PROGRESS.md`.

**Database changes:** `navigation_sessions` with `geography(Point,4326)` destination/current location, `geometry(LineString,4326)` road route, route distance/duration/version, state and opt-in flag. Partial unique active-session-per-driver index plus GiST route/current-location indexes. Destination label is nullable for retention purge.

**Endpoints:** `POST /api/v1/navigation/sessions`; `GET /api/v1/navigation/sessions/active`; `GET /api/v1/navigation/sessions/:id`; `POST /api/v1/navigation/sessions/:id/location`; `POST /api/v1/navigation/sessions/:id/end`.

**Tests:** Applied both migrations on the existing local PostGIS container. Navigation API integration passed 1/1 against local PostGIS/API with a test-only OSRM-compatible fixture. Tested role/owner denial, duplicate active session conflict, route polyline/distance, fresh GPS accepted/on-route, stale GPS 400, teleport 422, idempotent end, and deletion of route/destination/precise point. `npm test`: 11 passed, 2 opt-in integration suites skipped without env. `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed after fixture cleanup. `npm run ios:simulator` built/installed/launched `ua.marshgo.app` on iPhone 18 Pro / iOS 27; screenshot `/tmp/marshgo-ios-simulator.png` confirms the production welcome screen renders in the native shell. Tap-through OTP/navigation and GPS permission testing are unavailable because only headless `simctl` is present. The test route fixture does not represent a real roads service.

**DEMO/TRUTH status:** Production navigation no longer uses demo coordinates or simulated movement. API stores one latest GPS point only, available to the owning driver. If `ROUTING_ENGINE_URL` is missing the start request fails closed. No opt-in passenger matching is exposed as active. Without `VITE_MAP_TILE_URL`, the app draws the real route geometry and identifies the missing street-map tile layer.

**Open issues:** No actual dynamic route recalculation, maneuver/voice guidance, geospatial passenger candidate query, detour routing, mutual passenger consent, WebSocket location fanout, offline recovery UX, or background tracking. A tap-driven iOS GPS session was not possible on the headless simulator host.

**External dependencies:** Configure an owned/contracted OSRM-compatible router; approved contracted/self-hosted map tile service plus attribution; real geocoder for selecting destination; physical-device/iOS permission review. Passive matching needs its own route-detour engine and two-sided consent workflow.

**Next implementation step:** Run lint and the complete build/test suite after fixture cleanup; sync, install, and launch the updated iOS app in the available simulator. Then implement and test passenger candidate corridor/detour matching without exposing it as active until both sides confirm.
