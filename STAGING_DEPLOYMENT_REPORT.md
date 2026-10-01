# MARSHGO Temporary Public Staging Report

**Checked:** 2026-10-01 14:23 Europe/Kyiv
**STAGING_URL:** https://e134c817e388ca.lhr.life
**STAGING_READY:** NO (public smoke and partial paired booking verified; complete paired-user acceptance remains incomplete)
**READY_FOR_SERVER_DEPLOYMENT:** NO
**PRODUCTION_READY:** NO

**Latest reconnect:** 2026-10-01, temporary URL `https://e134c817e388ca.lhr.life`. localhost.run rotates hostnames; old URLs can return 503 after reconnect. Previous hostname `839af757d628d4.lhr.life` expired during browser acceptance and its API request returned 503. The renewed URL now returns homepage HTTP 200 and `/readyz` HTTP 200; UI retest on this hostname is pending.

## Latest delta acceptance

| Check | Result | Evidence / limits |
|---|---|---|
| Renewed URL Chromium retry | PASS (partial) | On `e134c817e388ca.lhr.life`, visible development OTP login succeeded; Photon returned selectable Kyiv/Lviv suggestions; direct `/journeys/search` rendered the honest zero-inventory state; direct `/navigation` rendered and correctly stated that driver role is required. No GPS permission was granted and no navigation was started. |
| Trusted proxy rate-limit isolation | PASS | Server requires bounded `TRUST_PROXY_HOPS` in production, defaults to zero in development, and configures Express trust explicitly. Two API instances with Redis verified different forwarded client IPs receive independent buckets and the same client still receives 429. |
| Server quality gates | PASS | Exact Server head `de2209bc71557a14b20afac07b5067a7139b8b42`: typecheck and full ESLint pass; unit tests 49 passed / 0 failed / 2 skipped; isolated PostGIS/Redis integration 18/18 passes, including migrations 001–028, bookings, navigation, realtime, restart durability and shared rate limits. |
| Public UI OTP | PASS | Visible Chromium completed development OTP login on the then-current tunnel. A fresh browser tab restored the authenticated profile after API restart. OTP and phone are omitted. |
| Ukrainian address lookup | PASS | Authenticated Chromium on the renewed URL queried Photon and returned selectable Kyiv/Lviv suggestions. Backend filters Photon results to Ukraine. This public demo endpoint is low-volume staging only and has no uptime guarantee. |
| Offer search / Journey planner | PARTIAL | Selected real geocoder place IDs; server search/planning returned a truthful zero-results state because staging has no suitable current inventory. No fake offer was shown. |
| Navigation deep link | PARTIAL | Direct `/navigation` opening returned the production navigation screen and correctly required an activated driver role. GPS route, movement and reroute were not completed in this browser session. |
| Public readiness | PASS | Renewed tunnel homepage and `/readyz` returned HTTP 200; PostgreSQL and Redis were connected. URL is ephemeral and needs rechecking after reconnect. |
| Return-home navigation | FIXED; build gates PASS | Fixed the stale `showResults` UI state on Site `150aa7a`; typecheck, full lint and production build pass. Browser click regression was not rerun on the current tunnel. |
| Local production-browser E2E | PASS | `npm run test:e2e`: 6/6 on Chromium against the production Vite bundle with isolated PostGIS/Redis and deterministic test providers. Covers responsive smoke, onboarding, independent passenger/driver contexts, search/booking/demand negotiation/persisted chat, simulated GPS reroute, route rendering and Journey result details. This does not establish public-staging real-provider or full trip-closure acceptance. |

## Updated deployed revisions

| Component | SHA | Deployment |
|---|---|---|
| MarshGO-Server | `de2209bc71557a14b20afac07b5067a7139b8b42` | `codex/security-parse-bearer`; migration 028 |
| MarshGO-Site | `150aa7ade03871cd12b80c6b3e205f345d37f996` | `codex/navigation-deep-link-alias`; Home navigation fix, OpenFreeMap build configuration |
| MarshGO-iOS | `b8b1fcbfe9997e1a7a27594b5759690147de75df` | Not deployed to web staging |
| Umbrella code baseline | `854c93f9440be603810844c27889a84e21a0c0f6` | `codex/marshgo-production`; report-only commits follow this product-code baseline, latest `2125eb28964d2c57a1c704257bc823711662a528` |

