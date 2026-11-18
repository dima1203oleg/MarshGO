# Site GPS progress and currency recheck — 2026-10-25

## Candidate

- Site PR #27, branch `codex/site-gtfs-truncation-reasons-20261025`, exact source SHA `3d08d806fe514d9f2dcee0a349575149362a762a` (commit `3d08d80`). PR remains open and draft.
- Server fixture SHA `38f17b88f98c8530f8090cfc6745cd334c87e53c`.
- E2E used only the isolated loopback Postgres database `marshgo_e2e_button_audit_20261025`, Redis DB 14, fixture map/geocoder/OSRM and local Server. No existing data was cleared.

## Implemented and checked

- Added one shared UAH formatter so Chromium/WebKit render hryvnia consistently as `₴`; applied it to passenger/driver prices, journey totals and driver-demand budgets.
- Fixed navigation reconciliation so a refreshed session payload with the same session and route version does not replace locally matched progress with the route-origin distance. Reconciliation now follows session ID, route version and active/paused state.
- Exact source checks: Site unit suite **113 PASS / 0 FAIL / 0 SKIP**; TypeScript PASS; ESLint changed files PASS; production build PASS. Both hosted `verify` runs **40199586692** and **40199590743** passed on exact SHA `3d08d806fe514d9f2dcee0a349575149362a762a`.
- Focused browser checks: Chromium driver GPS E2E **1 PASS**, including fresh coordinate accepted by API, persisted to PostGIS, visible progress update and reroute after route deviation; WebKit two-account marketplace E2E **1 PASS** through booking, demand negotiation and persisted chat.
- Full Playwright fixture matrix on the exact built Site/Server pair: Chromium **24/25 PASS** and WebKit **23/25 PASS**. The Chromium button audit clicked all 169 enabled controls with zero no-effect observations. In both engines, full booking, route search, map focus, forms, responsive iPhone viewports, fresh-GPS start and rendezvous scenarios passed apart from the named failures below.
- Additional Firefox selected matrix: **5/7 PASS**, including sign-in/responsive Home/Search, two-account booking/negotiation/chat, and trip/navigation state screens. The broad button sweep's two no-effect observations (`Створити заявку`, `Опублікувати поїздку`) both passed their dedicated CTA flows; fresh-GPS start also passed separately **3/3** with the two CTA tests. A Playwright-only probe showed Firefox's synthetic geolocation timestamp is 24 hours ahead of `Date.now()`; E2E normalizes that sensor timestamp. Continuous updates after a route-page reload still did not yield the changed-coordinate POST.
- Root PR #5 hosted verification on `af8eaba79840b4763c9a3d85bcbf7ab32a267be9` fails at “Configure read-only access to private Admin and Partner repositories” because `MARSHGO_REPOS_READ_TOKEN` is unavailable. Docker build and cross-repository E2E are consequently skipped. This is a real access blocker; no workaround was attempted.

## Open checks and known failures

- WebKit multi-step navigation GPS E2E remains **FAIL / NOT_ACCEPTED**: after page reload Playwright WebKit did not emit a new mocked geolocation watch callback, so no location POST with the changed coordinates was observed. A separate WebKit fresh-GPS navigation start/end scenario does pass, but that does not verify continuous updates or rerouting in Safari. Physical iPhone/Safari acceptance remains NOT_TESTED.
- The full WebKit run is **23/25** due to the GPS test above and the broad click sweep. That sweep is not a pass: its generic 100 ms visible-fingerprint heuristic reports 11 same-state/idempotent or asynchronous observations, while Chromium's same 169-control sweep passes. See audit 191 and isolated semantic checks there.
- The selected Firefox matrix is **5/7**; its broad button audit flags two controls that pass dedicated functional tests, and its continuous-location scenario does not observe a changed-coordinate POST after reload. Firefox continuous GPS and the full 25-test suite remain NOT_ACCEPTED.
- The Chromium full suite's sole failure is the route-map screenshot `transport-map-layers-light.png`: **12,657 pixels / 4%** differ from the saved golden. The golden was not refreshed.
- Visual acceptance remains FAIL: `transport-map-layers-light.png` differs from the saved baseline by 12,657 pixels (4%). The supplied reference mockups and licensed production map style still have not passed visual/provider acceptance. Golden files were not refreshed to manufacture a pass.
- These checks do not establish live transit/provider acceptance, real staging, production smoke, deployed SHA, security/load/recovery, backup/restore, rollback, APNs/TestFlight or owner rollout approval.

## Release decision

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`. No deployment or manifest promotion occurred. Root cross-repository materialization still has the previously recorded missing `MARSHGO_REPOS_READ_TOKEN` blocker for private Admin/Partner builds. Site PR #27 remains draft; exact cross-repository compatibility and release manifest pins must be reconciled before a release candidate is accepted.

## Next actions

1. Resolve deterministic WebKit/Firefox location-update automation or record physical-device acceptance when an iPhone is available; do not claim continuous Safari GPS tested.
2. Resolve the 4% Chromium visual delta against the approved references; preserve the browser matrix results above as the current baseline.
3. Make the authorized read-only `MARSHGO_REPOS_READ_TOKEN` available to CI so the root workflow can materialize private Admin/Partner sources and run Docker/browser verification.
4. Continue the remaining cross-repository, live-provider, staging, iOS, security, load, backup/restore, rollback and owner-approval gates.
