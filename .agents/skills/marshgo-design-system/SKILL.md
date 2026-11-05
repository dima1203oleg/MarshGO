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

## Shipped on the canonical branch (`MarshGO-Site` @ `qoder/v41-ui-20261101`) — reuse, do not re-invent
- Contrast is owned by tokens per surface, screen by screen: result panel chips, tab bar active label, desktop wordmark, profile avatar, trips tab track and the «+»/search/navigation forms all read `--mg-blue-ink` / `--mg-ink-secondary` instead of `text-slate-*` or `bg-blue-100`. Regressions fail `tests/v41-contrast.test.ts` and `tests/canonical-design.test.ts` — run them before claiming a screen is AA-safe.
- Warning/amber surfaces carry their own dark-theme ink; a light-only amber pair is a defect (badge text goes unreadable on `html.dark`).
- Motion uses only the declared primitives: `--mg-dur-*` and `--mg-ease-*` (`src/index.css:1154-1156`) behind `.mg-rise`, `.mg-pop`, `.mg-fade`, `.mg-stagger` (`--mg-stagger-i`), `.mg-press` (`src/index.css:1189-1201`); `prefers-reduced-motion` is already handled in `src/index.css:893`. Do not add inline `transition:`/`animation:` values to components.
- The results list is not an immersive screen: global navigation stays mounted above it, and route/leg text reads the accent token set declared once per theme.
- Cite only what is on this branch. `--mg-radius-*`/`--mg-z-*`, the cash-fare caption on result cards and `tests/premium-mobile-ergonomics.test.ts` live in **unmerged** `qoder/*` worktrees — reading them there is fine, writing them into a v41 screen as "already shipped" is not.
- A token that `html.dark` does not restate is **not** inherited from `:root` by a `dark:bg-[var(--x)]` utility — the declaration is invalid at computed-value time and the surface resolves to `rgba(0, 0, 0, 0)`, i.e. transparent, not to the light value. `tests/dark-token-coverage.test.ts` fails on any `dark:*-[var(--x)]` whose token is missing from the dark block; add the token to the dark ramp (`color-mix` off `--mg-surface-*`), never a hand-picked hex.
- Verify, do not assume: `npm run verify` in `MarshGO-Site` — that is the CI set (typecheck, lint, test, `check-tokens`, build, `check:bundle`, `check-single-react`, `boot-smoke`). The shorter chain agents used to quote (`typecheck && lint:all && test && build && check:bundle`) misses `check-tokens`, G6 and G7, and a green local run then turns the PR red. `boot-smoke` needs `playwright` installed in the tree that runs it: in a worktree with a symlinked `node_modules` it can fail with `ERR_MODULE_NOT_FOUND`, which is an environment gap, not a product failure — say so instead of skipping the gate silently. Then look at both themes on a real viewport.
- Related: `marshgo-motion-engine` for timing, `design-review:accessibility-review` and `design-review:visual-regression-review` for evidence.
