# Backup and restore

## Current status

The repository has no configured managed-database backup schedule, point-in-time recovery policy, encrypted backup destination, or successful production restore drill. Local PostgreSQL durability/restart tests are not backup evidence. Production remains blocked until the database provider and retention policy are selected and a restore is proven.

## Required backup policy

Before launch, set owner-approved RPO/RTO, encrypted automated backups/PITR, retention, access controls, expiry, and backup deletion handling for personal data. Store backup credentials outside the application host and audit restore access.

## Restore drill

1. Restore a recent encrypted backup into an isolated, access-restricted recovery database. Never restore over the live database for a drill.
2. Verify migration level, row counts and referential integrity for users, vehicles, offers, bookings, proposals, messages, navigation sessions, and outbox records.
3. Start the matching application version against the isolated restore and run health, authorization, booking inventory, chat, and journey smoke checks.
4. Verify expired precise-location data is deleted after restore and that no live Redis location keys are reconstructed from backups.
5. Record start/end time, recovered timestamp, RPO/RTO, checks, discrepancies, operator, and follow-up actions.
6. Remove the isolated database and temporary restore artifacts using the provider's documented secure deletion process.

Repeat after material database or retention-policy changes and on the schedule chosen by the production owner.
