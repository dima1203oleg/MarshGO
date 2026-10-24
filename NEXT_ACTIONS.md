# Checkpoint 2026-10-24 — dependency audit and release-manifest correction

- Root/orchestrator repo: `/Users/dima1203/Desktop/MarshGO`, branch `codex/production-finalization-20261014`. Dependency/security fix is committed and pushed as `dba2f436b6a4c5a90627e656438930c7463ef432`; this is not a clean release source because other pre-existing work remains modified/untracked.
- Root dependency fix: Zod `4.6.7`, body-parser `1.20.9`, `@grpc/grpc-js` `1.14.6`; npm and Bun lockfiles aligned. `npm audit --audit-level=high` reports 0 high/critical vulnerabilities; `bun audit --audit-level=high` passes. Exact Gitleaks fingerprints for five reviewed SHA256 image-digest false positives are now accepted; the new Gitleaks CI runs pass.
- Root `npm run check:production` on Node `24.21.0`: typecheck PASS, lint PASS, unit suite **256 PASS / 0 FAIL / 1 opt-in SKIP**, production build PASS, bundle budget PASS (51 JS chunks <= 350 KB gzip).
- That local suite exposed an incorrect iOS candidate SHA in the root release manifest. The exact iOS checkout is `0fcf5f36e0a751152b9d3cd6778a930b372afae0` (40 hex characters); release documents are corrected locally. PR #5 verify run `40043952589` failed against the prior pushed manifest; this local correction has not yet been pushed. Re-run CI after the documentation commit.
- Existing exact RC evidence remains: Server candidate integration 29/29 PASS; Site/Server fixture E2E retest 20/20 PASS; iOS Simulator hosted checks PASS. No production deployment.
- **Next exact action:** commit only `CODEX_PROGRESS.md`, `NEXT_ACTIONS.md`, `RELEASE_MANIFEST.json`, `docs/RELEASE_MANIFEST.json`, `docs/PRODUCTION_EXECUTION_STATE.md`, `docs/PRODUCTION_ACCEPTANCE_MATRIX.md`, and `docs/audit/102_IMMUTABLE_RC_CANDIDATE_2026-10-24.md`; push to the existing root PR branch and re-check Gitleaks/verify/CodeQL. Then continue still-open authenticated Admin/Partner, dense-Lviv, staging, security/load, backup/restore/rollback and physical-iPhone gates. Keep `PRODUCTION_READY=false`, `NOT_RELEASED`.

---

# Next actions — current production candidate

1. Classify the 13 heuristic no-visible-effect cases from the 195-click audit; add semantics-specific assertions only where an action is expected to change route/state/network/accessibility.
2. Establish and run authenticated Admin/Partner role and tenant-isolation E2E using disposable identities on an isolated test database; current evidence only includes entry/login and unauthenticated 401.
3. Continue dense-Lviv completeness with exhaustive small-feed oracle; live Lviv searches remain truncated, sampled GTFS-RT is empty, and unknown fares must stay unknown.
4. Review all ten supplied mockups against matching light/dark states and desktop widths; current fixture E2E does not establish complete pixel parity.
5. Close staging, provider-rights, physical iPhone/APNs, security/load, backup/restore and rollback evidence. No deployment without separate owner authorization; keep NOT_RELEASED.

1. Diagnose the long-suite route-map fit polling timeout (19/20 full candidate E2E, same test 1/1 isolated PASS); instrument scheduling/map events and repeat the long run without weakening assertions.
2. Repeat Server `npm run test:integration` on the supported exact runtime Node 24.21.0; the local full suite passed on Node 25.4.0 against loopback `marshgo_e2e`, which is supplemental only. Exact candidate Server CI already passed.
3. Record iOS PR #14 clean candidate Simulator checks `40041831739` and `40041815392` PASS; exact pins match Site PR #21 and Server PR #35.
4. Complete authenticated Admin/Partner and tenant-isolation workflows; current source/local evidence covers only entry/login and no-session 401.
5. Continue dense-Lviv completeness from exhaustive small-feed equivalence; live route outputs remain truncated, Lviv GTFS-RT sample is empty, and unknown fares must remain unknown.
6. Close external gates (staging credentials/domain, provider agreements/keys, physical iPhone, backup/restore, rollback, load/security acceptance). Do not deploy; keep `NOT_RELEASED` pending evidence and separate owner rollout approval.

# Next actions — MARSHGO Final Master Production

## Latest handoff — 2026-10-24

