# Canonical route lip implementation and visual gate — 2026-10-26

## Source boundary

- Orchestrator: `/Users/dima1203/Desktop/MarshGO`, HEAD after audit checkpoint `7914c8c744f9abf0c23d2293c504d9a349e26f5d`.
- Site: `/Users/dima1203/Desktop/MarshGO/MarshGO-Site`, branch `codex/sync-journey-mobility-ui`, base HEAD `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e`, dirty source.
- Server: `/Users/dima1203/Desktop/MarshGO/MarshGO-Server`, branch `feature/transport-layer-availability`, base HEAD `92a26a3f617f32d644a66c0af46cba096ccb0ce0`, dirty source.
- E2E used the dirty Site `dist`, dirty Server checkout, and local loopback fixtures. The printed manifest materialization is not evidence that those two dirty checkouts form the manifest's immutable release tuple.
- No release manifest promotion, deployment, push, broad staging, reset, or clean was performed.

## UI change

Added `src/design-system/journey/CanonicalRouteLip.tsx` and reused it from `src/views/JourneyResultsPanel.tsx` and `src/views/JourneyRouteMapScreen.tsx`. The shared component now owns the duration/price row, actions slot, note slots, and the segment ribbon/labels. It preserves selectable map segments, favorite actions, strategy badges, unknown-price semantics, route timing and status messages. The compact result-card CSS hooks and waiting placement are kept on the metric row so card spacing and unknown fares retain their intended behavior.

## Verification

- Site: TypeScript PASS; focused ESLint PASS; production build PASS; **99/99** unit tests PASS on final source.
- Route-map E2E with visual assertion disabled: **1/1 PASS** after final source, including results, sheet snap points, stop details, map focus and light/dark behavior. The test used loopback database/map/geocoder/OSRM fixtures and took about 1.1 minutes.
- Server: **240 PASS / 0 FAIL / 1 opt-in integration SKIP**; typecheck/full ESLint PASS on the current dirty source. Guarded loopback Postgres/Redis integration after GTFS worker shutdown repair: **29/29 PASS**.
- Dense Lviv GTFS remains explicitly partial; API exposes candidate-generation and provider-specific diagnostics. Cap doubling was rejected; see audit 232.

## Visual gate: still open

The route-map test with screenshot comparison enabled still fails against the current local snapshot at `journey-results-light.png`: **38,818 pixels, about 12% of the image**, differ. The latest actual screenshot shows the longer `1 год 12 хв · 52 ₴` metric fully visible after a flex-width repair, but the remaining difference has not been fully attributed. The screenshot baseline was not overwritten. A visually acceptable current screenshot is not proof of parity with all ten user-provided mockups; those references still need explicit screen-by-screen comparison with the approved map assets.

## Next exact actions

1. Inspect the expected/actual/diff screenshot at full resolution and attribute the remaining pixel delta to actual layout or a stale baseline before changing snapshots.
2. Compare all ten supplied mockups to their matching Site states in both themes, including cards, full/half/compact sheets, live bus focus, layer panel and rendezvous. Record pass/fail per reference; do not call the visual gate passed from E2E behavior alone.
3. Run the full 25-case E2E on the exact dirty tuple after this Site refactor; then rebuild and rerun against one immutable Site/Server SHA pair.
4. Continue the release gates from the acceptance matrix. No staging/live/iOS/operational gate is inferred from local fixtures; production remains `NOT_RELEASED`.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
