# Kyiv Transport Integration Specification

## 1. Official Data Sources (data.kyivcity.gov.ua)

Kyiv transit infrastructure is connected via the official Kyiv City Open Data Portal (CKAN):

### Transit Lines & Geometries (GeoJSON over HTTPS)
- **Bus & Marshrutka Routes**: Resource `77325f5c-57d0-4f79-844a-cc73675f9743`. Geometries for all regular urban bus lines.
- **Kyiv Metro Lines**: Resource `5e385793-58e2-49eb-b856-a963dd7486bb`. Line tracks and segment shapes.
- **Kyiv Metro Stations**: Resource `93a62dca-e442-43b6-a00e-112c7eb6c13f`. Station names, coordinates, and lines.
- **Kyiv City Express (Urban Electric Train)**: Resource `a4fd8556-025a-4e14-bc75-99e4c018d2b9` (route geometries) and `c6f814de-7364-4ac9-937f-1d6956f0f977` (stops/platforms).
- **Kyiv Funicular**: Resource `f6f83ab2-3818-4d8c-93db-19dcda89cce9` (track geometry) and `984462ae-86cd-40b8-a3f5-68064a97408d` (stations).

### Municipal Services & Infrastructure
- **Municipal Parking Facilities**: CKAN datastore search resource `5f34f3aa-c9de-4415-8419-3adb7561c4a3`. Operated by Kyivtransparkservis; provides address, tariff, capacity, and coordinates.
- **Road Closures & Traffic Restrictions**: CKAN datastore search resource `8a29f5a0-ca04-4058-b2af-4c75aef13550`. Maintained by the Department of Transport Infrastructure.

### GTFS Static Schedule
- Insecure HTTP endpoints (e.g. `http://193.23.225.211:8002/export-gtfs-static`) are blocked per security policy.
- Verified HTTPS mirror: `https://jbb.ghsq.de/gtfs/ua-kyiv.gtfs.zip` (Kyivpasstrans open data, daily updates).

## 2. Ingestion Pipeline & Safety Controls

1. **SSRF Guard**: All requests validate the destination hostname via `assertPublicHttpsUrl()` in `server/mobility/safeFetch.ts`.
2. **Atomic Ingestion**: Ingested feeds are validated against Kyiv bounding box `[30.2, 50.2, 30.8, 50.6]`. Out-of-bounds fixes are discarded.
3. **Decimation**: High-density coordinate tracks are decimated via `decimate()` in `server/mobility/transportLayers.ts` to ensure 60fps rendering in MapLibre GL.
