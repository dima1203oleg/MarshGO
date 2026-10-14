# MARSHGO release process

## Release chain

```text
Product PRs and verified commits
  -> exact-SHA release manifest
  -> independent component builds
  -> cross-repository contract and integration tests
  -> staging deployment and acceptance
  -> owner approval
  -> production deployment from immutable tag
```

Central `MarshGO` coordinates this chain. Product repositories own product source and their component CI. A green component check alone is not evidence that the five components integrate.

## Manifest requirements

`RELEASE_MANIFEST.json` is the single release input. Each product entry must contain a repository name, full 40-character commit SHA, reviewed ref/PR provenance, and component build/test result. The manifest must also state the release ID, API contract version, database migration version, immutable image digests, build timestamp, test results, release status, deployment target, and exact rollback references.

Never use a floating branch or `latest` in a release build. The iOS source must pin and embed the exact Site SHA from the same manifest. A field may be `null` while a candidate is incomplete; its gate must fail closed. Keep status `NOT_RELEASED` until all gates pass.

## Current source materialization

`ops/scripts/materialize-release.mjs` fetches the manifest's exact Server and Site commits into `.release/`, checks `HEAD` against the requested SHAs, rejects unexpected dirty inputs, installs centrally versioned Docker/nginx build inputs, and writes a generated Compose definition whose API and Web contexts point at those product checkouts. `bootstrap.sh` and `update.sh` invoke this before using Compose.

Use the `ops/scripts/compose.sh` helper only after materialization. The generated `.release/compose.production.yml` is the release Compose file. The root `compose.production.yml` is a template/input for materialization and must not be run directly for a release, because its contexts refer to the central checkout. The materialization guard validates source SHAs, source cleanliness, generated build-input hashes, and Compose hash before Compose commands run.

The current materializer covers Server and Site only. Admin/Partner private-source access, their builds, iOS artifact production, complete five-component integration, immutable registry digests, and staging acceptance must be added and verified before a five-component release can pass.

## Required gates

1. All five product PRs reviewed and checks green on the exact manifest SHAs.
2. Manifest schema complete; every source SHA exists and is clean; iOS embeds the manifest Site SHA.
3. API contract and migration compatibility verified against the exact consumers.
4. Server unit, security, PostgreSQL/PostGIS and Redis checks pass; Site/Admin/Partner production builds and security checks pass; iOS simulator build plus required signed/device acceptance is recorded with its scope.
5. Cross-repository E2E covers sign-in/verification, multimodal route search and cost/time/transfers, booking/MarshPass, messages, GPS/navigation, Admin RBAC, Partner tenant isolation and responsive behavior. Full regression/security runs are required for a release candidate.
6. Docker images are built from the exact intended contexts and their immutable digests are recorded. No demo data is included in production bundles.
7. Staging uses the exact candidate; database migration, backup, restore, rollback and provider acceptance pass. Record measured results and target.
8. Production credentials and backup key are supplied out of Git, readiness gates pass, and the owner approves deployment. A successful build is not a deployment.

## Deploy and rollback

Only deploy a clean checkout at an immutable release tag. `bootstrap.sh` is for initial setup; `update.sh` performs a backup, builds pinned Server/Site images, migrates, deploys and checks readiness. Database changes are forward-only; migration rollback requires a separately reviewed forward fix or verified restore procedure. Rehearse backup/restore and rollback in staging before production.

Production deployment is outside this audit authorization. No command in this repository should deploy production without explicit owner approval.

## Resource-aware CI

Product PRs should run checks scoped to affected components, reuse dependency and Docker layer caches, cancel superseded non-release checks per branch, and run cross-repository E2E only for integration changes and release candidates. Candidate/release workflows must retain the complete regression and security suite. Production release jobs must not be canceled by ordinary branch supersession. Central CI now always runs a lightweight path-scope detector and runs its broad suite only for source, workflow, manifest, build, or integration changes; docs-only PRs skip the database/browser/build jobs. Product repositories still run their configured CI without path scoping. Savings have not yet been measured from comparable before/after runs.
