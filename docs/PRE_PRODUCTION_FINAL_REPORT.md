# MARSHGO pre-production completion report

**As of:** 2026-10-01 (Europe/Kyiv)
**Overall release decision:** `READY_FOR_SERVER_DEPLOYMENT=NO` · `PRODUCTION_READY=NO`
**Staging:** temporary HTTPS URL is reachable at `https://adb01c5654955c.lhr.life`, but `STAGING_READY=NO` because the full two-sided product acceptance did not pass.

The percentages below are engineering estimates across the requested capability groups. They are progress indicators only; a partial item is not a release pass and percentages do not override the release gates.

## A. Overall status

| Area | Estimate | Evidence / boundary |
|---|---:|---|
| Pre-production completion | 62% | Strong local implementation and automation base; complete paired-user and external acceptance are not closed. |
| Code completion | 70% | Core auth, marketplace, booking, chat, navigation and rendezvous foundations exist; major multimodal, lifecycle and operations gaps remain. |
| Infrastructure preparation | 68% | Pinned-source deployment templates now verify canonical origins, reject dirty/symlink worktrees, and allowlist Docker contexts; local staging, encrypted backups and recovery checks exist. Clean-host deployment rehearsal and managed operations remain open. |
| Automated test readiness | 78% | Unit/integration/browser/CI suites run; complete production acceptance, broader failure matrix and public-browser matrix remain. |
| Web readiness | 68% | Production bundle, routes, MapLibre, geocoding/routing and responsive browser checks pass for tested flows; full product workflows remain partial. |
| iOS readiness | 43% | Simulator build/CI and wrapper are present; physical GPS/background, push, QR, signing and TestFlight remain unaccepted. |
| Navigation readiness | 57% | Road geometry and route UI render, navigation/reroute tests exist; continuous realistic GPS, passenger matching and multi-stop live acceptance remain open. |
| Security readiness | 66% | Production config fail-closed, server authorization/rate limits and latest CodeQL/Gitleaks pass; complete scan matrix and abuse acceptance are open. |
| Deployment readiness | 68% | Bootstrap/update/rollback and source pinning are implemented; real secrets, persistent staging, full topology rehearsal and operational recovery are open. |

## B. What works

- Canonical repository ownership is documented: Server, Site and iOS are the standalone sources of truth; umbrella owns integration/release/deployment records.
- Current canonical `main` refs and the staging Server PR ref are recorded in [REPOSITORY_STATE_FINAL.md](REPOSITORY_STATE_FINAL.md).
- The Web production build is deployed to an isolated local Docker stack exposed over temporary HTTPS. It includes staging-only PostGIS, Redis, S3-compatible S3Mock, development OTP, API, realtime and a production-built Site bundle.
- Browser UI can authenticate a fake staging user, geocode Striy/Lviv, calculate an OSRM road route, render MapLibre/OpenFreeMap tiles and route geometry, create a demand, and reload that persisted demand.
- Staging `/healthz` and `/readyz` passed. API restart recovery passed. A Redis stop correctly changed readiness to 503 while PostgreSQL remained connected; after Redis restarted, readiness returned to 200 and the browser restored the persisted demand.
- Local backup/restore tooling encrypted a disposable PostGIS database dump and restored it into a clean target. This is not a scheduled or production restore drill.
- Server unit/integration checks are green locally. Umbrella Verify, CodeQL and Gitleaks pass on PR #1 head `b1b07d8ec6ac757de1ed1155ae8dfd1a6edd12f3`.
- Deployment scripts materialize immutable Server/Site revisions from the manifest, hash generated build inputs, validate canonical remotes and fail on unexpected worktree state. The Site Docker context is an allowlist; production settings fail closed instead of silently using examples.

## C. What was fixed / updated in this work slice

- Added a length-bounded Bearer token parser to the umbrella and Server integration branch after CodeQL flagged unsafe user-controlled authorization-header parsing.
- Changed live map provider smoke validation to compare parsed exact hostnames instead of substring matching.
- Added parser tests and verified umbrella and Server CI plus the Server integration suite.
- Reconciled the current standalone main SHAs, open PR heads, and canonical ownership in [docs/REPOSITORY_STATE_FINAL.md](REPOSITORY_STATE_FINAL.md).
- Added [docs/SECURITY_FINAL_AUDIT.md](SECURITY_FINAL_AUDIT.md) and a staging-only Redis outage/recovery record in [docs/REDIS_RECOVERY.md](REDIS_RECOVERY.md).
- Refreshed the expired anonymous tunnel to `https://adb01c5654955c.lhr.life`; the new URL, staging SHA pair, public Chromium screenshots and expected anonymous 401 responses are recorded in the manifest and staging report.
- Hardened immutable release materialization: canonical GitHub origin and real-directory checks, rejection of untracked/modified pinned sources, strict Server/Site Docker contexts, and SHA-256 materialization metadata. Canonical API/Web images build locally and in CI.
- Updated the deployment-readiness decision and release gap audit to reflect performed staging and Redis checks while retaining `NO` for incomplete acceptance.

