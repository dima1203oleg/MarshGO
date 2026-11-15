# MARSHGO — Premium Redesign: Final Specification

2026-11-14 · фінальне ТЗ v2 · напрям «Лінія подорожі» · стан продукту **NOT_RELEASED**.

## 1. Мандат, джерела та межі доказів

Власник доручив AUDIT → FINAL SPEC → IMPLEMENT → TEST → POLISH → COMMIT. Цей документ збережений до нових змін UI. Після збереження реалізація починається без додаткового погодження концепції. Це специфікація результату, а не заява, що весь результат уже реалізований чи прийнятий.

Проведений аудит охопив шість репозиторіїв, 42 функціональні області та 17 findings. Rendered baseline: пошук на семи viewport у двох темах; окремі Home, route details, request, date, map picker, providers, chat та auth стани на390px. Решта — source-only, не завершене runtime acceptance. Попередній401 наразі не відтворюється: у тому самому Qoder браузері на `/map` знову показано «Карта транспорту». Причину401 не встановлено; auth не обходили.

Канонічне середовище: https://marshgo-dima.shares.zrok.io → чинний Vite127.0.0.1:7777. Джерело `/Users/dima1203/.qoder/worktrees/app/330dd3/MarshGO-Site`, base `b58cad91eddabbf89f016d438d446d36f169df87` плюс існуючі незакомічені зміни. Кореневий `src/` оркестраційного репозиторію — не активний UI. Новий dev/preview сервер, дублююча збірка або другий вебінтерфейс заборонені. Продакшн-деплой, merge у захищені гілки та знищення чужої роботи не дозволені.

Нормативні додатки:
- [Аудит та provenance](MARSHGO_DESIGN_AUDIT.md).
- [Дослідження і три концепції](MARSHGO_CREATIVE_CONCEPTS.md).
- [Таблиці дизайн-токенів](MARSHGO_DESIGN_SYSTEM.md).
- [Повна специфікація motion та preview](MARSHGO_MOTION_SPEC.md).
- [Матриця42областей із власниками коду](MARSHGO_SCREEN_REDESIGN_MATRIX.md).
- [Файли, тести та послідовність пакетів](MARSHGO_REDESIGN_IMPLEMENTATION_PLAN.md).
- [Попереднє ТЗ v1](MARSHGO_ULTIMATE_PREMIUM_REDESIGN_SPEC.md) — історія рішень; цей документ має перевагу при розбіжності.

Остання вимога власника уточнює layout: **усі12категорій завжди представлені сіткою4×3, включно з desktop**. Варіанти6×2/8+4 із попередніх матеріалів скасовані. Збереження чинної навігації означає збереження її реальних ролей, адрес і handlers; творчий редизайн не є дозволом довільно змінювати IA чи порядок каталогу.

## 2. Дизайнерське рішення

MARSHGO Signature Experience: лінія маршруту є спільним візуальним мотивом адресних полів, карток, timeline та карти. Refined Minimalism визначає спокійні поверхні, сильну типографічну ієрархію та зменшення вкладених рамок. Spatial Mobility застосовується лише до функціональної карти/перегляду, не як декоративний ефект кожної сторінки.

Преміальність — це зрозумілий наступний крок, чесність даних, акуратна геометрія та переривана анімація. Не додавати зайвий glass/blur, ambient motion, вигадані тарифи, фальшиві GPS-координати, приховані функції або дрібний текст. Наявні brand/road assets зберегти; карта й пошук не потребують нових декоративних hero-зображень.

### Візуальна система

- Зберегти контракт існуючих `--mg-*`, `--mode-*`, `--route-*` tokens. Повні CSS color values лишаються придатними для `var(--token)`; не змінювати формат усіх споживачів заради HSL.
- Light: paper canvas, primary surface, темний ink. Dark: graphite/navy, читабельний secondary ink, контрольований electric-blue accent.
- `--mg-action` — заливка з білим текстом; `--mg-blue-ink` — дрібний текст на tint; `--mg-blue` — іконки/лінії. Не підміняти семантичні ролі.
- Кольори транспорту однакові в ribbon, timeline і map. Використовувати як accents, не12яскравих фонових плиток. Наявний label/icon передає зміст без залежності від кольору.
- Шрифт native stack; шкала12/14/16/20/24/28–32px. Inputs16px; метадані не менше12px. Заголовок не змагається з route summary.
- Ритм4/8/12/16/24/32/48px. Контроли44×44minimum; основні map/actions48. Радіуси field12/card20/sheet28 через registry.
- Mobile: одна читабельна колонка. Desktop: повноцінне полотно до1200px, компактний заголовок і дві змістові колонки пошуку. Усередині панелі транспорту завжди4×3. Route dock360–440px, одна карта.
- Home чотири квадратні дії2×2; на коротких екранах scroll, не зменшення плиток до недоступного розміру.
- Один локальний primary CTA; контекстні secondary дії групувати поруч. Прибрати дубль технічного status, але outage/unknown/permission має лишитися видимим.

