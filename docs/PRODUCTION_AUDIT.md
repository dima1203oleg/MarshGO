# MARSHGO Production Audit

**Workspace snapshot:** 2026-09-30, initial local `main` at `1e7d0ee` (`origin/main`) was clean. Current work is on `codex/marshgo-production`; initial foundation is committed as `34c8899`, with current auth implementation in the working tree. The requested `MARSHGO_PRODUCTION_TZ_FOR_CODEX.md` file was not present at repository root; the user pasted its full replacement specification in the request.

## Summary

The repository started as a React/Vite PWA prototype. A production build now uses an Express/PostgreSQL API for phone enrollment, offer search, booking, and booking history; the legacy demo remains in development builds. The API also has locally tested vehicle, demand/proposal, persistent message, routing-adapter, booking lifecycle, and review slices, but most are not connected to production UI. An iOS Capacitor target builds and launches in CoreSimulator. Production SMS, routing, photo storage, hosting, staging, complete driver/passenger UI, interactive device acceptance, and release operations remain incomplete.

## Status by capability

| Status | Capability | Evidence / notes |
| --- | --- | --- |
| DONE | Existing responsive React UI and PWA shell | Vite entry point, manifest, install prompt, and existing views are present. Production build and typecheck pass locally. Main/search pages received a reference-aligned responsive redesign. |
| DONE | Local demo ride booking, demand, proposal, profile, and trip flows | `src/services/storage.ts` implements browser-only state transitions over seed data. These are demo flows, not shared marketplace records. |
| PARTIAL | Search and transport categories | Production PWA searches server inventory by exact city names, Europe/Kyiv date, and seat count. There are no geocoded corridor filters, multi-stop matching, or live external-provider feeds. |
| PARTIAL | Booking safeguards | API booking uses row locking, fixed server-side price, per-user idempotency, transactional cancellation, HMAC tickets, boarding/start states, two-party completion, and post-completion reviews. Local API integration verified these core transitions and last-seat contention. API-backed driver lifecycle UI and staging/two-device test remain missing. |
| PARTIAL | GPS and route UI | Production UI has no navigation control. The development demo's GPS route, candidate, distance, and ETA are simulated; no production GPS sharing or passive matching engine exists. |
| PARTIAL | Admin and roles | Backend persists passenger/driver role grants and checks those roles on protected routes. The legacy development UI still has demo identities and role switching; no protected admin API/panel or production role controls are complete. |
| PARTIAL | External partner state | Seed data labels some partner results as demo. No provider adapters or live contracts are implemented. |
| PARTIAL | API backend | Express API provides health/readiness, OTP enrollment/session lifecycle, profile/role APIs, vehicle create/edit/activate/archive and signed photo upload/list/delete, routing endpoint, road-route-backed production offer creation, booking, cancellation, demand/proposal/negotiation, participant chat history, booking lifecycle/ticket/reviews, request limits, and centralized errors. Bucket configuration, vehicle verification review, lifecycle UI, and realtime delivery remain missing. |
| PARTIAL | PostgreSQL/PostGIS persistence | Local persistent Docker services and an initial migration now exist and were applied successfully. Redis is provisioned but unused. No managed/staging database exists. |
| PARTIAL | Authentication, OTP, and server-side RBAC | Development OTP is no-network and production OTP has a Twilio adapter; access sessions, refresh rotation/revocation, logout, profile API, passenger/driver role checks, and phone/IP request limits exist. Real SMS provider credentials, broader RBAC administration, UI integration, and security review remain. |
| PARTIAL | Multi-device state synchronization | Production PWA now signs in through the API and uses server search, booking, and booking-history routes. The broader legacy demo screens still use localStorage in development; driver publishing, negotiation, messaging, and navigation have not been integrated in production UI. |
| PARTIAL | Native iOS app | Capacitor/Xcode target builds and launches on iOS 27 CoreSimulator and displays the API-backed sign-in screen. Interactive sign-in, session renewal, App Store signing, and physical-device behavior remain unverified. |
| PARTIAL | Reverse marketplace and negotiations | Demand/proposal/counter/accept APIs and transaction tests exist. UI is not connected, and there is no route relevance/notification flow. |
| PARTIAL | Chat delivery | Participant-scoped message history/read/send APIs persist messages. No WebSocket or push delivery; PWA still uses demo chat state. |
| PARTIAL | Reviews | Server accepts one review per participant only after both trip completion confirmations and returns persisted driver rating aggregates. Production review UI, moderation, and abuse controls are missing. |
| MISSING | Redis, WebSockets, and push | Redis is provisioned but unused. No realtime WebSocket or push infrastructure. |
| PARTIAL | Routing engine integration | An OSRM-compatible adapter validates road geometry, distance, and duration; production offer creation fails closed without `ROUTING_ENGINE_URL`. No real routing service is configured, and navigation rerouting/GPS/passive route matching are missing. |
| MISSING | Payment processing and production fee engine | Booking offers cash or sandbox state; no payment provider or server fee calculation exists. |
| PARTIAL | CI, E2E, security, deployment, backup, and monitoring | GitHub Actions runs under Node 24.21.0 LTS and runs lint, typecheck, unit tests, and production build. Lint covers backend, tests, and touched UI entry points; untouched legacy UI files still contain existing lint issues. API request-size cap, in-process rate limit, CORS allowlist, and security headers exist. Shared rate limiting, provider monitoring, deployment target, backup/restore, and full browser E2E remain absent. |
| DONE | Dependency/build setup | Vite/esbuild mismatch was repaired; Bun lockfile installation, typecheck, build, and client unit tests pass. Page-level chunking removed the previous oversized entry chunk. |
| DONE | Runtime pin | `.nvmrc`, `package.json` engines, and CI pin Node.js 24.21.0 LTS. Build and tests were run under that runtime. |
| BLOCKED | Real SMS login | Requires selecting/configuring an SMS provider and supplying account credentials. |
| BLOCKED | Production database hosting | Local Docker is available; production PostgreSQL host, credentials, backup policy, and owner are not configured. |
| BLOCKED | Public deploy | No host, domain, DNS, secrets, or staging account configured. No public deployment was attempted. |
| BLOCKED | Partner/API payments | Requires contracts, credentials, and verified provider API access. |

