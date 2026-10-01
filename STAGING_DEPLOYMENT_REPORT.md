# MARSHGO Temporary Public Staging Report

**Checked:** 2026-10-01 12:53 Europe/Kyiv
**STAGING_URL:** https://6fc2e0f67fc4ad.lhr.life
**STAGING_READY:** NO (public smoke and partial paired booking verified; complete paired-user acceptance remains incomplete)
**READY_FOR_SERVER_DEPLOYMENT:** NO
**PRODUCTION_READY:** NO

**Latest local production-browser rerun:** 2026-10-01, umbrella HEAD `d4ed14e65c70f97254b14a1dc6e852fc358ec31d`; `npm run test:e2e` PASS, 6/6 (Chromium, production Vite bundle, isolated local PostGIS/Redis).

## Deployment

- **Provider:** Local Docker staging stack exposed over an anonymous localhost.run HTTPS reverse tunnel. No Vercel/Cloudflare/Render/Railway/Fly deployment credentials were available.
- **Reachability:** Public HTTPS URL returned the staging web app, /healthz HTTP 200, and /readyz HTTP 200 (database=connected, realtime=connected) at report time.
- **Lifetime:** Temporary URL and stack depend on the current host, Docker services and SSH tunnel session. localhost.run may rotate the hostname after a tunnel reconnect. This is not a durable hosted staging deployment.
- **Isolation:** Separate marshgo-staging PostgreSQL/PostGIS database/volume, Redis instance/volume, and private S3-compatible S3Mock bucket/volume. Staging uses dev OTP and test data. Payments and commercial providers are disabled. No production secrets or production records were used.
- **Services:** Production-built Site bundle; pinned API; PostgreSQL/PostGIS; Redis; S3Mock; Node edge/proxy; API process-hosted outbox/realtime worker. There is no separately deployed worker service in this stack.
- **Geocoding/routing/maps:** Nominatim geocoding; OSRM-compatible road routing; MapLibre with OpenFreeMap style/vector tiles and attribution. These public services are staging integrations, not contracted or production-operated providers.
- **Migrations:** Fresh isolated database accepted migrations 001–027.

## Exact source revisions

