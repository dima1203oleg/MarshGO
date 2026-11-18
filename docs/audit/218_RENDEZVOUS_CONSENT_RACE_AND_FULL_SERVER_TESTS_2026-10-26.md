# Rendezvous consent race fix and Server verification — 2026-10-26

## Scope

This checkpoint covers the dirty canonical Server checkout at
`MarshGO-Server/`, branch `feature/transport-layer-availability`, base HEAD
`92a26a3f617f32d644a66c0af46cba096ccb0ce0`. The checkout has other accumulated
uncommitted Server changes; the results below describe the full current source
tree, not a clean SHA or a release artifact.

## Changes verified

- GPS location writes and consent changes now take the same rendezvous/booking
  row lock. A location sample can commit before revocation, or wait and be
  rejected after revocation; it cannot be written after revocation has cleared
  the ephemeral Redis locations.
- Repeating an already-active consent grant is idempotent: it preserves the
  original consent epoch and live participant locations rather than clearing
  Redis or replaying a new consent transition.
- The booking integration scenario deliberately holds the rendezvous row,
  queues consent revocation, queues a location update behind it, releases the
  lock, and verifies that revocation succeeds, the queued GPS write is rejected
  for missing consent, and both participants' stored positions are absent.
- The same integration scenario checks that repeating consent keeps both live
  locations and does not rewind the rendezvous state.

## Evidence

- `npm run typecheck`: PASS.
- Focused ESLint for `server/index.ts` and `tests/api-bookings.integration.test.ts`:
  PASS.
- `npm test`: 239 PASS, 0 FAIL, 1 opt-in integration test skipped; 240 total.
- `npm run test:integration`: PASS on the isolated local Postgres/PostGIS/Redis
  setup. Journey schema 2/2, live journey 1/1, booking and trip-editing 21/21,
  navigation 2/2, Redis realtime cluster 1/1, API restart durability 1/1, and
  shared Redis rate limiting 1/1. The rendezvous race and repeated-consent
  regressions passed inside booking integration.

These are local test results against a dirty checkout. They are not hosted CI,
staging, production, physical-device, live-provider, load, backup/restore, or
rollback evidence. The root release manifest remains `NOT_RELEASED` and
`PRODUCTION_READY=false`.

## Next action

Continue from the saved dirty Server state: reconcile accumulated Server changes
and exact cross-repository SHAs, keep dense Lviv GTFS search marked incomplete
while it is truncated, then run the remaining authenticated Admin/Partner,
staging, security/load/recovery, iOS-device and release checks where access is
available. Do not deploy to production without the separately required owner
approval.
