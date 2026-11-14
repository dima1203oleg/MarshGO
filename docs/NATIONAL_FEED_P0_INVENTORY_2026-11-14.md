# MARSHGO — національна інтеграція транспорту: P0 інвентаризація, дедуплікація, датовані перевірки

**Виміряно:** 2026-11-14 14:36–14:38 UTC (HTTP `Date` сервера збігається з локальним годинником).
**Статус продукту:** NOT_RELEASED. **Рівень доказу:** read-only мережеві виміри + аналіз каталогу; інтеграція в Journey Engine NOT_MEASURED.
**Виконавець:** Qoder. Жодних змін runtime, БД, портів 3002/7777/zrok, секретів чи чужих dirty-файлів.

## 1. Вхідні матеріали

| Матеріал | Стан |
|---|---|
| Майстер-специфікація «NATIONAL TRANSPORT INTEGRATION MASTER TASK» (889 рядків, 24 розділи) | передана власником як вкладення, прочитана |
| Реєстр фідів TSV (33 записи × 29 колонок) | переданий як вкладення, розпарсений |
| `MARSHGO_UKRAINE_TRANSPORT_RESEARCH_PACKAGE_2026-11-14.zip` (13 файлів: 01–08 MD, CSV/JSON/XLSX реєстри, матриця покриття) | **NOT_FOUND**: пошук у `~/Desktop`, `~/Downloads`, `~/Desktop/MarshGO` (глибина 3–4) і worktrees `app/*` нічого не дав. Вміст не вигадано; працюємо з наявними 33 записами та каталогом сервера |
| `MarshGO-Server/TRANSPORT_PROVIDER_REGISTRY.json` (schemaVersion 2) | наявний: `feeds` = 88, `sources.catalog` посилається на `server/mobility/ukraineCatalog.ts` (88 рядків; legacy root copy — 43-рядковий піднабір) |
| `MarshGO-Server/docs/TRANSPORT_FEED_AUDIT.md` (2026-11-12T02:11:53Z) | наявний: 88 рядків, 36 не-SKIPPED, **0 датованих вимірів**, 12 HEALTHY / 9 DEGRADED / 15 OFFLINE / 52 SKIPPED |

Стан probe у поточному JSON підтверджено незалежно: SKIPPED 52, OFFLINE 15, HEALTHY 12, DEGRADED 9; `measurementAt = null` у всіх 88. Тобто старі HEALTHY **не** є поточним VERIFIED LIVE.

## 2. Дедуплікація 33 ↔ 88 (без створення дублікатів)

Метод: нормалізація scheme/host/path (зрізано `www.`, query, fragment), окремо — збіг на рівні dataset-id порталів.

- **18 записів уже покриті каталогом:**
  - 14 точних збігів URL: MG-UA-001→feed-01, 002→feed-02, 003→feed-03, 004→feed-04, 005→feed-05, 006→feed-08, 007→feed-09, 008→feed-30, 012→feed-10, 013→feed-11, 026→feed-28, 027→feed-07, 030→feed-29, 031→feed-25.
  - 4 збіги на рівні dataset: MG-UA-009 і 011 → dataset `rozklad-rukhu-miskoho-elektrychnoho…` (feed-74/79/80/81/85/86); MG-UA-010 і 033 → dataset `dani-pro-mistse-rozmishchennia-zupynok…` (feed-87/88).
- **15 записів нові для каталогу:**
  - 7 dataset-сторінок `data.gov.ua`, яких немає в 88: MG-UA-014 (`48a8eecb…`, Чернівці розклад), 015 (`95387589…`, зупинки тролейбусів, HISTORICAL), 017 (`ac81e2c1…`, ІФ timetable), 020 (`cb739e09…`, Хмельницький розклад), 021 (`a79220c8…`, Хмельницький зупинки), 022 (`79327f64…`, Суми, HISTORICAL), 023 (`po3kjiad-pyxy…`, Вінниця архів, HISTORICAL).
  - 3 пошукові сторінки порталів (не є фідами, потрібне звуження до ресурсу): MG-UA-016 (Чернівці, організація+теги), 018 і 019 (ІФ, організація).
  - 5 нових хостів: MG-UA-024 FlixBus EU GTFS, 025 FlixBus Partner API, 028 Kiwitaxi Partner, 029 Bolt Fleet, 032 Nextbike/OSM (сторінка ліцензії, не фід).

Наслідок: імпорт має додати **щонайбільше 12 придатних кандидатів** (7 dataset + 3 пошукові сторінки після звуження + FlixBus EU + GBFS-подібні), а не 33; партнерські й авторизаційні записи лишаються в реєстрі зі статусом доступу, без активації.

## 3. Датовані перевірки endpoint (24 проби, серійно, `curl --max-time 20`)

