# Release verify final blocker — 2026-10-26

## Latest orchestrator run

- Repository: `dima1203oleg/MarshGO`
- PR: #5, branch `codex/production-finalization-20261014`
- Exact head: `7ab9685909849e75f8797907c97109b331d1391e`
- GitHub run: `40299717731`
- Result: `verify` FAILED after 1m37s. Gitleaks passed. CodeQL checks were pending at the time this snapshot was collected.

The following workflow steps completed successfully before the failure:

1. Bun install and high-severity dependency audit.
2. ESLint.
3. TypeScript typecheck.
4. Root unit suite.
5. Database migrations against the workflow's isolated PostGIS service.
6. Backend integration suite against its isolated test services.
7. Production build.
8. Bundle budget check.

The workflow failed at `Configure read-only access to private Admin and Partner repositories` with the explicit error: `Set the MARSHGO_REPOS_READ_TOKEN Actions secret with read-only Contents access to MarshGO-Admin and MarshGO-Partner.` Therefore release materialization, Docker image build, cross-repository Playwright E2E and browser compatibility steps did not run. Previous PR #6 failed at the same guard. No check was skipped or weakened.

## Device and deployment evidence

- `xcrun devicectl list devices` lists the owner iPhone 15 Pro Max as `unavailable`; the connected iPhone 15/16 Pro Max entries are simulated. iOS PR #15's simulator build is green, but physical iPhone acceptance is NOT_TESTED.
- `gh api repos/<canonical-repo>/deployments` returned no deployment records for MarshGO, Server, Site, iOS, Admin or Partner.
- Current root manifests do not name a staging/production URL; committed, worktree and docs manifests have different component SHA tuples (details in audit 247).
- Local browser route search returns server-unavailable because API port 3002 is closed; Docker API times out, test Postgres 5434 and Redis 6379/6380 are unavailable. The existing Homebrew Postgres 14 listener on 5432 was not used.

## Decision

The local source checks and the accessible GitHub Server/Site/Admin/Partner/iOS PR checks provide useful evidence, but there is no cross-repository assembled candidate, staging run, production deployment, physical iPhone test, or backup/restore/rollback evidence.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Exact external action

An owner must configure `MARSHGO_REPOS_READ_TOKEN` as a GitHub Actions secret with least-privilege read-only Contents access to the private Admin and Partner repositories, or configure an approved GitHub App installation credential. Then rerun PR #5 verification. This requirement cannot be satisfied by a code change without weakening the private-repository integrity check.
