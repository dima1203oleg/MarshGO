# MARSHGO — національний аудит транспортного покриття (27 × 12)

Дата вимірів: **2026-11-14** (усі проби виконані сьогодні, UTC).
База коду: `main` = **9477b73df9d70c34c7012547bf5cdb273a612737** (прочитано через GitHub contents API, не з локальних refs).
Статус продукту: **NOT_RELEASED**. Цей документ — доказова база, а не оголошення готовності.

## 1. Артефакти

| Файл | Вміст |
|---|---|
| [national-coverage-matrix-2026-11-14.csv](evidence/national-coverage-matrix-2026-11-14.csv) | 324 клітинки (27 адмінодиниць × 12 режимів), 24 колонки доказів |
| [national-coverage-gaps-2026-11-14.csv](evidence/national-coverage-gaps-2026-11-14.csv) | 245 клітинок, що не є `FULLY_VERIFIED` і не є `NOT_APPLICABLE` |
| [national-coverage-metrics-2026-11-14.json](evidence/national-coverage-metrics-2026-11-14.json) | 8 метрик: чисельник, знаменник, метод, значення, деталізація |
| [national-feed-measurements-2026-11-14.json](evidence/national-feed-measurements-2026-11-14.json) | 96 вимірів URL: HTTP-код, байти, час, Last-Modified, валідація вмісту, дефекти |
| [national-feed-candidates-2026-11-14.csv](evidence/national-feed-candidates-2026-11-14.csv) | 52 ресурси CKAN, витягнуті сьогодні з 10 портальних сторінок: ліцензія, рядки, координати, вердикт |
| [feed-probe-2026-11-14.tsv](evidence/feed-probe-2026-11-14.tsv) | P0-проби 33 дослідницьких записів (попередній етап, commit `dfaa497`) |

Матриця згенерована детермінованим скриптом із сирих вимірів; кожна клітинка має `reason`, `evidence_urls`,
`mode_counts`, `measurement_date`, `base_sha`. Жоден статус не виставлений «за пам'яттю» чи за назвою набору.

## 2. Метод і межі доказів

Джерела доказів, які **не змішувалися**:

1. **Каталог коду** — `ukraineCatalog.ts` (88 пласких записів) і `ukraineRegionalCatalog.ts` (26 регіонів × 12 режимів).
   Це заява, а не доказ: запис у каталозі не означає, що фід живий.
2. **БД `mobility_providers`** — 85 провайдерів, `last_report.counts` (модальні counts), `last_checked_at`.
   Це доказ інтеграції, але counts можуть бути застарілими; бралася найновіша `enabled`-запис.
3. **HTTP-проби сьогодні** — `curl -L --max-time` з production UA `MARSHGO-Mobility/1.0`
   (`MarshGO-Server/server/utils/safeFetch.ts`), фіксація коду, байтів, часу, `Last-Modified`, редиректів.
4. **Валідація вмісту сьогодні** — розпакування GTFS zip, підрахунок `routes.txt` за `route_type`,
   `trips.txt`, `feed_info`/`calendar`; ручне varint-декодування GTFS-RT protobuf (`FeedHeader.timestamp`,
   кількість entity); GBFS `last_updated`/`ttl`; JSON-масиви EasyWay з epoch-полями `time`.
5. **CKAN API** — `package_show`, `organization_show`, `package_search?fq=organization:<slug>` для звуження
   портальних сторінок до конкретних ресурсів і отримання `license_title`.

Обмеження, які треба знати, читаючи числа:

- У sweep-записах `bytes` обмежений `--max-filesize`; для великих zip валідація виконувалася окремим
  повним завантаженням, і саме його розмір наведено в полі `validation`. `bytes: 0` + `Maximum file size
  exceeded` у sweep-записі **не** означає порожній фід.
- `reachable` (HTTP 200) ≠ `validated` (перевірений вміст) ≠ інтегровано в БД. Це три різні колонки.
- Модальні counts у БД — це те, що сервер уже імпортував; вони не доводять свіжість фіда сьогодні.
- Севастополь відсутній у `UKRAINE_REGIONS` (26 з 27), тому його 12 клітинок = `UNKNOWN`, а не `SOURCE_MISSING`.

## 3. Правила статусів

| Статус | Умова |
|---|---|
| `FULLY_VERIFIED` | Є concrete-URL з HTTP 200 **і** валідацією вмісту сьогодні **і** модальними counts у БД для цього режиму, без непокритого дефекту якості |
| `PARTIALLY_COVERED` | Вміст валідовано, але модальних counts для режиму в БД немає; або HTTP 200 без валідації; або 200 з виміряним дефектом |
| `FEED_FOUND_NOT_INTEGRATED` | Конкретний ресурс знайдено й валідовано сьогодні, але його немає ні в клітинці регіону, ні в `mobility_providers` |
| `SOURCE_MISSING` | Каталог заявляє режим, але concrete-URL немає і жодного валідного джерела не знайдено |
| `PARTNER_ACCESS_REQUIRED` | Лише партнерські API / домашні сторінки / договірний доступ (taxi, carsharing, transfer, частково train) |
| `OUTDATED` | Єдине виміряне джерело має підтверджений вік вмісту (2018–2022 роки) |
| `NOT_APPLICABLE` | Каталог явно фіксує відсутність режиму в регіоні (напр. метро поза Києвом/Харковом/Дніпром/Кривим Рогом) |
| `UNKNOWN` | Немає доказів: регіон відсутній у каталозі, або недостатньо даних для вердикту |

