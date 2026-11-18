---
name: marshgo-provider-discovery
description: Evaluate transport feeds and APIs for legal use, coverage, freshness, health, and real product capability.
---

# MARSHGO Provider Discovery

- This skill owns feed evaluation; ingestion code lives in `MarshGO-Server/server/mobility/` and `server/journey/` — read it rather than an older integration note.
- Route-type normalisation lives in `MarshGO-Server/server/mobility/gtfs.ts:10-21` and accepts both base and extended GTFS values (0/900s tram, 1/400s metro, 2/100s rail, 3/700s bus, 11 and 800 trolleybus, 106/109 suburban, 4 ferry) plus Ukrainian name heuristics for funicular, marshrutka and city train. Add a feed by extending that mapping, never by hardcoding a city.
- Realtime freshness is a single decision: `MAX_FEED_AGE_MS = 90_000` in `MarshGO-Server/server/journey/gtfsRealtime.ts:11`, reported as `AVAILABLE | STALE | UNAVAILABLE | NOT_CONFIGURED | TEMPORARILY_UNAVAILABLE`. A stale feed must degrade the UX label, not break journey rendering.
- Distinguish static schedules, realtime positions/arrivals, rental availability, fares, deep links, booking, cancellation, and tracking.
- For each claimed provider record owner, coverage, license/commercial rights, auth, limits, freshness, probe evidence, and actual product use.
- A URL, adapter, static OSM feature, or fixture is not proof of a live production provider.
- Keep unavailable categories honest; do not invent offers, fares, vehicles, or coverage.