| Component | SHA | Deployment |
|---|---|---|
| MarshGO-Server | 6c069dda22030a74928227097f699491e5e89cd3 | Deployed from `codex/security-parse-bearer` (PR #2; migration 028 candidate; not yet merged to `main`) |
| MarshGO-Site | bc4b254bbaae09ba8de96352cf7790f756e51312 | Deployed from `codex/navigation-deep-link-alias` PR #2 head (main baseline remains `c7f76a4…`) |
| MarshGO-iOS | b8b1fcbfe9997e1a7a27594b5759690147de75df | Not deployed to web staging |
| MarshGO integration baseline | cf9da4f6f4e4e0e22417da090d2bd9d8bf83cb3e | Verified integration code; current docs record the deployed standalone pair |
| Umbrella deployment/orchestration branch | bca2c9297a313a40f9804411e47c74f6c5f579c0 | `codex/marshgo-production`; report/manifest metadata at current branch head |

The active processes run from exact standalone worktrees at the Server and Site SHAs listed above. Their generated build output and local-only staging `.env` are ignored and are not committed. The source revisions themselves are committed and pushed on their respective feature branches.

## Verification

| Previous tunnel refresh (2026-10-01 11:09 Europe/Kyiv) | Result | Evidence |
|---|---|---|
| Public homepage / responsive views | PASS with expected unauthenticated API responses | Chromium opened the current HTTPS URL at 1440×900 and 390×844; both returned 200, rendered the staging banner and app title. Six direct routes (`/search`, `/trips`, `/navigation`, `/profile`, `/notifications`, `/admin/verification`) returned successful SPA responses at each viewport. Screenshots: `.release/staging-public-desktop.png`, `.release/staging-public-mobile.png`. |
| Public readiness | PASS | `/healthz` returned `staging-edge-ok`; `/readyz` returned ready with database and realtime connected. |
| Console/network | PARTIAL | No first-party request transport failures or page exceptions. Eleven 401 console resource errors were observed across anonymous protected-route probes; they are expected unauthenticated API responses, but the current anonymous sweep is not a clean-console acceptance. |

| Previous URL recheck (2026-10-01, before latest candidate redeploy) | Result | Evidence |
|---|---|---|
| Public Chromium homepage | PASS | Current tunnel `https://c6d521646ab933.lhr.life` returned 200; title and staging banner rendered. Screenshot: `.release/staging-current-validation-desktop.png`. |
| Public Chromium direct `/navigation` | PASS (route delivery) | Direct navigation returned the SPA root and preserved `/navigation`; screenshot: `.release/staging-current-validation-navigation.png`. This is route delivery evidence, not the authenticated user flow. |
| Public readiness | PASS | `/readyz` returned 200 with database and realtime connected. |
| Browser errors during logged validation | PASS | Zero page exceptions or failed browser requests in this Chromium check. Earlier anonymous route refreshes still produce the expected protected-session 401s noted above. |
| Latest staging refresh | PASS (partial) | Anonymous localhost.run hostname rotated; current `https://6fc2e0f67fc4ad.lhr.life` returns HTTP 200 and `/readyz` reports Postgres/realtime connected. Deployed Site SHA `bc4b254bbaae09ba8de96352cf7790f756e51312` and Server SHA `6c069dda22030a74928227097f699491e5e89cd3`. Candidate migration 028 is applied to the isolated staging DB. |
| Paired booking attempt (2026-10-01) | PARTIAL | Three visible dev-OTP sign-ins created explicitly named `STAGING TEST` accounts. A test-only verified vehicle/offer fixture was inserted into the isolated staging DB; it did not pass moderator verification and must not be treated as a real verified driver. The passenger UI geocoded Striy/Lviv and created a confirmed booking. Postgres records 1 passenger seat and 3/4 available; the driver's `/trips` UI visibly shows the confirmed booking and `Скасувати`/`Написати` actions. Screenshot: `.release/staging-paired-driver-trips.png`. |
| Paired chat and Rescue follow-up | NOT ACCEPTED | Follow-up browser harness locators did not resolve the intended booking card. No successful chat/cancellation/replacement booking is claimed. |
| Live Nominatim result handling | PASS (lookup only) | Staging returned actual city labels with administrative areas. One acceptance selector expected the local-fixture label exactly; the staging geocoder itself returned HTTP 200. |

| Manual public browser acceptance (2026-10-01 12:30–12:39 Europe/Kyiv) | Result | Evidence |
|---|---|---|
| New staging OTP account / logout | PASS | A synthetic `STAGING TEST` account completed the visible development OTP flow, reached `/profile`, and logged out back to the signed-out welcome state. No real SMS was sent. |
| Route search | PASS / EMPTY INVENTORY | Visible geocoder returned Striy/Lviv candidates and direct search opened `/journeys/search`; zero offers were returned for the selected date. No seed/demo results appeared. |
| Direct `/navigation` for a passenger | PASS / ROLE REQUIRED | Reload opened the navigation form. The app now explains in Ukrainian that driver role must be activated; start remains disabled until driver role, location and route requirements are satisfied. Browser geolocation was not granted. |
| Sign-in language | PASS | Updated Site build shows the Ukrainian brand line on the visible phone sign-in screen. |
| Map/GPS acceptance in this session | NOT EXERCISED | No offer or driver route was active; this session did not render a map polyline or move a marker. Earlier local/staging map evidence remains in this report. |
| Authenticated direct profile URL / session restore | PASS | A fresh visible browser tab opened `/profile`; after the protected-session restoration state, it displayed the authenticated profile, JSON export/delete request controls, empty vehicle garage, and driver-role action. This is one browser account, not a two-user product acceptance. |
| Direct `/navigation` in isolated unauthenticated tab | PASS / AUTH FLOW | A new browser tab opened the direct URL and received the welcome/sign-in view while retaining `/navigation`. Authenticated driver navigation and map/GPS behavior were not exercised in this check. |
| Candidate unread API anonymous probe | RATE LIMITED | An unauthenticated request returned 429 after repeated staging probes. This does not verify participant authorization or the unread/read UI flow; candidate pair E2E remains local-only evidence. |

| Manual public browser acceptance (2026-10-01 12:30 Europe/Kyiv) | Result | Evidence |
|---|---|---|
| New staging OTP account | PASS | A synthetic `STAGING TEST` passenger completed the visible phone OTP flow on the current URL and reached the server-backed dashboard. No real SMS was sent; the test phone and one-time code are not retained in this report. |
| Geocoding / route search | PASS / EMPTY INVENTORY | The UI returned Striy and Lviv candidates from the configured geocoder and opened `/journeys/search`; the API correctly returned zero offers for the chosen date. No seeded/demo inventory appeared. |
| Direct `/navigation` route | PASS / DRIVER ROLE REQUIRED | Refresh opened the navigation form and explained foreground-only location sharing. Starting navigation remained disabled because this account has no driver role and no browser geolocation was granted. The role-required message is currently English within the Ukrainian UI. |
| Map/route rendering on this search | NOT EXERCISED | With no route offer or active driver session, this path did not render a route polyline or live driver marker; earlier staging map and tile checks are documented separately. |

| Latest local production-browser rerun (2026-10-01) | Result | Evidence |
|---|---|---|
| GitHub Actions CI | PASS | Run `36838714838` on umbrella HEAD `d4ed14e65c70f97254b14a1dc6e852fc358ec31d`: frozen install/audit, lint:all, typecheck, unit, migrations, integration, build/bundle, Docker image build, Playwright E2E, and Chromium/Firefox/WebKit compatibility all passed. Security run `36838714812` passed Gitleaks and CodeQL. |
| Full local browser E2E suite | PASS | `npm run test:e2e`: 6/6 passed against the production-built frontend and isolated PostGIS/Redis. This is local E2E evidence; it does not upgrade public staging to `STAGING_READY=YES`. |
| Controlled GPS route replay / off-route reroute | PASS (local test harness) | The two-account scenario delivered browser geolocation in ten gradual 80 m perpendicular steps, each persisted within 20 m; the server advanced the route version, the UI showed the reroute notice, and route matching remained paused pending renewed driver consent. Evidence: `e2e/marketplace.spec.ts`, test “two accounts accept a route match, insert pickup stops, and reroute after real browser GPS deviation”. This is simulated Chromium GPS with a verified DB fixture, not physical-device GPS or public-staging acceptance. |
| Matching consent and route insertion | PASS (local test harness) | Independent driver/passenger contexts completed candidate search, driver interest, passenger confirmation, proposal acceptance and booking; the accepted route inserted two waypoints and incremented the route version. Single passenger only. |
| Conversation unread/read cycle | PASS locally; candidate pair deployed, staging acceptance pending | Candidate Server migration 028 plus Site unread badge/read action passed PostGIS integration and production-bundle two-account Chromium E2E (badge appears outside chat, opening advances `last_read_message_id`). The candidate revisions are deployed and migration 028 is applied on isolated staging; no two-user staging read/unread exercise has been completed. |

| Check | Result | Evidence |
|---|---|---|
| Public homepage / staging banner | PASS | Real browser displayed MARSHGO STAGING · TEST DATA ONLY. |
| API health/readiness | PASS | Public HTTPS /healthz and /readyz returned 200. |
| Latest production Site/Server revisions | PASS | Chromium loaded the currently deployed standalone bundle and API after moving the staging tunnel. The API CORS preflight from the current staging origin returned 204 with the matching allow-origin header. |
| Current staging OTP login | PASS | A headed Chromium session completed the visible onboarding, dev OTP and account creation flow. It reached the authenticated dashboard with zero console/page/API 5xx errors. Test identity is `MARSHGO Staging Smoke`; OTP and phone were not retained. Screenshot: `.release/staging-current-login.png`. |
| Direct URL refresh | PASS (browser smoke) | Chromium opened 18 primary application routes directly; all returned HTTP 200 with the application root present. This checks SPA fallback/deep-link delivery, not authorization or entity existence. |
| Current desktop/mobile rendering | PASS (browser smoke) | Chromium 1440×900 and 390×844; mobile document width matched viewport (390 px). No unexpected page/console errors were recorded; the unauthenticated refresh probe returned its expected 401. Screenshots: `.release/staging-current-desktop.png`, `.release/staging-current-mobile.png`. |
| iOS simulator build | PASS (simulator only) | `npm run ios:simulator` built, installed and launched the wrapper on iPhone 16 Pro Max Simulator against the local staging API, using Site source SHA `20a75798f2baffa4f3615e21799359e69ab6e651`. Onboarding rendered in `.release/staging-ios-simulator.png`; no authenticated/native-flow validation and no physical iPhone test. |
| Rescue corridor selection copy | PASS (local production-browser E2E) | The production bundle displayed an endpoint alternative and a routed corridor alternative with distinct explanation and distance labels; both were selectable. Local E2E passed 6/6 against isolated PostGIS/Redis and deterministic providers. This is not a paired-user Rescue acceptance on the public staging database. |
| Rescue corridor replacement booking | PASS (local production-browser E2E) | The passenger selected the along-route alternative, booked it through the production UI, and verified the confirmed booking, exact fare, offer ID and persisted PostGIS-backed row. This does not exercise the paired-user rescue flow on public staging. |
| Navigation direct link | PASS | `/navigation` previously returned the app's 404; the Site PR #2 alias now opens the navigation destination form on the public staging URL. Site PR checks pass. |
| Driver navigation CTA copy | PASS | Updated production build now accurately says route matching requires driver consent and a verified vehicle; rebuilt bundle was served from staging over HTTPS. |
| Previous Site candidate deployed | PASS (browser smoke) | Built standalone Site SHA `3b9af2b61b093152d451271e398920e679cf4276` with relative same-origin API and OpenFreeMap Liberty style configuration. At that deployment, the driver proposal success status persisted after demand refresh and the targeted two-account local UI matching/proposal/booking/reroute test passed (1/1). These results precede the currently deployed Site SHA `bc4b254b…`. |
| Previous public browser smoke | PASS with expected auth response | Chromium opened the earlier public `/navigation` URL at 1440×900 and 390×844. Screenshots `.release/staging-3b9af2b-desktop.png` and `.release/staging-3b9af2b-mobile.png` document that previous Site SHA, not the current candidate. |
| Local cross-browser compatibility | PASS | Chromium, Firefox and WebKit each passed the production UI smoke at phone, tablet and desktop sizes (3/3 projects). This is local E2E evidence, separate from public-staging browser coverage. |
| Driver vehicle form and private photo upload | PASS (test fixture only) | A clearly marked staging driver created a vehicle in the UI; a synthetic PNG passed the signed private S3 upload and was recorded as the primary photo in Postgres. The synthetic-document review rejected this test vehicle; it cannot publish. |
| Driver dashboard after login | PASS | Independent driver test account reached the production dashboard after OTP verification; server-backed offers, demands, vehicles and navigation-match reads returned successfully. The test vehicle is unverified, so publishing/matching acceptance remains blocked by the real verification flow. |
| Moderator authentication and direct route | PASS | Moderator test account authenticated, opened `/admin/verification` directly, and the production UI automatically loaded its verification and moderation queues without a manual refresh. |
| Verification submission/review/rejection | PASS (test-only evidence) | Driver UI uploaded two synthetic PNG fixtures; the moderator opened one in the protected UI and rejected it with a test-fixture reason. API confirmation appeared and both verification records ended as `rejected`; no synthetic evidence was approved. The automation then hit a strict-selector ambiguity on a redundant queue refresh. |
| Driver rejection recovery UI | PASS (staging fixture) | A separate driver test account enabled the driver role through UI. Its explicitly seeded rejected test vehicle displayed the moderator reason and the “Надіслати повторно” action through the direct profile route; browser reported zero page errors. This validates owner-visible recovery UI, not a production verification approval or full resubmission. |
| Verification resubmission | PASS (staging fixtures) | From the driver UI, the test account uploaded two clearly marked 1×1 PNG fixtures to the private S3-compatible staging store and resubmitted. The API returned 202; Postgres contains replacement vehicle and licence records as `pending`, the vehicle is pending, the old rejection reason is hidden, and the UI shows “Документи на перевірці”. Nothing was approved. The browser harness counted two page/request error events but did not preserve their details; investigate before claiming a clean browser run. |
| Login with development OTP | PASS | Separate Chromium contexts authenticated the staging driver and moderator test identities through the visible OTP flow; all post-login API reads returned 200. OTP values were not retained in output. |
| Passenger demand creation | PASS | UI published Стрий → Львів, 2 passengers, 300 UAH total. |
| API restart recovery | PASS | After API restart, browser reauthenticated and demand persisted in “Мої заявки”; the direct /demands/mine URL also survived reload. |
| Redis restart recovery | PASS | Staging-only Redis stop made `/readyz` return 503 (`database=connected`, `realtime=disconnected`); after Redis restart readiness returned 200 and browser reload restored the same PostgreSQL-backed demand/session. |
| Geocoding | PASS | UI address search returned and selected geocoded Стрий and Львів place results. |
| Route calculation | PASS | OSRM road route returned 98.9 km / 2 h 2 min and geometry. |
| MapLibre / tiles | PASS | Chromium loaded MapLibre canvas, OpenFreeMap style/sprites/vector tiles/fonts, attribution and route geometry. |
| Desktop rendering | PASS | Chromium at 1440×900; no horizontal overflow observed. |
| Mobile rendering | PASS | Chromium at 430×932; document width matched viewport (430 px), no horizontal overflow. |
| Private upload adapter smoke | PASS (staging emulator only) | Browser uploaded a generated test vehicle image; UI confirmed private S3-compatible staging storage upload. S3Mock is not production S3. |
| Driver test profile/vehicle | PASS (staging only) | Test user enabled driver role and created a four-seat test vehicle. This synthetic test vehicle was rejected by moderation and cannot publish or establish a real driver inventory. |
| Reverse Marketplace demand | PASS (creation only) | Server-backed demand persisted. No independent driver proposal/negotiation was available to complete. |
| Passenger booking and driver visibility | PASS (staging fixture scope only) | Passenger UI created a confirmed booking; the independent driver UI displays it with lifecycle actions; Postgres shows 3/4 seats remaining. The driver vehicle is a direct staging-only fixture and was not moderator-approved. |
| Full passenger booking lifecycle | BLOCKED / NOT ACCEPTED | Boarding, trip completion, both reviews and the full two-party cancellation/rebooking cycle were not exercised through public UI. |
| Passive matching / multi-passenger | PARTIAL / PUBLIC STAGING NOT ACCEPTED | Local two-account Chromium E2E covers one passenger through consent, proposal, booking, waypoint insertion and rerouting. Public staging matching with the staging-only vehicle is not accepted; >1 passenger capacity flow remains untested. |
| Rerouting after controlled gradual GPS replay | PASS LOCALLY / PUBLIC STAGING NOT ACCEPTED | Local production-browser E2E moves simulated browser GPS in gradual 80 m steps, verifies persisted position, off-route route-version increment, reroute UI, and matching pause until renewed consent. Public staging and physical-device GPS have not been accepted. |
| Chat / notifications / rendezvous / full Rescue journey | BLOCKED / NOT ACCEPTED | The route-corridor candidate search and UI explanation now pass local PostGIS and browser E2E, but the public staging did not complete the paired-user cancellation → alternative booking → continued trip flow. |
| WebSocket reconnect | NOT TESTED | No accepted paired-user realtime lifecycle to drive this acceptance. |
| Firefox / WebKit over public staging | NOT TESTED | Public staging acceptance used Chromium. Existing repository browser-matrix results are separate and are not evidence for this public deployment. |
| Physical iPhone / production push / SMS | BLOCKED_EXTERNAL | Requires Apple signing/device and provider credentials. |

STAGING_READY=NO follows the acceptance definition: public reachability and foundational browser checks passed, but the main two-sided booking/navigation/realtime lifecycle did not.

## Browser errors and limitations

- An unauthenticated fresh session probes /api/v1/auth/refresh; the API returns 401 as expected, and Chromium reported that expected response as a console resource error on the latest public route smoke. There were no page exceptions. No other unexpected console/API failure was observed in the final route/map run.
- The direct staff deep-link check had no browser console errors. The later resubmission run recorded two page/request error events without retaining their details; the upload POSTs returned 200, the API resubmission returned 202, the database state was pending, and the success/pending UI was captured. Treat those two events as unresolved until a detailed rerun.
- A route display screenshot shows the road polyline over real vector tiles. Controlled live movement/reroute is verified in isolated local Chromium E2E; public staging's long-delay stale-GPS behavior and physical-device movement remain unaccepted.
- The temporary staging banner states development OTP is exposed for acceptance and real payments are disabled. Use only fake staging identities/data.

## Screenshots and traces

Local, ignored artifacts (not committed or publicly linked):

- .release/staging-desktop-home.png
- .release/staging-passenger-desktop.png
- .release/staging-passenger-mobile.png
- .release/staging-driver-dashboard.png (driver test account after visible OTP login)
- .release/staging-driver-dashboard-current.png (updated Site bundle; CTA opened navigation)
- .release/staging-moderator-queue-current.png (protected queue before rejection)
- .release/staging-admin-direct-url.png (direct staff route with automatic queue loading)
- .release/staging-verification-rejection-reason.png (driver profile shows fixture rejection reason and retry action)
- .release/staging-verification-resubmitted.png (success notice and pending-review state after UI resubmission)
- .release/staging-current-desktop.png (previous pinned Site build, 1440×900)
- .release/staging-current-mobile.png (previous pinned Site build, 390×844)
- .release/staging-current-login.png (previous headed Chromium test OTP login)
- .release/staging-3b9af2b-desktop.png (latest public Site SHA 3b9af2b, Chromium, 1440×900)
- .release/staging-3b9af2b-mobile.png (latest public Site SHA 3b9af2b, Chromium, 390×844)
- .release/staging-public-desktop.png (refreshed public tunnel, Chromium, 1440×900)
- .release/staging-public-mobile.png (refreshed public tunnel, Chromium, 390×844)
- .release/staging-current-routes.trace.zip (direct `/`, `/navigation`, `/admin/verification` opens; unauthenticated trace)
- .release/staging-ios-simulator.png (iPhone 16 Pro Max Simulator onboarding render; not a physical-device artifact)
- .release/staging-map-desktop.png
- .release/staging-map-mobile.png
- .release/staging-map-openfreemap-desktop.png
- .release/staging-final.trace.zip
- .release/staging-map-openfreemap.trace.zip

Trace archives can include staging authentication/session context. Keep them private; do not upload them to public issue trackers.

## Remaining blockers

1. Keep a durable public hostname and host stack rather than an anonymous tunnel.
2. Complete paired Passenger/Driver UI acceptance for moderator-approved offer verification, booking, chat, notification, rendezvous, boarding, trip completion and reviews. The current staging test fixture is not evidence of moderator approval.
3. Complete gradual controlled GPS replay, off-route rerouting and passive matching/multi-passenger acceptance.
4. Exercise cancellation/Rescue and WebSocket reconnect/restart durability across independent users.
5. Replace S3Mock and public test geocoder/routing/map endpoints with configured production-grade services for production.
6. Real SMS, domain/TLS, production server, push, payments/commercial partners and physical iPhone acceptance remain external release gates.

The local staging stack and renewed tunnel are left running. At 2026-10-01 12:53 Europe/Kyiv, the current URL is `https://6fc2e0f67fc4ad.lhr.life`; localhost.run may rotate the hostname when the tunnel reconnects. This URL serves Site SHA `bc4b254bbaae09ba8de96352cf7790f756e51312` and Server SHA `6c069dda22030a74928227097f699491e5e89cd3`. Public Chromium verified visible test OTP login/logout, authenticated profile direct-open/session restore, unauthenticated navigation deep-link handling, and public readiness. Migration 028 is applied to staging, but unread/read has not passed a two-user staging acceptance. The URL remains valid only while the host processes and this machine stay available.
