# Production release checklist

## Local foundation

- [x] Existing workspace audited before implementation; existing edits preserved.
- [x] Production frontend fails closed instead of showing seeded demo records.
- [x] Local PostgreSQL/PostGIS and Redis Compose services with persistent volumes.
- [x] Initial relational schema includes users, vehicles, geospatial offers/demands, bookings, proposals, conversations, messages, sessions, OTP challenges, and audit events.
- [x] API liveness/readiness and database-backed offer search.
- [x] Transactional seat decrement, per-user idempotency, ownership checks, and idempotent cancellation API.
- [x] Demand/proposal/counter history and one-time proposal acceptance that atomically creates the resulting booking.
- [x] Participant-scoped persistent message history and send APIs.
- [ ] Verify migration and transaction concurrency tests against a running local PostgreSQL instance.

## Required before staging

- [ ] OTP provider integration and secure session issuance/revocation.
- [ ] Server APIs for user registration, vehicle verification, demand cancellation, reviews, and trip lifecycle.
- [ ] WebSocket/push delivery for messages, proposal changes, and booking events.
- [ ] Connect frontend to authenticated APIs; remove production gate only after this client path is verified.
- [ ] Geographic search and routing engine with real route geometry/ETA.
- [ ] Shared rate limiting, file storage, privacy/deletion policy, and security review.
- [ ] API integration tests, parallel last-seat test, E2E flows on two separate accounts/devices.
- [ ] CI, TLS, deployment manifests, staging, backups/restore, monitoring, and rollback drill.

## External owner inputs

- [ ] SMS account/provider and verified sender.
- [ ] Staging/production host, domain, and secret-management account.
- [ ] Decide self-hosted or contracted routing/geocoding source.
- [ ] Payment and partner contracts before enabling those services.

Production release is blocked until every required staging item is completed and the two-phone acceptance flow passes against staging.
