# MARSHGO architecture

## Current state

The development browser application still contains local demo flows backed by `localStorage`. Production builds use a separate authenticated API client for phone enrollment, geocoder-selected search, offer publishing, garage and photo/verification workflows, bookings/history, reverse-marketplace demand and proposals, booking-scoped chat, and foreground navigation with opt-in route matching. Screens that need unavailable providers fail closed or show their setup limits. Legacy demo navigation remains isolated from the production shell.

The first backend slice is an Express API backed by PostgreSQL/PostGIS. Local Docker Compose provides PostgreSQL 17/PostGIS 3.5 and Redis with persistent named volumes. The API uses a shared `pg.Pool`, a versioned SQL migration, readiness checks, request size limits, allowlisted CORS, and a centralized error handler.

## Data flow implemented

* OTP enrollment, hashed one-time challenges, short-lived opaque access tokens, refresh-cookie rotation/reuse revocation, profile changes, role enabling, export, and deletion requests use PostgreSQL state. Development OTP has no network path; Twilio is an opt-in provider adapter with no credentials configured.
* `GET /api/v1/offers` reads published future inventory directly from PostgreSQL and supports geospatial endpoint proximity, requested date in `Europe/Kyiv`, and available seat count. Full route overlap/stop feasibility is still absent.
* Vehicle reads, creation, owner-bound editing, active-car selection, photo object metadata and archival are authenticated and role-checked. Offer publication requires an owned, verified vehicle and accepted primary photo; private object storage and live evidence operations remain unconfigured.
* `POST /api/v1/bookings` authenticates a server session (or the explicit local-only development bypass), locks the offer row, checks inventory, fixes price from the database, decrements seats and creates a booking and conversation in one transaction. It supports per-user idempotency keys.
* `POST /api/v1/bookings/:id/cancel` locks the booking, checks ownership and state, cancels it once, and restores seats in the same transaction.
* Passenger demand, driver proposal, alternating price/time counter-offers, revision history, and passenger acceptance are persisted. Acceptance creates the matching booking and conversation in one transaction and rejects the other proposals.
* Conversation history is stored in PostgreSQL. Read/send routes check conversation membership. Realtime uses a short-lived single-use ticket bound to a persisted session; message events fan out only to authenticated conversation members after the database write. Browser reconnect obtains a new ticket and reloads persisted history. The current fan-out is process-local and needs Redis pub/sub before multi-instance API deployment; Web Push is not configured.
* Navigation sessions store the authenticated driver's latest foreground GPS point and an OSRM road route. Opt-in matching filters actual open demand against the remaining route, verifies pickup/dropoff paths and detours, and requires driver interest while paused plus passenger confirmation. The driver can then open the demand in the existing proposal flow; matching does not create a booking.

## Planned boundaries

Real SMS delivery and credentials, private production vehicle-photo storage, Web Push, Redis-backed multi-instance event fan-out, automatic route recalculation, payments, observability, two-device acceptance, and provider-backed end-to-end navigation remain incomplete. No production service provider or credential is configured. Redis is provisioned for local use but not yet used by the API.

Production deployment must use managed secrets, HTTPS, a private database network, automated backups with restore drills, database migration review, rate limiting backed by shared infrastructure (the current API limiter is per-process), and error monitoring. The local development bypass must never be enabled outside development.
