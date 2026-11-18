# Порівняння функцій у чотирьох репозиторіях

**Знімок коду:** MarshGO `a008749cbc6b8dadd6eb15ff51c861b08f507e3f` (звітний commit `ca5e9abb…`), Server `cf82c68bc00d343f3a4e691e860259f5ca1acd04`, Site `570ea7b9faa3d55a7e24599657c86fb2903d4cce`, iOS `68f69a32886d6db248bbac627b78f076bc7efe7a`.

`PRODUCTION_VERIFIED` не присвоюється лише через наявність маршруту, адаптера або зеленого build. Поточний production endpoint і staging acceptance не підтверджені, тому жоден продуктний модуль не має такого статусу.

| Функція | Legacy `MarshGO` | `MarshGO-Server` | `MarshGO-Site` | `MarshGO-iOS` | Фактичний висновок |
|---|---|---|---|---|---|
| Backend/API/DB | `server/index.ts`, міграції `001–047`, PostGIS/Redis; інтеграційний umbrella | Самостійний API, `server/`, 43 SQL-файли до `044`, unit/API/DB/Redis CI | Немає серверного runtime | Немає серверного runtime | Цільовий backend — Server. Legacy має додаткові runtime endpoints і несумісну міграційну історію; міграція не завершена. Server CI на branch SHA успішний, production не прийнятий. |
| Search/Journey | API `journeys/search`; legacy UI `SearchExperienceV6`; другий `multimodalChainEngine` не видно в API call graph | Основний пошук через `server/journey/search.ts`, timetable, scoring, transfers, GTFS/static+RT; provider choices | API-клієнт і `JourneyResultsPanel`, `JourneyRouteMapScreen` для чинного Journey API | Відображає Site bundle | Реальне комбінування підтверджується тестами для обмежених feed сценаріїв; всі 12 режимів як live пропозиції не доведені. Інтеграція часткова. |
| Бронювання / marketplace | API і UI функції; локальні mock-файли поруч із runtime | Цільова бізнес-логіка, migrations, transactional integration suites | Server-backed пошук/пропозиції/бронювання | WebView використовує API base URL | Серверні контрольовані бронювання перевірені; user-facing повний staging lifecycle не прийнятий. |
| Rescue / скасування | Endpoint і екран альтернатив; відстеження змін booking | Endpoint/логіка є в branch; release notes визнають повний disruption replan неповним | Показує доступні пропозиції після скасування | Той самий web UI | Це пошук/вибір альтернатив, не повна автоматична перебудова з live route та збереженням бронювання. `PARTIAL`. |
| Чат / сповіщення | WebSocket/outbox, lifecycle features; пуш-провайдер не доведений | Server API/WS/outbox і інтеграційні тести | UI працює через API client/realtime | WKWebView wrapper; native push не завершений | Web realtime — перевіряти на staging; APNs — `BLOCKED_EXTERNAL`/не реалізовано. |
| Навігація / GPS | API navigation session, tracker, web foreground GPS | Server session, location, stop optimizer/reroute | Navigation/map screens, foreground location | Capacitor native shell, не окремий React UI | Симуляторний build не доводить GPS lifecycle; background GPS, physical iPhone, permissions і польова reroute перевірка лишаються відкритими. |
| GTFS/GTFS-RT/GBFS та динамічний транспорт | Має catalog, poller/cache/ETA runtime, додаткові Kyoto/Kyiv graph prototypes; кілька modules відсутні в цільовому Server | Має adapters/registry/health, GTFS timetable/RT, live vehicles; різний набір модулів | Provider selection, layers, journey views | Відтворює Site | Є код і CI, але provider health/ліцензії/freshness потрібно перевіряти джерело за джерелом. Таксі, трансфери, каршеринг і private supply не можна вважати доступними без інтеграції. |
| Дизайн результатів та деталей | Світла/темна тема, Journey results + map sheet; canonical images у legacy | API contracts, без клієнтської UI | Поточне джерело UI; світла/темна теми, search results і route map sheet; нові canonical dark references з’явилися між Site `1745822…` та `570ea7b…` | Не містить незалежних React sources; збирає Site | Архітектура UI відповідає запиту. iOS release workflow пінить `1745822…`, який є ancestor `570ea7b…`, отже зафіксований iOS build не включає останній змінений набір дизайну. Pixel-diff acceptance ще не проведений. |
| 12 transport categories | `domain/transportRegistry.ts` і пошукова модель; категорії/кольори дублюються | Server canonical preference/model і normalization | Публічний UI вибору та сегментів | Через Site | Список типів закодований у кількох шарах. Потрібні спільний API contract/version та тести сумісності; наявність категорії не означає активного провайдера. |
| Адмінка/модерація | API і UI mobility/verification/moderation | Цільовий API та міграції | Адмін-екрани в спільному UI | WebView | Тестуються окремі RBAC шляхи; повний live operator process не прийнятий. |
| Mobile wrapper | Застарілий дубль Capacitor каталогу | Немає iOS-коду | Єдине джерело web UI/PWA | Тонкий Capacitor/Xcode wrapper; `webDir=web/dist`, `site:checkout` бере Site SHA | Вимогу «без другого React app» виконано. Потрібен узгоджений актуальний Site SHA перед RC. |
| CI/release/deployment | Тут лежать E2E orchestration, `RELEASE_MANIFEST`, `materialize-release`, production Compose/backup/restore | Backend CI, SQL/DB/Redis suite | Frontend CI/build | Simulator CI і Site pinning | Legacy поки є власником релізного процесу та production build context; до архіву це треба перенести/перевласнити і перевірити автономність. |

