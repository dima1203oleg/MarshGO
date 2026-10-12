# Інвентаризація legacy MarshGO

**Аудитований код:** `codex/marshgo-production` на `a008749cbc6b8dadd6eb15ff51c861b08f507e3f` (звітний commit лише додає baseline); для порівняння — `main` на `1e7d0ee74f11121a7d5a29c6379944a5360581c4`.
**Дата аудиту:** 12.10.2026.

## Методика та значення статусів

Перевірено production entry points, статичні імпорти, серверні маршрути, міграції, тести, Docker/Compose і GitHub Actions. Наявність файлу сама по собі не вважається доказом виконання. `PRODUCTION_VERIFIED` вимагає поточної перевірки на доступному production/staging; такого доказу на початку аудиту немає. `INTEGRATION_VERIFIED` означає, що конкретний кодовий шлях підтверджений тестом з реальною БД/API в CI, а не що він обслуговує реальних користувачів.

## `main` та робоча гілка

`main` — малий React/Vite prototype (`package.json` називає його `react-example`): містить `src`, `public`, Vite і базовий CI, але в його дереві немає `server/`, API, БД, міграцій, Compose чи release orchestration. Тому `main` не є актуальною серверною або мобільною реалізацією.

Робоча гілка має 302 коміти попереду `main` та приблизно 533 змінені файли. У ній з’явилися окремі API/DB, lifecycle та journey modules, тести, дизайн-референси, deployment і релізна оркестрація. Цей набір не можна вважати однорідною міграцією: у ньому є як активний runtime, так і непідключені прототипи/адаптери.

## Точки входу та межі production runtime

| Область | Фактична точка входу | Спостереження | Статус на рівні репозиторію |
|---|---|---|---|
| Веб/PWA | `src/main.tsx` → `views/ProductionMarketplace.tsx` | Основний екран використовує `services/productionApi`; сторінки й досвіди завантажуються з runtime entry. | `LOCAL_WORKING`; зовнішній acceptance відсутній |
| Локальний prototype | `src/services/storage.ts` → `data/seedData.ts` | У production entry graph немає імпорту `storage`/`MarshgoRepository`; не є доказом production API. Файл залишився поруч із live UI. | `DEMO_MOCK` / кандидат на видалення лише після повного посилального аудиту |
| API | `server/index.ts` | Один великий Express entry point обслуговує auth, marketplace, journeys, navigation, mobility і realtime. | `INTEGRATION_VERIFIED` лише для CI сценаріїв; повний сервісний acceptance не виконаний |
| БД | `server/migrate.ts`, `server/migrations/*.sql` | 47 міграцій до `047`; PostGIS та PostgreSQL є частиною локального/CI профілю. | `INTEGRATION_VERIFIED` для перевірених міграцій і тестів; production DB не налаштована |
| Redis/realtime | API rate limit, outbox/WebSocket і Redis integration tests | Код передбачає Redis, але не підтверджено production кластер, відновлення чи реальне навантаження. | `INTEGRATION_VERIFIED` у CI / `LOCAL_WORKING` в експлуатаційному сенсі |
| Release source | `ops/scripts/materialize-release.mjs`, `RELEASE_MANIFEST.json`, `compose.production.yml` | Матеріалізатор клонує Server і Site за SHA з manifest, генерує Docker inputs у тих checkout і переписує Compose build context. Оркестратор релізу все ще лежить у legacy. | `LOCAL_WORKING`; release manifest прямо має `NOT_RELEASED` |
| iOS | `ios/App` у legacy | Є також зібраний web bundle у native resources; окремо підтримуваний iOS clone є в `MarshGO-iOS`. | Не є цільовим джерелом iOS |

## Інвентар функціональних модулів

