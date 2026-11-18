# Integration worktree production checks — 2026-10-25

## Scope

- Orchestrator checkout branch: `codex/production-finalization-20261014`.
- HEAD before/after this one-file report: `85246549632ccf7276b04a2d93594ceebc9b1e31`.
- The checkout had extensive pre-existing uncommitted changes while this check ran. Therefore these results describe that local working-tree snapshot; they are not evidence for a clean release SHA or deployment artifact.

## Results

Ran `npm run check:production` in the integration checkout. Command exited successfully:

- TypeScript typecheck: **PASS**.
- ESLint across `src`, `server`, `shared`, `tests`, `e2e`, `scripts`, `ops`, `tools` and configs: **PASS**.
- Unit tests: **256 PASS / 0 FAIL / 1 SKIP** out of 257. The one skipped case is opt-in local API booking integration; skip is not a pass.
- Vite production build: **PASS**.
- JavaScript transfer budget: **PASS**, all 51 chunks are at or below 350 KB gzip; largest measured chunk 285.74 KB gzip.

## Limits

- This check does not include cross-repository Docker materialization, staging, provider acceptance, physical iPhone, load/security/recovery, backup/restore, rollback or production smoke.
- Root PR #5 Actions cannot materialize private Admin/Partner because the required read-only `MARSHGO_REPOS_READ_TOKEN` secret is absent. Do not bypass that gate.
- `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
