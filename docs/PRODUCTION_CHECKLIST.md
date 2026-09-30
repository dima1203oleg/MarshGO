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
- [x] Private booking-scoped safety report intake, staff moderation queue, audited reviewer decisions, and administrator-only suspension.
- [x] Local PostGIS migration and booking concurrency tests, including 20 simultaneous independent users competing for the final seat, one idempotent winner, 19 controlled conflicts, parameter-mismatch rejection, and cancellation that restores inventory exactly once.
- [x] Node 24.21.0 LTS runtime pin, CI lint/typecheck/unit-test/build, OSRM-compatible adapter contract test.
- [x] Production PWA OTP, server search, offer publishing, garage, booking/history, reverse-demand proposal, and booking-chat screens use authenticated APIs.
- [x] Foreground iOS navigation uses real GPS and road geometry; opt-in match flow requires verified vehicle and mutual interest before the existing proposal flow.
- [x] Capacitor iOS target builds, installs, and launches on iPhone 15 Pro Max and iPhone 16 Pro Max / iOS 27 simulators; welcome-screen screenshots confirm the hero image, native status bar, and safe-area layout.
- [x] Native API CORS allows the Capacitor `capacitor://localhost` origin; integration test covers the response header.

## Required before staging

- [ ] Configure/test real OTP provider, sender identity, secure session policy, and staging HTTPS same-site API routing.
- [ ] Configure private, encrypted vehicle/document storage and operate verification review with approved staff, retention, and malware scanning.
- [x] Booking lifecycle API with signed boarding ticket, participant completion confirmations, and completed-trip reviews.
- [x] Authenticated WebSocket delivery across API instances via Redis Pub/Sub; shared 30-second one-use tickets use Redis `GETDEL`; account logout closes remote sockets; two-process integration and browser replay E2E pass.
- [x] Server-backed user blocking from a confirmed booking chat, private blocked-user list, and unblock flow; E2E verifies blocked message denial and restored chat after unblock.
- [x] Transactional PostgreSQL outbox for chat messages with deduplication, multi-worker leases, retry/backoff, and seven-day published-record retention.
- [x] Transactional PostgreSQL outbox for booking state and proposal negotiation/closure events, with REST resync as canonical state.
- [x] Staff-only outbox queue age/depth metrics and Redis readiness reporting; controlled invalid-event retry/backoff integration test.
- [ ] Redis outage recovery runbook/drill, external alerting, and Web Push for messages, proposals, bookings, navigation matches and rescue.
- [x] Connect passenger demand/proposal negotiation and booking-scoped chat to authenticated APIs.
- [x] Production trip screen supports signed ticket handoff, driver boarding/start, and two-party completion using server state and realtime refresh; covered in two-account E2E.
- [ ] Add native QR generation/scanning and completion-review UI; navigation candidate conversion still needs an integrated booking/waypoint flow and requires foreground connectivity.
- [ ] Configure production routing/geocoding services and implement corridor/multi-stop search and rerouting.
- [ ] Configure a real map-tile provider. Navigation currently shows returned route geometry over a neutral canvas and displays an explicit missing-map warning.
- [ ] Shared rate limiting, object storage, deletion/retention processing, and security review.
- [x] Local mobile-sized browser E2E: two independent contexts, local OTP/geocoder, server search, booking, shared seats, negotiation, role/ownership check, real-time chat delivery and persisted replay.
- [ ] Staging and physical-device acceptance with two independent accounts and real provider credentials.
- [ ] Staff response policy, coverage schedule, incident escalation and physical safety response procedures for reports and blocked active bookings.
- [ ] Interactive iOS simulator sign-in/booking run and physical-device session persistence check.
- [ ] CI, TLS, deployment manifests, staging, backups/restore, monitoring, and rollback drill.

## External owner inputs

- [ ] SMS account/provider and verified sender.
- [ ] Staging/production host, domain, and secret-management account.
- [ ] Decide self-hosted or contracted routing/geocoding source.
- [ ] Payment and partner contracts before enabling those services.

Production release is blocked until every required staging item is completed and the two-phone acceptance flow passes against staging.
