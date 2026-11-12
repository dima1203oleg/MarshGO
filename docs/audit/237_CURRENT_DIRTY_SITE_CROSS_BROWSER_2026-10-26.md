# Audit 237 — current dirty Site cross-browser acceptance — 2026-10-26

## Tested source

- Site: `codex/sync-journey-mobility-ui` @ `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e`; worktree remained dirty (46 paths).
- Server: `feature/transport-layer-availability` @ `92a26a3f617f32d644a66c0af46cba096ccb0ce0`; worktree remained dirty (40 paths).
- Root orchestration HEAD immediately before this documentation-only checkpoint: `c9aa130a6ec489281e2b5dda83de0c5857d2a144`. The audit 236 and 237 report files were then committed without changing product source; root is now `7f8865b0a00f10e7f31e1bfd52cf4780674f5b22`.
- Runtime: Node `v24.22.1`. Local fixture API, map, geocoder and OSRM; separate loopback E2E database `marshgo_e2e_site_compat_20261026`.

## Results

- Current canonical Site browser matrix: **6/6 PASS** — production sign-in/home/search across screen sizes and full route-map behavior in Chromium, Firefox and WebKit.
- Current-source full Site/Server workflow suite: **25/25 PASS** in audit 236, separate isolated loopback DB.
- Main visible-control sweep: **169 clicks, 0 no-effect, 0 stale-before-click**.
- Current Site includes the single `CanonicalRouteLip` component, used by both `JourneyResultsPanel` and `JourneyRouteMapScreen`. This is present in the dirty working tree and is not yet an immutable release artifact.
- Screenshots were redirected to `/tmp/marshgo-compat-snapshots`; temporary baselines were generated only to let the full interaction flow continue. They are not visual regression acceptance and no repository screenshot was updated.

## Remaining acceptance gaps

- Repository screenshot comparator still fails `journey-results-light.png` at 38,818 pixels (~12%). This exact expected/actual difference has not been fully attributed; threshold and baseline remain unchanged.
- Cross-browser tests use deterministic map fixtures. They do not verify live licensed tiles, provider feeds, physical Safari/iPhone, deployment behavior, or all ten supplied reference mockups.
- Dense Lviv GTFS remains partial with explicit truncation. The immutable six-repository tuple, Admin/Partner current local checks, iOS build against this exact Site SHA, staging, external provider rights/probes, security/load/recovery, backup/restore, rollback and production smoke remain open.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Exact next action

1. Trace the light-results screenshot delta to font/style provenance and layout geometry; compare all attached mockups with their actual production route and approved map assets. Keep baselines unchanged until review.
2. Preserve dirty worktrees while reconciling their diffs and PR ancestry into an immutable compatible candidate; do not broad-stage or reset.
3. Resume dense GTFS query-directed search only with exact exhaustive-oracle path identity and strategy-winner parity, then frozen-feed recall/truncation/latency/RSS comparison.
4. Continue current six-repository, provider, iOS, staging and operational production gates. No deployment is made by this checkpoint.
