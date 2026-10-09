# ТЗ ДЛЯ CODEX — MARSHGO: ПОВНА АВТОМАТИЧНА ІНТЕГРАЦІЯ ТРАНСПОРТУ КИЄВА

## 1. Головна мета

Реалізувати в MARSHGO повноцінний Kyiv Mobility & Transport Engine, який автоматично отримує, нормалізує, кешує та відображає всі доступні офіційні/open-data види транспорту Києва.

Не створювати окрему реалізацію для кожного виду транспорту.

Побудувати універсальну архітектуру:

```
DATA SOURCES
     ↓
PROVIDER ADAPTERS
     ↓
NORMALIZATION ENGINE
     ↓
PostGIS + Redis
     ↓
MARSHGO Transport API
     ↓
MapLibre / Web
     ↓
iOS
```

Після реалізації Києва архітектура повинна дозволяти додати Львів, Одесу, Дніпро та інші міста без переписування ядра.

---

## 2. ОБОВ’ЯЗКОВІ ВИДИ ТРАНСПОРТУ

Підключити всі доступні джерела, які реально існують і дозволені для використання.

**Громадський транспорт**
1. 🚌 Автобуси
2. 🚎 Тролейбуси
3. 🚋 Трамваї
4. 🚐 Маршрутні таксі
5. 🚇 Метро
6. 🚆 Київська міська електричка / Kyiv City Express
7. 🚠 Фунікулер

**Shared Mobility**
8. 🚲 Велосипеди
9. ⚡ Електровелосипеди
10. 🛴 Електросамокати
11. 🛵 Електромопеди / електроскутери
12. 🛵 Інші доступні двоколісні shared vehicles
13. 🚗 Каршеринг

**Майбутні типи**
Архітектура повинна дозволяти без зміни core додати:
- FERRY
- CABLE_CAR
- TAXI
- CARPOOL
- PARKING
- EV_CHARGER
- BIKE_PARKING
- SCOOTER_PARKING

Якщо конкретного відкритого API зараз немає — не вигадувати його. Провайдер повинен мати статус:
- AVAILABLE
- NOT_AVAILABLE
- REQUIRES_PARTNERSHIP
- TEMPORARILY_UNAVAILABLE

---

## 3. ФУНІКУЛЕР — ОКРЕМИЙ ВИД ТРАНСПОРТУ

Це обов’язкова вимога.
Не записувати фунікулер як метро, трамвай або автобус.

Створити окремий canonical mode: `FUNICULAR`

- У UI: Фунікулер
- У routing engine: `mode = FUNICULAR`

Підтримати:
- станції;
- маршрут;
- напрямок;
- розклад;
- пересадки;
- час відправлення;
- час прибуття;
- геометрію;
- інформацію про актуальність даних.

Фунікулер повинен брати участь у мультимодальному маршруті:
`Пішки ↓ Фунікулер ↓ Пішки`
або:
`Метро ↓ Пішки ↓ Фунікулер ↓ Пішки`

---

## 4. GTFS

Реалізувати універсальний GTFS importer.

Підтримати:
- agency.txt
- routes.txt
- stops.txt
- trips.txt
- stop_times.txt
- calendar.txt
- calendar_dates.txt
- shapes.txt
- transfers.txt
- frequencies.txt

Не робити Kyiv-specific parser. Має бути `GTFSProvider`, який може працювати з будь-яким містом.

---

## 5. GTFS REALTIME

Підключити GTFS-Realtime там, де він доступний.

Підтримати:
- VehiclePositions
- TripUpdates
- ServiceAlerts

Realtime vehicle model:
```json
{
  "id": "...",
  "routeId": "...",
  "tripId": "...",
  "lat": 0,
  "lon": 0,
  "bearing": 0,
  "speed": 0,
  "timestamp": 0
}
```
Швидкість нормалізувати в: `km/h`

---

## 6. КИЇВСЬКІ ОФІЦІЙНІ API

Провести автоматичний аудит офіційного порталу відкритих даних Києва.
Не використовувати вигадані endpoints.

Для кожного знайденого dataset/API визначити:
- name
- url
- format
- license
- update_frequency
- static/realtime
- transport_mode
- authentication
- status

Після цього автоматично створити provider configuration.

---

## 7. ROUTETAXI

Підключити офіційне джерело маршрутних таксі.
Нормалізувати: `mode = MINIBUS`

Підтримати:
- номер маршруту;
- напрямок;
- геометрію;
- зупинки;
- назву маршруту;
- актуальність даних.

Не плутати `MINIBUS` із `TAXI`.

---

## 8. METRO

