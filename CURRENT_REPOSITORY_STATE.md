# Current MARSHGO repository state — 2026-10-01

Latest reconciliation: standalone application repositories are clean and their pushed PR heads are the source of truth. Umbrella browser E2E now materializes immutable Server/Site SHAs from `RELEASE_MANIFEST.json` and starts canonical Server rather than an independent umbrella copy. Product-code baseline `5d8415ad9f9007e2c399bbb229c34d8e4005fdc4` is pushed; later umbrella changes in this snapshot are report/manifest-only.

| Repository | Active branch / SHA | Main SHA | Ahead / behind main | Open PR / CI | Canonical purpose |
|---|---|---|---:|---|---|
| `dima1203oleg/MarshGO` | `codex/marshgo-production` / docs-only commits after tested code baseline `5d8415ad9f9007e2c399bbb229c34d8e4005fdc4` | `1e7d0ee74f11121a7d5a29c6379944a5360581c4` | 174 / 0 (code branch) | Draft PR #1; current documentation commit CI pending | Cross-repo integration, acceptance, deployment and release orchestration |
| `dima1203oleg/MarshGO-Server` | `codex/security-parse-bearer` / `699b1fa7e007f5f8b56e597922523cf4659dd942` | `bdfdf24941809f4581965b9847022c68e0b2f127` | 9 / 0 | PR #2 Verify passes; rendezvous PR #1 also open | Backend/API, PostgreSQL/PostGIS, Redis, workers and migrations |
| `dima1203oleg/MarshGO-Site` | `codex/navigation-deep-link-alias` / `573ebca115f50c1762be4d0d26e9759b195d2fa2` | `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | 23 / 0 | PR #2 Verify passes; rendezvous PR #1 also open | Sole Web/PWA source of truth |
| `dima1203oleg/MarshGO-iOS` | `main` / `b8b1fcbfe9997e1a7a27594b5759690147de75df` | same | 0 / 0 | Simulator-capture PR #1 open; Simulator CI passes | Native iOS shell and native integrations; release must pin Site SHA |

## Canonical ownership

- Backend/API/database/migrations: MarshGO-Server.
- Web/PWA: MarshGO-Site.
- Native iOS container/integrations: MarshGO-iOS. Release bundle uses an immutable Site revision.
- Cross-repo tests, release manifest, deployment/orchestration and acceptance reports: MarshGO umbrella.
- No open PR was merged implicitly. Feature branch heads remain candidates until reviewed/merged.

## Current release candidate

- Server: `699b1fa7e007f5f8b56e597922523cf4659dd942`, migration 028.
- Site: `573ebca115f50c1762be4d0d26e9759b195d2fa2`.
- iOS: `b8b1fcbfe9997e1a7a27594b5759690147de75df`.
- Umbrella tested code baseline: `5d8415ad9f9007e2c399bbb229c34d8e4005fdc4`; report-only documentation/manifest commit follows.
- Test result on the pinned candidate pair: Site typecheck/lint/build/bundle gate pass; Chromium E2E 6/6 including Journey Rescue replacement and READY state; responsive browser smoke Chromium/Firefox/WebKit 3/3; Server unit 51 pass/0 fail/2 opt-in skips; Server PostGIS/Redis integration 18/18; umbrella unit 79 pass/0 fail/1 opt-in skip. Server Verify and Site Verify pass. iOS simulator build passes on an earlier pinned candidate; physical device not tested.

## Staging

- URL: `https://superblessed-herlinda-epiphragmal.ngrok-free.dev` (temporary tunnel; no uptime guarantee).
- Provider: local isolated staging services exposed through ngrok HTTPS.
- Deployed Server: `699b1fa7e007f5f8b56e597922523cf4659dd942`.
- Deployed Site: `573ebca115f50c1762be4d0d26e9759b195d2fa2`.
- `/healthz`, homepage and `/readyz` returned HTTP 200; readiness reports PostgreSQL and Redis connected. Storage is isolated S3Mock; geocoding/routing checks use public demo endpoints and synthetic staging data.
- `STAGING_READY=NO`, `READY_FOR_SERVER_DEPLOYMENT=NO`, `PRODUCTION_READY=NO`. Full paired-user realtime/lifecycle acceptance and production infrastructure are outstanding.

See `RELEASE_MANIFEST.json`, `RELEASE_STATUS.md` and `STAGING_DEPLOYMENT_REPORT.md` for exact verification evidence and limitations.
