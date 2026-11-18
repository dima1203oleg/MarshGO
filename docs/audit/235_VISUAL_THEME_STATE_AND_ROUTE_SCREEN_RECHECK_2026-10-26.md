# Visual theme-state and route-screen recheck — 2026-10-26

## Scope and exact worktrees

- Orchestrator: `codex/production-finalization-20261014`; current worktree remains heavily dirty. No unrelated files were staged or committed.
- Site source/dist: local `MarshGO-Site` checkout on `codex/sync-journey-mobility-ui`, source HEAD `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e`.
- Server: local `MarshGO-Server` checkout on `feature/transport-layer-availability`, source HEAD `92a26a3f617f32d644a66c0af46cba096ccb0ce0`.
- Browser run used local Postgres/Redis and the map, geocoder, and OSRM test fixtures. It was not a live-provider, staging, or production run.

## Change and evidence

- The route-map E2E enabled `html.dark` for the dark results state, then opened a route whose own theme was Light without clearing the shared document class. This made light route-sheet text inherit dark-only CSS. Moved the class cleanup to immediately before opening the Light route, after the dark scroll-cue assertions. This changes only test state setup, not product styling.
- Ran the route-map E2E with `updateSnapshots: all` pointed to `/tmp/marshgo-visual-captures`; all ten captured checkpoints passed the route behavior assertions: light/dark results, half/expanded/collapsed route sheet, transport map layers, and light navigation/layers. Temporary captures are outside the repository; no committed baseline was regenerated.
- Re-ran the normal screenshot test without baseline update. It still fails at `journey-results-light.png`: 38,818 pixels (12%) exceed Playwright's visual threshold. The captured expected and actual are similar at a glance, but the difference has not been isolated to a reviewed set of font, geometry, or color changes. Keep this visual gate FAIL; do not accept or replace the baseline yet.
- The current map screenshots use a schematic local tile fixture. This proves map UI behavior, not parity with the supplied aerial/satellite mockups or production tile styling.

## Status

- Route behavior/capture: PASS on the dirty local fixture pair.
- Screenshot regression: FAIL / unresolved for the results-light baseline.
- Ten-reference visual acceptance: NOT TESTED/NOT ACCEPTED as a complete set. Existing mockups have not been individually signed off in both relevant themes.
- Exact immutable release candidate, live providers, production tile rights/configuration, staging, physical iPhone, and deployment remain unverified.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next action

1. Trace the 38,818-pixel screenshot difference with expected/actual geometry and CSS/font provenance. Do not widen thresholds or regenerate snapshots to force green.
2. Map each of the ten reference images to a production route/state, then capture an equivalent state with approved map assets. Keep fixture and production-asset evidence separate.
3. After visual test setup and relevant product changes stabilize, rerun full UI E2E on an immutable compatible Site/Server pair; continue exact six-repository release reconciliation and remaining external gates.