Додаткові правила, щоб не завищувати покриття:

- **Per-source, не per-cell.** Дефект одного джерела не анулює валідне сусіднє, але й не ховається:
  клітинка лишається `FULLY_VERIFIED` лише якщо є хоча б одне чисте валідне джерело з counts,
  а всі виміряні дефекти виносяться в `extra` як `caveat: …`.
- **Sibling-static.** Режим доводиться статичним фідом того самого провайдера, коли RT не містить
  `route_type` (Львів: RT `vehicle_position` 426 entity + `static.zip` 8 маршрутів `type=0`, 2896 поїздок).
- **Region-proof.** Клітинка без concrete-URL піднімається лише тоді, коли фід того ж регіону явно
  містить цей режим (Полтава: `poltava.json` → `vehicles_trolleybus=15`).
- **Flat-catalog-proof.** Плаский каталог і регіональний **не синхронізовані**: робочі дзеркала
  (Одеса mdb-2946, Буча mdb-2945, Малин, EasyWay Чернівці/Рівне/Коростень) є лише в пласкому.
  Такі клітинки позначені `FEED_FOUND_NOT_INTEGRATED` з точним URL — це готовий backlog інтеграції.
- **Scope-дефект.** Фід, що формально валідний, але покриває лише 2 міжнародні маршрути
  (VD-Express Миколаїв–Фано), не дає національного покриття й фіксується як дефект.

## 4. Зведення матриці

324 клітинки, **245** непокритих/часткових. Розподіл статусів:

| Статус | Кількість |
|---|---|
| FULLY_VERIFIED | **10** |
| PARTIALLY_COVERED | 56 |
| FEED_FOUND_NOT_INTEGRATED | 14 |
| PARTNER_ACCESS_REQUIRED | 28 |
| SOURCE_MISSING | 131 |
| NOT_APPLICABLE | 69 |
| OUTDATED | 3 |
| UNKNOWN | 13 |

По регіонах (FV = FULLY_VERIFIED, PC = PARTIALLY_COVERED, FNI = FEED_FOUND_NOT_INTEGRATED,
PAR = PARTNER_ACCESS_REQUIRED, SM = SOURCE_MISSING, NA = NOT_APPLICABLE, OUT = OUTDATED, UNK = UNKNOWN):

| Регіон | FV | PC | FNI | PAR | SM | NA | OUT | UNK |
|---|---|---|---|---|---|---|---|---|
| місто Київ | 3 | 3 | 1 | 3 | 1 | 0 | 0 | 1 |
| Львівська | 3 | 3 | 0 | 2 | 3 | 1 | 0 | 0 |
| Полтавська | 3 | 1 | 0 | 1 | 4 | 3 | 0 | 0 |
| Закарпатська | 1 | 2 | 0 | 1 | 4 | 4 | 0 | 0 |
| Івано-Франківська | 0 | 4 | 0 | 1 | 4 | 3 | 0 | 0 |
| Сумська | 0 | 4 | 0 | 1 | 4 | 2 | 1 | 0 |
| Хмельницька | 0 | 3 | 1 | 1 | 4 | 3 | 0 | 0 |
| Кіровоградська | 0 | 3 | 0 | 1 | 5 | 3 | 0 | 0 |
| Чернівецька | 0 | 1 | 3 | 1 | 4 | 3 | 0 | 0 |
| Одеська | 0 | 1 | 3 | 1 | 5 | 2 | 0 | 0 |
| Рівненська | 0 | 2 | 2 | 1 | 4 | 3 | 0 | 0 |
| Житомирська | 0 | 1 | 2 | 1 | 6 | 2 | 0 | 0 |
| Київська | 0 | 2 | 1 | 1 | 6 | 2 | 0 | 0 |
| Вінницька | 0 | 2 | 1 | 1 | 4 | 2 | 2 | 0 |
| Дніпропетровська | 0 | 2 | 0 | 1 | 9 | 0 | 0 | 0 |
| Харківська | 0 | 2 | 0 | 1 | 8 | 1 | 0 | 0 |
| Черкаська | 0 | 2 | 0 | 1 | 6 | 3 | 0 | 0 |
| Чернігівська | 0 | 2 | 0 | 1 | 6 | 3 | 0 | 0 |
| Волинська | 0 | 2 | 0 | 1 | 6 | 3 | 0 | 0 |
| Тернопільська | 0 | 2 | 0 | 1 | 6 | 3 | 0 | 0 |
| Миколаївська | 0 | 2 | 0 | 1 | 7 | 2 | 0 | 0 |
| Запорізька | 0 | 2 | 0 | 1 | 7 | 2 | 0 | 0 |
| Херсонська | 0 | 2 | 0 | 1 | 5 | 4 | 0 | 0 |
| Донецька | 0 | 2 | 0 | 1 | 5 | 4 | 0 | 0 |
| Луганська | 0 | 2 | 0 | 1 | 4 | 5 | 0 | 0 |
| АР Крим | 0 | 2 | 0 | 0 | 4 | 6 | 0 | 0 |
| місто Севастополь | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 12 |

