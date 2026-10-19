# MARSHGO production execution state

**Last verified:** 2026-10-19, Europe/Kyiv
**Current phase:** Advancing the integrated release candidates: mutual live rendezvous map implemented, browser-accepted, and pinned into iOS. Admin/Partner UI-browser acceptance, full visual review, staging and production remain open.
**State:** IN_PROGRESS. Existing uncommitted work is preserved.

## Outcome goal

**Owner-set objective (2026-10-19):** finish and improve MARSHGO into a working, integrated, production-tested release across the applicable repositories. Continue the cycle `inspect → implement → verify → fix → checkpoint → continue` through every available work item; do not stop at an audit, plan, one fix, successful build, or local tests. The objective is complete only when the production acceptance gates in `docs/MARSHGO_FINAL_PRODUCTION_SPEC.md` have evidence. If an action is blocked by an actual external prerequisite (credentials, contract, environment, or explicit deployment approval), finish all independent work, record the exact blocker and what is ready, and resume from this checkpoint when it is cleared. Never label local or staging evidence as production evidence, and never claim completion while any required gate is open.

This is a persistent execution objective, not authorization to bypass access controls, required review, or the separate approval gate for production traffic, destructive migrations, or App Store publication. If the execution is interrupted, resume from this file, the acceptance matrix, and the existing Git diff; do not restart completed audits.

## Latest continuation checkpoint — 2026-10-19

### Production objective continuation — 2026-10-19 10:30 Europe/Kyiv

