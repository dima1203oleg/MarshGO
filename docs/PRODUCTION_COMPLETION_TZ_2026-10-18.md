# MARSHGO: ТЗ на завершення мультимодальної маршрутизації та production readiness

**Дата аудиту:** 18.10.2026 (Europe/Kyiv)
**Тип:** статичний аудит коду, конфігурації, release-артефактів і наявної тестової документації. У цьому проході тести, деплой і production-конфігурація не запускалися та не змінювалися.

## 1. Висновок

**Стан: NOT READY FOR PRODUCTION.** Є значна функціональна основа: GTFS-пошук, міські транспортні шари, карта MapLibre, окремі оцінки велосипедних і самокатних сегментів, серверні API та автоматизовані перевірки. Але доступні докази не підтверджують повний ланцюг з реальною геометрією, точними часом/відстанню, live-доступністю оренди та бронюванням; візуальна тотожність усім 19 еталонним фото не доведена; staging і production не налаштовані.

Релізний маніфест [RELEASE_MANIFEST.json](../RELEASE_MANIFEST.json) має `status=NOT_RELEASED`, `production_ready=false` і `staging.status=NOT_CONFIGURED` станом на 16.10.2026. Він записує успішні локальні тести й CI, але окремо фіксує, що:

- київські комбінації Metro + BikeNow і Metro + Zelectra та львівський Nextbike повертаються як **оцінки**, а не підтверджені оренди;
- велосипедна й самокатна геометрія — `STRAIGHT_LINE_ESTIMATE`, доступність і бронювання невідомі/вимкнені;
- у київському Metro немає live-позицій поїздів у перевіреному вікні;
- E2E використовує детерміновані map/routing fixtures, а не реальну production підкладку;
- немає pixel acceptance для 19 фото, staging/production host, керованих production secrets або фізичного iPhone acceptance.

Додаткова проблема релізної відтворюваності: на 18.10.2026 поточні checkout-и мають SHA root `cd0b62d17585503b4a73036c0fae0b52cbcd41ed`, Site `6961afcf008e2c845c0fde68c687ce61fe744f2f`, Server `182c77ae4f78d576a287007d8e0864fb130f43f8`, iOS `4353cec3cacbaf662ceea047402f361024292b22`. Маніфест-кандидат pins Site `aff0ead39db51abfd939820530b3a874db26cfaf` та iOS `ecf9fd03de37595f8599be0bb951f35ca515f692`; root integration pin теж відрізняється від поточного root HEAD. Отже, результати кандидата треба прив’язати до конкретного комплекту SHA й повторно перевірити після узгодження checkout-ів.

## 2. Що є зараз і де межа готовності

| Домен | Підтверджена основа | Що це ще не доводить |
|---|---|---|
| Міський транспорт | GTFS parser/search, пересадки, тарифи, stop times і route shapes; фактичний львівський фід містить автобуси й трамваї. Київський Metro має статичні лінії/станції. | Повноту всіх міст та режимів; актуальність кожного фіда; наявність live-транспорту. Тип транспорту в каталозі не означає, що він є у фіді кожного міста. |
| Ланцюг громадського транспорту | Останній задокументований Львівський HTTP-прогін повернув послідовний автобусно-трамвайний ланцюг з формами маршрутів і зупинками. | Глобальний оптимум: пошук обмежує перебір, у прикладі повертав `partial=true`/truncation. Точний пішохідний зв’язок також залежить від routing provider. |
| Велосипеди | Є статичні OSM-пункти, визначені мережі Nextbike/BikeNow/Veliki та owner-attested правило повернення в межах конкретної мережі для відомих точок. Можуть будуватися estimate-сегменти. | Наявність велосипеда/місця, актуальність точки, точну велодорогу, тариф, оренду чи реальну здачу. Без оператора або мережі точка не повинна приєднуватися до чужої мережі. |
| Самокати | Zelectra GBFS повертає live-записи й окремі геозони; оцінка сегмента вимагає свіжого snapshot, дозволених `ride_start`/`ride_end` і перевірки `ride_through`. | Фізичну наявність конкретного самоката в момент старту, підтверджену ціну/бронювання та коректну дорожню геометрію. У Львові feed для самокатів не підтверджений. |
| Велосипед/самокат + Metro | Release manifest записує Kyiv Metro + BikeNow, Kyiv Metro + Zelectra та Lviv Nextbike як знайдені комбінації. | Реальне проїзне трасування мікромобільності: у зазначених перевірках лінії були прямими, час/ціна — оцінені або невідомі, бронювання вимкнено. Комбінація в результатах не є доказом повної продакшн-моделі. |
| Таксі, каршеринг, трансфери | У коді є частина adapter/registry контрактів; KiwiTaxi та Intui є в каталозі. | Живі quote/ціни, доступність, авторизоване бронювання й виробничий доступ. Маніфест позначає KiwiTaxi як `AWAITING_CREDENTIALS`; Intui API Light/Wide доступ і угоди відсутні. Каршеринг не має підтвердженого активного провайдера в release-кандидаті. |
| Карта | MapLibre adapter, route/layer model, focus вибраного сегмента, зупинки, snap-point панель і regression/E2E checks. | Реальні ліцензовані production tiles/style, атрибуцію/SLA та повну відповідність еталонним картам. Поточні автоматичні карти — deterministic fixtures. |
| Навігація | Є NavigationCore, GPS/session API, foreground navigation та перевірки симульованого прогресу/перерахунку маршруту. | Реальне ведення по дорожній геометрії, точний road-distance remaining, фізичні дозволи, background GPS, голос/переривання, реальний iPhone. |
| Production | Є CI, Dockerfile/Compose та runbook-заготовки; останній маніфест записує зелені локальні build/CI та E2E. | Hosted staging/prod, HTTPS domain, керовані DB/Redis/object storage, secret manager, моніторинг, alerting, rollback/restore та підписаний iOS реліз. |

