# MARSHGO Temporary Public Staging Report

**Checked:** 2026-10-01 (Europe/Kyiv)
**STAGING_URL:** https://e8a95b9e7976f6.lhr.life
**STAGING_READY:** NO
**READY_FOR_SERVER_DEPLOYMENT:** NO
**PRODUCTION_READY:** NO

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
| MarshGO-Server | f0a6cdb2fd918733770f65f997dfea5d7c302b0c | Deployed from `codex/security-parse-bearer` (PR #2; not yet merged to `main`) |
| MarshGO-Site | 779e29e0572d290ab1111d3cb5b7ba334d4fccdc | Rebuilt from the updated `codex/navigation-deep-link-alias` PR #2 head (main baseline remains `c7f76a4…`) |
| MarshGO-iOS | b8b1fcbfe9997e1a7a27594b5759690147de75df | Not deployed to web staging |
| MarshGO integration baseline | 904874f11eee6a19b77c2356230a82ab7c45569f | Test/deployment baseline |
| Umbrella deployment/orchestration branch | 0127de32b125af0a7feb1ec85261582921cd6df3 | `codex/marshgo-production`; follow-up audit reports are being committed separately |

The locally materialized pinned Server and Site source trees contain untracked build/deployment materialization files. The staging overlay itself is under ops/staging/; no changes were made to the canonical Server or Site commits.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Public homepage / staging banner | PASS | Real browser displayed MARSHGO STAGING · TEST DATA ONLY. |
| API health/readiness | PASS | Public HTTPS /healthz and /readyz returned 200. |
| Navigation direct link | PASS | `/navigation` previously returned the app's 404; the Site PR #2 alias now opens the navigation destination form on the public staging URL. Site PR checks pass. |
| Driver navigation CTA copy | PASS | Updated production build now accurately says route matching requires driver consent and a verified vehicle; rebuilt bundle was served from staging over HTTPS. |
| Driver vehicle form and private photo upload | PASS (test fixture only) | A clearly marked staging driver created a vehicle in the UI; a synthetic PNG passed the signed private S3 upload and was recorded as the primary photo in Postgres. Vehicle verification remains pending. |
| Driver dashboard after login | PASS | Independent driver test account reached the production dashboard after OTP verification; server-backed offers, demands, vehicles and navigation-match reads returned successfully. The test vehicle is unverified, so publishing/matching acceptance remains blocked by the real verification flow. |
| Moderator authentication | PASS | Moderator test account authenticated and opened the admin verification screen through the direct URL. |
| Verification submission/review queue | PASS (decision incomplete) | Driver UI uploaded two clearly synthetic test documents to private storage and left both records pending; moderator refreshed the protected queue and saw both entries. The test documents were not approved. |
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
| Driver test profile/vehicle | PASS (staging only) | Test user enabled driver role and created a four-seat test vehicle. This vehicle is not verified and cannot establish a real driver inventory. |
| Reverse Marketplace demand | PASS (creation only) | Server-backed demand persisted. No independent driver proposal/negotiation was available to complete. |
| Full passenger booking lifecycle | BLOCKED / NOT ACCEPTED | No verified, independent driver offer in staging, so booking → boarding → completion → reviews could not be exercised through UI. |
| Passive matching / multi-passenger | BLOCKED / NOT ACCEPTED | Product UI reports matching during navigation unavailable pending verified vehicle; route-overlap end-to-end was not demonstrated. |
| Rerouting after realistic GPS replay | BLOCKED / NOT ACCEPTED | One large synthetic GPS jump was correctly rejected by anti-teleport validation. No gradual replay/off-route reroute acceptance was completed. |
| Chat / notifications / rendezvous / Rescue | BLOCKED / NOT ACCEPTED | Full paired independent-user UI lifecycle was not completed. |
| WebSocket reconnect | NOT TESTED | No accepted paired-user realtime lifecycle to drive this acceptance. |
| Firefox / WebKit over public staging | NOT TESTED | Public staging acceptance used Chromium. Existing repository browser-matrix results are separate and are not evidence for this public deployment. |
| Physical iPhone / production push / SMS | BLOCKED_EXTERNAL | Requires Apple signing/device and provider credentials. |

STAGING_READY=NO follows the acceptance definition: public reachability and foundational browser checks passed, but the main two-sided booking/navigation/realtime lifecycle did not.

## Browser errors and limitations

- An unauthenticated fresh session probes /api/v1/auth/refresh; the API returns 401 as expected, and Chromium may surface that expected probe as a failed-resource console entry. No other unexpected console/API failure was observed in the final route/map run.
- Browser console capture on the final direct-URL reload had no console errors or warnings.
- A route display screenshot shows the road polyline over real vector tiles. The current navigation UI also reports stale GPS after long acceptance delays; live movement marker and reroute behavior remain unaccepted.
- The temporary staging banner states development OTP is exposed for acceptance and real payments are disabled. Use only fake staging identities/data.

## Screenshots and traces

Local, ignored artifacts (not committed or publicly linked):

- .release/staging-desktop-home.png
- .release/staging-passenger-desktop.png
- .release/staging-passenger-mobile.png
- .release/staging-driver-dashboard.png (driver test account after visible OTP login)
- .release/staging-driver-dashboard-current.png (updated Site bundle; CTA opened navigation)
- .release/staging-map-desktop.png
- .release/staging-map-mobile.png
- .release/staging-map-openfreemap-desktop.png
- .release/staging-final.trace.zip
- .release/staging-map-openfreemap.trace.zip

Trace archives can include staging authentication/session context. Keep them private; do not upload them to public issue trackers.

## Remaining blockers

1. Keep a durable public hostname and host stack rather than an anonymous tunnel.
2. Complete paired Passenger/Driver UI acceptance for offer verification, booking, chat, notification, rendezvous, boarding, trip completion and reviews.
3. Complete gradual controlled GPS replay, off-route rerouting and passive matching/multi-passenger acceptance.
4. Exercise cancellation/Rescue and WebSocket reconnect/restart durability across independent users.
5. Replace S3Mock and public test geocoder/routing/map endpoints with configured production-grade services for production.
6. Real SMS, domain/TLS, production server, push, payments/commercial partners and physical iPhone acceptance remain external release gates.

The local staging stack and a renewed tunnel are left running. The current URL is `https://e8a95b9e7976f6.lhr.life`; localhost.run may rotate it when the tunnel reconnects. The replacement URL was checked over HTTPS after renewal, returned the staging app in a visible browser, and both health/readiness returned 200. The URL remains valid only while those processes and this host stay available.
