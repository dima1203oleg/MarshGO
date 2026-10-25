# GTFS truncation reasons through the journey-search API — 2026-10-25

## Server candidate

- Existing draft Server PR #41 branch: `codex/gtfs-nearby-stop-retention-20261025`.
- Latest commit: `1aa34fa2166d3a6f3040a2ebd08985da61d5c9ee` (stacked after `b69fc195b9bef85f3345c75bbc77d85a2a951409`).
- The API now OR-aggregates individual GTFS truncation causes across primary transit and secondary micromobility-to-metro searches and returns them in `data.gtfsTruncation` from `/api/v1/journeys/search`.
- Provider/worker failures retain their existing broad partial/error status. The API's older aggregate `partial`, `resultsTruncated`, `candidateGenerationTruncated` and `resultSamplingTruncated` fields remain intact.

## Verification

- Exact local source was tested on a fresh loopback database `marshgo_e2e_gtfs_truncation_20261025` and isolated Redis DB 14.
- Full integration harness completed **30 PASS, 0 FAIL, 0 SKIP**, covering fresh migrations, journey schema, live journey, booking/offer edit lifecycle, booking last-seat concurrency, tenant isolation, navigation, multi-instance realtime, restart durability and shared Redis rate limiting. The route-composition HTTP scenario asserted the precise `gtfsTruncation` keys and boolean values.
- TypeScript typecheck: PASS.
- ESLint for touched TypeScript files: PASS.
- `git diff --check`: PASS.
- Prior exact Server candidate `b69fc195b9bef85f3345c75bbc77d85a2a951409` hosted CI run `40194176559`: PASS (full Server unit, integration, migration, image build and local PostGIS/Redis image smoke). Hosted CI for new exact head `1aa34fa2166d3a6f3040a2ebd08985da61d5c9ee` is pending as run `40194463086`.

## Scope limit

This makes truncation causes visible to the client without pretending to improve recall. The frozen Lviv search still loses candidates under bounded graph/search reservoirs. The HTTP client does not yet render these individual reasons in UI. Production/staging, live-provider rights, physical iOS, load, recovery, backup/restore, rollback and final release gates remain open. `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.
