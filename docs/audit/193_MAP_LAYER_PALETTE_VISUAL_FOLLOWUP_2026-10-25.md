# Map layer palette visual follow-up — 2026-10-25

## Candidate and implementation

- Site PR #27, branch `codex/site-gtfs-truncation-reasons-20261025`, exact SHA `cc1499573732a41e8ff31d7ab634d15421d45df1`.
- Added a map-layer-specific badge palette to match the supplied map-layers mockup. The map legend no longer borrows journey route colors, so the change does not recolor route segments.
- Added two deterministic tests for all twelve transport category colors and fallback behavior for non-transport layers.
- Site PR #27 remains open and draft.

## Verification

- Site unit suite: **115 PASS / 0 FAIL / 0 SKIP**.
- Site TypeScript typecheck: **PASS**.
- ESLint for changed files: **PASS**.
- Site production build: **PASS**.
- Hosted Site verify runs `40201475281` and `40201478772`: **PASS** on exact SHA `cc14995`.
- Replayed the focused Chromium route-map test with Site SHA `cc14995`, Server fixture SHA `38f17b88f98c8530f8090cfc6745cd334c87e53c`, local Postgres/Redis, and local map/geocoder/OSRM fixtures. The test reached the map-layers visual assertion and failed against the existing root snapshot: **12,617 pixels / 4%** differ. The inspected actual frame now uses the approved category badge colors; it is not accepted as a pixel match to the older snapshot. The snapshot was not refreshed.

## Release status and outstanding blockers

- Root PR #5 at `e18f868fe43ba105044ee18755a6f57b9ec6155a`: CodeQL and Gitleaks pass; hosted `verify` fails because `MARSHGO_REPOS_READ_TOKEN` is unset. This blocks private Admin/Partner source materialization and the dependent Docker/cross-repository browser verification.
- Browser runs remain fixture-only. Real staging, provider/map entitlements, physical iPhone/Safari GPS, security/load/recovery, backup/restore, rollback, deployed SHA and owner approval are not established by this check.
- `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`. No production deployment, release-manifest promotion, or destructive cleanup occurred.
