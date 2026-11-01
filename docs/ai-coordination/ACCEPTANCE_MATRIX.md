# MARSHGO — ACCEPTANCE MATRIX

Статуси: `PASS` · `FAIL` · `IN_PROGRESS` · `NOT_TESTED` · `BLOCKED_INTERNAL` · `BLOCKED_EXTERNAL`.
Правило: немає доказу — немає `PASS`. Ревізії, які стосуються лише застункового коду, не змінюються цим циклом.

| ID | Вимога | Source SHA | Статус | Команда перевірки | Фактичний результат | Доказ / залишок |
|---|---|---|---|---|---|---|
| A-AUTH | Реєстрація/вхід email+password, 2 ролі | server `a5ec118` | PASS | кроки 1–3 E2E | реєстрація → `/users/me/roles` → `/auth/login` 200 | `canonical_carpool_rc2_2026_11_01` |
| B-PROFILE-VEH | Профіль водія + авто + фото → `trust_level 1` | server `a5ec118`, root Dockerfile | PASS | кроки 4–8 | фотоAccepted, `trust_level=1` | after `chown node /app/.uploads` |
| C-OFFER | Публікація offer (реальний OSRM-роут) | server `a5ec118` | PASS | крок 9 | offer створено | OSRM зовнішній — рішення B |
| D-MATCH | Пошук поїздки пасажиром бачить offer | server `a5ec118` | PASS | крок 11 | offer у видачі | latency див. P-PERF |
| E-BOOK-ATOMIC | Бронювання атомарне + місця | server `a5ec118` | PASS | кроки 12–14 | ідемпотентний повтор не подвоює місця | інвентар збігається |
| F-RACE | Раса останнього місця | server `a5ec118` | PASS | concurrent 2×POST | `[('B',201),('A',409)]`, успіхів 1 | `carpool_e2e.json.race` |
| G-TICKET | MarshPass-квиток HMAC | server `a5ec118` | PASS | `/bookings/:id/ticket` | `MARSHGO-HMAC-SHA256-V1` | |
| H-BOARDING | Посадка за квитком | server `a5ec118` | PASS | `/boarding` | 200 для власника | |
| I-IDOR | Чужі квиток/посадка/події | server `a5ec118` | PASS | 3 запити не-власника | 400 / 401 / 404 | |
| J-LIFECYCLE | rendezvous → start → completion (2 підтвердж.) | server `a5ec118` | PASS | кроки 15–20 | `status=completed` | |
| K-CANCEL | Скасування + повернення місць (ідемпотентно) | server `a5ec118` | PASS | крок 21 | `cancelled`, seats back to 2 | 3 шляхи скасування штамбують `cancelled_at` |
| L-HISTORY | Цelisti таймстемпи у списку бронювань | server `959e547` | PASS | `GET /api/v1/bookings` + psql | completed 3/3, cancelled 3/3, інші 0 | API↔БД 1:1 |
| M-UX-SELL | Розпроданий offer пояснює «немає місць» | server `a5ec118` | FAIL | `GET /api/v1/offers/:id` після продажу | `404 offer_not_found` | #60, потребує правила власника E |
| N-STORAGE | Локальний fallback + чесний 503 | server `b03bba3` | PASS | `npx tsx --test tests/object-storage-local-fallback.test.ts` | 3 pass | продакшн S3 — рішення A |
| O-WEBPWA | Canonical Web/PWA journey → навігація | site `fef697e` | PASS | браузерний прохід (попередні цикли) | доказ у браузері | цього циклу не пере-перевірялось `[NEEDS_REVERIFY]` |
| P-PERF | Пошук: прийнятний latency публічно | server (гілка latency `44f954b`) | IN_PROGRESS | n-запити на медіану через zrok | медіана 10.5–11.9 s; segments-built ~6.2 s | #36/#52/#54 |
| Q-ROUTES-COLD | `GET /transport/routes` cold | — | IN_PROGRESS | cold/warm профіль | cold 8.4 s / warm 2.3 s | #35 |
| R-LIVEMAP | Живі позиції з GTFS-RT (Львів) | server | PASS | `/transport/vehicles` | 443 борті, зібрання | labeled live |
| S-INTERCITY | Lviv → Київ реальні маршрути | server | PASS | journey search | 12 реальних поїздок | earlier «feed gap» спростовано |
| T-METRO | Київське метро | зовнішнє КМДА | BLOCKED_EXTERNAL | probe feed | HTTP 522 | рішення D |
| U-12MODES | 12 категорій транспорту з доказом поїздки | — | IN_PROGRESS | реєстр провайдерів | carpool/transit-ядра підтверджені; taxi, train, bicycle, scooter, carsharing, transfer — `NOT_TESTED` | #23 |
| V-DATA-QUALITY | `dataQuality` на публічних ендпоінтах | — | IN_PROGRESS | аудит 5 ендпоінтів | stops без label; fares із зашитою датою | #33, рішення по fares |
| W-ADMIN | Email/password + черга модерації | admin `4eb5d15` | IN_PROGRESS | браузер на образі `6ee2ede` | API є, браузерний прохід не зроблено | #56 (наступний крок) |
| X-PARTNER | Email/password портал | partner `544e5d8` | PASS (API) | acceptance-тести | 3 pass (baseline) | `[NEEDS_REVERIFY]` |
| Y-IOS | iOS на фізичному пристрої | ios `4353cec` | BLOCKED_EXTERNAL | Xcode device build | пристрою немає | симулятор працює `ca5140c` |
| Z-SEC | Доступ/ідемпотентність/валідація/GPS-згода | server `a5ec118` | PASS | I, F, K | як у рядках вище | |
| AA-STAGING | Стейджинг-середовище зі смок-тестом | — | BLOCKED_INTERNAL | авторизація цільового середовища | немає дозволу власника | рішення C |
| AB-PROD | Production deploy | — | BLOCKED_INTERNAL | те саме | `NOT_RELEASED` | рішення C |
| AC-ROLLBACK | Runbook + backup/restore drill | root docs | IN_PROGRESS | `ROLLBACK_RUNBOOK.md` | є документ, drill частково | GATE-05 |