Поточні маршрути, шари та джерела треба розглядати за [PRODUCTION_PROVIDER_MATRIX.md](PRODUCTION_PROVIDER_MATRIX.md), [UI_REFERENCE_MATRIX.md](UI_REFERENCE_MATRIX.md), [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) і точними версіями репозиторіїв, а не за самою наявністю provider name в реєстрі.

## 3. Обов’язкові продуктові правила

1. **Розділити чотири стани режиму:** `показати на карті`, `можна оцінити маршрут`, `є live availability`, `можна бронювати/купити`. Один стан не підміняє інший.
2. Пошук може повертати **планувальну оцінку** для велосипедів без live-залишків, як просив власник продукту, якщо UI і API чітко зберігають `availability=UNKNOWN`, `price=UNKNOWN`, `bookingAvailable=false`, приблизність часу/відстані та джерело правила повернення. Такий сегмент не можна називати доступним для оренди або bookable.
3. **Велосипед:** pickup і dropoff мають належати одній підтвердженій мережі/оператору. У межах мережі дозволити one-way повернення лише якщо мережеве правило підтверджене (для конфігурацій власника — `OWNER_ATTESTED`); невідомі точки залишати окремо. Не з’єднувати Nextbike ↔ BikeNow ↔ Veliki.
4. **Самокат:** start/end мають бути всередині свіжої геозони з відповідним vehicle type та правилами початку/завершення; весь розрахований маршрут має виконувати правила руху провайдера, не лише кінцеві координати. Геозона — не просто намальована область, а обмеження маршрутизатора.
5. **Громадський транспорт:** рейс/станція має бути з feed, активного на конкретні дату, місто та час. GTFS timetable — це розклад, а не live прибуття; `LIVE` можна показувати лише за свіжим реальним GTFS-RT/provider timestamp.
6. **Пішохідні переходи** до/між/від режимів — окремі перевірені legs з реальною пішохідною геометрією. Не підміняти ними пряму відстань. Якщо routing provider недоступний, маркувати пошук неповним або не включати такий ланцюг за обраною продуктовою політикою.
7. **Невідомі дані не дорівнюють нулю.** Не рахувати невідому ціну як безкоштовну, відсутню відстань як 0 м чи старий feed як live.
8. Каталог 12 канонічних режимів не означає глобального покриття. Доступність надається за `місто × provider × режим × час × тип операції` з географічною межею, freshness і статусом джерела.

## 4. Функціональне ТЗ: мультимодальний граф і ланцюги

### 4.1 Нормалізована модель даних

Ввести/закріпити спільний версійований контракт для будь-якого транспортного сегмента:

- стабільні `providerId`, `networkId`, `mode`, `transportType`, `city/coverage`, `sourceId` і атрибуція;
- `origin/destination` вузли з WGS84 lon/lat, типом вузла та provider-scoped ID;
- departure/arrival, timezone/календар, очікування, виміряний transfer walk і boarding buffer;
- `distanceMeters` лише з route geometry/provider; `durationSeconds` та uncertainty окремо;
- GeoJSON/polyline геометрія з `geometrySource`, `accuracy` (`ROUTED`, `SCHEDULED_SHAPE`, `STRAIGHT_LINE_ESTIMATE`) та перевіреним start/end;
- fare у minor units/currency, fare basis/validity або null з явним `UNKNOWN`;
- availability, last-checked/source timestamp, booking capability та return policy/source;
- зупинки/станції й stop times для рейсових режимів; pickup/dropoff/zone constraints для shared mobility.

Схеми мають бути перевірені на межі GTFS/GBFS/партнерських API, бази даних, HTTP і Site DTO. Версія API повинна дозволити безпечно відкотити Site/Server до попереднього сумісного релізу.

### 4.2 Граф і генерація кандидатів

Поточний `MarshGO-Server/server/journey/planner.ts` компонує скінченні `ProviderOption` і приймає лише зв’язки з виміряною walking map; він не генерує доступність. Окремий `micromobilityEstimates.ts` створює straight-line estimates від найближчих точок/геозон. Їх треба об’єднати за єдиним контрактом, зберігши окремі гарантії для bookable та estimate journeys.

Планувальник має будувати часовий directed graph:

