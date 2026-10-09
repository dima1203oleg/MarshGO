# End-to-End & Integration Test Verification Report

**Date of Execution:** 08.10.2026  
**Test Harness:** Node.js native test runner (`node --test`), Vite production build validator (`vite build`)

---

## 1. Automated Test Results Summary

- **Total Test Suites:** 42
- **Total Tests Executed:** 160
- **Passed Tests:** 159
- **Failed Tests:** 0
- **Skipped Tests:** 1 (Opt-in local integration test requiring running Redis cluster instance)
- **Execution Time:** ~1.1 seconds

---

## 2. Verification Scenarios & Statuses

| # | Test Scenario | Category | Status | Verification Detail |
|---|---|---|---|---|
| 1 | MapLibre vector style switching | Cartography | **PASS** | Validates OpenFreeMap styles (`positron`, `bright`, `dark`). |
| 2 | GTFS CSV field & quoted parsing | Open Data | **PASS** | Evaluates multi-column headers and quotes in `stops.txt` and `routes.txt`. |
| 3 | GTFS Route type normalisation | Transit | **PASS** | Maps GTFS route types (0, 1, 2, 3, 11, 715) to Ukrainian transport labels. |
| 4 | JSON vehicle parsing (Dozor/EasyWay/iCity) | Realtime | **PASS** | Validates vehicle telemetry shapes and rejects coordinates outside Ukraine. |
| 5 | Kyiv GeoJSON official normalisation | Transit | **PASS** | Evaluates segment ordering, metro stations, City Express, and funicular modes. |
| 6 | GBFS 2.x and 3.x discovery normalisation | Micromobility| **PASS** | Normalizes vehicle types, available docks, and battery levels. |
| 7 | Spatial nearby asset selection | GIS | **PASS** | Great-circle distance calculations and radius filtering. |
| 8 | Multi-passenger detour insertion | Matching | **PASS** | Enforces capacity constraints, pickup-before-dropoff ordering, and ETA bounds. |
| 9 | Navigation replay & map matching | Navigation | **PASS** | Replays clean routes, location jumps, weak GPS jitter, and offline sessions. |
| 10 | SSRF guard & URL safety validation | Security | **PASS** | Rejects non-HTTPS, credentials in URLs, private subnets (127.0.0.1, 10.x, 192.168.x). |
| 11 | OSRM road routing integration | Routing | **PASS** | Decodes maneuvers, distances, polyline6 geometries, and waypoint order. |
| 12 | Monobank webhook verification | Payments | **PASS** | Verifies signature checks and prevents unauthorized status alterations. |
| 13 | Mobility Provider Registry & capability gating | Platform | **PASS** | Validates that commercial providers without contracts remain disabled. |
