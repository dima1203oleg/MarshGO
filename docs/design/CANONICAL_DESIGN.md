# MARSHGO canonical mobile design

The owner-provided light and dark boards in [`canonical/`](canonical/) are the visual source of truth for the MARSHGO mobile experience. Keep the original JPEGs unchanged and use them for visual review of future UI changes.

| Reference | File | SHA-256 |
|---|---|---|
| Light theme | [`marshgo-light.jpg`](canonical/marshgo-light.jpg) | `3e9a728f6aaf9bf59a26f6698ffa78989aee778ec80d710f0e9cde52820eeedf` |
| Dark theme | [`marshgo-dark.jpg`](canonical/marshgo-dark.jpg) | `827223e04296385e55955d3689dc518ed38705c5aadde2d6cb94ea5fa600979f` |

These are reference boards, not runtime artwork. The app must render its real controls and data.

## Screen order

Preserve the reference order and information architecture:

1. Home without an active MarshPass
2. Home with an active MarshPass
3. Route search
4. Search results
5. Route map
6. Route details
7. Private ride details
8. MarshPass
9. MarshPass details

Apply both palettes to these same screens. Keep the four Home actions in a square 2×2 grid, the persistent five-item bottom navigation, compact route cards, and the step-by-step route timeline. Do not replace these with a new navigation model.

## Visual rules

- Light mode uses a bright sky background, navy text, MARSHGO blue actions, and color-coded transport badges.
- Dark mode is a matte graphite/navy adaptation of the same layout. Use blue as the primary action color; keep surfaces distinct and text readable.
- A route segment, its transport badge, and its map polyline share the same transport color.
- Show time, transfers, walk distance, fare, live/scheduled confidence, and availability only from the corresponding data. Mark estimates and unknown fares clearly.
- MarshPass is only for a confirmed private-ride booking. Other transport tickets never occupy the Home MarshPass slot.
- Keep touch targets at least 44×44 logical points, support reduced motion and text scaling, and check layouts at 360–430 logical points wide.
- Preserve the user's preferred mountain travel artwork in the Home campaign carousel, while avoiding embedded marketing text that conflicts with the app's live copy.

## Canonical multimodal search results

The journey-results screen has its own owner-approved light/dark reference board and a detailed light-theme card reference. The originals are stored and SHA-256 locked in `MarshGO-Site` at commit `11e72b4b79888985a35700a3d85f4b715023b19a`:

| Reference | Canonical use | SHA-256 |
|---|---|---|
| [Light and dark results board](https://github.com/dima1203oleg/MarshGO-Site/blob/11e72b4b79888985a35700a3d85f4b715023b19a/docs/design/canonical/journey-search-results/01-results-light-dark-board.jpg) | Compact results composition, three ranking modes, and the exact 4×3 transport catalogue | `81ec8c9049a12a29b093faa0b6d0977f3102e16c4a90e9c8e696debf7d5862a5` |
| [Light results detail](https://github.com/dima1203oleg/MarshGO-Site/blob/11e72b4b79888985a35700a3d85f4b715023b19a/docs/design/canonical/journey-search-results/02-results-light-detail.jpg) | Card hierarchy, proportional segment ribbon, sourced fares, and separate save/open actions | `2cd6bf47ad92f9ece3622a29803286148e1d2fbe21f76c6995fe3bffb7286259` |

The locked screen contract and implementation live in [`MarshGO-Site/docs/design/canonical/journey-search-results/README.md`](https://github.com/dima1203oleg/MarshGO-Site/blob/11e72b4b79888985a35700a3d85f4b715023b19a/docs/design/canonical/journey-search-results/README.md) and `MarshGO-Site/src/views/JourneyResultsPanel.tsx`. The same Site build is the shared web/iOS UI. Preserve the one-time route header, the three modes in the approved order, compact cards, all itinerary segments, explicit unknown fares, and the existing route-map/details flow. The boards are visual references only; their demonstration routes, prices, and currencies must never be used as live data.

## Visual review

For UI changes, capture the same screen in light and dark at 390×844 and at the narrow/wide ends of the supported mobile range. Compare screen hierarchy, spacing, card shape, color mapping, and bottom navigation against both canonical boards. Product data in captures must come from the app's real API or clearly identified test fixtures.