Пропущено за політикою доступу: AUTH REQUIRED (012, 013), PARTNER ACCESS (025, 028, 029), HISTORICAL (015, 022, 023), а також сторінку ліцензії OSM (032). Сирий лог: `docs/evidence/feed-probe-2026-11-14.tsv`.

| Feed | URL (скорочено) | HTTP | Розмір / тип | Датований доказ свіжості |
|---|---|---|---|---|
| MG-UA-001 Львів static | track.ua-gis.com/gtfs/lviv/static.zip | 200 | 4 218 145 B, application/zip | `Last-Modified: 2026-11-14 00:06:54 GMT` — **сьогодні** |
| MG-UA-002 Львів RT vehicle | …/lviv/vehicle_position | 200 | 46 828 B, x-protobuf | FeedHeader.timestamp = **2026-11-14T14:37:23Z**, 426 entity — LIVE |
| MG-UA-003 Львів RT trip updates | …/lviv/trip_updates | 200 (HEAD) | — | тіло не завантажувалось; NOT_MEASURED |
| MG-UA-004 Стрий static | …/stryi/static.zip | 200 | 472 083 B, zip | `Last-Modified: 2026-11-14 00:07:02 GMT` |
| MG-UA-005 Ужгород static | …/uzhhorod/static.zip | 200 | 525 408 B, zip | `Last-Modified: 2026-11-14 00:07:29 GMT` |
| MG-UA-006 Київпастранс static | http://193.23.225.211:8002/export-gtfs-static | HEAD 405 → GET 200 | 1 356 782 B, zip | Range ігнорується (віддає весь файл); **HTTP-only**, без TLS |
| MG-UA-007 Київпастранс RT | http://193.23.225.214:732/api/realtime | HEAD 405 → GET 200 | 22 663 B, x-protobuf | FeedHeader.timestamp = **2026-11-14T14:37:15Z**, 331 entity — LIVE; **HTTP-only** |
| MG-UA-008 Київ HTTPS mirror | jbb.ghsq.de/gtfs/ua-kyiv.gtfs.zip | 200 | 1 356 782 B, zip | `Last-Modified: 2026-11-13 23:00:05 GMT`; розмір збігається з 006 |
| MG-UA-024 FlixBus EU | gtfs.gis.flix.tech/gtfs_generic_eu.zip | 301→200 | 31 412 778 B, zip | HTTP редиректить на HTTPS; **31 MB** — важкий парсинг, лише за ресурсами GREEN |
| MG-UA-026 VD-Express | vdexpress.net/api/gtfs/feed | HEAD 200 (14:36:22), повторний HEAD **timeout 20 s** (14:37) | — | нестабільний; NOT_VERIFIED, потрібна повторна проба |
| MG-UA-027 3electra GBFS v3 | zelectra.rideatom.com/gbfs/66/v3.0/gbfs | 200 | 968 B, JSON | `last_updated: 2026-11-14T14:37:24.152Z`, ttl 0, version 3.0; discovery містить system_information, station_information/status, vehicle_types, vehicle_status — LIVE |
| MG-UA-030 УЗ mirror | jbb.ghsq.de/gtfs/ua-ukrzaliznytsya.gtfs.zip | 200 | 5 758 058 B, zip | `Last-Modified: 2026-11-09 23:00:09 GMT` — **5 діб**, свіжість рейсів NOT_VERIFIED |
| MG-UA-031 Дніпро iCity GPS | api-t900.icity.com.ua/api/gps_data/ | 200 | 80 612 B, JSON | `timestamp` = 2026-11-14T14:37:25Z, 404 позиції, медіанний вік 7 s — LIVE, але якість нижче |
| MG-UA-009/010/011/033 Київ портали | data.kyivcity.gov.ua/dataset/… | 200 (HEAD) | HTML-сторінки dataset | це сторінки каталогу, не фіди; потрібне витягування resource-URL |
| MG-UA-014/016/017/018/019/020/021 | data.gov.ua/dataset… | 200 (HEAD) | HTML-сторінки dataset/пошуку | ресурси ще не ідентифіковані; формат і ліцензія NOT_MEASURED |

## 4. Знайдені дефекти даних (не вигадані, виміряні)