1. Preserve dirty worktrees; root `f727312619dbb6d73b7de8eba99bab55880201d`, Site `6961afcf008e2c845c0fde68c687ce61fe744f2f`, Server `182c77ae4f78d576a287007d8d0864fb130f43f8` are the current local HEADs and the exercised worktrees contain uncommitted changes.
2. Record the completed local fixture evidence: root functional Playwright 20/20 PASS; dedicated route-map screenshot scenario 1/1 PASS after reviewed update of seven route-map baselines; Site build/typecheck/lint and unit tests 98/98 PASS. This does not equal exact-SHA/staging/production or acceptance of all ten references.
   - Active Server dirty checkout also passed its full unit suite on Node 24.21.0: 224 PASS, 0 FAIL, 1 opt-in integration skip, plus typecheck and lint.
3. Resume P0 route completeness from the exhaustive small-feed oracle in an isolated Server candidate; do not change the active dirty Server tree. Require oracle parity plus frozen Lviv all-strategy winners, useful-chain recall/diversity, latency and memory evidence before any integration.
   - A separate test-only candidate commit `193b38e9849961fca9acf2cacb4535e3df704212` reduces one 13,000-row synthetic fixture to 520 while retaining the 500-cap regression assertion. Its full targeted suite is 82/82 PASS on Node 24.21.0; review ancestry before considering merge. It does not resolve Lviv truncation.
4. Continue dedicated conditional/destructive-control tests and authenticated Admin/Partner authorization, then provider rights/live probes, staging/deployed SHA, physical iPhone/Safari, security/load, backup/restore/rollback. Keep `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED` until all required gates have evidence and deployment is separately authorized.
   - Latest read-only provider probe found 28/38 open feeds healthy, but Lviv realtime is empty and both daytime routing cases return 100 results with truncation. Keep live-fleet display off for those feeds, keep unknown fares unknown, and use the new audit file to continue graph-retention work. CityBikes/Zelectra/Nextbike discoveries do not establish a Ukrainian rentable-fleet provider.

## Current checkpoint — 2026-10-23, exact Site/Server/iOS candidates

1. Site branch `codex/guidance-progress-pr19-20261023` now contains exact head `a000b3cc07a956ae7ded4563ab5e97b11fe3db71`; PR #20 base is `codex/map-layers-reference-20261023` at `3ca6957461e5d3967fb0ca1e450f9e2495f4cc34`.
2. Local Site `npm run check:production` passed: typecheck, E2E typecheck, lint, 129 unit tests, production build, bundle gate, and 24/24 Chromium/Firefox/WebKit checks. Hosted Site workflows `39995439983` and `39995439935` attempt 2 passed.
3. iOS PR #12 head `6e825cd59df9529c9b88aab063989d7328497fef` pins Site `a000b3c…` and Server `b658825…`; exact hosted Simulator run `39996495495` passed. The Site retry completed browser acceptance and uploaded an immutable artifact.
4. Exact Site/Server local fixture integration passed **19/19**, including 192 visible-control clicks over 16 paths, two-account booking/chat, route map, transport selection, GPS reroute, and rendezvous. 12 heuristic no-change clicks are only partially classified. Pixel acceptance of all ten owner images, physical iPhone, live providers, staging, full security/load, backup/restore/rollback, and production deployment remain NOT_TESTED/BLOCKED_EXTERNAL.
5. Continue independent P0 gaps, starting with controlled dense-Lviv route-search completeness and cross-repo API/migration acceptance. Refresh the candidate manifest only with exact hashes and actual checks; retain `NOT_RELEASED` until all required evidence and release authorization exist.
6. Server PR #33 `e7e695ee337f64af97679c283c3988dfe883c200` is stacked on PR #31; local GTFS 72/72, typecheck and lint passed; exact GitHub CI runs `40000373667` and `40000335218` both SUCCESS (including migrations, PostGIS/Redis integration and API image smoke). This PR is validation/refactor only, not a search-completeness fix; keep separate until the dependent routing stack is reviewed.

Older checkpoints below are historical; this section is the current handoff.

## Historical checkpoint — superseded by the exact-candidate checkpoint above

1. Check Site PR #20 exact commit `d761d4b6d8d909caa22e7c72713f0ea3badede41`; run `39993143251` is still in progress. Reconcile the PR base with current PR #19 head before any final tuple.
2. Re-run the full browser suite on the latest candidate with isolated fixture map/geocoder/OSRM services. The last full suite had one route-sheet swipe failure; the fix now passes the entire targeted route-map scenario functionally. One legacy transport-map screenshot differs from the newer PR #19 design and must be reviewed against the owner-provided reference, not silently replaced.
3. Continue visual acceptance across all ten owner images and mobile/desktop breakpoints. Current local review is partial; do not report full design acceptance.
4. Update an exact-SHA release candidate only after checks/artifacts pass; retain `NOT_RELEASED` while staging/deploy identity, live-provider rights/probes, iPhone/APNs, backup/restore/rollback evidence, and owner rollout approval are absent.
5. Continue the routing completeness issue independently: frozen dense-Lviv GTFS remains `searchTruncated`; no experiment has yet passed the exhaustive oracle and multi-objective candidate checks.

