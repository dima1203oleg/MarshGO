# MARSHGO central repository instructions

This repository owns release manifests, cross-repository CI, deployment and infrastructure configuration, integration tests, and release documentation. It is not a second implementation of the Server API, Site/PWA, iOS wrapper, Admin UI, or Partner UI.

## Source ownership

- API, database schema/migrations, authorization, routing and realtime services: `dima1203oleg/MarshGO-Server`.
- Web/PWA, shared web UI, design system, maps and journey screens: `dima1203oleg/MarshGO-Site`.
- Capacitor, Xcode and native iOS capabilities: `dima1203oleg/MarshGO-iOS`. Its web bundle must be built from the exact Site SHA in the release manifest.
- Administrative interface: `dima1203oleg/MarshGO-Admin`.
- Partner interface: `dima1203oleg/MarshGO-Partner`.

Do not add or copy product source into this repository to work around a branch, checkout, or dependency problem. A migration from legacy central source must first be reviewed and tested in the owning product repository. Keep cross-component fixtures and E2E tests here.

## Change workflow

1. Check `git status --short`, current branch, remotes, and the relevant product repository's `AGENTS.md` before editing. Preserve all pre-existing local changes.
2. Use a short-lived `feature/*` or `fix/*` branch and a pull request. Do not push to protected branches, force-push, merge, or deploy from a working branch.
3. Pin every component to a full commit SHA. Never build a release from `latest`, a floating branch, or a dirty source checkout.
4. Run the checks required by the changed paths and record exact commit SHAs and results. Cross-repository acceptance is required for release candidates and integration-affecting changes.
5. Keep `RELEASE_MANIFEST.json` status `NOT_RELEASED` until all production gates are evidenced. Missing credentials, unbuilt image digests, absent staging, or unverified API compatibility are blockers, not passes.

See `docs/PROJECT_ARCHITECTURE.md`, `docs/REPOSITORY_OWNERSHIP.md`, `docs/CODEX_WORKFLOW.md`, and `docs/RELEASE_PROCESS.md` for the current operating model.