| Модуль | Реалізація та runtime | Тести / статус | Висновок для міграції |
|---|---|---|---|
| Auth, OTP, сесії, ролі | `server/index.ts`, `server/auth/`, `server/sms.ts`; HTTP OTP/Firebase entry points підключені | Серверні unit та API сценарії; відправка живих SMS/Firebase з production credentials не перевірена. `INTEGRATION_VERIFIED` для тестових шляхів, `BLOCKED_EXTERNAL` для live SMS |
| Профіль, документи, фото авто, верифікація | API маршрути та `server/vehiclePhotos.ts`, `server/objectStorage.ts`; UI в `ProductionMarketplace`/profile features | Є API та unit/integration тести; живий bucket, реальна верифікація й staff процес не прийняті. `INTEGRATION_VERIFIED` / `BLOCKED_EXTERNAL` |
| Попутки, заявки, пропозиції, переговори | `offers`, `demands`, proposals та booking handlers у `server/index.ts`; активні Site-клієнти викликають `productionApi` | Тести бронювань і редагування поїздок є. На цільовому Server є окремі passing integration checks. `INTEGRATION_VERIFIED` для тестового backend |
| Бронювання, місця, скасування, комісії | Транзакційні API у `server/index.ts`, `server/fees.ts`, міграції booking lifecycle | CI включає API booking/restart сценарії. Живий процесинг/платіж не доведений. `INTEGRATION_VERIFIED` для booking flows; платежі — `PARTIAL` |
| Rescue після скасування | API `/api/v1/bookings/:id/rescue`; UI показує інші опубліковані пропозиції | Пошук альтернатив є, але підтверджене автоматичне перебронювання або повне disruption-rescue не доведені. `PARTIAL` |
| Чат, повідомлення, realtime | WebSocket/outbox, `TripLifecycleCoordinator`, `TripChatView`, notification API | Є realtime/notification тести; мобільний push/APNs і польове reconnect acceptance не підтверджені. `INTEGRATION_VERIFIED` для локального realtime / `BLOCKED_EXTERNAL` для push |
| Дорожнє та активне GPS-навігування | `server/routing/`, `server/navigation/`, navigation session/location/reroute endpoints; web використовує foreground location | Є navigation/routing тести. OSRM/geocoder endpoints вимагають конфігурації; фонова iOS геолокація не завершена. `INTEGRATION_VERIFIED` для тестових маршрутів / `BLOCKED_EXTERNAL` для сервісів і background GPS |
| Journey Engine | `server/journey/{search,planner,gtfsTimetable,gtfsRealtime,scoring,transferEngine,types}.ts`; endpoint `/api/v1/journeys/search` | Пакет алгоритмічних тестів і journey schema integration. Реальне покриття міських feed-ів, комерційних тарифів і всіх 12 категорій не підтверджене. `INTEGRATION_VERIFIED` для контрольованих feed/DB сценаріїв, загальна функція — `PARTIAL` |
| Kyiv stop ETA та position cache | `journey/arrivalEngine.ts`, `mobility/vehiclePositionCache.ts`, `mobility/realtimePoller.ts`; підключені до `server/index.ts` stop-arrivals/vehicle endpoints | Unit перевірки є; на цільовому Server ці шляхи не мають відповідних однойменних модулів. Живий feed не перевірено. `LOCAL_WORKING` |
| Розгалужений регіональний chain prototype | `journey/multimodalChainEngine.ts`, `mobility/{kyivTransitGraph,ukraineTransitGraph}.ts` | На перевіреному дереві посилання з тестів, але engine не викликається API runtime; частина графів вимагає окремої перевірки джерела даних. `DEMO_MOCK`/`LEGACY_ONLY` до доказу реального feed-backed виклику |
| Картографічні шари / міський транспорт | `mobility/registryService.ts`, `transportLayers.ts`, provider endpoints; частина Kyiv parking/road closures у `kyivPublicData.ts` підключена в API | Наявність endpoint і seed-каталогу не доводить, що провайдер підключений чи має права. `PARTIAL`; конкретний провайдер може бути `BLOCKED_EXTERNAL` |
| Комерційні адаптери | `providers/adapters/{IntercityAdapters,MicromobilityAdapters,PartnerTaxiAdapters,UberAdapter,MonobankAcquiringAdapter}.ts` | Rail/INFOBUS adapter повертають порожній список без partner inventory; Uber estimate не підтримує booking; тест-імпорти не доводять runtime registry wiring. `STUB` або `BLOCKED_EXTERNAL`, не доступний продукт |
| UI та затверджений дизайн | `JourneyResultsPanel`, `JourneyRouteMapScreen`, `ProductionMarketplace`; design images у `docs/design/canonical/` | Site CI проходить на `570ea7b…`; візуальний pixel diff цього аудиту ще не виконувався. `LOCAL_WORKING` |
| E2E, CI, скрипти | `e2e/`, `scripts/`, GitHub Actions, `tests/`, `tools/navigation-replay/` | На початковому SHA `MarshGO` CI ще виконував E2E; один із двох Security runs падав Gitleaks. Остаточний повторний результат очікує Stage 2. `PARTIAL` |

## Реальні джерела та межі покриття

Каталог `server/mobility/ukraineCatalog.ts` містить seed/config записи для GTFS, GTFS-RT, GBFS і міських API. У ньому явно відрізняються доступні open feeds, `requires credentials`, та вимкнені/непідтверджені endpoints. Ці записи — конфігурація адаптерів, а не доказ живої доступності, повноти розкладів, комерційних прав або GPS-якості. Adapter availability треба перевірити по кожному endpoint окремо у Stage 2/9; реальні зовнішні ключі/договори не знайдені/не підтверджені цим статичним аудитом.

## Короткий висновок

Legacy branch — інтеграційний umbrella: в ньому одночасно присутні server, web і native wrapper, а release materializer вже збирає окремі Server/Site за pinned SHA. Основна цінність для міграції — не автоматично дубльовані UI/API-копії, а перевірка унікальних runtime шляхів (stop ETA/vehicle cache, lifecycle UI, navigation behavior), історії БД, cross-repo E2E/release orchestration і дизайн/архітектурна документація. Архівувати legacy зараз не можна.
