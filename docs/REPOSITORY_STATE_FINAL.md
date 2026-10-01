# MARSHGO repository state — 2026-10-02

Captured after browser multi-passenger navigation coverage was pushed. Branches below are the workspace source candidates; `main` remains the current merged baseline until the open PRs are merged. The earlier table is a historical snapshot; latest state is below.

## Latest workspace snapshot — 2026-10-02

| Repository | Branch / exact HEAD | Worktree | Current note |
|---|---|---|---|
| `MarshGO` | `codex/marshgo-production` / `07172adc0940234aac88b042468cd03ab3fa78d7` | clean, pushed | Integration E2E, release manifests and deployment docs only. Umbrella CI/Security were running at capture (36930561202 / 36930561323). |
| `MarshGO-Server` | `codex/security-parse-bearer` / `5e8cc4ce4d5e58babcc306c1cf5173f1f4600ea1` | clean, pushed | Canonical API; Journey average-rating DTO normalization. Server CI/Security passed (36929377114 / 36929372423); local unit 51 passed / 0 failed / 2 opt-in skips; PostGIS/Redis integration 18/18. |
| `MarshGO-Site` | `codex/navigation-deep-link-alias` / `029aae486e164f02660c36130114527b19898001` | clean | Canonical Web/PWA; unchanged for the latest DTO fix. |
| `MarshGO-iOS` | `codex/reliable-capacitor-sync` / `1f08e73e351ed0e7e7d4c522b47c0ed5cb06e8a0` | clean | Native wrapper/integrations; unchanged for the latest DTO fix. |

The local production-browser suite is **not fully green on the latest pair**. It reproduced the decimal-string rating crash against Server `533f500…`; Server `5e8cc4…` fixes the DTO. The subsequent full E2E against the fix was interrupted by local volume exhaustion that made Redis persistence read-only and terminated test-service connections. Updated full-flow regression remains pending a recovered local Postgres/Redis host. Public staging still serves Server `533f500…` / Site `029aae4…`; the fix has not been deployed there. `STAGING_READY=NO`, `READY_FOR_SERVER_DEPLOYMENT=NO`, `PRODUCTION_READY=NO`.

| Repository | Workspace branch / HEAD | Relative to origin/main | Purpose / source of truth | Open PR and CI snapshot | Production relevance |
|---|---|---:|---|---|---|
| `dima1203oleg/MarshGO` | `codex/marshgo-production` / `75d7cea5ef0cb275821d803b3e1b10cbaa3c7c2c` (clean; product E2E baseline `a76fe47c83f67b6f4ac6027599fae75e5016bff5`) | 195 ahead, 0 behind | Cross-repository E2E, release manifest, deployment and integration documentation. Not an alternate Server or Site implementation. | PR #1 draft, head `75d7cea…`; product-code CI `36925456845` passed on `a76fe47…`; docs-head CI runs `36926940494` (CI), `36926940417` and `36926934856` (Security) were running at capture. Security on product-code head passed (`36925456827`, `36925449186`). | Release/integration orchestration only. |
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