## 3. Конкретні рішення для кожної області

| ID | Екран | Реалізувати | Зберегти / довести |
|---|---|---|---|
| S01 | Welcome | Компактна brand композиція, primary початок і secondary вхід, short-screen scroll | Реальні переходи, CTA reachable320px, reduced motion |
| S02 | Login/register/recovery | Єдині fields, persistent labels, inline error, keyboard-safe panel | Auth transport, password manager,401/rate limit/network; без секретів у screenshot |
| S03 | Home | Тихий заголовок, існуючий road asset,4дії2×2, приватний MarshPass без універсальної обіцянки | Passenger/driver, no ticket/eligible ticket, scroll |
| S04 | Search | Route-input spine, короткий heading, desktop2колонки, один primary CTA | Всі фільтри/API/query/back, немає горизонтального overflow |
| S05 | Origin | Одна trailing clear або map дія, адресні suggestions з контекстом | Повна accessible адреса, keyboard/stale/no results |
| S06 | Destination | Симетричний origin field, зрозумілий swap/context | Без довільного автоприйняття неоднозначного першого result |
| S07 | Map picker | Footer над nav/safe-area, theme-reactive map, focus restore, reduced motion | One canvas, disabled без point, geocoder error не підробляє адресу |
| S08 | Date/time | Єдиний sheet, summary дати/часу Києва, чіткі departure/arrival labels | Cancel не комітить draft, bounds/timezone, без вигаданого flexible API |
| S09 | Party/budget/transfers | Узгоджені compact controls, labeled custom budget | Мінімум1пасажир, чинні bounds, no-transfer semantics |
| S10 |12transport modes | Завжди4×3, усі12видимі, унікальні іконки, quiet selection + check | Independent multi-select/all/none, no clipping320, реальний catalog |
| S11 | Providers | Стисла група, descriptor для однакових назв якщо його дає сервер | Registry authoritative, empty/outage/coverage різні стани |
| S12 | Search pending/error | Один status, skeleton структури картки, retry зі збереженням input | Timeout≠empty, no invented percent/progress |
| S13 | Results | Три стратегії видимі, list first, зрозумілі duration/fare/transfers | Real routes, unknown fare, ties, selection/back |
| S14 | Route cards | Спільний ribbon, сильний час, читабельні stops, одна open-action | Mode parity, long labels, keyboard, unavailable leg |
| S15 | Map/details | Один synchronized map+sheet, компактна summary, дві різні дії preview/GPS |4detents, selected leg, no map recreate, manual camera priority |
| S16 | Stops/transfers | Єдиний timeline, direction/board/alight/platform за даними | Focus existing map once, missing accessibility чесно |
| S17 | Animated preview | На існуючій карті один existing slider, Play/Pause/Seek/Previous/Next, «Не GPS» | No geolocation/store/API/lifecycle side effects; invalid path unavailable |
| S18 | GPS navigation | Маневр/пересадка головні, location status видимий незалежно від follow | Fresh fix validation, denied/stale/offroute/offline, реальне completion |
| S19 | Driver navigation | Unknown speed→—, нейтральний pause, ambiguous destination confirmation | Explicit matching consent, no fake safety,44grabber |
| S20 | Transport map | Читабельні unavailable/stale/live, компактний rail, дані міста від registry | No fake vehicles, one adapter, age/provenance видимі |
| S21 | Carpool results | Date/seats/fare/driver/pickup hierarchy, інша дата явно | Expired/cancelled/no seats/unknown не маскуються |
| S22 | Offer detail | Route summary + driver/vehicle facts, named Back, booking total | Own offer/driver/passenger/expired guards |
| S23 | Publish offer | Search field parity, grouped route/time/vehicle/seats/conditions | Validation/busy/errors, explicit publish; не надсилати live під час visual audit |
| S24 | Passenger request | Route→time→party→conditions, optional note secondary | Existing submit/budget/baggage/pets rules |
| S25 | Requests | Common summaries, lifecycle tags, correct role actions | Owner/driver,empty/matched/expired/deleted |
| S26 | Proposals | Видимий delta маршруту/ціни перед accept, один confirmation layer | Concurrent conflict, withdrawal, network uncertainty |
| S27 | Booking confirm | Scrollable focus-managed dialog, trip/date/seats/total | No duplicate submit, success/rejection/unknown різні |
| S28 | Booking detail | Status-first, pickup/chat/cancel доступні за роллю | Server lifecycle, destructive confirmation |
| S29 | MarshPass | Лише приватний ticket, Kyiv time, readable QR, secondary details | Passenger confirmed/boarding only; token errors/expired/revoked |
| S30 | Trips/saved | Common route card, ясні sections, корисний empty next step |0/1/many, stale/deleted routes, no demo cards |
| S31 | Profile | Identity→documents→preferences→support→account | Roles/vehicles/admin, explicit logout/delete |
| S32 | Settings | Consistent theme controls, зрозумілі motion/sound preferences | themeService owns html.dark, system/reduced/mute |
| S33 | Privacy | Purpose/status/revoke в одному блоці | Consent≠OS grant; denied/revoked/offline |
| S34 | Documents/vehicles | Читабельні pending/rejected/verified, unified errors | Genuine uploads only, private content не в proofs |
| S35 | Safety/help/sources | Ясна support hierarchy, legal/attribution reachable | Safe report/block confirmations, no fake live |
| S36 | Chat/thread | Booking context, читабельні bubbles, один connection state | Offline/reconnect/send failure, keyboard composer, no unsolicited messages |
| S37 | Notifications | Chronological groups, semantic unread/action | Empty/read/stale deep links, paging |
| S38 | Global + | Publication-first, прибрати дубль Home utilities із drawer | П'ять навігаційних items, чинні role destinations, focus return |
| S39 | Map controls/layers | Єдиний rail44–48px, Escape/focus, token palette | Manual zoom/pitch/2D3D interrupts preview; attribution |
| S40 | Export/delete/moderation | Тільки visual primitive alignment | Existing authorization, explicit destructive confirmation, no live destructive audit |
| S41 | iOS shell | Після Web acceptance asset/safe-area/keyboard parity | Реальний device gate; без окремого UI fork |
| S42 | Admin/Partner | Узгоджений vocabulary без переносу consumer IA | Окремі role workflows; source inventory не runtime pass |

