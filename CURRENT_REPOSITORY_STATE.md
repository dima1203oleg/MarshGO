# Current MARSHGO repository state — 2026-10-01

Repository state reconciled against local checkouts, GitHub `main` refs, open pull requests, and the active staging deployment. Umbrella app/deployment source remains at its audited baseline; subsequent commits on that branch update release and verification records. The worktrees were clean after those report commits.

| Repository | Canonical branch / SHA | Local branch | Working tree | Source of truth | CI / open work | Production relevance |
|---|---|---|---|---|---|---|
| `dima1203oleg/MarshGO` | `main` / `1e7d0ee74f11121a7d5a29c6379944a5360581c4` | `codex/marshgo-production` / app/deployment baseline `0127de32b125af0a7feb1ec85261582921cd6df3`, with report-only descendants | Clean after report commits; exact latest branch head is recorded in the task's final report. | Cross-repo orchestration, deployment, E2E and release records. | Draft PR #1 includes later report commits; verify, CodeQL and Gitleaks pass; merge state CLEAN. | Integration/deployment only, not canonical Server/Site source. |
| `dima1203oleg/MarshGO-Server` | `main` / `bdfdf24941809f4581965b9847022c68e0b2f127` | `codex/security-parse-bearer` / `f0a6cdb2fd918733770f65f997dfea5d7c302b0c` | Clean; branch pushed. | Backend, API, migrations and workers. | PR #2 is clean and CI passes. Older Rendezvous PR #1 head `f788a96…` is DIRTY; do not merge wholesale. | Staging runs PR #2 security parser changes. Server `main` remains the release baseline until that PR is merged. |
| `dima1203oleg/MarshGO-Site` | `main` / `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | `codex/navigation-deep-link-alias` / `97b29ed77e0cfc49ad37b59e856af364184492fc` | Clean; branch pushed. | Web/PWA. | Main CI passes. Navigation alias PR #2 passes CI; older Rendezvous PR #1 head `045f138…` is DIRTY and behind. | Production frontend source is `main`; staging currently exercises PR #2's route alias. |
| `dima1203oleg/MarshGO-iOS` | `main` / `b8b1fcbfe9997e1a7a27594b5759690147de75df` | `main` at same SHA | Clean. | Capacitor/iOS shell and native integrations. | Main simulator CI passes. Simulator-capture PR #1 head `328d9af…` is DIRTY; compare residual before any merge. | iOS client source; no signed physical-device acceptance. |

## Canonical ownership

- Backend/API/database/migrations: MarshGO-Server.
- Web/PWA: MarshGO-Site.
- iOS container/native integrations: MarshGO-iOS. Release builds must use an immutable Site revision.
- Shared navigation types currently exist in both Server and Site repositories and are alignment-checked; a generated API-wide shared contract is still incomplete.
- Cross-repository integration tests, deployment configuration, release metadata and docs: MarshGO umbrella.
- Staging Server revision: `f0a6cdb2fd918733770f65f997dfea5d7c302b0c` (open Server PR #2); Site revision: `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7`.

## Verification snapshot

- Umbrella PR #1 checks: `verify`, CodeQL and Gitleaks PASS on head `0127de32…`.
- Server PR #2 checks: `verify` PASS on head `f0a6cdb…`.
- Umbrella `lint:all`, typecheck, unit: PASS; 74 passed, 1 skipped.
- Server `lint:all`, typecheck, unit: PASS; 46 passed, 1 skipped.
- Server integration: 17 passed, 0 failed (PostGIS, Redis, bookings, navigation, realtime, restart durability and rate limiting).
- PR #1 branches for Server/Site/iOS remain open and divergent; their residual changes are not silently discarded or merged.
- Public temporary staging is documented in [STAGING_DEPLOYMENT_REPORT.md](STAGING_DEPLOYMENT_REPORT.md). It is reachable but not release-accepted; do not use it for personal or payment data.

See [RELEASE_MANIFEST.json](RELEASE_MANIFEST.json) for the release baseline and staging revisions. Main SHAs and deployed staging SHAs are intentionally distinguished.
