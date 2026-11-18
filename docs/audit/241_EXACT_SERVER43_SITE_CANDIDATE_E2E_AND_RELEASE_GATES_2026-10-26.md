# Exact Server/Site candidate E2E and release gates — 2026-10-26

## Scope and source identities

This checkpoint compares the latest hosted component PR stack with the current uncommitted Site working copy. It is local fixture-based acceptance only; no deployment or provider data was used.

| Input | Exact identity | State |
|---|---|---|
| Server | `dima1203oleg/MarshGO-Server` PR #43, `24c70dc31d652ac6ba9fbc5fcd7abd138378b457` | clean isolated worktree; hosted CI checks SUCCESS |
| Site integration candidate | local merge `5fe7dc0` (PR #27 head `cc149957…` plus latest PR #3 head `ae2c8aaf…`) | clean isolated worktree; merge is conflict-free and adds only the latest contact-block navigation fix |
| Site integration candidate parent | PR #27 head `cc1499573732a41e8ff31d7ab634d15421d45df1` | hosted Site CI SUCCESS |
| Current dirty Site | branch `codex/sync-journey-mobility-ui`, HEAD `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e` plus uncommitted tracked/untracked changes | preserved; not an immutable release SHA |

No release tuple was materialized for Admin/Partner/iOS against these Site and Server sources. The current iOS PR #14 still pins the older Site `6961afcf…` and Server `a403a51a…`; its simulator check does not prove the new pair.

## Checks on the isolated component candidates

### Site merge candidate `5fe7dc0`

- Node 24.22.1 `typecheck`: PASS.
- ESLint: PASS.
- Unit suite: 115/115 PASS.
- Production bundle build: PASS.
- Bundle gzip budget: PASS (17 JavaScript chunks, each within the 350 KB gzip gate).
- Its exact Server #43 browser E2E below is **11/25 PASS, 14 FAIL**. Therefore this remote PR stack is not a release candidate.

### Server PR #43 `24c70dc31d652ac6ba9fbc5fcd7abd138378b457`

- Node 24.22.1 typecheck and ESLint: PASS.
- Full unit suite: 316 PASS, 0 FAIL, 3 opt-in integration skips. Skips are not passes.
- Guarded loopback PostgreSQL/PostGIS/Redis integration: 30/30 PASS (Journey schema 2, live Journey 1, booking/trip-editing 21, Partner tenant 1, navigation 2, realtime 1, restart durability 1, shared rate limit 1).
- Hosted PR #43 checks: both Server CI `verify` checks SUCCESS.
- Local integration and browser inputs used the isolated `marshgo_e2e` database and loopback Redis. They do not establish staging or production behavior.

## Exact remote stack E2E

The root 25-scenario Playwright suite ran against Server #43 and Site merge candidate `5fe7dc0`, with local map/geocoder/OSRM fixtures and the loopback test database: **11 PASS / 14 FAIL** in 7.9 minutes. Representative failures:

- route-segment focus kept 3 geometries where the acceptance test required only the selected segment;
- light route-map screenshot differed from the committed visual reference by 29,852 pixels (9%);
- route card and picker assertions in the older stack did not match current labels and controls;
- rendezvous copy/consent controls differed from current expected behavior;
- the first responsive home test expected a different action-card order.

This is direct evidence that the remote PR stack alone cannot be promoted. The screenshot baseline was not changed.

## Current working Site against the exact Server #43

The current dirty Site was built to `/tmp/marshgo-site-dirty-e2e-dist` with only the deterministic loopback map-manifest override. The Site source tree was not edited by this build. Against the same Server #43 and the same 25-scenario suite: **24 PASS / 1 FAIL** in 5.3 minutes.

- The 179-control audit passed: 179 clicked, zero inert, zero controls changing before click.
- Responsive sign-in/home/search, date/time and address selection, route focus, all twelve canonical modes, two-account booking/demand/chat, driver GPS reroute, mobile viewports, denied-GPS recovery, deep-link restore, partial-result notices, Community offer metadata, and both rendezvous consent/map flows passed.
- The sole failure is `journey-results-light.png`: 38,818 pixels (12%) differ from the existing root Playwright reference. Do not update the screenshot or loosen its threshold. The actual and expected renders appear close at a glance, but the pixel gate remains FAIL and the supplied mockups do not provide a byte-exact image oracle for this test state.

The dirty Site result is useful integration evidence, but it is **not** an immutable source SHA and cannot be called a release artifact. All pre-existing Site/Server dirty changes remain preserved; the isolated candidate worktrees were used for the clean PR experiments.

## Current GitHub release-chain state

Read-only GitHub recheck on 2026-10-26:

- Server PR #35–43: open stacked PRs; each inspected head/base state was mergeable (`CLEAN`) and both hosted `verify` checks were SUCCESS. This is a branch graph, not an integration into the default branch.
- Site PR #21–27: open stacked PRs; each inspected head/base state was `CLEAN` and both hosted `verify` checks were SUCCESS. The latest stack is not based on the newest PR #3 fix; the local `5fe7dc0` merge demonstrates a clean way to include that single line but has not been pushed.
- iOS PR #14: both Simulator checks SUCCESS, but the workflow pins the older Site `6961afcf…` and Server `a403a51a…` candidate. It does not build the current dirty Site or Server PR #43.
- Admin PR #1 and Partner PR #1: hosted `verify` SUCCESS, but no current-tuple authenticated browser acceptance was run here.
- Orchestrator PR #5 and #6: `CI/verify` FAIL. The failing step explicitly reports that `MARSHGO_REPOS_READ_TOKEN` is absent and is required for read-only checkout of private Admin/Partner sources. CodeQL and Gitleaks checks pass. The fail-closed gate remains unchanged; no personal token was copied into Actions secrets.
- The only current orchestration branch remains dirty and ahead of its remote. No broad staging, push, merge, or deployment was done.

## Release conclusion

`PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.

The integrated fixture E2E, screenshot visual gate, exact iOS pin, hosted private-repository materialization, licensed production map assets, live provider/contract coverage, staging, physical iPhone, security/load/recovery, backup/restore, rollback, and owner-approved rollout remain unclosed. The Server #43 unit/integration successes do not remove the dense-Lviv-search truncation already recorded in audit 213 and later routing checkpoints.

## Next action

1. Reconcile the current dirty Site/Server changes into isolated, reviewable commits without touching the dirty source worktrees; preserve the existing visual baseline.
2. Resolve the remaining `journey-results-light` visual difference against the supplied reference and rerun the exact 25-scenario browser suite.
3. Build and verify an iOS commit pinning the resulting exact Site and Server SHAs; materialize Admin/Partner via the authorized Actions secret when available.
4. Continue the dense-GTFS completeness and production-map/provider gates. Do not deploy.
