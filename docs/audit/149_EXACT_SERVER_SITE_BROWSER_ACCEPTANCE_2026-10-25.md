# Exact Server/Site browser acceptance — 2026-10-25

## Candidate pair

- Server: `codex/server-current-pr39-integration-20261025` @ `38f17b88f98c8530f8090cfc6745cd334c87e53c`; based on the current open PR #38/#39 stack.
- Site: `codex/site-current-pr24-integration-20261025` @ `254b5b2d0674ec2107269b1e0e93895269c37f15`; based on current open PR #24 and adds the response-sampling truncation contract fix.
- Browser fixture used isolated loopback PostGIS/Redis and a deterministic local MapLibre style/tiles fixture. This is an exact local build/API pair, not staging, live-provider, deployed-production, or physical-device evidence.

## Checks

- Server: 315 unit tests PASS, 3 opt-in tests SKIP; typecheck and lint PASS; loopback DB/API/Redis integration 30/30 PASS.
- Server frozen Lviv feed replay: all prior FASTEST/CHEAPEST/BALANCED winners retained across 3 ODs; 23/1/2 alternate chain IDs added; search remains truncated on every OD. Median latency changed +8%/+1%/+17% versus PR #38. See [audit 148](148_SERVER_PR39_CURRENT_BRANCH_INTEGRATION_2026-10-25.md).
- Site: unit tests 107/107 PASS; typecheck, lint, production build, and bundle-size gate PASS.
- Exact-pair route-search URL/refresh browser E2E: 1/1 PASS.
- Exact-pair route-map browser E2E: 1/1 PASS, including sheet snaps, stop details, map focus, live overlay fixture switching, intermediate-stop routes, dark palette, and global navigation. The local acceptance harness assertion was corrected to the documented contract: ordinary segment focus retains the other itinerary segments dimmed; the dedicated live-focus mode may suppress them. No reference screenshot baselines were rewritten.

## Limits and release status

- The route-map E2E uses mocked journeys and local map assets; provider truth, licensed basemap operation, visual parity against all supplied mockups, live GPS, and physical iPhone behavior are not established by this run.
- The Lviv router still reports incomplete/truncated search. No all-route completeness claim is made.
- This candidate pair has not been pushed, staged, deployed, or pinned into iOS/Admin/Partner release artifacts.
- `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
- Next: preserve the exact pair, reconcile iOS pin/build and Admin/Partner contracts, then continue remaining release gates. Staging/deployment, provider, security, load, recovery, backup/restore, visual acceptance, and physical-device gates remain open.
