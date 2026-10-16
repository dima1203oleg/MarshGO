# Backup and restore report

**Status: PARTIAL.** Local encrypted backup/restore utilities and a disposable PostGIS restore drill pass. This does not qualify hosted production backups.

## Local evidence

- Custom-format Postgres dumps are encrypted with a streaming AES-256-GCM wrapper using a scrypt-derived key; tampering is rejected before plaintext output is exposed.
- `restore.sh` requires a named existing database with zero application tables; it refuses to overwrite tables.
- A disposable PostGIS backup/restore drill passed: encrypted custom-format dump restored into a separate empty database and its synthetic row was verified. Existing developer DB was not modified.
- Integration tests cover selected database/API durability through API and Redis process restarts.

## Not performed

- Scheduled backup/PITR and off-host encrypted retention.
- Measured restore time, application migration/integrity verification, and staging recovery.
- Measured RPO/RTO or production rollback drill.

Do not describe the backup/restore release gate as passed until the isolated drill completes and a staging restore is recorded against the configured hosted environment.
