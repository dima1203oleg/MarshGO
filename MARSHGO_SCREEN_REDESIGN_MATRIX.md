# MARSHGO — Screen redesign matrix

2026-11-14 · specification before implementation · **NOT_RELEASED**.

Evidence baseline: live Site `b58cad91eddabbf89f016d438d446d36f169df87` + dirty tree; source root `/Users/dima1203/.qoder/worktrees/app/330dd3/MarshGO-Site`. `V` = rendered/inspected at stated scope, `S` = source-only, `B` = runtime blocked by auth/data/device. Нижче — план змін, **не перелік уже виконаного**. Findings A01–A17 — у `MARSHGO_DESIGN_AUDIT.md`.

## 1. Екрани та їхні контракти

| ID / екран | Entry / власник | Evidence | Рішення | Конкретна зміна | Обов'язкові states / acceptance |
|---|---|---|---|---|---|
| S01 Welcome | `ProductionMarketplace` auth branch | V390 dark | ENHANCE | Чіткі primary «Почати» і secondary login, наявний brand asset; контроль вертикального центрування на короткому екрані | 320/390/desktop, long copy, reduced motion; CTA reachable |
| S02 Login/register/recovery | Auth flow того самого entry | Login V390; решта S/B | KEEP/ENHANCE | Єдина Field/Error treatment, password manager friendly, persistent labels; не змінювати auth transport | Autofill, invalid input, rate limit,401/network, keyboard; секрети не потрапляють у докази |
| S03 Home | `/`, `HomeHero`, Marketplace2166 | V390 | REDESIGN | Спокійний «mobility journal»: наявний road/banner, чотири квадратні дії2×2, коректний приватний MarshPass, популярні напрямки другорядні | No booking/confirmed booking/driver, short-screen scroll; не прибирати4дії |
| S04 Search | `/journeys/search`, Marketplace2121 | V7viewports×2themes | REDESIGN | Короткий page heading; route-input spine; desktop2колонки; mobile4×3; один primary CTA | Empty/filled/long addresses/loading/error; dimensions44+, labels12+, inputs16+ |
| S05 Origin suggestions | Search field group «Початкова точка» | S; empty row V | ENHANCE | Один trailing clear або map-action, suggestions з містом/районом; адреса не втрачає accessible full label | keyboard↑↓EnterEsc, stale query, no results, unavailable geocoder |
| S06 Destination suggestions | Search field group «Кінцева точка» | S; empty row V | ENHANCE | Дзеркальна геометрія origin; збереження back/search context | Пара з однаковими адресами, довгі labels, без автоприйняття found[0] |
| S07 Map point picker | `components/MapPointPicker.tsx:22–104` | V390 no point | REDESIGN | Map-owned overlay, footer поза global-nav overlap; focus trap/return; theme reaction; reduced-motion camera | Empty disabled confirm, real tap point, reverse-geocode fail, close/unmount; 0 fake GPS |
| S08 Departure/arrival | `DepartureDateTimePicker`, Marketplace2536–2537 | V390 opening/closing | ENHANCE | Спільний sheet, читабельні часові колеса і summary «Київ», чіткі незалежні departure/arrival labels | Cancel не змінює draft, Apply комітить; invalid bounds; timezone/device clock |
| S09 Passengers/budget/transfers | Search controls, `journeySearchBounds` | Vdefault | ENHANCE | Passengers і budget однакового рангу; custom budget з label/error; не називати arrival-bound flexible date range | Min1, max за чинним API, invalid/empty custom budget, no-transfer semantics unchanged |
| S10 Transport grid | `TransportTypesPanel`, transport registry | V12unique, multiselect | KEEP/ENHANCE | Mobile4×3, desktop6×2 або4×3 у колонці; тихі neutral surfaces, selected check; унікальна іконка кожному | Independent multi-select, all/none,12labels,0overflow320, no reordered canonical IDs |
| S11 Provider selection | Marketplace2538 | V390 | ENHANCE | Однакові provider names доповнити наявним descriptor; availability/read-only disclosure зрозуміло | Empty/outage/mixed coverage, duplicate names; registry authoritative |
| S12 Search loading/error/empty | `JourneySearchPending`, search recovery | S/B new request | REDESIGN | Skeleton геометрії результату; один status; empty відрізняється від outage; retry зберігає input | Slow/abort/timeout/partial/error/0real routes; не фейкові progress percentages |
| S13 Results/strategies | `JourneyResultsPanel`, Marketplace2216 | S; старі докази не заміна нового проходу | REDESIGN | Три стратегії видимі; route ribbon повторює карту; ETA/duration/fare + uncertainty; без зайвої live-map до вибору | Optimal/fastest/cheapest, ties, missing fare, long legs, keyboard selection |
| S14 Route cards | `CanonicalRouteLip`, `JourneySegmentStrip` | Saved card V390 | ENHANCE | Єдина ієрархія часу/ціни/пересадок; active mode segment same token as map; одна open-action | Long stop names, unknown price, unavailable leg, selected, hover/focus |
| S15 Route map/details | `/journeys/:id`, `JourneyRouteMapScreen:154–178,1308–1540` | V390 saved4legs | REDESIGN | Map + draggable sheet лишаються одним screen; компактна route summary, sticky local action, свідомий choice preview vs GPS-start |4detents, alternatives, map unavailable, long route; no map recreate; manual ownership |
| S16 Stops/transfers/departures | RouteMap stage/stop selection | S/B | ENHANCE | Один timeline: номер/назва зупинки, direction, board/alight, actual accessibility, departure provenance | Stop select focuses existing map once, long labels, missing platform/accessibility, last service |
| S17 Preview | `FlightTelemetry:26–77`, `hyperFlightEngine` | S; live entry B | REDESIGN | Незалежний режим на існуючій карті, один existing slider, play/pause/seek/step, label «Перегляд · не GPS» | No geolocation call/lifecycle write; invalid geometry unavailable; seek0/100/reverse; reduced motion; manual pan |
| S18 GPS navigation | `JourneyActiveNavigation` | S/B | ENHANCE | Маневр/next transfer головний, реальний location status незалежно від follow; preview і fix не змішуються | Denied/low accuracy/stale/off-route/offline/finish; no fabricated speed/arrival/safety |
| S19 Driver/general navigation | `/navigate`, `ProductionNavigation` | S/B; loading shot rejected | ENHANCE | Confirm ambiguous destination, pause label чесний, speed unknown→—,44px grabber, explicit matching consent | No consent no matching, active/paused/completed, route restoration, real driver role |
| S20 Transport map | `/map`, `TransportMapView` | S/B; loading shot rejected | ENHANCE | Серверне місто/coverage, neutral unavailable state, data age доступний усім, контролів менше | Empty city/feed outage/stale/live; no imagined vehicles; same MapLibre adapter |
| S21 Carpool search/results | Marketplace results, `carpoolDatePresentation` | S/B | ENHANCE | Дата, місця, ціна, driver facts, pickup; clearly label other-date offers | Empty, expired, cancelled, different day, no seats; no fake availability |
| S22 Offer detail | `/offers/:id`, Marketplace2507 | S/B | REDESIGN | Reuse route summary + factual driver/vehicle block; named Back; primary book price/passengers summary | Driver vs passenger, own offer, unavailable, expired; long data320 |
| S23 Publish driver offer | `/offers/new`, Marketplace2382 | S/B; loading shot rejected | ENHANCE | Ті самі route fields/date; vehicle/seats/price/conditions sections, один submit | No usable vehicle, invalid range, busy, failure/success; не створювати offer у live audit |
| S24 Publish passenger request | `/demands/new`, Marketplace2395 | V390 form | ENHANCE | Групування route→time→party→conditions; spacing/type align Search; optional note не домінує | Invalid/empty, budget type, baggage/pets/seat, save failure; no submission during audit |
| S25 Requests / own requests | `/demands`, `/demands/mine`, Marketplace2424 | S/B; shots rejected | ENHANCE | Request summaries share route spine; lifecycle tags замість декоративних badges | Owner/driver, no match, matched, expired, deleted; correct role actions |
| S26 Proposals/counteroffer | Marketplace2540–2541 | S/B | ENHANCE | Price/route change delta зрозумілий до accept; один confirmation layer | Pending/withdrawn/accepted/conflict, concurrent update, network uncertainty |
| S27 Booking confirmation | Marketplace2566, transaction1174–1225 | S/B | REDESIGN | Scrollable dialog, full trip/date/seats/total перед confirm; pending blocks duplicate | Success vs rejection vs unknown; retry не створює дубль; close/focus |
| S28 Booking detail/lifecycle | `/bookings/:id`, trips booking branch | S/B | KEEP/ENHANCE | Status-first card, підтверджені дії за роллю, pickup/chat/cancel без приховання | Confirmed/boarding/in progress/completed/cancelled/no-show; side effects gated |
| S29 MarshPass | `MarshPassTicket`, Marketplace1252–1265 | S/B real eligible booking | REDESIGN | Ticket для приватної поїздки, readable Kyiv date, QR не прикраса; details/driver як secondary section | Only passenger confirmed/boarding; expired/revoked/offline/token failure; QR чіткий |
| S30 Trips/favourites | `/trips`, `tripsSections`, `SavedJourneyCard` | Vempty future+saved | ENHANCE | Точні tabs Active/Future/Past/Requests/Saved; common route card, clear empty next step |0/1/many,long names,deleted saved route,stale status; no fake cards |
| S31 Profile | `/profile`, Marketplace2357 | V390 | ENHANCE | Identity→documents→preferences→support→account; не втрачати роль/vehicle settings | Passenger/driver/admin, loading, error; logout/delete explicit confirmations |
| S32 Settings/sensory | `ProfileSections:200` | V390 theme | ENHANCE | Theme choices на одній шкалі; animation/sound як керовані preference, не surprise | Light/dark/system,reduced-motion,device muted; no automatic sounds |
| S33 Privacy/location | `ProfileSections:240` | S/B | KEEP/ENHANCE | Explicit permissions/purpose/status/revoke; не плутати consent із OS permission | Denied/revoked/granted, offline; no storage/credential leakage |
| S34 Documents/vehicles | `ProfileSections:161`, verification/vehicle overlays | S/B | ENHANCE | Document state readable, expiry/errors consistent; photograph genuine | Missing/pending/rejected/verified, upload failure; no auto-upload private docs |
| S35 Safety/help/sources | `ProfileSections:310,354,378` | S/B | ENHANCE | Чітка support іерархія; complaint/block actions safe; attribution/legal visible | Empty, validation, confirmation, permissions; no false live claims |
| S36 Chat/thread | `/messages`, `/messages/:id`, Marketplace2291 | Vempty, thread B | ENHANCE | Booking context header, readable bubbles, one connection state; keyboard-safe composer | Empty/offline/reconnect/send failure/deleted booking; no test messages to real people |
| S37 Notifications | Marketplace2539 | S/B | ENHANCE | Unread indicator і chronological groups, semantic action labels | Empty/read/unread/stale deep link, paging; read effects explicitly tested later |
| S38 Global + | bottom nav / production create drawer | V390 | SIMPLIFY | Водій «Опублікувати поїздку», пасажир «Шукаю попутку»; duplicate utilities move to existing Home destinations | Role parity, dismiss, focus return, navigation remains5items |
| S39 Layers/map controls | `MapLayersControl`, `MapInteractionControls` | S; route visual partial | MERGE | Єдиний control rail44–48px; layer-panel focus/Escape; mode tokens, no raw palette |2D/3D/zoom/recenter/layers, manual owner, attribution reachable |
| S40 Deletion/export/moderation | Marketplace2543–2548, ProfileSections | S/B | KEEP | Visual primitives only; destructive confirmation remains distinct; authorization unchanged | Busy/fail/cancel/reversible state, role checks; no live destructive audit |
| S41 iOS shell | Capacitor/WKWebView | S/Bdevice | KEEP | Після Web acceptance синхронізувати assets, safe-area/keyboard/permission review | Actual device, app background/resume, URL/auth parity; no independent UI fork |
| S42 Admin/Partner | Separate canonical portals | S/Bbrowser | KEEP/align later | Shared token vocabulary where appropriate, no consumer-nav transplant; no P0 scope invention | Role-gated real workflows; no new server/start on alternate ports for this audit |

