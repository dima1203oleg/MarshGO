# MARSHGO — candidate release manifest

**Status: NOT_RELEASED.** This document identifies the exact integration candidates for reproducible review. It is not evidence of a staging or production deployment.

| Component | Repository | Candidate branch | Exact SHA | Review |
|---|---|---|---|---|
| Server | `MarshGO-Server` | `integration/production-20261019` | `0c873adeb618bd871395a7ba150ba8c95d0ce19c` | [PR #9](https://github.com/dima1203oleg/MarshGO-Server/pull/9), open; GitHub checks 2/2 success |
| Site | `MarshGO-Site` | `integration/production-20261019` | `95c9fb07202605ad1b8755a2a2680e2786a1e29a` | [PR #9](https://github.com/dima1203oleg/MarshGO-Site/pull/9), open; GitHub checks 3/3 success |
| iOS | `MarshGO-iOS` | `integration/production-20261019` | `295c532aa61c181320cd03dd7a7a3eb5c3aa3e35` | [PR #7](https://github.com/dima1203oleg/MarshGO-iOS/pull/7), open; GitHub Simulator checks 2/2 pass |

## Contracts and schema

- API contract label used by the local bundle: `v1`.
- Database migration head in the Server candidate: `054_rendezvous_participant_consent.sql` (migration version `054`).
- iOS bundles the exact Site SHA above and records the Server SHA/API/migration metadata in the generated release manifest.
- Local iOS compile used a reserved `.invalid` API host because no verified staging API origin was found. Do not ship this local build configuration.

## Evidence

- Server candidate: 229 unit tests passed, 0 failed, 3 optional skipped; TypeScript and lint passed; clean migration and Postgres/Redis integration suites passed on isolated local services; GitHub checks 2/2 passed.
- Site candidate: 118 unit tests passed, 0 failed, 0 skipped; TypeScript, lint, production build and full isolated browser marketplace E2E 9/9 passed against the exact Server candidate. The E2E covers two-account search/booking, saved MarshPass, boarding, completion by both participants, persisted reviews/chat, reverse marketplace counteroffer, GPS deviation rerouting, viewport and navigation recovery. GitHub checks 3/3 passed. The earlier visual pixel comparison to a stored light-results baseline failed at 12%; it is unresolved and the baseline was not replaced.
- iOS candidate: exact Site SHA `95c9fb07202605ad1b8755a2a2680e2786a1e29a` checkout verified with Node 24.21.0; Site build, release metadata generation, Capacitor sync and unsigned Xcode Simulator build passed locally. GitHub Simulator checks 2/2 passed. Simulator installation/launch was not verified because local `simctl install` stalled; physical iPhone, GPS background behavior and push are not tested.

## Environment and deployment

- Test environment: isolated local Postgres/Redis and deterministic local fixtures. This is not staging and does not prove live-provider behavior.
- Verified staging origin/deployed SHA: none.
- Verified production origin/deployed SHA: none.
- Backup/restore drill, deployment rollback, production HTTPS smoke and actual deployed-SHA comparison: not run.
- Commercial provider coverage and contractual access: not proven by these candidate checks.

**Release decision:** NOT_RELEASED. Do not infer production readiness from successful CI, local builds, or fixture-based E2E. Required next gates are visual acceptance, exact integrated Admin/Partner and iOS review, a reachable isolated staging origin, live feed/provider acceptance, backup/restore and rollback rehearsal, physical iPhone acceptance, and an owner-approved deployment.
