# Playwright button and visual audit — 2026-10-25

## Scope and exact artifacts

- Release manifest pair for the button audit: Server `38f17b88f98c8530f8090cfc6745cd334c87e53c`, Site `7aed5344218058b024f5c269b36b03577d94026e`.
- Separate Site candidate replay: Site PR #27 head `740f952729bc6f62498080660e2f70833026350f`; Server remained pinned to `38f17b88f98c8530f8090cfc6745cd334c87e53c`.
- Tests ran with Node `24.21.0`, Playwright on Chromium/iPhone 16 emulation, local fixture tiles/geocoder/OSRM, a fresh isolated PostgreSQL database `marshgo_e2e_button_audit_20261025` on loopback port 5434 and Redis DB 14. No existing database was reset or cleared.
- The Site candidate build used `VITE_MAP_STYLE_MANIFEST_URL=http://127.0.0.1:3306/maps/v1.0.0/manifest.json` and was written only to its isolated worktree `dist/`.

## Results

### Button audit — PASS

Command: `node node_modules/@playwright/test/cli.js test --config playwright.config.ts e2e/button-audit.spec.ts`

- 4 Playwright tests passed.
- 169 visible controls were clicked across the audited screens.
- 0 controls had no visible effect; 0 changed state before the click.
- This is browser interaction coverage for the exact pinned manifest pair, not proof that every backend-dependent product capability or live provider works.

### Route-map visual E2E — FAIL / visual acceptance open

Command: `node node_modules/@playwright/test/cli.js test --config playwright.config.ts e2e/journey-route-map.spec.ts --grep 'canonical route map synchronizes' --reporter=line`

- On the manifest Site SHA `7aed5344218058b024f5c269b36b03577d94026e`, the `transport-map-layers-light.png` screenshot differed by 20,609 pixels (7%). The layer panel expanded nearly to the top of the mobile viewport, obscuring the map.
- Repeated against Site PR #27 SHA `740f952729bc6f62498080660e2f70833026350f`, whose map-layer panel caps height at 60dvh. The panel height was corrected, but the same screenshot still differed by 12,657 pixels (4%). The test therefore stops before its subsequent assertions and visual states.
- Artifacts: `test-results/journey-route-map-canonica-57cf6-cus-and-light-dark-palettes/transport-map-layers-light-{expected,actual,diff}.png`, `error-context.md`, and `trace.zip`.
- The 4% residual difference is not accepted as harmless variance and the golden was not updated. Compare the candidate against the approved design reference, adjust the layers-sheet density/spacing if needed, then rerun the complete route-map test and review all generated visuals.

## Limits

- This audit covers the pinned web build in mobile browser emulation and a separate Site PR build; it does not cover all pages, all account states, physical iPhone/Safari, production data, or all six requested repositories.
- Tests use local deterministic map/provider fixtures. They do not validate real transport feed freshness, booking partners, staging, production, deployment SHA, security acceptance, load, backup/restore, or rollback.
- `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next action

Resolve the remaining visual mismatch in the Site candidate or correct the stale golden only after confirming it contradicts the approved design. Then rerun the full route-map E2E so the currently unreached interaction, sheet snapping, navigation restore, and theme assertions produce evidence. Continue to the rest of the production screen inventory and their button/API states afterward.
