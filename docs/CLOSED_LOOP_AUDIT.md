# MARSHGO closed-loop audit

**Audit date:** 2026-10-01  
**Workspace:** `codex/marshgo-production`, HEAD `3f597f4`; local uncommitted work is preserved.  
**Rule:** a route or screen existing is not enough for `DONE`; the entire lifecycle including participant synchronization, failure/recovery, persistence and user-facing E2E must be verified.

## Product flow matrix

| Flow | ENTRY | API | DB | Realtime | UI | Error | Recovery | Persistence | E2E | Status / evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| OTP auth/session | PASS | PASS | PASS | N/A | PASS | PARTIAL | PASS refresh/reload | PASS | PASS | **PARTIAL** — isolated browser auth/refresh works; live SMS, device list/revoke UI and expired/revoked-session UX are not verified. |
| Profile and role | PASS | PASS | PASS | N/A | PASS | PARTIAL | PASS | PASS | PARTIAL | **PARTIAL** — single identity and role activation persist. Personal JSON export is now reachable from production profile; UI download E2E is added and pending this run. |
| Account deletion | PASS request | PASS request/status/cancel | PASS cooling-off state | N/A | PASS request/status/cancel UI | PASS duplicate/terminal errors | PASS cancel/replay | PASS | PASS browser request/cancel | **PARTIAL / BLOCKED_EXTERNAL** — a configurable 7–90 day cooling-off interval (default 30) and cancellation are persisted; purge worker, legal retention, backup-erasure and processing decisions remain blocked pending approved policy. |
| Vehicle and verification | PASS | PASS | PASS | notification/outbox | PASS | PARTIAL | PARTIAL resubmit | PASS | PARTIAL | **PARTIAL** — vehicle/document submissions and moderator decisions exist; verified private S3 lifecycle, malware scan and complete role-separated browser E2E are missing. |
| Community offer | PASS | PASS | PASS | booking events | PASS | PASS | PARTIAL cancellation/rescue | PASS | PASS | **PARTIAL** — publish/search/book path and persistence work locally; editing/cancellation policy and complete two-party closeout/review UI need broader acceptance. |
| Booking and seats | PASS | PASS | PASS transactional | PASS events | PASS | PASS conflict | PASS idempotent retry | PASS | PASS | **PARTIAL** — UI E2E covers booking and lifecycle; simultaneous last-seat race is integration covered, but not yet the requested full two-browser journey with device/restart checkpoints. |
| Boarding and completion | PASS | PASS | PASS | PASS | PASS | PARTIAL | PASS repeat-safe | PASS | PASS | **PARTIAL** — ticket/manual code, two-party completion and DB state are present; physical camera scan and full participant review acceptance remain absent. |
| Reviews | PASS after completion | PASS | PASS | PARTIAL | PARTIAL | PARTIAL | N/A | PASS | PARTIAL | **PARTIAL** — persisted review/rating backend exists; user-facing end-to-end evidence is incomplete. |
| Reverse Marketplace | PASS | PASS | PASS | PASS | PASS | PASS turn/conflict | PASS refresh/expiry | PASS | PASS | **PARTIAL** — negotiation and acceptance are exercised in browser; expired proposals now transition transactionally and notify both participants. Full downstream trip closeout still needs the complete staging golden path. |
| Chat | PASS booking | PASS | PASS | PASS/reconnect | PASS | PASS authorization | PASS REST reload/dedup | PASS | PASS | **PARTIAL** — isolated two-account message delivery and persistence tested. Per-message read receipts/unread counters and offline-send semantics are absent. |
| Block/report/moderation | PASS | PASS | PASS | report inbox | PASS | PASS authorization | PASS unblock/review | PASS | PARTIAL | **PARTIAL** — block/unblock, report submission and moderator queues exist; end-to-end authorization matrix and operational response SLA are incomplete. |
| Driver navigation | PASS | PASS | PASS | PASS | PASS | PASS GPS/off-route | PASS reroute/reload | PASS | PASS | **PARTIAL** — local browser replay covers geolocation movement, off-route detection, reroute and route replacement; real road-provider contract, full trip finish, iOS background and physical acceptance are outstanding. |
| Passive matching | PASS opt-in | PASS | PASS | PASS | PASS | PASS eligibility | PARTIAL | PASS | PASS | **PARTIAL** — two-user browser flow covers candidates, interest/confirmation and route insertion. Full independent passenger price/booking closeout and multi-passenger UI remain gaps. |
| Multi-passenger navigation | PASS | PASS | PASS optimizer | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PASS | MISSING full UI | **PARTIAL** — backend stop ordering/capacity exists; complete driver UI and golden E2E for multiple passengers are not yet evidenced. |
| Journey planner | PASS | PASS | PASS | PARTIAL | PASS | PASS partial provider failure | PARTIAL | PASS | PARTIAL | **PARTIAL** — persisted Community journeys, scoring/strategies and bounded leg composition exist; active search is not connected to real public transport or pedestrian providers. |
| WALK / GTFS / realtime transit | MISSING provider-fed entry | MISSING/fixtures | PARTIAL schema | MISSING | MISSING | PARTIAL isolated errors | MISSING | PARTIAL | MISSING | **NEEDS_REAL_PROVIDER** — no authorized walking/transit feeds or production connectors configured; no schedule or inventory is claimed live. |
| Journey monitor/replan/rescue | MISSING live monitor | MISSING | PARTIAL lifecycle | MISSING | MISSING | MISSING | MISSING | PARTIAL | MISSING | **MISSING** — active ETA cascade, transfer risk monitor and journey alternatives are not wired to a running Journey. |
| Rendezvous | PASS booking | PASS | PASS | PASS | PASS actions | PARTIAL | PASS latest location TTL | PASS state | PARTIAL | **PARTIAL** — authenticated statuses/latest-only Redis location and boarding transition exist. Map/ETA presentation, timed activation worker and full live two-browser acceptance are incomplete. |
| Notifications | PASS | PASS | PASS inbox | PASS event delivery | PASS read/read-all | PARTIAL provider errors | PASS reload | PASS | PARTIAL | **PARTIAL** — persistent in-app inbox and read state exist. Web Push/APNs are not configured. |
| Map/routing/geocoding | PASS | PASS adapters | N/A | N/A | PASS real-renderer smoke | PASS bounded errors | PARTIAL fallback honesty | N/A | PASS smoke | **PARTIAL / NEEDS_REAL_PROVIDER** — public Nominatim/OSRM/OpenFreeMap smoke succeeded once; those are not contracted production services or an SLA. |
| Payments | MISSING commercial | MISSING | community snapshot | MISSING | honest 0% Community | MISSING | MISSING | community only | MISSING | **BLOCKED_EXTERNAL** — no payment provider/webhooks/refund/settlement; online payment is not available. |
| PWA/offline | PASS shell | N/A | local safe cache | N/A | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | **PARTIAL** — navigation snapshot cache exists; production service-worker cache lifecycle/offline app-shell test is incomplete. |
| Admin/provider operations | PASS | PASS admin guards | PASS audit | PARTIAL | PARTIAL | PASS role guard | PARTIAL | PASS | PARTIAL | **PARTIAL** — verification/moderation controls exist; dedicated provider/incident operations console and full audit acceptance are absent. |
| iOS | PASS launch | PASS local origin | PASS server-owned | PARTIAL | welcome shown | N/A | MISSING background restore | PARTIAL | simulator smoke only | **NEEDS_PHYSICAL_DEVICE** — simulator build/install/launch passed, but authenticated flow, push/background/QR and two-device physical acceptance have not. |
| Production operations | N/A | health/readiness local | local migration pass | local Redis pass | N/A | local health failures | docs/runbooks only | local DB | local stack only | **BLOCKED_EXTERNAL** — hosted staging/production, TLS, secrets, real SMS/providers/S3, metrics/alerts, backup and verified restore are unavailable. |

