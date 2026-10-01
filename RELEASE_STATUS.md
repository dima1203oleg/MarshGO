# MARSHGO release status — 2026-10-01

This status records the tested candidate revisions and explicitly separates local/fixture checks from a real public production release. `DONE` means the stated software slice was verified; it does not imply the entire product is production-ready.

## Latest delta — Journey Rescue closure

Canonical Server `699b1fa7e007f5f8b56e597922523cf4659dd942` now attaches an eligible replacement booking to its cancelled Journey leg inside the booking transaction: the cancelled leg is retained as `REPLACED`, a confirmed replacement leg is inserted in order, Journey totals/state are restored, and idempotent retries resolve to the replacement. Concurrent replacement attempts are covered; exactly one succeeds. Canonical Site `573ebca115f50c1762be4d0d26e9759b195d2fa2` refreshes Journey state after cancellation and preserves the original leg association through offer deep links. Server integration, full Chromium golden E2E, responsive browser matrix, local production check, and updated Server/Site PR verification pass. The public tunnel runs these exact candidates and `/readyz` returns 200; public UI currently reports its staging rate limit, so this delta is accepted locally, not as paired public acceptance.

| Capability | Status | Evidence / remaining acceptance |
|---|---|---|
| Repository candidate CI | DONE | Server `699b1fa…` and Site `573ebca…` PR Verify checks pass. Umbrella Verify remains pending for the changed pinned-Server browser harness; previous security gates passed. |
| Staging public reachability | PARTIAL | Temporary ngrok URL serves Server `699b1fa…` and Site `573ebca…`; `/readyz` confirms service, PostgreSQL and Redis connected. Public UI currently reports the staging rate limit. Free tunnel has no uptime guarantee. |
| Staging geocoding and road search | PARTIAL | Photon suggestions and OSRM-backed search were exercised through Chromium. These public demo endpoints are not contracted production providers. |
| Passenger OTP/session | PARTIAL | Synthetic development OTP and protected route restore tested. No real SMS or two-account session acceptance. |
| Community offer search and booking | PARTIAL | One clearly labeled seeded `STAGING TEST` offer booked from visible UI; booking/Journey persisted across reload. This is not real driver inventory. |
| Chat persistence | PARTIAL | A UI-sent test message survived navigation/reload. Chat UI said offline; cross-account WebSocket delivery/reconnect not accepted. |
| Booking cancellation / Rescue | PARTIAL | Local production-bundle Chromium E2E now covers Journey booking → cancellation → Rescue corridor alternative → replacement booking; it verifies one winning booking, replacement-leg persistence and Journey READY. Server PostGIS integration races two requests and verifies one winner and idempotent replay. Public paired-device/role acceptance is still incomplete; staging UI is rate-limited. |
| Rendezvous / boarding / trip completion | PARTIAL | Scheduled pickup screen opened. Live two-party positions, arrival, boarding and two-party completion not accepted publicly. |
| Passive matching / multi-passenger | PARTIAL | Candidate code and isolated tests exist; public paired-account route matching and multi-passenger acceptance remain incomplete. |
| Journey monitoring / multimodal providers | BLOCKED_EXTERNAL | Public transport/taxi/rail providers are unavailable; absent providers must not be presented as live. Journey replan acceptance remains incomplete. |
| Web Push / APNs | BLOCKED_EXTERNAL | Provider credentials and paired delivery acceptance are absent. |
| Payment processing | BLOCKED_EXTERNAL | No merchant account/provider credentials; real payments disabled. |
| Production hosting / domain / TLS | BLOCKED_EXTERNAL | Requires owner server, domain and DNS. The current URL is a temporary tunnel, not deployment infrastructure. |
| Private production object storage | BLOCKED_EXTERNAL | Local S3-compatible test service is not production storage. |
| iOS Simulator | PARTIAL | Pinned candidate Debug build/install/launch and onboarding render passed; no authenticated full flow. |
| Physical iPhone / TestFlight | BLOCKED_EXTERNAL | Requires Apple signing/App Store access and a physical device. |
| Backup / restore and failure drills | PARTIAL | Local disposable backup/restore and selected Redis/Postgres drills passed; no off-host production restore evidence. |
| Overall staging acceptance | PARTIAL | Temporary endpoint is reachable and exact candidate SHAs are deployed. Local production-bundle E2E is 6/6 against immutable canonical Server/Site; responsive Chromium/Firefox/WebKit smoke is 3/3. Public full paired-user Golden Path is not accepted. `STAGING_READY=NO`. |
| Overall server deployment readiness | PARTIAL | Production-like deployment artifacts and local checks exist, but outstanding software/acceptance gaps remain. `READY_FOR_SERVER_DEPLOYMENT=NO`. |
| Production release | BLOCKED_EXTERNAL | Server/domain/DNS/TLS, production providers, operational verification and physical-device acceptance remain outstanding. `PRODUCTION_READY=NO`. |

Current temporary URL, exact candidate/deployed SHAs, command/test results and browser evidence are maintained in `STAGING_DEPLOYMENT_REPORT.md` and `RELEASE_MANIFEST.json`.
