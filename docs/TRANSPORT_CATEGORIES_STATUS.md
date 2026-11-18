# Transport categories status — MARSHGO

Generated 2026-11-18T21:49:16.478Z. Machine-readable: `docs/evidence/national-coverage-2026-11-18/transport-categories.json`.
Evidence base: enabled provider rows in `mobility_providers`, the licensed feed set, the 702-direction matrix and the tested passenger/driver lifecycle.

| Category | Status | Blocker | Impact |
| --- | --- | --- | --- |
| Попутка (`carpool`) | PARTIAL | Немає реальної пропозиції водіїв; потрібна маркетингова поставка та верифікація водіїв. | Не є транспортним джерелом покриття, доки немає реальних поїздок. |
| Маршрутка (`marshrutka`) | DATA_GAP | Ліцензія/договір з inbus.ua та перевізниками маршруток. | Маршрутні перевезення не беруть участі у плануванні. |
| Автобус (`bus`) | VERIFIED_ROUTE | — | Міські автобуси доступні у 5 містах; міжміські автобуси — лише Укрзалізниця/rail-мережа як залізниця, автобусні міжміські — ні. |
| Таксі (`taxi`) | PROVIDER_BLOCKED | Партнерський API/договір Bolt та Uklon; без нього ціна й доступність невідомі. | Таксі не пропонується у планувальнику. |
| Трамвай (`tram`) | VERIFIED_ROUTE | — | Лише Київ і Львів. |
| Тролейбус (`trolleybus`) | VERIFIED_ROUTE | — | Лише Київ та Івано-Франківськ. |
| Метро (`metro`) | PROVIDER_BLOCKED | Доступ до офіційного розкладу КП «Київський метрополітен» або дозвіл на публікацію. | Метро вимкнене, не симулюється. |
| Поїзд (`train`) | VERIFIED_ROUTE | Повний офіційний фід УЗ не публікується; наявна мережа неповна (немає зупинок у 9 обласних центрах). | Залізниця покриває частину напрямків; це джерело не є офіційним фідом перевізника. |
| Велосипед (`bike`) | PROVIDER_BLOCKED | Договір з Bikenow; GBFS Nextbike Wrocław — не українська мережа. | Оренда велосипедів недоступна. |
| Самокат (`scooter`) | STALE | Стабільний GBFS-ендпоінт і підтверджена доступність транспортних засобів. | Оренда самокатів не показується як доступна. |
| Каршеринг (`carsharing`) | PROVIDER_BLOCKED | Договір з Getmancar або іншим оператором каршерингу. | Каршеринг відсутній. |
| Трансфер (`transfer`) | DATA_GAP | Договір з трансферним оператором (аеропорт/міжміський трансфер). | Трансфер не є доступною категорією. |
| Пішки (з’єднувач) (`walk`) | PARTIAL | Розгорнутий пішохідний графік (OSRM foot) для реальної геометрії. | Матриця доступності зупинок не підтверджує пішохідну прохідність. |

## What the status values mean

- `VERIFIED_ROUTE` — a licensed feed supplies the service and it appears in measured routes.
- `PARTIAL` — the product path works end to end, but the supply side is not real yet (carpool) or the walk geometry is unverified (walk).
- `DATA_GAP` — no licensed data source exists for the category.
- `PROVIDER_BLOCKED` — a provider is identified but disabled pending a partnership contract.
- `STALE` — a provider is enabled but its feed health is degraded, so availability is not claimed.

## Evidence per category

### Попутка

Платформний життєвий цикл попутки перевірено e2e-тестами (два акаунти, бронювання, QR, завершення). У локальній БД 52 опублікованих пропозицій — це тестові дані, не реальний ринок.

### Маршрутка

Жоден ліцензований GTFS-фід не публікує маршрутки окремим route_type; inbus.ua та VD-Express містять міжміські автобуси, але без підтвердженої комерційної ліцензії.

### Автобус

Ліцензовані GTFS: Київ — метро (GeoJSON геометрія) (Київ); Укрзалізниця — розклад поїздів (GTFS) (Україна); Dozor — Ів-Франківськ позиції (JSON) (Івано-Франківськ); Івано-Франківськ — позиції (Dozor JSON) (Івано-Франківськ); Стрийська міська рада — розклад (GTFS) (Стрий); Івано-Франківськ — розклад (GTFS, Dozor) (Івано-Франківськ); Київпастранс — розклад (GTFS) (Київ); Київ — фунікулер (GeoJSON геометрія) (Київ); Львівавтодор — розклад (GTFS) (Львів); Ужгородська міська рада — розклад (GTFS) (Ужгород); Київ — маршрутки (GeoJSON геометрія) (Київ); Київ — міська електричка (GeoJSON геометрія) (Київ).

### Таксі

Провайдери: Uklon — Таксі=disabled/REQUIRES_PARTNERSHIP, Bolt — Таксі=disabled/REQUIRES_PARTNERSHIP.

### Трамвай

Київпастранс і Львівавтодор GTFS містять трамвайні маршрути; трамвайні сегменти присутні у перевірених ланцюжках (Київ→Львів, Львів→Рівне).

### Тролейбус

Київпастранс та Івано-Франківськ GTFS; тролейбусні сегменти у перевірених ланцюжках.

### Метро

gisserver.kyivcity.gov.ua не відповідає, data.kyivcity.gov.ua повертає порожній редірект; офіційного GTFS метро немає.

### Поїзд

Укрзалізниця (ODbL, OSM-derived GTFS): 113 зупинок у межах України, сервіс 2026-09-04 → 2027-12-11; залізничні маршрути підтверджені матрицею.

### Велосипед

Провайдери: Bikenow — Велопрокат=disabled/REQUIRES_PARTNERSHIP, Nextbike Wrocław (тест)=disabled/DISCOVERED.

### Самокат

Zelectra enabled, але health=degraded і discovery_status=TEMPORARILY_UNAVAILABLE; доступність оренди не підтверджена.

### Каршеринг

Провайдери: Getmancar — Каршеринг=disabled/REQUIRES_PARTNERSHIP.

### Трансфер

Партнерський модуль трансферів існує, але жодного авторизованого постачальника трансферів не підключено.

### Пішки (з’єднувач)

Пішохідні плечі будуються пішохідним маршрутизатором, коли налаштований OSRM/pedestrian сервіс; без нього доступність зупинок вимірюється прямою відстанню і не є перевіреною пішохідною геометрією.