## Verified commands

- `npx bun@1.3.5 install --frozen-lockfile` — pass.
- `npm run typecheck` — pass.
- `npm run lint` — pass on the changed app entry points, backend, tests, and build config. It intentionally does not yet cover untouched legacy views/components, where the first repository-wide ESLint run found 204 unused-import/empty-catch issues.
- `npm run build` — pass; latest simulator/PWA bundle built successfully.
- Local PostGIS API/unit run `node node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` with loopback API/database variables — pass (11/11), including OTP enrollment, refresh rotation, booking contention/cancellation, negotiation, chat privacy, routing contracts, and booking lifecycle/reviews.
- `npm run ios:simulator` — pass: Xcode built, installed, and launched `ua.marshgo.app` on iPhone 18 Pro / iOS 27 CoreSimulator; screenshot showed production phone sign-in. Graphical tap automation is unavailable in this environment.
- `DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo npm run db:migrate` — applied `003_identity_auth.sql` successfully.
- `DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo npm run db:migrate` — applied `004_vehicle_garage.sql` successfully.
- `DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo npm run db:migrate` — applied `005_offer_routes.sql` successfully.
- `DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo npm run db:migrate` — applied `006_vehicle_photo_primary.sql` and `007_booking_lifecycle_reviews.sql` successfully.
- `docker compose up -d db redis` and `npm run db:migrate` — pass locally. The official PostGIS image is amd64-only, so Compose sets `platform: linux/amd64`; ARM hosts run it under emulation.

## Production acceptance boundary

The two-phone acceptance criterion is not met end to end: real SMS is unconfigured, staging is absent, the production PWA has only search/booking/passenger history, and no two physical devices were tested. The API transaction itself passed a local parallel last-seat integration test. Do not describe the app as production-ready until two independently authenticated devices complete the full flow against staging and the remaining checklist passes.

## Delta audit: baseline findings B01–B22

| ID | Status | Current finding |
| --- | --- | --- |
| B01 | PARTIAL | Auth, offers, bookings, demands, proposals, and messages persist in PostgreSQL APIs; development screens still use localStorage. |
| B02 | PARTIAL | Production user identity is server-issued and stable; dev role switch still swaps seeded demo profiles. Production role-switch UI is not implemented. |
| B03 | DONE | Removed hardcoded selected offer/demand IDs and fallback-to-first-record behavior; default date now uses Europe/Kyiv today; missing records show an explicit not-found state. |
| B04 | PARTIAL | API conversations are created per booking with authorized participants; legacy demo still has fixed conversation assumptions, and production PWA chat is absent. |
| B05 | PARTIAL | API uses transactional row lock, seat check/decrement, unique idempotency, and concurrent integration coverage; no staging/two-device confirmation yet. |
| B06 | PARTIAL | Proposal acceptance and booking conversion are transactional; auth-bound owner checks exist. Production negotiation UI, vehicle-private details, and full proposal mutual-agreement flow are incomplete. |
| B07 | DONE | API cancellation is state-checked and restores capacity only on the first cancellation; repeated cancel was integration-tested. |
| B08 | MISSING | Navigation session/GPS and match candidates are not API-backed; no hardcoded production navigation is exposed because production route currently omits that screen. |
| B09 | MISSING | Legacy map still has simulated path/progress; a real location stream and live map are not implemented. |
| B10 | MISSING | No production GPS navigation screen exists; development demo still contains simulated navigation labels/data. |
| B11 | PARTIAL | Production API filters exact city, date, and seats; geographic corridor, stops, time window, and route feasibility are missing. |
| B12 | PARTIAL | Production publishing now requires routing and computes ETA when a provider exists; routing provider is not configured, and dev demo still has heuristic time behavior. |
| B13 | PARTIAL | Server vehicle ownership and active selection are implemented; production garage UI, verified photos, and document workflow are absent. |
| B14 | PARTIAL | Production bundle no longer enters the local demo toggle; the demo/live switch still exists in development and is not a server environment control. |
| B15 | MISSING | UI hides admin access in some paths, but protected admin APIs, staff provisioning, and moderation workflow are absent. |
| B16 | PARTIAL | Production PWA does not offer sandbox payment; legacy development screens still contain sandbox payment state. No online payment or fee ledger exists. |
| B17 | MISSING | No authorized partner APIs or external supply; demo provider records remain development-only. |
| B18 | PARTIAL | Manifest/install flow exists; full service worker offline shell and push backend are not implemented. |
| B19 | PARTIAL | Node 24 LTS pin, lint/typecheck/unit/integration/build checks and CI exist; full E2E, security, migration rollback, and load suites are absent. |
| B20 | DONE | Reset no longer calls global `localStorage.clear()`; development reset removes only `mg_` keys. Account deletion remains a pending server request without a deletion worker. |
| B21 | PARTIAL | Server now has signed boarding, trip start, two-party completion, immutable event history, and one review per user only after completion; production UI/moderation remain absent. |
| B22 | MISSING | Blacklist remains browser-local/demo data; server user-ID blocks and authorization checks are not implemented. |
