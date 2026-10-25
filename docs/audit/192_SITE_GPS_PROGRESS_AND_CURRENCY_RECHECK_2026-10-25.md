# Site GPS progress and currency recheck — 2026-10-25

## Candidate

- Site PR #27, branch `codex/site-gtfs-truncation-reasons-20261025`, exact source SHA `3d08d806fe514d9f2dcee0a349575149362a762a` (commit `3d08d80`). PR remains open and draft.
- Server fixture SHA `38f17b88f98c8530f8090cfc6745cd334c87e53c`.
- E2E used only the isolated loopback Postgres database `marshgo_e2e_button_audit_20261025`, Redis DB 14, fixture map/geocoder/OSRM and local Server. No existing data was cleared.

## Implemented and checked

- Added one shared UAH formatter so Chromium/WebKit render hryvnia consistently as `₴`; applied it to passenger/driver prices, journey totals and driver-demand budgets.
- Fixed navigation reconciliation so a refreshed session payload with the same session and route version does not replace locally matched progress with the route-origin distance. Reconciliation now follows session ID, route version and active/paused state.
- Exact source checks: Site unit suite **113 PASS / 0 FAIL / 0 SKIP**; TypeScript PASS; ESLint changed files PASS; production build PASS. Both hosted `verify` runs **40199586692** and **40199590743** passed on exact SHA `3d08d806fe514d9f2dcee0a349575149362a762a`.
- Browser checks: Chromium driver GPS E2E **1 PASS**, including fresh coordinate accepted by API, persisted to PostGIS, visible progress update and reroute after route deviation; WebKit two-account marketplace E2E **1 PASS** through booking, demand negotiation and persisted chat.
- Root PR #5 hosted verification on `af8eaba79840b4763c9a3d85bcbf7ab32a267be9` fails at “Configure read-only access to private Admin and Partner repositories” because `MARSHGO_REPOS_READ_TOKEN` is unavailable. Docker build and cross-repository E2E are consequently skipped. This is a real access blocker; no workaround was attempted.

## Open checks and known failures

- WebKit multi-step navigation GPS E2E remains **FAIL / NOT_ACCEPTED**: after page reload Playwright WebKit did not emit a new mocked geolocation watch callback, so no location POST with the changed coordinates was observed. A separate WebKit fresh-GPS navigation start/end scenario does pass, but that does not verify continuous updates or rerouting in Safari. Physical iPhone/Safari acceptance remains NOT_TESTED.
- The broad WebKit click sweep is not a pass: its generic 100 ms visible-fingerprint heuristic reports same-state/idempotent observations. See audit 191 and isolated semantic checks there.
- Visual acceptance remains FAIL: `transport-map-layers-light.png` differs from the saved baseline by 12,657 pixels (4%). The supplied reference mockups and licensed production map style still have not passed visual/provider acceptance. Golden files were not refreshed to manufacture a pass.
- These checks do not establish live transit/provider acceptance, real staging, production smoke, deployed SHA, security/load/recovery, backup/restore, rollback, APNs/TestFlight or owner rollout approval.

## Release decision

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`. No deployment or manifest promotion occurred. Root cross-repository materialization still has the previously recorded missing `MARSHGO_REPOS_READ_TOKEN` blocker for private Admin/Partner builds. Site PR #27 remains draft; exact cross-repository compatibility and release manifest pins must be reconciled before a release candidate is accepted.

## Next actions

1. Resolve deterministic WebKit location-update automation or record physical-device acceptance when an iPhone is available; do not claim continuous Safari GPS tested.
2. Re-run the complete relevant browser matrix and visual suite against this exact Site/Server pair; resolve the 4% visual delta against the approved references.
3. Make the authorized read-only `MARSHGO_REPOS_READ_TOKEN` available to CI so the root workflow can materialize private Admin/Partner sources and run Docker/browser verification.
4. Continue the remaining cross-repository, live-provider, staging, iOS, security, load, backup/restore, rollback and owner-approval gates.
