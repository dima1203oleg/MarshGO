# MARSHGO repository state — 2026-10-01

Reconciliation ran against umbrella product-code baseline `854c93f9440be603810844c27889a84e21a0c0f6`. Report-only commits `a8b493de4b8ce30c1ca410629b5d2dbe96eb1b3f` and `2125eb28964d2c57a1c704257bc823711662a528` followed; Verify, CodeQL and Gitleaks pass on `2125eb2`. A final report-only update records the renewed ephemeral tunnel hostname. Server, Site and iOS HEADs below remain unchanged.

## Source of truth

| Area | Canonical repository | Purpose |
|---|---|---|
| Backend, API, workers, migrations | `dima1203oleg/MarshGO-Server` | Sole production backend implementation. |
| Web/PWA | `dima1203oleg/MarshGO-Site` | Sole production browser client. |
| Native iOS wrapper/integrations | `dima1203oleg/MarshGO-iOS` | Capacitor/iOS container; release builds must pin an immutable Site revision. |
| API contracts | Server API v1/OpenAPI sources | Site consumes the server-owned API contract; contract generation/drift gates remain incomplete. |
| Infrastructure, cross-repository E2E, release orchestration | `dima1203oleg/MarshGO` | Umbrella only; no independent production API or Site source. |

## Current local branches and GitHub state

| Repository | Local branch / HEAD | `origin/main` | Purpose / production relevance | Open PR / CI | Local worktree |
|---|---|---|---|---|---|
| `MarshGO` | `codex/marshgo-production` / code baseline `854c93f9440be603810844c27889a84e21a0c0f6`, report commits through `2125eb28964d2c57a1c704257bc823711662a528` | `1e7d0ee74f11121a7d5a29c6379944a5360581c4` | Integration, release/deployment orchestration and docs. | PR #1 draft; Verify, CodeQL and Gitleaks pass at `2125eb2`. | Clean after committed reports. |
| `MarshGO-Server` | `codex/security-parse-bearer` / `237d14f1b3e4d69936433f46f290d1cd4b920d9d` | `bdfdf24941809f4581965b9847022c68e0b2f127` | Canonical backend and migrations. | PR #2 advanced with review-state API/test; checks pending after push; PR #1 Rendezvous (`f788a96...`) remains open. | Clean. |
| `MarshGO-Site` | `codex/navigation-deep-link-alias` / `79222d65beecb8bba5d234acfab47bb34070453e` | `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | Canonical Web/PWA. | PR #2 advanced with server-backed review UI; local typecheck/lint/build pass; checks pending after push. PR #1 Rendezvous (`045f138...`) remains open. | Clean. |
| `MarshGO-iOS` | `main` / `b8b1fcbfe9997e1a7a27594b5759690147de75df` | same | Native container and integrations. | PR #1 simulator capture (`328d9af...`) checks pass. | Clean. |

## Reconciliation notes

- The four worktrees were inspected; Server/Site/iOS are clean. Umbrella environment/security/release/staging report changes are committed and pushed; all four worktrees are clean.
- GitHub `main` is not treated as the newest feature source. Server and Site staging use the exact open PR #2 heads above; the active PR #1 Rendezvous work is distinct and has not been merged or overwritten.
- Server PR #2 includes migration 028 and the bounded trusted-proxy/client-IP fix plus Photon GeoJSON support. Its exact-head unit, lint, typecheck and local PostGIS/Redis integration checks pass.
- Site PR #2 fixes the stale Home navigation state after results. Its typecheck, full lint and production build pass; the feature branch is what the staging Web build uses.
- iOS remains on the recorded `main` SHA; the simulator-capture PR is not claimed as merged. Physical-device/TestFlight acceptance remains unverified.
- The umbrella local browser suite was run against its production Vite build with isolated PostGIS/Redis and test provider fixtures; it is not evidence that every flow passes on the public tunnel.

## Staging deployed source

The temporary public HTTPS tunnel currently serves Server `de2209bc71557a14b20afac07b5067a7139b8b42` and Site `150aa7ade03871cd12b80c6b3e205f345d37f996`; latest review-flow candidate commits `237d14f`/`79222d6` are pushed but not deployed to that tunnel. Staging uses separate PostGIS, Redis and private S3-compatible test storage with development OTP. The localhost.run hostname is ephemeral. Public browser acceptance remains partial and `STAGING_READY=NO`.

The release manifest pins immutable full SHAs. Its integration SHA is the umbrella code baseline before this documentation-only reconciliation commit. See [`RELEASE_MANIFEST.json`](RELEASE_MANIFEST.json), [`RELEASE_STATUS.md`](RELEASE_STATUS.md), and [`STAGING_DEPLOYMENT_REPORT.md`](../STAGING_DEPLOYMENT_REPORT.md).
