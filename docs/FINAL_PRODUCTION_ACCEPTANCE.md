# MARSHGO final production acceptance

**As of:** 2026-10-01  
**Disposition: NOT RELEASED.** Local implementation and isolated test environments are not hosted production. This report distinguishes verified local behavior from external release gates.

| Product area | Result | Evidence / remaining acceptance |
|---|---|---|
| Auth/session | PARTIAL | Local OTP/refresh/reload coverage. Real SMS and active device/session management are not verified. |
| Profile/data export | PASS locally | Production profile downloads an authenticated JSON export. Browser E2E checks filename, signed-in account identity and absence of the other test user's phone. |
| Account deletion | PARTIAL / BLOCKED_EXTERNAL | Migration 027, request/status/cancel APIs and profile request/cancel flow are implemented and browser-tested. The flow says plainly that it does not delete data. Purge worker and retention rules require approved policy for bookings, messages, evidence, audit and backups. |
| Vehicles/verification | PARTIAL | API/UI/moderator review exist. Private production object storage, malware scanning and hosted evidence lifecycle are not configured. |
| Community offers/bookings | PARTIAL | Local API/DB/browser coverage exists. Full release acceptance across real users, restart and all cancellation/refund policies remains incomplete. |
| Reverse Marketplace | PARTIAL; proposal expiry PASS locally | Browser tests exercise negotiation and acceptance. A real-DB integration check verifies expiry state and transactional event delivery to both participants. Full follow-through into active trip still needs hosted golden-path coverage. |
| Chat/realtime | PARTIAL | Persisted message and two-account realtime/reload tests pass locally. Read receipts/unread counts and hosted WebSocket resilience remain incomplete. |
| Navigation/passive matching | PARTIAL | Browser GPS replay, off-route, reroute and matching route insertion pass in isolated local stack. Physical navigation, full pickup-to-arrival route and background iOS GPS are not verified. |
| Multi-passenger | PARTIAL | Server optimizer/capacity foundation exists; full visible UI and golden E2E are missing. |
| Journey / WALK / public transit | PARTIAL / NEEDS_REAL_PROVIDER | Community planning foundation exists. No authorized walking, GTFS/GTFS-RT, rail, bus or taxi inventory is configured. |
| Journey Monitor / Rescue | FAIL (not implemented) | No active transfer-risk monitor and predictive multimodal replan loop. |
| Rendezvous | PARTIAL | Participant-scoped Redis latest location and status/boarding APIs/UI exist; live map, ETA, activation worker and full two-browser lifecycle remain unverified. |
| Notifications | PARTIAL | Persistent inbox/read state is local-tested. Web Push/APNs are not configured. |
| Map/geocoder/routing | PASS as one-time compatibility smoke; production gate BLOCKED_EXTERNAL | Public Nominatim, OSRM and OpenFreeMap worked in smoke checks. Production contract, keys/hosting, SLA and versioned MARSHGO map assets are absent. |
| Payments | BLOCKED_EXTERNAL | Community direct payment remains 0% platform fee. No commercial PaymentProvider, webhook, refund or settlement is configured. |
| Admin/moderation | PARTIAL | API role guards and local UI flows exist. Full security matrix, operating SLA and hosted audit evidence are incomplete. |
| Web/browser | PASS for tested local matrix, not universal | Chromium E2E and Chromium/Firefox/WebKit responsive compatibility passed representative viewports. Not every browser version, OS or physical device is covered. |
| iOS | PASS simulator launch only | Simulator build/install/launch passed at welcome screen. Authenticated end-to-end flow, TestFlight signing, APNs, background location and physical acceptance remain unverified. |
| Infrastructure/security/backup | BLOCKED_EXTERNAL | Local Docker bootstrap and health/readiness passed. No hosted HTTPS staging, managed services, monitoring/alerts, production security scan result, backup restore drill or rollback execution. |

## Production gates

| Gate | Result |
|---|---|
| Clean local DB migration through current schema | PASS locally (migrations 001–027) |
| Typecheck/lint/unit/build/bundle check | PASS locally (71 pass, 1 opt-in skip) |
| PostGIS/Redis integration suite | PASS 17/17 after migration 027 |
| Browser E2E | PASS 6/6; includes JSON download, deletion request → cancel → reload persistence, marketplace, matching, GPS deviation/reroute and responsive routes |
| Browser compatibility | PASS 3 engines × phone/tablet/desktop representative sizes |
| Live contracted map/routing/geocoding | BLOCKED_EXTERNAL |
| Real SMS | BLOCKED_EXTERNAL |
| Private S3 and malware scanning | BLOCKED_EXTERNAL |
| Staging HTTPS / hosted production | BLOCKED_EXTERNAL |
| Backup restore drill / monitoring | BLOCKED_EXTERNAL |
| Physical two-iPhone acceptance | BLOCKED_EXTERNAL |
| Full closed-loop multimodal golden path | FAIL / MISSING |

## Inputs needed for a real production release

- Staging/production host, domain, TLS and secret-management access.
- Real SMS credentials and sender registration.
- Contracted routing/geocoding/map-data provider or MARSHGO-hosted immutable style/tile manifests.
- Private S3-compatible bucket, encryption/lifecycle/access logging and malware-scan service.
- Managed Postgres/PostGIS and Redis, backup/PITR retention, monitoring/error-tracking endpoints, and authorization to perform a restore drill.
- GTFS/GTFS-Realtime feed URLs and permission to use them; optional taxi/rail/payment providers if those commercial journeys are to be released.
- Apple signing/TestFlight/APNs credentials and two physical iPhones for driver/passenger acceptance.
- Approved account-deletion, booking/chat/document/audit retention and backup-erasure policy.

Do not use the term **production-ready** until these applicable gates are completed and recorded with environment-specific evidence.
