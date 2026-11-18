# MARSHGO — Current State Audit & System Inventory
**Date:** 08.10.2026  
**Status:** Comprehensive Baseline Audit  
**Author:** Google Antigravity (Unified Engineering Team)

---

## 1. Executive Summary

An exhaustive audit of the MARSHGO codebase and its associated repositories (`MARSHGO`, `MARSHGO-Server`, `MARSHGO-Site`, `MARSHGO-iOS`) was conducted to evaluate existing capabilities, architectural integrity, and readiness for full nationwide multi-modal mobility integration.

The repository is a mature, production-grade platform featuring:
- High-performance vector cartography via MapLibre GL JS with OpenFreeMap vector styles.
- Custom Navigation Core with dead-reckoning, Kalman-stabilized map matching, and off-route detection.
- High-performance multi-passenger detour routing and passive en-route passenger matching.
- An extensive PostgreSQL + PostGIS database with 40 sequential schema migrations.
- Complete public transit and micromobility ingestion subsystems (GTFS Static zip parsing via `fflate`, GTFS-RT Protobuf parsing, JSON vehicle telemetry, and GBFS 2.x/3.x).
- Ukraine-specific transport catalog (`ukraineCatalog.ts`) containing verified endpoints across Kyiv, Lviv, Dnipro, Ivano-Frankivsk, Rivne, Uzhhorod, and other municipalities.

---

## 2. Component Repositories & Build Configurations

| Repository | Path | Tech Stack | Branch / Remote | Role & Build System |
|---|---|---|---|---|
| **MARSHGO** | Root (`/`) | React 19, TypeScript, Vite 8, Tailwind/Vanilla CSS tokens, MapLibre GL JS | `origin/main` (`https://github.com/dima1203oleg/MarshGO.git`) | Unified monorepo containing Web app, Node.js server, shared contracts, and tests. |
| **MARSHGO-Server** | `MarshGO-Server/` | Node.js, Express, PostgreSQL, PostGIS, Redis, TypeScript | `origin/codex/sync-mobility-registry` | Standalone server build pipeline and microservice packaging. |
| **MARSHGO-Site** | `MarshGO-Site/` | React, Vite, TypeScript | `origin/codex/sync-journey-mobility-ui` | Marketing and public landing portal with embedded journey previews. |
| **MARSHGO-iOS** | `MarshGO-iOS/` | Capacitor, Swift, iOS Native | `origin/codex/reliable-capacitor-sync` | Native iOS wrapper and location permission bridge. |

---

## 3. Functionality Audit Matrix

