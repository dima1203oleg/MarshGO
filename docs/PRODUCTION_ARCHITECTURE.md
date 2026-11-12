# MARSHGO Production Architecture

## Runtime shape

MARSHGO is currently a TypeScript modular monolith: React/Vite PWA, Express API, PostgreSQL/PostGIS, Redis Pub/Sub, PostgreSQL transactional outbox, and a foreground Capacitor iOS wrapper. Navigation state is reduced by a serializable UI-independent core. MapLibre is lazy loaded behind the map adapter; OSRM-compatible routing and geocoding are server adapters. The server remains authoritative for bookings, proposal acceptance, seat inventory, navigation sessions, and passenger matches.

The local Compose file is a developer/test dependency stack, not a production deployment. No production host, TLS termination, managed database/Redis, object storage, alerting, or secret manager is configured in this workspace.

## Trust boundaries and provider constraints

- Clients receive only MARSHGO API endpoints; paid keys remain server-side.
- Routing output is normalized and geometry is sent as polyline6 through `/api/v1/routing/calculate`.
- GPS is foreground-only in the current web/iOS wrapper. Background navigation, native voice and physical-device verification remain release gates.
- Passenger-demand candidate filtering uses PostGIS route geography and bounded stop optimization. Demand endpoint indexes are installed by migration 025.
- Redis is used for ephemeral cross-instance realtime/tickets/rate limits; PostgreSQL persists business state and outbox events.
- Public OSRM, Nominatim and OpenFreeMap services were used only for a low-volume acceptance probe. Their public instances do not provide MARSHGO a production SLA. Production requires contracted/self-hosted routing and geocoding, and MARSHGO-owned versioned style/data manifests and tile delivery.

## State and event semantics

PostgreSQL transactions guard shared state and emit outbox records. Delivery is at-least-once; consumers deduplicate by event identity and aggregate version. GPS, camera and map animation remain client-local; booking, negotiated prices, accepted matches, ordered stops and journey lifecycle remain server-owned. Offline navigation can display the cached route, but booking/matching and current traffic/ETA are unavailable.

## Deployment topology required

Use separately deployable web and API containers behind a TLS reverse proxy. API instances share managed PostgreSQL/PostGIS and Redis; migrations run once as a release job before traffic shifts. Private object storage is required for vehicle verification evidence. Static map/style assets must use immutable versioned URLs. Health checks must distinguish liveness from database/Redis readiness. See [DEPLOYMENT.md](DEPLOYMENT.md) and [ENVIRONMENT.md](ENVIRONMENT.md).