- Site integration branch `integration/production-20261019` now includes commit `09871e6da312e6ac72c83857fbd3106e9c28cc7c` (PR #9). It adds a shared post-booking rendezvous map with the pickup point, both consented fresh participant positions, separate approach lines, explicit straight-line/estimated ETA wording, and useful camera framing above the mobile bottom panel.
- Root browser acceptance against the exact Site build and local Server candidate passed: focused rendezvous test 1/1. It asserts all three map markers, two approach features, both participant distance/ETA cards, and meeting context. Screenshot visually reviewed at `/tmp/marshgo-rendezvous-map.png`; all markers and approach lines are visible. Site typecheck, lint, production build and 118 unit tests passed. GitHub checks on Site PR #9 are 3/3 PASS.
- Full browser suite on the new candidate ran 13 tests: 11 passed; two failed. The two-account failure was a stale test selector for pre-activation copy. After correcting the selector, the same two-account search/booking/negotiation/chat lifecycle passed 1/1. The route-map test failed its existing macOS screenshot comparison at 38,126 pixels (12%); no baseline was overwritten. A separate named Chromium behavior-only run of the same route-map E2E passed 1/1, covering interactions/geometry while the normal screenshot gate remains open.
- Button audit on the same candidate completed: 152 visible actions were clicked with no page/runtime errors; it listed 14 actions with no detected visible delta. These require product review/classification (some are tabs/navigation or attribution links), not automatic suppression.
- The E2E work exposed and fixed an async initialization race: meeting locations could reach the screen after the map adapter callback had captured empty positions. The adapter now reads current point state, creates DOM markers while the style is loading, and restores vector approach lines when the map style becomes ready.
- iOS integration branch `integration/production-20261019` now includes commit `68b833499a11fa67763fb6fcfd79b972783fe140` (PR #7), pinning Site `09871e6…`. Capacitor sync, exact Site bundle metadata, unsigned Xcode Simulator build, simulator install/launch and screenshot passed locally with Node 24.21.0. Screenshot `/tmp/marshgo-ios-rendezvous-09871e6-node24.png` shows the app welcome screen after WebView startup; interactive auth/booking on iOS was not exercised.
- These candidate changes are pushed for review, not merged or deployed. iOS GitHub Simulator checks are now 2/2 PASS. Physical GPS, background behavior and push remain untested.
- Remaining broader work is unchanged: full production route/role/API acceptance across Site/Admin/Partner, canonical screenshot comparison, city/feed commercial rights/live provider checks, iOS interactive flows, and an authorized/stable staging environment with HTTPS, observability, backup/restore and rollback. No production origin/deployed SHA is verified.
- **Next action:** diagnose the 12% screenshot mismatch against approved current design references without refreshing baselines blindly; classify the 14 no-visible-delta button audit entries; continue Admin/Partner browser acceptance and inspect staging/deployment configuration. Candidate manifests now carry exact Site/iOS SHAs. Do not mark production ready from these local/candidate results.

### Admin/Partner portal and deployment check — 2026-10-19 10:40 Europe/Kyiv

- Started the exact Admin candidate `9dbf7db0a935498ac40c98b19bc36bce056d630d` and Partner candidate `c639257a7f28aeda5b378a816038b01651146b83` locally; both Vite entrypoints loaded in Chromium. Admin Overview, Partners, Providers, Integrations and Audit navigation rendered. Partner Overview rendered. At 1280px desktop and 390px mobile document widths, neither app showed horizontal overflow in this smoke. Captures are in `/tmp/marshgo-admin-mobile.png` and `/tmp/marshgo-partner-mobile.png`; screenshots reviewed. These were development preview sessions, not authenticated production roles or data.
- Preview banner explicitly states server API and business actions are disabled. The configured API origin returned 502 during restore attempts; no transaction was claimed from this UI smoke. Existing loopback API acceptance remains the separate proof for Partner application → Admin approval → persisted Partner status/permissions.
- Validated deployment prerequisites: production and staging Compose definitions exist, but `docker compose config -q` cannot resolve the required environment variables in this environment. Production has no verified stable origin/deployed SHA, host/domain, or supplied production secrets. This confirms staging/prod configuration is blocked; it does not indicate the files are absent.
- **Next action:** run a visual regression review across all production screens at 320/390/430/768/1280/1440 without changing baselines; then build/verify candidate deployment artifacts and keep staging blocked until the required isolated host/config/credentials exist. Keep Admin/Partner authenticated browser flow as NOT_TESTED until connected to a reachable candidate API.

### Five-repository release build and portal runtime — 2026-10-19 10:48 Europe/Kyiv

- Closed a release-orchestration gap: the production Compose stack previously had only Server and Site. It now also defines pinned Admin and Partner services on `admin.$APP_DOMAIN` and `partner.$APP_DOMAIN`, with same-origin `/api/v1` proxying through the central Server. CORS origins include these two HTTPS origins. Caddy routes each hostname; deployment bootstrap/update/rollback and CI now build and manage all four web/API images.
- Extended release materialization to require and verify exact `admin_sha` and `partner_sha`, generate strict allowlist Docker contexts for both portals, copy the shared Nginx API proxy, and record commit/config digests. Added a deployment-contract regression test.
- In isolated `/tmp/marshgo-five-repo-build-check.EgkopC`, materialized Server `0c873adeb618bd871395a7ba150ba8c95d0ce19c`, Site `09871e6da312e6ac72c83857fbd3106e9c28cc7c`, Admin `9dbf7db0a935498ac40c98b19bc36bce056d630d`, and Partner `c639257a7f28aeda5b378a816038b01651146b83`. Compose config validation and Docker builds for `api`, `web`, `admin`, and `partner` all passed. Build used placeholder-only environment values; no app services or real external credentials were started.
- Runtime smoke used a disposable Docker network and a mock API: Admin/Partner each returned HTTP 200, rendered the SPA, proxied `/api/v1/auth/refresh` to the mock API (expected 401), and had zero page errors. Test containers/network were removed. Caddy 2.9 config validation passed. This proves container/runtime wiring only, not authenticated portal acceptance or staging behavior.
- Root `npm run check:production` passed: typecheck, all lint, 252 tests (251 pass, 0 fail, 1 optional integration skip), production build and bundle budget. `tests/production-deployment-contract.test.ts`: 2/2. `bash -n` on bootstrap/update and `git diff --check` passed.
- **Next action:** commit only the reviewed orchestration/docs files, advance `integration_sha` to that exact orchestration commit, and run CI including the four-image materialization/build. Then continue screenshot acceptance and the API-backed portal UI flow; deploy to staging only when a stable host/secrets are supplied. Do not deploy production from the dirty worktree.

- Commit `fb06856c1bc000de9bc074d1f8b99791c2f71fe4` now contains the reviewed Admin/Partner deployment wiring, acceptance test, current five-repository pins, and evidence updates. The manifest `integration_sha` has been advanced to this commit. Remaining unrelated dirty files were left unstaged and untouched. Next: push this working branch, verify hosted CI on the exact commit, and continue the screenshot/API-backed portal acceptance queue.

- Reconfirmed the Server integration checkout at `/tmp/MarshGO-Server-integration-20261019`, clean at `0c873adeb618bd871395a7ba150ba8c95d0ce19c`.
- Focused routing suite on that SHA: 82 passed, 0 failed, 0 skipped (planner, scoring, search, completeness, GTFS timetable/realtime, walking, community composition).
- Full guarded Server loopback integration script against `marshgo_e2e_site_20261019` and local Redis: 30 passed, 0 failed, 0 skipped. Covered schema, live-journey ownership/unavailable state, 12-mode search/API auth, community booking and race/idempotency, trip edits/cancellation, rendezvous confirmation, vehicle verification, partner tenant isolation, navigation/GPS privacy, Redis realtime across instances, restart durability, and shared rate limits. DB host was loopback; only test ports 13306–13308 and 3304 were used; no process remained after cleanup.
- Combined current local Server evidence: 112 passed, 0 failed, 0 skipped on SHA `0c873adeb618bd871395a7ba150ba8c95d0ce19c`. The mode matrix in this isolated DB returned only a community carpool offer; transit/provider modes were explicitly blocked because no enabled healthy matching provider was available there. This is not evidence of live city-feed coverage.
- Updated this state and the production spec with the owner-set objective to continue through the acceptance gates. These documentation edits are currently uncommitted in the root worktree and are preserved.
- **Next action:** continue Site/Admin/Partner production-screen browser acceptance and visual review at their exact candidate SHAs; then verify available staging/deployment configuration and external feed coverage. This checkpoint is not staging or production acceptance.

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

### 2026-10-19 execution update — marketplace lifecycle and Site/iOS sync

- Fixed the production booking UI so a successful server booking immediately navigates to Trips; slower background list refreshes no longer keep the committed booking modal spinning. Refresh failure is reported without misrepresenting the already committed booking.
- Clarified the disabled rendezvous action label (“Зустріч можна підготувати о …”) and labeled the actual verified-vehicle selector explicitly. Site candidate commit `95c9fb07202605ad1b8755a2a2680e2786a1e29a` is pushed to the existing open [Site PR #9](https://github.com/dima1203oleg/MarshGO-Site/pull/9); PR head is exact and GitHub checks are 3/3 PASS.
- The source E2E fixture now seeds `trust_level=3` when it claims a vehicle is verified. The API requires trust level ≥1 for proposals; the prior fixture only set legacy `verification_status='verified'`, which left `trust_level=0` and made the UI scenario impossible. Server enforcement was not loosened.
- On the exact Site artifact built with isolated map fixtures and exact Server SHA `0c873adeb618bd871395a7ba150ba8c95d0ce19c`, all marketplace browser E2E passed: 9/9, 0 failed. Includes the complete two-account booking, MarshPass/boarding/completion/review/chat/reverse-marketplace flow; route map/GPS, responsive iPhone viewport, search persistence and onboarding. This is local isolated Postgres/Redis/fixture evidence, not staging.
- Updated iOS workflow and README to pin Site `95c9fb07202605ad1b8755a2a2680e2786a1e29a`. iOS commit `295c532aa61c181320cd03dd7a7a3eb5c3aa3e35` is pushed to open [iOS PR #7](https://github.com/dima1203oleg/MarshGO-iOS/pull/7). Exact checkout, Node 24.21.0 Site build, Capacitor sync and unsigned Xcode Simulator compilation pass locally. GitHub Simulator checks are 2/2 PASS. Simulator installed and launched; after WebView startup the welcome screen visibly rendered (capture `/tmp/marshgo-ios-candidate-95c9fb0-later.png`). Interactive sign-in/booking and physical iPhone remain unverified.
- **Exact next action:** stage only acceptance docs and E2E fixture-only correction in the orchestrator branch; leave unrelated dirty files untouched. Continue Admin/Partner UI-browser acceptance, investigate the 12% screenshot diff without replacing baselines, and check current staging availability.

### Admin / Partner acceptance continuation, 2026-10-19

- Started the exact local Server candidate SHA `0c873adeb618bd871395a7ba150ba8c95d0ce19c` on loopback port 3302 against the isolated local Postgres database `marshgo_e2e_site_20261019` and local Redis on port 6380. This was a test environment, not staging.
- Admin and Partner Vite entrypoints responded HTTP 200 on loopback ports 4176 and 4177. The browser automation attempt did not complete a UI sign-in assertion; therefore portal-browser acceptance remains NOT_TESTED.
- Using the real development OTP endpoint (not dev-preview), created a Partner account and application. An existing local-only test admin role was used in this isolated DB; Admin API loaded the live dashboard and pending-partner queue and approved the application. The Partner API then read persisted `ACTIVE` / `APPROVED` status and its owner permissions. The pending `INTEGRATION_ONLY` organization correctly had `canManageOrders=false` and `canManageIntegrations=false`.
- The E2E data was written only to the isolated local database. No production or staging records were touched. This proves local central API and tenant-gated state transitions, not the interactive Admin/Partner UX or production authorization posture.
- **Next action:** investigate the visual baseline mismatch; if no approved current references are available, preserve it as an unresolved acceptance blocker. Check for a real staging origin and exact deployment SHA; do not deploy or promote without the required owner approval.

### 2026-10-19 exact workspace state refresh

- The previous continuation checkpoint was `417eebed9edc4ce3a96c8179fcca3fa9fabc481d`; the subsequent acceptance-evidence commit is `ec2dafdb79d64a7b71969a41c6d55ea37d76ee5c` on `codex/production-finalization-20261014`. Its worktree still contains many pre-existing/unrelated changes; only task documentation was selectively committed, and unrelated content remains untouched. This branch has no configured remote tracking ref, so it was not pushed.
- Candidate SHA set remains Server `0c873adeb618bd871395a7ba150ba8c95d0ce19c`, Site `95c9fb07202605ad1b8755a2a2680e2786a1e29a`, iOS `295c532aa61c181320cd03dd7a7a3eb5c3aa3e35`; Admin `9dbf7db0a935498ac40c98b19bc36bce056d630d`, Partner `c639257a7f28aeda5b378a816038b01651146b83`.
- Site PR #9 and iOS PR #7 descriptions now record exact latest evidence and limitations; both remain open/unmerged. Server PR #9 remains open/unmerged. No production merge/deploy has occurred.
- **Next action:** selective commit of the refreshed acceptance evidence; then exact visual review and live staging discovery/acceptance if an owner-controlled staging endpoint is available.

## Hard limitations

No branch deletion, history rewrite, force push, production deployment, destructive data cleanup, or external paid provisioning. Deployment and physical-device permissions that require the owner remain external gates. Do not call this checkpoint a product release.

### 2026-10-19 production-goal continuation

- Owner reaffirmed the persistent objective: continue through implementation and verification until there is a working, tested production release; do not stop at an audit, plan, local build, or partial fix. This remains an execution objective, not permission to bypass review or deploy to production without its required approval.
- Re-ran the rendezvous-map acceptance against the current `RELEASE_MANIFEST.json` pins (Server `182c77ae…`, Site `aff0ead3…`). The API fixture response was intercepted and returned HTTP 200, but the pinned Site artifact does not contain the required “Відкрити карту зустрічі” flow or `MeetingMapView`; the test fails at that acceptance step. The exact Site integration candidate `95c9fb0…` also lacks the screen, so this is an implementation gap in both checked release candidates, not a route-mock problem.
- `e2e/rendezvous-map.spec.ts` remains an untracked acceptance test. Its request matchers now use URL pathname predicates, but the absence of the Site UI still causes the expected failure. Do not weaken the assertion. The marketplace scenario also timed out in its long full-flow run; its test result page remained on chat, so investigate with a focused trace before attributing it to the verified-vehicle selector.
- **Next action:** add the mutual live meeting map to the isolated Site integration candidate, including pickup, both consented fresh locations, clear stale/permission states, distance and explicitly estimated ETA; then run focused acceptance against that exact candidate and its compatible Server SHA. Continue with Admin/Partner visual acceptance, screenshot difference triage, and staging discovery afterward.
- This checkpoint does not represent release readiness. Staging/production and physical iPhone remain unverified.
