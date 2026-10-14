# Deployment runbook

## Current deployment mode

The repository has a Docker Compose production definition and scripts. No production host, domain, real Twilio account, approved map/routing/geocoding services, or production S3 credentials are configured in this workspace. A local build is not a deployment.

## First deployment

1. Provision Linux, Docker/Compose, DNS, firewall, private S3 storage, SMS, routing, geocoding, and map assets.
2. Prepare `.env.production` from `ops/templates/production.env.example`, replacing every placeholder; set file mode 600.
3. Create `/etc/marshgo/backup-passphrase` outside the repository and configure `BACKUP_KEY_FILE` to it.
4. Check out the immutable umbrella release tag and verify `RELEASE_MANIFEST.json` against all five product SHAs, API contract, database migration, build/test evidence, image digests, target, and rollback references. Any incomplete gate blocks deployment.
5. Run `ops/scripts/bootstrap.sh`.
6. Verify `/healthz`, `/readyz`, app/API HTTPS, SMS OTP, routing, geocoding, tiles, object uploads, and restore from an encrypted backup in staging.
7. Run browser acceptance on staging before enabling public traffic.

`bootstrap.sh` and `update.sh` materialize Server and Site from their exact manifest SHAs before invoking Docker Compose. The generated `.release/compose.production.yml` points API and Web builds at those pinned product checkouts. The root `compose.production.yml` is only the materializer's input template and must not be used directly for a release. The Compose helper now verifies the materialization record, full SHAs, clean pinned source trees, generated Docker/nginx inputs, and Compose hash, and refuses to fall back to the central checkout. This currently covers Server and Site only; Admin, Partner, the signed iOS artifact, and five-component acceptance remain unimplemented release gates.

## Updates

Use a clean release checkout and set `MARSHGO_RELEASE_TAG` to its immutable tag. Run `ops/scripts/update.sh`. It creates an encrypted backup, keeps prior API/Web images, runs the additive migration job, deploys, and verifies readiness. It restores prior application images if the migration command/deployment command fails. If readiness fails after rollout, it restores app images and exits nonzero. Database migrations are forward-only and must be backward-compatible; inspect and apply a forward fix if a migration has been committed. Test this procedure on staging before an approved production deployment.

## Local checks

```sh
bash -n ops/scripts/*.sh
node ops/scripts/validate-release-manifest.mjs
node ops/scripts/materialize-release.mjs
node ops/scripts/verify-materialized-release.mjs
docker compose --env-file /path/to/test.env -f compose.production.yml config --quiet
```

Do not run the production Compose stack with placeholder values.
