# API v1 (current implementation)

Base URL: the API server, default `http://localhost:3002`.

## Health

* `GET /healthz` — process liveness; does not imply database readiness.
* `GET /readyz` — checks PostgreSQL connectivity.

## Offers

`GET /api/v1/offers?origin=Стрий&destination=Львів`

Returns published, future offers with available seats from PostgreSQL. Optional `date=YYYY-MM-DD` is interpreted in `Europe/Kyiv`; `seats` defaults to 1 and filters out offers without enough seats. It does not return seed data. Search is currently exact city-name matching; geographic route matching is not implemented yet.

`POST /api/v1/vehicles` (driver role) creates a vehicle record without accepting or returning a full license plate. The first car becomes active; later cars do not replace it. New vehicles remain pending until an authorized verification workflow exists.

`GET /api/v1/vehicles` lists only the caller's non-archived vehicles. `PATCH /api/v1/vehicles/:id` edits only an owned vehicle. `POST /api/v1/vehicles/:id/activate` atomically switches the active vehicle. `DELETE /api/v1/vehicles/:id` archives only when it has no future published trip.

`POST /api/v1/vehicles/:id/photos/upload-url` returns an S3-compatible presigned POST, restricted to JPEG/PNG/WebP and 10 MiB. The browser uploads directly to the private object bucket, then `POST /api/v1/vehicles/:id/photos` verifies object size, declared media type, and file signature before recording it. `GET /api/v1/vehicles/:id/photos` returns short-lived private read URLs to the owner. `PATCH /api/v1/vehicles/:id/photos/:photoId/primary` selects the primary image; `DELETE /api/v1/vehicles/:id/photos/:photoId` removes the object and record. Bucket CORS, credentials, and `S3_BUCKET`/`S3_REGION` are external configuration; without them upload requests return 503.

`POST /api/v1/offers` (driver role) publishes a future offer with named endpoints, WGS84 coordinates, departure time, price in minor currency units, seat count, and an owned verified vehicle.

`POST /api/v1/routing/route` (authenticated) returns an OSRM-compatible road geometry, distance, and duration. `ROUTING_ENGINE_URL` must point to a configured private or contracted OSRM-compatible endpoint. In production, offer creation requires a successful route and persists the returned geometry, distance, duration, source, and computed arrival time; missing or failed routing returns 503. Local development can create explicitly marked `development_unrouted` fixtures for tests only.

`POST /api/v1/auth/otp/request` and `POST /api/v1/auth/otp/verify` implement phone challenge enrollment. OTP codes are hashed, expire after five minutes, permit five attempts, and have a one-minute resend cooldown plus a per-phone hourly cap. The no-network OTP provider is allowed only with `NODE_ENV=development` and `AUTH_DEV_OTP=true`; production Twilio delivery requires account credentials and a verified sender. Verify returns a short-lived opaque bearer token and an HttpOnly refresh cookie. `POST /api/v1/auth/refresh` rotates refresh credentials and revokes a token family on reuse; `POST /api/v1/auth/logout` and `/logout-all` revoke sessions.

`GET|PATCH /api/v1/users/me` reads and updates the authenticated profile. `POST /api/v1/users/me/roles` permits self-enabling only passenger/driver roles without changing user identity. `GET /api/v1/users/me/export` exports account records; `POST /api/v1/users/me/deletion-requests` creates a pending request without immediately disabling the account. `GET /api/v1/bookings` returns bookings where the caller is a passenger or driver.

## Reverse marketplace

`POST /api/v1/demands` (passenger role) creates a geocoded passenger request with a maximum seven-day time window, passenger count, and optional budget. `GET /api/v1/demands` (driver role) returns open requests other than the driver's own.

`POST /api/v1/demands/:id/proposals` (driver role) creates a price/time proposal using the caller's verified vehicle. The proposal price is the total agreed amount in minor UAH units. It expires no later than the demand's time window.

`POST /api/v1/proposals/:id/counter` lets only a participant counter; turns must alternate between driver and passenger. Each revision is persisted. `GET /api/v1/proposals/:id/revisions` exposes the history only to negotiation participants.

`POST /api/v1/proposals/:id/accept` is passenger-only. In one database transaction it resolves the demand, rejects competing proposals, creates the matched offer and booking, consumes seats, opens the conversation and writes an audit event. Repeated acceptance is rejected after the first commit.

## Bookings

All booking routes require `Authorization: Bearer <session-token>`. Access and refresh tokens are stored only as SHA-256 hashes in `sessions`. Real OTP delivery is still a launch blocker. Local development can opt into `x-dev-user-id` only when both `NODE_ENV=development` and `AUTH_DEV_BYPASS=true`.

`POST /api/v1/bookings`

Headers: `Idempotency-Key` (16–128 characters). JSON body: `{ "offerId": "<uuid>", "seats": 1 }`. The backend prices from the offer row and uses a row lock and transaction to prevent overselling. Repeated requests with the same key return the original booking.

`POST /api/v1/bookings/:id/cancel`

Cancels a confirmed booking owned by the caller and restores its seats exactly once. Other booking states cannot be cancelled through this endpoint.

## Conversations

`GET /api/v1/bookings/:id/conversation` returns the conversation only to a booking participant. `GET /api/v1/conversations/:id/messages` returns persisted participant-only history, and `POST /api/v1/conversations/:id/messages` stores a message after checking membership. Delivery is request/response only; WebSocket and push updates are not implemented.

Responses use `{ "data": ... }`; errors use `{ "error": { "code", "message", "requestId" } }`. This is the current API surface, not a claim of full OpenAPI coverage. OpenAPI generation and vehicle-photo upload endpoints remain unimplemented.

The production PWA currently uses OTP sign-in, the server offer search, server booking endpoint, and persisted booking list. The dev build continues to show the existing demo UI. Production PWA does not yet include driver offer creation, vehicle management/photos, demand negotiation, chat, or navigation screens.
