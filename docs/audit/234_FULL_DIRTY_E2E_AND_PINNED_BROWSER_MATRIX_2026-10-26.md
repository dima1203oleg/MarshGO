# Full dirty-source E2E and pinned browser matrix — 2026-10-26

## Exact boundaries

- Orchestrator branch `codex/production-finalization-20261014`, HEAD before this report: `0797b53ef6515d8d4a54ef5f59066f708de44895`.
- Dirty local Site: branch `codex/sync-journey-mobility-ui`, base HEAD `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e`.
- Dirty local Server: branch `feature/transport-layer-availability`, base HEAD `92a26a3f617f32d644a66c0af46cba096ccb0ce0`.
- Dirty-source E2E used the current Site `dist`, current Server checkout, loopback `marshgo_e2e` PostgreSQL/Redis, local map-tile, geocoder and OSRM fixtures. `E2E_SKIP_VISUAL=1` was set; no screenshot baseline was updated.
- The separate browser-compat run rebuilt immutable manifest Site `6961afcf008e2c845c0fde68c687ce61fe744f2f` and used the manifest materialization reporting Server `a403a51a203d9d89685c10c69658c8fd95b70e9b`. This is distinct from dirty-source E2E and not evidence for the current dirty Site change.

## Dirty-source behavior acceptance

- Full Playwright E2E: **25/25 PASS** in 6.3 minutes.
- Production-flow button sweep: **179 clicked, 0 without a visible effect, 0 changed before click**.
- Covered sign-in/home/search responsive behavior, button and empty states, date/time and location flows, map route focus, 12 transport modes, two-account booking/reverse-marketplace/chat, driver GPS deviation/rerouting, mobile navigation viewports, denied-GPS recovery, URL restoration, honest partial-search warning, priced community metadata, and both rendezvous consent/revocation scenarios.
- Site current dirty source: typecheck PASS, focused ESLint PASS, production build PASS, **99/99 unit tests PASS**.
- Route map sheet behavioral scenario after `CanonicalRouteLip` refactor: **1/1 PASS** in the full run.

## Pinned cross-browser smoke

- Browser compatibility suite: **6/6 PASS** across Chromium, Firefox and WebKit. Each engine covered production sign-in/home/search at responsive sizes and route-map sheet, stop details, focus, and palette behavior.
- The suite used the manifest-pinned Site/Server candidate above, not the current dirty Site UI. It is a selected browser matrix, not exhaustive page coverage.

## Still open

- Screenshot comparison on dirty Site still fails for `journey-results-light.png`: 38,818 pixels (~12%) differ from the local snapshot. The long total `1 год 12 хв · 52 ₴` is visible after flex repair, but the remaining difference is not yet fully attributed. Do not regenerate baseline until the reference comparison is reviewed. See audit 233.
- No proof of all-ten-user-mockup visual acceptance, live providers, physical iPhone, staging, deployed SHA, backup/restore, rollback, production security/load gates, or a unified six-repository exact release tuple.
- GTFS search on dense Lviv frozen feed remains incomplete and correctly exposes partial status; see audits 232 and 233.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
