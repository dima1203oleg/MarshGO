# MARSHGO — аналіз готовності перед інтеграцією дизайну та production

Дата: 30.09.2026. Це результат аналізу коду, а не підтвердження production acceptance.
Пов’язаний план: [PRODUCTION_INTEGRATION_PLAN.md](PRODUCTION_INTEGRATION_PLAN.md).
Дизайн: [DESIGN_INTEGRATION_MATRIX.md](DESIGN_INTEGRATION_MATRIX.md).

## 1. Що перевірено

Переглянуто поточні робочі дерева umbrella, Server, Site та iOS; після `git fetch origin` звірено їх із `origin/main`. Перевірено міграції 001–023, маршрути API, auth/session client, booking/cancel/lifecycle, Journey search/planner/scoring/transfer engine, stop optimizer, GPS ingestion/expiry, Rendezvous, outbox/inbox, production UI, PWA-файли, конфігурацію iOS/CI, наявні тести та звіти. Зіставлено надані вісім дизайн-плакатів із кодом і попередніми локальними знімками Home, Offer Detail і Navigation.

Це статичний аналіз з поточною локальною перевіркою типів, lint, unit suite та збірки. Інтеграційні, browser E2E, simulator і physical-device тести в цьому проході не перезапускалися. Попередні звіти про них є історичними доказами для відповідних commits, а не доказом для незакоміченого Foundation.

Файл `MARSHGO_PRODUCTION_TZ_FOR_CODEX.md` у поточному дереві не знайдено. Вимоги взято з повідомлень власника, фінального Foundation v1.0 та наявних docs. Перевірка не включає аудит production інфраструктури: ціль deployment у репозиторії не налаштована.

## 2. Стан репозиторіїв

| Репозиторій | Поточний HEAD | origin/main після fetch | Висновок |
|---|---|---|---|
| MarshGO umbrella | `3f597f4`, `codex/marshgo-production` | `1e7d0ee` | Гілка на 77 commits попереду main; є незакомічений Foundation |
| MarshGO-Server | `f788a96`, `codex/rendezvous-live-pickup` | `ef9d105` | 4 commits попереду main; робоче дерево чисте |
| MarshGO-Site | `045f138`, `codex/rendezvous-live-pickup` | `ed602ac` | 4 commits попереду main; робоче дерево чисте |
| MarshGO-iOS | `328d9af`, `codex/simulator-smoke-capture` | `647ffbb` | 1 commit попереду main; робоче дерево чисте |

Це важлива release-залежність: нові Rendezvous/planner/дизайн зміни ще не всі на main. iOS CI завантажує default branch Site без фіксації SHA; збірки можуть використовувати інший UI, ніж той, який перевірявся локально. Перед релізом потрібні reviewed PR, release manifest із точними SHA та pinned Site dependency.

Незакомічений Foundation попереднього проходу: `package.json`, `bun.lock`, `server/routing.ts`, `server/routing/providers/*`, `server/domain/*`, `server/traffic/*`, `shared/navigation/*`, `src/domain/*`. Установлені maplibre-gl, pmtiles, zod. Створені контракти/geometry codec та OSRM wrapper. Каталоги `src/navigation`, `src/platform`, `src/map` ще не мають реалізацій. Це початий Phase 1/2, не виконаний Foundation. У поточному проході цей код не змінювався.

## 3. Реально наявна база

| Домен | Доказ у коді | Стан |
|---|---|---|
| Auth/roles | `server/index.ts`, `server/config.ts`, `server/sms.ts` | OTP, refresh rotation, roles, fail-closed production startup; реальна доставка й iOS session persistence потребують приймання |
| Garage/verification | міграції 004/006/009, `server/objectStorage.ts`, vehicle/admin endpoints | Owner CRUD, upload/finalize/signed read, review; потрібні private storage, scanner, lifecycle і staff operations |
| Offers/bookings | API + `tests/api-bookings.integration.test.ts` | Географія, гроші в minor units, атомарні місця/idempotency, cancellation, boarding/start/completion/reviews |
| Reverse Marketplace | proposals/revisions/agree/accept API | Взаємна згода та транзакційне бронювання; перевірки revisions/retries треба зберегти при рефакторингу |
| Realtime/chat | outbox у `server/index.ts`, Redis, `server/notifications.ts` | Durable chat, cross-instance fan-out, inbox; немає frozen event envelope і push |
| Navigation/matching | міграції 010–012, 016–018, 022; `stopOptimizer.ts` | Реальні вхідні GPS, приватна сесія, opt-in, взаємний match, road detour, кілька booked stops |
| Journey | міграція 020, `server/journey/*` | Схема/scoring/transfer engine та lifecycle для одного Community booking; multi-leg алгоритм не підключений до search API |
| Rendezvous | міграція 023, `server/rendezvous.ts`, API | Participant access, ручні статуси, Redis latest location, geofence; live map/ETA/автоматичний monitor відсутні |
| Web/iOS UI | `ProductionMarketplace.tsx`, `ProductionNavigation.tsx`, iOS wrapper | Спільний React UI, брендовані екрани, API integration; дизайн лише частково відповідає фінальним референсам |
| Delivery | `.github/workflows/ci.yml`, iOS workflow | Є checks і simulator compilation; немає production deployment/restore/TestFlight acceptance |

