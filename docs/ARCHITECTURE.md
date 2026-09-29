# MARSHGO architecture

## Current state

The development browser application still contains local demo flows backed by `localStorage`. Production builds now use a separate authenticated API client and show only server-backed phone enrollment, exact-city/date/seat search, bookings, and booking history. Other demo screens are not reachable from the production entry point.

The first backend slice is an Express API backed by PostgreSQL/PostGIS. Local Docker Compose provides PostgreSQL 17/PostGIS 3.5 and Redis with persistent named volumes. The API uses a shared `pg.Pool`, a versioned SQL migration, readiness checks, request size limits, allowlisted CORS, and a centralized error handler.

## Data flow implemented

* OTP enrollment, hashed one-time challenges, short-lived opaque access tokens, refresh-cookie rotation/reuse revocation, profile changes, role enabling, export, and deletion requests use PostgreSQL state. Development OTP has no network path; Twilio is an opt-in provider adapter with no credentials configured.
* `GET /api/v1/offers` reads published future inventory directly from PostgreSQL and filters by exact city name, requested date in `Europe/Kyiv`, and available seat count. Coordinates and route geometry are stored for the later geographic matcher.
* Vehicle reads, creation, owner-bound editing, active-car selection, and archival are authenticated and role-checked. Offer publication requires an owned, verified vehicle; the verification workflow and photo storage are not built yet.
* `POST /api/v1/bookings` authenticates a server session (or the explicit local-only development bypass), locks the offer row, checks inventory, fixes price from the database, decrements seats and creates a booking and conversation in one transaction. It supports per-user idempotency keys.
* `POST /api/v1/bookings/:id/cancel` locks the booking, checks ownership and state, cancels it once, and restores seats in the same transaction.
* Passenger demand, driver proposal, alternating price/time counter-offers, revision history, and passenger acceptance are persisted. Acceptance creates the matching offer/booking and conversation in one transaction and rejects the other proposals.
* Conversation history is stored in PostgreSQL. Read/send routes check conversation membership; there is no realtime transport yet.

## Planned boundaries

Real SMS delivery and credentials, vehicle photo storage, push, WebSocket delivery, route matching, payments, observability, and most production web workflows remain incomplete. No service provider or production credential is configured. Redis is provisioned for local use but not yet used by the API.

Production deployment must use managed secrets, HTTPS, a private database network, automated backups with restore drills, database migration review, rate limiting backed by shared infrastructure (the current API limiter is per-process), and error monitoring. The local development bypass must never be enabled outside development.