- вузли: origin/destination, transit stops/platforms/station pathways, статичні bike points, дозволені scooter start/end points, provider/network boundary, walk connectors;
- ребра: усі придатні GTFS trips, measured walking/cycling/road routes, дозволені micromobility estimates, live provider offers лише після freshness/availability validation;
- стикування вузлів — тільки за допустимою відстанню/часом пішого маршруту, GTFS transfer/pathway rules або явним shared node; однакові назви не є доказом фізичної пересадки;
- ребро спільної мобільності має бути intra-provider/network і виконувати return/zone rules;
- граф має виключати цикли, повторне використання одного рейсу/оренди, від’ємні часові інтервали та неможливі зупинки.

Алгоритм має повертати Pareto-набір за door-to-door часом, відомою ціною, кількістю пересадок, пішою відстанню, невизначеністю та надійністю. Якщо пошук обмежений, `partial=true` і причина обов’язкові; інтерфейс не повинен називати знайдений маршрут «найкращим» без відповідної гарантії. Замінити неіндексований/обмежений перебір transit options на контрольований RAPTOR/multi-label або еквівалентний algorithm, зберігши transfer rules, calendar exceptions, DST/timezone, frequency-based service і realtime delay.

### 4.3 Геометрія, відстань і час

- Підключити керований pedestrian router для walking legs, вимірювати довжину за polyline, враховувати переходи/річки/недоступні перетини. Повернути виміряну геометрію для `walk-to-stop`, platform transfer, `walk-to-rental`, `walk-from-dropoff`.
- Підключити cycling route profile для велосипедів і дозволений scooter profile/обмеження. OSRM car route не можна мовчки показувати як пішу/вело геометрію.
- Для Zelectra спершу вибрати дозволений pickup та dropoff у GBFS-зонах; потім прокласти придатний маршрут між ними й перевірити всі перетнуті обмеження відповідно до провайдерської моделі. Sample-by-points по прямій — лише fallback estimate, не доказ придатності дорожнього сегмента.
- Довжина транспортного сегмента — сума відстаней геометрії; довжина маршруту — сума legs і connector walks. Точність округлення визначити в одному API/presentation контрактові.
- Тривалість усього маршруту включає стартове очікування, поїздки, перехід, мінімальний buffer, простій та невизначеність. Пересадка feasible тільки якщо `nextDeparture >= previousArrival + measuredWalk + buffer + ETA uncertainty`.
- Маніфест конкретного пошуку мусить повідомляти, коли geometry straight-line/estimated або коли частина альтернатив обрізана.

### 4.4 Data ingest, freshness та карта

- У provider registry зберігати feed URL/format, ліцензію/умови, міста/coverage, GTFS mode mapping, cadence, останній успішний ingest, checksum/version, schema errors і останню дату даних.
- GTFS: перевіряти всі обов’язкові файли, timezone, calendar/calendar_dates, stop_times ordering, shapes, transfers, pathways, route_type normalization, duplicates, coordinates і service-date coverage. Атомарно публікувати новий валідний snapshot; зламаний feed не замінює останній хороший.
- GTFS-RT/GBFS: timestamp age, response latency, invalid coordinates/foreign geographies, stale status, vehicle type, pickup/dropoff/ride-through rules. За внутрішнім стандартом цього проєкту stale realtime >90 секунд не позначати LIVE; для кожного провайдера налаштувати власний SLO/TTL і показувати age.
- Перевірити сторонні координати Zelectra: останній записаний probe включав записи за межами України (зокрема Lima), тому обов’язкова географічна валідація до збереження/віддачі.
- На карті показувати всі повні статичні line features і станції/зупинки Metro та інших режимів, якщо їх дозволяють права на дані. Метро без VehiclePositions має показувати лінії/станції, а не фальшиві рухомі поїзди.
- Велоточки відображати як точки мережі з `operator unknown` окремо; кластеризація не повинна приховувати точку під час вибраного zoom. Позначення live inventory показувати тільки за свіжим GBFS/station status.
- Для кожного шару — окремий provider status/freshness, увімкнення/вимкнення, легенда/кольори/маршрутні номери, Loading/empty/stale/error стани й attribution.

## 5. Таблиця покриття за режимами

Це цільова release-матриця, яку треба вести в даних і показувати у внутрішньому ops dashboard. `SUPPORTED` означає функціональну підтримку лише в переліченій зоні; `BOOKABLE` — окреме підтвердження партнерського booking contract.

