---
name: marshgo-map-motion
description: Animate MARSHGO map camera, route focus and bottom-sheet coordination without rebuilding MapLibre state. Use when working on JourneyRouteMapScreen, sheet gestures, map padding, marker or route animation.
---

# MARSHGO map motion

Proven regressions to avoid (they were fixed once and cost browser sessions to find):

- Never recreate the MapLibre instance on sheet movement; keep one map and drive it through the existing adapter.
- Never derive `mapPadding` from the live sheet height while expanding a sheet — the camera slides to the city. Padding is frozen at the half-detent.
- Never render a full map for the results list; the approved flow is a list first, map on selection.

Rules:

- Coordinate sheet and camera: `bottom`/`height` transitions use `--mg-dur-base` + `--mg-ease-entrance`, and are switched to `none` for the duration of a drag so the gesture stays interruptible.
- On selection: highlight the chosen line, de-emphasise siblings (opacity ~0.68 on unselected segment cards), fit the selected journey, keep the previous map context reachable.
- Emphasis is controlled (stroke, elevation, one pulse), not blinking or flashing.
- Camera work must not outrun data: a move is only animated when the target coordinates came from a verified feed; label scheduled-only positions honestly and never imply live tracking.
- Sources and layers are declared once in `MarshGO-Site/src/map/transportLayers.ts`: clusterable sources use `{ cluster: true, clusterRadius: 44, clusterMaxZoom: 15 }` (line 209) and every layer id is removed before re-add (line 198). Change layers through that adapter; never add DOM markers beside it.
- Batch vehicle position updates through `setData()` on the existing source; cull to the visible bounding box plus a small margin instead of animating off-screen vehicles.
- Pulse and emphasis only on the active or selected element; keep `will-change` on the sheet/overlay chrome, not on every route layer.
- Cancel `requestAnimationFrame` and clear every poll interval on unmount — a leaked vehicle ticker is the classic background-tab stall.
- Gate: `npm test`, `npm run build`, then the real browser on the public HTTPS origin with FPS/long-task observations in the report.
- Related: `marshgo-design-system` for tokens, `marshgo-motion-engine` for timing, `marshgo-web-ux` for the canonical screen flow.