Прогалини за режимами (усе, крім FV і NA): carpool 27, train 27, transfer 27, bike 27, taxi 26,
marshrutka 25, bus 23, scooter 23, trolleybus 22, tram 9, metro 4, carsharing 5.
Тобто **жоден із 12 режимів не покритий національно**; 4 режими (carpool, train, transfer, bike)
не мають жодної доведеної клітинки.

## 5. Вісім метрик покриття

| ID | Метрика | Чисельник | Знаменник | Значення | Метод |
|---|---|---|---|---|---|
| M1 | Адміністративне покриття | 4 | 27 | 14.81 % | Регіони з ≥1 `FULLY_VERIFIED` сьогодні. 27 = 24 області + АР Крим + Київ + Севастополь |
| M2 | Модальне покриття | 4 | 12 | 33.33 % | Режими з ≥1 `FULLY_VERIFIED`: bus, marshrutka, tram, trolleybus. Знаменник = `canonicalTransportTypes.length` |
| M3 | Покриття клітинок | 10 | 324 | 3.09 % | `FULLY_VERIFIED` / (27×12). Каталог покриває 312; 12 клітинок Севастополя = UNKNOWN |
| M4 | Інтеграція відомих відкритих ресурсів | 86 | 140 | 61.43 % | Унікальні нормалізовані concrete-resource URL з `access=OPEN` (каталог + регіональний каталог + CKAN-ресурси, витягнуті сьогодні; фінансові/звітні набори виключені). Чисельник — присутні в каталозі або `mobility_providers` |
| M5 | Realtime-покриття регіонів | 3 | 12 | 25.00 % | ~~timestamp у межах доби~~ **ЗАМІНЕНО M5-90s (див. §14): початковий метод був м'якший за продуктовий гейт 90 с** |
| M5-90s | Realtime-покриття (гейт 90 с) | 5 | 12 | 41.67 % | Проби 18:19–18:22 UTC: ≥1 транзитний RT/JSON-фід регіону проходить 90-секундний гейт без дефекту якості / 12 регіонів із заявленим concrete RT |
| M6 | Свіжість вмісту ≤24 год | 17 | 25 | 68.00 % | Лише джерела з **виміряною** датою вмісту (Last-Modified / FeedHeader.ts / feed_info). Без дати = NOT_MEASURED і в знаменник не входить |
| M7 | Ліцензійна прозорість каталогу | 84 | 88 | 95.45 % | Записи з непорожнім `license`. Окремо: 52/52 портальні CKAN-ресурси мають `license_title` (CC-BY); `data.kyivcity.gov.ua` → `license_title: null` = LICENSE_UNKNOWN |
| M8 | Доведена маршрутизація на реальних фідах | — | — | **NOT_MEASURED** | Успішні планування / виконані O/D-пари (місто, приміська, міжобласна, мультимодальна × 3 стратегії). Прогон ще не виконано |

M4: **54 відомі відкриті ресурси не інтегровані** — повний список у `national-coverage-metrics-2026-11-14.json`
(`detail.not_integrated_sample` — перші 25; решта виводиться з матриці та candidates CSV).

M5 live: Івано-Франківська (Dozor), Львівська (ua-gis RT), Полтавська (EasyWay).
Лише заявлені, але не підтверджені сьогодні: Дніпропетровська, Хмельницька, Кіровоградська, Київ,
Київська, Рівненська, Сумська, Вінницька, Закарпатська.

M6 застарілі (год): fsn1 7824.9, Chornomorsk-2019 63030.8, EasyWay Konotop 6511.2 (порожній `[]`),
gps.sumy.ua 740.7, UZ-дзеркало 112.3, malin 99.7, Kyiv routes.csv 2282.6, Kyiv stops.json 1082.9.

**M8 не виміряна — це головний відкритий гейт.** Наявність фіда не доводить, що планувальник будує
маршрут. Без M8 будь-яке «покриття» лишається покриттям даних, а не продукту.

## 6. Доведені клітинки (10 FULLY_VERIFIED)

| Регіон | Режим | Доказ сьогодні | Counts у БД |
|---|---|---|---|
| Київ | bus | `jbb.ghsq.de/gtfs/ua-kyiv.gtfs.zip` — HTTP 200, валідовано | `routes_bus=107` |
| Київ | trolleybus | той самий zip, `route_type=11` | `routes_trolleybus=43` |
| Київ | tram | той самий zip, `route_type=0` | `routes_tram=17` |
| Львівська | bus | `track.ua-gis.com/gtfs/lviv/static.zip` — 72 маршрути (64 type=3 + 8 type=0), 15606 поїздок, `feed_info` 20261114–20271112 v6.508, Last-Modified 2026-11-14T00:06:54Z | `routes_bus=64` |
| Львівська | marshrutka | `public.easyway.info/gps/chervonograd.json` — живі позиції | `vehicles_marshrutka=8` |
| Львівська | tram | RT `vehicle_position` 426 entity, FeedHeader.ts 14:37:23Z + sibling `static.zip` 8 маршрутів type=0 / 2896 поїздок | sibling-static |
| Закарпатська | bus | `track.ua-gis.com/gtfs/uzhhorod/static.zip` — валідовано | `routes_bus=18` |
| Полтавська | bus | `public.easyway.info/gps/poltava.json` — живі позиції | `vehicles_bus=15` |
| Полтавська | marshrutka | той самий JSON | `vehicles_marshrutka=129` |
| Полтавська | trolleybus | region-proof: `poltava.json` | `vehicles_trolleybus=15` |

