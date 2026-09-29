# API v1 (current implementation)

Base URL: the API server, default `http://localhost:3002`.

## Health

* `GET /healthz` — process liveness; does not imply database readiness.
* `GET /readyz` — checks PostgreSQL connectivity.

## Offers

`GET /api/v1/offers?origin=Стрий&destination=Львів`

Returns published, future offers with available seats from PostgreSQL. It does not return seed data. Search is currently exact city-name matching; geographic route matching is not implemented yet.

`POST /api/v1/vehicles` (driver role) creates a vehicle record without accepting or returning a full license plate. New vehicles remain pending until a verification workflow exists.

`GET /api/v1/vehicles` lists only the caller's vehicles.

`POST /api/v1/offers` (driver role) publishes a future offer with named endpoints, WGS84 coordinates, departure time, price in minor currency units, seat count, and an owned verified vehicle. Route geometry and ETA are not yet computed by a routing engine.

`GET /api/v1/users/me` returns the caller's profile. `GET /api/v1/bookings` returns bookings where the caller is a passenger or driver.

## Reverse marketplace

`POST /api/v1/demands` (passenger role) creates a geocoded passenger request with a maximum seven-day time window, passenger count, and optional budget. `GET /api/v1/demands` (driver role) returns open requests other than the driver's own.

`POST /api/v1/demands/:id/proposals` (driver role) creates a price/time proposal using the caller's verified vehicle. The proposal price is the total agreed amount in minor UAH units. It expires no later than the demand's time window.

`POST /api/v1/proposals/:id/counter` lets only a participant counter; turns must alternate between driver and passenger. Each revision is persisted. `GET /api/v1/proposals/:id/revisions` exposes the history only to negotiation participants.

`POST /api/v1/proposals/:id/accept` is passenger-only. In one database transaction it resolves the demand, rejects competing proposals, creates the matched offer and booking, consumes seats, opens the conversation and writes an audit event. Repeated acceptance is rejected after the first commit.

## Bookings

All booking routes require `Authorization: Bearer <session-token>`. Tokens are stored only as SHA-256 hashes in `sessions`; a real OTP/session issuance flow is still a launch blocker. Local development can opt into `x-dev-user-id` only when both `NODE_ENV=development` and `AUTH_DEV_BYPASS=true`.

`POST /api/v1/bookings`

Headers: `Idempotency-Key` (16–128 characters). JSON body: `{ "offerId": "<uuid>", "seats": 1 }`. The backend prices from the offer row and uses a row lock and transaction to prevent overselling. Repeated requests with the same key return the original booking.

`POST /api/v1/bookings/:id/cancel`

Cancels a confirmed booking owned by the caller and restores its seats exactly once. Other booking states cannot be cancelled through this endpoint.

## Conversations

`GET /api/v1/bookings/:id/conversation` returns the conversation only to a booking participant. `GET /api/v1/conversations/:id/messages` returns persisted participant-only history, and `POST /api/v1/conversations/:id/messages` stores a message after checking membership. Delivery is request/response only; WebSocket and push updates are not implemented.

Responses use `{ "data": ... }`; errors use `{ "error": "..." }`. This is the current API surface, not a claim of full OpenAPI coverage.
