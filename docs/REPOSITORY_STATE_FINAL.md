# MARSHGO repository state — 2026-10-01

This is the audited source-of-truth map after comparing local working trees, canonical `main` heads, open PR heads, and the active integration branch. No canonical repository changes were discarded. The three standalone canonical `main` working trees were clean at audit start; current Server security work is committed on its own PR branch.

## Repository inventory

| Repository | Branch / HEAD | Purpose | Source of truth | CI status | Open work | Production relevance |
|---|---|---|---|---|---|---|
| `dima1203oleg/MarshGO` | `codex/marshgo-production` / `0127de32b125af0a7feb1ec85261582921cd6df3` | Cross-repo integration, deployment, E2E, release docs | Integration/deployment orchestration only | Latest CI, CodeQL and Gitleaks pass | Draft PR #1 remains open; merge-state has prior history to reconcile | Release manifests and deployment artifacts; not canonical API or Site implementation |
| `dima1203oleg/MarshGO-Server` | `main` / `bdfdf24941809f4581965b9847022c68e0b2f127` | API, workers, domain logic, migrations, runtime validation | Canonical backend and database source | Latest Server CI passes | PR #1 rendezvous branch is stale; security fix PR #2 is `f0a6cdb2fd918733770f65f997dfea5d7c302b0c` and its CI passes | Production backend source; security fix is not yet merged to `main` |
| `dima1203oleg/MarshGO-Site` | `main` / `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | Web/PWA production frontend | Canonical Web/PWA source | Latest Site CI passes | PR #1 rendezvous branch has residual UI changes, is behind `main`, and reports dirty merge state | Production web client source |
| `dima1203oleg/MarshGO-iOS` | `main` / `b8b1fcbfe9997e1a7a27594b5759690147de75df` | Capacitor/iOS shell and native integrations | Canonical iOS source | Latest simulator CI passes | PR #1 simulator-capture branch contains a small residual script change and is behind `main` | iOS release wrapper; consumes immutable Site ref for release builds |

Open PRs and heads were read from GitHub on 2026-10-01. The rendezvous and simulator PRs must not be merged wholesale: their feature work is partly represented in canonical `main`, but the PR branches diverged and GitHub marks them dirty. Compare each residual change against the canonical implementation before closing or porting it.

## Canonical ownership

| Area | Canonical owner | Current caveat |
|---|---|---|
| Backend API behavior and runtime schemas | MarshGO-Server | API-wide generated OpenAPI/client contract is not complete. `docs/openapi/navigation-v1.yaml` in the umbrella is navigation-only. |
| Web/PWA implementation | MarshGO-Site | Production API DTOs are still partly hand-maintained; contract drift checks need expansion. |
| iOS shell/native capability | MarshGO-iOS | Release CI pins Site input; signing and physical-device acceptance remain external. |
| Database migrations | MarshGO-Server `server/migrations` | Latest canonical migration is 027; never edit applied migrations. |
| Shared navigation DTOs | Duplicated `shared/navigation` packages in Server and Site | Types/schema files are kept aligned by integration verification, not yet published as one generated package. |
| Deployment, compose, proxy, backups, monitoring templates | MarshGO integration repository `ops/`, `deploy/`, `compose.production.yml` | The running public test staging overlay is temporary and is not a production deployment. |
| Release pins and cross-repo verification | `RELEASE_MANIFEST.json` in integration repository | Manifest records a verified baseline; it does not authorize production release. |

## Verified local state

- Umbrella branch `codex/marshgo-production` is pushed and clean at `0127de32b125af0a7feb1ec85261582921cd6df3`.
- Server `main`, Site `main`, and iOS `main` were clean at their audited heads. Server fix branch `codex/security-parse-bearer` is pushed and clean at `f0a6cdb2fd918733770f65f997dfea5d7c302b0c`.
- `npm run lint:all`, `npm run typecheck`, and `npm test` passed in the umbrella: 74 passed, 1 skipped.
- Server `npm run lint:all`, `npm run typecheck`, and `npm test` passed: 46 passed, 1 skipped.
- Server `npm run test:integration` passed all 17 integration tests across Journey schema, bookings, navigation, multi-instance realtime, API restart durability and shared Redis rate limits.
- Latest umbrella GitHub CI, CodeQL and Gitleaks checks pass. The former umbrella CodeQL findings for backtracking-prone auth parsing and substring tile-host matching were fixed and re-scanned successfully.
- See [STAGING_DEPLOYMENT_REPORT.md](../STAGING_DEPLOYMENT_REPORT.md) for the active temporary HTTPS test URL, actual browser evidence and acceptance gaps.

## Release boundary

Passing CI and temporary staging smoke tests do not imply full pre-production acceptance. The public two-account booking, matching, navigation update, chat, rendezvous, cancellation/Rescue, and complete passenger/driver lifecycle still need browser acceptance. Production server/domain/TLS, real SMS and provider configuration, push, payment, iOS signing and physical device remain separate release gates.