1. **Дніпро iCity: 111 із 404 позицій непридатні (27,5%).** 92 записи мають координати поза допустимими межами (`lat 417.4653346, lon 352.439963`); після ділення на 10 виходить `lat 41.7447–41.7467, lon 35.2437–35.2457`, що **не** відповідає Дніпру (широта ≈ 48.46) — це не просто масштаб, а пошкоджені значення. Ще 19 записів мають `lat=0` або `lon=0`. Валідний діапазон решти: lat 0…48.5822116, lon 0…35.2104816. Один запис має вік 661 s. Висновок: нормалізатор мусить карантинити невалідні/нульові координати й застарілі позиції, а не віддавати їх на мапу; `handicapped` і `type=bus` наявні в усіх 404.
2. **Київпастранс — HTTP без TLS** (006, 007) і `405` на HEAD. Потрібен довірений HTTPS-gateway; прямий HTTP з клієнта неприпустимий (mixed content у PWA).
3. **FlixBus EU — 31 MB** і HTTP→HTTPS редирект: парсинг лише серійно, за GREEN-ресурсів; поки NOT_MEASURED.
4. **VD-Express — нестабільна відповідь** (200, потім timeout 20 s): не вважати придатним до повторних датованих проб.
5. **УЗ mirror — 5 діб без оновлення**: розклад може бути неактуальним для поточного періоду; критерій приймання №7 не виконано.
6. **Портальні сторінки замість ресурсів** (7 dataset + 3 пошукові): поки це не фіди; потрібне витягування конкретного resource-URL, формату й ліцензії.

## 5. Ліцензії та доступ

- Львів/Стрий/Ужгород: у каталозі feed-01 ліцензія `CC BY 4.0` з посиланням на data.gov.ua — для нових проб ліцензію ще не перечитано з першоджерела (NOT_VERIFIED для 004/005).
- AUTH REQUIRED (Одеса 012, Буча 013) і PARTNER ACCESS (FlixBus 025, Kiwitaxi 028, Bolt 029) — **не перевірялись і не активуються** без credentials/угоди; це зовнішні блокери, а не дефект коду.
- HISTORICAL (015, 022, 023) — лише як історичні джерела, не для поточних рейсів.
- OSM/Nextbike (032) — посилання на ліцензію, не фід; потрібне окреме джерело (GBFS/Overpass) і перевірка ODbL.

## 6. Критерії приймання (розділ 21 специфікації) — поточний стан

| № | Критерій | Львів 001/002 | Київ 006/007/008 | 3electra 027 | Дніпро 031 | Решта |
|---|---|---|---|---|---|---|
| 1 | джерело ідентифіковано | VERIFIED | VERIFIED | VERIFIED | VERIFIED | частково (портальні сторінки) |
| 2 | походження встановлено | PARTIAL (треба першоджерело ліцензії) | PARTIAL (mirror ≠ офіційний) | PARTIAL | PARTIAL | NOT_MEASURED |
| 3 | технічний доступ перевірений | VERIFIED (датовано) | VERIFIED (HTTP-only) | VERIFIED | VERIFIED | 15 нових — частково |
| 4 | право використання підтверджене | PARTIAL (CC BY 4.0 з каталогу) | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED |
| 5 | формат обробляється | PARTIAL (protobuf header розпарсено, повний парсинг NOT_MEASURED) | PARTIAL | PARTIAL (discovery JSON) | PARTIAL (JSON) | NOT_MEASURED |
| 6 | маршрути/зупинки валідні | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | **FAIL** (27,5% позицій) | NOT_MEASURED |
| 7 | розклади актуальні | VERIFIED (Last-Modified сьогодні) | VERIFIED (13.11) | LIVE | LIVE | УЗ — FAIL (5 діб) |
| 8 | GPS не підмінено прогнозом | VERIFIED (426 live entity) | VERIFIED (331 live entity) | LIVE discovery | LIVE, але якість FAIL | — |
| 9 | інтеграція в Journey Engine | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED |

Жодне джерело ще не закрите повністю за всіма 9 критеріями. Це перша черга з **датованими** вимірами (на відміну від аудиту 12.11, де їх було 0).

## 7. Наступні кроки (обмежені атоми)

1. Звуження 10 портальних сторінок до конкретних resource-URL + фіксація формату й ліцензії (read-only).
2. Повторні датовані проби VD-Express і Львів trip_updates; перевірка `calendar_dates`/актуальності рейсів у вже завантажених zip (серійно, один важкий процес).
3. Нормалізатор GPS із карантином невалідних координат (Дніпро) — окремий атом у `qoder/*` worktree з тестами й негативним контролем.
4. HTTPS-gateway для Київпастранс — потребує рішення власника/Codex (інфраструктура), не вигадувати.
5. Імпорт 15 нових записів у `TRANSPORT_PROVIDER_REGISTRY.json`/`ukraineCatalog.ts` з provenance, ліцензією й `measurementAt` — окремий PR, без дублікатів 18 покритих.
6. FlixBus EU (31 MB) — лише за GREEN-ресурсів; поки відкладено.

**Ресурси на момент перевірок:** memory free 27% (YELLOW), disk 22 GiB вільно. Важкі парсинги не запускались; усі проби — легкі серійні HTTP-запити.
