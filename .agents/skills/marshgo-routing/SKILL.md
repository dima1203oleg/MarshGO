---
name: marshgo-routing
description: Apply MARSHGO multimodal routing invariants and objective-specific tests to GTFS and provider journeys.
---

# MARSHGO Routing

- This skill owns the routing invariants; read `server/journey/` for the current algorithm instead of trusting any older routing note.
- Preserve distinct OPTIMAL, FASTEST, and known-fare CHEAPEST witnesses; unknown fare must not rank as zero.
- Respect service calendars, timezone, GTFS times beyond 24:00, direction, transfers, pathways, realtime validity, and walk limits.
- Walk limits are code defaults, not guesses: access 900 m, egress 1000 m, transfer 400 m (`MarshGO-Server/server/journey/gtfsTimetable.ts:38-40`), implicit intermodal station walk 150 m (same file, line 43).
- Transfer penalisation and strategy weights (`fastest` / `cheapest` / `balanced`) must come from the planner's own constants; read them before tuning, and never let an unknown fare rank as zero cost.
- Route geometry and booking capability must follow the selected segment and provider; a planned leg is not a reservation.
- Use deterministic small-feed tests before bounded real-feed probes; watch CPU/RAM on dense feeds.
