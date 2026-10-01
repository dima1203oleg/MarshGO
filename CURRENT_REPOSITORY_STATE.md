# Current MARSHGO repository state — 2026-10-01

This snapshot separates canonical `main` refs from active PR branches and the exact revisions currently deployed to temporary staging. No open PR was merged wholesale; divergent Rendezvous/simulator changes remain available for review.

| Repository | Canonical `main` SHA | Active branch / SHA | Working tree | Source of truth / open work | CI and production relevance |
|---|---|---|---|---|---|
| `dima1203oleg/MarshGO` | `1e7d0ee74f11121a7d5a29c6379944a5360581c4` | `codex/marshgo-production` / `172cf0e2087d557938df4aa9dcefc1bfd0fbe345` | Product changes committed; report updates will be committed separately. | Cross-repository E2E, deployment, manifests and release records; draft PR #1 remains open. | CI, CodeQL and Gitleaks pass on `172cf0e`. Integration only, not canonical Server/Site. |
| `dima1203oleg/MarshGO-Server` | `bdfdf24941809f4581965b9847022c68e0b2f127` | `codex/security-parse-bearer` / `54ed3c85fd79807a7d7d0b539a587fffca259487` | Clean; staging worktree/config is ignored and remains local. | Backend, API, migrations and workers; PR #2 security changes plus route-aware Rescue. Rendezvous PR #1 remains separate and divergent. | PR #2 checks pass on the pushed SHA. This exact feature-branch SHA runs in staging; it is not merged to `main`. |
| `dima1203oleg/MarshGO-Site` | `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | `codex/navigation-deep-link-alias` / `20a75798f2baffa4f3615e21799359e69ab6e651` | Clean. | Canonical Web/PWA; PR #2 navigation alias and Rescue corridor copy. Rendezvous PR #1 remains separate and divergent. | PR #2 checks pass on the pushed SHA. This exact feature-branch SHA is deployed to staging. |
| `dima1203oleg/MarshGO-iOS` | `b8b1fcbfe9997e1a7a27594b5759690147de75df` | `main` / same SHA | Clean. | Native container and native integrations; simulator-capture PR #1 remains open and separate. | Main simulator CI passed. No signed device/TestFlight acceptance. |

## Canonical ownership

- Backend/API/database/migrations: MarshGO-Server.
- Web/PWA: MarshGO-Site.
- iOS container/native integrations: MarshGO-iOS; release build inputs must pin an immutable Site SHA.
- API-wide generated shared contract is not complete; mirrored typed navigation contracts are alignment-checked.
- Umbrella repository: cross-repo integration, E2E, deployment and release metadata. Mirrored source exists for integration verification only and follows the standalone repositories.

## Staging refs

- URL: https://68c5275490212d.lhr.life (anonymous, temporary localhost.run tunnel).
- Server: `54ed3c85fd79807a7d7d0b539a587fffca259487`.
- Site: `20a75798f2baffa4f3615e21799359e69ab6e651`.
- iOS is not deployed to web staging; current `main` SHA is `b8b1fcbfe9997e1a7a27594b5759690147de75df`.
- Staging remains `STAGING_READY=NO`; see [STAGING_DEPLOYMENT_REPORT.md](STAGING_DEPLOYMENT_REPORT.md).

## Latest verification snapshot

- Server: `npm run typecheck`, `npm run lint:all`, unit tests 46 passed/1 skipped; PostGIS/Redis integration 17 passed, 0 failed.
- Site: typecheck, full lint and production build passed.
- Umbrella: typecheck/lint passed; unit tests 74 passed/1 skipped; Playwright production E2E 6/6 passed, including cancellation Rescue UI and route-corridor selection.
- Browser compatibility: Chromium, Firefox and WebKit each passed the responsive suite (3/3); bundle budget passed.
- Public staging: headed Chromium OTP login passed; 18 direct route opens returned HTTP 200; Chromium screenshots captured at 1440×900 and 390×844 with zero overflow and no unexpected browser errors. An unauthenticated refresh probe returns the expected 401. Three direct routes were also captured in a Playwright trace.
- Umbrella CI for SHA `172cf0e…` is awaiting completion; the preceding umbrella head CI/security checks passed. Server/Site PR #2 checks pass.

See [RELEASE_MANIFEST.json](RELEASE_MANIFEST.json) for main baseline and deployed staging SHAs. Do not use temporary staging for personal or payment data.
