# MARSHGO Production Progress

## Phase 0 — Local audit and baseline

**Status:** Complete.

**Completed:** Verified local `main`, `origin/main`, and starting commit `1e7d0ee`. The starting tree was clean; no earlier user changes were overwritten. Inspected the PWA and found its core state was browser-local demo storage. Fixed the Vite/esbuild dependency mismatch, made page views lazy-loaded, revised the home/results interface toward the supplied mobile references, and added client-side safeguards for demo workflows. Production Vite builds now fail closed with a launch-status screen instead of showing seeded offers and profiles as live data.

**Modified files:** `package.json`, `bun.lock`, `src/App.tsx`, `src/components/AppHeader.tsx`, `src/services/storage.ts`, `src/views/HomeView.tsx`, `src/views/SearchView.tsx`, `vite.config.ts`, `tests/storage.test.ts`, `.env.example`, `docs/PRODUCTION_AUDIT.md`.

**Database changes:** None in this phase.

**API endpoints:** None in this phase.

**Tests:** Bun frozen-lockfile install, typecheck, build, and the four browser-storage unit tests pass.

**Remaining issues:** Frontend workflows still use demo storage. The launch-status screen remains until the authenticated API client is integrated.

**External blockers:** None for this phase.

**Next implementation step:** Build the persistent API foundation for the two-phone booking path.

## Phase 1 — Backend, PostgreSQL/PostGIS, authentication foundation, users and vehicles

**Status:** In progress; API foundation and first booking slice implemented, user/session enrollment incomplete.

**Completed:** Added Docker Compose for local PostgreSQL/PostGIS and Redis with named persistent volumes; applied initial schema migration locally. Added Express API health/readiness, database-backed offer lookup, profile/vehicle reads, driver-only vehicle creation, verified-vehicle-only offer publication, server session-hash checking, explicit development-only identity bypass, request-size cap, allowlisted CORS, security headers, per-process API rate limit, and centralized errors. Added transactionally locked bookings with server-priced totals, idempotency keys, conversation creation, audit event, ownership-checked cancellation, and once-only seat restoration. Production UI now blocks demo inventory. Added ESLint for touched/backend files and a GitHub Actions workflow for lint, typecheck, tests, and build.

**Modified files:** `package.json`, `bun.lock`, `.env.example`, `docker-compose.yml`, `.github/workflows/ci.yml`, `eslint.config.js`, `server/index.ts`, `server/migrate.ts`, `server/migrations/001_initial.sql`, `server/migrations/002_reverse_marketplace.sql`, `src/App.tsx`, `src/components/AppHeader.tsx`, `src/services/storage.ts`, `src/views/SearchView.tsx`, `tests/api-bookings.integration.test.ts`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DEPLOYMENT.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/PRODUCTION_AUDIT.md`.

**Database changes:** Added `001_initial.sql`: users, vehicles, offers with PostGIS points and route geometry, bookings, passenger demands, proposals, conversations/members, messages, OTP challenges, sessions, audit events, indexes and constraints. Added `002_reverse_marketplace.sql` with proposal vehicle/time/revision columns, revision history and one-accepted-proposal-per-demand guard. Both migrations were applied to the local Docker database.

**API endpoints:** `GET /healthz`, `GET /readyz`, `GET /api/v1/offers`, `GET /api/v1/users/me`, `GET|POST /api/v1/vehicles`, `POST /api/v1/offers`, `POST|GET /api/v1/demands`, `POST /api/v1/demands/:id/proposals`, `POST /api/v1/proposals/:id/counter`, `POST /api/v1/proposals/:id/accept`, `GET /api/v1/proposals/:id/revisions`, `GET /api/v1/bookings`, `POST /api/v1/bookings`, `POST /api/v1/bookings/:id/cancel`, `GET /api/v1/bookings/:id/conversation`, `GET|POST /api/v1/conversations/:id/messages`.

**Tests:** Lint/typecheck/build pass. Automated local PostGIS API integration tests verify anonymous denial, two simultaneous users competing for the last seat (one 201, one 409), same-key replay, repeated cancellation and seat restoration, driver role enforcement, pending-vehicle publication block, publish after local verification, demand creation, counter-turn rules, revision history, accepted-proposal booking conversion, participant message send/history, and third-party privacy denial. All 7 tests pass. `docker compose config` and migrations pass. No API-driven two-device UI test yet. Repository-wide lint found 204 legacy UI warnings/errors; current lint scope is new/backend and touched files only.

**Remaining issues:** The PWA has not been wired to API data. OTP delivery, session creation/revocation, user registration, vehicle verification, demand cancellation, booking lifecycle, realtime message delivery, geographic search, and production-grade shared rate limiting are not implemented. Redis is currently provisioned but unused. Current offer search uses exact city names.

**External blockers:** SMS provider/account and sender identity; staging/production host and database; secrets manager; routing/geocoding source decision. No public deploy or production database action performed.

**Next implementation step:** Complete user/session enrollment after the SMS provider is selected, then connect the frontend account/profile and vehicle screens to these endpoints.

## Phase 2 — Trips, search, and booking transaction

**Status:** Backend transaction slice implemented; cross-device application flow remains blocked on authentication and frontend integration.

**Completed:** Database-backed offer lookup, offer publishing for an owned verified vehicle, seat-locked booking, replay-safe idempotency, fixed server pricing, cancellation and single seat restoration. Tested with two independent local user identities racing for the last seat.

**Remaining issues:** Search is exact city text only; frontend still uses browser-local offers and booking state; owner-side trip management, confirmations/QR, and lifecycle notifications are missing. This is not the user acceptance test on two physical phones.

**Next implementation step:** Create secure user enrollment/session issuance, wire the PWA to session-protected offer/booking endpoints, and run the cross-device scenario in staging.

## Phase 3 — Reverse marketplace

**Status:** Backend API flow implemented and locally transaction-tested; frontend and messaging integration remain incomplete.

**Completed:** Passenger demand submission, driver proposal using a verified vehicle, alternating counter-offers with server-stored revision history, expiry checks, passenger-only acceptance, atomic booking creation, seat consumption, competing proposal rejection, and conversation participant creation.

**Remaining issues:** PWA screens still use local data. Persisted message routes exist, but there is no realtime transport or live notification. No geographic relevance ranking, driver matching, or route deviation calculation.

**Next implementation step:** Wire demand and driver negotiation views to API and test the flow through the authenticated PWA.

## Phase 5 — Real-time chat and notifications

**Status:** Persistent chat API slice implemented; realtime and push remain incomplete.

**Completed:** Conversations are created with booking acceptance. Booking participants can resolve their conversation, send bounded messages, and read persisted history. Both routes verify membership; a third-party access test returns 404.

**Remaining issues:** The PWA chat still uses local demo state. No WebSocket, push provider, unread counts, notification subscriptions, or rescue alternatives.

**Next implementation step:** Connect the PWA Messages view to these endpoints, then add realtime delivery using shared Redis-backed coordination.