| Канонічний режим | Потрібне джерело/правило | ТЗ до приймання | Поточна межа за останнім доказом |
|---|---|---|---|
| Автобус | GTFS + feed calendar; GTFS-RT за наявності | Пошук рейсу, всі зупинки/shape/time, пересадки, свіжість і тарифна визначеність | Міські фіди нерівномірні; живий рух/тариф не всюди |
| Маршрутка | GTFS/provider feed з правильним mapping | Не вважати маршрутку наявною за назвою; відобразити окремий mode лише за feed evidence | Покриття залежить від міста й каталогу |
| Тролейбус | GTFS route type/provider mapping | Лінії/зупинки/shape та time; live тільки з telemetry | Не присутній у кожному міському фіді |
| Трамвай | GTFS | Route shape + stop times, transfer rules, fare | Локально фіди/режими різняться за містом |
| Метро | GTFS/офіційний статичний граф станцій та ліній; RT окремо | Усі напрямки/пересадки/pathways, посадки, виходи й геометрія; без руху поїзда без RT | Kyiv layers/routes наявні, але live vehicle telemetry не підтверджено |
| Поїзд/приміський/міський рейс | Авторизований актуальний GTFS/API | Розклад конкретної дати, міжміські пересадки, ціна/availability з джерелом | Окремі фіди були порожні/нестабільні; потрібен чинний corridor coverage |
| Велосипед | Статичні operator points/network return policy; GBFS для inventory, якщо доступний | Estimate допускається з UNKNOWN stock; лише одна підтверджена мережа; routed cycling geometry; без прихованого booking | Статичні точки є; availability невідома; geometry пряма |
| Самокат | Zelectra/інший GBFS vehicle feed + geofence rules | Свіжа геозона, vehicle type, start/end/through restrictions, routed scooter geometry; показати unavailable/unknown окремо | Київський feed/зони дають estimate + Metro; маршрутна геометрія пряма, бронювання не підтверджене |
| Попутка | MARSHGO Community offers + verified car + route/match consent | Геометрія/детур/місця/ціна з серверної пропозиції; booking за транзакційним API | API/ланцюги окремо тестовані; потрібне staging acceptance всього lifecycle |
| Таксі | Активний авторизований API/quote contract | Живий тариф, pickup/ETA/expiry, provider handoff/book semantics | Реального чинного підключення у release-кандидаті немає |
| Каршеринг | Авторизований provider API, service/parking polygon, vehicle availability | Взяти/залишити в дозволених зонах, road geometry, вартість, terms | Active contract/data не підтверджені |
| Трансфер | KiwiTaxi/Intui/API з партнерською авторизацією | Живий quote, passenger/luggage/vehicle constraints, cancellation terms, booking/handoff | Каталог є, але доступів/пропозицій немає; booking не працює |

## 6. Візуальне ТЗ за 19 канонічними фото

19 зображень — це повтори й варіанти теми/стану кількох canonical scenes, а не 19 різних екранів. Їх треба зберегти як незмінні еталони з SHA-256, вирівняти viewport/crop самого інтерфейсу й додати traceability `фото → компонент → стан → API/дані → screenshot test`.

### 6.1 Еталонні групи

1. **Активна turn-by-turn навігація:** верхня синя maneuver-картка з напрямком/відстанню/назвою вулиці й lane guidance; карта з синьою лінією, позицією користувача, control stack (recenter, layers, 3D, bearing/sound), satellite preview, speed/current limit, нижній ETA/distance/finish strip. Фото 1, 3, 6, 10, 15, 16.
2. **Шари карти:** modal bottom sheet зі секціями транспорт/відображення/інфраструктура, станціями/лініями/ETA/transfers та незалежними toggles; накладання ліній транспорту на карту. Фото 2, 9, 12, 17.
3. **Побудований маршрут і карти transit:** контрастні mode colors, vehicle badges з номером/ETA, метро, зупинки/пересадки, активна маршрутна лінія, нижня segment ribbon; dark/light варіанти. Фото 5, 8, 13, 18.
4. **Меню маршруту:** огляд, додати stop, пошук уздовж маршруту, поділитися, повідомити про подію, звук, завершити навігацію; окрема action sheet над route strip і п’ятьма tabs. Фото 4, 7, 14, 19.

### 6.2 Обов’язкові зміни для visual acceptance

- Зробити screenshot goldens для всіх чотирьох груп у світлій/темній темі, усіх визначених sheet snap states та відповідних iPhone/web portrait viewport-ів. Наявні regression screenshots за [UI_REFERENCE_MATRIX.md](UI_REFERENCE_MATRIX.md) перевіряють стабільність реалізації, але не вимірюють різницю з оригінальними фото.
- Візуальний diff порівнювати з обрізаною областю застосунку, без рамки iPhone/статусбару mockup-у. Зафіксувати viewport, scale factor, locale `uk-UA`, `Europe/Kyiv`, deterministic data, font loading, animation-off і версію карти.
- Розділити acceptance UI overlay та базової карти: UI/cards/buttons/spacing/type/icon/colors — pixel compare; якщо provider tiles змінні, використовувати archived deterministic tile/style snapshot і окремо структуру/геометрію шару. Не маскувати route line, labels, stop markers чи control positioning.
- Точно узгодити бренд/логотип, верхню maneuver-картку, карту підкладки, палітру dark/light, типографіку, радіуси/тіні, кнопки карти, нижній sheet, bottom nav, зелену create action, icon size/active states та інформаційну щільність.
- Забезпечити, щоб drag/snap sheet не перекривав маршрут; активний сегмент цілком потрапляв у видиму область карти над sheet. Після вибору segment map camera, highlight, timeline card і stop list мають посилатися на один `segmentId`.
- Розширити [UI_REFERENCE_MATRIX.md](UI_REFERENCE_MATRIX.md) так, щоб кожне з 19 фото мало ID/Hash і точний mapping. Поточна матриця групує основні сцени, але заявлена pixel parity ще pending.
- Кожен елемент зі скріншоту має працювати, а не бути decorative: layers toggles реально змінюють source/layer; recenter повертає camera; 2D/3D і bearing перемикаються; finish зупиняє session; add-stop змінює маршрут; sound має доступний mute state; tabs ведуть на свої сторінки.
- Забезпечити 44×44 pt target, VoiceOver/accessibility names, контраст WCAG 2.1 AA, reduced motion і повну responsive поведінку. Device-specific status bar/permissions показувати лише в native-контексті.

