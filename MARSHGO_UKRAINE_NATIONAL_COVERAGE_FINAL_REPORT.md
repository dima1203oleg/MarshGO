# MARSHGO — UKRAINE NATIONAL COVERAGE FINAL REPORT

**Дата:** 2026-11-16 (виміри 2026-11-14 baseline → 2026-11-16 поточні).
**Виконавець:** Qoder (Web/UI, докази, discovery джерел); серверні зміни — Codex через GitHub issue/PR 26.
**Статус продукту:** `NOT_RELEASED` (RELEASE_MANIFEST.json `status = NOT_RELEASED`).
**Рівень доказу:** live API-проби + Qoder in-app browser на канонічному zrok/7777; preview-runtime — dirty sibling build, НЕ canonical-main acceptance.

Runtime всіх проб 16.11: API `e9934abbd8fc973177de8d7f47548739758a1b74` (dirty, 66 файлів),
buildId `local-e9934abbd8fc-dirty-20261113T132012Z`, після двох аварійних рестартів —
`local-e9934abbd8fc-dirty-20261116T145412Z` (той самий SHA). Site checkout
`1fec46fe` (codex/premium-route-details-reference-20261115, dirty, read-only),
канонічний порт 7777 → https://marshgo-dima.shares.zrok.io.

---

## 1. Початкове покриття (baseline 2026-11-14, виміряне)

Артефакт: `docs/evidence/national-coverage-metrics-2026-11-14.json`.

| Метрика | Було |
|---|---|
| M1 регіони з FULLY_VERIFIED | 4/27 = 14.81% (kyiv, lviv-oblast, poltava-oblast, zakarpattia-oblast) |
| M2 канонічні режими з FULLY_VERIFIED | 4/12 = 33.33% (bus, marshrutka, tram, trolleybus) |
| M3 клітинки матриці FULLY_VERIFIED | 10/324 = 3.09% (56 partially covered; каталог 312) |
| M4 інтеграція відомих OPEN-ресурсів | 86/140 = 61.43% |
| M5-90s realtime-регіони (гейт 90 с) | 5/12 = 41.67% |
| M6 свіжість вмісту ≤24 год | 17/25 = 68% |
| M7 ліцензійна прозорість каталогу | 84/88 = 95.45% |
| M8 доведена маршрутизація | NOT_MEASURED |

Каталог фідів: 88 записів (`TRANSPORT_PROVIDER_REGISTRY.json` schemaVersion 2);
старий аудит 12 HEALTHY / 9 DEGRADED / 15 OFFLINE / 52 SKIPPED, **0 датованих вимірів** —
старі HEALTHY не є поточним VERIFIED LIVE.

## 2. Фактичне покриття після роботи (2026-11-16)

- **M8 закрито виміром:** національні API-проби виконано (розділи 10–12).
- Київ: surface-маршрутизація **ROUTING_VERIFIED_API + UI** для трьох режимів
  (tram, bus, trolleybus) на свіжому дзеркалі Київпастранс feed_version 20261116
  (192 routes / 1738 stops / 27438 trips; 17.11 активні 811 services / 15111 trips).
- Львів: tram UI-свідок + чесний no-bus контроль (`qoder-lviv-no-bus-ui-2026-11-16.json`:
  Т01, 29 хв, 30 ₴, 0 пересадок; автобус НЕ зʼявляється самовільно).
- Міжобласні коридори: 6/6 базових + 7/7 нових дають маршрути (до 3 пересадок).
- Приміські: 4/6 проб з кандидатами (100 cand), 2/6 — нуль.
- Carpool: інтеграція в рушій VERIFIED (code), реальний інвентар пропозицій — 0
  (чесний UI «0 варіантів»; це gap онбордингу водіїв, не дефект ланцюжків).
- 17 із 22 внутрішньоміських центрів — 0 кандидатів; причини зафіксовані
  (відсутність routed provider у коридорі / неінгестовані фіди / place-resolution).
- Жоден регіон не оголошено «покритим» без доказу; окуповані/фронтові території
  не активовано.

## 3. Відсоток підтверджених регіонів

