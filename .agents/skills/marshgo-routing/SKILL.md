---
name: marshgo-routing
description: Apply MARSHGO multimodal routing invariants and objective-specific tests to GTFS and provider journeys.
---

# MARSHGO Routing

- Reuse `multimodal-routing-engine`; keep its search, transfer, and candidate-retention decisions evidence-based.
- Preserve distinct OPTIMAL, FASTEST, and known-fare CHEAPEST witnesses; unknown fare must not rank as zero.
- Respect service calendars, timezone, GTFS times beyond 24:00, direction, transfers, pathways, realtime validity, and walk limits.
- Route geometry and booking capability must follow the selected segment and provider; a planned leg is not a reservation.
- Use deterministic small-feed tests before bounded real-feed probes; watch CPU/RAM on dense feeds.