## 7. Навігація й вимірювання прогресу

- Приймати GPS fix тільки з валідними timestamp/accuracy/coordinates; фільтрувати стрибки, дублікати й застарілі позиції. Розділяти permission denied, no-fix, stale fix, approximate location та live GPS.
- Map-match позицію до дорожньої geometry; progress і remaining distance рахувати вздовж активного route geometry, а не по відстані до destination або прямій.
- Поточний/наступний maneuver виводити з route steps; відстань зменшується монотонно між пересуваннями вперед, при відхиленні маршрут версіонується/перераховується і нові відрізки підміняються атомарно.
- Кожен перерахований відрізок показувати з коректними mode, color, length, ETA, stops/directions і точним source/freshness. Не приховувати невідомі/приблизні поля.
- Кнопка завершення зупиняє GPS polling/session, зберігає потрібний маршрутний запис, очищає ephemeral location за визначеним TTL. Restart/reconnect має відновлювати session без повторного створення дубля.
- Staging/device acceptance: дозволено/заборонено/відкликано геолокацію, weak GPS, tunnel/city multipath, no network, background/foreground, app killed/restored, reroute, finish, stale transit ETA, dark/light.
- Поточний доказ симульованого браузерного GPS не є підтвердженням фізичного iPhone чи background tracking.

## 8. Інфраструктура та production експлуатація

До release candidate потрібно:

1. Узгодити точні reviewed SHA root/Site/Server/iOS, API version, migration version і web/iOS assets у manifest; побудувати immutable images/artifacts з цих SHA. Не змішувати локальні клони/незбережені зміни.
2. Налаштувати окремі `staging` та `production` targets, домен/TLS, deployment identity/permissions, керований secret manager, external DNS/CDN, CORS/trusted proxy й явну rollback процедуру.
3. Підняти managed PostgreSQL/PostGIS та Redis з pool/limits, backup schedule, encryption, retention, RPO/RTO; перевірити restore на staging. Локальний Compose — лише dev/test, не production topology.
4. Виконувати міграції окремим одноразовим release job, перевіряти upgrade/rollback на staging, підтверджувати сумісність клієнтів до переключення трафіку.
5. Налаштувати приватний object storage для документів/фото, access logs, encryption, malware scanning і deletion/retention lifecycle.
6. Надати production SMS/OTP provider+sender, map tile/style provider з ліцензією та атрибуцією, road/pedestrian/cycling routing, geocoding, GTFS/GBFS feeds із правами на використання, observability. Платні/партнерські keys — тільки server-side secret manager, не в `VITE_*`, Git або чаті.
7. Увімкнути метрики та алерти: API error/latency, DB/Redis/readiness, search candidate truncation, provider latency/error/freshness, GTFS/GBFS parse failures, map tile errors, outbox lag, SMS delivery, GPS/replan rates, booking conflicts і abuse/rate-limit.
8. Задати та перевірити SLO до запуску. Мінімально погодити p95/p99 для search/places/API, feed freshness TTL за provider, availability, crash-free sessions, map FPS/memory та on-call response. Не заявляти SLO без навантажувального профілю та staging виміру.
9. Перевірити privacy/retention для precise GPS, consent для live matching, процедури безпеки/скарг, підтримку користувачів, incident escalation і disaster recovery.
10. Для iOS: pinned Site bundle, HTTPS API, secure refresh/session, ATS/privacy copy, дозволи GPS, реальні background policy, signing/provisioning, push/APNs якщо потрібні, TestFlight і фізичні пристрої. Simulator build не є App Store release.

## 9. Acceptance matrix та критерії приймання

### 9.1 Коректність будь-якого ланцюга

Для кожного повернутого маршруту автоматично перевірити:

- перший доступний leg починається від origin connector, останній завершується в destination connector;
- усі сусідні legs географічно і часово стикуються через дозволений measured connection;
- departure/arrival монотонні; walking time + transfer buffer + ETA uncertainty враховані;
- кожен leg має mode/provider/network/source, валідну дату й геометрію або явний estimate status;
- геометрія починається/закінчується у відповідних точках і не має NaN, reversed coordinates, самоперетину/помилкового стрибка між містами;
- відстань, duration, wait, fare, transfers і total door-to-door відповідають сумі legs за API контрактом;
- один bike/scooter ride не перетинає provider/network або заборонену return zone;
- альтернативи не містять циклів/дублів; strategy ranking відповідає computed values;
- обрізаний candidate search позначений `partial` і не заявляє математичний global optimum;
- unknown fare/stock/freshness показані як unknown, не як zero/free/live/available.

