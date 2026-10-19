# MARSHGO production execution state

**Last verified:** 2026-10-19, Europe/Kyiv
**Current phase:** Server and Site integration candidates pushed with open PRs; local integration checks passed; no confirmed staging or production deployment.
**State:** IN_PROGRESS. Existing uncommitted work is preserved.

## Outcome goal

Deliver an improved, integrated and tested MARSHGO production version across the applicable repositories. Keep executing independent implementation and verification work through the defined work cycle until the production acceptance gates pass or a specific external prerequisite blocks the remaining action. Never report a local build as production. Never call the work complete merely because an audit or checkpoint was written.

## Current local baseline

| Repo | Branch | HEAD | Worktree | Remote pointer at last local inventory |
|---|---|---|---|---|
| MarshGO orchestrator | `codex/production-finalization-20261014` | `d75748311ae981ade2fe61113f00379fe810e68c` | Dirty: code/docs/E2E/screenshot/feed work | Remote refs to be recorded after PR/CI inspection |
| Server | `feature/transport-layer-availability` | `182c77ae4f78d576a287007d8e0864fb130f43f8` | Dirty: journey/feed/live/cache/integration work | Same as requested branch SHA from `ls-remote` |
| Site | `codex/sync-journey-mobility-ui` | `6961afcf008e2c845c0fde68c687ce61fe744f2f` | Dirty: production UI/map/rendezvous/routing work | Same as requested branch SHA from `ls-remote` |
| iOS | `codex/production-site-sync-20261014` | `4353cec3cacbaf662ceea047402f361024292b22` | Root tracked tree clean; embedded ignored `web/` has separate old Site SHA and dirty files per prior checkpoint | Same as `codex/reliable-capacitor-sync` SHA |
| Admin | `codex/p0-admin` | `9dbf7db0a935498ac40c98b19bc36bce056d630d` | Clean at inventory | Same as requested branch SHA |
| Partner | `codex/p0-partner` | `c639257a7f28aeda5b378a816038b01651146b83` | Clean at inventory | Same as requested branch SHA |
| MarshGO2 | `main` | `8542f4b5bd90512d8e22974bcdb9b1184c700821` | Dirty: large UI/API adapter/design diff; preserve | Not checked yet |

Local worktrees also exist for MarshGO cache/navigation, Server cache/GTFS/nav/Partner, Site design/GTFS/cache/nav, and iOS cache/governance/nav/rendezvous. No `AGENTS.md` was found under the workspace parent in the inventory command.

## Existing verification evidence (inherited, local, not release evidence)

- MarshGO local E2E: 13/13, using local test API, PostGIS/Redis and deterministic fixtures. This is not staging or production.
- MarshGO-Site: 95/95 unit tests, typecheck, lint, production build and bundle budget passed on dirty checkout.
- MarshGO-Server: previous checkpoint has 29/29 integration checks and 214 tests (one opt-in skip) for an earlier working state; this must be rerun against current dirty changes before treating as current.
- Live feed probes dated 2026-10-19: Dozor Ivano-Frankivsk and Uzhhorod positions were fresh at probe time; EasyWay Poltava was stale/degraded. Route/trip/shape identity remains a separate gate.
- No verified deployed production origin. A temporary staging URL in historical manifests is not evidence of a currently active deployment. Local API had previously been unavailable at `127.0.0.1:3002`.
- Production, physical iPhone, TestFlight/App Store, commercial provider booking and current GitHub CI are not verified for the current dirty worktrees.

## This execution resumed

1. Rechecked status, HEAD, remotes and worktrees for seven local repositories; preserved every existing modification.
2. Verified the user-listed starting branch names exist remotely for MarshGO, Server, Site, Admin, Partner and iOS. This establishes existence only, not merge readiness or PR/CI acceptance.
3. Read the multimodal-routing and transit-feed skills. Keep production claims gated on route feasibility, exact feed identity and freshness.
4. Saved the task contract in `docs/MARSHGO_FINAL_PRODUCTION_SPEC.md`.
5. Queried all open PRs and recent GitHub Actions for the seven repositories. Open PR chains and conflicts are recorded below; green checks on an earlier SHA do not cover uncommitted work.
6. On Admin PR head `9dbf7db0a935498ac40c98b19bc36bce056d630d`, ran `npm test` (2/2), `npm run typecheck`, `npm run lint`, and `npm run build`: all passed.
7. On Partner PR head `c639257a7f28aeda5b378a816038b01651146b83`, ran `npm test` (3/3), `npm run typecheck`, `npm run lint`, and `npm run build`: all passed.

## GitHub PR / CI inventory, 2026-10-19

Checks below are the `gh pr view` status snapshot from this date. `CLEAN/MERGEABLE` is GitHub mergeability only; it is not owner approval or an instruction to merge.

