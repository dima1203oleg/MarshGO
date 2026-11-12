# MARSHGO Provider Registry Specification

## 1. Registry Purpose & Model

The `ProviderRegistry` acts as the single source of truth for all integrated transport operators, municipal open data feeds, commercial ride-hailing services, and payment gateways.

Each provider is modeled according to the normalized `ProviderRegistryEntry` schema:

```typescript
type ProviderRegistryEntry = {
  id: string;
  name: string;
  category: ProviderCategory;
  cities: string[];
  integrationType: "OPEN_DATA" | "PUBLIC_API" | "PARTNER_API" | "INTERNAL";
  accessStatus: "AVAILABLE" | "REQUIRES_KEY" | "REQUIRES_CONTRACT" | "UNVERIFIED" | "BLOCKED";
  runtimeStatus: "HEALTHY" | "DEGRADED" | "STALE" | "OFFLINE" | "NOT_CONFIGURED";
  capabilities: string[];
  documentationUrl?: string;
  requiresAuth: boolean;
  enabled: boolean;
  license?: string;
  updateFrequency?: string;
  coverage?: string;
  sourceAttribution?: string;
  lastVerifiedAt?: string;
};
```

## 2. Capability Contracts

Capabilities dictate what actions the client application is permitted to render:
- `TRANSIT_TIMETABLE`: Display scheduled departures and stop times.
- `TRANSIT_ROUTES` & `TRANSIT_STOPS`: Draw lines and stations on the MapLibre canvas.
- `LIVE_VEHICLE_POSITIONS`: Render real-time vehicle icons with bearing and fresh timestamps.
- `RIDE_ESTIMATES`: Fetch price and ETA estimates for taxis/ride-hailing.
- `BOOKING_DISPATCH`: Enable in-app or deep-linked ride booking.
- `GBFS_STATION_STATUS`: Show shared bike/scooter docks and available vehicles.
- `PARKING_LOCATIONS`: Display public parking spots, tariffs, and operators.
- `ROAD_CLOSURES`: Display road construction, blockades, and restrictions.

## 3. Operational Invariants

- If `accessStatus !== 'AVAILABLE'` or `enabled === false`, the UI will NOT display active booking buttons or simulate live presence.
- Real-time telemetry is annotated with provenance (`LIVE GPS`, `За розкладом`, `Розрахунковий ETA`).
- Health checks are polled and refreshed by `server/mobility/healthMonitor.ts` with error metrics logged to the registry.