- FULLY_VERIFIED за матрицею 14.11: **4/27 = 14.8%** (не змінено без нових клітинних доказів).
- Регіони з **доведеною surface-маршрутизацією API+UI станом на 16.11**:
  Київ, Львівська, Закарпатська (Ужгород API) — **3/27 = 11.1%** (транзит);
  Івано-Франківська та Одеська — лише bike-оцінка + walk (не транзит).
  **Корекція audit 364 (Codex, 16.11):** права/походження Ужгородського
  UA-GIS ZIP не доведені (0 збігів ID з муніципальним CC-BY CSV; у реєстрі
  ліцензії немає). Закарпатська = інженерне спостереження на preview-runtime,
  **NOT_ESTABLISHED** для ліцензованої production route-chain. Ліцензовано
  підтверджена surface-маршрутизація: Київ + Львівська = **2/27 = 7.4%**.
- Регіони з валідним live RT (гейт 90 с, 14.11): 5/12 заявлених = 41.7%.
- АР Крим і Севастополь: UNKNOWN / не зондовано (немає легального цивільного
  джерела; історичні розклади не активуються). Севастополь відсутній у
  UKRAINE_REGIONS (26) — знаменник 27 збережено чесно.

## 4. Відсоток підтверджених транспортних категорій

Режими, що **реально формують legs** у national search (перевірено API/UI):

| Режим | Стан | Доказ |
|---|---|---|
| bus | VERIFIED (Київ, Львів, Ужгород; long-haul до 4 пересадок) | per-mode probe, UI bus 12 |
| tram | VERIFIED (Київ Т1, Львів Т01) | UI-свідки 16.11 |
| trolleybus | VERIFIED (Київ №11; long-haul Київ→Ужгород, Одеса→Київ T4) | UI-свідки 16.11 |
| train (RAIL) | VERIFIED (Укрзалізниця GTFS; Київ→Львів 10 journeys) | per-mode probe |
| marshrutka | 0 routed provider у коридорах; чесний blocked-напис | per-mode probe |
| metro | provider error (Київські джерела не зареєстровані/вимкнені; gisserver NXDOMAIN) | per-mode probe |
| carpool | engine VERIFIED (code), інвентар 0 | carpool-surface probe |
| taxi / carsharing / transfer | no-routed-provider-in-corridor (чесно) | per-mode probe |
| bike | оціночні сегменти (OSM/static network), не live-прокат | intra-city sweep |
| scooter | GBFS Zelectra Київ LIVE (999 ТЗ, age 0 с), routing-сегменти не доведені | M5-90s note |

**4/12 транзитних режимів доведено маршрутами = 33.3%**; з урахуванням
bike-оцінки та carpool-рушія — 6/12 частково, але це не FULLY_VERIFIED.

## 5. Матриця 27×12

Авторитетний артефакт: `docs/evidence/national-coverage-matrix-2026-11-14.csv`
(324 клітинки; 10 FULLY_VERIFIED, 56 PARTIALLY_COVERED, решта KNOWN_GAP/UNKNOWN).
Оновлення клітинок за пробами 16.11 — у `national-routing-matrix-2026-11-16.csv`
(24 центри: route_status WORKING/PARTIAL/MISSING + причина кожного нуля).

Зведення по 24 центрах (API 16.11, `national-api-chain-probe-2026-11-16.json`):

| Стан | Міста |
|---|---|
| WORKING (транзитні legs) | Київ (1 journey/20 cand), Львів (5/84), Ужгород (2/100)* |

\* Ужгород: WORKING = факт побудови маршруту на preview-runtime; ліцензійний
статус джерела NOT_VERIFIED (audit 364 Codex 16.11) — не зараховується як
ліцензоване production-покриття до підтвердження прав.
| PARTIAL (лише bike/walk оцінка) | Івано-Франківськ (1/101), Одеса (1/1) |
| MISSING (0 кандидатів, причина зафіксована) | Вінниця, Луцьк, Дніпро, Донецьк, Житомир, Запоріжжя, Кропивницький, Луганськ, Миколаїв, Полтава, Рівне, Суми, Тернопіль, Харків, Херсон, Хмельницький, Черкаси, Чернівці, Чернігів (19) |
| Не зондовано | Сімферополь (АР Крим), Севастополь |

