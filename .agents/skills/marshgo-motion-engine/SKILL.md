---
name: marshgo-motion-engine
description: Reuse the MARSHGO motion primitives (durations, easings, entrance and press utilities) and respect prefers-reduced-motion. Use when adding or reviewing animation, gestures, sheet or card transitions in MarshGO-Site.
---

# MARSHGO motion engine

The motion system is implemented in `MarshGO-Site/src/index.css`; there is no animation library and none should be added without measured proof that native CSS cannot do the job.

- Tokens: `--mg-dur-tap` 120 ms, `--mg-dur-fast` 180 ms, `--mg-dur-base` 260 ms, `--mg-dur-slow` 420 ms; easings `--mg-ease-standard` (`.32,.72,0,1`), `--mg-ease-entrance` (`.16,.84,.28,1`), `--mg-ease-exit` (`.4,0,1,1`). Never write a duration or cubic-bezier inline.
- Utilities: `.mg-rise` / `.mg-pop` / `.mg-fade` for entrances, `.mg-stagger` with `--mg-stagger-i` for lists (55 ms per step), `.mg-press` for tap feedback, `.mg-live-dot` for live-status breathing, `.mg-wait` for disabled-submit loading.
- Animate `transform` and `opacity` only; `height`/`width`/`top` transitions are reserved for the route sheet, which sets `transition: none` while dragging so the gesture stays interruptible.
- Every animation must state why it exists: state change, continuity, or feedback. Ambient background motion is rejected.
- The global `@media (prefers-reduced-motion: reduce)` guard in `src/index.css` wins over any local rule; add the reduced case in the same file rather than in a component.
- Gate: entrance changes must be checked on the real device widths (320×568 … 430×932) and in both themes; long tasks and dropped frames are reported, not assumed.
- Related: `marshgo-map-motion` for sheet/camera coordination, `marshgo-design-system` for timing tokens, `design-review:visual-regression-review` for screenshot evidence.
