# Production release checklist

## Local foundation

- [x] Existing workspace audited before implementation; existing edits preserved.
- [x] Production entry point does not execute or display the seeded local demo workflows.
- [x] Local PostgreSQL/PostGIS and Redis Compose services with persistent volumes.
- [x] Additive schema includes users/roles/sessions/OTP, vehicles, geospatial offers/demands, bookings, proposals, conversations, messages, and audit events.
- [x] API liveness/readiness and database-backed city/date/seat offer search.
- [x] Transactional seat decrement, per-user idempotency, ownership checks, and idempotent cancellation API.
- [x] Demand/proposal/counter history and one-time proposal acceptance that atomically creates the resulting booking.
- [x] Participant-scoped persistent message history and send APIs.
- [x] Local PostGIS migrations and transaction concurrency tests, including OTP/session and last-seat contention.
- [x] Node 24.21.0 LTS runtime pin, CI lint/typecheck/unit-test/build, OSRM-compatible adapter contract test.
- [x] Production PWA OTP, server search, booking, and booking-history vertical slice.

## Required before staging

- [ ] Configure/test real OTP provider, sender identity, secure session policy, and staging HTTPS same-site API routing.
- [ ] Configure private vehicle photo storage and complete verification review; implement demand cancellation API.
- [x] Booking lifecycle API with signed boarding ticket, participant completion confirmations, and completed-trip reviews.
- [ ] WebSocket/push delivery for messages, proposal changes, and booking events.
- [ ] Connect production driver garage/publishing, demand, chat, navigation, and matching screens to authenticated APIs.
- [ ] Configure production routing service and implement geocoded corridor/multi-stop search and rerouting.
- [ ] Shared rate limiting, object storage, deletion/retention processing, and security review.
- [ ] Browser E2E flows and physical-device tests with two independent accounts.
- [ ] CI, TLS, deployment manifests, staging, backups/restore, monitoring, and rollback drill.

## External owner inputs

- [ ] SMS account/provider and verified sender.
- [ ] Staging/production host, domain, and secret-management account.
- [ ] Decide self-hosted or contracted routing/geocoding source.
- [ ] Payment and partner contracts before enabling those services.

Production release is blocked until every required staging item is completed and the two-phone acceptance flow passes against staging.
