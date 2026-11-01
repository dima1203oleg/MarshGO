# MARSHGO Web/PWA — аудит і матриця приймання за ТЗ v4.1

Дата вимірювань: 2026-11-01, 19:25–19:35 UTC (перший прохід) і 19:47 UTC (повтор після фікса V41-D2).
Середовище: **публічний acceptance-preview через HTTPS**, не localhost.

| компонент | образ / білд | доказ |
|---|---|---|
| Web/PWA (перший прохід) | `marshgo/web:RC-2026-11-01-v41menu.2`, `org.opencontainers.image.revision = f86d81eecbd59df720c7fb74d30cf72ae212901f` | `docker image inspect` |
| Web/PWA (повтор) | `marshgo/web:RC-2026-11-01-resultnav.1`, revision `a6ba09f4dc921910d4f4a36218eb164e0f8eeed0` | `docker image inspect`, `.release/web-rc-20261101-resultnav/Dockerfile` |
| відданий бандл | `index-BpkS9lSm.js` (перший прохід) → `index-Dvb9lqBq.js` (повтор) | `curl https://marshgo-dima.shares.zrok.io/`; бандл зафіксований у `stage5.json` |
| API | `marshgo/api:RC-2026-11-01-retention.2` | `docker ps`, `/readyz` 200 |
| браузер | Playwright 1.63, Chromium, профіль iPhone 13 (390×664, DPR 3), заголовок `skip_zrok_interstitial` | скрипти `.release/v41-audit-20261101/stage{2,3,4,5}.mjs`, JSON `stage{2,3,4,5}.json`, скріншоти `v41-*.png` |

Статуси: PASS / FAIL / IN_PROGRESS / NOT_TESTED. Неперевірене не переведено в PASS.

## 1. Виконані пункти контракту

| # | Пункт ТЗ | Статус | Виміряний доказ |
|---|---|---|---|
| 1 | Центральна дія «+» відкриває рівно 4 канонічні дії | PASS | `PLUS-MENU`: Навігація → Карта транспорту → Опублікувати поїздку → Знайти маршрут (усі 334×63 px) + другорядний рядок «Створити запит» |
| 2 | Меню закривається Escape і кліком поза ним; діалог доступний | PASS | `PLUS-CLOSE {escapeClosed:true, backdropClosed:true}`, `role="dialog" aria-modal="true"`, кнопка «Закрити» 44×44 |
| 3 | Плитки Головної у строгому порядку контракту | PASS | `HOME-TILES`: Навігація / Опублікувати поїздку / Карта транспорту / Знайти маршрут |
| 4 | Півні Global Nav ≥44 px | PASS | 5 вкладок у `<nav data-testid="global-bottom-navigation">` ( earlier `W-NAV`), кнопки меню 44–63 px |
| 5 | Реальний websocket на публічному домені | PASS | `WS-REALTIME`: `wss://marshgo-dima.shares.zrok.io/api/v1/realtime?ticket=***` → кадр `{"type":"connection.ready","connectedAt":"2026-11-01T19:28:42.570Z"}` (раніше 403 через allowlist origin) |
| 6 | Результат пошуку будується на реальних GTFS-даних | PASS | `RANK-OPTIMAL`: 1 маршрут «Пішки 3 хв · 0 ₴ → Трамвай 15 хв · ≈ 23 ₴ → Пішки 1 хв», 19 хв, виїзд 08:00 / прибуття 08:19, «Очікування · менше хвилини» |
| 7 | Мапа не перемонтується без потреби; єдиний MapLibre | PASS (обмежено) | `canvasMounts:0` на екрані списку, `1` після відкриття деталей — нових монтувань при перемиканні чіпів і resize не було |
| 8 | Зміна розміру вікна не повторює пошук | PASS | `RESIZE newRequests:[]` і `stage4 RESIZE newRequests:[]` (320×540). Перший спостережений «повтор» у `stage2` був початковим запитом, що дійшов після resize — спростовано при повторному вимірі |

## 2. Виявлені невідповідності контракту (відкриті)