Для кожного зміненого компонента перевірити default, hover, focus-visible, selected, disabled, loading, empty, error/unknown, success та reduced-motion/offline там, де вони можливі. Незмінені області не позначати реалізованими лише через наявність цього рядка.

## 4. Preview, adaptive3D та ownership

### Межа даних

Preview використовує тільки геометрію обраного маршруту й чинний MapAdapter. Не монтувати JourneyActiveNavigation для відкриття preview: там запускається реальна геолокація. Не створювати другого MapLibre instance, другого range, fake GPS puck або незалежного маршрутизатора. Reuse FlightTelemetry, hyperFlightEngine та існуючий camera adapter. Geometry із пропусками/невалідними координатами не з'єднувати вигаданою прямою.

### State machine

- Closed → Open(valid path) → Paused at0. Invalid path → Unavailable з поясненням.
- Paused → Play → Playing, тільки явною дією; reduced-motion залишає manual seek/step.
- Playing → Pause / manual camera / hidden tab → Paused; позиція зберігається.
- Seek оновлює точку геометрії й telemetry, без зміни GPS/trip progress.
- Previous/Next переходять між реальними етапами. На останньому кнопка повернення на початок; completion не завершує реальну поїздку.
- Close/back/route change/unmount скасовують rAF, знімають cinematic state/marker; реальна навігація лишається окремою явною дією.
- Manual pan, zoom, rotate, pitch, keyboard та2D/3D мають однаковий interrupt. Автоматичне повернення follow за таймером заборонене. Лише Play/explicit recenter повертає camera owner.

Adaptive camera використовує довжину реальної geometry: міська/пішохідна ближче,100–500+км з більшим overview, arrival/transfer із контрольованим уповільненням. Не заявляти про terrain3D там, де його немає. Preview distance/time — позиція перегляду, не поточна швидкість людини, GPS чи реальний ETA.

### Bottom sheets

