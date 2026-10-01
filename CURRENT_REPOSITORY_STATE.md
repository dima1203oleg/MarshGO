# Current MARSHGO repository state — 2026-10-01

Checked working trees, fetched `origin/main`, inspected open PRs, and compared the local candidate heads with main. No uncommitted changes were found in the three application repositories. The umbrella code baseline is `78475fc893a3a6296c31f68833ff4d02f38dd061`; this report/manifest checkpoint is a documentation-only follow-on commit.

| Repository | Active branch / SHA | Main SHA | Ahead / behind main | Open PR / CI | Canonical purpose |
|---|---|---|---:|---|---|
| `dima1203oleg/MarshGO` | `codex/marshgo-production` / `78475fc893a3a6296c31f68833ff4d02f38dd061` (report-only follow-on) | `1e7d0ee74f11121a7d5a29c6379944a5360581c4` | 170 / 0 at code baseline | Draft PR #1; latest code verification pending at checkpoint | Cross-repo integration, acceptance, deployment and release orchestration |
| `dima1203oleg/MarshGO-Server` | `codex/security-parse-bearer` / `23b58cc98d2cc88b61ddc1aeb904e5eb24b7ad46` | `bdfdf24941809f4581965b9847022c68e0b2f127` | 8 / 0 | PR #2 Verify passes; rendezvous PR #1 also open | Backend/API, PostgreSQL/PostGIS, Redis, workers and migrations |
| `dima1203oleg/MarshGO-Site` | `codex/navigation-deep-link-alias` / `98fc439807c3870b52720ff780a988435a215821` | `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | 20 / 0 | PR #2 Verify passes; rendezvous PR #1 also open | Sole Web/PWA source of truth |
| `dima1203oleg/MarshGO-iOS` | `main` / `b8b1fcbfe9997e1a7a27594b5759690147de75df` | same | 0 / 0 | Simulator-capture PR #1 open; Simulator CI passes | Native iOS shell and native integrations; release must pin Site SHA |

## Canonical ownership

- Backend/API/database/migrations: MarshGO-Server.
- Web/PWA: MarshGO-Site.
- Native iOS container/integrations: MarshGO-iOS. Release bundle uses an immutable Site revision.
- Cross-repo tests, release manifest, deployment/orchestration and acceptance reports: MarshGO umbrella.
- No open PR was merged implicitly. Feature branch heads remain candidates until reviewed/merged.

## Current release candidate

- Server: `23b58cc98d2cc88b61ddc1aeb904e5eb24b7ad46`, migration 028.
- Site: `98fc439807c3870b52720ff780a988435a215821`.
- iOS: `b8b1fcbfe9997e1a7a27594b5759690147de75df`.
- Umbrella tested code baseline: `78475fc893a3a6296c31f68833ff4d02f38dd061`; report-only documentation/manifest commit follows.
- Test result on the pinned candidate pair: Site typecheck/lint/build/bundle gate pass; Chromium E2E 6/6; responsive browser smoke Chromium/Firefox/WebKit 3/3; umbrella unit 79 pass, 0 fail, 1 opt-in skip. Server Verify and Site Verify pass. iOS simulator build passes, physical device not tested.

## Staging

- URL: `https://superblessed-herlinda-epiphragmal.ngrok-free.dev` (temporary tunnel; no uptime guarantee).
- Provider: local isolated staging services exposed through ngrok HTTPS.
- Deployed Server: `23b58cc98d2cc88b61ddc1aeb904e5eb24b7ad46`.
- Deployed Site: `98fc439807c3870b52720ff780a988435a215821`.
- `/healthz`, homepage and `/readyz` returned HTTP 200; readiness reports PostgreSQL and Redis connected. Storage is isolated S3Mock; geocoding/routing checks use public demo endpoints and synthetic staging data.
- `STAGING_READY=NO`, `READY_FOR_SERVER_DEPLOYMENT=NO`, `PRODUCTION_READY=NO`. Full paired-user realtime/lifecycle acceptance and production infrastructure are outstanding.

See `RELEASE_MANIFEST.json`, `RELEASE_STATUS.md` and `STAGING_DEPLOYMENT_REPORT.md` for exact verification evidence and limitations.
