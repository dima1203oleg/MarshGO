# MARSHGO Mobility Platform Architecture

## 1. High-Level Architecture Overview

MARSHGO is engineered as an integrated mobility platform tailored to Ukraine's urban and intercity transport ecosystem. It decouples client user interactions from underlying heterogeneous transportation providers through a unified capability-oriented integration layer.

```
                 MARSHGO CLIENTS
            Web / iOS / Android
                     │
                     ▼
               MARSHGO API Gateway
            Express / SSE Realtime
                     │
                     ▼
               Mobility Core
                     │
   ┌─────────────────┼──────────────────┐
   │                 │                  │
Places           Trip Planner       Ride Matching
   │                 │                  │
   ├─ Geocoding      ├─ Road Routing    ├─ Drivers
   ├─ POI            ├─ Transit         ├─ Passengers
   └─ Parking        ├─ Multimodal      ├─ Detours
                     └─ Navigation      └─ Live Matching
   │                 │                  │
   └─────────────────┼──────────────────┘
                     ▼
              Provider Layer
                     │
   ┌──────────┬──────────┬──────────────┐
   │          │          │              │
Kyiv GTFS  Lviv GTFS  Routing APIs  Partner APIs
   │          │          │              │
   └──────────┴──────────┴──────────────┘
                     ▼
             Normalized Storage
             PostgreSQL/PostGIS
                  Redis
                     │
                     ▼
         Realtime Events / Cache
```

## 2. Core Architectural Principles

1. **Adapter Isolation**: External APIs and data feeds never communicate directly with domain business logic. Every external provider is encapsulated within an isolated adapter that conforms to `shared/mobility/interfaces.ts`.
2. **Capability-Gated Features**: The user interface never renders active booking, ordering, or dispatch capabilities for providers that lack verified commercial contracts or live endpoints.
3. **UTC Everywhere with Local Display**: All timestamps are stored and manipulated in UTC internally, converted to `Europe/Kyiv` exclusively at the presentation boundary.
4. **Resilient Data Ingestion**: Open-data feeds (GTFS, GTFS-RT, GeoJSON) are ingested asynchronously by isolated workers with strict SSRF filtering, memory limits, and atomic version activation. Failure of an ingestion feed leaves the last valid dataset active.
5. **Privacy-Preserving Telematics**: Driver locations and passenger rendezvous points are only exposed within active, verified navigation sessions within a 15-minute geofenced activation window.

## 3. Subsystem Breakdown

- **Places & Geocoding**: Reverse and forward geocoding with OpenStreetMap Nominatim and local caching.
- **Trip Planner**: Multi-modal journey planner (`server/journey/planner.ts`) synthesizing transit timetables, walking legs, and carpool rides into ranked options (`FASTEST`, `CHEAPEST`, `BALANCED`).
- **Ride Matching**: Spatial candidate indexing and multi-passenger detour insertion engine (`server/navigation/stopOptimizer.ts`) enabling passive en-route carpool matching for drivers without prior manual listing.
- **Provider Layer**: `MobilityRegistryService` (`server/mobility/registryService.ts`) maintaining real-time health, access statuses, and capabilities across Ukrainian municipal open-data feeds and commercial providers.
