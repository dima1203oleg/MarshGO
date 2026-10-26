# Site dirty-tree validation and browser smoke — 2026-10-26

## Exact revision under test

- Repository: `MarshGO-Site`
- Branch: `codex/sync-journey-mobility-ui`
- HEAD: `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e`
- The worktree has extensive pre-existing modified and untracked files. These results apply to that dirty working tree, not to the branch HEAD alone. No source files were edited in this checkpoint.
- Runtime: Node `v25.4.0` (the package engine requests `24.21.0`; this is a version mismatch and must be rechecked on the pinned Node 24 release candidate).

## Local validation

| Check | Result |
|---|---|
| `npm test` | PASS — 99 tests, 9 suites, 0 failures/skips |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — Vite 8.3.5 |
| `npm run check:bundle` | PASS — all 16 JS chunks are at or below 350 KB gzip |

Build output reports `index-DMNcAqhw.js` at 975.70 kB raw / 262.04 kB gzip and a separate MapLibre JS chunk at 1,062.56 kB raw / 285.74 kB gzip. The standalone budget script reported gzip values 252.5 KB for the main entry, 274.5 KB for MapLibre, 140.7 KB for the map worker, and all 16 chunks within the 350 KB gzip per-chunk budget.

## Browser smoke

The in-app browser opened local `http://127.0.0.1:3000/journeys/search`.

- Guest sign-in transition opened the production search UI.
- Search form exposed origin/destination, clear/swap/map-pick/geolocation controls, date/time/passengers, twelve transport categories, availability descriptions, and the find-route action.
- In the current UI, several categories are explicitly disabled as lacking a router; selected categories reported no connected providers for the selected city/area.
- Pressing `Знайти маршрут` rendered the honest error `Сервер зараз недоступний. Перевірте з’єднання та повторіть пошук трохи пізніше.`
- `vite.config.ts` proxies `/api` to `127.0.0.1:3002`; no process is listening on 3002. Thus the route search is NOT_TESTED end-to-end; it is currently unavailable in this local environment.
- Main, Trips, and Profile routes rendered. Trips correctly showed an empty guest state. Profile showed the guest/unverified state and available sections. Authenticated actions and data-backed states were NOT_TESTED.
- Transport map and global quick-action sheet opened. The map reported `Не вдалося завантажити частину шарів. Спробуйте ще раз.` The navigation entry screen showed the location-waiting state and kept route-start actions disabled until a precise GPS location was available; GPS permission/real device behavior was not exercised.
- Browser smoke is not a staging or production test.

## Local dependency status

- A bounded `docker info` probe timed out after 5 seconds; Docker API is unresponsive.
- Loopback ports: PostgreSQL 5432 is owned by Homebrew PostgreSQL 14 at `/opt/homebrew/var/postgresql@14` (specific database identity/data not established), 5434 closed; Redis 6379 and 6380 closed; API 3002 closed.
- No migrations, Docker restarts, database writes, or data cleanup were performed during this checkpoint.

## Conclusion

The current Site dirty tree passes unit/type/lint/build checks. The browser can reach the production UI shell, but real route search cannot complete because API `127.0.0.1:3002` is unavailable. Do not mark route search, web end-to-end, staging, or production as PASS on these results. Root release remains `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.

## Next exact actions

1. Resolve local Docker API availability without modifying or deleting existing containers/data.
2. Identify the open PostgreSQL 5432 listener and its database identity before use; never point migrations at an unidentified database.
3. Start a disposable isolated integration environment with the required PostGIS extension and Redis, then run server migrations/integration tests and browser search E2E.
4. Run `npm run check:bundle` on the pinned Node 24 runtime and review chunk budgets.
5. Reconcile the dirty Site diff before any promotion/commit; retain the separate exact-candidate E2E and visual acceptance gates.