## 4. Прогалини та дефекти, що визначають план

Позначення: **підтверджено** — безпосередньо видно в реалізації/відтворено; **ризик** — потрібний окремий regression test або runtime acceptance.

| ID / пріоритет | Знахідка і доказ | Необхідна дія / приймання |
|---|---|---|
| R01 / P0 | **Підтверджено:** main відстає; iOS бере неприкріплений Site main | Узгодити release SHA, review/CI, compatibility manifest; однаковий UI у web та iOS |
| R02 / P0 | **Підтверджено:** `ProductionNavigation.tsx` містить Leaflet, GPS watch, мережу, matching і UI; ядра FSM немає | NavigationCore + controllers + MapAdapter; architectural import tests |
| R03 / P0 | **Підтверджено:** локальний marker змінюється тільки після `sendNavigationLocation` response | Валідований local GPS pipeline, відокремлений throttled sync, render без RTT |
| R04 / P0 | **Підтверджено:** route API/сесія повертають arrays; WIP canonical adapter має `maneuvers: []`, не використовується як новий wire contract | OSRM steps → semantic maneuvers; polyline6; backward-compatible endpoint/negotiation; old-client tests |
| R05 / P0 | **Підтверджено:** немає MapLibre renderer, style pipeline, PMTiles manifest/CDN; production навігація Leaflet | MapLibre через один adapter; versioned style/data, реальний tile acceptance |
| R06 / P0 | **Підтверджено:** expiry worker завершує active/paused session та видаляє route після 5 хв без GPS | Відокремити TTL координат від lifecycle; offline route cache, resume/reconcile, припинити matching під час offline |
| R07 / P0 | **Підтверджено:** Core/replay/offline store/reroute controller відсутні | FSM, GPS processing, hysteresis/cooldown, replay + golden, bounded reroute |
| R08 / P0 | **Підтверджено:** `planJourneys` не викликається іншими server модулями; search створює один COMMUNITY leg | Provider registry + walking connections + time-dependent API orchestration + multi-leg persistence |
| R09 / P0 | **Підтверджено:** Journey search допускає origin/destination offer у радіусі 25 км, але повертає `walkingMeters: 0` | Розрахувати access/egress legs або відкинути недосяжні endpoints; не називати поточний результат door-to-door |
| R10 / P0 | **Підтверджено:** planner вимагає збіг node IDs; connection між різними сусідніми stops не використовується; feasibility враховує uncertainty попереднього leg, не накопичену | Реальні walking edges між вузлами, cumulative uncertainty, bounds на expansion; tests три й більше legs |
| R11 / P0 | **Підтверджено:** planner duration рахується від першого departure, а API single-leg — від requested departure | Єдина door-to-door шкала, включно з очікуванням першого транспорту; regression FASTEST |
| R12 / P0 | **Підтверджено:** weighted FASTEST/CHEAPEST не гарантують абсолютний мінімум часу/ціни; unknown price як MAX_SAFE_INTEGER спотворює normalization | Зафіксувати policy: feasibility → головний критерій → tie-break weights; unknown/range pricing, monetization-neutral tests |
| R13 / P0 | **Підтверджено:** optimizer перевіряє window нового pickup, але `existingStops` не містять зобов’язань щодо deadlines; dropoff deadlines відсутні | Зберігати й перевіряти time windows усіх пасажирів, dwell time, capacity і booking-derived occupancy |
| R14 / P0 | **Підтверджено:** GPS proximity автоматично переводить waypoint у visited; occupancy виводиться з visited stops | Прибуття географічне відділити від boarding/alighting; GPS проїзд повз не повинен займати/звільняти місце |
| R15 / P0 | **Відтворено:** `DRIVER_WAITING` → passenger approaching → passenger arrived дає `PASSENGER_WAITING`, не `BOTH_NEARBY` | Reducer враховує окремі стани/timestamps обох учасників; test усіх порядків прибуття |
| R16 / P0 | **Підтверджено:** Rendezvous boarding після двох arrival може викликати один учасник; окремих двох boarding confirmations немає; sharing лишається під час BOARDING | Двосторонній handshake/ticket reconciliation; припинити rendezvous GPS після посадки, чіткий перехід у booked ride |
| R17 / P0 | **Підтверджено:** Rendezvous location перевіряє стан, потім пише Redis поза DB lock; prior sample перевіряється через GET/SET | Закрити race із cancel/end, atomic monotonic location write, expiry/revocation version; privacy concurrency tests |
| R18 / P0 | **Підтверджено:** driver cancellation event recipients `[req.userId, booking.driver_id]` не містять пасажира, коли скасовує водій | Адресувати обом booking participants; two-client test саме driver-initiated cancellation |
| R19 / P0 | **Підтверджено:** booking cancellation не перебудовує навігаційні waypoints у показаному flow | Transactional stop invalidation + version/replan; capacity після cancellation і onboard exceptions |
| R20 / P0 | **Підтверджено:** немає driver/passenger routed ETA, MeetingReadyAt, Journey Monitor/cascade, автоматичних replan alternatives | Єдиний observation→ETA→transfer→proposal pipeline, debounce; жодних автоматичних покупок |
| R21 / P0 | **Підтверджено:** `productionApi.request<T>` покладається на cast та втрачає error code; WS має `{type,data}` | Runtime schemas, typed errors, versioned envelope + tolerant compatibility; refresh single-flight перевірити |
| R22 / P0 | **Підтверджено:** OpenAPI generation відсутня; routing env не проходить новий Foundation config contract | OpenAPI/DTO generation, response/provider/env validation; config matrix й compatibility tests |
| R23 / P0 | **Підтверджено:** немає GTFS/GTFS-RT adapter, future match, walking provider, traffic deployment | Інтерфейси + ізольовані fixtures; staging live source до ввімкнення відповідного режиму |
| R24 / P0 | **Підтверджено:** немає registered service worker/offline route store; manifest не забезпечує offline | Shell cache, scoped TTL cache, account-switch purge, API no-cache, offline tests |
| R25 / P0 | **Підтверджено:** iOS лише wrapper, дозволи foreground; CI compilation не тестує physical sessions/GPS | Native capability adapters, pinned bundle, HTTPS/session validation, TestFlight/physical matrix |
| R26 / P1 | **Підтверджено:** `server/index.ts` 3486 рядків, `ProductionMarketplace.tsx` 1171; навігація екраном через local tab state | Виділяти домени поступово; URL/deep links, hooks, route guards, reusable design primitives |
| R27 / P1 | **Підтверджено:** demo chunks і Leaflet є в build artifacts попри production entry guard | Окремий demo entry/build, `src/demo/`, відсутність fake GPS/seed у production import graph |
| R28 / P0 | **Ризик:** Journey query не має тих самих block/account/vehicle eligibility predicates, що matching | Єдина eligibility policy для search/quote/booking; tests suspension/revocation/block після публікації |
| R29 / P0 | **Підтверджено:** precise route/waypoint/booking pickup мають різні життєві цикли; docs обіцяють очищення узагальнено | Класи даних, TTL/deletion metrics, backup expiry та post-restore re-delete; перевірка всіх таблиць |
| R30 / P0 | **Підтверджено:** немає staging/backup restore/load baseline/security release evidence | Інфраструктура, restore/outage/rollback drill, load profile, alerts, security/device gate |
| R31 / P1 | **Підтверджено:** `localDateTime()` для Home/offer/demand утворює час через system-local `Date.setHours`, хоча labels/search контракт використовують Europe/Kyiv | Timezone-safe Kyiv conversion та DST tests на браузерах із Kyiv і не-Kyiv system zones; persist UTC instant, показувати Kyiv local time |

