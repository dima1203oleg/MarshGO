# Lviv Transport Integration Specification

## 1. Official Data Sources (Lvivavtodor & Lviv City Council)

Lviv is powered by high-frequency open feeds provided by Lvivavtodor and Lviv City Open Data:

### GTFS Static Schedule
- **Endpoint**: `https://track.ua-gis.com/gtfs/lviv/static.zip`
- **Catalog ID**: `mdb:ua-lviv-lvivavtodor-gtfs-2374`
- **License**: Open Data Portal of Lviv City (`opendata.city-adm.lviv.ua`)
- **Coverage**: Trams, trolleybuses, and municipal buses across the Lviv urban community.

### GTFS Realtime Telemetry
- **Vehicle Positions**: `https://track.ua-gis.com/gtfs/lviv/vehicle_position` (Protobuf encoded GTFS-RT feed polled every 15 seconds).
- **Trip Updates & Delays**: `https://track.ua-gis.com/gtfs/lviv/trip_updates`.

### Micromobility (Nextbike Lviv)
- **GBFS Discovery Feed**: `https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_lv/gbfs.json`.
- Exposes station docks, available mechanical/electric bikes, and geofenced return zones.

## 2. Ingestion & Freshness Guarantees

1. **Protocol Security**: All endpoints connect via TLS/HTTPS.
2. **Freshness Assessment**:
   - Vehicles with timestamp older than 120 seconds are flagged as `STALE`.
   - If feed header timestamp is older than 5 minutes, real-time indicators drop back to scheduled timetable mode.
3. **Spatial Filtering**: Positions outside Lviv bounding box `[23.8, 49.7, 24.2, 50.0]` are rejected to eliminate GPS drift artifacts.