Підключити доступні офіційні дані Київського метро.
Модель: `mode = METRO`

Підтримати:
- лінії;
- станції;
- пересадки;
- напрямки;
- розклад;
- час очікування;
- геометрію.

На карті: metro lines, metro stations, metro labels.

---

## 9. KYIV CITY EXPRESS

Створити: `mode = CITY_TRAIN`

Підтримати:
- станції;
- пересадки;
- маршрути;
- графік;
- напрямки;
- realtime, якщо доступний.

---

## 10. SHARED MOBILITY — GBFS

Реалізувати універсальний `GBFSProvider`. Це ключова частина.

Підтримати стандартні GBFS feeds:
- station_information
- station_status
- free_bike_status
- vehicle_status
- vehicle_types
- system_information
- geofencing_zones
- system_alerts

де вони доступні.

---

## 11. ЕЛЕКТРОСАМОКАТИ

Автоматично знаходити та реєструвати відкриті GBFS feeds операторів Києва.
**ВАЖЛИВО:** Не вигадувати операторів або URL.

Для кожного знайденого оператора перевірити:
- GBFS available?
- Feed reachable?
- License?
- Commercial use allowed?
- Realtime?
- Vehicles?
- Stations?
- Geofencing?

Якщо відкритого feed немає: `status = REQUIRES_PARTNERSHIP` і не робити scraping.

---

## 12. ВЕЛОСИПЕДИ

Підключити доступні GBFS feeds велосипедних систем.
Показувати:
- велосипеди;
- електровелосипеди;
- станції;
- кількість доступних велосипедів;
- кількість вільних місць;
- тип велосипеда;
- координати.

---

## 13. ЕЛЕКТРОМОПЕДИ / ЕЛЕКТРОСКУТЕРИ

Якщо оператор надає GBFS: `vehicle_type = SCOOTER / MOPED / OTHER` нормалізувати його.
Якщо оператор має інший офіційний API: створити окремий adapter `OperatorProvider`, але привести результат до `SharedMobilityVehicle`.

---

## 14. КАРШЕРИНГ

Передбачити: `CARSHARING`

Підтримувати:
- vehicle location;
- доступність;
- vehicle type;
- battery/fuel, якщо оператор дозволяє;
- zone;
- pricing, тільки якщо офіційно доступне;
- booking URL/API, тільки якщо офіційно дозволено.

Не робити scraping.

---

## 15. ЄДИНА CANONICAL MODEL

Створити:
- TransportRoute
- TransportStop
- TransportStation
- TransportTrip
- TransportVehicle
- TransportOperator
- TransportService
- TransportAlert
- TransportTransfer
- SharedMobilityVehicle
- SharedMobilityStation
- MobilityZone

Тип:
```typescript
enum TransportMode {
 BUS
 TROLLEYBUS
 TRAM
 MINIBUS
 METRO
 CITY_TRAIN
 FUNICULAR
 BIKE
 E_BIKE
 SCOOTER
 E_SCOOTER
 MOPED
 CARSHARING
 TAXI
 FERRY
 OTHER
}
```

---

## 16. PROVIDER REGISTRY

Створити реєстр: `TransportProviderRegistry`

Приклад:
- GTFSProvider
- KyivOpenDataProvider
- KyivRealtimeProvider
- KyivMetroProvider
- KyivCityExpressProvider
- KyivFunicularProvider
- GBFSProvider

Конфігурація:
```yaml
provider:
  city: kyiv
  type: gbfs
  operator: example
  enabled: true
  feedUrl: ...
  updateInterval: 30
```

---

## 17. АВТОМАТИЧНЕ ОНОВЛЕННЯ

Система повинна сама:
`download ↓ validate ↓ parse ↓ normalize ↓ deduplicate ↓ store ↓ cache ↓ publish`

Якщо джерело змінило URL або структуру: `provider health = ERROR`, а не падіння всього сервера.

---

## 18. DATA QUALITY

Перед публікацією перевіряти: координати; дублікати; route IDs; stop IDs; timestamps; geometry; invalid records; stale data; missing fields.
Погані записи не повинні ламати весь ingestion.

---

## 19. REALTIME STATUS

Кожен provider повинен мати: `LIVE`, `STALE`, `OFFLINE`, `ERROR`.
TTL має бути конфігураційним.

---

## 20. POSTGIS

Зберігати: routes; stops; stations; shapes; vehicles; zones; service areas; geofencing.
Використовувати spatial indexes.
Не завантажувати всю Україну в браузер.

---

## 21. REDIS

