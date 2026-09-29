# MARSHGO architecture

## Current state

The browser application remains a local demo backed by `localStorage`. The production Vite bundle now fails closed with a launch-status screen so seeded users, vehicles, reviews, offers, bookings, and GPS suggestions are not presented as live marketplace data.

The first backend slice is an Express API backed by PostgreSQL/PostGIS. Local Docker Compose provides PostgreSQL 17/PostGIS 3.5 and Redis with persistent named volumes. The API uses a shared `pg.Pool`, a versioned SQL migration, readiness checks, request size limits, allowlisted CORS, and a centralized error handler.

## Data flow implemented

* `GET /api/v1/offers` reads published future inventory directly from PostgreSQL. It currently filters by exact normalized city names; coordinates and route geometry are stored for the later geographic matcher.
* Driver profile/vehicle reads and vehicle/offer creation are authenticated and role-checked. Offer publication requires an owned, verified vehicle; the verification workflow is not built yet.
* `POST /api/v1/bookings` authenticates a server session (or the explicit local-only development bypass), locks the offer row, checks inventory, fixes price from the database, decrements seats and creates a booking and conversation in one transaction. It supports per-user idempotency keys.
* `POST /api/v1/bookings/:id/cancel` locks the booking, checks ownership and state, cancels it once, and restores seats in the same transaction.
* Passenger demand, driver proposal, alternating price/time counter-offers, revision history, and passenger acceptance are persisted. Acceptance creates the matching offer/booking and conversation in one transaction and rejects the other proposals.
* Conversation history is stored in PostgreSQL. Read/send routes check conversation membership; there is no realtime transport yet.

## Planned boundaries

OTP delivery and session issuance, push, route matching, payments, observability, and a connected web client remain incomplete. No service provider or production credential is configured. Until session issuance and the API-backed client exist, the production UI remains unavailable by design.

Production deployment must use managed secrets, HTTPS, a private database network, automated backups with restore drills, database migration review, rate limiting backed by shared infrastructure (the current API limiter is per-process), and error monitoring. The local development bypass must never be enabled outside development.