## 6. Кількість знайдених нових фідів

- Реєстр власника 33 записи ↔ каталог 88: дедуплікація — 18 уже покриті,
  **15 нових** (7 dataset-сторінок data.gov.ua, 3 пошукові сторінки,
  5 нових хостів: FlixBus EU GTFS, FlixBus Partner, Kiwitaxi, Bolt Fleet, Nextbike/OSM).
  Придатних кандидатів до імпортy ≤12 (партнерські — без активації).
  (`docs/NATIONAL_FEED_P0_INVENTORY_2026-11-14.md`)
- Додатково знайдено/оновлено 16.11: свіже дзеркало Київпастранс
  (jbb.ghsq.de/gtfs/ua-kyiv.gtfs.zip, feed_version 20261116),
  Malyn mdb-3615 (malin.kiev.ua, 98 stops/9 routes/250 trips, calendar до 2027-12-31),
  новий кандидат розкладу Полтави, depo.vn.ua (Вінниця, живий портал).
- MDB crosswalk: 10/11 UA-фідів MDB уже в каталозі; для 11 інших обласних
  центрів MDB-фідів немає.

## 7. Кількість валідованих фідів

- 24 датовані endpoint-проби 14.11 (`feed-probe-2026-11-14.tsv`):
  LIVE підтверджено для Львів static+RT, Стрий, Ужгород, Київпастранс static+RT
  (HTTP-only!), Київ HTTPS mirror, Zelectra GBFS, УЗ mirror (5 діб — NOT_VERIFIED
  свіжість рейсів), Дніпро iCity GPS (LIVE, але 27.5% браку), easyway JSON
  (Червоноград/Полтава/Чернівці/Коростень/Рівне).
- 16.11: Київ mirror повністю валідовано (192 routes/1738 stops/27438 trips/
  115360 stop_times; 17.11 active 811 services) — **валідний, свіжий**.
- M6: 17/25 виміряних джерел свіжі ≤24 год; 8 застарілі (серед них УЗ mirror 112 год,
  Malyn 99 год, konotop 6511 год, sumy 740 год).
- Дефекти даних зафіксовано: Дніпро iCity 111/404 невалідних позицій;
  Київпастранс HTTP без TLS; FlixBus EU 31 MB; VD-Express нестабільний.

## 8. Кількість інтегрованих фідів

- M4: **86/140** відомих OPEN-ресурсів присутні в каталозі або mobility_providers
  (61.4%); 54 не інтегровані (переважно XLSX/CSV-архіви порталів).
- Каталог: 88 записів. Київ mirror — уже зареєстрований (ukraineCatalog wave2)
  та імпортований; live `/api/v1/mobility/providers` показує Київпастранс
  available bus/tram/trolleybus.
- Qoder НЕ редагує серверний реєстр Codex: нові джерела передаються через
  файли дослідження та PR/issue 26 (Malyn — чекає legal-рішення власника;
  Dnipro — BLOCKED_IDENTITY_CROSSWALK; Odesa/Bucha — API-key процедури).

## 9. Кількість джерел, що реально формують маршрути

З проб 16.11 (targetProviders у відповідях API):
1. **Київпастранс — розклад (GTFS)** — bus/tram/trolleybus legs (Київ).
2. **Львів (track.ua-gis.com GTFS)** — bus/tram legs (Львів).
3. **Ужгород (track.ua-gis.com GTFS)** — bus legs (права/походження
   NOT_VERIFIED, audit 364; preview-спостереження, не ліцензоване приймання).
4. **Укрзалізниця — розклад поїздів (GTFS)** — RAIL legs (міжміські/міжобласні).
5. Static bike-network оцінки (Івано-Франківськ, Одеса) — оціночні, не live.
6. Walking-router (grid/straight-line оцінки там, де немає підтвердженого шляху).

**4 транзитні джерела реально будують маршрути** у national search.
Carsharing/taxi/transfer/marshrutka/metro — 0 routed providers у коридорах.

## 10. Кількість перевірених міст, сіл і коридорів