## Locally verified before this delta

- Production check: TypeScript, configured full lint, unit suite, production build and bundle budget passed (70 pass, one opt-in skip).
- Integration: 17/17 against local PostGIS and Redis.
- Browser E2E: 6/6 in Chromium on isolated local stack; includes two accounts, booking/proposal/chat, passive match, active navigation restoration and a browser geolocation deviation/reroute sequence.
- Browser compatibility: Chromium, Firefox and WebKit across representative phone/tablet/desktop dimensions (nine engine/viewport combinations).
- Public-provider smoke: Nominatim, OSRM road route and MapLibre/OpenFreeMap assets loaded; test is compatibility evidence, not production provider qualification.
- GPS replay: four checked-in fixtures passed.
- Docker production-shaped local stack: migrations 001–026 and readiness passed.
- iOS simulator launch: passed at welcome screen only; no physical iPhone available.

## Delta implementation

- Added an authenticated production-profile action to download the current user's server-generated data export as JSON.
- Added a browser E2E assertion that initiates the export via the visible profile control, checks the downloaded filename and confirms the exported phone belongs to the signed-in passenger rather than the other account.
- Added an idempotent, bounded proposal-expiry worker. It locks due pending proposals with `SKIP LOCKED`, transitions them once, and creates a transactional `proposal.expired` outbox event addressed to both negotiation participants. The user inbox projection omits private negotiation data and the production UI renders an explicit expired state.
- The local PostGIS/API integration test expired a real negotiation proposal and verified the durable state, both outbox recipients, and the proposal response returned to the user's UI. Unit coverage verifies the privacy-safe notification projection.
- Added migration 027 for account deletion cooling-off/cancellation state, participant-authorized status/request/cancel endpoints, and a profile flow that explicitly says the request does not delete data. The browser flow verifies request → cancel and database state. The app does not claim deletion completion: actual purge and retention processing still require approved policy and an operational worker.
- No account data purge or retention behavior was invented. The current server endpoint only records a pending request. Closing that cycle requires an approved retention/cooling-off policy and a deletion worker, including treatment of contractual booking, chat, document, audit and backup records.

This audit is not a production release approval. See `FINAL_PRODUCTION_ACCEPTANCE.md` for the current gates and external blockers.
