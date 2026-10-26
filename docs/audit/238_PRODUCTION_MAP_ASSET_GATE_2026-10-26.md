# Production map asset gate — 2026-10-26

## Scope and exact evidence

- Canonical client: `MarshGO-Site`, branch `codex/sync-journey-mobility-ui`, source HEAD `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e`; the Site worktree was already dirty and was not changed for this audit.
- `docs/PRODUCTION_MAP_SETUP.md` requires a versioned immutable manifest containing four vector styles (simple light/dark, 3D light/dark) and a versioned map data URL. Satellite imagery is a separate source that requires provider attribution and reviewed commercial/caching terms.
- `src/map/mapConfig.ts` only resolves `VITE_MAP_STYLE_MANIFEST_URL` when configured; the `VITE_MAP_STYLE_URL` and `VITE_MAP_TILE_URL` paths are documented compatibility paths, not the production manifest.
- `src/map/mapMode.ts` only configures satellite when both `VITE_MAP_SATELLITE_TILE_URL` and attribution are supplied. No vendor URL or key is embedded in code.
- The canonical Site checkout has no `.env` or `.env.production`. The root orchestration `.env` is not a Site deployment config and is not evidence of a deployed map asset. Its current legacy style/tile values do not supply the required immutable style manifest or licensed satellite configuration; values are intentionally not copied to this report.
- `MarshGoMap` builds a local fallback style without raster sources when no map configuration is supplied. Route geometry and overlays can still render, while UI surfaces expose `unconfigured` / `Карта недоступна` states. This is an honest fallback but does not match the provided detailed city-map/satellite mockups.
- Existing local browser tests use deterministic schematic fixtures. They verify controls and route interactions, not real provider coverage, production tile availability, licensing, or pixel acceptance against the user's ten reference images.

## External release blocker

`BLOCKED_EXTERNAL`: provide an approved map asset deployment for the canonical Site: immutable, versioned vector manifest and Ukraine map data; licensed satellite imagery URL and attribution (or explicitly remove satellite from the release scope); cache/offline policy; provider ownership/contract and operational support expectations; and a deployed staging URL for live verification. Until these exist, do not add a public tile URL as a production shortcut and do not report the map as production-ready.

The public OpenFreeMap service permits commercial use with attribution but explicitly provides no service-level guarantee and may change/stop. The OpenStreetMap Standard raster tile service is also best-effort without SLA and is subject to its tile usage policy. Those public endpoints can be useful for development/preview, but neither is evidence of a contracted production map service for this release. Sources: [OpenFreeMap terms](https://openfreemap.org/tos/) and [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Status

- Immutable vector style manifest + deployed map data: **BLOCKED_EXTERNAL / NOT_TESTED**.
- Licensed satellite imagery + attribution: **BLOCKED_EXTERNAL / NOT_TESTED**.
- Route selection, segment focus, layer controls and map interactions against deterministic local fixtures: **PASS** in current dirty-source browser runs documented in audits 236 and 237.
- Real-provider visual acceptance and supplied-mockup pixel acceptance: **NOT_TESTED / FAIL** (the existing light route-results screenshot delta remains about 12%; no baseline was replaced).
- Production map release gate: **FAIL**. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next action

Continue independent code and test work, especially the dense-feed routing defect. In parallel with any staging preparation, acquire/identify an authorized immutable map deployment and imagery provider. Once its URLs, attribution and terms are available, configure only the canonical Site deployment, run all six day/night × simple/3D/satellite states on staging, and inspect the supplied reference screens without changing baselines before review.