- Міста: **24 обласні центри + Київ** API-пробовані 16.11 (urban 24);
  додатково intra-city sweep 22 центри (з корекцією: наближені координати,
  не авторитетні real-node; 5 з ланцюжками, 17 нульових — причини описані).
  UI-контролі в Qoder in-app browser: Київ (U04 metro/bus, tram, bus, trolleybus),
  Львів, Одеса (U05 bike), Дніпро (U06), Вінниця (U07), Рівне (U08),
  Хмельницький (U09), Тернопіль (U10), Житомир (U11 — геокодер недоступний,
  transport NOT_TESTED), Суми (place-resolution gap UI-доказ).
- Села/приміська: UI-свідок Київ → **Михайлівська Борщагівка** (трамвай 1,
  село/селище за містом); suburban-проби 6 (4 з кандидатами).
- Коридори: 6 базових міжобласних + 7 нових long-haul + 6 suburban +
  2 per-mode (12 режимів кожен) + 3 відсутні обласні центри + 4 carpool
  = **28 коридорних проб** 16.11, усі з зафіксованим результатом і причиною нуля.

## 11. Кількість перевірених мультимодальних маршрутів

- API: Київ intra-city — категорії bus+tram+trolleybus, **maxTransfers 3**;
  Львів bus+tram, maxTransfers 1; нові коридори — до **3 пересадок**
  (3 коридори по 12 journeys/100 cand); per-mode bus Київ — до **4 пересадок**.
- UI-свідки мультимодальних ланцюжків (Qoder in-app browser):
  R08 Київ→Львів (поїзд+трамвай, виключення автобуса перевірено),
  R09 дедлайн прибуття поїзд+трамвай, Харків→Львів **3-пересадковий** ланцюжок,
  Київ→Ужгород (trolleybus у long-haul), Одеса→Київ T4 trolleybus.
- Разом: **≥6 документованих мультимодальних свідків** (2 API-агрегати з
  пересадками + 5 UI-коридорів; точні per-journey категорії — в артефактах).
- 0–4+ пересадок підтверджено; 4+ — лише per-mode bus-проба (maxTransfers 4).

## 12. Результати API/E2E

- `national-api-chain-probe-2026-11-16.json` (08:18Z): urban 24 — HTTP 200 усі;
  5 ненульових; intercity 6/6 ненульові (7–9 journeys, 72–100 cand);
  strategies FASTEST/BALANCED; negative control Тернопіль scooter-only — чесно 0.
- `national-new-corridors-probe-2026-11-16.json`: 7/7 ненульові.
- `national-per-mode-probe-2026-11-16.json`: 12 режимів × 2 коридори;
  train 10 journeys (Київ→Львів), bus 2 (maxTransfers 4); інші — 0 з чесними
  blocked/providerErrors (metro, marshrutka, taxi, carsharing, transfer).
- `national-suburban-probe-2026-11-16.json`: 4/6 з кандидатами.
- `national-carpool-surface-probe-2026-11-16.json`: 0 реальних пропозицій
  (4 коридори + 8 raw controls); engineIntegration VERIFIED (code).
- Київ surface UI 16.11: tram 1/28 cand, bus 1/3 cand (verbatim UI POST),
  trolleybus 1/100 cand; усі partial=true (budget/sampling truncation,
  walk-router 32 cap). Fare 30 ₴ ESTIMATED (не UNKNOWN≠0).
- **searchTruncated=true** майже всюди, де є результат — повнота пошуку НЕ
  доведена; UI показує чесний partial-стан. Збільшення лімітів навмання
  заборонено ТЗ; потрібні алгоритмічні покращення (Codex).
