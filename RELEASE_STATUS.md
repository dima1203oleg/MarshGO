# MARSHGO release status — 2026-10-01

This status records the tested candidate revisions and explicitly separates local/fixture checks from a real public production release. `DONE` means the stated software slice was verified; it does not imply the entire product is production-ready.

| Capability | Status | Evidence / remaining acceptance |
|---|---|---|
| Repository candidate CI | DONE | Server and Site candidate Verify checks pass. Umbrella current Verify is pending; its preceding tested code head passed Verify, CodeQL and Gitleaks. |
| Staging public reachability | PARTIAL | Temporary ngrok URL serves the site; `/readyz` reports PostgreSQL and Redis connected. Free tunnel has no uptime guarantee. |
| Staging geocoding and road search | PARTIAL | Photon suggestions and OSRM-backed search were exercised through Chromium. These public demo endpoints are not contracted production providers. |
| Passenger OTP/session | PARTIAL | Synthetic development OTP and protected route restore tested. No real SMS or two-account session acceptance. |
| Community offer search and booking | PARTIAL | One clearly labeled seeded `STAGING TEST` offer booked from visible UI; booking/Journey persisted across reload. This is not real driver inventory. |
| Chat persistence | PARTIAL | A UI-sent test message survived navigation/reload. Chat UI said offline; cross-account WebSocket delivery/reconnect not accepted. |
| Booking cancellation / Rescue | PARTIAL | Browser attempt timed out before observable result. Seat restoration and Rescue are not accepted on public staging. |
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
| Overall staging acceptance | PARTIAL | Public single-user search → booking → reload → chat-history slice passes. Full paired-user Golden Path is not accepted. `STAGING_READY=NO`. |
| Overall server deployment readiness | PARTIAL | Production-like deployment artifacts and local checks exist, but outstanding software/acceptance gaps remain. `READY_FOR_SERVER_DEPLOYMENT=NO`. |
| Production release | BLOCKED_EXTERNAL | Server/domain/DNS/TLS, production providers, operational verification and physical-device acceptance remain outstanding. `PRODUCTION_READY=NO`. |

Current temporary URL, exact candidate/deployed SHAs, command/test results and browser evidence are maintained in `STAGING_DEPLOYMENT_REPORT.md` and `RELEASE_MANIFEST.json`.
