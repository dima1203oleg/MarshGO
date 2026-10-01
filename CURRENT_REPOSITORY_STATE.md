# Current MARSHGO repository state — 2026-10-01 15:31 Europe/Kyiv

Repository heads and open PRs were re-read from GitHub. The four canonical worktrees are clean and match their remote branches. Open PR branches remain separate candidates; no divergent PR was merged wholesale.

| Repository | Main SHA | Local active branch / SHA | Ahead / behind main | Local state | Open work and CI |
|---|---|---|---:|---|---|
| `dima1203oleg/MarshGO` | `1e7d0ee74f11121a7d5a29c6379944a5360581c4` | `codex/marshgo-production` / `ac6c0ffd8b0e59dfc4ebcbb352e102dc2e6a3147` | 149 / 0 | Clean | Draft PR #1. Latest Verify, CodeQL, Gitleaks checks were pending just after the report-only commit. |
| `dima1203oleg/MarshGO-Server` | `bdfdf24941809f4581965b9847022c68e0b2f127` | `codex/security-parse-bearer` / `237d14f1b3e4d69936433f46f290d1cd4b920d9d` | 7 / 0 | Clean | PR #2 Verify passes. Rendezvous PR #1 also open at `f788a96a5365a8a7d7f1eef416868f97217706c4`; not merged wholesale. |
| `dima1203oleg/MarshGO-Site` | `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | `codex/navigation-deep-link-alias` / `79222d65beecb8bba5d234acfab47bb34070453e` | 14 / 0 | Clean | PR #2 Verify passes. Rendezvous PR #1 also open at `045f138bd9c31cb8bcc40231da867db7d7e8e531`; not merged wholesale. |
| `dima1203oleg/MarshGO-iOS` | `b8b1fcbfe9997e1a7a27594b5759690147de75df` | `main` / same SHA | 0 / 0 | Clean | Simulator CI passes. Simulator-capture PR #1 remains open at `328d9af2b3f7095d3f9afca8fcbe4e9c5e1df0ad`; no physical device/TestFlight acceptance. |

## Canonical ownership

- Backend/API/database/migrations: MarshGO-Server.
- Web/PWA: MarshGO-Site.
- iOS container/native integrations: MarshGO-iOS. Release builds must pin an immutable Site revision.
- API-wide generated shared contract is not complete; mirrored typed navigation contracts are alignment-checked.
- Umbrella repository: cross-repository integration, E2E, deployment and release metadata. Mirrored source is for integration verification and must follow the standalone source repositories.

## Staging refs

- Current temporary URL: https://d399d7d0ed6b9b.lhr.life (anonymous localhost.run tunnel; hostname may rotate).
- Deployed Server: `237d14f1b3e4d69936433f46f290d1cd4b920d9d`.
- Deployed Site: `79222d65beecb8bba5d234acfab47bb34070453e`.
- iOS is not deployed to web staging; current main SHA is `b8b1fcbfe9997e1a7a27594b5759690147de75df`.
- Passenger and driver review submission and reload persistence passed using a seeded completed-trip fixture; the driver browser check used a local edge against the same staging services after public OTP rate limiting. Full trip acceptance is incomplete; `STAGING_READY=NO`.

## Latest verification snapshot

- Server: `npm run typecheck`, `npm run lint:all`; unit tests 49 passed, 0 failed, 2 skipped; PostGIS/Redis integration 18/18 passed on PR #2 head.
- Site: typecheck, full lint and production build passed; PR #2 Verify passes.
- Umbrella: production checks and Playwright production E2E 6/6 passed on the tested product-code baseline; latest root PR checks for commit `ac6c0ff` were pending when this snapshot was written.
- Browser compatibility: earlier Chromium, Firefox and WebKit responsive runs passed; latest full E2E was Chromium.
- iOS: Debug simulator build/install/launch passed on iPhone 16 Pro Max Simulator. No authenticated/native flow or physical device acceptance.
- Public staging: renewed tunnel health and readiness returned 200; Chromium opened the staging page and explicit test-only banner. Detailed evidence and limits are in [STAGING_DEPLOYMENT_REPORT.md](STAGING_DEPLOYMENT_REPORT.md).

See [RELEASE_MANIFEST.json](RELEASE_MANIFEST.json) for immutable candidate and deployed staging SHAs. Do not use temporary staging for personal or payment data.