| # | System Component | Status | Detailed Evaluation & Evidence |
|---|---|---|---|
| 1 | **MapLibre Cartography** | **IMPLEMENTED** | `src/map/MapLibreAdapter.ts` (26KB), `src/map/MarshGoMap.tsx`, `src/map/transportLayers.ts`. Dynamic 2D/3D tilt, OpenFreeMap styles (`positron`, `bright`, `liberty`, `dark`), real-time marker clustering, viewport-based GeoJSON fetching. |
| 2 | **Routing Service (OSRM / Valhalla)** | **IMPLEMENTED** (OSRM) / **PLANNED** (Valhalla) | `server/routing/providers/OsrmRoutingProvider.ts`, `server/routing/providers/osrmTransport.ts`. OSRM CAR profile fully wired with distance, duration, polyline6 geometry, and maneuver decoding. Valhalla planned for multimodal isochrones and walking paths. |
| 3 | **Navigation Core & Map Matching** | **IMPLEMENTED** | `src/navigation/NavigationCore.ts` (10KB), `src/navigation/cameraEngine.ts`, `src/navigation/guidance.ts`, `src/navigation/meeting.ts`, `src/navigation/OffRouteGuard.ts`, `src/navigation/OfflineNavigationStore.ts`. Handles turn-by-turn maneuvers, audio prompts, and GPS jitter rejection. |
| 4 | **Ride & Driver Search** | **IMPLEMENTED** | `src/views/SearchView.tsx`, `server/index.ts` (`/api/v1/offers/search`, `/api/v1/journeys/search`). Full multi-criteria filtering by date, corridor, price, rating, and vehicle equipment. |
| 5 | **Passenger Demand Creation** | **IMPLEMENTED** | `src/views/DemandNewView.tsx`, `server/index.ts` (`/api/v1/demands`). Allows origin/destination, luggage, pets, child seats, price expectations, and passenger count. |
| 6 | **Driver Trip Publication** | **IMPLEMENTED** | `src/views/DriverOfferNewView.tsx`, `server/index.ts` (`/api/v1/offers`). Route geometry generation via OSRM, seat capacity rules, pricing validation, and intermediate pickup stops. |
| 7 | **Passive En-Route Matching** | **IMPLEMENTED** | `server/index.ts` (`/api/v1/navigation/sessions/:id/matching`, `/api/v1/navigation/sessions/:id/matches`), `server/navigation/stopOptimizer.ts`. Spatially indexes passenger demands along driver's live GPS route, computes detour time and detours, proposes pickup waypoints without requiring prior ad publication. |
| 8 | **Backend API & Authentication** | **IMPLEMENTED** | `server/index.ts`, `server/auth/`. Express API, HTTP-only secure cookie sessions, phone OTP with SMS gateway, Firebase JWT verification fallback, rate limiters, role middleware (`driver`, `passenger`, `admin`, `staff`). |
| 9 | **PostgreSQL, PostGIS & Redis** | **IMPLEMENTED** | 40 SQL migrations (`server/migrations/001_initial.sql` to `040_kyiv_geojson_providers.sql`). PostGIS geometry columns, spatial indices (`GIST`), Redis connection pool for cluster-wide rate limiting and caching. |
| 10 | **Realtime Events / SSE** | **IMPLEMENTED** | `server/index.ts` (`/api/v1/realtime`). Server-Sent Events with heartbeat, client auto-reconnect, and Redis/in-memory outbox event dispatching. |
| 11 | **Payment & Booking Lifecycle** | **PARTIALLY_IMPLEMENTED** / **REQUIRES_EXTERNAL_ACCESS** | `server/index.ts`, `server/fees.ts`. Booking state machine (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`). Zero platform fee snapshot for private carpool. Monobank acquiring webhook handler structured; live merchant token required for production activation. |
| 12 | **Production Deployment** | **IMPLEMENTED** | `compose.production.yml`, `Dockerfile.api`, `Dockerfile.web`, Caddy ingress with automated TLS, health check endpoints (`/api/v1/health`, `/api/v1/ready`). |
| 13 | **CI/CD, Migrations & Observability** | **IMPLEMENTED** | `server/migrate.ts` idempotent runner, GitHub Actions CI workflows, Prometheus-compatible metrics endpoint, S3-compatible vehicle document storage (`server/objectStorage.ts`). |

---

## 4. Transit & Open Data Subsystem Audit

### 4.1 Kyiv Municipal Integration
- **GTFS Static / Timetable:** Cataloged in `server/mobility/ukraineCatalog.ts`. Note: Direct IP `http://193.23.225.211:8002/export-gtfs-static` is unencrypted HTTP; mirror `https://jbb.ghsq.de/gtfs/ua-kyiv.gtfs.zip` is available over HTTPS.
- **Official Kyiv City GeoJSON (data.kyivcity.gov.ua):** 
  - Resource `77325f5c-57d0-4f79-844a-cc73675f9743`: Bus & Marshrutka geometries.
  - Resource `5e385793-58e2-49eb-b856-a963dd7486bb`: Metro line geometries.
  - Resource `93a62dca-e442-43b6-a00e-112c7eb6c13f`: Metro stations.
  - Resource `a4fd8556-025a-4e14-bc75-99e4c018d2b9`: Kyiv City Express ring railway.
  - Resource `c6f814de-7364-4ac9-937f-1d6956f0f977`: Kyiv City Express stations.
  - Resource `f6f83ab2-3818-4d8c-93db-19dcda89cce9` & `984462ae-86cd-40b8-a3f5-68064a97408d`: Kyiv Funicular lines and stations.
- **Parking & Road Closures:**
  - Kyiv Parking: Datastore resource `5f34f3aa-c9de-4415-8419-3adb7561c4a3`.
  - Kyiv Road Closures: Datastore resource `8a29f5a0-ca04-4058-b2af-4c75aef13550`.

### 4.2 Lviv Municipal Integration
- **Lvivavtodor GTFS Static:** `https://track.ua-gis.com/gtfs/lviv/static.zip` (verified HTTPS, open data portal license).
- **Lvivavtodor GTFS Realtime:** `https://track.ua-gis.com/gtfs/lviv/vehicle_position` and `trip_updates`.

### 4.3 Additional Ukrainian Cities
- **Dozor platform (GTFS & JSON):** Rivne, Ivano-Frankivsk, Uzhhorod, Kamianets-Podilskyi, Bila Tserkva, Khmelnytskyi, Oleksandriya.
- **EasyWay JSON:** Chervonohrad, Konotop, Poltava.
- **iCity JSON:** Dnipro (`https://api-t900.icity.com.ua/api/gps_data/`).
- **GBFS Micromobility:** Nextbike Lviv, 3electra (Kyiv).

---

## 5. Architectural Dependency Map

```
                  +----------------------------------------------+
                  |         Client Layer (Web / iOS App)         |
                  |  ProductionMarketplace.tsx / MarshGoMap.tsx  |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |           MARSHGO API Gateway                |
                  |  Express / Auth / RateLimiter / SSE Realtime |
                  +----------------------+-----------------------+
                                         |
        +--------------------------------+--------------------------------+
        |                                |                                |
        v                                v                                v
+------------------+           +------------------+           +------------------+
|  Mobility Core   |           |  Matching & Nav  |           | Commercial Layer |
| ProviderRegistry |           | Stop Optimizer   |           | Monobank / Uklon |
| GTFS Ingestion   |           | NavigationCore   |           | Bolt / Uber      |
| GeoJSON Parser   |           | OSRM Routing     |           | GBFS Micromob.   |
+--------+---------+           +--------+---------+           +--------+---------+
         |                              |                              |
         +------------------------------+------------------------------+
                                        |
                                        v
                       +----------------------------------+
                       |        Data Storage Layer        |
                       | PostgreSQL / PostGIS / Redis      |
                       +----------------------------------+
```

---

## 6. Execution Plan & Next Actions

1. **Unify Mobility Core Provider Registry:** Harmonize `src/platform/mobility-core` with `server/mobility` and `server/providers/types.ts` so all external providers share strict capability contracts.
2. **City Datasets Ingestion & Validation Gateways:** Deploy secure ingestion workers for Kyiv Open Data (Parking, Closures, Transit GeoJSON) and Lviv GTFS/GTFS-RT feeds with freshness checks and SSRF guards.
3. **Multimodal Journey Planning Enhancement:** Extend `server/journey/planner.ts` to seamlessly synthesize walking, public transit legs, and MARSHGO carpool offers into the single journey search experience.
4. **Partner Adapter Stubs:** Formalize contract definitions for Taxi (Uber/Uklon/Bolt), Micromobility (GBFS/Nextbike/BikeNow), and Rail (Ukrzaliznytsia timetable integration).
5. **Quality Assurance & Verification:** Validate end-to-end user flows, test suite execution, and produce documentation across all requested paths.