### 9.2 Kyiv/Lviv scenario matrix

На ізольованому staging snapshot з версіями feed і координатами треба прогнати HTTP API і видимий Site, а не лише unit function:

| Місто / сценарій | Перемикачі | Очікуваний доказ |
|---|---|---|
| Київ: лівий берег → правий берег | лише Metro | Реальний пересадковий Metro path з усіма станціями/лініями/часовими правилами; geometry і transfer station правильні |
| Київ: access bike → Metro → walk | Bike + Metro | Bicycle estimate на одній підтвердженій мережі, measured/routed connectors, Metro schedule leg, unknown inventory чесно, continuity без стрибка |
| Київ: scooter → Metro → scooter/walk | Scooter + Metro | Свіжі Zelectra start/end geofence allow, vehicle type/return zone, road routing, Metro path і transfer feasibility; для недопустимої зони немає результату |
| Київ: BikeNow + Zelectra + Metro, якщо граф дає з’єднання | Bike + Scooter + Metro | Комбінацію створити лише якщо одночасно існують дозволені окремі network edges і measured/routed transfer nodes; не обов’язково змушувати всі три режими бути в одному маршруті |
| Київ: only bike / only scooter | Відповідний один режим | Estimate можливий лише при допустимих pickup/dropoff і покритті; нуль результатів — коректно пояснений coverage/zone status |
| Львів: Same-network bike | Bike | Nextbike точки/мережа; estimate з unknown stock; всі інші та безіменні точки відділені |
| Львів: Bike + bus/tram | Bike + відповідні GTFS modes | Часово feasible стикування з реальними stop/route shapes; велосипедна частина не є прямою лінією у фінальному routed результаті |
| Львів: scooter | Scooter | Якщо нема актуального місцевого provider feed/geofence — нуль scooter edges; не використовувати київський GBFS у Львові |
| Негативи обох міст | Випадково вимкнути mode, зробити feed stale, зламати provider або межу мережі | API повертає коректний partial/empty/provider-unavailable статус; UI не показує вигаданий маршрут і дозволяє повтор/інші режими |

### 9.3 Visual/UI acceptance

- 19 source references мають еталонні SHA, viewport/crop і карту відповідності.
- Кожна група з розділу 6 має visual golden у light/dark, plus layout/interaction assertions.
- Погоджений pixel-diff threshold задається для UI та окремо для map style/tiles; regression не можна “прийняти” простим перезаписом золотого скриншота без review.
- Перевірити вертикальні розміри/safe-area, активні/неактивні кнопки, touch target, sheet drag/snap, scroll, tab routes, labels, ETA, route geometry та no-overlap на iPhone portrait і responsive web.
- Для кожного кліку на canonical screen є перевірений постклік-стан у браузерному/фізичному UI.

### 9.4 Release gate

Не виставляти `PRODUCTION_READY=true` і не деплоїти, доки всі обов’язкові рядки release checklist мають доказ для exact-SHA staging candidate. Мінімальний доказовий пакет: signed/reproducible artifact, schema migration report, staging deploy/readiness, provider matrix, API + DB/Redis integration, end-to-end Kyiv/Lviv cases, all-screen visual report, accessibility/device report, security/dependency scan, backup/restore, monitoring/alerts, rollback rehearsal, iOS signing/device proof і owner-approved launch checklist.

## 10. Пріоритезований план робіт

| Пріоритет | Задача | Готово, коли |
|---|---|---|
| **P0-1** | Єдиний release baseline: точні reviewed SHAs root/Site/Server/iOS, migration/API version, чисте походження artifact | Manifest відтворюється clean build-ом, всі components pinned; CI зелений на цьому самому наборі SHA; поточні паралельні checkout-и не потрапляють випадково в release |
| **P0-2** | Unified route/provider contract і режимні capability states | Всі modes мають source/coverage/return/availability/price/freshness; API й UI однаково розрізняють map-only/estimate/live/bookable |
| **P0-3** | Real walking/cycling/scooter routing geometry | Transit shapes та router geometry використовуються для усіх legs; estimates мають явний accuracy label; жодна straight line не видається за дорогу |
| **P0-4** | Мультимодальний graph composer + bounded-search truth | Kyiv/Lviv acceptance matrix проходить; всі constraints/transfer waits/unknowns валідні; truncation коректно позначена; відсутні provider edges не фальсифікуються |
| **P0-5** | GTFS/GBFS data readiness та карта | Імпорт із license/freshness/quality; усі Metro lines/stations і доступні mobility points відображаються, з правильним coverage, зупинками, статусом і атрибуцією |
| **P0-6** | Візуальна відповідність 19 фото | Approved source crops, exact mappings, diff goldens для світлого/темного, усіх потрібних map/sheet/navigation станів; interaction E2E пройшов |
| **P0-7** | Staging/production deployment foundation | Hosted staging і production target/domain, managed DB/Redis/storage, TLS, secret manager, migration/rollback/restore, metrics/alerts налаштовані та пройшли rehearsal |
| **P1-1** | Realtime, ETA і навігація на пристрої | Стандартизована freshness, live Metro/transport updates за наявності; реальний iPhone foreground flow, GPS progress, reroute, reconnect/finish acceptance |
| **P1-2** | Rental availability/booking | Для оператора з офіційним API — inventory snapshot, pricing, rental authorization/handoff, return confirmation; без цього зберігати estimate-only |
| **P1-3** | KiwiTaxi/Intui, taxi, carsharing | Власник надає потрібні підписані доступи/контракти; quote/search/timeout/fallback/cancel/handoff/terms проходять sandbox і staging contract tests |
| **P1-4** | Безпека та підтримка | Privacy/legal review, location retention/deletion, abuse controls, support rota, user safety escalation й incident runbooks прийняті власником |
| **P2** | Платежі/settlement, offline, push та розширення міст | Виконувати тільки після конкретного provider/contract/business decision; кожне місто приймається окремо за data coverage й SLO |

