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

## DR drill 2 — encrypted off-container backup, 2026-11-02 01:56 UTC (acceptance PostGIS 17, local)

Closes the second item of the previous "not yet exercised" list: a restore of an *encrypted*
off-container copy. The first drill's remaining item (app-image rollback on a deployed host) still
needs a deployed target and stays open.

- Dump of the running `marshgo` database → copied out of the container (`docker cp`) → the copy
  inside the container deleted. Plain archive 4 022 562 B, sha256
  `4fd6b77e99d8bced47364cbe665eebe096ed81949f9c954844bb56982fde4bce`.
- Encrypt: `openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt`, passphrase = `openssl rand -hex 32`
  held only in the shell variable of that one command, never printed and never written to disk.
  Artifact: `.release/backups/marshgo-acceptance-20261102-dr.enc`, 4 147 168 B, header `Salted__` verified.
- Roundtrip: decrypt → sha256 `4fd6b77e…4bce` (identical to plain) and `cmp` reports byte-identical.
- Restore of the decrypted copy into a fresh scratch database `marshgo_dr_20261102e`
  (`pg_restore` exit 0, 2.4 s, no errors) — never over the live database.
- Validation (order-independent, exact): for all 31 public tables with rows, `count(*)` plus
  `md5(string_agg(row::text, '|' order by row::text))` compared between live and restored —
  **31/31 identical, 0 mismatches** (largest: `spatial_ref_sys=8500`, `journey_legs=5763`,
  `journeys=1147`, `journey_preferences=1147`, `sessions=748`).
- Spatial smoke on the restored copy: `postgis_version()` = `3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`;
  `select count(*) from journeys where ST_Distance(origin::geography, destination::geography) > 100000`
  returns 968 — the app's own geography SQL runs against the recovered data.
- A byte-level `pg_dump --data-only` comparison was attempted first and showed a diff at byte 2056682;
  that is a probe fault, not a data fault: `--data-only` dumps reflect physical heap order and the live
  database keeps receiving feed-refresh writes, so file identity is not a valid equivalence test. The
  sorted per-table content hash above is the valid test and it passed.
- Key-management note, stated honestly: the `.enc` artifact is kept but is **permanently unreadable**,
  because the passphrase was deliberately never persisted. For production the ciphertext and the key
  must be stored separately (KMS/escrow with split custody) — this drill proves the crypto+restore
  mechanics, not an operable key process.
- Residue: scratch database `marshgo_dr_20261102e` dropped (only `marshgo` and the previous drill's
  `marshgo_dr_20261101` remain); container temp dumps removed; host plaintext copies removed.
- Still open for this gate: off-host/encrypted *object-storage* backup with a scheduled retention
  policy, restore on the staging host, and `ops/scripts/update.sh rollback-*` image rollback on a
  deployed target. All three require an approved environment.
## DR drill 3 — the product's own recovery primitive is now under test, 2026-11-02 02:10 UTC (local)

Drill 2 encrypted with an ad-hoc `openssl` chain, not with `ops/scripts/backup-crypto.mjs` that
`backup.sh`/`restore.sh` actually use. That primitive had **no test anywhere**: `grep -rl backup-crypto
tests/ MarshGO-Server/tests` returned nothing and `node --test ops/scripts/*.test.mjs` was not invoked by
any npm script or workflow. Writing the test found a real defect in the restore path.

- Defect: a valid archive of an empty payload (53 B = `MGBACKUP1` + 16 B salt + 12 B IV + 16 B tag)
  could not be decrypted — `createReadStream(inputPath, { start: headerBytes, end: stats.size - 17 })`
  evaluates to `start 37 / end 36` and throws `ERR_OUT_OF_RANGE` before any byte is read.
  Impact is bounded: it fails closed (no plaintext file, `.tmp` removed, exit 1) and a real `pg_dump -Fc`
  is never empty — but a truncated/failed dump would surface as an unhandled Node stack instead of a
  clear restore error, and the crypto path itself was unverified.
