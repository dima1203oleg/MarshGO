# MARSHGO CARPOOL 5.0 — CURRENT STATE (A0 доказовий baseline)

**Дата аудиту:** 2026-11-13 · **Статус продукту:** `NOT_RELEASED`
**Підстава:** ТЗ «MARSHGO — ULTIMATE SHARED MOBILITY ECOSYSTEM 5.0», розділ XLI.2 етап A0 (read-only).
**Стандарт доказу:** `VERIFIED` = безпосередньо прочитано в коді/БД/процесах цієї сесії; `PARTIAL` = частина контракту є, частина відсутня; `MISSING` = не знайдено; `UNVERIFIED` = не перевірено runtime. Рядки `index.ts` — canonical Server working tree (`e9934ab` + dirty antigravity). Цей документ нічого не змінює в коді.

---

## 1. Git baseline (точні SHA, гілки, власність dirty)

| Репо / worktree | Гілка | HEAD | Dirty | Власність dirty |
|---|---|---|---|---|
| Root `073154/MarshGO` (цей) | `qoder/carpool-5-20261113` (створено з detached `ae5a62b`) | `ae5a62b` | 3 | **мої** Sheet 6.0 docs (`CODEX_PROGRESS.md`, `NEXT_ACTIONS.md`, `docs/MARSHGO_CANONICAL_JOURNEY_SHEET_6_ACCEPTANCE.md`) |
| Site canonical `Desktop/MarshGO/MarshGO-Site` | `antigravity/ultimate-premium-web-9` | `eda449f` | 28 | чужі (antigravity) — **не чіпати** |
| **Site served** `330dd3/MarshGO-Site` | `qoder/route-geometry-continuation-20261110` (PR #130) | `f88ba55` | 53 | **мої** Sheet 6.0 / route-geometry / premium-animation |
| Server canonical `Desktop/MarshGO/MarshGO-Server` | `antigravity/ukraine-12-transports-multimodal` | `e9934ab` | 50 | чужі (antigravity) — **не чіпати**; `server/index.ts` ТЕЖ dirty |
| Server clean `330dd3/MarshGO-Server` | `qoder/ukraine-feeds-connect-20261111` | `a490303` | 0 | чисто; **divergent** від `e9934ab` (не ancestor) |
| Server `origin/main` | — | `c7d434d` | — | merge-base з `e9934ab` = `fcdf9d8` (розійшлися) |

**Висновок бази:** LIVE API :3002 працює з canonical Server `e9934ab` + 50 dirty antigravity (включно з `index.ts`). Matching engine **закомічений** у `e9934ab` (`git show e9934ab:server/index.ts` → 5 збігів `refreshNavigationMatches|optimizeStopInsertion`). Безпечна база для моєї P0-розробки = **committed `e9934ab`**, окремий worktree + гілка `qoder/*`, власний порт. Dirty antigravity не копіюю й не перезаписую.

**53 dirty served Site (мої, підтверджено списком):** `map/{cinematicRouteEngine,routeCameraFocus,routeGeometryTokens,routeLabelPlacement,MapAdapter,MapLibreAdapter,MarshGoMap}`, `views/{JourneyActiveNavigation,JourneyRouteMapScreen,JourneyResultsPanel,ProductionMarketplace,FlightTelemetry,GlassGuidanceCallouts,JourneyLegStops,journeyStageNavigation,journeySearchRecovery}`, `map/{hyperFlightEngine,fleetMotion}`, `domain/ukraineCities`, `routing/journeySearchReturn`, `index.css`, `routeSheetDensity.css`, `map-aware-bottom-navigation.*`, 24 `tests/*`, `public/marshgo-maplibre-worker.mjs`, `CODEX_PROGRESS.md`, `NEXT_ACTIONS.md`.

---

## 2. Процеси та середовище (VERIFIED lsof/docker/curl)

| Порт | PID | Процес | Власність |
|---|---|---|---|
| 3002 | 22668 | node (tsx, без watch) — canonical Server `e9934ab`+dirty | **LIVE API antigravity — не вбивати/не перезаписувати** |
| 7777 | 4613 | Vite — served Site `330dd3` `f88ba55`+dirty | **мій dev-server, zrok дивиться сюди** |
| 5434 | 5178 | Docker `marshgo-db-1` PostgreSQL/PostGIS | спільна БД |
| 6380 | 5178 | Docker `marshgo-redis-1` Redis | спільний |
| 3013 | 5178 | Docker walk-router (Lviv) | спільний |
| 3014 | 5178 | Docker walk-router (Kyiv) | спільний |
| **3012** | — | **ВІЛЬНИЙ** | слот для мого ізольованого dev API |

- zrok `https://marshgo-dima.shares.zrok.io` → 200 (0.84s), proxy `/api` → `API_PROXY_TARGET || http://127.0.0.1:3002` (`vite.config.ts:12`, `ws:true` для `/api/v1/realtime`).
- `/readyz` → ready (database + realtime connected).
- **Стратегія інтеграції:** Site UI (P0.5) правлю в served worktree `330dd3` → власник бачить через zrok одразу. Server P0.1–P0.4 розробляю/тестую ізольовано на :3012 з committed `e9934ab`, additive migrations на спільну БД (не ламають :3002). Рішення про repoint zrok-proxy на :3012 для owner-visible server E2E — **ВІДКЛАДЕНО** (щоб не втратити dirty-делту antigravity з live-вигляду).

---

## 3. БД — carpool-таблиці (VERIFIED `docker exec marshgo-db-1 psql`)

Рядки: offers 53 · passenger_demands 6 · proposals 1 · proposal_revisions 1 · bookings 51 · navigation_sessions 76 · navigation_match_candidates **0** · users 271 · vehicles 65.

| Таблиця | Ключові колонки | Прогалина проти ТЗ |
|---|---|---|
| `offers` | id, driver_id, vehicle_id, origin/destination/route (geography), departure_at, arrival_at, **price_per_seat_minor**, currency, total_seats, **available_seats**, status, distance_m, duration_s, route_source | **нема `fare_basis`**, нема інтервальної моделі місць |
| `bookings` | id, offer_id, passenger_id, seat_count, unit_price_minor, total_price_minor, currency, status, idempotency_key, fee_class, platform_fee_minor, fee_rule_version, created/cancelled/completed_at | **нема pickup/dropoff ordinals**, нема proposal-link, нема fare_basis snapshot |
| `proposals` | id, demand_id, driver_id, **price_minor (group total)**, currency, comment, status, expires_at, vehicle_id, departure_at, revision_number, navigation_candidate_id | ціна = total, basis не зберігається окремо |
| `proposal_revisions` | proposal_id, revision_number, actor_id, actor_role, price_minor, departure_at, comment, created_at | immutable історія — OK |
| `passenger_demands` | passenger_id, origin/destination(+names), earliest/latest_departure, passenger_count, budget_minor, **budget_type**, status, notes, requirements jsonb | budget_type є (total_all\|per_seat) |
| `navigation_sessions` | driver_id, state, destination(+name), route, route_distance_m/duration_s, **route_version**, **opt_in**, current_location(+accuracy_m,+at), started/ended_at, vehicle_id, vehicle_seat_count, last_activity_at, maneuvers jsonb | — |
| `navigation_match_candidates` | navigation_session_id, demand_id, route_version, status, detour_distance_m/duration_s, pickup_eta, computed_at, expires_at, **pickup_ordinal, dropoff_ordinal** (smallint) | 0 рядків (нема активних збігів) |
| `navigation_waypoints` | id, navigation_session_id, booking_id, candidate_id, **ordinal (1–30)**, kind (pickup\|dropoff), place_name, location, **state (scheduled\|visited\|skipped)**; UNIQUE(candidate_id,kind), UNIQUE(session_id,ordinal) | event-based occupancy, не інтервальна |
| `rendezvous_sessions` | id, booking_id (UNIQUE), journey_leg_id, pickup_point, pickup_label, planned/predicted_pickup_at, **state** (SCHEDULED→ACTIVATING→ACTIVE→DRIVER/PASSENGER_APPROACHING→…WAITING→BOTH_NEARBY→BOARDING→COMPLETED/CANCELLED/EXPIRED), location_sharing_enabled, driver/passenger_location_consent_at, activation_at, driver/passenger_arrived_at, boarding_started_at | pickup фіксований = offer origin (нема negotiation точки) |

Інші наявні: rendezvous_events, booking_events, booking_change_approvals, booking_completion_confirmations, offer_changes, realtime_outbox, conversations, conversation_members, messages, user_blocks, user_notifications, audit_events, verification_records, moderation_cases, reviews, journeys, journey_legs, schema_migrations. **53 міграції** в `server/migrations/` (до `056_email_password_auth.sql`).

---

## 4. Матриця доказів можливостей

| # | Можливість | Стан | Доказ (file:line / факт) |
|---|---|---|---|
| C01 | Публікація пропозиції водія (planned) | **EXISTING** | Site `ProductionMarketplace.tsx:2336` offerFormScreen → `productionApi.createOffer:711` POST /offers; Server POST /offers `index.ts:5162` |
| C02 | Fare-basis toggle / negotiable flag у publish | **MISSING** | лише `pricePerSeatMinor`; нема total_all/negotiable опції (Site agent п.1) |
| C03 | Публікація попиту пасажира | **EXISTING** | Site `:2349` demand form, budgetType total_all\|per_seat → `createDemand:832`; Server POST /demands `index.ts:6154` |
| C04 | Торги demand-anchored (proposal→counter→agree→accept) | **EXISTING** | Site `sendProposal:1547`/counter`:1566`/agree`:1581`/accept`:1590`; Server counter`6342` agree`6393` accept`6434`; two-step guard: latest revision actor_role='driver' (`index.ts:6573`) |
| C05 | Passenger bid на published offer БЕЗ demand | **MISSING** | нема `/offers/:id/proposals` ні в Site, ні в Server; offer path = fixed-price `book` only |
| C06 | Бронювання (idempotent, atomic) | **EXISTING** | Site `book:1150` → `productionApi.book:1052`; Server POST /bookings `index.ts:5249` FOR UPDATE offer + idempotency replay |
| C07 | **Інтервальний inventory місць** | **MISSING** | scheduled: глобальний `available_seats` decrement (`index.ts:5350`); navigation: event-based `capacityAllows` (`stopOptimizer.ts:49`); нема per-segment [boarding,alighting) occupancy таблиці |
| C08 | fare_basis immutable snapshot у booking | **MISSING** | bookings нема fare_basis; total = price_per_seat × seats |
| C09 | Matching за майбутнім коридором | **EXISTING** | `refreshNavigationMatches index.ts:1320`; remaining route `ST_LineSubstring(route,ST_LineLocatePoint(route,loc),1)` `:1348`; corridor ST_DWithin, pickup ahead GPS, dropoff ahead pickup `:1361` |
| C10 | Ordered edge occurrences для loop-маршрутів | **MISSING** | bare `ST_LineLocatePoint` (`:1348`) — не відрізняє повторні проходи ребра (ТЗ VIII вимагає ordered occurrences) |
| C11 | Safe pickup / walking-access у matching | **MISSING** | geofence лише в rendezvous (`rendezvous.ts:52`); matching не перевіряє пішохідну доступність |
| C12 | Direct/partial збіг, detour limits | **EXISTING** | `optimizeStopInsertion stopOptimizer.ts:124`; brute-force pairs `:155`, haversine top-8 + road legs `:169`; detour 25km/1800s `:181` |
| C13 | Candidate TTL + route_version CAS | **EXISTING** | TTL min(latest_departure+30min, now+5min) `:1416`; FOR UPDATE route_version recheck `:1429`; GPS ≤60s else 409 location_stale `:1337` |
| C14 | **Live-driver discovery для пасажира** | **MISSING** | GET /offers `2763` + journeys/search `3051` query лише published scheduled offers (`3084`); navigation_sessions/opt_in НЕ в search; COMMUNITY legs з DB offers (`communityComposition.ts:79`) |
| C15 | Passenger discovery via demand | **PARTIAL** | GET demands/mine/navigation-matches `1694`: candidates до own open demand, driver identity лише після passenger_confirmed; **вимагає published demand** |
| C16 | GPS ingestion + validation | **EXISTING** | `index.ts:1756`: accuracy 0–100m, capturedAt [now−60s,now+15s], out-of-order 409, jump>max(250,elapsed·80+acc) 422, on_route ST_DWithin 500m, waypoint auto-visited ≤max(100,acc+40)m |
| C17 | STALE live-стан (visible freshness gate) | **PARTIAL** | нема explicit STALE; retention nulls location після 2min, ends sessions після 24h (`sessionRetention.ts:12`), timer 15s `:7083`; ТЗ PROPOSED 15–30s visible gate |
| C18 | LIVE driver toggle (opt-in) | **EXISTING** | Server PATCH matching `1518`: verified vehicle+seats, opt-out expires candidates, reroute forces opt_in=false `1633`; Site toggle в `ProductionNavigation.tsx:580` («Підбирати пасажирів», role=switch) |
| C19 | Toggle у canonical навігаторі + назва «Підбираю попутчиків» | **PARTIAL** | toggle в `ProductionNavigation.tsx`, НЕ в `JourneyActiveNavigation.tsx`; назва «Підбирати пасажирів» ≠ canonical «Підбираю попутчиків» |
| C20 | Rendezvous FSM + consent + geofence | **EXISTING (Server)** | pickup=offer origin `5568`; activation lead 15min `rendezvous.ts:59`; per-participant consent, consent-epoch `5743`; approaches driver CAR/passenger FOOT `5639`; ephemeral Redis location, geofence ≤75m `5797`; boarding requires BOTH_NEARBY `5911` |
| C21 | Rendezvous consent UI | **MISSING** | `setRendezvousConsent` (api:862) **never called**; `RendezvousLocationMap.tsx` orphaned (imported nowhere); inline panel `ProductionMarketplace.tsx:2221` без explicit consent |
| C22 | Rendezvous point negotiation (SUGGESTED→PROPOSED→ACCEPTED_BY_BOTH) | **MISSING** | pickup фіксований = offer origin; нема two-party point revision |
| C23 | Proposal expiry | **EXISTING** | TTL LEAST(now+24h, demand.latest_departure) `6316`; `expireDueProposals` SKIP LOCKED pending+open-demand (`proposals/expiry.ts:17`); timer 30s `:7117` |
| C24 | Trips tab (inbox/lifecycle) | **EXISTING** | Site tab `:82`, `tripsSections.ts:1` (active/upcoming/past bookings, requests, saved); **нема date/status filter controls** |
| C25 | MarshPass ticket + QR | **EXISTING** | Site `showBookingTicket:1226` → `bookingTicket:893` GET /bookings/:id/ticket; `MarshPassTicket.tsx:153` QR via qrcode; driver scan/manual `markBoarding:1323`; Server ticket `5962` |
| C26 | Carpool у search results | **EXISTING** | `RouteResultCard JourneyResultsPanel.tsx:55`; COMMUNITY→carpool `transportModeRegistry.ts:93`; label «Попутка» `journeyStageNavigation.ts:70`; booking CTA `JourneyRouteMapScreen.tsx:747,1026,1479` |
| C27 | Community fee 0% snapshot | **EXISTING** | `calculatePlatformFee(total,'community')` (`fees.ts`); booking fee_class=community, fee_rule_version |
| C28 | Legacy demo views (не API) | **MOCKED** | `App.tsx:34` gates DriverOfferNewView/DemandNewView/MyTripsView/OfferDetailView behind DEV-only demo; local `storage.ts`; RideshareLifecycleExperience/Simulator demo-only (`demoEntryView.tsx:2`) |
| C29 | Stationary driver workflow guard | **PARTIAL** | accept вимагає s.state='paused' (`index.ts:6434` plan query); але нема speed/foreground context перевірки (ТЗ V.1 driver safety) |
| C30 | Наскрізний 2-account E2E + concurrency | **UNVERIFIED** | integration tests є (див. §6), але повний LIVE 2-account browser E2E не підтверджений цієї сесії |

---

## 5. Gap → P0 mapping

- **P0.1 (цілісність даних):** C07 інтервальний inventory (additive migration: booking pickup/dropoff ordinals + per-segment occupancy ≤ capacity, parent FOR UPDATE, seat reuse на non-overlapping), C08 fare_basis snapshot, C02 publish fare-basis/negotiable. T21–T28,T31–T33,T45–T46. G12–G17,G20.
- **P0.2 (геопідбір):** C14 live-driver discovery (passenger search бачить opt_in navigation_sessions), C10 ordered edge occurrences, C11 safe pickup walking-access. T11–T17,T19–T20. G03–G05,G08–G11.
- **P0.3 (LIVE навігація):** C17 visible STALE gate, C19 canonical toggle «Підбираю попутчиків» у навігаторі, C29 stationary guard, C14 discoverability. T02/T04–T12/T36–T38/T50. G02,G18–G22,G26.
- **P0.4 (торги):** C05 published-offer negotiation adapter (один engine, без дубльованих таблиць), fare_basis basis у переговорах. T18–T25/T34/T35. G06–G08,G12–G14,G25.
- **P0.5 (UX):** C21 rendezvous consent UI + підключити orphaned RendezvousLocationMap, C22 point negotiation UI, C24 Trips filters, C02 publish toggle, canonical naming, empty/error/stale states, one sheet. T42–T50. G01,G23–G24,G29–G32.
- **P0.6 (hardening):** C30 2-account E2E, 100-parallel booking, security, G01–G37 matrix, exact-SHA manifest, browser QA.

---

## 6. Test inventory (Server, VERIFIED наявність файлів)

`navigation.integration.test.ts` (session lifecycle, GPS validation, matching→proposal) · `navigation-stop-optimizer.test.ts` (multi-passenger insertion/detour) · `rendezvous.test.ts` (FSM + geofence) · `api-bookings.integration.test.ts` (booking transaction/inventory concurrency) · `booking-restart.integration.test.ts` (durability) · `bookings-list-lifecycle-columns.test.ts`. **Нема** dedicated proposal-expiry unit test (лише integration). Site baseline: попередньо 769/769 @ `f88ba55`+dirty (минула сесія; потребує re-verify).

---

## 7. PR dependency map (відкриті, релевантні)

- **Site:** #130 (мій route-geometry-continuation, served base), #131 responsive-desktop-tablet, #129 bottom-sheet-density, #128 intelligent-navigation-premium, #127 mobile-touch-gestures + ланцюг #121…#20.
- **Server:** #138 ukraine-feeds-connect (`a490303`, divergent), #137/#136/#135, #76 cp6-journey-activation, #73…#43.
- **Root:** #24…#5.
- P0 carpool PR базуватиметься на committed `e9934ab` (Server) і `f88ba55`+мої dirty (Site served). Не merge-у в protected main без власника.

---

## 8. A0 завершення (VERIFIED цієї сесії)

- [x] **Served Site typecheck green:** `npm run typecheck` (`tsc --noEmit`) EXIT=0, 0 errors @ `f88ba55`+53 dirty (2026-11-13). Робоча Web/PWA-збірка підтверджена; zrok 200.
- [x] **C05 MISSING підтверджено grep:** `/offers/:id/proposals` — 0 збігів у `server/`.
- [x] **C27 EXISTING підтверджено читанням:** `fees.ts:16` `calculatePlatformFee` community 0%, `ruleVersion='community-0pct-v1'`, відхиляє non-community, валідує safe integer.
- [ ] Створити Server worktree з `e9934ab`, гілка `qoder/carpool-5-p0-20261113`, dev API :3012, `/readyz` (наступний крок → P0.1).

**A0 статус: VERIFIED (read-only baseline завершено).** Перехід до P0.1.

---

## 9. P0.1 закриття (VERIFIED 2026-11-13, Server `c78584f`, PR #139 OPEN)

Ізольований Server-worktree `…/073154/MarshGO-Server`, гілка `qoder/carpool-5-p0-20261113`, база `e9934ab`, коміт `c78584f` (6 файлів, +503/−21). Dev/test на `marshgo_e2e_carpool5` :3306; live :3002/zrok/7777 і чужі dirty не чіпалися.

| Gap | Було | Стало | Доказ |
|---|---|---|---|
| C07 інтервальний inventory | MISSING | **VERIFIED** | міграція 057 `seat_occupancy_intervals` + `seatInventory.ts` critical-points; 6 точок мутації; interval 11/11 (T26/T27/T28) |
| C08 fare_basis snapshot | MISSING | **VERIFIED** | `offers.fare_basis`+`bookings.fare_basis` (PER_SEAT/TOTAL_ALL), snapshot offer→booking; fare_basis test ✔ |
| C02 publish fare-basis | частково | **PARTIAL** | fare_basis колонка+snapshot готові; TOTAL_ALL pricing math і publish UI toggle → P0.4/P0.5 |

- **Тести:** `test:integration:interval` **11/11 PASS**; `test:integration:bookings` **20/21** (єдиний fail — передумовний `train selection leaked tram`, не інвентар). Negative control: наївний global-cache guard ламає T28+group → доведено інтервальну логіку. Міграція застосована й перевірена на реальному Postgres.
- **Typecheck:** нові файли чисті; 3 передумовні помилки `pedestrianGeometry.ts` (antigravity-owned, вже виправлено в їхньому dirty `roundedMeters`) — не чіпав.
- **Гейти:** G15 (no oversell + interval reuse), G16 (atomic booking), G17 (cancel once), G12/G14 (fare snapshot + locked fare) — **VERIFIED**. G13 (counteroffer 500→400→450) → P0.4; G20/T46 (GPS privacy) → P0.3.
- **Передумовні baseline-дефекти (не спричинені P0.1):** (1) journey-search `train selection leaked tram`; (2) `pedestrianGeometry.ts:148` shadowing `distanceMeters` (TDZ runtime + typecheck), antigravity dirty-fix наявний.
- **Наступне:** P0.2 геопросторовий підбір (C14 live-driver discovery, C10 ordered edge occurrences, C11 safe pickup walking). Статус **NOT_RELEASED**.