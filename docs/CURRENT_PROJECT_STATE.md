# MARSHGO current project state

**Snapshot date:** 2026-10-14. GitHub PR status can change after this audit; recheck before acting. No branch was merged and no production deployment was performed during this audit.

## Canonical repositories

All six named repositories exist under `dima1203oleg`. `MarshGO-Admin` and `MarshGO-Partner` are private. Product default branches are `main`; current functional work is primarily in open PRs, not in canonical `main`.

## Active candidate pins

These are the exact pins in the current central Navigation Experience 6 manifest; they are candidate references, not approved release versions:

| Component | Repository/ref | Candidate SHA | Evidence/limit |
| --- | --- | --- | --- |
| Server | `MarshGO-Server` / `codex/redis-smart-cache`, PR #5 | `64ed70c72fec06cb9418dc7feee67ae0acee3826` | CI passed. Does not include pending partner foundation migration 051. |
| Site | `MarshGO-Site` / `codex/journey-rendezvous-map`, PR #6 | `22fe4f1089f3acfb342e8a8399ca8e9fe4cd1730` | CI/build checks passed. |
| iOS | `MarshGO-iOS` / `codex/pin-rendezvous-site`, PR #5 | `c304ae30b19bdaca57931baedeec4ffde02bca2d` | Pins the Site SHA above; simulator CI only. |
| Admin | `MarshGO-Admin` / `codex/p0-admin`, PR #1 | `9263befb` (abbreviated in this audit record) | Verify the full SHA at PR head before release; UI CI passed. |
| Partner | `MarshGO-Partner` / `codex/p0-partner`, PR #1 | `4293510a` (abbreviated in this audit record) | Verify the full SHA at PR head before release; UI CI passed. |

The current `RELEASE_MANIFEST.json` pins Server/Site/iOS and central integration test code. It does not yet represent a verified five-product release: Admin/Partner pins, image digests, target, build timestamp, rollback refs, and cross-product compatibility evidence are incomplete. Status remains `NOT_RELEASED`.

## Relevant open changes (observed at audit)

- Central `codex/marshgo-production` PR #1 is a large draft. Central cache PR #2 is based on PR #1; Navigation Experience PR #3 is based on PR #2. Treat these as a stack, not independent changes. PR #3 exact-manifest CI/security passed on its recorded candidate run; that does not make the stack merged or production-ready.
- Server PR #3 mobility registry is a base for Server PR #4 partner foundation and PR #5 Smart Cache; these feature branches are not a single integrated Server commit. Server PR #6 and #7 add locally verified stop-arrival/transport-layer changes on feature branches created during this audit.
- Site PR #6 is the current central candidate. Site PR #7 contains the locally verified stop-arrival UI change.
- iOS PR #5 pins Site `22fe4f1`; other iOS candidate branches pin different Site SHAs. A dirty local iOS workflow change also pins a different Site SHA and is preserved pending review.
- Admin PR #1 contains an administrative console and calls Server admin endpoints; Partner PR #1 supports onboarding/organization membership, not a complete fleet/orders/finance portal. Server PR #4 contains matching candidate routes/migration 051, but that commit is not included in the current central Server pin. These UIs are therefore not yet proven compatible with the current release Server SHA.

Branch protection was absent at audit start. During this audit, classic protection was enabled on `main` in the four public repositories (central, Server, Site, iOS): PR required, strict required status checks (`changes`, `verify`, central `CodeQL (JavaScript and TypeScript)` and `Gitleaks secret scan`, or iOS `simulator-build`), stale reviews dismissed, force-push/deletion disabled, and admin enforcement enabled. Each repository currently has only one collaborator, so required approvals are set to 0; this enforces PRs and checks but not an independent human approval. Admin and Partner remain unprotected because GitHub returned HTTP 403 requiring GitHub Pro or public visibility for branch protection. No private visibility or plan change was made. Feature branches are not protected.

## Local state and preservation

- The active central checkout contains pre-existing edits in `RELEASE_MANIFEST.json` and several E2E specs, plus local screenshots, temporary scripts, and nested product checkouts. They were not edited or staged by this work.
- A local iOS checkout has a modified workflow, and its nested Site checkout has two modified source files. These were preserved.
- Local `MarshGO2` has 26 dirty entries (22 tracked modifications and 4 untracked files), including a significant UI/API redesign. It has not been tested or migrated; it is not safe to archive based on the remote default branch alone.
- The two named Codex conversations were inspected. Both point to the same central checkout in the accessible history; this does not prove that no other inaccessible or unrecorded worktree exists.

## Implemented during this audit

- Server stop-arrival filter commit `9fe8cbd2774793f73a0f32ef5265a9de3a035315`, draft PR [#6](https://github.com/dima1203oleg/MarshGO-Server/pull/6). Local typecheck/lint passed; 201 tests passed and 3 opt-in integration tests were skipped.
- Site stop-arrival UI commit `1565e65ceb6896289fd64c783c11dac0ee45c7a2`, draft PR [#7](https://github.com/dima1203oleg/MarshGO-Site/pull/7). Local typecheck/lint, 94 tests, production build and bundle budget passed.
- Server transport-layer availability commit `ecc5a03e1405bbb5f0678a1b489388fad584d9d0`, draft PR [#7](https://github.com/dima1203oleg/MarshGO-Server/pull/7). Local typecheck/lint and targeted test passed.

These changes are separate PRs and have not been integrated into a common five-product candidate. Security scan and cross-repository tests for these deltas remain pending.

## Known release blockers

1. No configured staging URL/provider, production deployment target, production credentials, or verified production deployment is present in the current workspace. Never infer deployment from local/Docker/GitHub build success.
2. Admin/Partner are private; central CI needs approved least-privilege access before it can fetch/build their exact SHAs. Do not place tokens in Git.
3. Server partner foundation migration/API and Smart Cache work need a reviewed integrated Server SHA; current Admin/Partner endpoint compatibility is not proven against current Server `64ed70c`.
4. The central release pipeline materializes Server and Site today; five-component build/test, Admin/Partner images, iOS artifact/digest, full immutable manifest and rollback rehearsal remain incomplete.
5. Published branches were observed without protection; current account could not configure/read all required settings. Reviewers, required checks, no-force-push policy, and rulesets need a verified repository-settings pass.
6. Full exact-SHA regression/security/integration acceptance and staging backup/restore/rollback rehearsal remain release gates.

See `docs/CONSOLIDATION_AUDIT_2026-10-14.md`, `docs/PRODUCTION_GAP_ANALYSIS.md`, and the central `RELEASE_MANIFEST.json` for additional recorded evidence.
