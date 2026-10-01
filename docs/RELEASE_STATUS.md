# MARSHGO release status — 2026-10-01

`READY_FOR_SERVER_DEPLOYMENT=NO` · `PRODUCTION_READY=NO`

Capability states use only `DONE`, `PARTIAL`, `BLOCKED_EXTERNAL`, or `FAILED`. A local fixture/simulator pass does not qualify a real provider or production integration as DONE.

| Capability | Status | Evidence / remaining boundary |
|---|---|---|
| Canonical repository reconciliation | PARTIAL | Server, Site and iOS `main` commits are pushed and CI passed. Umbrella reconciliation/release metadata is pushed on `codex/marshgo-production`. Open PRs remain active because their residual diffs were not wholesale merged. |
| API/auth/session/database | PARTIAL | Real server/PostGIS/Redis logic and integration suite pass. Real SMS, complete account-deletion processing, security acceptance and hosted restart recovery remain open. |
| Community offer/booking/capacity/chat/realtime | PARTIAL | API/browser slices pass including 20-account last-seat contention. Full verified-driver→pickup→boarding→completion→both reviews UI lifecycle is not E2E-accepted. |
| Reverse Marketplace | PARTIAL | Server negotiation and atomic booking paths exist and web tests cover proposal negotiation; full post-accept booking/trip closeout is not release-accepted. |
| Navigation/off-route/reroute | PARTIAL | Browser GPS deviation triggers server reroute in E2E; self-hosted/contracted routing and physical/background iOS driving are not verified. |
| Passive matching/multi-passenger | PARTIAL | Opt-in candidate and stop-optimizer foundations exist. The complete no-offer multi-passenger production user flow is not verified. |
| Rendezvous | PARTIAL | Participant authorization, ephemeral location, domain status and UI controls exist; tested integration passes. Live rendezvous map/ETA and full paired-device flow are incomplete. |
| Multimodal Journey / WALK / GTFS | PARTIAL | Planner/scoring/transfer feasibility exist. No real transit inventory, pedestrian router, GTFS/GTFS-RT or live schedule feed is connected. |
| Journey monitor / replan / rescue | FAILED | Active server monitor, ETA cascade, predictive replan and replacement-journey workflow are not implemented end to end. |
| Web/PWA | PARTIAL | Production build, Chromium E2E and Chromium/Firefox/WebKit runs across six viewport widths pass. Production screenshot parity with supplied references, complete SW/offline semantics, and full URL/auth coverage remain open. |
| iOS | PARTIAL | Simulator build, rendered onboarding screenshot and CI pass. No signed TestFlight, APNs, physical phone, background GPS, native QR or full authenticated acceptance. |
| Object storage | PARTIAL | S3 SDK adapter tests and local Adobe S3Mock upload/head/download pass. Production private bucket, encryption policy, retention, audit logs and malware scanning are not proven. |
| Payments/commercial providers | BLOCKED_EXTERNAL | No merchant or transport partner credentials/contracts; commercial API integrations are incomplete and must stay disabled. |
| Deployment automation | PARTIAL | Production Compose/Caddy/config/bootstrap/update/backup/restore scripts exist; config and syntax validate, canonical pinned Server/Site source materializes and both images build, and bootstrap rejects example values. Full-stack local rehearsal, monitoring and staging recovery remain incomplete. |
| Backup / restore | PARTIAL | AES-GCM/tamper checks and disposable PostGIS restore drill pass. No scheduled/off-host production backups, RPO/RTO or staging restore proof. |
| Security pipeline | PARTIAL | Runtime validation, headers/rate limits and dependency checks exist; complete SAST/secrets/container scans and staging authorization/upload abuse acceptance are outstanding. |
| Monitoring / operations | FAILED | No production metrics, alerting, error tracking, incident rota or verified recovery objectives. |
| Hosted staging / production | PARTIAL | A public temporary localhost.run HTTPS staging tunnel is reachable and local isolated services are healthy; it is ephemeral and paired-user golden-path E2E is incomplete. Production remains blocked on server/domain/TLS/secrets/providers. See STAGING_DEPLOYMENT_REPORT.md. |

Exact repository refs: [root RELEASE_MANIFEST.json](../RELEASE_MANIFEST.json). External inputs: [OWNER_ACTIONS_REQUIRED.md](../OWNER_ACTIONS_REQUIRED.md). Deployment decision: [READY_FOR_SERVER_DEPLOYMENT.md](../READY_FOR_SERVER_DEPLOYMENT.md).


## Temporary public staging (2026-10-01)

- Public temporary HTTPS URL: https://e212f8eb21d418.lhr.life (ephemeral localhost.run tunnel).
- Health/readiness and Chromium smoke checks passed; demand creation persisted across API restart and staging-only Redis stop/start recovery. Separate staging driver and moderator test identities completed the visible OTP login; driver dashboard reads, test-vehicle creation, and private test-photo upload passed. The synthetic test vehicle remains unverified. `/navigation` deep link was corrected in Site PR #2 and now opens the navigation screen.
- Full paired-user booking, matching, rendezvous, chat, Rescue and browser realtime flows did not pass acceptance. Therefore STAGING_READY=NO, READY_FOR_SERVER_DEPLOYMENT=NO, and PRODUCTION_READY=NO.
- URL is anonymous localhost.run forwarding to the current local host and may rotate/expire. Details and evidence: STAGING_DEPLOYMENT_REPORT.md.
