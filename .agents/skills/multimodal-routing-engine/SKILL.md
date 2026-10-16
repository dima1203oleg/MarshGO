---
name: multimodal-routing-engine
description: Multi-objective routing, transfer penalization, walk-shed limits, and intermodal chain assembly in MARSHGO.
---

# Multimodal Routing Engine Skill

## Overview
Defines algorithms and heuristics for calculating optimal point-to-point journeys combining walking, micro-mobility, public transit (bus, tram, trolleybus, metro, city train, funicular), taxi, and carsharing across Ukrainian cities.

## Core Rules & Heuristics
1. **Multi-Objective Cost Optimization**:
   - Time weight ($W_t$): 1.0 (baseline journey duration in minutes).
   - Cost weight ($W_c$): Configurable per user strategy (`cheapest`, `fastest`, `balanced`).
   - Transfer penalty ($P_{transfer}$): Add 6 to 10 minutes equivalent perceived penalty per transit transfer to favor direct routes.
2. **Walk-shed Radii**:
   - Maximum first-mile walk: 900 meters (approx. 11 mins).
   - Maximum transfer walk: 400 meters (approx. 5 mins).
   - Maximum last-mile walk: 1,000 meters (approx. 12 mins).
3. **Canonical 12 Transport Hierarchy**:
   - Only produce itineraries respecting the 12 canonical modes (`bus`, `tram`, `trolleybus`, `metro`, `city_train`, `funicular`, `marshrutka`, `suburban_bus`, `scooter`, `bicycle`, `carsharing`, `taxi`).
   - Disallow fragmented or unapproved subcategories.
4. **Segment Ribbon Formatting**:
   - Every itinerary leg must expose discrete fare calculation, distance in kilometers, estimated duration, and step-by-step turn-by-turn geometry.
