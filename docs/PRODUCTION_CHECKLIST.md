# Production release checklist

## Local foundation

- [x] Existing workspace audited before implementation; existing edits preserved.
- [x] Production entry point does not execute or display the seeded local demo workflows.
- [x] Local PostgreSQL/PostGIS and Redis Compose services with persistent volumes.
- [x] Additive schema includes users/roles/sessions/OTP, vehicles, geospatial offers/demands, bookings, proposals, conversations, messages, and audit events.
- [x] API liveness/readiness and database-backed city/date/seat offer search.
- [x] Transactional seat decrement, per-user idempotency, ownership checks, and idempotent cancellation API.
- [x] Demand/proposal/counter history, driver agreement on passenger counters, and explicit passenger confirmation that atomically creates the booking.
- [x] Participant-scoped persistent message history and send APIs.
- [x] Staff-guarded vehicle verification queue, private evidence upload contract, document decisions, and vehicle gating after both required approvals.
- [x] Local PostGIS migrations and transaction concurrency tests, including OTP/session and last-seat contention.
- [x] Node 24.21.0 LTS runtime pin, CI lint/typecheck/unit-test/build, OSRM-compatible adapter contract test.
- [x] Production PWA OTP, server search, offer publishing, garage, booking/history, reverse-demand proposal, and booking-chat screens use authenticated APIs.
- [x] Foreground iOS navigation uses real GPS and road geometry; opt-in match flow requires verified vehicle and mutual interest before the existing proposal flow.
- [x] Capacitor iOS target builds, installs, and launches on iPhone 18 Pro / iOS 27 simulator; reference-aligned welcome screen confirmed in screenshot.

## Required before staging

- [ ] Configure/test real OTP provider, sender identity, secure session policy, and staging HTTPS same-site API routing.
- [ ] Configure private, encrypted vehicle/document storage and operate verification review with approved staff, retention, and malware scanning.
- [x] Booking lifecycle API with signed boarding ticket, participant completion confirmations, and completed-trip reviews.
- [ ] WebSocket/push delivery for messages, proposal changes, and booking events.
- [x] Connect passenger demand/proposal negotiation and booking-scoped chat to authenticated APIs.
- [ ] Finish driver booking lifecycle controls; proposal/booking state sync from navigation currently requires manual refresh and foreground connectivity.
- [ ] Configure production routing/geocoding services and implement corridor/multi-stop search and rerouting.
- [ ] Shared rate limiting, object storage, deletion/retention processing, and security review.
- [ ] Browser E2E flows and physical-device tests with two independent accounts.
- [ ] Interactive iOS simulator sign-in/booking run and physical-device session persistence check.
- [ ] CI, TLS, deployment manifests, staging, backups/restore, monitoring, and rollback drill.

## External owner inputs

- [ ] SMS account/provider and verified sender.
- [ ] Staging/production host, domain, and secret-management account.
- [ ] Decide self-hosted or contracted routing/geocoding source.
- [ ] Payment and partner contracts before enabling those services.

Production release is blocked until every required staging item is completed and the two-phone acceptance flow passes against staging.
