# Current guest UI acceptance and runtime recheck — 2026-10-26

## Scope and exact state

- Workspace: central `MarshGO`, branch `codex/production-finalization-20261014`, HEAD `6dd47db90ec8750272cf34541a9f818d4f4633dd`.
- Root worktree already had 338 modified/untracked paths; this check preserved them. No app source, database, Docker object, or user data was changed.
- Browser: local Vite app at `http://127.0.0.1:3000`, narrow viewport 386×519, guest session. No user credentials or OS location permission were supplied.
- Runtime: Vite serves `/` with HTTP 200, but Vite `/healthz` returns 502 because its default API proxy is `127.0.0.1:3002`. The running API is on `127.0.0.1:3310`; `/healthz` is 200 and `/readyz` is 500. The API process is running from `/private/tmp/marshgo-server-partner-integration-20261026`, not the canonical `MarshGO-Server` checkout. Configured database port 5434 has no listener. Host PostgreSQL on 5432 was not used. Docker socket `_ping` timed out after 3 seconds. Available disk: 3.0 GiB.
- The repository launcher intentionally starts the API on 3002 and reads loopback-only DB/cache configuration from `.env`; changing Vite's default target to 3310 would only point it at an API whose database readiness is failing. No proxy/config change was made.

## Browser actions and findings

- Guest Trips: Active, Planned, Cancelled, Offers, Requests, Saved and History switched successfully and showed truthful empty states.
- Profile: opened Personal Data, My Transport, Verification and Settings. Settings theme toggled Light→Dark and the Light screenshot was visually confirmed; dark was restored. Adding a vehicle failed with `Request failed (502)`. Verification showed no server-provided records. Sensitive export/delete controls were not activated.
- Search: form loaded with Ukrainian origin/destination, time, passenger count and the 12 transport categories. Five unsupported categories were disabled (Taxi, Bicycle, Scooter, Carshare, Transfer); enabled public-transport categories said provider status was unverified. Provider filter opened a truthful “sources appear after city selection” empty state. Search returned “Server is currently unavailable”; no route result/map route could be tested.
- Search controls: date picker opened, disabled past dates and selected tomorrow; date was restored to Today. Passenger picker changed 1→2 and was restored to 1. Tram checkbox toggled off/on and the “All” aggregate followed it. Time picker opened at 18:30 and was dismissed without changing it. Location permission and map-point picker were not invoked.
- Home: route loaded with city Lviv, carpool banner, four quick actions and popular routes. Tapping the city-selection control navigated into Search rather than presenting a city picker; this interaction needs follow-up against the intended behavior.
- No authenticated passenger/driver journey was possible, and booking, chat, payments, live GPS, Admin/Partner workflows and route-map scenarios were not exercised in this guest/runtime session.

## Automated checks

- `npm run check:production`: exit 0; TypeScript, ESLint, unit tests, production build and bundle budget passed.
- Repeated `npm test`: 256 passed, 1 opt-in database test skipped, 0 failed (257 total), 1.66 seconds.
- Runtime is Node 26.7.0 while repository `.nvmrc` specifies Node 24; record this as a non-canonical runtime check.
- E2E, current-branch visual regression, responsive matrix, staging, production, physical iPhone and live provider acceptance were not established by these checks.

## Corrections and next actions

- There are **12** categories total; **five** were disabled (Taxi, Bicycle, Scooter, Carshare, Transfer).
- Restore the intended isolated PostGIS/Redis runtime without deleting/resetting Docker data; align the runtime by using the documented launcher/port configuration; confirm `/readyz` before browser acceptance.
- Rerun authenticated full route/button E2E and visual review for all provided mockups in both themes and at 320/390/430/768/1280/1440 px.
- Keep `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`. No staging or production deployment was performed.

## Follow-up: truthful Home action label

- Source inspection confirmed the Home city pill calls `onSearchTrip`; it does not open a city picker. Changed its accessible name from “choose city” to “open route search for Lviv” and verified the updated name in the guest browser.
- TypeScript, targeted ESLint and all unit tests passed after the change: 256 pass / 1 opt-in DB skip / 0 fail.
- Committed only this component change as `e87e152` (`fix: clarify home city search action label`). This does not add city-selection functionality; full route/browser acceptance remains blocked by the runtime above.

## Follow-up: global create action / reverse-marketplace form

- The global `+` control opens the quick-action sheet. “Створити запит пасажира” opens `/demands/new` with origin/destination, time window, passenger count, budget, budget unit, passenger needs, notes and a publish control. No request was submitted.
- “Мої заявки” opens `/demands/mine` and displays the expected empty state. This verifies guest navigation and form rendering only; geocoding, persistence and driver matching remain untested because server readiness is failing.
