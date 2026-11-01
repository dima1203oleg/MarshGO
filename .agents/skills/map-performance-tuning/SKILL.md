---
name: map-performance-tuning
description: 60 FPS vector map rendering, clustering, viewport culling, and WebGL optimization for MARSHGO Live Mobility map.
---

# Map Performance Tuning Skill

## Overview
This skill guides high-performance rendering of live transit maps in MARSHGO, maintaining 60 FPS across mobile and web clients with thousands of simultaneous vehicles and stops.

## Core Rules
1. **Source & Layer Management**:
   - Use GeoJSON sources with `generateId: true` and `cluster: true` for stop points where density exceeds 40 points per viewport.
   - Batch vehicle position updates using `setData()` on dedicated feature collections rather than adding individual markers to the DOM.
2. **Viewport Culling**:
   - Only query and animate active vehicles within the expanded bounding box `[minLng, minLat, maxLng, maxLat]` plus a 15% buffer margin.
3. **Pulsing & Micro-animations**:
   - Limit CSS canvas/DOM radar pulses to active or selected elements to prevent GPU composite thrashing.
   - Use CSS `will-change: transform` and hardware-accelerated transforms for bottom sheet gestures and floating UI overlays.
4. **Memory & Lifecycle Cleanup**:
   - Cancel vehicle animation frames (`requestAnimationFrame`) and clear interval pollers whenever map components unmount.
