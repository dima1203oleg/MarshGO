# MARSHGO canonical mobile design

These two owner-approved theme boards are the visual source of truth for the MARSHGO mobile experience:

- [Light theme](./marshgo-light-canonical.jpg)
- [Dark theme](./marshgo-dark-canonical.jpg)

The files are the original supplied references. Their SHA-256 digests are checked by `tests/canonical-design.test.ts`; update a reference only when the owner approves a replacement.

| Reference | SHA-256 | Canonical screen order |
|---|---|---|
| Light | `3e9a728f6aaf9bf59a26f6698ffa78989aee778ec80d710f0e9cde52820eeedf` | Home without trip → Home with MarshPass → route search → results → map → route details → private-ride details → MarshPass → MarshPass details |
| Dark | `827223e04296385e55955d3689dc518ed38705c5aadde2d6cb94ea5fa600979f` | Same nine screens and same order as Light |

Both boards describe the same nine-screen product flow. The light board defines the white, blue, and green visual language; the dark board is its graphite and midnight-blue adaptation.

## Premium Design 3.0 board

The owner's [MARSHGO Premium Design 3.0 board](./marshgo-premium-3-0-board.png) (`2bd49b725e32557e82e15c360416c863e0a9aaedd3305a57d3b55b0ce9c6bb31`) is the current refinement contract for five of those screens: Головна, Пошук маршруту, Результати маршрутів, Деталі маршруту, Навігація. It adds requirements rather than replacing the two boards above.

- Search: separate «З»/«По» with date and time, passenger count, approximate budget, provider selection with «Вибрати всі», and a full stop list. Nothing existing may be dropped.
- Transport: all 12 modes in a 4×3 grid.
- Transport status states: реальний GPS, наближається (ETA), за розкладом, затримується (+7 хв), недоступні.
- Map sheet: four positions — мінімальна, середня, висока, повна.
- Design system: buttons ≥ 44–48 px, high legibility and contrast, smooth animation and gestures, WCAG 2.2 AA, one coherent Light/Dark style, 60 FPS.

Track the implementation status of each panel in `NEXT_ACTIONS.md` task PREMIUM-DESIGN-3.0 (#45).

The compact multimodal journey-results screen has an additional approved light/dark reference board and a light card-detail reference. See the [canonical results contract and locked references](https://github.com/dima1203oleg/MarshGO-Site/blob/11e72b4b79888985a35700a3d85f4b715023b19a/docs/design/canonical/journey-search-results/README.md). Their SHA-256 values and implementation source are recorded in [CANONICAL_DESIGN.md](../CANONICAL_DESIGN.md).

For the light variant of the route-map/bottom-sheet screen, the owner's three supplied screenshots are canonical: [expanded details](https://github.com/dima1203oleg/MarshGO-Site/blob/codex/sync-journey-mobility-ui/docs/design/canonical/route-map-bottom-sheet/light/01-expanded-route-details.jpg), [half-open sheet](https://github.com/dima1203oleg/MarshGO-Site/blob/codex/sync-journey-mobility-ui/docs/design/canonical/route-map-bottom-sheet/light/02-half-sheet.jpg), and [collapsed map overview](https://github.com/dima1203oleg/MarshGO-Site/blob/codex/sync-journey-mobility-ui/docs/design/canonical/route-map-bottom-sheet/light/03-map-overview.jpg). They are preserved byte-for-byte and hash-locked in the Site repository. Apply their light palette and card treatment while retaining the same sheet geometry and segment interactions as the dark canonical screen.

## Invariants

- Keep the same screen order and information architecture in both themes.
- Keep Home's four quick actions in a two-column square-tile grid and retain the five-item bottom navigation with its centered create action.
- Keep route search, ranked results, the route map, step-by-step journey details, private-ride details, MarshPass, and MarshPass details as distinct user flows.
- Use the same transport color for a segment in route cards, timelines, and map overlays.
- Show MarshPass only for a confirmed MARSHGO private-ride booking. Public-transport tickets and saved multimodal journeys do not qualify.
- Preserve the supplied blue brand accents, compact cards, rounded controls, visible route segments, and Ukrainian labels. Dark mode uses layered matte graphite and navy surfaces with electric-blue emphasis.
- Improve readability, touch target sizes, and responsive behavior without changing the approved hierarchy or navigation.
- Keep the four Home actions square at the canonical phone size; on short displays allow the Home content itself to scroll so every action remains reachable.
- Treat the mountain-road cover as the preferred Home banner image. Crop responsively while keeping the mountains and road scene visible behind readable copy.
- Use the light board as the primary geometry reference. Apply the dark board's graphite/navy palette to those same surfaces and components.

These reference boards are retained in the repository so future UI work and visual reviews can compare against the approved design.
