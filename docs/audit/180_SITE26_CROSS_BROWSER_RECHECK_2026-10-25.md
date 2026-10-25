# Site PR #26 cross-browser recheck — 2026-10-25

## Exact test inputs

- Site: PR #26 commit `1b5986de5af875c5c2945df4752c23603c135ed3` (isolated worktree; not in the release manifest).
- Server API: PR #40 commit `38f17b88f98c8530f8090cfc6745cd334c87e53c`.
- Orchestration harness: dirty local checkout `codex/production-finalization-20261014` at `3068d4d8190534fcab731618368ed6f44fc3949a`; no files were staged by this run.
- Runtime: Node `v24.22.1`.
- Database: fresh loopback-only `marshgo_e2e_layers_20261025`, migrated through Server migration 055. The first attempt against the unmigrated empty database was invalid setup; after applying the exact Server migrations, the rerun passed. No production/staging systems or existing databases were used.
- Map, routing and journey data: deterministic local E2E fixtures.

## Result

- Command: Playwright compatibility config with `browser-compat.spec.ts` and `journey-route-map.spec.ts`, against the Site #26 build and pinned Server #40 API.
- **6/6 cases passed** across Chromium, Firefox and WebKit in 2.6 minutes.
- Responsive sign-in/home/search assertions covered 320, 390, 430, 768, 1280 and 1440 CSS-pixel widths; canonical route-map assertions covered the sheet, stops, segment focus and light/dark palettes.
- Screenshot comparison was disabled. This verifies cross-engine behavior and asserted geometry, not pixel approval against the ten supplied references.

## Boundary

This is local fixture evidence for Site PR #26; it is not an immutable six-repository release tuple, staging, live-provider, physical iPhone/Safari, production smoke or deployment evidence. Keep PR #26 draft and absent from the release manifest until ancestry is reconciled. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
