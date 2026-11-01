# Rollback runbook

1. Stop the rollout and record release tag, image IDs, migration version, error/request IDs, and time.
2. `ops/scripts/update.sh` retains prior API/Web images with a timestamped `rollback-*` tag and attempts app rollback on deployment/readiness failure.
3. Confirm `/readyz` and the essential user flows after app-image rollback.
4. Do not automatically downgrade PostgreSQL. Migrations are forward-only unless a reviewed, data-safe down migration explicitly exists. Use a forward fix for compatible additive changes.
5. For data corruption, stop writes, preserve the current DB and logs, select an encrypted backup, and restore into a separate empty database first. Validate row counts and smoke flows before planned traffic cutover. Never restore over the live database as an unreviewed first action.
6. Disable a failing external provider via its feature/configuration switch if one exists; record unsupported providers as unavailable rather than returning synthetic success.

The image rollback path has not yet been exercised on a deployed host. Validate it in staging before release.

## DR drill executed 2026-11-01 17:26 UTC (acceptance PostGIS 17, local)

Backup and restore were exercised against the running acceptance database, restoring into a
separate empty database exactly as step 5 requires, never over the live one.

- Dump: `docker exec marshgo-acceptance-db-1 pg_dump -U marshgo -d marshgo -Fc -f /tmp/in.marshgo.dump`
  → custom-format archive, 4 022 562 bytes, sha256 `dd5f72d7b68e4ffc8a8bcaf78aa25a941413f85d92a206cd5bd9908a5eba6e62`,
  copied to `.release/backups/marshgo-acceptance-20261101-1726.dump`.
- Restore target: `createdb -U marshgo marshgo_dr_20261101` (scratch database, left in place for re-checking).
- Restore: `pg_restore -U marshgo -d marshgo_dr_20261101 /tmp/in.marshgo.dump` → exit 0, 2.2 s, no errors.
- Validation: per-table `count(*)` over every public table in both databases — 53 tables and
  17 200 rows on each side, `diff` of the sorted per-table counts empty (identical). Largest tables:
  `spatial_ref_sys=8500`, `journey_legs=5469`, `journeys=1087`, `journey_preferences=1087`,
  `sessions=497`, `audit_events=88`. `spatial_ref_sys` restoring intact confirms the PostGIS
  extension came with the archive.
- Coverage caveat, stated rather than papered over: this archive covers the transactional store.
  Parsed GTFS/GTFS-RT snapshots are not in it — they are rebuilt by the feed-refresh path, so a
  restore restores data but not warm caches, and the first journey search after a restore goes
  through the cold path before it reaches the warm median.
- Not yet exercised: app-image rollback on a deployed host (`ops/scripts/update.sh` `rollback-*`
  tags) and a restore of an *encrypted* off-container copy. Both remain staging checks before release.
- Smoke on the restored database, same drill: `postgis_version()` returns `3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`,
  `select count(*) from journeys` returns 1087, a geography distance between Lviv and Kyiv stops returns
  469 km, and the public-table count matches the source database (55 both sides). The restored copy is
  queryable by the app's own spatial SQL, not merely structurally equal.
