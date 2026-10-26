# Authenticated Admin/Partner production-preview acceptance — 2026-10-25

## Candidate identities

| Component | Exact revision exercised | Result |
|---|---|---|
| Server | `38f17b88f98c8530f8090cfc6745cd334c87e53c` (`codex/server-current-pr39-integration-20261025`) | Local API only; loopback test DB/Redis |
| Admin | `e290ca8f52ea9b2289b632495ff6c13f7ff7f28f` (`codex/admin-partner-filter-fix-20261025`), pushed fast-forward to open PR #1 `codex/p0-admin` | Updated head verified remotely |
| Partner | `97a3727cc395dea092af6e3e24d6822370c2bc63` (open PR #1 `codex/p0-partner`) | Existing PR already contains OTP-prefill correction |

The authenticated browser pass used built production previews, not Vite development mode, with `VITE_API_BASE_URL=http://127.0.0.1:3302`, local development OTP, loopback Postgres `marshgo_e2e`, and loopback Redis. This exercises production-bundle behavior against an isolated test backend, not staging or live providers.

## Defect found and correction

Admin's “Усі статуси” filter serialized as `status=`. Server `/api/v1/admin/partners` intentionally accepts only an omitted status or one of `PENDING_REVIEW`, `ACTIVE`, `SUSPENDED`, or `REJECTED`; the empty string returned HTTP 400. This made the Admin table fail to load after successful Partner submissions.

The updated Admin API now trims and omits empty search/status parameters. A pure query builder has regression tests for empty filters and encoded selected filters. Two remaining English Admin headings were localized. Admin PR #1 was updated by a normal fast-forward push; no force-push.

## Browser scenario

- Admin OTP login succeeded.
- Admin overview, partners, providers, integrations, and audit views opened.
- Partner submitted an organization application and selected the bus module through the visible checkbox label.
- Admin list loaded from the server, found the new organization, and approved it.
- Partner refreshed its server-backed organization state and showed it active.
- The final completed run had zero unexpected browser console errors. The single initial anonymous `/auth/refresh` 401 is the expected no-session response before login.
- Test organizations, their applications and related audit rows, and OTP challenges were removed from the isolated `marshgo_e2e` database after acceptance.

## Checks

- Admin updated PR branch: typecheck PASS, ESLint PASS, 4/4 tests PASS, production build PASS.
- Partner PR #1 exact head on Node 24.21.0: typecheck PASS, ESLint PASS, 3/3 tests PASS, production build PASS.
- GitHub Actions run `40162261746` (`verify`) passed on updated Admin PR #1 head `e290ca8f52ea9b2289b632495ff6c13f7ff7f28f`.
- No production credentials, external provider requests, staging, or production traffic were used.

## Remaining boundary

This covers a core authenticated portal workflow and does not prove every Admin/Partner role, every action, tenant-isolation security acceptance, external integration health, or deployment. The ten supplied visual references remain only partially accepted (see audit 127); live vehicle/GPS scenes require authorized live data. The overall release remains `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.

## Next

1. Review hosted checks for Admin PR #1 at `e290ca8f52ea9b2289b632495ff6c13f7ff7f28f`.
2. Continue exact production-route visual acceptance against every supplied mockup and inspect remaining Admin/Partner states.
3. Continue open routing completeness, provider, security, load, staging, backup/restore, rollback, physical-device, and owner approval gates without claiming completion prematurely.
