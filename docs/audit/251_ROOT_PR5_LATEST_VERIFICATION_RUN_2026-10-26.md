# Root PR #5 latest cross-repository verification run — 2026-10-26

## Exact source and workflow

- Repository: `dima1203oleg/MarshGO`.
- PR #5: https://github.com/dima1203oleg/MarshGO/pull/5
- Exact head: `e68d8c4f428d6b885b352dc718751cb391e74fb3`.
- Verify run: `40301069259` — completed failure.
- CodeQL and Gitleaks workflows are separate checks; Gitleaks passed for this head. CodeQL status was pending when captured.

## Steps that passed on this exact head

The Verify workflow completed successfully through:

1. Bun frozen-lockfile install and high-severity dependency audit.
2. ESLint and TypeScript typecheck.
3. Root unit tests.
4. Database migrations against the workflow's isolated PostGIS service.
5. Backend integration tests against the workflow's isolated test services.
6. Production build and bundle budget.

## Blocking step

Step 15, `Configure read-only access to private Admin and Partner repositories`, failed because the owner-managed `MARSHGO_REPOS_READ_TOKEN` Actions secret is not configured. The workflow then skipped release materialization, canonical Docker image builds, cross-repository Playwright E2E, and browser-compatibility tests. The check was not weakened and no token was copied from a broader local credential.

## Decision and next action

The root candidate passes the available source, migration, and backend integration gates on this exact SHA. It is not a cross-repository release candidate because the private component repositories were not materialized or browser-tested. An owner must configure an approved least-privilege read-only Contents credential for private Admin and Partner, then rerun the workflow. Continue independent code and test work meanwhile.

No staging URL, deployed SHA, production deployment, physical-device acceptance, backup/restore, or rollback proof is established by this run. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
