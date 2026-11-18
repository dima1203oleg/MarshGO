# Pinned Node 24 local product checks — 2026-10-26

## Runtime and revision scope

- Runtime: exact Node `v24.21.0`, obtained via an npm-cached Node binary outside all repositories. No package manifest or lockfile was changed to obtain it.
- Central checkout: `MarshGO`, branch `codex/production-finalization-20261014`, HEAD `c736173c809a`; extensive pre-existing dirty source/docs/files remain. Results apply to this working tree, not HEAD alone.
- Site checkout: `MarshGO-Site`, branch `codex/sync-journey-mobility-ui`, HEAD `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e`, dirty.
- Admin checkout: fast-forwarded cleanly to PR #1 HEAD `a008dbad8edc5d81d716a0913e10c325f739540b`.
- Partner checkout: exact PR #1 HEAD `5ec9f368d2788e44483a0effe6eac34838e89790`.

## Results

| Repository / check | Result |
|---|---|
| Central `npm run check:production` | PASS: typecheck, ESLint, 257 unit tests (256 pass, 1 opt-in DB integration skip), Vite production build, bundle budget |
| Site | PASS: typecheck, ESLint, 99/99 unit tests, production build, bundle budget |
| Admin | PASS: typecheck, ESLint, 4/4 unit tests, production build |
| Partner | PASS: typecheck, ESLint, 3/3 unit tests, production build |

Central bundle gate: 51 JS chunks, all <= 350 KB gzip; main entry 223.6 KB gzip, MapLibre JS 275.7 KB gzip. Site bundle gate: 16 JS chunks, all <= 350 KB gzip; main entry 253.4 KB gzip, MapLibre JS 275.7 KB gzip.

## Not established by these checks

- E2E against API/DB/Redis, live-feed probes, provider booking, GPS/device location, authenticated Admin/Partner tenant isolation, or UI visual acceptance.
- Local API listener `127.0.0.1:3002` absent; Postgres test port 5434 and Redis 6379/6380 absent; Docker API timed out. Existing Postgres 14 on 5432 was not used.
- Browser search click still results in honest server-unavailable state. GitHub orchestration verify fails for absent owner-managed `MARSHGO_REPOS_READ_TOKEN` (audit 247).
- No GitHub deployment records, staging/production endpoint, exact deployed SHA, production image digest, backup/restore or rollback proof.

## Conclusion

All four available code trees passed local type/lint/unit/build checks on the requested Node version, subject to one explicitly skipped opt-in integration test. These checks do not establish cross-repository E2E or release readiness. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next exact actions

1. Restore Docker API health or use an approved isolated host; identify/prepare a disposable PostGIS 17+3.5 and Redis 7 test environment.
2. Run the exact cross-repository release candidate through the orchestration workflow after owner configures read-only private-repository access.
3. Run API/database/Redis integrations, browser E2E and visual acceptance against those exact SHAs.
4. Complete authenticated security, provider freshness, physical-device, load, backup/restore and rollback gates.
5. Obtain real staging URL/deployment and smoke the exact candidate; production remains separately approval-gated.
