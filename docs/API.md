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

`POST /api/v1/vehicles/:id/verification/evidence/upload-url` issues a 5-minute presigned upload for an owned vehicle, only for JPEG, PNG, or PDF and at most 8 MiB. `POST /api/v1/vehicles/:id/verification` accepts one registration document and one driver licence after server-side object size, declared content type, and file-signature checks. A pending duplicate is rejected; raw object keys are never returned to the owner after submission. `GET /api/v1/users/me/verification` returns the caller's status history without evidence references.

`GET /api/v1/admin/verification`, `GET /api/v1/admin/verification/:id/evidence`, and `POST /api/v1/admin/verification/:id/decision` require a persisted `admin` or `moderator` role. The staff queue omits phone numbers and evidence keys. Evidence URLs expire after 180 seconds; evidence access attempts and decisions are audit logged. A reviewer must request the document before deciding and cannot review their own submission. A vehicle is marked verified only after the latest registration and driver-licence records are both approved. Rejecting either closes the paired pending record. The UI is linked from the profile only for staff roles. Initial staff role assignment is an owner/DBA operation; roles cannot be self-enabled.

Verification uploads are not operational until a private S3-compatible bucket, credentials, encryption-at-rest controls, access policy, and Capacitor/web CORS are configured. No live documents were uploaded in local tests.

`POST /api/v1/offers` (driver role) publishes a future offer with named endpoints, WGS84 coordinates, departure time, price in minor currency units, seat count, and an owned verified vehicle.

`POST /api/v1/routing/route` (authenticated) returns an OSRM-compatible road geometry, distance, and duration. `ROUTING_ENGINE_URL` must point to a configured private or contracted OSRM-compatible endpoint. In production, offer creation requires a successful route and persists the returned geometry, distance, duration, source, and computed arrival time; missing or failed routing returns 503. Local development can create explicitly marked `development_unrouted` fixtures for tests only.

`GET /api/v1/places/suggest?q=Стрий` (authenticated) requests up to six Ukrainian suggestions from a configured Nominatim-compatible `GEOCODING_ENGINE_URL`. The API validates coordinates and returns provider identifiers and labels. Production refuses non-HTTPS geocoder URLs. Without a contracted/self-hosted provider the route returns 503; the client does not substitute guessed coordinates. Search is rate limited separately.

`POST /api/v1/auth/otp/request` and `POST /api/v1/auth/otp/verify` implement phone challenge enrollment. OTP codes are hashed, expire after five minutes, permit five attempts, and have a one-minute resend cooldown plus a per-phone hourly cap. The no-network OTP provider is allowed only with `NODE_ENV=development` and `AUTH_DEV_OTP=true`; production Twilio delivery requires account credentials and a verified sender. Verify returns a short-lived opaque bearer token and an HttpOnly refresh cookie. `POST /api/v1/auth/refresh` rotates refresh credentials and revokes a token family on reuse; `POST /api/v1/auth/logout` and `/logout-all` revoke sessions.

`GET|PATCH /api/v1/users/me` reads and updates the authenticated profile. `POST /api/v1/users/me/roles` permits self-enabling only passenger/driver roles without changing user identity. `GET /api/v1/users/me/export` exports account records; `POST /api/v1/users/me/deletion-requests` creates a pending request without immediately disabling the account. `GET /api/v1/bookings` returns bookings where the caller is a passenger or driver.

## Reverse marketplace

`POST /api/v1/demands` (passenger role) stores a passenger request with coordinates selected from the place geocoder, a maximum seven-day time window, passenger count, optional budget basis (`total_all` or `per_seat`), notes, and boolean requirements. `GET /api/v1/demands/mine` returns the caller's requests and pending proposal counts. `GET /api/v1/demands` (driver role) returns open requests other than the driver's own. `POST /api/v1/demands/:id/cancel` is owner-only and idempotent while cancelled. Driver demand results are not yet ranked by route compatibility.

`GET /api/v1/demands/:id/proposals` returns proposals to the passenger who owns the demand, or only the caller's own proposal to a participating driver. An eligible driver may call `POST /api/v1/proposals/:id/agree` after a passenger counter-offer; it records an immutable driver revision at that price and does not create a booking. A passenger must still call `POST /api/v1/proposals/:id/accept`. That final endpoint rejects a passenger's unconfirmed counter-offer.

`POST /api/v1/demands/:id/proposals` (driver role) creates a price/time proposal using the caller's verified vehicle. The proposal price is the total agreed amount in minor UAH units. It expires no later than the demand's time window.

`POST /api/v1/proposals/:id/counter` lets only a participant counter; turns must alternate between driver and passenger. Each revision is persisted, and positive amounts are required. `GET /api/v1/proposals/:id/revisions` exposes the history only to negotiation participants.

`POST /api/v1/proposals/:id/accept` is passenger-only. In one database transaction it resolves the demand, rejects competing proposals, creates the matched offer and booking, consumes seats, opens the conversation and writes an audit event. Repeated acceptance is rejected after the first commit.

## Bookings

All booking routes require `Authorization: Bearer <session-token>`. Access and refresh tokens are stored only as SHA-256 hashes in `sessions`. Real OTP delivery is still a launch blocker. Local development can opt into `x-dev-user-id` only when both `NODE_ENV=development` and `AUTH_DEV_BYPASS=true`.

`POST /api/v1/bookings`

Headers: `Idempotency-Key` (16–128 characters). JSON body: `{ "offerId": "<uuid>", "seats": 1 }`. The backend prices from the offer row and uses a row lock and transaction to prevent overselling. Repeated requests with the same key return the original booking.

`POST /api/v1/bookings/:id/cancel`

Cancels a confirmed booking owned by the caller and restores its seats exactly once. Other booking states cannot be cancelled through this endpoint.

`GET /api/v1/bookings/:id/ticket` issues a short-lived HMAC-signed, PII-free ticket to a booking participant. The driver posts the token to `POST /api/v1/bookings/:id/boarding`; driver-only `POST /api/v1/bookings/:id/start` advances a boarded booking to `in_progress`. Driver and passenger must each confirm `POST /api/v1/bookings/:id/complete` before state becomes `completed`. `GET /api/v1/bookings/:id/events` returns the participant-scoped transition history. Reviews are accepted at `POST /api/v1/bookings/:id/reviews` only after both completion confirmations; one review per participant, rating 1–5. Offer search returns the server aggregate rating and count; new drivers have zero reviews rather than a seeded rating.

## Conversations

`GET /api/v1/bookings/:id/conversation` returns the conversation only to a booking participant. `GET /api/v1/conversations/:id/messages` returns persisted participant-only history, and `POST /api/v1/conversations/:id/messages` stores a message after checking membership. Delivery is request/response only; WebSocket and push updates are not implemented.

Responses use `{ "data": ... }`; errors use `{ "error": { "code", "message", "requestId" } }`. This is the current API surface, not a claim of full OpenAPI coverage. OpenAPI generation remains unimplemented.

The production PWA uses OTP sign-in, server offer search/booking, booking history and participant chat, profile/vehicle CRUD, vehicle-document submission, staff review, and reverse-marketplace demand/proposal endpoints. Place search needs `GEOCODING_ENGINE_URL`; without it, the demand form cannot publish a request. Driver proposals require an authorized verified vehicle; the review workflow is implemented but private storage and operational staff provisioning remain blockers. Demand matching by road corridor, driver offer publishing UI, vehicle photos in the new screen, navigation, and WebSocket delivery are not implemented.
