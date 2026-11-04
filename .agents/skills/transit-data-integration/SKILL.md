---
name: transit-data-integration
description: Superseded pointer. Use marshgo-provider-discovery for MARSHGO feed and API evaluation.
---

# Transit data integration — superseded

Superseded by `marshgo-provider-discovery` on 2026-11-03. Load that skill instead; this stub keeps older task notes and git history resolvable.

Moved with code citations: the GTFS `route_type` normalisation table (`MarshGO-Server/server/mobility/gtfs.ts:10-21`, including extended values 700s bus / 800 trolleybus / 900s tram and the Ukrainian name heuristics) and the realtime freshness rule `MAX_FEED_AGE_MS = 90_000` (`MarshGO-Server/server/journey/gtfsRealtime.ts:11`).

For feed registration, license and coverage work use the `transit-data-integration` entry points only as a name — the current procedure is in `marshgo-provider-discovery` and `marshgo-release`.