Caveats, зафіксовані в матриці (не приховані):

- Київ bus, Львівська bus, Закарпатська bus, Полтавська bus мають у клітинці також
  `gtfs.fsn1.your-objectstorage.com` (1 маршрут / 2 зупинки / 45 поїздок — національне покриття
  не підтверджене вмістом) і `vdexpress.net/api/gtfs/feed` (лише 2 маршрути Миколаїв–Фано,
  37 зупинок, інтермітентні connect-помилки). Статус FV тримається на чистому джерелі, дефекти винесені в `extra`.
- Львівська trolleybus = `PARTIALLY_COVERED`: у `static.zip` **0 маршрутів type=11**.
- Львівська marshrutka: 64 маршрути type=3 не диференційовані на автобус/маршрутку;
  `vehicles_marshrutka=8` походить з EasyWay Червоноград, а не з розкладу.

## 7. Знайдені, але не інтегровані (14) — готовий backlog

Це найцінніший результат аудиту: ресурси **валідовані сьогодні**, юридично відкриті, але відсутні
в регіональних клітинках і в `mobility_providers`.
Виняток — Малин (див. рядок нижче): ліцензія вимагає договору. EasyWay-ряди мають ліцензійну мітку без явного дозволу
на комерційне використання, тож політика `licensePolicy.ts` зареєструє їх як `disabled` (`LICENSE_UNVERIFIED`).