Зберегти існуючі4detents та stage selection. Drag interruptible: transition:none під час gesture. Не змінювати camera padding кожного pixel drag; fit тільки через чинний controller у визначені моменти. Sticky actions не перекривають content/nav/safe-area. Escape закриває topmost overlay перед виходом із route. Клавіатурні та single-pointer alternatives до drag обов'язкові.

## 5. Чесність і транзакційні інваріанти

- POST booking timeout має невідомий outcome до reconciliation. Не повідомляти «перевірено» до успішного refresh і не гарантувати відсутність бронювання після network error.
- Підтверджений сервером booking зберігає success навіть при помилці background refresh.
- Невідома ціна/швидкість не дорівнює0. «Пауза» не означає «безпечно зупинено».
- MarshPass не для громадського транспорту чи збереженого мультимодального journey.
- Fare/category discrepancies спочатку перевіряються на payload/serializer; CSS не виправляє контракт даних.
- Availability залежить від server city/provider registry; жодних зашитих припущень про транспорт у місті.
- API, routing, search, booking та GPS contracts не переписувати заради дизайну.

## 6. Виконання та контроль змін

1. Зафіксувати exact base/diff і поточні foreign changes, прочитати цільові files. Зберегти це ТЗ.
2. Компактний Search: tokens/layout,4×3 на всіх ширинах, one action per field, labels/targets; одразу Qoder visual.
3. Незалежний preview на route-details: existing engine/telemetry, camera ownership/manual interrupts, lifecycle isolation; поведінкові тести й Qoder golden path.
4. Route/sheet/control polish і вузькі trust fixes, кожний із своїм доказом та negative control.
5. Home/results/trips/booking/profile/chat по матриці; не змішувати несумісні transaction changes в один косметичний commit.
6. Інтеграційний прохід, порівняння same-state before/after, responsive/a11y/performance, clean dependency review.
7. Логічні commits лише reviewed paths/hunks; PR із чесним scope, доказами та рештою blockers. Не stage приватний login/autofill/QR screenshot, секрети чи чужий dirty tree.

Лише один важкий процес одночасно на8GBMac. Поточний ресурсний стан YELLOW (28%memory free,19GiBdisk у preflight); не запускати паралельні browser/tests/build. Спершу вузькі behavioral tests, далі typecheck/lint; full suite/build/bundle на інтеграційному checkpoint за ресурсів. Не виконана перевірка лишається NOT_TESTED, навіть якщо код виглядає правильним.

## 7. Приймання і доказовий звіт

| Gate | Обов'язковий доказ |
|---|---|
| Provenance | SHA + reviewed dirty diff + tracked import dependencies; старі869tests не переносяться на нові inputs |
| Canonical runtime | Той самий public HTTPS, Qoder in-app, listener7777, без нового server |
| Search |12distinct icons,4columns×3rows у всіх viewport, independent selection,44targets,12pxlabels, no clipped labels/overflow |
| Preview | Реально відкривається безGPS; Play/Pause/Seek/step працюють, onecanvas/oneslider; GPS/API/store spies0calls |
| Ownership | Pan/zoom/pitch/2D3D/keyboard переривають autoplay; камера не відбирає контроль після idle |
| Geometry | Invalid/disconnected geometry unavailable;100/500км fixtures чітко позначені, не live evidence |
| Transactions | Booking success/rejection/unknown + ticket eligibility; реальні side effects лише за належного дозволу |
| Responsive |320×568,390×844,430×932,768×1024,1280×800,1440×900,844×390; light/dark; довгі labels,200%zoom |
| Accessibility | Keyboard/focus/Escape, labels/announcements, AA contrast, touch44, reduced motion; VoiceOver окремий manual gate |
| Performance | Before/after frame intervals/long tasks/memory; one map, rAF cleanup; жодного невиміряного «60FPS» |
| Regression | Targeted behavior tests + negative control, typecheck/lint, integration suite/build/bundle за фактичною версією |
| Delivery | Commits/PR verified URLs, execution scope, remaining work; no protected merge/production deploy |

Звітувати VERIFIED / PARTIAL / BLOCKED / NOT_TESTED з точними числами й артефактами. Screenshot loading state не є baseline цільового екрана. Same-state comparison потребує однакових viewport/theme/route/content/detent. Широке завершення редизайну можна заявити лише після проходження матриці; до того повідомляти завершені пакети й невиконані gates. **NOT_RELEASED** зберігається.
