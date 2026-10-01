# Current MARSHGO repository state — 2026-10-01 16:57 Europe/Kyiv

All four local worktrees were checked with `git status`; each is clean and at its pushed branch head. GitHub main refs and open PR heads were re-read. Feature work remains on PR branches; no open PR was merged implicitly.

| Repository | Main SHA | Active local branch / SHA | Ahead / behind main | Open work and CI | Canonical role |
|---|---|---|---:|---|---|
| `dima1203oleg/MarshGO` | `1e7d0ee74f11121a7d5a29c6379944a5360581c4` | `codex/marshgo-production` / `3dbbcf965842fbbb764e681e625812a9e6d376d5` | 160 / 0 | Draft PR #1, open; Verify, CodeQL and Gitleaks pass at this exact head. | Integration, E2E, deployment and release orchestration. |
| `dima1203oleg/MarshGO-Server` | `bdfdf24941809f4581965b9847022c68e0b2f127` | `codex/security-parse-bearer` / `23b58cc98d2cc88b61ddc1aeb904e5eb24b7ad46` | 8 / 0 | PR #2 open; Verify passes. Rendezvous PR #1 (`f788a96a5365a8a7d7f1eef416868f97217706c4`) also remains open. | Backend, API, database and migrations. |
| `dima1203oleg/MarshGO-Site` | `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | `codex/navigation-deep-link-alias` / `c9a288162065a819864200da80fd5bcd1218af69` | 17 / 0 | PR #2 open; both Verify runs pass. Rendezvous PR #1 (`045f138bd9c31cb8bcc40231da867db7d7e8e531`) also remains open. | Web/PWA source of truth. |
| `dima1203oleg/MarshGO-iOS` | `b8b1fcbfe9997e1a7a27594b5759690147de75df` | `main` / same SHA | 0 / 0 | Simulator CI passes. Simulator-capture PR #1 (`328d9af2b3f7095d3f9afca8fcbe4e9c5e1df0ad`) remains open. | Native iOS container and integrations. |

## Staging

- Current temporary URL: `https://db75684bf2b067.lhr.life`; anonymous localhost.run tunnel, hostname and lifetime are not guaranteed.
- Current HTTP checks: edge `/healthz` = 200; API `/readyz` = 200 (`database=connected`, `realtime=connected`); public homepage = 200; visible Chromium shows the staging/test-only banner.
- Deployed Server SHA: `237d14f1b3e4d69936433f46f290d1cd4b920d9d`; the newer 30-stop candidate `23b58cc98d2cc88b61ddc1aeb904e5eb24b7ad46` is not deployed.
- Deployed Site SHA: `c9a288162065a819864200da80fd5bcd1218af69`. Passenger OTP login and the `/admin/verification` 403 guard were verified through visible public Chromium; the console was clean.
- Migration 028 is applied to isolated staging PostGIS. Redis and S3Mock are separate test instances; no production credentials/data are configured.
- `STAGING_READY=NO`; the paired booking-to-completion, rescue, navigation and realtime lifecycle is not accepted. `READY_FOR_SERVER_DEPLOYMENT=NO`; `PRODUCTION_READY=NO`.

## Source of truth

- Backend/API/database/migrations: MarshGO-Server.
- Web/PWA: MarshGO-Site.
- Native iOS shell/integrations: MarshGO-iOS; Release builds must pin exact `SITE_REF`.
- Cross-repository integration, deployment definitions and release evidence: MarshGO umbrella.
- Open PR branches are candidates, not automatically canonical/main. The two rendezvous PRs remain separate and require integration review; standalone repositories currently remain authoritative.
