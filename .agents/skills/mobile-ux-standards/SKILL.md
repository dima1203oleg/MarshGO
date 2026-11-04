---
name: mobile-ux-standards
description: Superseded pointer. Use marshgo-design-system, marshgo-web-ux and marshgo-motion-engine for MARSHGO mobile UI.
---

# Mobile UX standards — superseded

Superseded on 2026-11-03 by `marshgo-design-system` (tokens, 44 px targets, type emphasis, accessibility badges), `marshgo-web-ux` (canonical flows and viewports) and `marshgo-motion-engine` (timing). Load those instead; this stub keeps older task notes and git history resolvable.

Dropped deliberately, because the code disagrees with them: the hard-coded badge palette (`#2563EB`, `#059669`, `#7C3AED`, `#D97706`) — transport colors are `--mode-*` tokens — and the sheet snap points 80 px / 360 px / 85 vh, which no current component defines. Read `MarshGO-Site/src/index.css` and `src/views/JourneyRouteMapScreen.tsx` for the real values.
