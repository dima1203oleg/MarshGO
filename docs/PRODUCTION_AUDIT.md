# MARSHGO Production Audit

**Workspace snapshot:** 2026-09-30, local `main` at `1e7d0ee` (`origin/main`). The starting tree was clean. Current UI, API foundation, and docs are uncommitted and must be preserved.

## Summary

The repository started as a React/Vite PWA prototype. Its browser workflows still use seed data and `localStorage`. A new Express/PostgreSQL API foundation now supports database-backed exact-city offer lookup plus authenticated transactional booking/cancellation. The frontend is not connected to this API, session/OTP issuance is not implemented, and the service remains unavailable for a real marketplace release.

## Status by capability

| Status | Capability | Evidence / notes |
| --- | --- | --- |
| DONE | Existing responsive React UI and PWA shell | Vite entry point, manifest, install prompt, and existing views are present. Production build and typecheck pass locally. Main/search pages received a reference-aligned responsive redesign. |
| DONE | Local demo ride booking, demand, proposal, profile, and trip flows | `src/services/storage.ts` implements browser-only state transitions over seed data. These are demo flows, not shared marketplace records. |
| PARTIAL | Search and transport categories | Local seed offers and filtering exist. The new home category selection now initializes the result filter, but there are no live provider feeds or geographic matching. |
| PARTIAL | Booking safeguards | Browser safeguards are unit-tested. API booking uses row locking, fixed server-side price, per-user idempotency, and transactional cancellation. Local API integration verified last-seat contention. API-backed UI and real user sessions remain missing. |
| PARTIAL | GPS and route UI | Browser geolocation can resolve a nearby city from a fixed city list. Navigation still uses hardcoded coordinates, candidate data, distance, and ETA. |
| PARTIAL | Admin and roles | A role switch and admin view are present. The client now hides the admin screen unless `user.role === 'admin'`; this is UI gating, not authorization. Role switching still replaces the active user with seeded users. |
| PARTIAL | External partner state | Seed data labels some partner results as demo. No provider adapters or live contracts are implemented. |
| PARTIAL | API backend | Express API provides health/readiness, published-offer lookup, profile/vehicle reads, vehicle and offer creation, booking, cancellation, demand/proposal/negotiation, participant chat history, request limits, and centralized errors. User enrollment, vehicle verification, trip lifecycle, and realtime delivery remain missing. |
| PARTIAL | PostgreSQL/PostGIS persistence | Local persistent Docker services and an initial migration now exist and were applied successfully. Redis is provisioned but unused. No managed/staging database exists. |
| PARTIAL | Authentication, OTP, and server-side RBAC | API validates opaque bearer-session hashes; local-only bypass requires explicit development flags. There is no OTP delivery/session issuance or role-aware authorization matrix. |
| PARTIAL | Multi-device state synchronization | API records persist centrally, but the web client still reads/writes localStorage and has no real login/session flow. |
| PARTIAL | Reverse marketplace and negotiations | Demand/proposal/counter/accept APIs and transaction tests exist. UI is not connected, and there is no route relevance/notification flow. |
| PARTIAL | Chat delivery | Participant-scoped message history/read/send APIs persist messages. No WebSocket or push delivery; PWA still uses demo chat state. |
| MISSING | Redis, WebSockets, and push | Redis is provisioned but unused. No realtime WebSocket or push infrastructure. |
| MISSING | Routing engine and passive route matching | Navigation data and match candidates are static; no OSRM/Valhalla integration. |
| MISSING | Payment processing and production fee engine | Booking offers cash or sandbox state; no payment provider or server fee calculation exists. |
| PARTIAL | CI, E2E, security, deployment, backup, and monitoring | GitHub Actions now runs lint, typecheck, unit tests, and production build. Lint currently covers newly changed/backend code, while untouched legacy UI files have existing lint errors. API request-size cap, in-process rate limit, CORS allowlist, and security headers exist. Shared rate limiting, provider monitoring, deployment target, backup/restore, and full E2E remain absent. |
| DONE | Dependency/build setup | Vite/esbuild mismatch was repaired; Bun lockfile installation, typecheck, build, and client unit tests pass. Page-level chunking removed the previous oversized entry chunk. |
| BLOCKED | Real SMS login | Requires selecting/configuring an SMS provider and supplying account credentials. |
| BLOCKED | Production database hosting | Local Docker is available; production PostgreSQL host, credentials, backup policy, and owner are not configured. |
| BLOCKED | Public deploy | No host, domain, DNS, secrets, or staging account configured. No public deployment was attempted. |
| BLOCKED | Partner/API payments | Requires contracts, credentials, and verified provider API access. |

## Verified commands

- `npx bun@1.3.5 install --frozen-lockfile` — pass.
- `npm run typecheck` — pass.
- `npm run lint` — pass on the changed app entry points, backend, tests, and build config. It intentionally does not yet cover untouched legacy views/components, where the first repository-wide ESLint run found 204 unused-import/empty-catch issues.
- `npm run build` — pass; largest generated JS chunk is 269.24 kB minified.
- `npm test` — pass including opt-in local API/PostGIS transaction, role, publication, reverse-negotiation, and participant-chat integration tests (7 tests).
- `docker compose up -d db redis` and `npm run db:migrate` — pass locally. The official PostGIS image is amd64-only, so Compose sets `platform: linux/amd64`; ARM hosts run it under emulation.

## Production acceptance boundary

The two-phone acceptance criterion is not met end to end because the frontend still uses local storage and there is no OTP/session enrollment. The API transaction itself passed a local parallel last-seat integration test. Do not describe the app as production-ready until two independently authenticated devices complete the flow against a real staging environment and the remaining checklist passes.
