# Current MARSHGO repository state — 2026-10-01 21:10 Europe/Kyiv

This is the current reconciliation; earlier snapshots in the history are superseded here. All four canonical repositories have clean tracked working trees and pushed branches. No open PR was merged. Ahead/behind counts are relative to `origin/main`.

| Repository | Active branch / HEAD | Main SHA | Ahead / behind | Open PR / CI | Source of truth |
|---|---|---|---:|---|---|
| MarshGO | `codex/marshgo-production` / `f64004ab5b9de3f20de3c5ac4a0136261a080e7b` | `1e7d0ee74f11121a7d5a29c6379944a5360581c4` | 177 / 0 | Draft PR #1. Latest CodeQL and Gitleaks pass. PR Verify is still running on Playwright browser installation; same code baseline before the CI trigger change passed full Verify at `eaa37b2cf2408bb6dd6d65748dad603877643983`. | Cross-repository E2E, deployment and release orchestration. |
| MarshGO-Server | `codex/security-parse-bearer` / `699b1fa7e007f5f8b56e597922523cf4659dd942` | `bdfdf24941809f4581965b9847022c68e0b2f127` | 9 / 0 | PR #2 Verify passes; Rendezvous PR #1 remains open and separate. | Backend/API, DB, migrations and workers. |
| MarshGO-Site | `codex/navigation-deep-link-alias` / `336787900c645277a7284568d573ce079fb05010` | `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | 26 / 0 | PR #2 Verify passes twice on this exact SHA; Rendezvous PR #1 remains open and separate. | Web/PWA. |
| MarshGO-iOS | `codex/reliable-capacitor-sync` / `1f08e73e351ed0e7e7d4c522b47c0ed5cb06e8a0` | `b8b1fcbfe9997e1a7a27594b5759690147de75df` | 2 / 0 | Simulator CI run `36903734023` passes on this exact SHA. Existing simulator-capture PR #1 remains open; this branch is pushed but has no PR. | iOS wrapper and native integrations. |

## Canonical ownership

- Backend/API/database/migrations: MarshGO-Server.
- Web/PWA: MarshGO-Site.
- Native wrapper/integrations: MarshGO-iOS. Release build inputs must pin immutable full SHAs.
- Cross-repository tests, deployment definitions, release manifest and acceptance evidence: MarshGO umbrella.

## Release candidate `RC-2026-10-01-staging.23`

- Server `699b1fa7e007f5f8b56e597922523cf4659dd942`, migration 028.
- Site `336787900c645277a7284568d573ce079fb05010`.
- iOS `1f08e73e351ed0e7e7d4c522b47c0ed5cb06e8a0`.
- Umbrella tested product/test baseline `eaa37b2cf2408bb6dd6d65748dad603877643983`; the current umbrella HEAD `f64004ab5b9de3f20de3c5ac4a0136261a080e7b` additionally scopes push CI to main to avoid duplicate feature-branch runs.

## Verification

- `npm run check:production`: PASS; typecheck, full lint, build, bundle gate, 79 unit passes, 0 failures, 1 opt-in integration skip.
- `npm run test:integration` on exact Server: PASS 18/18.
- `npm run test:e2e` on exact Server/Site: PASS 7/7 Chromium.
- `npm run test:browser-compat` on exact Site: PASS 3/3 Chromium/Firefox/WebKit.
- Site GitHub Verify: PASS twice on exact Site SHA. Server Verify: PASS on exact Server SHA.
- Umbrella GitHub Verify: PASS on `eaa37b2…` including Docker build/E2E/browser matrix; the PR run on later docs/CI-only head is still pending at Playwright browser setup. The push CI run for the latest CI-trigger edit is successful for security checks; latest full CI should be allowed to finish.
- iOS: exact pinned Site/Server local Node 24.21 simulator build, Capacitor sync, install, launch and onboarding screenshot PASS; iOS Simulator CI PASS. Authenticated iOS flow and physical-device acceptance are not tested.

## Temporary staging

- URL: `https://superblessed-herlinda-epiphragmal.ngrok-free.dev` (temporary ngrok tunnel, no uptime guarantee).
- Deployed Server/Site: `699b1fa7e007f5f8b56e597922523cf4659dd942` / `336787900c645277a7284568d573ce079fb05010`; Site bundle rebuilt from the exact SHA.
- `/healthz` and `/readyz`: HTTP 200; readiness reports PostgreSQL and realtime connected.
- Visible public Chromium: geocoded Стрий → Львів search/reload, mobile heading wrap and honest zero-offer state verified; no console errors/warnings.
- Staging remains test-only and uses isolated local PostgreSQL/Redis/S3Mock plus public demo geocoder/routing. Full public paired booking-to-review, GPS/rendezvous/boarding, cross-account realtime and restart acceptance remain incomplete.

`STAGING_READY=NO`, `READY_FOR_SERVER_DEPLOYMENT=NO`, `PRODUCTION_READY=NO`. Details and next external actions: [RELEASE_STATUS.md](RELEASE_STATUS.md), [STAGING_DEPLOYMENT_REPORT.md](STAGING_DEPLOYMENT_REPORT.md), [OWNER_ACTIONS_REQUIRED.md](OWNER_ACTIONS_REQUIRED.md), [RELEASE_MANIFEST.json](RELEASE_MANIFEST.json).
