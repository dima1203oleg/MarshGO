# Codex workflow for MARSHGO

Use repository state and these documents to recover context. Do not depend on another Codex chat being available.

## Find the right repository

1. Run `pwd`, `git rev-parse --show-toplevel`, `git status --short`, `git branch --show-current`, and `git remote -v`.
2. Identify the owning repository from `REPOSITORY_OWNERSHIP.md`. If the current tree is central `MarshGO`, change only orchestration, integration tests, deployment, or release docs there.
3. Before any edit, inspect the repository's `AGENTS.md` and preserve every pre-existing modified or untracked file. Never solve a checkout problem by creating another source copy.

## Start a safe feature branch

Start from the latest fetched canonical base. Use a new clone or worktree when the existing worktree has changes:

```sh
git fetch origin
git worktree add ../MarshGO-Server-feature -b feature/short-name origin/main
cd ../MarshGO-Server-feature
```

Use `fix/short-name` for a bug fix. Do not reset, clean, force-push, or reuse a dirty worktree. If the work already has a review branch, inspect its PR and base SHA before continuing. Keep work in its owning repository.

## Validate and open a pull request

- Server: inspect package scripts, then run install validation, typecheck, lint, unit tests, migration/database/Redis integration relevant to the change, and build/security checks required by the PR workflow.
- Site: run install validation, lint, typecheck, unit tests, production build, bundle budget, and relevant browser tests.
- iOS: verify exact Site SHA pin, `cap sync`, and simulator build workflow; simulator success does not prove physical-device GPS/background behavior or a signed TestFlight build.
- Admin/Partner: run their own install, lint/typecheck/test/build and check every referenced API route against the exact Server contract. UI visibility is not an access-control test.
- Central: run focused manifest/materialization/Compose checks for release tooling; run cross-repository E2E for integration changes and release candidates.

Record command output, source SHAs, skipped tests, and external service limitations in the PR. Push only the feature branch and open a PR to the intended base. Do not merge it or deploy production unless the owner explicitly authorizes that step.

## Cross-repository changes

1. Update the owning Server contract first or in a coordinated reviewed PR.
2. Update Site, Admin, Partner, or iOS consumers against that exact Server SHA.
3. For iOS web changes, pin the exact Site SHA in the iOS workflow and manifest.
4. Update the central release manifest only with full immutable SHAs and measured test/build results. Keep unknown image digests, target, and rollback details null and status blocked.
5. Run exact-SHA integration acceptance before treating the set as compatible.

## Restore context in a new session

Read this file, the current repository `AGENTS.md`, `docs/CURRENT_PROJECT_STATE.md`, `docs/RELEASE_PROCESS.md`, then inspect `git status`, `git log --graph --oneline --decorate`, remotes, open PRs, and each repo's lockfile/scripts. Recheck live GitHub state; the dated state document is a baseline, not a substitute for a fresh audit.
