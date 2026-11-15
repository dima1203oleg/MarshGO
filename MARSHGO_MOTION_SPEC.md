# MARSHGO — Motion, map and preview specification

2026-11-14 · **SPECIFIED, NOT_IMPLEMENTED**. This document changes no runtime behavior.

## 1. Джерело та принцип

Чинні primitives — `Site/src/index.css`, `src/styles/motion.css`, MapLibre adapter/controller. Основна шкала: `--mg-dur-tap`120ms, fast180ms, base260ms, slow420ms; standard(.32,.72,0,1), entrance(.16,.84,.28,1), exit(.4,0,1,1). Використати їх, не додавати animation library. Наявний package `motion` не дорівнює дозволу мігрувати все на нього.

Кожен рух має одну причину: **feedback**, **state change**, **continuity**. Ambient pulse/фонова анімація не допускаються. За reduced motion зберігається зміст, не анімація. Жодна анімація не доказує реальну швидкість/GPS або завершення поїздки.

## 2. Interaction choreography

| Подія | Рух / token | Статична альтернатива | Переривання |
|---|---|---|---|
| Button press | existing mg-press, tap | Зміна pressed state | Pointer cancel / release |
| Transport selection | check + surface, fast; без пересування плиток | Check і aria-pressed | Наступний незалежний вибір |
| Results arrival | одна коротка entrance base; обмежений stagger тільки visible list | Відразу готовий список | Scroll/cancel search |
| Card→map | selection accent, потім camera fit; не одночасно всі блоки | Static selected route | Будь-яка ручна camera дія |
| Sheet detent | base/entrance; during drag transition:none | Immediate detent | Drag негайно бере control |
| Status changed | коротке opacity fast, stable geometry | Text/icon | Новий server event |
| Error | Без shake, текст+focus на relevant group | Ідентично | Dismiss/fix input |
| Dialog | transform/opacity fast/base | Immediate open, same focus | Escape topmost / explicit close |
| Live dot | лише selected actual fresh source; обмежений existing primitive | Static labeled dot | Stale/offline/reduced motion |

Layout transitions height/bottom дозволені тільки існуючій route sheet. Решта — transform/opacity. Transition all, blur animation, animated box-shadow на довгих списках не додавати. Stable skeleton не змінює порядок CTA.

## 3. Архітектура preview

### Поточна проблема

`ProductionMarketplace.tsx:568–609` відкриває active navigation тільки після fresh GPS; `JourneyActiveNavigation.tsx:287–328` при mount запускає GPS-provider. Тому **не монтувати active navigation як спосіб відкрити preview**. Animation completion не повинен викликати `completePassengerJourney`.

### Цільова межа

1. Винести суто геометричний playback з `JourneyActiveNavigation.tsx:474–666,703–713` у один спільний controller/hook, що використовує `hyperFlightEngine`.
2. Controller приймає actual route geometry/legs, existing map adapter і reduced-motion. Не приймає productionApi, ActiveJourneyStore або GeolocationProvider.
3. `JourneyRouteMapScreen` отримує окремий local preview entry, використовує ту саму карту і той самий `FlightTelemetry`.
4. Active GPS navigation може reuse той самий controller лише як явно відокремлений режим; у DOM одночасно **один** seek slider.
5. LocationFix і preview position — різні типи/джерела. Preview point ніколи не передавати в live marker, match engine, speed чи ETA-as-live.
6. На close/unmount route controller скасовує rAF/animation і відпускає ownership; створення нового MapLibre instance заборонене.

### State machine

| Стан | Дозволені події | Результат |
|---|---|---|
| closed | OpenPreview(validGeometry) | paused at0, overview; без GPS/activation |
| unavailable | Back / retry route data | Чесне «Перегляд для цього маршруту недоступний»; жодних вигаданих точок |
| paused | Play / Seek / Step / Close | Play лише без reduced-motion; Seek/Step синхронно оновлюють geometry+leg+telemetry |
| playing | Pause / Seek / ManualCamera / End / Close / page hidden | Pause зберігає fraction; Seek не створює другий playback; End→paused at1 |
| user-controlled | ExplicitResume / Seek / Step / Close | Resume повертає preview owner; passive data/status не відбирають camera |
| reduced-motion | Seek / Step / Close | Static focus; autoplay не стартує; Play disabled з поясненням або замінений на явний next step |

При приховуванні tab playback pause, а не стрибок до кінця на resume. При route change controller перевстановлює path і fraction атомарно; callback старого route не змінює новий.

## 4. Єдиний slider і controls

`FlightTelemetry.tsx:26–77` вже має native range, aria-valuetext, previous/next, play/pause і ручний seek. Вдосконалити, не створити заміну поруч.

- Назва групи: «Перегляд маршруту». Коротка видима мітка: «Не GPS».
- Play/Pause44×44; next/previous44×44; range має44px hit-height навіть якщо track4px.
- Accessible value: етап i із n, назва транспорту/зупинки, schematic progress. Не називати playback часом реального прибуття.
- Pointer seek / Arrow keys / Home / End / single-pointer step buttons. Native range semantics зберегти.
- Seek назад/вперед оновлює preview marker, active leg, camera лише якщо owner=preview, telemetry — одним state update. У user-controlled seek змінює selection, але не забирає камеру без explicit action.
- Play після End починає заново тільки за явним натисканням; label має пояснювати повтор.
- Немає одночасних «Перегляд маршруту», «Перегляд — етап…», «До навігації» у трьох різних панелях. Назва, позиція та GPS-start мають окремі функції, не дублікати.

