# MARSHGO — candidate release manifest

**Status: NOT_RELEASED.** This document identifies the exact integration candidates for reproducible review. It is not evidence of a staging or production deployment.

| Component | Repository | Candidate branch | Exact SHA | Review |
|---|---|---|---|---|
| Server | `MarshGO-Server` | `integration/production-20261019` | `0c873adeb618bd871395a7ba150ba8c95d0ce19c` | [PR #9](https://github.com/dima1203oleg/MarshGO-Server/pull/9), open; GitHub checks 2/2 success |
| Site | `MarshGO-Site` | `integration/production-20261019` | `09871e6da312e6ac72c83857fbd3106e9c28cc7c` | [PR #9](https://github.com/dima1203oleg/MarshGO-Site/pull/9), open; GitHub checks 3/3 success |
| iOS | `MarshGO-iOS` | `integration/production-20261019` | `68b833499a11fa67763fb6fcfd79b972783fe140` | [PR #7](https://github.com/dima1203oleg/MarshGO-iOS/pull/7), open; GitHub Simulator checks 2/2 pass |
| Admin | `MarshGO-Admin` | `codex/p0-admin` | `9dbf7db0a935498ac40c98b19bc36bce056d630d` | [PR #1](https://github.com/dima1203oleg/MarshGO-Admin/pull/1), open; GitHub checks 1/1; local tests 2/2, typecheck/lint/build pass |
| Partner | `MarshGO-Partner` | `codex/p0-partner` | `c639257a7f28aeda5b378a816038b01651146b83` | [PR #1](https://github.com/dima1203oleg/MarshGO-Partner/pull/1), open; GitHub checks 1/1; local tests 3/3, typecheck/lint/build pass |
| Deployment orchestration | `MarshGO` | `codex/production-finalization-20261014` | `fb06856c1bc000de9bc074d1f8b99791c2f71fe4` | Local commit; candidate branch push and hosted CI recheck pending |

## Contracts and schema

- API contract label used by the local bundle: `v1`.
- Database migration head in the Server candidate: `054_rendezvous_participant_consent.sql` (migration version `054`).
- iOS bundles the exact Site SHA above and records the Server SHA/API/migration metadata in the generated release manifest.
- Local Simulator compile used `http://127.0.0.1:3302/api/v1` as a local-only API origin because no verified staging API origin was found. Do not ship this local build configuration.

## Evidence

- Server candidate: 229 unit tests passed, 0 failed, 3 optional skipped; TypeScript and lint passed; clean migration and Postgres/Redis integration suites passed on isolated local services; GitHub checks 2/2 passed.
- Site candidate: exact SHA `09871e6da312e6ac72c83857fbd3106e9c28cc7c`; 118 unit tests, TypeScript, lint and production build passed. Focused browser E2E for mutual rendezvous passed 1/1 against the exact built Site and isolated local Server, asserting three markers, two approach lines, distance/ETA cards and meeting copy. GitHub checks 3/3 passed. The marketplace E2E 9/9 was previously run on its parent Site SHA `95c9fb07202605ad1b8755a2a2680e2786a1e29a`; that full suite has not yet been rerun on `09871e6`. The earlier 12% pixel difference against a stored light-results baseline remains unresolved; the baseline was not replaced.
- iOS candidate: exact iOS SHA `68b833499a11fa67763fb6fcfd79b972783fe140` pins Site SHA `09871e6da312e6ac72c83857fbd3106e9c28cc7c`. Node `24.21.0`, Site build, release metadata, Capacitor sync, unsigned Xcode Simulator build, simulator install/launch and screenshot passed locally; `/tmp/marshgo-ios-rendezvous-09871e6-node24.png` shows the welcome screen after WebView startup. GitHub Simulator checks 2/2 passed. Interactive sign-in/booking, physical iPhone, GPS background behavior and push are not tested.
- Admin/Partner candidates: Admin `9dbf7db0…` and Partner `c639257a…`; local P0 suites 2/2 and 3/3, respectively, plus typecheck/lint/build. On 2026-10-19 the exact local Server candidate served an OTP-authenticated loopback API flow: Partner submitted an application, Admin read and approved it, and Partner read back the persisted approval and restricted permissions. This is API-level local acceptance only; a browser-driven portal flow and staging acceptance remain open.
- Release orchestration now includes exact Admin/Partner pins and generated production containers. All four images (Server `0c873ade…`, Site `09871e6…`, Admin `9dbf7db0…`, Partner `c639257a…`) built successfully in a separate temp release directory. Admin/Partner container smoke returned HTTP 200 and correctly proxied a mock unauthenticated refresh (401); Caddy and Compose config validated. This confirms deployment wiring only. `RELEASE_MANIFEST.json` now pins all five repositories and remains `NOT_RELEASED`; its integration SHA must be advanced to the orchestration commit after it is created. There is no stable staging environment.
- Latest GitHub check-runs were re-read on 2026-10-19: Server candidate 2/2, Site `09871e6` 3/3, iOS `68b8334` 2/2, Admin 1/1 and Partner 1/1 completed successfully. PRs are open and unmerged; successful candidate checks alone do not establish a released integration.

## Environment and deployment

- Test environment: isolated local Postgres/Redis and deterministic local fixtures. This is not staging and does not prove live-provider behavior.
- Current GitHub deployment inventory returned no deployment records for Server, Site, iOS, Admin or Partner on 2026-10-19. This is not evidence that an independently managed host does not exist; no deploy target/deployed SHA could be verified here.
- Verified staging origin/deployed SHA: none.
- Verified production origin/deployed SHA: none.
- Backup/restore drill, deployment rollback, production HTTPS smoke and actual deployed-SHA comparison: not run.
- Commercial provider coverage and contractual access: not proven by these candidate checks.

**Release decision:** NOT_RELEASED. Do not infer production readiness from successful CI, local builds, or fixture-based E2E. Required next gates are visual acceptance, exact integrated Admin/Partner and iOS review, a reachable isolated staging origin, live feed/provider acceptance, backup/restore and rollback rehearsal, physical iPhone acceptance, and an owner-approved deployment.
