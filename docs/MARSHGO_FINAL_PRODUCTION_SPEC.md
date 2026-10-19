# MARSHGO — завершення продукту та випуск перевіреної production-версії

## Основна ціль власника

Довести MARSHGO до вдосконаленої, інтегрованої та протестованої production-версії. Виконувати цикл `дослідити → реалізувати → перевірити → виправити → зберегти checkpoint → продовжити`, не зупинятися на аудиті, плані, одному виправленні, локальних тестах чи успішній збірці. Завершення підтверджується лише доказами проходження production acceptance gates у цьому документі та `docs/PRODUCTION_ACCEPTANCE_MATRIX.md`.

Якщо зовнішній блокер (доступ, ключ, договір, середовище або обов'язкове погодження) тимчасово унеможливлює конкретний крок, завершити незалежну роботу, записати точну причину й готовий наступний крок у `docs/EXTERNAL_BLOCKERS.md` та `docs/PRODUCTION_EXECUTION_STATE.md`, а після усунення блокера продовжити з checkpoint. Це завдання не дозволяє обходити захист або окремі погодження для production-трафіку, руйнівних міграцій чи публікації App Store; до фактичної перевірки реліз не називати production-готовим.

**Одержано:** 2026-10-19
**Основний діалог:** `01a11d06-3103-7cc1-8a5e-60f4d52a7d5a`
**Статус:** виконання триває; цей документ фіксує вимоги, а не засвідчує готовність продукту.

## Мета й спосіб роботи

Дослідити фактичний стан MARSHGO, об’єднати придатні напрацювання, завершити функціональність, поліпшити вебінтерфейси, під’єднати доступні реальні транспортні джерела, оптимізувати, перевірити та довести систему до доказового production-релізу. Не зупинятися на аудиті, плані, одиничному виправленні чи збірці: після кожного етапу брати наступну невиконану доступну роботу. Виняток — реальний зовнішній блокер або обов’язкова межа дозволів.

Цикл: **дослідити → реалізувати → перевірити → виправити → зберегти checkpoint → продовжити**. Не створювати нескінченних циклів самозапуску, прихованих платних процесів або хибних заяв про завершення. Відсутність одного ключа не зупиняє незалежну роботу. Після переривання перечитати цей документ, `docs/PRODUCTION_EXECUTION_STATE.md`, `docs/PRODUCTION_ACCEPTANCE_MATRIX.md`, `docs/EXTERNAL_BLOCKERS.md`, попередній checkpoint і `git diff`, а потім продовжити з наступного пункту.

## Репозиторії й правила Git

GitHub owner: `dima1203oleg`.

| Репозиторій | Канонічна відповідальність |
|---|---|
| `MarshGO-Server` | Єдині API, авторизація, PostgreSQL/PostGIS, Redis, маршрутизація, фіди, ціни, бронювання й бізнес-логіка. |
| `MarshGO-Site` | Єдиний пасажирський/водійський web/PWA UI та спільний вебінтерфейс для iOS. |
| `MarshGO-iOS` | Capacitor/WKWebView оболонка, нативні можливості та збірка, прив’язана до точного Site SHA. |
| `MarshGO-Admin` | Адмінпанель, що використовує Server і його права доступу. |
| `MarshGO-Partner` | Кабінет організації/перевізника, що використовує Server і tenant-ролеву авторизацію. |
| `MarshGO` | Історичний код, продуктові інтеграції й release orchestration; перевіряти на унікальні залежності. |
| `MarshGO2` | Перевіряти на унікальні UI-напрацювання; не зараховувати макет як production-функцію. |

Спершу перевіряти `AGENTS.md`, специфікації, маніфести, status, HEAD, remotes, worktrees, гілки, PR та CI. Не затирати dirty worktree. Інтегрувати вибірково в ізольованих гілках; не зливати все механічно, не видаляти гілки/репозиторії/історію, не робити force-push. Дозволені оборотні кодові зміни, виправлення конфліктів, коміти, push робочих гілок і підготовка PR у межах фактичних прав. Міграції зіставляти за схемою та ledger, перевіряти чистий запуск і upgrade; застосовані номери не перенумеровувати.

Стартові гілки для звірки — лише початкова підказка, не перелік актуального стану:

- **Server:** `codex/partner-platform-foundation`, `codex/sync-mobility-registry`, `feature/gtfs-stop-arrivals`, `feature/transport-layer-availability`, `codex/redis-smart-cache`, `codex/rendezvous-live-pickup`, `codex/security-parse-bearer`, `feature/codex-ownership-guidance`.
- **Site:** `codex/sync-journey-mobility-ui`, `feature/gtfs-stop-arrivals`, `codex/redis-smart-cache`, `codex/rendezvous-live-pickup`, `codex/journey-rendezvous-map`, `codex/navigation-experience-6`, `codex/navigation-deep-link-alias`, `codex/marshgo-sites-design-preview`, `feature/codex-ownership-guidance`.
- **Admin:** `codex/p0-admin`, `feature/codex-ownership-guidance`.
- **Partner:** `codex/p0-partner`, `feature/codex-ownership-guidance`.
- **iOS:** `codex/navigation-experience-6`, `codex/pin-rendezvous-site`, `codex/redis-smart-cache`, `codex/reliable-capacitor-sync`, `codex/simulator-smoke-capture`, `feature/codex-ownership-guidance`.
- **MarshGO:** `codex/marshgo-production`, `codex/navigation-experience-6`, `codex/redis-smart-cache`, `docs/marshgo-canonical-v5-1`, `docs/marshgo-unified-audit-2026-10-18`, `feature/unified-repository-governance`.

Знайти також нові гілки/PR, merged чи superseded зміни й залежності. Підготувати матрицю інтеграції та виконувати її поетапно, зберігши корисні роботи GTFS/GBFS, кешу, навігації, rendezvous, Admin/Partner, auth і booking.

## Production-код і функціональні сценарії

Перевірити справжні entrypoint-и, production routes і залежності. У Site насамперед: `src/views/ProductionMarketplace.tsx`, `ProductionNavigation.tsx`, `JourneyResultsPanel.tsx`, `src/services/productionApi.ts`, `src/navigation/`, `src/map/`, `src/routing/`. Demo-only UI не є доказом production. У Server: `server/mobility/`, `server/journey/`, `server/providers/`, `server/cache/`, `server/navigation/`, `server/migrations/`. Перечитати `docs/ADMIN_PARTNER_PLATFORM_SPEC.md`, `docs/TRANSPORT_API_REGISTRY.md`, `docs/TRANSPORT_LVIV_KYIV_STAGE1.md`, `docs/REDIS_SMART_CACHE.md`, `docs/CACHE_PERFORMANCE_REPORT.md`, `docs/RELEASE_SYNC.md`. Створити inventory: екран/дія → API → права → loading/empty/error/success → тест.

Закрити цілісні сценарії:

- **Пасажир:** вхід, пошук, вибір маршруту, сегменти, booking доступних пропозицій, MarshPass, активні/минулі поїздки, скасування, чат, сповіщення, оцінка, профіль.
- **Водій:** роль, гараж і реальні фото авто, публікація/місця/зміни/скасування, запити й пропозиції, посадка, старт/фініш, навігація.
- **Reverse marketplace:** пасажир задає маршрут/час/бюджет, водій пропонує умови, прийняття атомарно створює серверний booking. Приватні попутки — 0% комісії MARSHGO.
- **Admin:** справжні заявки/організації/модерація/оператори/підключення/ingestion/health/freshness/audit/підтверджені метрики.
- **Partner:** onboarding, організації, memberships, дозволені модулі, профіль перевізника й операції; кожна операція перевіряється сервером за org і роллю.

Не імітувати фінанси, GPS, замовлення, верифікацію, Wallet чи оплату. Незавершена заявлена функція лишається відкритою. Авторизація, бізнес-логіка та БД єдині в Server; не створювати другі backend-и.

## Канон вебінтерфейсу

Послідовні design tokens і компоненти для типографіки, відступів, кольорів, контрасту, кнопок, полів, карток, діалогів і станів. Перевірити ширини 320/390/430/768/1280/1440 px. Desktop має повноцінний layout, без телефонної рамки; усунути overflow, перекриття, safe-area і клавіатурні дефекти. Підтримати доступність, focus, клавіатуру, reduced motion і світлу/темну теми; тексти — природною українською.

- Нижня навігація: **Головна / Пошук / + / Поїздки / Профіль**. `+` — глобальна публікація/дії. Чат і сповіщення зверху.
- Головна без пошукової форми; одна hero-зона — заставка або MarshPass; кілька квитків перегортаються й не дублюються нижче. 2×2 дії: Навігація / Карта транспорту; Опублікувати поїздку / Знайти маршрут. Два промобанери приховуються за наявності MarshPass.
- Пошук: autocomplete, Звідки/Куди, синій старт/червоний фініш, очищення/обмін, геолокація, вибір на карті, дата/час.
- Сітка 4×3: Попутка / Маршрутка / Автобус / Таксі; Трамвай / Тролейбус / Метро / Поїзд; Велосипед / Самокат / Каршеринг / Трансфер. «Усі» — дія вибору; пішки — параметр planner; метро Львова недоступне.
- Сортування: Оптимальний → Найшвидший → Найдешевший. Картка показує повний час/ціну, послідовність сегментів, вид транспорту, піктограму/номер, тривалість і окрему вартість або чесний unknown.
- Маршрут: карта й одна нижня панель у трьох положеннях. Вибір сегмента синхронізує картку/карту, підсвічує ціль, центрує з урахуванням панелей і приглушує інші сегменти. Він не змінює повний itinerary.
- Карта: Схема / Супутник; 3D окремо; Шари окремо. Не додавати окрему базову «транзитну карту» чи видимі +/- zoom.
- Навігація: DISCOVER / PREVIEW / ACTIVE. Глобальна нижня панель доступна; компактне ведення над нею. Перехід між розділами зберігає активну сесію.
- Завершити профіль і доступні підрозділи.

## Транспортні джерела та зовнішні інтеграції

Пріоритет: Україна → Львів/область → Київ та інші міста → міжнародні рейси з України. Спершу перевірити mobility registry і готові фід-гілки; не переписувати наявне без доказу потреби. Перевіряти міські джерела Львова, Києва, Стрия, Ужгорода, Рівного, Івано-Франківська й інші записи `ukraineCatalog`. Лічильник фідів чи старий health не є доказом роботи.

Дослідницькі джерела: MobilityDatabase, MobilityData feed API/catalogs, GBFS systems.csv, Transitland Atlas, awesome-transit, public-transport API catalog, transport.data.gouv.fr, data.gov.ua, Київ/Lviv/Loda open-data, Geofabrik. Українські та міські GTFS/GTFS-RT; мікромобільність Citybik.es, Nextbike, JCDecaux, Lime, Voi, Dott, Fluctuo, SharedMobility. Окремо перевірити Zelectra/3electra, BikeNow/Nextbike, Bolt, Getmancar. Попутки: MARSHGO API, CarpoolWorld, Mobicoop; BlaBlaCar перевіряти за офіційним доступом і не плутати приватні попутки з автобусним IMS. Автобус/залізниця: Bussystem, Distribusion, Busbud, Omio, BlaBlaCar IMS, All Aboard, Deutsche Bahn, SNCF; окремо партнерські можливості УЗ, Tickets.ua, PROIZD. Таксі/трансфер: Karhoo, Mozio, FREE NOW, Kiwitaxi, Intui, 838, Uklon, Bolt і локальні диспетчерські. Для Європи: PID/Golemio, Kraków GTFS, BKK, Entur, Digitransit, Navitia, TfL, TransportAPI.

Для кожного провайдера встановити власника, покриття, ліцензію/комерційні права, auth, квоти, свіжість, формат, health, capabilities, виконаний probe і фактичне використання. Розділяти timetable, live position, ETA, fare, availability, deep link, booking, cancel, tracking. Не називати інтеграцію готовою через URL/adapter; GBFS не гарантує анонімний доступ чи бронювання. OSM — не live inventory. Іноземний feed не доводить українське покриття. Ключі/договори фіксувати зовнішнім блокером; SSRF-захист не вимикати.

Перевіряти повторне використання ліцензійного й підтримуваного коду: pybikes, gbfs-api, x2gbfs, ipl-orchestration, hafas-client/rest API, OpenTripPlanner, MOTIS, TOMP API, GTFS/GTFS-RT/GBFS validators, GTFS-RT bindings, GBFS JSON schema. Не копіювати цілий проект і не заміняти чинний engine без доведеної потреби.

## Маршрутизаційна коректність

Замкнути шлях: source → normalization → planner → result → map → booking доступних сегментів → journey lifecycle → monitoring/rerouting. Враховувати GTFS calendars/exceptions, timezone, час понад 24:00, directions/stops/shapes/transfers/pathways, затримки/скасування, walking time, boarding buffer, availability і правила оператора.

Не видавати пряму лінію між зупинками за перевірений walking path; unknown fare не є нулем; запланований маршрут не є бронюванням. Bike/scooter допускається тільки за правилами мережі; послідовності оренд перевіряти на здійсненність. Не дублювати рейс з агрегаторів; відокремлювати рейс від продавців. Після скасування шукати альтернативи, але не створювати платне замовлення чи обіцяти refund без дозволу й API.

## Кеш, оптимізація та рефакторинг

Спершу встановити зміст Radius/smart cache; зберегти придатну систему. Окремі шари: static, timetable, realtime, rental availability, routing, journey results, quotes, персональні дані. Перевірити версії ключів, geo cells/neighbor cells, радіус, timezone, час, preferences, invalidation, TTL, bounded L1/L2, single-flight, stampede, Redis outage й ізоляцію користувачів. Booking, тарифи, місця й idempotency повторно валідує Server. Auth/rate-limit не переводити у безумовний fail-open.

Оптимізувати SQL/PostGIS, індекси, pools, jobs, bundle, фото, lazy loading, списки, subscriptions і MapLibre viewport queries/LOD/clustering. Вимірювати cold/warm, p50/p95/p99, помилки, RAM/CPU, cache hit/eviction і upstream calls. Розрізняти 1000 користувачів, 1000 WebSocket і 1000 HTTP RPS; навантаження лише в дозволеному ізольованому середовищі, не на публічних фідах. Мертвий код видаляти лише після перевірки імпортів, dynamic routes, scripts і regression tests.

## Safari, PWA і безпека

Відтворити Safari white-screen симптом, а не здогадуватись. Перевірити service worker після deploy, stale HTML/chunks, dynamic imports, base path, MIME/CSP/CORS, cookies/refresh, storage, tiles/fonts/assets, deep links, reload, offline/reconnect і resume. Додати error boundary та контрольоване відновлення без нескінченних reload; SW update не втрачає введене й активну поїздку. WebKit automation ≠ фізичний Safari/iPhone; невиконане позначити `NOT_TESTED`.

Перевірити OTP, refresh rotation/revocation, cookies, CORS/CSRF, tenant isolation, доступ до чужих booking/journey/chat, приватність GPS, upload/S3, audit, export/deletion і відсутність self-grant admin. Секрети тільки серверні; не виводити їх, токени, приватні URL чи персональні дані. Не вимикати перевірки безпеки. Тестувати два акаунти й повний цикл водія/пасажира, конкурентне останнє місце, idempotency/double-cancel, reverse marketplace/chat/inbox, feed failure, пересадки/fare/cancellation, navigation/reroute/session, Admin/Partner/tenant, PWA/offline/deep links, міграції/backup/restore, adaptive production screens. Skip ≠ PASS. Screenshot без візуального огляду ≠ acceptance.

## Реліз та iOS

Знайти реальну deployment config, домен, API origin та deployed SHA. Localhost/dist/зелений CI не є production. Послідовність: узгоджений кандидат → checks → staging → browser/visual/provider acceptance → backup/migrations/rollback → production artifact → дозволений rollout → HTTPS smoke → звірка manifest. Manifest містить точні SHA Server/Site/Admin/Partner/iOS, API contract, migration, перевірки й фактичне coverage. Не ставити `RELEASED` без доказу.

Коли обов’язкове погодження для deployment — спершу підготувати reviewable candidate, preview, manifest і rollback; просити тільки останню заблоковану дію. iOS після стабілізації web/API: прив’язати точний Site SHA, Capacitor sync, safe area, API origin, permissions/deep links. Не запускати повний iOS build після кожної CSS правки. Unsigned simulator build ≠ TestFlight/App Store.

## Умови завершення і фінальний звіт

- `WEB_RELEASE_READY`: заявлені web сценарії завершені, репозиторії узгоджені, перевірки пройдені, критичних/високих дефектів немає, artifact/config/rollback підготовлені.
- `WEB_DEPLOYED_VERIFIED`: додатково є дозволений deploy, HTTPS smoke і звірка deployed SHA.
- `FULL_REQUEST_COMPLETE`: додатково закриті всі вимоги цього завдання, погоджено покриття 12 категорій і пройдені потрібні зовнішні та iOS gates.

Не призначати довільні відсотки; зовнішній ключ/договір не маскувати під готовність. Обмежений реліз з чесно описаним coverage не означає, що вимогу «все підключено» виконано. Фінальний звіт має перелічити завершене, зміни інтерфейсів, реальні джерела/міста/capabilities, перевірки й докази, SHA/PR, production/preview URL, блокери й runbook.

---

Це живий канон завдання. Його наявність не доводить, що перелічені вимоги реалізовані або перевірені.
