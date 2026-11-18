---
name: map-performance-tuning
description: Superseded pointer. Use marshgo-map-motion for MARSHGO map rendering, layers and frame cost.
---

# Map performance tuning — superseded

Superseded by `marshgo-map-motion` on 2026-11-03. Load that skill instead; this stub keeps older task notes and git history resolvable.

Moved with code citations: clustering config `{ cluster: true, clusterRadius: 44, clusterMaxZoom: 15 }` and the remove-then-re-add layer lifecycle in `MarshGO-Site/src/map/transportLayers.ts:198-209`, `setData()` batching, bounding-box culling, single-element pulse, and rAF/interval cleanup on unmount.

The "40 points per viewport" and "60 FPS" figures were targets, not measurements — prove any frame-budget claim with a real browser run and report FPS plus long tasks.