## Кількісне порівняння однакових відносних шляхів

Хешування файлів між поточною legacy робочою гілкою та цільовими репозиторіями (ігноруючи Git metadata і generated dependencies) дає:

| Пара | Legacy files | Target files | Спільні шляхи | Побайтно однакові | Відмінні | Лише в legacy / лише в target |
|---|---:|---:|---:|---:|---:|---:|
| `server/` vs Server `server/` | 106 | 94 | 85 | 65 | 20 | 21 / 9 |
| `src/` vs Site `src/` | 153 | 105 | 96 | 50 | 46 | 57 / 9 |
| `tests/` vs Server `tests/` | 63 | 37 | 32 | 19 | 13 | 31 / 5 |

Отже, копії не є синхронізованими. Особливо відрізняються API entry, Journey timetable/planner/search/scoring/types, provider catalogs, geocoding/config/storage, головні marketplace/search/navigation UI й integration tests. Хеші описують файлову подібність, а не еквівалентність поведінки.

## Критичні висновки порівняння

1. Server є правильним власником backend, Site — користувацького React/PWA UI, iOS — Capacitor shell. Архітектурного дубля React у iOS repo немає.
2. Legacy лишається функціонально значущим umbrella, а не безпечним для архівації архівом: тут є runtime endpoints, stop ETA/cache, тести, release матеріалізація і deployment assets.
3. Конфлікт SQL migration IDs `041`, `043`, `044` — блокер будь-якого спільного релізу/перенесення до звірки `schema_migrations` і підготовки сумісного upgrade path.
4. За release manifest Server/Site/iOS задекларовані як `NOT_RELEASED`; немає production deployment, production database або physical-device acceptance. Документований staging URL був offline під час останнього recheck у manifest.
5. iOS workflow exact SHA check правильний, але pinned Site наразі відстає від актуального branch SHA `570ea7b…` і не містить чотири dark canonical reference images, додані пізнішим commit.


## Актуалізація після baseline

Порівняльна таблиця вище зафіксована на старих SHA; актуальні гілки тепер мають такі перевірені дельти:

| Репозиторій / гілка | Поточний перевірений SHA | Новий доказ | Що лишається невирішеним |
|---|---|---|---|
| MarshGO legacy / `codex/marshgo-production` | `1e8fbca…` перед поточним набором E2E/manifest змін | Root CI на SHA `1e8fbca…` використовував Site `570ea7b…`, Server `cf82c68…`; пройшли build, typecheck, lint, unit, DB migrations та PostGIS/Redis API integration. Browser E2E: 6 pass / 6 fail. | Root rerun із актуальним Server pin і виправленими canonical-Site селекторами ще очікує CI. Не зливати гілку в `main`. |
| MarshGO-Server / `codex/sync-mobility-registry` | `4e32ac3ede97aff715d0604dcf02af7fedd00547` | Corridor matching, schedule/realtime stop arrivals і правильне розділення GTFS-RT/GPS timestamps; exact-SHA push та PR CI пройшли. | Реальні feed credentials/coverage, production/staging і provider-specific API acceptance не підтверджені. |
| MarshGO-Site / `codex/sync-journey-mobility-ui` | `570ea7b9faa3d55a7e24599657c86fb2903d4cce` | Site unit/typecheck/lint/build CI успішні; цей SHA є спільним source для Web/PWA та iOS wrapper. | PR #3 має `DIRTY` merge state; cross-repo E2E не пройшов; піксельне порівняння з канонічними скриншотами окремо не підтверджено. |
| MarshGO-iOS / `codex/reliable-capacitor-sync` | `d9a9c4392031cb08b2ecbc31cb959d44e483ab72` | Обидва exact-SHA Simulator CI runs успішні; iOS workflow пінить Site `570ea7b…`. | Немає фізичного iPhone acceptance для GPS/APNs/background/deep links і підписаного TestFlight build. |

Зміни Server виконані у target-native реалізації. Жоден результат не означає, що весь унікальний код або інфраструктура legacy вже перенесені; root лишається owner міжрепозиторного materializer/E2E, а план безпечного archive не готовий.