Для R15 локально виконано `resolveRendezvousAction('passenger','approaching','DRIVER_WAITING')`, потім `resolveRendezvousAction('passenger','arrived', previous.state)`. Отримано `PASSENGER_APPROACHING → PASSENGER_WAITING`. Це відтворення reducer, не запущений HTTP сценарій.

Додатково перевірити перед заморожуванням: polyline bounds/antimeridian/oversized payload, профілі VAN/EV не повинні мовчки оброблятися як CAR, empty/zero-distance legs, `routeVersion` після stale responses, ідемпотентність proposal accept при втраті відповіді, семантика GET Rendezvous (зараз створює session), DST/timezone поза Europe/Kyiv.

## 5. Дизайн: фактичний розрив

Логотип M, синя/біла палітра, rounded cards, onboarding, Home, detail і tab bar уже присутні. Але Home має іншу щільність і композицію; production font stack починається з Plus Jakarta Sans, тоді як референси задають SF Pro; кнопки, badges, sheets і typography розпорошені в inline classes. JourneyResultsPanel малює лише перший leg. Active Journey, transfer screen, live transport, ReplanSheet та окремий live Rendezvous map відсутні. Навігаційний screenshot показує локальну тестову підкладку, не реальні вулиці.

Дизайн-референси містять майбутні функції: payments/Apple Pay, social login, insurance, support 24/7, SOS dispatch, voice messages, commercial inventory, speed limits, traffic, CO₂ savings. Для них потрібні окремі підтверджені можливості/data; красивий макет не є дозволом показувати вигадані live дані або виконану оплату. Детальні відповідності — у DESIGN_INTEGRATION_MATRIX.md.

