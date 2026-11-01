# Self-hosted deployment scripts

These scripts target `compose.production.yml`. They do not provision DNS, TLS, provider accounts, or secret values. Production configuration fails closed until real values are supplied. Local Docker Compose starts PostGIS, Redis, and Adobe S3Mock; S3Mock is a test double, not a production object store.

- `bootstrap.sh`: validate config, materialize the exact Server/Site/Admin/Partner commits named by `RELEASE_MANIFEST.json`, reject symlink/non-canonical or dirty pinned checkouts, and allowlist every app Docker context so ignored files and secrets cannot enter build layers. It builds all four app images, starts PostGIS/Redis, runs migrations, and starts API/Site/Admin/Partner/Caddy. Admin and Partner are served at `admin.$APP_DOMAIN` and `partner.$APP_DOMAIN`; their same-origin `/api/v1` requests reach the central Server through Nginx. CI performs the same pinned materialization and image builds; `.release/materialized.json` records exact commit IDs and hashes of generated build inputs.
- `backup.sh`: write a custom-format PostgreSQL dump encrypted with Node's AES-256-GCM and a scrypt-derived key. Authentication is verified before a decrypted archive is exposed. The key file must be stored separately from the backup directory.
- `restore.sh`: decrypt and restore only into an existing empty database. It refuses a target with application tables; create a new database for a restore drill.
- `update.sh`: requires a clean checkout and immutable `v*` tag, takes a backup, preserves the running image IDs, migrates, deploys, checks readiness, and restores prior app image tags if the new app fails. Migrations must remain backward-compatible; database rollback is intentionally not automated.

Example preparation:

```sh
cp ops/templates/production.env.example .env.production
chmod 600 .env.production
install -d -m 700 backups
install -d -m 700 /etc/marshgo
install -m 600 /secure/path/backup-passphrase /etc/marshgo/backup-passphrase
```

Do not place `.env.production` or `.backup-key` in Git. This local tooling has not been run against a production server. Verify the image build, empty-database restore, HTTPS, and external providers in staging before production traffic.
