# Self-hosted deployment scripts

These scripts target `compose.production.yml`. They do not provision DNS, TLS, provider accounts, or secret values. Production configuration fails closed until real values are supplied. Local Docker Compose starts PostGIS, Redis, and Adobe S3Mock; S3Mock is a test double, not a production object store.

- `bootstrap.sh`: validate config, materialize the exact Server/Site commits named by `RELEASE_MANIFEST.json`, reject symlink/non-canonical or dirty pinned checkouts, allowlist the API/Web Docker contexts so ignored local files cannot enter build layers, build their production images, start PostGIS/Redis, run migrations, start API/Web/Caddy, and wait for API readiness. Requires Git, Node.js, and access to the canonical GitHub repositories. CI performs the same pinned materialization and image builds; `.release/materialized.json` records commit IDs and hashes of generated build inputs.
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