## D. Verified user flows

| Flow | Result | Evidence boundary |
|---|---|---|
| Staging web open, banner and health | PASS | Public HTTPS URL is currently reachable; Chromium opened it at desktop/mobile and `/healthz`/`/readyz` report healthy. Tunnel is anonymous and temporary. |
| Development OTP login | PASS | Test-only OTP; no real SMS. |
| Passenger demand create/reload | PASS | Persisted PostgreSQL demand reappeared at direct `/demands/mine` after API restart and Redis restart. |
| Address lookup | PASS | Staging UI queried geocoder and selected Striy/Lviv. |
| Road route + map | PASS | OSRM geometry (98.9 km / 2 h 2 min) appeared on MapLibre vector tiles. |
| Desktop/mobile basic layout | PASS (scope-limited) | Chromium at 1440×900 and 390×844 opened the public homepage and six direct SPA routes. Fresh anonymous protected API calls log expected 401 console resource errors; no page exceptions or failed first-party transports were observed. |
| Staging private image upload | PASS (emulator only) | S3Mock only; no production storage claim. |
| Driver account/vehicle creation | PASS (test only) | Vehicle remained unverified, so it did not unlock genuine driver inventory. |
| Driver offer → passenger booking → seats → trip closure/reviews | BLOCKED / NOT ACCEPTED | No verified independent driver offer in staging. |
| Reverse Marketplace negotiation to booking | BLOCKED / NOT ACCEPTED | Demand creation passed; paired independent driver/passenger negotiation did not complete. |
| Passive matching and multiple passengers | BLOCKED / NOT ACCEPTED | Candidate/user consent/route insertion not fully accepted through public UI. |
| Live GPS marker movement and reroute | BLOCKED / NOT ACCEPTED | Large teleport was rejected correctly; realistic gradual replay was not completed. |
| Chat, unread notifications, rendezvous, boarding, Rescue | BLOCKED / NOT ACCEPTED | No complete paired-user UI lifecycle was run. |
| Public staging Firefox/WebKit matrix | NOT TESTED | Existing repository matrix does not count as hosted staging evidence. |
| Physical iPhone, APNs, TestFlight | BLOCKED_EXTERNAL | Apple account/signing and physical devices are not present. |

## E. Test results

| Command / check | Result | Passed / failed / skipped |
|---|---|---|
| Umbrella `npm run lint:all` | PASS | ESLint completed with 0 errors. |
| Umbrella `npm run typecheck` | PASS | TypeScript completed with 0 errors. |
| Umbrella `npm test` | PASS | 79 passed / 0 failed / 1 skipped (80 tests total; opt-in integration scenarios run separately). |
| Server `npm run lint:all` | PASS | ESLint completed with 0 errors. |
| Server `npm run typecheck` | PASS | TypeScript completed with 0 errors. |
| Server `npm test` | PASS | 46 passed / 0 failed / 1 skipped (47 tests total). |
| Server `npm run test:integration` | PASS | 17 passed / 0 failed; Journey schema, booking, navigation, realtime, API restart and Redis rate-limit tests. |
| Umbrella Playwright E2E | PASS (scope-limited) | 6 passed on Chromium production bundle; not the complete public staging golden path. |
| Browser compatibility | PASS (repo test only) | Chromium, Firefox and WebKit over six viewport widths; public staging was Chromium only. |
| GitHub umbrella PR checks | PASS | Verify, CodeQL and Gitleaks pass on code head `41b9613b4f2bf13a178099f627769ea638a4f8e6`; report/manifest metadata head `b1b07d8ec6ac757de1ed1155ae8dfd1a6edd12f3` is in final CI validation. |
| GitHub Server PR #2 checks | PASS at checked head | Verify on head `54ed3c85fd79807a7d7d0b539a587fffca259487`. |
| Fresh staging DB migrations | PASS | Migrations 001–027 accepted. |
| Local encrypted PostGIS backup/restore | PASS (isolated disposable DB) | Synthetic row restored and verified; no production RPO/RTO claim. |
| Staging Redis failure drill | PASS | Ready 200 → Redis stop → ready 503/degraded → Redis restart → ready 200; browser demand persisted. |
| Public staging browser smoke | PASS (partial) | Homepage/auth, demand, geocoder, routing, MapLibre, screenshot and console checks. |
| `/navigation` direct deep link | PASS | Initially exposed a 404/canonical-path mismatch; Site PR #2 adds the alias, passes Site CI, and the public staging UI now displays the navigation destination form. |
| Full public paired-user E2E | FAIL / INCOMPLETE | Acceptance could not proceed past missing verified driver inventory; listed as not accepted, not hidden as green. |
| Production Compose clean-host boot | NOT RUN | Requires actual production configuration and server; local staging uses its own Compose file. |
| iOS physical acceptance | BLOCKED_EXTERNAL | Simulator CI is not a substitute. |

