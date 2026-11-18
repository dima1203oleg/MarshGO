# Home server deployment

The deployment target is Docker Compose on a maintained Linux host. The checked-in production stack contains the Site, API, PostGIS, Redis, migration job, and Caddy reverse proxy. It expects a private S3-compatible object store and external SMS, routing, geocoding, and map-manifest endpoints. Those dependencies are configured, not provisioned by this repository. The local developer Compose stack uses Adobe S3Mock for S3 contract tests and is not production storage.

## Suggested hardware profiles

| Profile | CPU | RAM | SSD | Use |
| --- | ---: | ---: | ---: | --- |
| Minimum | 4 modern cores | 8 GB | 250 GB NVMe | small staging / low traffic |
| Recommended | 8 cores | 16 GB | 500 GB NVMe | first self-hosted production, with external backups |
| High load | 16+ cores | 32+ GB | 1 TB NVMe | larger databases or colocated routing services |

These are initial engineering estimates, not load-test-derived capacity guarantees. Do not colocate a regional routing/geocoding dataset on the minimum profile.

## Network and host preparation

1. Install a supported Linux distribution, Docker Engine, and the Compose plugin.
2. Use a stable public IP or managed DDNS, then point the domain A/AAAA records to the host.
3. Allow inbound TCP 80/443 and UDP 443 for Caddy; keep SSH restricted to trusted operator addresses. Do not expose PostgreSQL, Redis, or MinIO administration ports publicly.
4. Configure host firewall, automatic security updates, disk-space alerts, and an encrypted off-host backup destination.
5. Add a UPS and verify clean shutdown/recovery.
6. Provide provider credentials via protected environment/secrets files, never Git.

## Deploy

Follow [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md). Prepare `.env.production`, a separate GPG backup key, and a release checkout with immutable repository revisions before running `ops/scripts/bootstrap.sh`.

## Backup and recovery

Run `ops/scripts/backup.sh` on schedule through systemd/cron and copy encrypted artifacts off-host. Perform restore drills into a newly created empty database. Agree RPO/RTO with the service owner; no production RPO/RTO is claimed until actual backup cadence and restore time are measured.