## 6. Поточні перевірки цього проходу

| Команда | Фактичний результат | Межі доказу |
|---|---|---|
| `git fetch origin` у чотирьох repos | Успішно | Оновлено remote refs; merges/pull робочих дерев не виконано |
| `npm run typecheck` | PASS | Umbrella working tree із початим Foundation |
| `npm run lint` | PASS | Поточний script; він ще не охоплює всі нові shared/frontend modules |
| `npm test` | 49 tests: 48 PASS, 1 SKIP, 0 FAIL | DB opt-in test пропущено; це не full integration |
| `npm run build` | PASS | Vite; Navigation 7.32 kB gzip, Leaflet 43.38 kB gzip, main 119.20 kB gzip; не MapLibre/runtime baseline |
| Відтворення R15 | Підтверджено неправильний кінцевий стан | Потрібен regression fix на наступному етапі |

Команди виконані на локальному Node `v26.7.0`; repo pin — `24.21.0`. Повтор на pinned runtime входить у Phase 0. Нових тестів або продуктових змін у цьому audit-проході не додано. Логи: `/tmp/marshgo-foundation-audit-tests.log`, `/tmp/marshgo-foundation-audit-build.log`, `/tmp/marshgo-foundation-audit-lint.log` (тимчасові, не release artifacts).

## 7. Висновок щодо readiness

Є працездатна локально перевірена основа Community marketplace. Foundation v1.0, наскрізний multimodal/live Journey, фінальний дизайн усіх станів, production infrastructure та iOS release acceptance ще не завершені. **FROZEN = NO; Gate A = NOT RELEASED; Gate B = BLOCKED_EXTERNAL + NOT IMPLEMENTED parts.** Відсоток готовності не обчислюється: він приховав би критичні залежності.

## 8. Додаток після Foundation implementation pass — 2026-09-30

Після базового аудиту виконано окремий implementation pass у поточному umbrella working tree. Він закрив частину R02–R07, R21–R22 та R27: Leaflet production map замінено на MapLibre adapter; додані navigation reducer/store і локальний GPS projection path; створені offline route/session cache, canonical routing/polyline6 endpoint, reroute з перевіркою власника та версії маршруту, style/data manifest contracts, synthetic replay fixtures і часткова OpenAPI схема. Старі route API shapes збережені для сумісності.

Після змін пройшли `npm run check:production`, GPS replay, браузерні E2E (5/5), API/PostGIS/Redis integration suite і simulator build/install/launch. Це не змінює зовнішні/невиконані висновки: ProductionNavigation усе ще завеликий orchestration layer; реальні PMTiles/styles/CDN, повне OpenAPI та runtime validation, реальні/anonymized replay traces, privacy deletion/backup drills, production observability, pinned multi-repo release SHAs і фізичний iPhone acceptance відсутні. iOS перевірений лише до першого екрана. Детальний актуальний перелік і межі доказів — у [Foundation v1.0 status](FOUNDATION_V1_STATUS_2026-09-30.md).
