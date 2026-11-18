# Feed Health & Telemetry Monitoring Specification

## 1. Overview

To guarantee production reliability across heterogeneous open-data sources, MARSHGO operates active feed health monitoring (`server/mobility/healthMonitor.ts`).

## 2. Monitored Metrics

For each provider and feed URL, the system tracks:
1. **Reachability & Latency**: Round-trip HTTP latency in milliseconds.
2. **Payload Size & Format Validity**: Rejection of files exceeding 5MB or malformed structures.
3. **Entity Count**: Number of valid stops, routes, and vehicles parsed.
4. **Bounding Box Validation**: Center of mass coordinates must reside within Ukraine (`[22.0, 44.0, 41.0, 53.0]`).
5. **Freshness Index**: Difference between current UTC time and the newest vehicle timestamp.

## 3. Health State Transitions

- **HEALTHY**: Responding within SLA (<5000ms), valid data structure, fresh entities.
- **DEGRADED**: Responding with warnings, partial data, or latency between 5000ms and 15000ms.
- **STALE**: Data payload unchanged or timestamp older than freshness threshold. Real-time indicators automatically degrade to scheduled timetable view.
- **OFFLINE**: Consecutive HTTP 4xx/5xx or timeout errors. Provider is automatically de-listed from active rendering without crashing the application.