| Repository | PR | Head → base | GitHub merge status | Current note |
|---|---:|---|---|---|
| MarshGO | #1 | `codex/marshgo-production` → `main` | BLOCKED / mergeable; draft | Hosted checks successful at `cd0b62d1…`; local working branch has unrelated newer/dirty changes and is 12 behind this ref. |
| MarshGO | #2 | `codex/redis-smart-cache` → `codex/marshgo-production` | DIRTY / conflicting | Checks successful; resolve only in isolated integration worktree. |
| MarshGO | #3 | `codex/navigation-experience-6` → `codex/redis-smart-cache` | CLEAN / mergeable | Checks successful. |
| MarshGO | #4 | `feature/unified-repository-governance` → `codex/navigation-experience-6` | CLEAN / mergeable; draft | Checks successful. |
| Server | #1 | `codex/rendezvous-live-pickup` → `main` | DIRTY / conflicting | Checks successful; conflict needs review. |
| Server | #2 | `codex/security-parse-bearer` → `main` | CLEAN / mergeable | Checks successful. |
| Server | #3 | `codex/sync-mobility-registry` → `main` | CLEAN / mergeable; draft | Checks successful. |
| Server | #4 | `codex/partner-platform-foundation` → #3 branch | CLEAN / mergeable | Checks successful; stacked dependency. |
| Server | #5 | `codex/redis-smart-cache` → #3 branch | CLEAN / mergeable | Checks successful; stacked dependency. |
| Server | #6 | `feature/gtfs-stop-arrivals` → #5 branch | CLEAN / mergeable; draft | Checks successful; stacked dependency. |
| Server | #7 | `feature/transport-layer-availability` → #3 branch | CLEAN / mergeable; draft | Checks successful on head `182c77ae…`; primary dirty local checkout is the same base SHA plus uncommitted changes. |
| Site | #1 | `codex/rendezvous-live-pickup` → `main` | DIRTY / conflicting | Checks successful; conflict needs review. |
| Site | #2 | `codex/navigation-deep-link-alias` → `main` | BEHIND / mergeable | Refresh/recheck before integration. |
| Site | #3 | `codex/sync-journey-mobility-ui` → `main` | CLEAN / mergeable | Checks successful on head `6961afcf…`; primary dirty checkout shares this HEAD. |
| Site | #4 | `codex/redis-smart-cache` → #3 branch | CLEAN / mergeable | Checks successful; stacked dependency. |
| Site | #5 | `codex/navigation-experience-6` → #4 branch | CLEAN / mergeable | Checks successful; stacked dependency. |
| Site | #6 | `codex/journey-rendezvous-map` → `main` | CLEAN / mergeable | Checks successful; competing map candidate requires functional comparison. |
| Site | #7 | `feature/gtfs-stop-arrivals` → #6 branch | CLEAN / mergeable; draft | Checks successful; stacked dependency. |
| iOS | #1 | `codex/simulator-smoke-capture` → `main` | DIRTY / conflicting | Checks successful; conflict needs review. |
| iOS | #2 | `codex/reliable-capacitor-sync` → `main` | CLEAN / mergeable | Checks successful on head `4353cec3…`; local tracked checkout is clean. |
| iOS | #3 | `codex/redis-smart-cache` → #2 branch | DIRTY / conflicting | Checks successful; stacked conflict. |
| iOS | #4 | `codex/navigation-experience-6` → #3 branch | CLEAN / mergeable | Checks successful; stacked dependency. |
| iOS | #5 | `codex/pin-rendezvous-site` → #2 branch | CLEAN / mergeable | Checks successful; pins a different Site candidate; compare against current web candidate. |
| Admin | #1 | `codex/p0-admin` → `main` | CLEAN / mergeable | Hosted Verify successful at `9dbf7db0…`; local test/type/lint/build all pass. |
| Admin | #2 | ownership guidance → `main` | CLEAN / mergeable; draft | No checks yet. |
| Partner | #1 | `codex/p0-partner` → `main` | CLEAN / mergeable | Hosted Verify successful at `c639257a…`; local test/type/lint/build all pass. |
| Partner | #2 | ownership guidance → `main` | CLEAN / mergeable; draft | No checks yet. |
| MarshGO2 | — | — | No open PRs returned | Dirty `main` has 22 modified tracked files and 4 untracked source files; preserve and assess for unique code before any transfer. |

Latest selected CI snapshot: Server and Site ownership-guidance heads passed; latest listed Server feature transport and Site navigation PR checks passed. Admin/Partner P0 and iOS ownership-guidance checks passed. These runs do not prove production and generally do not include local dirty diffs.

## Exact next action

### Server integration candidate, 2026-10-19

