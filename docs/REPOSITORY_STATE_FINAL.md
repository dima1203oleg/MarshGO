# Repository state — 2026-10-01

The standalone repos are the canonical production sources. The umbrella repo owns release orchestration, integration tests and deployment materialization. Release images use immutable Server/Site SHAs from `RELEASE_MANIFEST.json`; staging may deliberately run newer PR revisions and must not be confused with that release baseline.

| Repository | Local branch / HEAD | `origin/main` | Purpose / source of truth | Open work | Local state |
|---|---|---|---|---|---|
| `MarshGO` | `codex/marshgo-production` / verified code SHA `cf9da4f6f4e4e0e22417da090d2bd9d8bf83cb3e` | `1e7d0ee74f11121a7d5a29c6379944a5360581c4` | Integration E2E, release manifest, deployment orchestration and cross-repo docs | PR #1, draft, this code SHA's Verify, CodeQL and Gitleaks checks pass | Report-only changes follow the verified code SHA |
| `MarshGO-Server` | `codex/security-parse-bearer` / `6c069dda22030a74928227097f699491e5e89cd3` | `bdfdf24941809f4581965b9847022c68e0b2f127` | Canonical backend, migrations, API and workers | PR #2 adds migration 028 unread cursors; Verify passes at `6c069dda22030a74928227097f699491e5e89cd3`; PR #1 Rendezvous head `f788a96a5365a8a7d7f1eef416868f97217706c4` | Clean |
| `MarshGO-Site` | `codex/navigation-deep-link-alias` / `1488e627abb6c7bbc9f1abe6fa7cde4c6b4c7ae7` | `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | Canonical Web/PWA | PR #2 exposes persistent unread badges/read state; Verify passes at `1488e627abb6c7bbc9f1abe6fa7cde4c6b4c7ae7`; PR #1 Rendezvous head `045f138bd9c31cb8bcc40231da867db7d7e8e531` | Clean |
| `MarshGO-iOS` | `main` / `b8b1fcbfe9997e1a7a27594b5759690147de75df` | same | Native container and native integrations | PR #1 Simulator capture head `328d9af2b3f7095d3f9afca8fcbe4e9c5e1df0ad` | Clean |

## Deployment source of truth

- Backend code and migrations: `MarshGO-Server`.
- Web/PWA: `MarshGO-Site`.
- iOS wrapper/native code: `MarshGO-iOS`; release Web content must be pinned to an exact Site SHA.
- Integration/release/deployment orchestration: `MarshGO`.
- Release image source: immutable `server_sha` and `site_sha` in root `RELEASE_MANIFEST.json`, materialized into `.release/` and guarded against local edits.

## Staging versus release baseline

The temporary public staging service still uses Server `54ed3c85fd79807a7d7d0b539a587fffca259487` and Site `3b9af2b61b093152d451271e398920e679cf4276`; unread-cursor PR heads have not been deployed there. The release manifest canonical baseline uses Server `bdfdf24941809f4581965b9847022c68e0b2f127` and Site `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7`. Keep these identities explicit in reports and build metadata. The public hostname is an anonymous localhost.run tunnel and may rotate or expire when the local process or host disconnects.
