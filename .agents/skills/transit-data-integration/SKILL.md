---
name: transit-data-integration
description: GTFS, GBFS, realtime telemetry, and open transit feed ingestion standards for Ukrainian cities in MARSHGO.
---

# Transit Data Integration Skill

## Overview
This skill defines standards for ingesting, validating, and updating transit data across Ukrainian cities (Kyiv, Lviv, Dnipro, Odesa, Kharkiv, etc.).

## Key Responsibilities
1. **GTFS Static Ingestion**:
   - `routes.txt`, `trips.txt`, `stops.txt`, `stop_times.txt`, `calendar.txt`, `shapes.txt`.
   - Normalization of route types: 3 (Bus), 0 (Tram), 800 (Trolleybus), 1 (Subway), 2 (Rail).
2. **GTFS Realtime (GTFS-RT)**:
   - VehiclePositions feed processing (GPS coordinates, bearing, current speed, timestamp).
   - TripUpdates feed processing (stop arrival delays, schedule adjustments).
3. **GBFS Micromobility**:
   - Free-floating bikes and scooters (station status, vehicle count, battery levels).
4. **Resilience & Fallbacks**:
   - Detect stale telemetry (>90s) and display appropriate UX indicators without breaking journey rendering.
