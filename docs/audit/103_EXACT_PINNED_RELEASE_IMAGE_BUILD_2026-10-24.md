# Exact pinned release image build — 2026-10-24

## Scope

- Root integration configuration SHA used to materialize: `f727312619dbb6d73b7de8eba99bab55880201d5`.
- Exact product inputs: Server `c7252783f3c8b3b1140d621bcbdae175248008be`; Site `2af5219538aa005d285f9236ca0b0dafaca0274a`; Admin `9dbf7db0a935498ac40c98b19bc36bce056d630d`; Partner `c639257a7f28aeda5b378a816038b01651146b83`.
- `ops/scripts/materialize-release.mjs` cloned and verified those SHAs from their canonical GitHub remotes. It generated the Docker inputs and `.release/compose.production.yml`; its source-tree guard reported `pinnedSourceTreesClean: true`. Compose rendered the eight expected services: db, redis, migrate, api, web, admin, partner, proxy.
- Docker BuildKit built all four production images from those exact product sources. They are local daemon OCI refs only; they were not pushed to a registry or deployed.

## Built local OCI references

| Service | Local OCI reference |
|---|---|
| API | `marshgo/api@sha256:b8eb6b5bf5f65e5f9c03f1abe3e6eae7be081540fcb9feb45e1604b558859b3d` |
| Web | `marshgo/web@sha256:029c283a66af4e47b0e8bc07d6e2adcb86322f5d9f7e71397ef819e9fff8aa95` |
| Admin | `marshgo/admin@sha256:aeee71a851ab32e8b3e3f76179ad2e264747e12eda2661764efa88ef1f367792` |
| Partner | `marshgo/partner@sha256:86cd19742dffac5b9ed04ed99c46640356d6ab4a9f2c6d3da954db69ad2661d4` |

These refs identify images in this local Docker daemon. Registry publication, signatures/provenance attestation and target-platform release images are NOT_TESTED.

## Runtime smoke

- Web, Admin and Partner images each served `/`, the SPA fallback `/journeys/search`, and `/healthz` successfully from transient loopback-bound containers. Containers created for these smoke checks were removed afterwards. No pre-existing container or volume was changed.
- The Nginx portal smoke used an isolated local `api` hostname stub; it did not test API calls or backend connectivity.
- API image build passed. API runtime was not started as part of this image check; it remains covered by exact-candidate Server integration (29/29) and hosted tests, but not by this local image smoke.
- Exact cross-repository browser fixture E2E remains 20/20 PASS, but it is not a staging or live-provider run.

## Hosted gate and release state

PR #5 head `b7c200215161ee6648719dc738a0545fea19190c`: CodeQL and Gitleaks pass. Hosted `verify` run `40044137580` passed dependency audit, lint, typecheck, unit tests, database migrations, Postgres/Redis integration, production build and bundle-size gate, then stopped at the read-only private Admin/Partner checkout because the repository Actions secret `MARSHGO_REPOS_READ_TOKEN` is absent. Image materialization, image build and browser stages were skipped in hosted CI; the same source images were built locally as recorded above. The CI gate remains BLOCKED_EXTERNAL; no check was bypassed.

No staging URL, deployment credentials, real production provider configuration, HTTPS smoke, backup/restore, rollback rehearsal, physical iPhone acceptance or owner rollout approval was available. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`. No deployment was attempted.
