# MARSHGO current project state

**Snapshot date:** 2026-10-14. GitHub PR status can change after this audit; recheck before acting. No branch was merged and no production deployment was performed during this audit.

## Canonical repositories

All six named repositories exist under `dima1203oleg`. `MarshGO-Admin` and `MarshGO-Partner` are private. Product default branches are `main`; current functional work is primarily in open PRs, not in canonical `main`.

## Active candidate pins

These are the exact pins in the current central Navigation Experience 6 manifest; they are candidate references, not approved release versions:

| Component | Repository/ref | Candidate SHA | Evidence/limit |
| --- | --- | --- | --- |
| Server | `MarshGO-Server` / `feature/gtfs-stop-arrivals`, PR #6 | `6307bfcd3f7c76616280fb886e3a2d4cbab199b2` | Hosted CI passed; includes stop-arrival source timestamp. Partner foundation migration 051 is still absent. |
| Site | `MarshGO-Site` / `feature/gtfs-stop-arrivals`, PR #7 | `02c01a609cad41f1551c1861a44122242534e37a` | Hosted runs 38602030648 and 38602038038 passed; local 98/98 tests. Rejects 200 responses without an API data envelope. |
| iOS | `MarshGO-iOS` / `codex/pin-rendezvous-site`, PR #5 | `25630b202bef5be90be57a0147cfe69059729916` | Pins Site `02c01a6…`; simulator run 38602492704 passed exact-pin verification, Site build, Capacitor sync and iOS Simulator compile. |
| Admin | `MarshGO-Admin` / `codex/p0-admin`, PR #1 | `9263befb9b8e8d1eecb2a6c492a9e39a33794d76` | UI CI passed; requires Server partner foundation API/migration 051. |
| Partner | `MarshGO-Partner` / `codex/p0-partner`, PR #1 | `4293510ab1b8a64a30dc4db2b432595fef1a51ec` | UI CI passed; organization routes are not in the current Server pin. |

The current `RELEASE_MANIFEST.json` pins exact SHAs for all five product repositories and the central E2E source `c93178e87f56725f3a90160473265b478a638fd3`. The previous exact-SHA run passed E2E but failed one WebKit route-map check on the previous Site pin; the corrected Site pin is pending a fresh umbrella run. It does not yet represent a verified five-product release: image digests, target, build timestamp, rollback refs, and Admin/Partner compatibility evidence are incomplete. Status remains `BLOCKED` / `NOT_RELEASED`.

## Relevant open changes (observed at audit)

- Central `codex/marshgo-production` PR #1 is a large draft. Central cache PR #2 is based on PR #1; Navigation Experience PR #3 was based on PR #2; the current governance/Navigation Experience PR #4 uses `feature/unified-repository-governance` on top of `codex/navigation-experience-6`. Run 38598032870 passed E2E and security but its first browser matrix failed on WebKit; its rerun uses the previous Site pin. A new run is still required for the corrected candidate.
- Server PR #3 mobility registry is a base for Server PR #4 partner foundation and PR #5 Smart Cache; those changes are not one integrated Server commit. Current Server PR #6 adds a stop-arrival endpoint/freshness work atop its reviewed base; PR #7 adds transport-layer availability separately.
- Site PR #6 contains the Navigation Experience base; Site PR #7 layers stop-arrival freshness and the malformed-envelope guard on it. Site head `02c01a609cad41f1551c1861a44122242534e37a` passed hosted CI and local 98/98 tests.
- iOS PR #5 now pins Site `02c01a6…`; iOS head `25630b202bef5be90be57a0147cfe69059729916` passed exact-pin simulator CI run 38602492704. Other iOS candidate branches still pin different Site SHAs. A separate pre-existing dirty iOS checkout remains preserved.
- Admin PR #1 contains an administrative console and calls Server admin endpoints; Partner PR #1 supports onboarding/organization membership, not a complete fleet/orders/finance portal. Server PR #4 contains matching candidate routes/migration 051, but that commit is not included in the current central Server pin. These UIs are therefore not yet proven compatible with the current release Server SHA.

Branch protection was absent at audit start. During this audit, classic protection was enabled on `main` in the four public repositories (central, Server, Site, iOS): PR required, strict required status checks (`changes`, `verify`, central `CodeQL (JavaScript and TypeScript)` and `Gitleaks secret scan`, or iOS `simulator-build`), stale reviews dismissed, force-push/deletion disabled, and admin enforcement enabled. Each repository currently has only one collaborator, so required approvals are set to 0; this enforces PRs and checks but not an independent human approval. Admin and Partner remain unprotected because GitHub returned HTTP 403 requiring GitHub Pro or public visibility for branch protection. No private visibility or plan change was made. Feature branches are not protected.