Staging runs isolated PostGIS/Redis/S3Mock with dev OTP, Photon geocoding, OSRM demo routing and OpenFreeMap vector tiles. These public services are staging-only and best-effort; production SMS, storage, routing and commercial providers remain disabled. Prior MapLibre/tiles acceptance artifacts: `.release/staging-map-openfreemap-desktop.png` and `.release/staging-map-openfreemap.trace.zip`. Current browser session exercised address lookup but did not render a route because staging had no matching inventory.

**Latest local production-browser rerun:** 2026-10-01, umbrella product-code baseline `854c93f9440be603810844c27889a84e21a0c0f6` (report-only commits follow); `npm run test:e2e` PASS, 6/6 (Chromium, production Vite bundle, isolated local PostGIS/Redis). Umbrella PR #1 CI for the latest metadata commit is pending at time of this update.

## Deployment

- **Provider:** Local Docker staging stack exposed over an anonymous localhost.run HTTPS reverse tunnel. No Vercel/Cloudflare/Render/Railway/Fly deployment credentials were available.
- **Reachability:** Public HTTPS URL returned the staging web app, /healthz HTTP 200, and /readyz HTTP 200 (database=connected, realtime=connected) at report time.
- **Lifetime:** Temporary URL and stack depend on the current host, Docker services and SSH tunnel session. localhost.run may rotate the hostname after a tunnel reconnect. This is not a durable hosted staging deployment.
- **Isolation:** Separate marshgo-staging PostgreSQL/PostGIS database/volume, Redis instance/volume, and private S3-compatible S3Mock bucket/volume. Staging uses dev OTP and test data. Payments and commercial providers are disabled. No production secrets or production records were used.
- **Services:** Production-built Site bundle; pinned API; PostgreSQL/PostGIS; Redis; S3Mock; Node edge/proxy; API process-hosted outbox/realtime worker. There is no separately deployed worker service in this stack.
- **Geocoding/routing/maps:** Photon search adapter; OSRM-compatible road routing; MapLibre with OpenFreeMap style/vector tiles and attribution. Photon and OSRM public demo endpoints are staging-only and have no production SLA. The exact current reconnect did not show a route because no matching inventory was available.
- **Migrations:** Fresh isolated database accepted migrations 001–028.

## Exact source revisions

| Component | SHA | Deployment |
|---|---|---|
| MarshGO-Server | `de2209bc71557a14b20afac07b5067a7139b8b42` | Deployed from `codex/security-parse-bearer` (migration 028; not yet merged to `main`) |
| MarshGO-Site | `150aa7ade03871cd12b80c6b3e205f345d37f996` | Deployed from `codex/navigation-deep-link-alias` (feature branch; main baseline remains separate) |
| MarshGO-iOS | b8b1fcbfe9997e1a7a27594b5759690147de75df | Not deployed to web staging |
| MarshGO integration baseline | cf9da4f6f4e4e0e22417da090d2bd9d8bf83cb3e | Verified integration code; current docs record the deployed standalone pair |
| Umbrella deployment/orchestration branch | 854c93f9440be603810844c27889a84e21a0c0f6 | `codex/marshgo-production`; report update is documentation-only |

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
| Prior staging refresh (2026-10-01 12:53 Europe/Kyiv) | PASS (partial) | At that time `https://6fc2e0f67fc4ad.lhr.life` returned HTTP 200 and `/readyz` reported Postgres/realtime connected. This hostname later expired; the currently active hostname is recorded below. Deployed candidate SHAs and staging migration remain unchanged. |
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
| Staging Redis restart (2026-10-01 13:11 Europe/Kyiv) | PARTIAL PASS | Restarted isolated `marshgo-staging-redis-1`; API readiness recovered with PostgreSQL and realtime connected. The staging API rate-limit counter remained present across Redis process restart because the named Redis volume persists, so a retry during the active 15-minute window remained rate-limited. No Redis data volume was deleted or reset. |

