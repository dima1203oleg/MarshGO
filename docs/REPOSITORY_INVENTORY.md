# Canonical repository inventory — 2026-10-26

Scope is the six repositories explicitly named by the MARSHGO 5+1 architecture. This is a read-only checkout/PR inventory; no branches were merged or deleted.

| Role | Repository | Local branch / HEAD | Worktree | Manifest SHA | Finding |
|---|---|---|---|---|---|
| Release orchestrator | `MarshGO` | `codex/production-finalization-20261014` / `febd5008fbf7bba058b0e1bf2bfab647a0c735c5` | Dirty (303 paths); ahead 2 | `integration_sha=0d3ed4accecbb5623f0c20c55c69ff0f23f14a4d` | Current checkout is not the manifest integration SHA. |
| Server | `MarshGO-Server` | `feature/transport-layer-availability` / `92a26a3f617f32d644a66c0af46cba096ccb0ce0` | Dirty (40 paths); ahead 2 | `a403a51a203d9d89685c10c69658c8fd95b70e9b` | Local tests cover dirty source, while the manifest pins a different commit. |
| Passenger/driver Web/PWA | `MarshGO-Site` | `codex/sync-journey-mobility-ui` / `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e` | Dirty (45 paths) | `6961afcf008e2c845c0fde68c687ce61fe744f2f` | Local UI/E2E evidence is not tied to the pinned manifest SHA. |
| iOS shell | `MarshGO-iOS` | `codex/production-site-sync-20261014` / `4353cec3cacbaf662ceea047402f361024292b22` | Clean | `be5478bed577b91a89035fe6785ab938f0335799` | Current checkout and manifest differ; manifest's simulator Site SHA matches its old Site pin, not current Site. |
| Admin | `MarshGO-Admin` | `codex/p0-admin` / `bc37198ca139408907aaefa0d97dc9b60a568300` | Clean; behind 2 | `f39c4b74839a393f4487c830930669eabc8c0390` | Local branch is behind; current checkout is not the manifest snapshot. |
| Partner | `MarshGO-Partner` | `codex/p0-partner` / `97a3727cc395dea092af6e3e24d6822370c2bc63` | Clean | `97a3727cc395dea092af6e3e24d6822370c2bc63` | Local HEAD matches the manifest Partner pin. |

## Current release evidence

- `RELEASE_MANIFEST.json` reports `status: NOT_RELEASED`; `deployed_site_sha` is null.
- No single immutable tuple covers the current local source trees because the working Server, Site, iOS, Admin, and orchestrator commits differ from the manifest pins.
- Server and Site worktrees contain uncommitted changes. Preserve them; do not reset, clean, or stage the entire trees.
- Server has 75 registered Git worktrees, 30 marked `prunable`. This count alone does not establish that their contents are disposable; none were removed.
- Admin and Partner have open P0 PRs; authenticated tenant-level acceptance is not established by the local build/unit checks.
- Deployment, staging, live provider entitlements, physical iPhone and production smoke are not evidenced by this inventory.

## Evidence collection

Collected with `git status --short --branch`, `git rev-parse HEAD`, `gh pr list --state open`, and `jq` against the current root `RELEASE_MANIFEST.json` on 2026-10-26. The detailed open PR graph is in [PR_DEPENDENCY_DAG.md](PR_DEPENDENCY_DAG.md).
