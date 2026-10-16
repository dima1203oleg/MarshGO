# Rollback runbook

1. Stop the rollout and record release tag, image IDs, migration version, error/request IDs, and time.
2. `ops/scripts/update.sh` retains prior API/Web images with a timestamped `rollback-*` tag and attempts app rollback on deployment/readiness failure.
3. Confirm `/readyz` and the essential user flows after app-image rollback.
4. Do not automatically downgrade PostgreSQL. Migrations are forward-only unless a reviewed, data-safe down migration explicitly exists. Use a forward fix for compatible additive changes.
5. For data corruption, stop writes, preserve the current DB and logs, select an encrypted backup, and restore into a separate empty database first. Validate row counts and smoke flows before planned traffic cutover. Never restore over the live database as an unreviewed first action.
6. Disable a failing external provider via its feature/configuration switch if one exists; record unsupported providers as unavailable rather than returning synthetic success.

The image rollback path has not yet been exercised on a deployed host. Validate it in staging before release.