## F. Remaining software gaps

1. Complete paired-user acceptance with a moderator-approved driver and passenger through booking, shared capacity, chat, rendezvous, boarding, trip completion, both reviews and cancellation recovery.
2. Make the staging acceptance setup able to seed or moderate a verified driver safely without exposing an admin bypass in production.
3. Run realistic controlled GPS route replay and accept off-route rerouting, stale GPS, route versioning and passenger stop insertion through visible UI.
4. Complete full Reverse Marketplace negotiation and race acceptance on public staging.
5. Complete WebSocket loss/reconnect, catch-up, event deduplication and notification persistence in paired-user journeys.
6. Close major Journey gaps: real WALK routing, GTFS/GTFS-RT inventory, Journey Monitor, predictive replan and Rescue alternatives. Keep unconfigured modes disabled.
7. Finish real push delivery adapters/operations, native QR scan, iOS background GPS, deep links and complete account deletion/retention operations.
8. Run clean Ubuntu bootstrap and full production Compose topology with configured private S3, reverse proxy, backup schedule, monitoring and alerting. Current public staging is not that deployment.
9. Run comprehensive dependency/container/SAST/IDOR/upload abuse checks and record the complete result matrix.

## G. Remaining external owner inputs

These inputs are only required for the corresponding real-provider or release gates; local development can continue without them.

| Input | Required for |
|---|---|
| Production Linux server/hosting account and SSH or equivalent operator access | Durable staging/production deployment, monitoring and restore rehearsal. |
| Purchased domain and DNS control | Persistent public hostname and automatic TLS. |
| Approved SMS provider account, verified sender and secrets | Real-user OTP. |
| Approved routing/geocoding/map endpoints, data rights and attribution; or authorization to self-host the data | Production address/routing/tiles. |
| Private S3-compatible bucket, encryption/lifecycle/access logs and malware-scanner service | Production document/vehicle media. |
| Apple Developer/App Store Connect, signing/provisioning, APNs key and associated-domain configuration | Release archive, TestFlight, APNs and Universal Links. |
| Two supported physical iPhones | Driver/passenger GPS, background, QR, push and rendezvous acceptance. |
| Merchant credentials and webhook configuration | Only if commercial online payment is enabled. |
| Contracts/feed/API credentials for commercial transit/taxi partners | Only for those modes enabled at launch. |

Detailed actions are in [OWNER_ACTIONS_REQUIRED.md](../OWNER_ACTIONS_REQUIRED.md). No owner response is required to continue local engineering or test work.

## H. Next deployment command sequence

After owner provisions a server/domain and supplies the listed secrets, prepare a clean immutable umbrella release checkout, set every required variable in `ops/templates/production.env.example`, create the encrypted-backup passphrase file, then run:

```sh
chmod 600 .env.production /etc/marshgo/backup-passphrase
MARSHGO_ENV_FILE="$PWD/.env.production" BACKUP_KEY_FILE=/etc/marshgo/backup-passphrase ops/scripts/bootstrap.sh
```

Then verify app/API HTTPS routes, database migration version, SMS, map/routing/geocoding, private object upload, backup restoration and browser acceptance using [DEPLOYMENT_RUNBOOK.md](../DEPLOYMENT_RUNBOOK.md). This bootstrap command must not be run with example credentials or against an unapproved host.

## Exact refs in this report

- Umbrella checked-out HEAD: `b1b07d8ec6ac757de1ed1155ae8dfd1a6edd12f3`; verified integration code baseline in `RELEASE_MANIFEST.json`: `41b9613b4f2bf13a178099f627769ea638a4f8e6`.
- Server canonical `main`: `bdfdf24941809f4581965b9847022c68e0b2f127`.
- Server staging PR #2 branch: `codex/security-parse-bearer` at `54ed3c85fd79807a7d7d0b539a587fffca259487`.
- Site `main`: `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7`.
- Site staging PR #2: `3b9af2b61b093152d451271e398920e679cf4276`.
- iOS `main`: `b8b1fcbfe9997e1a7a27594b5759690147de75df`.

The temporary URL and test data are documented in [STAGING_DEPLOYMENT_REPORT.md](../STAGING_DEPLOYMENT_REPORT.md). The repository-backed release baseline is recorded in [RELEASE_MANIFEST.json](../RELEASE_MANIFEST.json); neither document authorizes production traffic.