| Latest Playwright public route matrix (2026-10-01 12:58 Europe/Kyiv) | Result | Evidence |
|---|---|---|
| Direct route delivery | PASS | Chromium opened `/`, `/search`, `/journeys/search`, `/profile`, `/trips`, `/navigation`, `/notifications`, and `/admin/verification` at desktop 1440×900 and mobile 390×844. All 16 responses returned HTTP 200, correct MARSHGO title, and staging banner. This verifies SPA delivery/render shell, not route authorization or entity-level functionality. |
| Responsive landing view | PASS (visual smoke) | Screenshots `.release/staging-candidate-desktop.png` (1440×900) and `.release/staging-candidate-mobile.png` (390×844) were visually inspected. No horizontal overflow or clipped primary CTAs were visible. |
| Browser runtime/network | PASS with expected protected-session responses | Playwright recorded 0 uncaught page errors and 0 failed requests. It recorded 16 console resource errors for expected unauthenticated HTTP 401 session refreshes (one per direct route per viewport); this is not a clean-console pass. |
| Browser traces / machine-readable results | SAVED | `.release/staging-candidate-desktop.trace.zip`, `.release/staging-candidate-mobile.trace.zip`, `.release/staging-candidate-browser-matrix.json`. These traces and screenshots were captured on the immediately prior hostname with Site SHA `bc4b254b`; the later Site change only localizes API 429 copy. Traces may include staging session context; keep local/private. |
| Public readiness after browser run | PASS | The prior hostname `https://6fc2e0f67fc4ad.lhr.life/readyz` returned `ready`, `database=connected`, `realtime=connected` before it expired. The renewed current hostname is rechecked below. |
| Renewed temporary hostname (2026-10-01 13:06 Europe/Kyiv) | PASS | Previous anonymous hostname expired; the same local edge/API pair was re-exposed at `https://78ba949ed82fea.lhr.life`. Browser rendered the staging banner and welcome page; `/readyz` returned ready with DB and realtime connected. Deployed Server/Site SHAs are unchanged. |
| OTP rate-limit recovery message (2026-10-01 13:13 Europe/Kyiv) | PASS (UI copy) / OTP BLOCKED BY RATE LIMIT | After repeated acceptance requests, the API returned HTTP 429 with `rate_limit_exceeded`. The updated visible sign-in UI maps that response to Ukrainian wait-and-retry guidance. OTP could not be completed again during this window; Redis restart preserved its rate-limit key, as expected for the persistent Redis volume. |

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
- .release/staging-3b9af2b-desktop.png (previous public Site SHA 3b9af2b, Chromium, 1440×900)
- .release/staging-3b9af2b-mobile.png (previous public Site SHA 3b9af2b, Chromium, 390×844)
- .release/staging-candidate-desktop.png (prior Site SHA bc4b254, Chromium, 1440×900; visually inspected)
- .release/staging-candidate-mobile.png (prior Site SHA bc4b254, Chromium, 390×844; visually inspected)
- .release/staging-candidate-desktop.trace.zip (prior hostname, 8 direct routes at desktop viewport)
- .release/staging-candidate-mobile.trace.zip (prior hostname, 8 direct routes at mobile viewport)
- .release/staging-candidate-browser-matrix.json (prior hostname, route status, console, page-error and failed-request summary)
- Current Site SHA `26b32c9` localized 429 copy verified in the visible sign-in UI on the current hostname; a screenshot artifact of this state was not saved.
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

The local staging stack and renewed tunnel are left running. At the latest check, the current URL was `https://e134c817e388ca.lhr.life`; localhost.run can rotate the hostname after reconnect. This URL serves Site SHA `150aa7a` and Server SHA `de2209b`. Public Chromium verified OTP login, profile/session restoration after API restart, Photon address suggestions and honest zero-inventory search/planning states on the previous hostname. That hostname expired during the latest UI check and caused a 503; the new hostname passes HTTP health/readiness, but the failed UI action has not yet been retried there. Migration 028 is applied; unread/read has not passed a two-user staging acceptance. The URL remains valid only while the host processes and this machine stay available.