## 11. Рекомендований Definition of Done

MARSHGO можна назвати production-ready для визначеного launch scope, тільки якщо:

1. Exact-SHA release build розгортається на staging та відтворюється із CI artifact provenance.
2. Усі доступні в launch містах modes мають актуальну matrix і джерела з прийнятими правами; unsupported mode чесно повертає empty/unavailable.
3. Kyiv Metro + bicycle/scooter та Lviv bicycle + transit ланцюги зібрані з правильною provider/zone політикою, маршрутизованою геометрією, сумою відстаней/часів і зрозумілою невизначеністю.
4. Реальна booking capability ніколи не виводиться зі статичної точки чи estimate; booking gate залежить від verified provider/availability.
5. Всі 19 canonical reference states мають reviewed visual compare й функціональні interactions, light/dark/mobile/accessibility прийняті.
6. Staging paired-user/device, privacy/security, load, backup/restore, alerting і rollback сценарії пройшли; production support owner призначений.
7. Кожен зовнішній blocker або виконаний власником і повторно перевірений, або вилучений із початкового launch scope з явним рішенням продукту. Не можна приховати незавершений режим, залишивши його активним в UI.

### Джерела аудиту у workspace

- [RELEASE_MANIFEST.json](../RELEASE_MANIFEST.json) — latest candidate verification і NOT_RELEASED status.
- [UI_REFERENCE_MATRIX.md](UI_REFERENCE_MATRIX.md) — групування еталонних сцен і критерії, які вже pending.
- [PRODUCTION_GAP_ANALYSIS.md](PRODUCTION_GAP_ANALYSIS.md) — конкретні GTFS search виміри/truncation і попередня перевірка geometry.
- [PRODUCTION_PROVIDER_MATRIX.md](PRODUCTION_PROVIDER_MATRIX.md) — зовнішні provider credentials/terms та service blockers.
- `MarshGO-Server/server/journey/planner.ts`, `micromobilityEstimates.ts`, `gbfsGeofences.ts`, `rentalCompatibility.ts` — межа між option composition, estimates і валідованою орендою.
- `MarshGO-Site/src/views/JourneyRouteMapScreen.tsx`, `src/map/journeyRouteModel.ts`, `src/views/ProductionNavigation.tsx` — map/sheet/navigation presentation, підлягають прийманню на тих самих release pins.

## 12. Обов’язковий протокол виконання Codex: не зупинятися на аудиті

Цей документ є завданням на виконання, а не лише на оцінювання. Аудит, таблиця прогалин і відсотки — проміжні результати. Вони не закривають роботу, поки не реалізовано й не перевірено всі пункти для погодженого launch scope або не зафіксовано конкретну зовнішню перешкоду, яку неможливо усунути з доступів цього середовища.

### 12.1 Робочий цикл

Поки залишається незакритий і доступний для виконання пункт P0/P1, Codex повинен повторювати цикл без запиту «що робити далі?»:

1. Вибрати найвищий за пріоритетом незакритий пункт із цього ТЗ та актуального execution checkpoint.
2. Перевірити поточний стан відповідного репозиторію, гілки, незбережених змін і тестів; зберегти чужі та попередні зміни.
3. Реалізувати найменший повний вертикальний фрагмент через потрібні шари — контракт/API, сервер, клієнт, карта/iOS, коли вони потрібні.
4. Додати або оновити перевірки саме для вимоги, прогнати їх, виправити знайдені дефекти й повторювати, поки перевірка не пройде або не доведено зовнішню залежність.
5. Запустити регресійні перевірки, які зачіпає зміна; не вимикати, не видаляти й не послаблювати тест заради зеленого результату.
6. Оновити checkpoint доказами: SHA, змінені файли, точні команди та кількість pass/fail/skip, посилання на CI/staging, відомі обмеження.
7. Одразу перейти до наступного незакритого пункту. Після локального тесту, аудиту, реалізації одного модуля або повідомлення про помилки не завершувати роботу, якщо лишилися інші доступні кроки.

