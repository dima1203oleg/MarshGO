# Canonical PR stack and release gates — 2026-10-26

## Canonical repository heads

Read-only GitHub inspection of the six requested repositories found the following open candidate heads and stack positions:

| Repository | Candidate PR | Head SHA | Base | CI observation |
|---|---:|---|---|---|
| MarshGO release orchestrator | #5 | `7db4e3ece9cd6bff7d5b0fca437663e3e286d4ef` | `codex/marshgo-production` (`cd0b62d1…`) | `verify` failed because the required private-repository read token is absent; CodeQL and secret scans passed |
| MarshGO-Server | #43 | `24c70dc31d652ac6ba9fbc5fcd7abd138378b457` | `codex/gtfs-sorted-frontier-scan` (`a403a51a…`) | `verify` passed |
| MarshGO-Site | #28 | `df0d61d3ff6c36c8522e8d57721a361d94ec16b9` | `codex/site-gtfs-truncation-reasons` (`cc149957…`) | `verify` passed |
| MarshGO-iOS | #15 | `808685022654925de3bbbe911a9ebd25d381db7c` | `codex/ios-final-rc-20261024` (`be5478be…`) | simulator build passed; PR pins Site `df0d61d…` and Server `24c70dc…` |
| MarshGO-Admin | #1 | `a008dbad8edc5d81d716a0913e10c325f739540b` | `main` (`8ababeb8…`) | `verify` passed |
| MarshGO-Partner | #1 | `5ec9f368d2788e44483a0effe6eac34838e89790` | `main` (`725cb557…`) | `verify` passed |

All Server PRs #35–43 and Site PRs #21–28 remain open and form stacked dependency chains; successful checks on a child do not put it on `main`. iOS #15 stacks on #14. No PRs were merged as part of this audit.

The local Admin checkout was clean and three commits behind its advertised PR head. It was fast-forwarded from `bc37198ca139` to exact `a008dbad8edc5d81d716a0913e10c325f739540b` using `--ff-only`; current Admin tests (4), typecheck, lint and build all pass. Partner checkout already matched PR #1 head; its tests (3), typecheck, lint and build all pass. These checks ran with Node `v25.4.0`; both portal package engines request `24.21.0`, so pinned-runtime confirmation remains outstanding.

## Release workflow failure

The root orchestrator PR #5 check on head `7db4e3e…` fails at “Configure read-only access to private Admin and Partner repositories” because GitHub Actions has no `MARSHGO_REPOS_READ_TOKEN` secret. The earlier orchestrator PR #6 has the same failure. This secret is required to materialize the private Admin and Partner repositories in the cross-repository verification job. Local GitHub authentication does not populate a GitHub Actions secret and must not be copied there without an owner-managed, least-privilege token.

The failure has no safe code-only bypass that still verifies the required six-repository product. Do not skip or weaken this check. Status: `BLOCKED_EXTERNAL` pending an owner-managed read-only Contents token or an approved GitHub App installation credential.

## Manifest consistency

The candidate SHAs are not synchronized across the release manifests:

- Committed root `RELEASE_MANIFEST.json` pins Server `38f17b88…`, Site `7aed5344…`, Admin `f39c4b74…`, Partner `97a3727c…`, iOS `7dfd35bf…`.
- Dirty working-tree root `RELEASE_MANIFEST.json` pins Server `a403a51a…`, Site `6961afcf…`, Admin `f39c4b74…`, Partner `97a3727c…`, iOS `be5478be…`.
- Dirty `docs/RELEASE_MANIFEST.json` pins Server `134ed017…`, Site `9569bb4f…`, Admin `bc37198c…`, Partner `97a3727c…`, iOS `0b404ca4…`.
- Current open candidate PR heads are Server `24c70dc3…`, Site `df0d61d3…`, Admin `a008dbad…`, Partner `5ec9f368…`, iOS `80868502…`.

The root manifests also have no API-contract version, migration version, image digest, staging URL or production URL. Existing changes to release manifests are dirty user/shared work and were not overwritten. A single exact compatible candidate manifest still needs to be assembled and validated by the cross-repository workflow.

## Deployment evidence

GitHub deployments API returned no deployments for all six canonical repositories. Both root manifests say `production_ready: false`; neither names a staging or production URL. This proves no GitHub deployment record is present, not that no unrelated external host exists. No deployment, migration or traffic switch was performed.

## Release decision

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

No full six-repository release candidate is verified because the orchestrator job cannot read Admin/Partner. No working staging or production URL, deployed SHA, backup/restore or rollback evidence is available in this audit. Successful per-repository CI and iOS simulator compilation do not clear those gates.

## Next exact actions

1. Owner adds `MARSHGO_REPOS_READ_TOKEN` as a GitHub Actions secret with read-only Contents access to MarshGO-Admin and MarshGO-Partner, or configures the approved equivalent GitHub App credential.
2. Rerun orchestrator verify and update the manifests only in the reviewed release branch to the exact compatible SHAs produced by that workflow.
3. Re-run cross-repository build and browser acceptance, including the known strict light-results visual mismatch; keep the threshold unchanged until the rendered difference is understood.
4. Restore a healthy disposable PostGIS+Redis test environment and complete API/E2E, security, load, recovery, and backup/rollback checks.
5. Provision/identify authorized staging and run smoke on its deployed exact SHA. Keep production deployment gated on separate owner approval.