Redis використовувати для: realtime vehicles; provider cache; nearby vehicles; departures; temporary route data; realtime subscriptions.
PostgreSQL/PostGIS залишається source of truth для persistent data.

---

## 22. MAPLIBRE

Створити окремі layers:
- transport-routes
- transport-stops
- transport-stations
- transport-vehicles
- transport-labels
- shared-mobility-vehicles
- shared-mobility-stations
- mobility-zones

Користувач повинен мати можливість вмикати/вимикати різні види транспорту.

---

## 23. НЕ ЗАВАНТАЖУВАТИ ВСЕ ОДРАЗУ

Обов’язково: viewport/BBOX loading та clustering, LOD, vector tiles, caching. Особливо для realtime vehicles.

---

## 24. МУЛЬТИМОДАЛЬНИЙ ROUTING

Routing engine повинен розуміти всі підключені режими (WALK, BIKE, METRO, FUNICULAR тощо) і будувати комбіновані маршрути (напр., Пішки ↓ Метро ↓ Пішки).

---

## 25. FRONTEND НЕ ПОВИНЕН ЗНАТИ ПРОВАЙДЕРІВ

Заборонено: `if Kyiv then call Kyiv API`
Frontend працює тільки з MARSHGO API.

---

## 26. API MARSHGO

Створити unified API:
- GET /api/transport/cities
- GET /api/transport/modes
- GET /api/transport/routes
- GET /api/transport/stops
- GET /api/transport/stations
- GET /api/transport/vehicles
- GET /api/transport/vehicles/nearby
- GET /api/transport/departures
- GET /api/transport/search
- GET /api/transport/route
- GET /api/transport/providers
- GET /api/transport/health

---

## 27. PROVIDER HEALTH DASHBOARD

Створити backend/admin endpoint: `GET /api/transport/health` (показує статус LIVE/STALE/OFFLINE для кожного провайдера).

---

## 28. АВТОМАТИЧНЕ ВИЯВЛЕННЯ НОВИХ ДЖЕРЕЛ

Створити механізм `Provider Discovery`. Новий feed потрапляє у `DISCOVERED`, потім `VALIDATED`, потім `ENABLED`. Не вмикати в production без перевірки ліцензії.

---

## 29. БЕЗПЕКА

Не використовувати: scraping; обхід authentication; приватні API keys; reverse engineering; неофіційні endpoints.
Якщо API вимагає партнерства: `REQUIRES_PARTNERSHIP` і продовжити роботу з іншими джерелами.

---

## 30. ЛІЦЕНЗІЇ

Для КОЖНОГО provider зберігати ліцензійну інформацію. Не підключати джерело, якщо юридичні умови незрозумілі.

---

## 31. ЧОТИРИ РЕПОЗИТОРІЇ MARSHGO

Працювати незалежно з:
- dima1203oleg/MarshGO
- dima1203oleg/MarshGO-Server
- dima1203oleg/MarshGO-Site
- dima1203oleg/MarshGO-iOS

Провести аудит усіх чотирьох. Не припускати, що зміна в одному repo автоматично змінює інші.

---

## 32. ПОРЯДОК РОБОТИ CODEX

STEP 1: Перевірити git status/log у кожному repo.
STEP 2: Знайти існуючу архітектуру (MapLibre, routing, GTFS, Redis, PostGIS).
STEP 3: Не створювати дублікати.
STEP 4: Реалізувати Transport Provider architecture.
STEP 5: Підключити Київ.
STEP 6: Підключити realtime.
STEP 7: Підключити GBFS.
STEP 8: Підключити фунікулер.
STEP 9: Підключити MapLibre layers.
STEP 10: Підключити routing.
STEP 11: Запустити тести.
STEP 12: Запустити E2E.
STEP 13: Перевірити реальні дані.
STEP 14: Зробити commit окремо в кожному repo.
STEP 15: Push у правильну гілку.

---

## 33. ЗАБОРОНА FAKE IMPLEMENTATION

Codex не має права писати `TODO: connect API` або `mock vehicles`.
Якщо джерело недоступне — написати `SOURCE UNAVAILABLE`.

---

## 34. ТЕСТОВИЙ РЕЗУЛЬТАТ

У фінальному звіті Codex повинен показати зведену таблицю по всіх підключених видах транспорту (Static / Realtime / Карта / Routing / Статус).

---

## 35. КРИТЕРІЙ ЗАВЕРШЕННЯ

Задача НЕ вважається виконаною, доки реальні дані не проходять нормалізацію, не з'являються на карті, і тести не проходять.
Головний принцип: не робити «київський костиль». Побудувати універсальний транспортний двигун MARSHGO, де Київ — перший повністю підключений регіон.