- Created isolated worktree `/tmp/MarshGO-Server-integration-20261019` on `integration/production-20261019`, based on current remote `main` `bdfdf24941809f4581965b9847022c68e0b2f127`.
- Integrated mobility registry, Partner platform, Redis smart cache, GTFS stop arrivals and transport availability branch stacks. Candidate merge base after integration: `9c30b87fbd593fc3333ff868ab9254d3ae51a00d`.
- Compared the older conflicting rendezvous PR with current candidate; its consented rendezvous routes/session foundation already exists in the newer candidate. The older PR was not blindly merged. Carried forward the current dirty Server's consent, live-segment, freshness and request memo work as a separate uncommitted candidate diff.
- Fresh loopback Postgres database `marshgo_e2e_clean_20261019_b` applied all 51 migrations through `054_rendezvous_participant_consent.sql`; a second migration invocation applied no additional migrations.
- Current isolated candidate verification after the source/test diff: unit tests 229 passed, 0 failed, 3 optional skips; TypeScript typecheck, ESLint, `git diff --check` and staged-diff check passed. `npm ci` reported 0 dependency vulnerabilities (runtime 24.19.0 vs CI-pinned 24.21.0 produced an engine-version warning only).
- Full loopback Postgres/Redis integration suite passed: journey schema 2, live journey segment API, booking/trip editing 21, Partner tenant isolation 1, navigation 2, Redis realtime across two API instances 1, API restart booking durability 1, shared rate limit 1; no failures. Fixture/loopback evidence only, not staging or production.
- Candidate committed as `0c873adeb618bd871395a7ba150ba8c95d0ce19c`, pushed to `integration/production-20261019`, PR [MarshGO-Server #9](https://github.com/dima1203oleg/MarshGO-Server/pull/9).
- GitHub Actions check-runs for this exact SHA: 2/2 completed successfully. Local unit, typecheck, lint, fresh-migration, and PostgreSQL/Redis integration results are listed above. PR remains open and unmerged.

### Site integration candidate, 2026-10-19

- Created isolated worktree `/tmp/MarshGO-Site-integration-20261019` from remote Site `main` `b17f26ed68528c04f24e750d0fa2a11609781609`, branch `integration/production-20261019`.
- Integrated current PR stack: journey UI, Redis cache, navigation, rendezvous map, and GTFS arrivals. Preserved canonical GPS/docs/map utilities from the Site working tree as a reviewed snapshot merge; original dirty Site checkout remains untouched.
- Added selected-transit context geometry, exact route live-vehicle markers from the Server live endpoint, freshness filtering, backend `emphasized` state, map hit targets, selected-only map geometry/waypoints, and consent fail-closed behavior for rendezvous location sharing.
- Candidate commit `94b52e50725241d1ac28bcfa3f83fbbd0e04f101`, pushed to `integration/production-20261019`, PR [MarshGO-Site #9](https://github.com/dima1203oleg/MarshGO-Site/pull/9). Open, unmerged.
- Exact-SHA local checks: typecheck PASS, lint PASS, unit 118/118 PASS, production build PASS, bundle budget PASS on the pre-final tiny diagnostic change, final fixture build PASS, `git diff --check` PASS. Browser route-map E2E PASS 1/1 on isolated test DB and Server candidate SHA `0c873ade…`; it covered all later behavior assertions after a map diagnostics correction.
- Pixel screenshot comparison against stored light-results image FAIL: 38,126 pixels (12%) differ. Baseline was not updated. Needs visual review; this is not behavior E2E failure.
- GitHub Actions on exact Site candidate SHA later completed: 3/3 checks successful. REST API was used because GraphQL hit its rate limit.

### iOS synchronization candidate, 2026-10-19

- Created isolated worktree `/tmp/MarshGO-iOS-integration-20261019` from `codex/reliable-capacitor-sync` at `4353cec3…`; left the original iOS checkout and its ignored, dirty embedded `web/` tree untouched.
- Checked out the exact Site candidate SHA `94b52e50725241d1ac28bcfa3f83fbbd0e04f101`; verified the checkout, built the Site, wrote bundle metadata with Server candidate `0c873ade…`, API contract `v1`, migration `054`, and ran `npx cap sync ios` successfully.
- Found the current non-tag iOS workflow pin was the older Site SHA `be4a3f579971a981f580ff590a81166cdef0b712`. Updated both the checkout ref and verification ref to the exact Site candidate SHA.
- Unsigned Xcode Simulator build passed on iOS Simulator SDK 27.0. Local app installation/launch remains NOT_TESTED: the iOS 27.0 simulator booted but `simctl install` stalled twice in the CoreSimulator service and was stopped. No physical-device test was attempted.
- iOS integration commit `50e15da67cb795651f754db8237cb98051e29eff`, PR [MarshGO-iOS #7](https://github.com/dima1203oleg/MarshGO-iOS/pull/7), open and unmerged. GitHub Simulator checks completed successfully: 2/2.
- The local compile used `https://api.marshgo.invalid` only as a reserved non-routable placeholder. No staging API origin is confirmed; this cannot be used as a release configuration.

### Exact next action

Refresh iOS PR #7 check-runs; continue exact-SHA integration and cross-portal/API acceptance for Admin and Partner. Investigate the unresolved Site screenshot difference against approved references. Keep original dirty worktrees intact. Do not claim production readiness without a verified staging deployment, exact deployed SHA, backup/rollback, provider/device acceptance, and required owner approval. Candidate manifest: `docs/PRODUCTION_RELEASE_CANDIDATE_2026-10-19.md`.

## Hard limitations

No branch deletion, history rewrite, force push, production deployment, destructive data cleanup, or external paid provisioning. Deployment and physical-device permissions that require the owner remain external gates. Do not call this checkpoint a product release.
