# MARSHGO repository state — 2026-10-01

Captured after the chat-history pagination changes were pushed. Branches below are the workspace source candidates; `main` remains the current merged baseline until the open PRs are merged. No working tree was dirty at capture time.

| Repository | Workspace branch / HEAD | Relative to origin/main | Purpose / source of truth | Open PR and CI snapshot | Production relevance |
|---|---|---:|---|---|---|
| `dima1203oleg/MarshGO` | `codex/marshgo-production` / `8dbc21cc27521c6db4d10e2d11381b1e19aeeab0` | 187 ahead, 0 behind | Cross-repository E2E, release manifest, deployment and integration documentation. Not an alternate Server or Site implementation. | PR #1 draft, head `8dbc21cc…`; umbrella Verify and CodeQL were running after the latest push; Gitleaks passed. | Release/integration orchestration only. |
| `dima1203oleg/MarshGO-Server` | `codex/security-parse-bearer` / `533f500bd9fa821d6b8aea7048037d4b7f897486` | 11 ahead, 0 behind | Canonical API, migrations, workers, provider adapters and server-owned business state. | PR #2 `fix(auth): bound bearer token parsing`; Verify runs `36917975891` and `36917969978` passed. PR #1 rendezvous head `f788a96a…` remains open but is stale: current `main` already contains the rendezvous API, migration 023 and integration tests. Comparing the PR to current `main` shows it would remove/replace later code (including 175 lines in `server/index.ts`), so do not merge it as-is. | Backend candidate. |
| `dima1203oleg/MarshGO-Site` | `codex/navigation-deep-link-alias` / `029aae486e164f02660c36130114527b19898001` | 30 ahead, 0 behind | Canonical Web/PWA production UI and browser application. | PR #2 `Fix navigation notification deep link alias`; Verify runs `36917987335` and `36917981271` passed. PR #1 rendezvous UI head `045f138b…` remains open but is stale: current `main` already contains the booking rendezvous panel and API integration. Comparing it to current `main` removes later Site API/UI functionality (including 30 API methods/types and 187 lines from `ProductionMarketplace.tsx`); do not merge it as-is. | Web bundle candidate pinned by release manifest. |
| `dima1203oleg/MarshGO-iOS` | `codex/reliable-capacitor-sync` / `1f08e73e351ed0e7e7d4c522b47c0ed5cb06e8a0` | 2 ahead, 0 behind | Native iOS container, pinned Site checkout/build metadata, and native integrations. | PR #1 simulator-capture head `328d9af2…` remains open; simulator checks on the workspace candidate's earlier commits passed (`36726834982`, `36726872070`). | iOS build candidate; release builds must use the immutable Site SHA in `RELEASE_MANIFEST.json`. |

## Canonical boundaries

- Backend/API/database/migrations: **MarshGO-Server**.
- Web/PWA: **MarshGO-Site**.
- Native iOS wrapper/integrations: **MarshGO-iOS**; its UI is fetched from a pinned Site revision.
- Cross-repo tests, release orchestration and shared deployment documentation: **MarshGO**.
- There is no separate umbrella backend/frontend source of truth. E2E materializes the pinned standalone repositories for its application tests.

## Candidate revisions

`RELEASE_MANIFEST.json` pins Server `533f500bd9fa821d6b8aea7048037d4b7f897486`, Site `029aae486e164f02660c36130114527b19898001`, iOS `1f08e73e351ed0e7e7d4c522b47c0ed5cb06e8a0`, and integration test baseline `1afb04307c7d6ae619dfe8598dfc829169e73a71`. These are candidate branches, not a production release. Server/Site standalone checks passed. Umbrella CI at `36920595274` was still running E2E/browser compatibility at the time of this capture; the later repository-state-only commit triggered a newer run.

## Dirty/uncommitted state

At capture time all four workspaces were clean and their branches matched their configured `origin/<branch>` tracking refs. New edits must be committed in the repository that owns the code; do not copy production implementation into the umbrella repository.