## Local state and preservation

- The active central checkout contains pre-existing edits in `RELEASE_MANIFEST.json` and several E2E specs, plus local screenshots, temporary scripts, and nested product checkouts. They were not edited or staged by this work.
- A local iOS checkout has a modified workflow, and its nested Site checkout has two modified source files. These were preserved.
- The dirty iOS workflow pin (`52ec4f7`) matches an open iOS navigation candidate but differs from the central-approved candidate pin (`22fe4f1`). The nested Site edits (`recommendedStrategies` typing and the four-transfer notice) are already present in the `22fe4f1` tree; they are superseded, but remain untouched in their older checkout.
- The central `.release` directory contains 69 pinned-source clones (42 Site and 27 Server). Most have generated Docker/deploy files; one Site snapshot `site-ac15b3b2cf202b12f202af24252276623527731f` has 98 staged deletions. No release clone was cleaned or repaired.
- Local `MarshGO2` has 26 dirty entries (22 tracked modifications and 4 untracked files), including a significant UI/API redesign. It has not been tested or migrated; it is not safe to archive based on the remote default branch alone.
- The two named Codex conversations were inspected. Both point to the same central checkout in the accessible history; this does not prove that no other inaccessible or unrecorded worktree exists.

## Implemented during this audit

- Server stop-arrival endpoint and stale-feed timestamp, draft PR [#6](https://github.com/dima1203oleg/MarshGO-Server/pull/6), head `6307bfcd3f7c76616280fb886e3a2d4cbab199b2`. Hosted audit/lint/typecheck/unit/migration/integration checks passed; 201 unit tests passed and 3 opt-in tests were skipped.
- Site stop-arrival freshness UI, API envelope metadata, and malformed-success-envelope rejection, draft PR [#7](https://github.com/dima1203oleg/MarshGO-Site/pull/7), head `02c01a609cad41f1551c1861a44122242534e37a`. Hosted runs 38602030648 and 38602038038 passed; local typecheck, lint, 98/98 tests, build and bundle budget passed.
- iOS PR [#5](https://github.com/dima1203oleg/MarshGO-iOS/pull/5), head `25630b202bef5be90be57a0147cfe69059729916`, pins that exact Site SHA; simulator CI run 38602492704 passed Site checkout verification, build, Capacitor sync, and iOS Simulator compile.
- Central E2E source `c93178e87f56725f3a90160473265b478a638fd3` asserts stale-feed disclosure while retaining scheduled ETA. The previous Site pin raised WebKit `Pt.length` on the saved Journey reload; inspection mapped it to `passengerNavigationMatches.length`. A successful HTTP 200 with an empty body was being converted to `undefined` by the new wrapper. Site now rejects a missing `data` envelope, and the corrected exact-manifest browser run is pending in central PR [#4](https://github.com/dima1203oleg/MarshGO/pull/4).
- Server transport-layer availability commit `636a3eb5035b77461f806d5fe242963c34fab839`, draft PR [#7](https://github.com/dima1203oleg/MarshGO-Server/pull/7). The first hosted run exposed a stale expected layer list in an integration test; that expectation was updated, then the latest hosted CI passed.

The current manifest consumes the exact Server/Site/iOS pins above. Server, Site, and iOS component checks pass; central E2E for the corrected Site pin remains pending. Admin and Partner remain individually checked but are not proven compatible with this Server pin.

## Known release blockers

1. No configured staging URL/provider, production deployment target, production credentials, or verified production deployment is present in the current workspace. Never infer deployment from local/Docker/GitHub build success.
2. Admin/Partner are private; central CI needs approved least-privilege access before it can fetch/build their exact SHAs. Do not place tokens in Git.
3. Server partner foundation migration/API and Smart Cache work need a reviewed integrated Server SHA; current Admin/Partner endpoint compatibility is not proven against candidate Server `6307bfcd`.
4. The central release pipeline materializes Server and Site today; five-component build/test, Admin/Partner images, iOS artifact/digest, image digests in the manifest, and rollback rehearsal remain incomplete.
5. Branch governance remains incomplete: only one collaborator is available, so public `main` rules require zero independent approvals; Admin/Partner protection is unavailable on the current GitHub plan, and feature branches are unprotected.
6. Full exact-SHA regression/security/integration acceptance and staging backup/restore/rollback rehearsal remain release gates.

See `docs/CONSOLIDATION_AUDIT_2026-10-14.md`, `docs/REDIS_CACHE_AND_PRODUCTION_GAP_AUDIT_2026-10-14.md`, and the central `RELEASE_MANIFEST.json` for additional recorded evidence.