## 5. Camera ownership

Використати чинні `journeyCameraOwnership` та `routeCameraController`, не дві незалежні state machines, які конкурують.

| Owner | Джерело | Що може рухати карту |
|---|---|---|
| stage | Явний вибір route/stage/stop | Одне fit/focus на selection |
| preview | Явний Play/Resume | Sample підтвердженої route geometry |
| user | Pan/zoom/rotate/pitch/2D3D/keyboard controls | Лише ручні команди до explicit recenter/resume |
| follow | Явне «Моє місце» у real navigation + valid fix | Тільки accepted GPS fixes |

Всі manual controls викликають один interrupt шлях **перед** camera command. Зараз gesture interrupt є, кнопковий zoom/perspective — прогалина (`MapLibreAdapter.ts:418–430,1188–1197,1705–1711`). Після interruption pause preview; не запускати follow через таймер/новий leg/GPS event автоматично.

## 6. Smart Adaptive Camera

- Геометрія лише з чинного verified route, з перевіркою finite coordinates, length, discontinuities через existing engine. Нуль/invalid path → unavailable, не пряма лінія між невідомими точками.
- Короткий міський route: overview у фактичних bounds, потім local сегмент; максимальний pitch стриманий, transfer/stop лишається читабельним.
-100–500+км: whole-route overview і distance-aware zoom-out на довгих legs; near-transfer zoom-in/slow-down. Використати existing distance-aware flight path/sampling, не вигадувати travel time.
- Camera easing/duration — existing adapter+tokens; refresh rate — rAF з monotonic time. Playback duration є тривалістю анімації, **не** розкладом.
- Heading зміни плавні, unwrap через коротку кутову дугу; за розриву геометрії не перелітати «крізь» неіснуючий маршрут. Зупинити preview або явно segmented transition.
- Повний маршрут/next transfer не ховаються під sheet. Safe bounds враховують measured controls, side dock і safe area.
-2D лишається доступним.3D = camera perspective; не обіцянка фактичних3Dбудівель, terrain або аерофотоданих.

## 7. Bottom-sheet coordination

Чотири існуючі detents зберегти; використовувати фактичні поточні bounds/controller, не новий sheet implementation.

- Відкриття route → half/існуючий default, одна summary і local CTA.
- Drag змінює тільки sheet, transition:none; не рекреює карту, не щокадру викликає fitBounds.
- Автоматичний padding camera під час drag/expand **заморожений** на стабільному базовому half-layout. Поточний код залежить від усталеного detent; змінювати тільки після targeted reproduction, бо це може бути intentional controller behavior.
- Після explicit «Показати маршрут» розрахувати fit у фактичній видимій області. Звичайне expand деталей не означає нове camera focus.
- Desktop dock змінює base safe bounds через resize, а не через rerender кожного card.
- Detent controls працюють click/tap і keyboard, не лише drag;44px. Escape спочатку закриває layers/dialog, потім діє на sheet/back за topmost context.
- Manual owner зберігається при оновленні live даних та розгортанні sheet.

## 8. GPS, transport live та data freshness

Preview marker стилістично відрізняється від actual user dot і не має accuracy halo. Live transport marker з'являється лише з actual feed; scheduled position не анімується як GPS. Stale timestamp не ховається в diagnostics.

`following=false` не є причиною приховати location error у real navigation. Unknown speed → «—», pause → «Навігацію призупинено». Немає заяви «Безпечно зупинено» без незалежного доказу. До підтвердження server activation screen не повідомляє «Поїздку розпочато».

## 9. Performance та cleanup

- Один MapLibre instance на screen. Sources/layers оновлюються чинним adapter, setData batch; без додаткових DOM-marker систем.
- Один rAF playback, cleanup на pause/unmount/route change; timers і observers відписуються.
- Не setState кожного unrelated UI елемента на кожен animation frame; telemetry оновлювати лише коли видиме значення змінилося, camera sampling окремо.
- Не animate offscreen vehicles. Нових webfont/video/background assets немає.
- Performance targets — **не результати**: не додавати >50ms main-thread long tasks у seek/drag; порівняти кількість/тривалість із baseline; frame distribution і memory slope виміряти на одному route/device. Не заявляти60FPS зі static screenshot.
- Один важкий локальний процес; перед browser/profile/build перевірити ресурсний стан. Не запускати інший server/preview для performance.

## 10. Acceptance / negative controls

1. Pure playback tests:0/1 clamp, seekback, pause sample stable, duration independent from trip duration, invalid path, transfer stage, one scheduler cleanup.
2. Preview boundary test spies: geolocation/getCurrentFix/start/complete/persistence **0викликів** від OpenPreview/Play/End.
3. Rendered DOM: один range; controls доступні44px, keyboard і pointer alternative; label не GPS.
4. Manual interruption: pan, scroll zoom, button zoom, rotate,2D3D, keyboard → pause/user; через≥два playback ticks карта не повертається сама.
5. Sheet drag/expand: один canvas/instance, camera bounds не стрибають у city overview, active leg збережений.
6. Real navigation tests окремо: fresh fix, denied, stale, low accuracy, activation failure; playback endpoint ніколи не завершує реальну поїздку.
7. Short/long100–500+км valid routes, both themes,320–1440, landscape, reduced-motion, page hidden/resume.
8. Negative control на кожен виправлений boundary: стара реалізація має провалити відповідний новий тест; source regex не замінює виконання поведінки.

Усі ці gates станом на створення документа **NOT_TESTED для нового дизайну**. Захищений browser currently requires reauthentication; auth не обходити.
