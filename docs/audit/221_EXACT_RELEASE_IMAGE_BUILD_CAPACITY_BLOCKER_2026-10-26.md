# Exact release-image build capacity check — 2026-10-26

## Pinned sources

The root `RELEASE_MANIFEST.json` still describes the release as
`NOT_RELEASED` / `production_ready=false` and says the current exact SHA image
tuple has not been built. Its source SHAs are Server
`a403a51a203d9d89685c10c69658c8fd95b70e9b`, Site
`6961afcf008e2c845c0fde68c687ce61fe744f2f`, Admin
`f39c4b74839a393f4487c830930669eabc8c0390`, Partner
`97a3727cc395dea092af6e3e24d6822370c2bc63`, integration
`0d3ed4accecbb5623f0c20c55c69ff0f23f14a4d`, and iOS
`be5478bed577b91a89035fe6785ab938f0335799`.

The root materializer completed successfully and validated the pinned Server,
Site, Admin and Partner checkouts, accepting only the declared generated Docker
inputs. It wrote the local `.release/materialized.json` and generated Compose
configuration. This proves source materialization only; no image build or
runtime smoke was performed in this checkpoint.

## Resource constraint

Immediately before any image build, the host reported:

- System volume: 460 GiB total, 424 GiB used, **3.2 GiB available**.
- Docker: 3.755 GiB images, 8.796 GiB volumes, 4.701 GiB build cache.
- Docker engine architecture: `linux/aarch64`.

The four-image release build was not started because it could consume the
remaining host space and disrupt the active Docker environment. No container,
volume, image, build cache, worktree or file was removed. The user had already
stopped the cleanup task.

## Remaining blockers

- Obtain enough safe free disk capacity or an isolated build host, then build
  the four images for the exact pinned tuple and record image digests.
- Production runtime configuration still requires real owner-controlled
  credentials, approved public service endpoints, map manifests, staging and a
  separately approved rollout. No secrets were inspected or invented.
- Release remains `NOT_RELEASED`; `PRODUCTION_READY=false`.