6. Continue E2E coverage of Admin/Partner authenticated paths and browser compatibility, using disposable fixture stores and role isolation.
7. Close owner-controlled production gates when the corresponding access becomes available: staging URL/deploy identity, provider credentials and commercial rights, licensed map assets, iPhone/APNs/signing, backup/restore/rollback evidence, and explicit production rollout approval.
8. Do not mark `RELEASED` without an authorized deployment, HTTPS smoke, deployed-SHA verification and rollback evidence.

No Git branches, repositories, containers, volumes, databases, or user artifacts were deleted/reset during this checkpoint. Test databases are isolated `marshgo_e2e_*` databases and were not dropped.


## Current routing follow-up — 2026-10-23

- Objective-window sweep on frozen Lviv GTFS showed no winner change at 25k/50k/100k; all searches remain truncated, and the 100k graph budget is already binding. Do not simply raise the 25k window. See `/Users/dima1203/Desktop/MarshGO-Server-gtfs-raptor-round-search-20261023/docs/audit/GTFS_OBJECTIVE_WINDOW_SWEEP_2026-10-23.md`.
- Alternate bounded traversal is rejected: it reached its label cap and lost all baseline top-100 recall on the three replayed ODs. Do not wire it into production.
- Next exact task: inspect graph allocation/retention with the independent small-feed oracle; prototype one alternative retention policy behind test-only seam; require exhaustive-oracle parity, frozen-feed objective winners and no unacceptable resource regression before changing production.
- Release stays `NOT_RELEASED`; no staging or deployment was performed.

- Review handoff: diagnostic report commit `904a15a57ed7332b0620d048b4d724e7e681beb3` was pushed normally on `codex/gtfs-raptor-round-search-20261023`; stacked documentation PR #34 targets PR #33's branch: https://github.com/dima1203oleg/MarshGO-Server/pull/34. Its Server CI run `40002725799` was in progress at the last poll.


## Browser-control acceptance update — 2026-10-23

- Exact manifest Site/Server button audit completed: 192 clicks, 3/3 tests PASS, no uncaught page errors or unexpected HTTP 5xx. The 12 heuristic no-effect observations are tied to already-selected/empty-invalid states; details and scope limits are in CODEX_PROGRESS and the production acceptance matrix.
- Added and verified the missing home-banner selector transition assertion (1/1 PASS); `eslint e2e/button-audit.spec.ts` and `git diff --check` pass. It remains an unstaged change in the existing dirty root tree.
- Next: visual-match the ten owner screenshots and continue conditional-flow acceptance; do not equate local fixture acceptance with live/staging/production readiness.
- 2026-10-24 checkpoint: full local Playwright fixture suite on dirty Site/Server worktrees is 19/20 PASS; route-map functional-only recheck 1/1 PASS. Remaining single failure is the real dark half-expanded screenshot delta (19,828 px / 6%), not hidden by refreshing snapshots. Exact SHAs, scope and limits are in `docs/audit/99_FULL_UI_E2E_AND_MOCK_RECHECK_2026-10-24.md`.
- Next exact UI action: compare the actual dark half-sheet against user references 8–10 and adjust the production route sheet/layout only where the reference establishes a clear intended difference; then capture and review all ten matching states before accepting visual parity. Next release action remains a clean exact-SHA integration and staging readiness review; production stays `NOT_RELEASED`.
# Next execution checkpoint — 2026-10-24

1. Routing P0: continue from the reviewed Server state and frozen-feed diagnostics. Build a new retention/expansion candidate without changing the active dirty checkout; prove exact-oracle parity on small feeds, then replay all three Lviv ODs against the frozen GTFS SHA. Acceptance requires preserved FASTEST/CHEAPEST/BALANCED winners, improved useful-chain recall, explicit truncation, and measured runtime/heap/RSS.
2. Do not integrate the rejected round-search prototypes or older overflow candidate until the above gates pass. PR #33 and #34 are open documentation/test-stack PRs with green CI; neither resolves search completeness.
3. Continue the remaining production acceptance independently: reconcile the dark half-expanded reference, authenticated Admin/Partner flows, live provider rights/health, staging, iOS physical-device checks, security, performance, backup/restore, and rollback. No production deployment without the owner's separate release approval.