| Регіон | Режим(и) | Ресурс | Вимір сьогодні |
|---|---|---|---|
| Одеська | bus, tram, trolleybus | `files.mobilitydatabase.org/mdb-2946/latest.zip` | routes.txt 87 = 62 type=3 + 18 type=0 + 7 type=11 |
| Київська | bus | `files.mobilitydatabase.org/mdb-2945/latest.zip` (Буча) | routes.txt 4, усі type=3 |
| Житомирська | bus | `malin.kiev.ua/transport/gtfs.zip` | routes.txt 9, усі type=3; `feed_info` malin.kiev.ua; вік 99.7 год. **ВИПРАВЛЕНО 2026-11-14: НЕ юридично відкритий** — `LICENSE.txt` у mdb-3615: OwnNet Source License 1.1, source-available, share-alike, вільно лише до 100 000 USD доходу; платний SaaS — за письмовим договором → REQUIRES_PARTNERSHIP (MarshGO-Server PR #155). Прямий URL 2026-11-14 16:19 UTC віддав 0 B |
| Житомирська | marshrutka | `public.easyway.info/gps/korosten.json` | 10 ТЗ, 10/10 валідних координат, свіжі timestamp |
| Рівненська | bus, trolleybus | `public.easyway.info/gps/rivne.json` | 99 ТЗ, 99/99 валідних координат |
| Чернівецька | bus, marshrutka | `public.easyway.info/gps/chernivtsi.json` | 61 ТЗ, 61/61 валідних координат |
| Чернівецька | trolleybus | CKAN: `routes.csv` 57 (46 bus + 11 trolleybus), `vehicles` 254, `agency` 35 | Last-Modified 2025-02-07; `stop_times` 45 рядків + calendar 2024 = STUB |
| Хмельницька | trolleybus | `admin-gis.khm.gov.ua/...stops.json` | INTERMITTENT: 200 + 99 017 B (total=291, cdate 2020-08-21) одного разу, 60 s timeout іншого |
| Київ | marshrutka | `data.kyivcity.gov.ua/.../routes.csv` | 96 маршрутів type=3 з кінцевими/тривалістю/інтервалом, Last-Modified 2026-08-11; ліцензія null |
| Вінницька | marshrutka | CKAN-ресурс відомий, не зареєстрований | вміст 2018 року → окремо OUTDATED для tram/trolleybus |

Додатково валідовані ресурси, придатні для збагачення (не для нового режиму):

- **Івано-Франківськ**: `stops` 270 (268 валідних координат, 2 поза межами України),
  `vehicles` 242 з `wheelchairAccessible`/`isLowFloor`/`capacity`/`bikesAllowed` — готове джерело
  accessibility-бейджів; `agency.csv` 13 перевізників з контактами. Ліцензія Creative Commons Attribution.
- **Хмельницький**: `stops.csv` 508 зупинок, **508/508** валідних координат,
  bbox 49.330–49.542 / 26.739–27.269, Last-Modified 2026-03-24, ліцензія cc-by.
- **Київ**: `31725604_stops.json` 2991 зупинка, 100 % валідних координат, Last-Modified 2026-09-30
  (вік 1082.9 год — свіжість за M6 не проходить, але вміст валідний).

## 8. Мертві та непридатні записи каталогу

### 8.1. Київ: 15 записів не працюють

- **7** прямих URL `gisserver.kyivcity.gov.ua/mayno/rest/services/KYIV_API/transport_public/MapServer/{1,4,5,12,13,14,15}/query`
  → `curl: (6) Could not resolve host` (NXDOMAIN).
- **8** записів `data.kyivcity.gov.ua/dataset/rozklad-rukhu-…` і `…mistse-rozmishchennia-zupynok-…`
  → HTTP 302 на `gisserver-stage.kyivcity.gov.ua`, який **також NXDOMAIN**.

Тобто 15 з 88 пласких записів каталогу — мертві. Робоча заміна для Києва вже існує:
`jbb.ghsq.de/gtfs/ua-kyiv.gtfs.zip` (107/43/17 маршрутів) + `routes.csv`/`stops.json` з CKAN.
Каталог треба почистити, а не лишати мертві URL як «джерела».

### 8.2. Портал-заглушки (формально GTFS, фактично непридатні)

| Регіон | Що виміряно | Вердикт |
|---|---|---|
| Івано-Франківськ (data.gov.ua) | `trips` == `stoptimes` (48 рядків, `stopSequence=null`), `shapes` lat/lon null, `calendar` до 01.04.2026 | STUB / EXPIRED |
| Чернівці | `stop_times` 45 рядків, `calendar` 2024 | STUB |
| Суми | XLSX 2019-11-13 (626/234 рядків) і 2022-01-26 (1000/999) | EXPIRED |
| Вінниця | CSV 2018-07-12, cp1251, 78 рядків | EXPIRED / LEGACY_ENCODING |
| Чорноморськ | zip 2019-09-05, вік 63030.8 год | EXPIRED |
| Суми RT | `gps.sumy.ua/gtfs/gtfs-vehicle-positions.proto`: 7 entity, FeedHeader.ts 2026-10-14T18:36:32Z — **31 доба** | OUTDATED |
| Конотоп | `public.easyway.info/gps/konotop.json`: HTTP 200, тіло `[]` (2 B), 0 ТЗ | STUB (порожній) |
| Хмельницький API | `api.mycity.khm.gov.ua` — NXDOMAIN, підтверджено тричі | DEAD |

Реальне покриття Івано-Франківська сьогодні дає **інтегрований живий Dozor RT**
(`city.dozor.tech/iv-frankivsk/gtfs/vehicle_position`), а не портальні набори.

### 8.3. Дефекти якості живих фідів

- **Дніпро iCity** `api-t900.icity.com.ua/api/gps_data`: **111/404 (27.5 %)** позицій з невалідними
  координатами. Потрібен карантин/нормалізатор перед використанням у маршрутизації (задача #43).
- **Zelectra GBFS** `zelectra.rideatom.com/gbfs/66/v3.0/gbfs`: `stations=0`, `vehicles=914` —
  bike-режим без станцій не доводить docking-покриття.
- **VD-Express**: інтермітентні connect-помилки + лише 2 міжнародні маршрути. У P0-інвентарі
  попередньо позначений як «заблоковано в Україні» — **це неточно**, фактичний стан: INTERMITTENT + OUT_OF_SCOPE.
- **UZ-дзеркало** `jbb.ghsq.de/gtfs/ua-ukrzaliznytsya.gtfs.zip`: вік 112.3 год (5 діб) — для train
  це не свіжий розклад.

### 8.4. HTTP-зведення по 88 записах каталогу

До редиректів: 200 — 69, 302 — 9, 401 — 2, 000 — 8.
Після `-L`: **200 — 71, 302 — 8, 401 — 2, 000 — 7**.
401 = `gw.x24.digital` (Одеса/Буча) — потрібен ключ; 302/000 — переважно київський gisserver.

## 9. Ліцензії та партнерський доступ

- 84/88 записів каталогу мають непорожнє `license`; 4 — без ліцензії.
- 52/52 ресурси, витягнуті з CKAN-порталів, мають `license_title` (переважно CC-BY /
  Creative Commons Attribution) — юридично придатні для інтеграції з атрибуцією.
- `data.kyivcity.gov.ua`: `license_title = null` → **LICENSE_UNKNOWN**. Інтеграція київських
  CKAN-ресурсів потребує письмового підтвердження ліцензії від департаменту, а не припущення.
- 28 клітинок `PARTNER_ACCESS_REQUIRED`: taxi (Uklon Partner Ride-Hailing API, Bolt Partner API,
  Uber Rides API), carsharing (Getmancar, fleet API не налаштований), transfer (немає активного
  quote/booking API), частково train. Це **зовнішні блокери**: потрібні договори/ключі, а не код.
- `gw.x24.digital` — HTTP 401 без ключа.

## 10. Внутрішній рушій попуток (carpool)

Carpool — єдиний режим, де MARSHGO не залежить від зовнішнього фіда: власний рушій (`INTERNAL`).
Стан БД сьогодні:

- Пропозиції: **52 published + 1 completed**; з місцями — 40.
- Попити: **5 open + 1 cancelled**.
- `departure_at`: 2026-10-08 10:00 … 2026-11-01 12:48 UTC → **0 активних на сьогодні**.
- Походження: лише Київ і Львів (+ 1 Стрий).

Тому всі 27 carpool-клітинок не є `FULLY_VERIFIED`: у регіонах із власним рушієм, але без пропозицій —
`SOURCE_MISSING`; у Києві/Львові — `PARTIALLY_COVERED` з явним зазначенням, що активних пропозицій сьогодні немає.
Це чесний стан, а не дефект інтеграції: потрібні реальні водії/пасажирі, а не фікстури.

## 11. Стан інтеграції в БД

- `mobility_providers`: **85** записів; `enabled` 46, `disabled` 39.
- Health усього: healthy 6, degraded 38, offline 41.
- Health лише `enabled`: healthy 5, degraded 37, offline 4.

`degraded` тут — очікуваний результат моделі здоров'я: `probeProviderReachability` завжди повертає
degraded на HTTP 200, а `refreshProviderHealth` пробує лише `status='enabled' AND access='open'`
і **ніколи не змінює адміністративний `status`**. Тому «37 degraded» не означає 37 зламаних провайдерів;
це означає, що reachability-проба не є функціональним тестом. Функціональна валідація вмісту — окрема колонка матриці.

## 12. Що НЕ доведено (відкриті гейти)

1. **M8 — маршрутизація на реальних фідах: ВИМІРЯНО ЧАСТКОВО 2026-11-16 (розділ 15).** Ланцюжки
   працюють для 3 міст + 6 міжміських коридорів, але 4/12 режимів, 19/24 міст без міського транзиту,
   0 підтверджених тарифів, усі пошуки вибіркові (searchTruncated=true). Повне національне M8 — ще НІ.
2. **8 режимів без жодної FV-клітинки**: metro, carpool, taxi, train, bike, scooter, carsharing, transfer.
3. **Севастополь**: 12 клітинок UNKNOWN — регіон відсутній у `UKRAINE_REGIONS`. Потрібне рішення
   власника щодо адміністративної моделі, а не вигадані джерела.
4. **Київ metro**: UNKNOWN — відкритого валідного фіда метро сьогодні не знайдено.
5. **Ліцензія київських CKAN-ресурсів** — LICENSE_UNKNOWN, потрібне підтвердження.
6. **Партнерські ключі/договори** для 28 клітинок — зовнішній блокер.
7. **Синхронізація двох каталогів** — плаский і регіональний розійшлися; 14 FNI-клітинок є прямим наслідком.

## 13. Наступні дії (у порядку доказової цінності)

1. Інтегрувати 14 FNI-ресурсів у регіональні клітинки + `mobility_providers` з provenance і
   `measurementAt` (окремий обмежений PR, задача #42).
2. Почистити 15 мертвих київських записів каталогу; замінити на робочий `ua-kyiv.gtfs.zip`.
3. Виправити P0-інвентар: VD-Express → INTERMITTENT/OUT_OF_SCOPE (не «UA-blocked»), MG-UA-003 → VERIFIED.
4. Карантин невалідних GPS Дніпра (111/404) з тестом і негативним контролем (#43).
5. Виміряти M8 на реальних фідах — без цього національне покриття не є продуктовим.
6. Винести LICENSE_UNKNOWN і партнерські блокери в `docs/EXTERNAL_BLOCKERS.md` як зовнішні.

## 14. Вечірні повторні проби 2026-11-14 18:19–18:22 UTC — виправлення M5 і нові дефекти

Артефакт: [national-live-probe-2026-11-14-evening.json](evidence/national-live-probe-2026-11-14-evening.json)
(17 записів: 16 унікальних URL увімкнених live-джерел + HEAD UZ-дзеркала; серійно, read-only, UA `MARSHGO-Mobility/1.0`).

**Виправлення методу.** Початковий M5 рахував «живим» фід із timestamp у межах **доби**. Продуктовий гейт —
**90 секунд** (`MarshGO-Server/server/journey/gtfsRealtime.ts`, `MAX_FEED_AGE_MS = 90_000`). M5 позначено
застарілим; новий **M5-90s = 5/12 (41.67 %)**: Львівська, Івано-Франківська, Полтавська, Рівненська, Закарпатська.

| Джерело | Стан 18:20 UTC |
|---|---|
| Львів RT positions / trip_updates | LIVE, вік 0–2 с, 403 / 569 entity |
| Стрий RT | LIVE, 1 с, 12 entity |
| Івано-Франківськ RT | LIVE, 14 с, 63 entity |
| Рівне RT | LIVE, 1 с, 16 entity |
| Ужгород RT | LIVE, 18 с, 11 entity |
| Полтава EasyWay JSON | LIVE, медіана 75 с, 88/166 позицій ≤90 с |
| Дніпро iCity JSON | формально LIVE (медіана 11 с), але **86/388 (22.2 %) невалідних координат** → дефект, у M5-90s не зараховано |
| Київ Zelectra GBFS 3.0 | LIVE, `vehicle_status` 999 ТЗ, вік 0 с (самокати, не транзитний RT; у M5 не входить) |
| UZ-дзеркало static.zip | Last-Modified **2026-11-09 23:00 UTC — 5 діб**, свіжість не проходить |

**Новий дефект D10 — Dozor `devices.json` змішує часові пояси в межах одного фіда.** Рядок `time`
(`YYYY-MM-DD HH:mm:ss`) у частини пристроїв UTC, у частини — київський локальний:

| Місто | fresh ≤90 с (найкраща інтерпретація на пристрій) | медіанний вік |
|---|---|---|
| Біла Церква | 46/131 | 1907 с |
| Кам'янець-Подільський | 26/138 | 9880 с |
| Ужгород JSON | 6/51 | 18896 с |
| Івано-Франківськ JSON | 51/105 | 53 с |
| Червоноград EasyWay | 5/12 | 1268 с |
| Олександрія / Конотоп | 0 ТЗ (порожньо) | — |

Наслідок: серверний `ageSeconds` для цих фідів недовірений; більшість позицій відсіюється 90-секундним
гейтом, тож «увімкнений healthy/degraded» не означає live у продукті. Потрібен нормалізатор TZ
(разом із карантином координат Дніпра, задача #43) або перехід на GTFS-RT цих міст, де він є.

**Carpool станом на 18:20 UTC:** 52 published + 1 completed, **0 з майбутнім departure_at** — підтверджено
повторним запитом до БД; активних пропозицій сьогодні немає.

**Відповідь на питання «чи перекрита вся Україна по всіх видах»: НІ.** 10/324 клітинок (3.09 %) мають
підтверджені окремі джерела; 4/27 регіонів і 4/12 режимів; жоден режим не покритий національно;
8 режимів без жодної доведеної клітинки; 28 клітинок потребують партнерських договорів;
Севастополь — 12 UNKNOWN. Навіть `FULLY_VERIFIED` доводить лише наявність валідного джерела
(напр. 18 маршрутів Ужгорода), а не покриття всіх населених пунктів області.

## 15. Нічний API-chain + браузерний E2E аудит 2026-11-16 (M8 виміряно, частково)

Артефакти: [national-api-chain-probe-2026-11-16.json](evidence/national-api-chain-probe-2026-11-16.json)
(36 пошуків, усі HTTP 200, 76 маршрутів), [national-routing-matrix-2026-11-16.csv](evidence/national-routing-matrix-2026-11-16.csv)
(24 міста × 15 колонок), скриншоти `browser-2026-11-16-{home,kyiv-lviv-results,kyiv-lviv-map-details}.png`.
Середовище: API `local-e9934abbd8fc-dirty-20261113T132012Z` (Nov13, dirty), Site `1fec46f`-dirty
(гілка `codex/premium-route-details-reference-20261115`), канонічний zrok `https://marshgo-dima.shares.zrok.io`.
Відправлення динамічне (now+2 год, київський настінний час); браузерний прогон — 2026-11-17T08:00 Kyiv.

**M8 більше не NOT_MEASURED.** Маршрутизатор будує ланцюжки на реальних фідах, але вибірково і не для всіх режимів.

### 15.1 Міські ланцюжки (24/26 центрів; Сімферополь і Севастополь NOT_TESTED)

| Статус | Міста | Доказ |
|---|---|---|
| WORKING (3) | Київ, Львів, Ужгород | Київ n=1 cand=20 [WALK,BUS,WALK,BUS,WALK] тариф 6000 ESTIMATED; Львів n=5 cand=84 (4 bus 2300 ESTIMATED + 1 bike UNKNOWN); Ужгород n=2 cand=100 [WALK,BUS,WALK] gtfs-static, тариф UNKNOWN |
| PARTIAL (2) | Івано-Франківськ, Одеса | лише [WALK,BICYCLE,WALK] `static-bike-network-estimate`; наземний транзит у рушії не повернувся для цих O/D |
| MISSING (19) | Вінниця, Луцьк, Дніпро, Донецьк, Житомир, Запоріжжя, Кропивницький, Луганськ, Миколаїв, Полтава, Рівне, Суми, Тернопіль, Харків, Херсон, Хмельницький, Черкаси, Чернівці, Чернігів | cand=0, `unsupported_preference`; УСІ мають каталожні джерела → **прогалина інгестації, не джерел** |

Полтава/Рівне/Дніпро мають LIVE RT за пробами 11-14, але в рушії Nov13 не маршрутизуються.

### 15.2 Міжміські / міжобласні (6/6 WORK, усі trunc=true)

kyiv-lviv n=7 cand=72; lviv-uzhhorod n=9; odesa-kyiv n=9; kyiv-kharkiv n=6; lviv-ivano-frankivsk n=9;
kyiv-odesa n=8 (усі cand=100). Національна залізниця + міжміський автобус працюють навіть там, де місто=0
(Харків). Свідок kyiv-lviv: [WALK,RAIL,WALK,TRAM,WALK], геометрія 5 сегментів,
providerName «Укрзалізниця (GTFS) + Львівавтодор (GTFS)», state PLANNED, liveStatus SCHEDULED.

### 15.3 Стратегії та тарифи

FASTEST kyiv-lviv доступний; CHEAPEST kyiv-lviv **fail-closed** (availableStrategies без CHEAPEST,
повернуто BALANCED) — усі залізничні тарифи UNKNOWN. Київ міський bus має тариф → CHEAPEST там доступний.
FASTEST-свідок [WALK,RAIL,WALK] 25857 с / 0 пересадок / 6454 м пішки vs BALANCED
[WALK,RAIL,WALK,TRAM,WALK] 25863 с / 1 пересадка / 3848 м — **різні**. confirmedPriceMinor=0 у всіх 76.

### 15.4 Покриття режимів у ніжках (знаменник 12)

WALK 236, BUS 68, RAIL 62, TRAM 31, TROLLEYBUS 5, BICYCLE 3.
**4/12 розкладних режимів дають ніжки** (bus, tram, trolleybus, train); bike — 3 estimate-ніжки;
**7 режимів = 0 ніжок**: marshrutka, metro, taxi, carpool, carsharing, transfer, scooter.
metro/taxi/carsharing/transfer/marshrutka — `not-in-route-engine` у кожному місті;
Донецьк/Луганськ additionally train not-in-engine (фронт/окупація).
Контролі: lviv tram-only n=3 ✓; kyiv bus-only n=1 ✓; kyiv metro-only n=0 provider_error ✗;
негатив ternopil scooter-only n=0 partial=[] ✓ (чисто, без вигаданих пропозицій).

### 15.5 Пішохідна provenance та свіжість

Джерела ніжок: gtfs-static 73, walking-grid-estimate 43, osrm-foot-route 30,
walking-straight-line-estimate 3, static-bike-network-estimate 3 → **46 пішохідних ніжок — оцінки**,
лише 30 OSRM-підтверджені. liveStatus: SCHEDULED 73, UNVERIFIED 76, LIVE 0 (коректно для майбутнього
відправлення; не дефект сам по собі). Усі робочі пошуки `searchTruncated=true`
(candidateGenerationTruncated) → **вибірка, не вичерпний пошук**; walking_routing_unavailable на
Ужгороді/Івано-Франківську/більшості міжміських.

### 15.6 Геокодер і браузерний E2E

`GET /places/suggest` = **503 для 24/24 міст** (geocoder_unavailable). Але Web має кураторський
fallback «<місто> · центр міста» (`marshgo:city-reference:<id>`) — пошук за назвою лишається можливим
для великих міст без живого геокодера. Браузер (Qoder in-app, канонічний zrok):
форма 12 категорій → усі увімкнені → Київ→Львів 17.11 08:00 → **2 маршрути**;
таби Оптимальний/Найшвидший активні, **Найдешевший disabled** (тарифи UNKNOWN);
маршрут 1 = Пішки 40 хв (ОРІЄНТОВНО, 3,3 км) → очікування 3 год 25 хв → Поїзд №40749
Київ-Пас 12:05 → Львів-Гол 18:20 (РОЗКЛАД) → Пішки 38 хв (ОРІЄНТОВНО, 3,2 км), прибуття 18:57,
0 пересадок, ціна «—». Карта відрендерила реальну геометрію залізниці між маркерами Посадка/Висадка.
Хронологія, очікування і provenance (ОРІЄНТОВНО vs РОЗКЛАД) коректні; 5-пунктова навігація збережена.

### 15.7 Зовнішні / Codex-власні блокери, виявлені цим прогоном

1. **CI acceptance FAILURE 43805319421** на Server main `378eccb` (scope=lviv-route):
   Lviv GTFS-RT DEGRADED (324 ТЗ, 6 stale), searchTruncated=true,
   routeBudgetDiscardedSegments 134840, candidatePoolFull 2551 / tripChainCap 2133.
   Той самий Codex-власний дефект Lviv truncation (PR189 draft).
2. Геокодер 503 — спільний runtime, блокує живий пошук за назвою (fallback рятує лише центри міст).
3. 19 міст: фіди є в каталозі, але не інгестовані в рушій Nov13 → потрібне оновлення runtime/інгестація (Codex).
4. 7 режимів без ніжок → потрібні адаптери/провайдери (Codex + партнерські договори).

**Висновок 11-16:** ланцюжки складаються правильно на реальних фідах для 3 міст + 6 міжміських коридорів
і коректно fail-closed для невідомих тарифів, але національне покриття по всіх 12 видах — **НІ**:
4/12 режимів, 19/24 міст без міського транзиту, 0 підтверджених тарифів, усі пошуки вибіркові.
Статус лишається PARTIAL / NOT_RELEASED.

---

*Усі числа отримані вимірюванням 2026-11-14 (розділи 1–14) і 2026-11-16 (розділ 15). Жоден знаменник не
вигаданий: 27 адмінодиниць, 12 канонічних режимів, 324 клітинки, 88 пласких записів, 140 унікальних
відкритих concrete-URL, 25 джерел з виміряною датою вмісту, 12 регіонів із заявленим RT, 24 міські
центри + 6 міжміських пар + 3 стратегії/контролі у API-прогоні 11-16. M8 виміряно частково (розділ 15).*