- E2E root: застарілий OTP-вхід (410) — міграція на email+пароль у backlog (#45).

## 13. Результати CI

- Root PR25: CI run 43893143344 job `verify` — **failure** (після push 5602811/c171c21);
  Security 43893143625 — success (попередній 43892877190 — failure, виправлено).
- **Точний діагноз merge-блокера:** `ops/scripts/materialize-release.mjs` клонує
  4 репо одним токеном `MARSHGO_REPOS_READ_TOKEN`: Server `44f954b` OK,
  Site `fef697e` OK, **Admin `4eb5d15` → HTTP 403 «Write access to repository
  not granted»**, Partner — очікувано той самий 403. Токен налаштований, але
  fine-grained PAT не має `Contents: read` на Admin/Partner.
  **Дія власника:** додати Admin+Partner до Repository access токена (Read-only).
  Qoder secrets не змінює і fail-closed gate не послаблює.
  (`docs/EXTERNAL_BLOCKERS.md`, запис 2026-11-16 15:10 UTC)
- Merge у main **BLOCKED**: цей зовнішній credential-gap + PR25 886 файлів
  (завеликий scope). Main protected; жодного force-push/reset не виконано.
- Server/Site CI: див. відповідні PR (Server 189/138/137/136…, Site 145/144/142…);
  canonical acceptance відкладено через runtime mismatch (preview ≠ main).

## 14. Виправлені дефекти

Qoder (UI/докази/процес):
1. Replay-розбіжність 0 vs 1 journey: вербатим-захоплення UI POST (повні
   preferences + UTC Z) — розбіжність була помилкою проби, не продукту.
2. Хибно-негативна геометрія: `leg.routeGeometry` — сирий масив [lon,lat],
   не GeoJSON; пробу виправлено (bus 68 т., troll 57 т.).
3. Відновлення runtime після трьох крахів API (тим самим SHA, канонічний
   лаунчер, CWD=канонічний корінь); crash-логи збережено як докази.
   **Root cause ланцюжок (16.11):** Postgres backend тихо завершується з
   exit code 2 (13:33/14:16/14:51/15:01 UTC, без сигналу/OOM/сну хоста) →
   postmaster reinitialize → обрив з'єднань → unhandled pg 'error' у API →
   процес API падає. Усувний дефект API — обробник pg error (Codex task E);
   стабільність самого Postgres у Docker VM — окреме infra-розслідування.
4. Чесні UX-стани під час відмови перевірено: банер 45 с, «Пошук тимчасово
   недоступний», «Повторити пошук» — працюють.
5. Deadline/arrivalBy deep-link (Site PR144), globalRules segment-кейс
   (Server PR156), flaky feed-registry assertion — закрито раніше.

Передано Codex (issue/PR 26, з відтворюваними прикладами):
- **TASK A:** Київ segment-split feed (2–8 зупинок/trip, block_id empty) — chaining.
- **TASK B:** Malyn OwnNet License 1.1 — legal-рішення власника.
- **TASK C:** геометрія — tram shapes вироджені (254/254 refused snap 759 м,
  cap 600 м — відмова ПРАВИЛЬНА); **посилено 16.11:** bus 68-точкова геометрія
  НАДАНА, але Site рендерить лише маркери + «ЗА РОЗКЛАДОМ» (камера 200 км);
  trolleybus 57 т. рендериться. Або виправити рендер, або явний напис
  «геометрія недоступна».
- **TASK D:** геокодер — stop-level suggestions відсутні («Індустріальна»,
  «Музей архітектури» →wrong-city Крилос); Суми place-resolution gap.
- **TASK E:** unhandled pg Client 'error' вбиває API — **ДВА тригери**
  (navigation.expiry_failed, database.pool_idle_client_error); acceptance:
  pg_terminate_backend не має вбивати процес.
- Dnipro identity/calendar crosswalk; Odesa/Bucha API keys; runtime handoff #87.

## 15. Перелік PR та точні SHA

| Репо | PR | Head SHA | Стан |
|---|---|---|---|
| MarshGO (root) | **25** | `5602811d9bcc2d7637710eb662530bf9061fc746` | OPEN, CI in_progress, merge BLOCKED |
| MarshGO-Server | **26** | (Codex GPS fix) + коментар Qoder з tasks A–E | OPEN |
| MarshGO-Server | 189 | `f9dc8843f` | Lviv GTFS graph budget truncation diagnosis |
| MarshGO-Server | 138 | `a49030391` | evidence-backed feed activation |
| MarshGO-Server | 137 | `2e04e7330` | Direct-Only transfer semantics |
| MarshGO-Server | 136 | `b8e1d683d` | Lviv feed coverage + GBFS country filter |
| MarshGO-Site | **145** | `1fec46fe4` | premium redesign checkpoint (served preview) |
| MarshGO-Site | 144 | `2ba2c2159` | arrive-by deadline survives shared links |
| MarshGO-Site | 142 | `48f50dfaf` | seekable route preview |

Runtime preview: API `e9934abbd8fc973177de8d7f47548739758a1b74` (dirty),
Site `1fec46fe` (dirty). Це **не** canonical-main SHA; acceptance відкладено.
Root-гілка `qoder/carpool-5-20261113`; чужі dirty-файли не чіпались і не комітились.

## 16. Залишкові обмеження

**Зовнішні (потребують власника/партнера/даних):**
- Odesa/Bucha x24 API keys; FlixBus Partner/Kiwitaxi/Bolt Fleet — партнерський доступ.
- Malyn OwnNet License 1.1 — комерційне legal-рішення власника.
- Київ метро — джерела станцій/геометрії/розкладу не зареєстровані або DEAD
  (gisserver NXDOMAIN); потрібне легальне джерело.
- Dnipro — BLOCKED_IDENTITY_CROSSWALK (tripUid/stopId/direction/calendar
  семантика від видавця); архівний липневий CSV не є свіжим.
- Полтава/Вінниця/Рівне/Тернопіль/Хмельницький/Житомир/Суми/Херсон/Чернігів —
  чинні розклади або place-resolution не підтверджені; історичні не активуються.
- Фронтові/окуповані території — немає легального цивільного сполучення;
  історичні розклади відокремлені від поточних.
- Carpool — інвентар пропозицій 0 (потрібні реальні водії або ізольований
  labeled fixture у НЕспільній тест-БД).
- Ужгород UA-GIS ZIP — права/походження NOT_VERIFIED (audit 364 Codex 16.11:
  0 збігів ID з муніципальним CC-BY CSV, ліцензії в реєстрі немає);
  Закарпаття NOT_ESTABLISHED для ліцензованої route-chain до підтвердження.

**Інженерні (усувні, Codex/backlog):**
- searchTruncated/partial майже всюди — повнота пошуку не доведена (алгоритмічно).
- Kyiv segment-split chaining (task A); bus geometry render (task C);
  geocoder stop-level (task D); pg error-handler (task E).
- **Postgres у Docker VM тихо крашиться** (backend exit code 2, 4 рази за
  16.11; без сигналу/OOM/сну хоста) → reinitialize → API падає без обробника
  pg error. API-фікс = task E; root cause БД = окреме infra-розслідування
  (Docker Desktop VM / версія Postgres), доказ: postgres-crash-timeline.
- Walking-router 32 cap; walk-оцінки grid/straight-line там, де немає шляху.
- Fare ESTIMATED/UNKNOWN — UNKNOWN не дорівнює 0; точні тарифи не скрізь.
- CI 403 materialize-release (Admin clone) + scope PR25 886 файлів.
- #71 transport filters у deep-link; #43 Дніпро GPS карантин; #51 frontline.

## 17. Реальний статус готовності до production

**NOT_RELEASED. PARTIAL.**
- RELEASE_MANIFEST.json: `status = NOT_RELEASED`.
- Preview працює на dirty sibling build, не на canonical main; merge у main
  BLOCKED (CI 403 + scope). Жодного production deployment не виконано.
- Доведено: 4 транзитні режими будують реальні маршрути; 3 регіони з
  surface-маршрутизацією API+UI; міжобласні/приміські ланцюжки до 3–4 пересадок;
  чесні partial/empty/stale стани в UI.
- Не доведено: повнота пошуку (truncation), 19 із 24 центрів без маршрутів,
  metro/marshrutka/taxi/carsharing/transfer, live-прокат, carpool-інвентар,
  canonical-main acceptance, CI-green merge, релізний кандидат.

---

## Три незалежні показники (НЕ змішувати)

### SOURCE COVERAGE — покриття транспортними даними
- 86/140 відомих OPEN-ресурсів у каталозі/providers = **61.4%** (M4).
- 88 записів каталогу; 17/25 виміряних джерел свіжі ≤24 год = 68% (M6).
- 5/12 заявлених RT-регіонів проходять гейт 90 с = 41.7% (M5-90s).
- 24 датовані проби 14.11 + повна валідація Київ mirror 16.11.
- Це **наявність даних**, не маршрутизація.

### ROUTING COVERAGE — маршрути, які реально будує система
- Транзитні режими з legs: **4/12 = 33.3%** (bus, tram, trolleybus, train).
- Обласні центри з ненульовим API-пошуком: **5/24 = 20.8%**
  (3 транзит WORKING + 2 bike-оцінка PARTIAL).
- Міжобласні коридори: 6/6 + 7/7 нових = **13/13** ненульових.
- Приміські: 4/6. Intra-city sweep: 5/22 (з корекцією наближених координат).
- Джерела, що формують маршрути: 4 транзитні (розділ 9); з них Ужгород —
  preview-спостереження з NOT_VERIFIED правами (audit 364), ліцензовано
  підтверджені — Київпастранс, Львів, Укрзалізниця.
- Це **факт побудови маршруту API**, не видимість користувачу.

### USER EXPERIENCE COVERAGE — маршрути, доступні й перевірені для користувача у Web/PWA
- UI-свідки в Qoder in-app browser на канонічному zrok/7777:
  Київ tram/bus/trolleybus (3 режими, 3 стратегії, чесні ярлики «ЗА РОЗКЛАДОМ»),
  Львів tram + no-bus контроль, Одеса bike, long-haul R08/R09/Харків→Львів/
  Київ→Ужгород/Одеса→Київ T4, міські контролі U06–U10.
- Міста з UI-перевіреним маршрутом: **Київ, Львів, Одеса** (транзит/оцінка)
  + U06–U10 контролі з фіксованим результатом (частково NOT_TESTED через
  геокодер/джерела). Село/приміська: Михайлівська Борщагівка (tram).
- Чесні UX-стани підтверджено: partial-банер, 45 с deadline, «Пошук тимчасово
  недоступний», «Повторити пошук», «0 варіантів» для carpool, no-bus контроль.
- **Прогалина UX:** bus-геометрія надана, але не рендериться (task C);
  геокодер не пропонує зупинки (task D); transport filters не в deep-link (#71).
- Це **видимий і перевірений користувачем результат**, не наявність фіда.

---

## Артефакти доказів (ключові)

- `docs/evidence/national-coverage-metrics-2026-11-14.json`,
  `national-coverage-matrix-2026-11-14.csv`, `national-routing-matrix-2026-11-16.csv`
- `docs/evidence/national-api-chain-probe-2026-11-16.json`,
  `national-new-corridors-probe-2026-11-16.json`,
  `national-intra-city-realnode-2026-11-16.json` (з корекцією),
  `national-per-mode-probe-2026-11-16.json`,
  `national-suburban-probe-2026-11-16.json`,
  `national-absent-oblast-probe-2026-11-16.json`,
  `national-carpool-surface-probe-2026-11-16.json`,
  `national-rental-mode-probe-2026-11-16.json`
- `docs/evidence/qoder-kyiv-tram-ui-2026-11-16.json`,
  `qoder-kyiv-bus-trolleybus-ui-2026-11-16.json`,
  `qoder-lviv-no-bus-ui-2026-11-16.json` + PNG
- `docs/evidence/api-crash-pg-unhandled-2026-11-16.log`,
  `api-crash-pg-idle-pool-2026-11-16.log`,
  `api-crash-third-2026-11-16.log`,
  `postgres-crash-timeline-2026-11-16.log`
- `docs/NATIONAL_FEED_P0_INVENTORY_2026-11-14.md`,
  `docs/MARSHGO_NATIONAL_COVERAGE_AUDIT.md`,
  `docs/MARSHGO_FINAL_BROWSER_ROUTING_AUDIT.md`,
  `docs/EXTERNAL_BLOCKERS.md`, `RELEASE_MANIFEST.json`

**Висновок:** інженерну роботи виконано й виміряно; національне покриття
часткове й чесне. 100% не заявлено. Зовнішні обмеження відокремлені від
усувних дефектів. Продукт лишається NOT_RELEASED до закриття кожного гейта доказом.