### 12.2 Що не є підставою зупинити роботу

Не завершувати завдання лише тому, що:

- аудит виявив багато помилок або оцінка готовності низька;
- один тест, build, CI чи локальний провайдер упав — спочатку встановити причину, виправити код/конфігурацію та повторити перевірку;
- робота велика, потребує кількох послідовних етапів або не вкладається в один короткий звіт;
- одна зовнішня інтеграція заблокована — продовжити всі незалежні модулі, контрактні тести, mock-free failure states та підготовку конфігурації;
- завершився один логічний етап — одразу перейти до наступного за checkpoint.

Не називати систему «працює», «готова» або «production-ready» на підставі лише компіляції, typecheck, unit-тесту, попереднього звіту чи наявності файлу/endpoint-а. Повідомлення про помилку є проміжним статусом, а не фінальною відповіддю.

### 12.3 Дозволені hard blockers

Зупинити лише дію, яка справді залежить від зовнішнього рішення або доступу:

- відсутній партнерський контракт, API key, SMS/APNs/map/routing credential або права на використання даних;
- відсутній доступ до потрібного GitHub, staging/production host, secret manager, Apple signing account чи фізичного пристрою;
- небезпечна/незворотна операція з production-даними, для якої немає підтвердженої процедури відновлення;
- суперечливі вимоги не можна однозначно звести до вже затвердженого канону;
- окреме підтвердження власника, прямо визначене цим ТЗ.

Для кожного blocker записати: що саме заблоковано, який credential/access/рішення потрібен, як його безпечно надати або виконати, які суміжні задачі продовжуються. Не просити секрети в чаті чи коміті; запитати лише потрібну дію/доступ. Не позначати blocker-ом задачу, для якої є безпечний локальний або staging-крок.

### 12.4 Checkpoint і відновлення після переривання

Перед завершенням будь-якого активного turn, коли лишається невиконана робота, створити або оновити `docs/audit/PRODUCTION_EXECUTION_CHECKPOINT.md` у власницькому репозиторії, не перезаписуючи його попередній вміст без перевірки. Записати:

- дату/час, launch scope та exact SHA/гілки всіх задіяних репозиторіїв;
- останній завершений пункт acceptance matrix і докази;
- точний незакритий пункт, наступну конкретну дію та команду/перевірку;
- локальні зміни й середовищні обмеження, які треба зберегти;
- зовнішні blockers і продовжені незалежні задачі.

Після переривання почати з цього checkpoint і фактичного Git status, а не повторювати аудит з нуля. Не стверджувати, що процес продовжувався у фоні, якщо Codex/комп’ютер були вимкнені. Сам текст ТЗ не може утримувати процес активним після завершення turn, закриття Codex або сну комп’ютера; checkpoint забезпечує безпечне продовження в наступному активному turn.

### 12.5 Статуси доказів

Для кожної вимоги використовувати лише один із статусів:

- `NOT_STARTED` — коду/перевірки ще немає;
- `IMPLEMENTED` — код є, але потрібні перевірки не пройдені;
- `LOCAL_VERIFIED` — локальні тести пройшли на записаному SHA;
- `STAGING_VERIFIED` — інтеграційний сценарій прийнято на записаному staging SHA та конфігурації;
- `PRODUCTION_VERIFIED` — production endpoint/пристрій перевірено після погодженого релізу з зафіксованим доказом;
- `BLOCKED_EXTERNAL` — потрібна конкретна зовнішня умова; незалежні роботи продовжуються.

Загальне «готово» дозволено тільки коли всі обов’язкові acceptance пункти мають відповідний доказ на сумісному exact-SHA наборі. Якщо виробничий запуск не завершений, фінал має прямо казати `PRODUCTION_READY=NO` і називати останній пройдений gate.

### 12.6 Production deployment gate

Codex повинен автономно довести код, CI, release candidate, staging, smoke/E2E, резервне копіювання, restore, моніторинг та rollback до reviewable стану. Однак початкове правило власника залишається чинним: **не перемикати production traffic, не запускати destructive migration на production і не публікувати App Store build без окремого явного підтвердження власника**. Підтвердження запитується лише після готового кандидата, точних SHA, звіту staging-перевірок, плану/вікна deployment і rollback-плану. До того моменту продовжувати весь безпечний незалежний обсяг робіт.

### 12.7 Формат прогресу без передчасного фіналу

Під час довгої роботи давати короткий статус після завершеного P0/P1 фрагмента:

`Етап → що змінено → репозиторій/гілка/SHA → конкретні перевірки pass/fail → blocker (якщо є) → наступний пункт, який вже виконується.`

Не просити користувача вибрати наступний пункт, якщо порядок уже визначений цим ТЗ. Повний звіт надати після досягнення погодженого deployment gate або після того, як усі решта задач дійсно `BLOCKED_EXTERNAL`; у другому випадку чітко розділити зроблену роботу й зовнішні залишки.