## 2. Схеми взаємодій

- Home → Search → origin/destination → filters → loading → results (3 strategies) → selected route map+sheet → Preview **або** GPS-start.
- Preview → pause/seek/stage → details; не викликає booking/start/finish, не змінює active journey store.
- GPS-start → permission/fresh-fix validation → activation confirmation → navigation → explicit completion. Помилка activation не маскується анімацією.
- + → driver offer **або** passenger demand → validate → explicit publish → owned item.
- Carpool result → offer detail → booking confirmation → server outcome → Trips → eligible MarshPass → genuine boarding.
- Trips/Saved → same route screen; back повертає попередній context, query/scroll зберігаються за чинним router contract.
- Profile → settings/privacy/documents/support; destructive account actions завжди окремі.

## 3. Спільна матриця станів (для кожного зміненого інтерактивного компонента)

| State | Правило |
|---|---|
| Default | Не більше одного локального primary CTA, необхідні дії не приховані |
| Hover | Лише pointer-capable пристрої, без layout shift |
| Focus-visible | Явний outline та offset, не тільки зміна фону; selection не маскує focus |
| Pressed/selected | aria-pressed/selected плюс check/shape; збережена незалежність multiselect |
| Disabled | Відповідна семантика і причина поруч, не нескінченний inert CTA |
| Loading | aria-busy, короткий status, збереження введених значень, cancel де підтримано |
| Empty | Не плутати із outage; корисна існуюча дія без фіктивних результатів |
| Error/unknown | Не називати failure success; no raw stack/API text у default UI |
| Success | Лише після server acknowledgement; background refresh failure не скасовує підтверджений commit |
| Reduced motion | Без autoplay/cinematic fly, ручний seek/static focus; CSS guard перемагає локальні rules |
| Offline/stale | Чесний data timestamp/state; жодного blinking «live» без сигналу |

## 4. Межі baseline та наступний прохід

Дійсні артефакти містяться поруч: Search14frames, Home, demand, saved route, picker, date, providers, chat-empty, welcome. Login — приватний, не для публікації. П'ять rejected loading frames перелічені в audit.

Коли авторизований контур відновлено: відкривати кожен маршрут окремо через app navigation, чекати потрібний heading/стан і завершення boot; capture **viewport** кадр для overlap та **fullPage** для структури. До/після повинні мати той самий journey, тему, viewport і detent. Не підтверджувати pixels з різними тарифами/датами як чистий visual diff.

Підсумок: реєстр source-областей сформований; повне runtime покриття **не отримано**. Жоден S/B рядок не є пройденим acceptance gate.
