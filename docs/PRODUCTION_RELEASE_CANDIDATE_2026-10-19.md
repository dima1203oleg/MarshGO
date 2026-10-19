# MARSHGO — candidate release manifest

**Status: NOT_RELEASED.** This document identifies the exact integration candidates for reproducible review. It is not evidence of a staging or production deployment.

| Component | Repository | Candidate branch | Exact SHA | Review |
|---|---|---|---|---|
| Server | `MarshGO-Server` | `integration/production-20261019` | `0c873adeb618bd871395a7ba150ba8c95d0ce19c` | [PR #9](https://github.com/dima1203oleg/MarshGO-Server/pull/9), open; GitHub checks 2/2 success |
| Site | `MarshGO-Site` | `integration/production-20261019` | `95c9fb07202605ad1b8755a2a2680e2786a1e29a` | [PR #9](https://github.com/dima1203oleg/MarshGO-Site/pull/9), open; GitHub checks 3/3 success |
| iOS | `MarshGO-iOS` | `integration/production-20261019` | `295c532aa61c181320cd03dd7a7a3eb5c3aa3e35` | [PR #7](https://github.com/dima1203oleg/MarshGO-iOS/pull/7), open; GitHub Simulator checks 2/2 pass |
| Admin | `MarshGO-Admin` | `codex/p0-admin` | `9dbf7db0a935498ac40c98b19bc36bce056d630d` | [PR #1](https://github.com/dima1203oleg/MarshGO-Admin/pull/1), open; local tests 2/2, typecheck/lint/build pass |
| Partner | `MarshGO-Partner` | `codex/p0-partner` | `c639257a7f28aeda5b378a816038b01651146b83` | [PR #1](https://github.com/dima1203oleg/MarshGO-Partner/pull/1), open; local tests 3/3, typecheck/lint/build pass |

## Contracts and schema

- API contract label used by the local bundle: `v1`.
- Database migration head in the Server candidate: `054_rendezvous_participant_consent.sql` (migration version `054`).
- iOS bundles the exact Site SHA above and records the Server SHA/API/migration metadata in the generated release manifest.
- Local iOS compile used a reserved `.invalid` API host because no verified staging API origin was found. Do not ship this local build configuration.

## Evidence

- Server candidate: 229 unit tests passed, 0 failed, 3 optional skipped; TypeScript and lint passed; clean migration and Postgres/Redis integration suites passed on isolated local services; GitHub checks 2/2 passed.
- Site candidate: 118 unit tests passed, 0 failed, 0 skipped; TypeScript, lint, production build and full isolated browser marketplace E2E 9/9 passed against the exact Server candidate. The E2E covers two-account search/booking, saved MarshPass, boarding, completion by both participants, persisted reviews/chat, reverse marketplace counteroffer, GPS deviation rerouting, viewport and navigation recovery. GitHub checks 3/3 passed. The earlier visual pixel comparison to a stored light-results baseline failed at 12%; it is unresolved and the baseline was not replaced.
- iOS candidate: exact Site SHA `95c9fb07202605ad1b8755a2a2680e2786a1e29a` checkout verified with Node 24.21.0; Site build, release metadata generation, Capacitor sync, unsigned Xcode Simulator build, simulator installation and app launch passed locally. Captured welcome screen at `/tmp/marshgo-ios-candidate-95c9fb0-later.png`; it rendered after WebView startup. GitHub Simulator checks 2/2 passed. Interactive sign-in/booking, physical iPhone, GPS background behavior and push are not tested.
- Admin/Partner candidates: Admin `9dbf7db0…` and Partner `c639257a…`; local P0 suites 2/2 and 3/3, respectively, plus typecheck/lint/build. On 2026-10-19 the exact local Server candidate served an OTP-authenticated loopback API flow: Partner submitted an application, Admin read and approved it, and Partner read back the persisted approval and restricted permissions. This is API-level local acceptance only; a browser-driven portal flow and staging acceptance remain open.

## Environment and deployment

- Test environment: isolated local Postgres/Redis and deterministic local fixtures. This is not staging and does not prove live-provider behavior.
- Current GitHub deployment inventory returned no deployment records for Server, Site, iOS, Admin or Partner on 2026-10-19. This is not evidence that an independently managed host does not exist; no deploy target/deployed SHA could be verified here.
- Verified staging origin/deployed SHA: none.
- Verified production origin/deployed SHA: none.
- Backup/restore drill, deployment rollback, production HTTPS smoke and actual deployed-SHA comparison: not run.
- Commercial provider coverage and contractual access: not proven by these candidate checks.

**Release decision:** NOT_RELEASED. Do not infer production readiness from successful CI, local builds, or fixture-based E2E. Required next gates are visual acceptance, exact integrated Admin/Partner and iOS review, a reachable isolated staging origin, live feed/provider acceptance, backup/restore and rollback rehearsal, physical iPhone acceptance, and an owner-approved deployment.
