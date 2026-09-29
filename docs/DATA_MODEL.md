# MARSHGO data model status

The PostgreSQL schema is managed by ordered SQL migrations in `server/migrations/`. Local state was created with PostGIS; production data must not be seeded from `src/data/seedData.ts`.

## Implemented tables

| Domain | Tables | Current invariants |
| --- | --- | --- |
| Identity | `users`, `user_roles`, `sessions`, `otp_challenges`, `driver_profiles`, `verification_records`, `account_deletion_requests` | Unique E.164 phone; roles are normalized; access and refresh credentials are hashed; OTP challenge expiry and attempt state are stored. |
| Garage | `vehicles`, `vehicle_photos` | Owner FK; seat bounds; one active non-archived car per owner; archive preserves historic references. Photo metadata exists, upload/storage does not. |
| Marketplace | `offers`, `bookings`, `booking_events`, `booking_completion_confirmations`, `reviews` | Offer points and optional road LineString use SRID 4326; prices are integer minor units; capacity is checked; booking idempotency is unique per passenger; state transitions and two-party completion confirmations are persisted; reviews require completed bookings. |
| Demand | `passenger_demands`, `proposals`, `proposal_revisions` | Time window and passenger bounds; immutable price/time revisions; one accepted proposal per demand. |
| Messaging | `conversations`, `conversation_members`, `messages` | Conversation membership binds access to booking participants; message bodies have length constraints. |
| Operations | `audit_events` | Critical backend actions are recorded with actor, entity, action, and timestamp. |

## Migration history

* `001_initial.sql` — PostGIS, users, vehicles, offers, bookings, demand, proposals, chat, OTP/session baseline, and audit events.
* `002_reverse_marketplace.sql` — proposal vehicle/time fields, revisions, accepted-proposal uniqueness.
* `003_identity_auth.sql` — normalized roles, account state, refresh sessions, verification and deletion records.
* `004_vehicle_garage.sql` — active/archived car state and owner indexes.
* `005_offer_routes.sql` — route-derived arrival, distance, duration, and source.
* `006_vehicle_photo_primary.sql` — at most one primary image per vehicle.
* `007_booking_lifecycle_reviews.sql` — boarding/in-progress states, immutable booking transitions, two-party completion, and completed-booking reviews.

## Not yet modeled or incomplete

No persistent geocoder place registry, route stops, vehicle photo object lifecycle/cleanup job, location-event retention, navigation sessions/match candidates, push subscriptions/outbox, partner inventory, financial ledger, user blocks/moderation workflows, or migration rollback rehearsal exists yet. These are tracked as incomplete in `docs/PRODUCTION_AUDIT.md` and must not be inferred from UI components.
