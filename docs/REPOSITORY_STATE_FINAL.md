# MARSHGO repository state — 2026-10-02

Captured after browser multi-passenger navigation coverage was pushed. Branches below are the workspace source candidates; `main` remains the current merged baseline until the open PRs are merged. All four worktrees were clean and matched their configured upstream branches at capture time.

| Repository | Workspace branch / HEAD | Relative to origin/main | Purpose / source of truth | Open PR and CI snapshot | Production relevance |
|---|---|---:|---|---|---|
| `dima1203oleg/MarshGO` | `codex/marshgo-production` / `b06560b1460389503b1e7dfef9af6b7c738dea61` (clean; product E2E baseline `a76fe47c83f67b6f4ac6027599fae75e5016bff5`) | 194 ahead, 0 behind | Cross-repository E2E, release manifest, deployment and integration documentation. Not an alternate Server or Site implementation. | PR #1 draft, head `b06560b…`; product-code CI `36925456845` passed on `a76fe47…`; docs-head CI `36926141548` and Security `36926141590`/`36926135276` were running at capture. Security on product-code head passed (`36925456827`, `36925449186`). | Release/integration orchestration only. |
| `dima1203oleg/MarshGO-Server` | `codex/security-parse-bearer` / `533f500bd9fa821d6b8aea7048037d4b7f897486` | 11 ahead, 0 behind | Canonical API, migrations, workers, provider adapters and server-owned business state. | PR #2 `fix(auth): bound bearer token parsing`; Verify runs `36917975891` and `36917969978` passed. PR #1 rendezvous head `f788a96a…` remains open but is stale: current `main` already contains the rendezvous API, migration 023 and integration tests. Comparing the PR to current `main` shows it would remove/replace later code (including 175 lines in `server/index.ts`), so do not merge it as-is. | Backend candidate. |
| `dima1203oleg/MarshGO-Site` | `codex/navigation-deep-link-alias` / `029aae486e164f02660c36130114527b19898001` | 30 ahead, 0 behind | Canonical Web/PWA production UI and browser application. | PR #2 `Fix navigation notification deep link alias`; Verify runs `36917987335` and `36917981271` passed. PR #1 rendezvous UI head `045f138b…` remains open but is stale: current `main` already contains the booking rendezvous panel and API integration. Comparing it to current `main` removes later Site API/UI functionality (including 30 API methods/types and 187 lines from `ProductionMarketplace.tsx`); do not merge it as-is. | Web bundle candidate pinned by release manifest. |
| `dima1203oleg/MarshGO-iOS` | `codex/reliable-capacitor-sync` / `1f08e73e351ed0e7e7d4c522b47c0ed5cb06e8a0` | 2 ahead, 0 behind | Native iOS container, pinned Site checkout/build metadata, and native integrations. | PR #1 simulator-capture head `328d9af2…` remains open but is stale and regressive against current `main`: its diff removes the immutable-Site release pin checks, build metadata writer, and dependency override. Do not merge it as-is. Simulator checks on the workspace candidate's earlier commits passed (`36726834982`, `36726872070`). | iOS build candidate; release builds must use the immutable Site SHA in `RELEASE_MANIFEST.json`. |

## Canonical boundaries

- Backend/API/database/migrations: **MarshGO-Server**.
- Web/PWA: **MarshGO-Site**.
- Native iOS wrapper/integrations: **MarshGO-iOS**; its UI is fetched from a pinned Site revision.
- Cross-repo tests, release orchestration and shared deployment documentation: **MarshGO**.
- There is no separate umbrella backend/frontend source of truth. E2E materializes the pinned standalone repositories for its application tests.

## Candidate revisions

`RELEASE_MANIFEST.json` pins Server `533f500bd9fa821d6b8aea7048037d4b7f897486`, Site `029aae486e164f02660c36130114527b19898001`, iOS `1f08e73e351ed0e7e7d4c522b47c0ed5cb06e8a0`, and tested integration product-code baseline `a76fe47c83f67b6f4ac6027599fae75e5016bff5`. Current umbrella HEAD `b06560b1460389503b1e7dfef9af6b7c738dea61` adds only report/manifest updates after that tested product-code baseline. These are candidate branches, not a production release. Server/Site standalone checks passed. Product-code umbrella CI passed (run `36925456845`); docs-head CI/security runs were still running at capture.

## Dirty/uncommitted state

At capture time all four workspaces were clean and their branches matched their configured `origin/<branch>` tracking refs (0 ahead/behind their corresponding feature-branch upstreams). New edits must be committed in the repository that owns the code; do not copy production implementation into the umbrella repository.