- Fix: do not open the ciphertext stream when the payload length is zero (`ops/scripts/backup-crypto.mjs`,
  commit `cf5e283`).
- New tests `ops/scripts/backup-crypto.test.mjs` (8 cases): 2 MB binary roundtrip with header/format and
  0o600-mode assertions; empty-payload roundtrip; `-` stdin roundtrip; wrong passphrase rejected with no
  plaintext and no `.tmp`; single tampered ciphertext byte rejected with no plaintext; truncated archive
  rejected (`Encrypted backup is truncated.`); foreign magic rejected (`unsupported format`); passphrase
  < 32 bytes rejected for both operations; usage errors exit 2.
- Wiring so this is not dead code: `npm run test:ops` added and chained into `check:production`.
- Evidence: `node --test ops/scripts/*.test.mjs` -> tests 12, pass 12, fail 0 (also runs the previously
  unwired `release-build-metadata.test.mjs`); `eslint ops/scripts/backup-crypto.mjs ops/scripts/backup-crypto.test.mjs` -> 0 problems.
- Still NOT exercised end-to-end through the product scripts themselves: `ops/scripts/backup.sh` and
  `restore.sh` need a real `.env.production` and a persisted `BACKUP_KEY_FILE`, which do not exist on this
  host; and the three environment-bound items from drill 2 (off-host object storage with retention,
  restore on a staging host, `update.sh rollback-*` on a deployed target) remain open.
## DR drill 4 — the product's own scripts (`backup.sh` → `restore.sh`), 2026-11-02 02:12 UTC (acceptance PostGIS 17)

Drills 2 and 3 covered the mechanics (ad-hoc openssl chain, then unit tests of the crypto primitive).
This drill runs the recovery path exactly as an operator would: the shipped scripts, no hand-built pipeline.

- Env overrides only, nothing written into the repo: `MARSHGO_ENV_FILE=/tmp/…` (0600, deleted with the drill),
  `MARSHGO_PROJECT_NAME=marshgo-acceptance`, `BACKUP_KEY_FILE=/tmp/…/pass.key` (0600, `openssl rand -hex 32`).
- `bash ops/scripts/backup.sh` exit 0 → `/tmp/…/marshgo-postgres-20261102T021147Z.dump.gpg`, 4 147 200 B,
  produced by `compose exec -T db pg_dump -U marshgo -d marshgo -Fc | backup-crypto.mjs encrypt -`.
- Fail-closed guard proven before any restore: `restore.sh <archive> marshgo` -> `exit 3`,
  "Refusing restore: target database 'marshgo' contains 115 application relations". The live database was
  never a restore target, and no plaintext was written.
- `restore.sh <archive> marshgo_dr_20261102f` (fresh empty scratch DB) exit 0 in 3.49 s.
  Note: `createdb --locale=C` fails on this image (cluster collation is `en_US.utf8`) — an operator
  provisioning a target must copy the source collation, or the restore will not even start.
- Validation (probe validity checked first, then the verdict): per-table `count(*)` +
  `md5(string_agg(row::text,'|' order by row::text))` for all 31 public tables with rows, run identically
  against live and restored. 31 rows of output on both sides, 0 malformed/NULL hashes, `live == restored`,
  17 873 rows total restored. The first attempt at this probe produced two empty files that `diff` called
  identical; that is recorded here as a harness fault caught by asserting non-emptiness, not as evidence.
- Spatial smoke on the restored copy: `postgis_version()` = `3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1` and the
  app's own geography predicate `ST_Distance(origin::geography, destination::geography) > 100000` returns 968.
- Residue: scratch database dropped (only `marshgo` and the earlier drill's `marshgo_dr_20261101` remain);
  `/tmp` archive, key and env file removed together so no readable ciphertext is left next to its passphrase.
  Unlike drill 2, this archive *was* decryptable by design — the key existed for the duration of the drill.
- Gate wording after this drill: backup/restore is PASS(local, through the shipped scripts). Still open and
  environment-bound: off-host object storage with a retention schedule, restore on the staging host, and
  `ops/scripts/update.sh rollback-*` image rollback on a deployed target.