| ID | Пункт ТЗ | Статус | Факт |
|---|---|---|---|
| V41-D1 | §6: результат = один екран «мапа MapLibre + нижній лист» | **FAIL** | `/journeys/search` — список без мапи (`canvas:0`); мапа зʼявляється лише після тапу по картці (`JOURNEY-DETAIL canvas:1`) |
| V41-D2 | Глобальна навігація доступна на всіх режимах, у т.ч. під час маршруту | **PASS (ез екран повноекранної мапи)** | Виправлено в Site `a6ba09f` (гілка `qoder/v41-ui-20261101`), образ `marshgo/web:RC-2026-11-01-resultnav.1`, бандл `index-Dvb9lqBq.js`. Публічний повтор (`stage5.json`): на `/journeys/search` з 5 і з 1 карткою `navVisible:true`, `navTabCount:5`, `mainShell:flow`; остання картка досяжна після скролу (`lastCardVisible:true`, `cardHiddenBehindNav:false`, scrollHeight 1284 > innerHeight 664). Першопричина: `immersiveRouteView` охоплював `showResults` → зникав tabbar, а `.route-immersive-shell` (`height:100svh; overflow:hidden`) робив решту карток недосяжною. Лишається іммерсивним екран `selectedRouteMap` (деталі маршруту) — див. V41-D1 |
| V41-D3 | Три справжні ранкінги видимі користувачеві | **IN_PROGRESS** | Чіпи працюють і чесні: на міжміському Львів→Київ `aria` = «Оптимальний, 5 маршрутів», «Найшвидший, 5 маршрутів», «Найдешевший, немає доступних маршрутів» (чіп disabled, бо всі тарифи «невідомий» — unknown ≠ 0). Порядок карток під Оптимальний і Найшвидший на цих 5 результатах збігається, тож «три різні ранкінги» досі не доведені — це питання політики планувальника (#36/#52), не UI. Geocoder Києва обійдено прямим deep-link `mode=planner` |
| V41-D4 | 12 категорій 4×3, живі маркери транспорту, Follow-режим | **NOT_TESTED** | Не виміряно в цьому проході |
| V41-D5 | Палітра §2.2 проти чинних токенів | **IN_PROGRESS** | Рішення власника: брати hex ТЗ лише там, де він виграє за WCAG; розрахунки контрасту ще не записані |

## 3. Інцидент цього проходження (закрыто)

1. **Білий екран після входу на публічному preview.** Причина: `useEffect` закриття меню «+» у `ProductionMarketplace` стояв після `if (loading) return` / `if (!user || showLogin) return` → після входу React фіксував «Rendered more hooks than during the previous render» і дерево розмонтовувалось (`rootLen 0`). Виправлено переносом хука до решти хуків, додано охоронний тест `tests/v41-hook-order.test.ts`. Site `f86d81e`, typecheck чистий, 243/243 тести, бандл `index-BpkS9lSm.js` перевидано на обидва публічні share.
2. **API не стартував (~1.5 хв простої).** Причина: до `CORS_ORIGINS` додали `http://127.0.0.1:3900` і `http://localhost:3000`; `server/config.ts:38` у production пропускає лише `https://…` і `capacitor://localhost` → `validateRuntimeConfig` кидає помилку до слухання порту. Виправлено: у списку лише HTTPS-origin (включно з обидвома zrok), контейнер знову healthy.

## 4. Наступні дії за пріоритетом

1. V41-D2: повернути global nav на екрані результатів/деталей ( smallest change: не ховати tabbar поза ACTIVE_NAVIGATION ) — потім браузерний повтор.
2. V41-D1: рішення й оцінка праці за варіантом «мапа + лист» замість «список → деталі» (питання власнику, не переписувати функціонал без згоди).
3. V41-D3: довести три ранкінги на запиті з ≥3 результатами; окремо — надійність гекодера для Київа.
4. V41-D4/D5: пройти живі категорії карти, Follow-режим і записати розрахунки контрасту в `UI_DESIGN_DECISIONS`.
