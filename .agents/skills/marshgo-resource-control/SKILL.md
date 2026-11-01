---
name: marshgo-resource-control
description: Protect the 8 GB MacBook Pro while coordinating local builds, tests, browsers, Docker, and Antigravity calls.
---

# MARSHGO Resource Control

- Check `memory_pressure`, swap, CPU load, and `df -h /` before heavyweight work; do not kill user processes or delete data.
- Allow one heavy local build/test/browser/Docker/GTFS process at a time; remote read-only review may be parallel if independent.
- GREEN: memory free at least 35% and disk free at least 20 GB. YELLOW: memory 20–34% or disk 8–19 GB; avoid heavy starts. RED: memory below 20% or disk below 8 GB; checkpoint and defer heavy local work.
- Record actual provider-reported model usage and duration. If quota telemetry is absent, label it unknown.
- Never create dummy tasks to keep an agent busy; prefer a useful scoped task or no dispatch.
