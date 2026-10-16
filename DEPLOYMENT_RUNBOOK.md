# Deployment runbook

## Current deployment mode

The repository has a Docker Compose production definition and scripts. No production host, domain, real Twilio account, approved map/routing/geocoding services, or production S3 credentials are configured in this workspace. A local build is not a deployment.

## First deployment

1. Provision Linux, Docker/Compose, DNS, firewall, private S3 storage, SMS, routing, geocoding, and map assets.
2. Prepare `.env.production` from `ops/templates/production.env.example`, replacing every placeholder; set file mode 600.
3. Create `/etc/marshgo/backup-passphrase` outside the repository and configure `BACKUP_KEY_FILE` to it.
4. Check out the immutable umbrella release tag and verify `RELEASE_MANIFEST.json` against Server, Site, and iOS SHAs.
5. Run `ops/scripts/bootstrap.sh`.
6. Verify `/healthz`, `/readyz`, app/API HTTPS, SMS OTP, routing, geocoding, tiles, object uploads, and restore from an encrypted backup in staging.
7. Run browser acceptance on staging before enabling public traffic.

The present Compose file builds from the umbrella integration checkout. Canonical standalone repository SHA materialization into those Docker contexts remains a release gap and must be resolved before claiming reproducible cross-repository production images.

## Updates

Use a clean release checkout and set `MARSHGO_RELEASE_TAG` to its immutable tag. Run `ops/scripts/update.sh`. It creates an encrypted backup, keeps prior API/Web images, runs the additive migration job, deploys, and verifies readiness. It restores prior application images if the migration command/deployment command fails. If readiness fails after rollout, it restores app images and exits nonzero. Database migrations are forward-only and must be backward-compatible; inspect and apply a forward fix if a migration has been committed.

## Local checks

```sh
bash -n ops/scripts/*.sh
docker compose --env-file /path/to/test.env -f compose.production.yml config --quiet
```

Do not run the production Compose stack with placeholder values.
