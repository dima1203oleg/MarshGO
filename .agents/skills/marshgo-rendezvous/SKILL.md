---
name: marshgo-rendezvous
description: Verify the real passenger-driver pickup and rideshare journey lifecycle in MARSHGO.
---

# MARSHGO Rendezvous

- Treat synthetic driver/GPS simulation as demo-only and label it visibly.
- Keep passenger and driver GPS consent separate; do not publish precise location before consent and an eligible active trip.
- Verify server-authoritative offer, booking, seat count, pickup, boarding, completion, cancellation, chat, and notification transitions.
- Use idempotency and ownership checks; never fabricate payment, verification, availability, or ETA.
- Exercise lifecycle tests only with isolated fixtures/accounts and report real-device checks separately.
