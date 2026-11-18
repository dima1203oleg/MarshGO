---
name: marshgo-design-system
description: Apply the implemented MARSHGO visual token system (colors, surfaces, themes, touch targets) instead of inventing new values. Use when changing Web/PWA styling, components, or themes in MarshGO-Site.
---

# MARSHGO design system

The tokens already exist in `MarshGO-Site/src/index.css` (`--mg-*`). Read them before adding anything; a new literal hex or spacing value is a defect unless the registry has no answer.

- Three blues, three jobs: `--mg-blue` paints strokes, icons, large text; `--mg-blue-ink` paints small text on a surface and must clear AA on `--mg-blue-tint`; `--mg-action` fills a control that carries white text. Never swap them.
- Surfaces: `--mg-canvas`, `--mg-surface-primary/secondary/tint`, `--mg-surface-glass` (translucent chrome only). Ink: `--mg-ink-primary/secondary/muted`. Lines: `--mg-border-subtle`, `--mg-border-medium`, `--mg-line`.
- Dark theme is owned by `themeService`, which resolves `system` itself and writes `html.dark` (see the header comment of `src/index.css` and the dark remap block). Components must not read `prefers-color-scheme` directly.
- Map and route sheets use their own scoped set (`--route-*`, `--mg-label-*`) so a card over a dark map keeps its own contrast contract; keep those variables local to the screen that declares them.
- Ergonomics: tap targets are `min-h-11` / `h-11 w-11` (44 px); focus is `focus-visible:outline-2` in `--mg-blue`; safe areas via `env(safe-area-inset-bottom)`, never fixed padding. Type emphasis: heavy weight for ETA and route numbers, bold for stops, medium for ancillary telemetry — hierarchy comes from weight and size, not from new colors.
- Transport colors are `--mode-*` tokens consumed by cards, timelines and map overlays alike. Any literal hex from an older spec (e.g. `#2563EB` for bus) is superseded; if a token is missing, add the token, not the hex.
- Accessibility states are content, not decoration: wheelchair/low-floor badges and live-GPS versus scheduled-confidence indicators must be readable in both themes and carry a text label, never color alone.
- Verify, do not assume: `npm run typecheck && npm run lint:all && npm test && npm run build && npm run check:bundle` in `MarshGO-Site`, then look at both themes on a real viewport.
- Related: `marshgo-motion-engine` for timing, `design-review:accessibility-review` and `design-review:visual-regression-review` for evidence.
