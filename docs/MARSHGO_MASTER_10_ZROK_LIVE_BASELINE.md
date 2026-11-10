# MARSHGO MASTER 10.0 — базлайн ФАКТИЧНОЇ zrok-збірки

Статус: **аудит + виміри (PHASE 0 / PHASE 1 / §25 / §36 CHECKPOINT 1–3)**.
Це не acceptance нового коду. Це доказовий зріз того інтерфейсу, який власник
фактично відкриває через zrok, зіставлений із MASTER SPEC 10.0.

Дата: 2026-11-10. Виконавець аудиту: Qoder (головний інтегратор).
Продукт залишається `NOT_RELEASED`; жоден gate нижче не оголошений готовим без доказу.

---

## 0. Ідентичність zrok-збірки (§1.4, §36, §42 п.1–4)

| Поле | Фактичне значення | Як перевірено |
|---|---|---|
| Публічний URL | `https://marshgo-dima.shares.zrok.io/` | відкрито у під'єднаному Chrome |
| zrok-процес | PID 33510, `zrok share public --headless -n public:marshgo-dima http://127.0.0.1:7777`, старт Mon 15:00 | `ps aux` |
| Локальний target | `127.0.0.1:7777`, PID 59193 | `lsof -nP -iTCP -sTCP:LISTEN` |
| Команда target | `node …/MarshGO-Site/node_modules/.bin/vite --port=3000 --host=0.0.0.0 --host 127.0.0.1 --port 7777 --strictPort` | `ps -o command -p 59193` |
| Worktree | `/Users/dima1203/.qoder/worktrees/app/330dd3/MarshGO-Site` | `lsof -a -p 59193 -d cwd` |
| Гілка | `qoder/route-geometry-continuation-20261110` | `git branch --show-current` |
| HEAD | `dbd670b` (2026-11-10 18:40:24 +0200, «fix(site): align reduced-motion checks with native scrolling») | `git log -1` |
| Незакомічені зміни | **15 файлів** (14 змінених + 1 новий `tests/route-ribbon-density.test.ts`), 448 insertions / 101 deletions | `git status --porcelain`, `git diff --stat` |
| Site `main` | `895f51e0e1f728c5b3ba0458b2d98e74ad5fb62f`; HEAD містить main (`rev-list --count HEAD..main` = 0) | `gh api git/ref/heads/main` |
| API endpoint | `127.0.0.1:3002`, PID 66637, cwd `/Users/dima1203/Desktop/MarshGO/MarshGO-Server` (канонічний репо) | `lsof -a -p 66637 -d cwd` |
| Режим авторизації | свіжий пошук закритий login-гейтом; сторінка результатів рендериться з кешу попередньої сесії. Нових credentials не вводив, акаунт не створював | спостереження UI |
| Viewport вимірювання | **428 × 843**, dpr 1 | `window.innerWidth/innerHeight` |
| Тема | **dark** (`html.className = "boot-dark dark"`) | `document.documentElement.className` |
| Канонічний Site-репо | `/Users/dima1203/Desktop/MarshGO/MarshGO-Site`, гілка `antigravity/ultimate-premium-web-9`, HEAD `eda449f`, 28 брудних файлів — **не чіпав** | `git status` |

### 0.1. Висновок §1.4 — zrok НЕ придатний для приймання MASTER 10

Тунель обслуговує **сторонній Qoder-worktree з незакоміченими змінами**, а не
`main` і не гілки Codex з MASTER 10. Жоден із PR #128 / #129 у цій збірці
відсутній. Тому:

- приймати новий код MASTER 10 через цей URL **не можна** (§1.4 пряма заборона);
- процес :7777 і тунель **не перезапускав і не змінював** (§43);
- окремий preview на вільному порту не піднімав і нового публічного тунеля не
  створював без дозволу власника (§1.4).

**Блокер B1:** потрібне рішення власника — або переключити :7777 на актуальну
збірку MASTER 10, або дозволити окремий авторизований preview. До цього всі
«zrok VERIFIED» для #128/#129 неможливі.

---

## 1. Маршрут, на якому знято виміри

Один і той самий маршрут у тому самому viewport (§25):

- Сихів, Львів → вулиця Петра Панча, Львів
- 08:00 – 08:54, **55 хв**, **30 ₴ готівкою**, **0 пересадок**
- Пішки 4 хв / 310 м → **Автобус А37** 42 хв / 22 зупинки (Центр Довженка → Парк 700-річчя Львова) → Пішки 4 хв / 295 м
- дані живі з кешу попередньої авторизованої сесії; свіжий пошук не виконував (auth-блокер)

---

## 2. Виміряна висота губи по детентах (§25, §36 CHECKPOINT 1)

`getBoundingClientRect()` на живому DOM, dark, 428 × 843.

| Детент | Висота | y верху | Map strip над губою | Порожнеча між секціями |
|---|---|---|---|---|
| PEEK | **168 px** | 675 | 675 px | 0 |
| COMPACT (collapsed) | **268.1 px** | 575 | 575 px | **82 px** |
| MEDIUM (half) | **316 px** | 527 | 527 px | 0 |
| FULL (expanded) | **671 px** | 172 | 172 px | 0 |

### 2.1. Розклад FULL (671 px)

| Секція | Висота |
|---|---|
| Drag handle (`button`, `min-h-44`) | 44 |
| `route-details-head` | 46 |
| `route-sheet-endpoints` | 17 |
| `route-sheet-summary` | 24 |
| `mg-route-ribbon--compact` | 48 |
| `route-segment-list` (scroll) | 422 видимі / **1260 scrollHeight** / 838 slack |
| CTA контейнер (52 button + 12 safe-area + 2 pt) | 66 |

### 2.2. Розклад COMPACT (268.1 px) — дефект §24

| Секція | Висота |
|---|---|
| Drag handle | 44 |
| summary | 24 |
| ribbon | 48 |
| **порожнеча (`mt-auto` перед CTA)** | **82** |
| CTA контейнер | 66 |

82 px = **30,6 % висоти COMPACT** — суцільний незаповнений градієнтний
прямокутник. Це саме той випадок, який §24 забороняє, і §23.2 називає
першопричиною (`margin-top: auto` + snap point, що не рахується від контенту).

### 2.3. Кількість видимих сегментів

- У стрічці: **3 з 3** етапи видимі одночасно (91 + 142 + 91 px у 394 px),
  горизонтальний scroll працює (`overflow:auto`, slack 0).
- У списку деталей при MEDIUM: видно **130 px із 1260 px** (≈10 % контенту).
- У списку деталей при FULL: видно **422 px із 1260 px** (≈33 %).

---

## 3. Порівняння з цільовими параметрами §23.3

| Елемент | Live (виміряно) | §23.3 орієнтир | Відхилення | Статус |
|---|---|---|---|---|
| Горизонтальний padding списку | **16 px** (`px-4`) | 12–14 px | +2…+4 | FAILED |
| Drag handle area | **44 px** | 14–20 px | +24…+30 | CONFLICT (44 px touch floor) |
| Gap після handle | 0 px | 4–6 px | −4…−6 | FAILED |
| Section gap (summary→ribbon) | 0 px | 6–10 px | −6…−10 | FAILED |
| Segment chip (`mg-route-ribbon__item`) | **44 px** | 32–40 px | +4…+12 | FAILED |
| Walking row (картка «Пішки») | **62 px** (inner 60, py 4/4) | 40–52 px | +10…+22 | FAILED |
| Transit card (шапка «Автобус А37») | **92 px** (py 4/4) | 56–72 px | +20…+36 | FAILED |
| Stop row | **44 px × 22 = 968 px** | 28–38 px | +6…+16 | CONFLICT (див. §3.1) |
| Primary CTA (FULL/MEDIUM/COMPACT) | **52 px** | 44–50 px | +2…+8 | FAILED |
| Primary CTA (PEEK) | **48 px** | 44–50 px | 0 | VERIFIED |
| Waiting row | «Очікування · 5 хв» inline | без великої порожньої картки | — | VERIFIED |
| Transfer row | немає (0 пересадок) | — | — | NOT_APPLICABLE |

### 3.1. Корінь 44 px у рядках зупинок — знайдено точно

`JourneyLegStops.tsx` задає кнопці зупинки `min-h-9` (= 36 px), але computed
`min-height` у браузері = **44 px**. Причина — глобальна підлога:

```
src/index.css:851
.production-app :is(.journey-search-card button, .journey-offer-card,
                    button.w-full:not(.mg-route-cta)) { min-height: 2.75rem; }
```

Селектор має специфічність (0,3,1) і перемагає Tailwind `.min-h-9` (0,1,0).
Кнопка зупинки має `w-full` і не є `.mg-route-cta` → потрапляє під правило.

Наслідок: 22 × (44 − 36) = **176 px** зайвої висоти лише на зупинках цього
маршруту (14 % від scrollHeight 1260).

**Це конфлікт, а не односторонній дефект.** §23.3 вимагає 28–38 px, але й
«не порушувати мінімальні зручні touch targets»; проєктна преміум-підлога —
44 × 44 px. Codex у PR #129 свідомо кодифікує цей вибір: інтерактивні рядки
`min-h-9 → min-h-11` (44 px), неінтерактивні `min-h-9 → min-h-7` (28 px).
Тобто для **клікабельних** зупинок ціль 28–38 px не буде досягнуто ні в live,
ні в #129. Потрібне окреме рішення власника, якщо 28–38 px обов'язкові й для
клікабельних рядків (тоді 44 px hit-area доведеться робити через padding/hit-slop,
а не через висоту рядка).

### 3.2. Скільки дає ущільнення контенту

Якщо картки й рядки стиснути до середини діапазонів §23.3
(walk 46 × 2 = 92, transit 64, stop 33 × 22 = 726, gaps ≈ 40):
**≈ 922 px проти фактичних 1260 px = −26,8 %** — у межах цілі §25 (25–35 %).
Саме цього шару (картки + рядки зупинок) у #129 **немає**: він змінює detents,
safe-area, tab bar і іконки, але `scrollHeight` маршруту лишається 1260 px.

---

## 4. Що вже робить Codex (не дублювати, §2 / §43)

PR **#129** `codex/bottom-sheet-density-20261110`, head `07dbdca`, base `main`,
MERGEABLE, +2999 / −275, 49 файлів. Перевірив його фактичний diff, не лише опис.

PR **#128** `codex/intelligent-navigation-premium-20261110`, head `1c2811e`, OPEN.
PR **#123** — MERGED (`a9d7d9a`, 2026-11-09 22:43).
PR **#127** `qoder/site-mobile-touch-gestures-20261110` — OPEN, head `dbd670b`
(той самий SHA, що й live-збірка; його коміти `b7a0316`, `d8e813d`, `dbd670b`
уже в live).
PR **#121** — CONFLICTING.

### 4.1. Перерахунок detentів #129 проти live (чиста функція, не вимір у браузері)

Виконав обидві версії `routeSheetHeights` через `tsx` на 5 viewport.
`safeAreaBottom = 0`; «+tabbar» = `routeSheetViewportHeights(..., reserveBottomNavigation = true)`,
inset = 57 + max(7.2, safe) = **64.2 px**.

| Viewport | Детент | Live | #129 | Δ | Δ% | #129 + tabbar |
|---|---|---|---|---|---|---|
| 320×568 | peek | 168 | 146 | −22 | −13,1 % | 146 |
| | collapsed | 220 | 178 | −42 | −19,1 % | 178 |
| | half | 260 | 284 | **+24** | +9,2 % | 252 |
| | expanded | 396 | 396 | 0 | 0 % | 331.8 |
| 375×667 | peek | 168 | 146 | −22 | −13,1 % | 146 |
| | collapsed | 220 | 178 | −42 | −19,1 % | 178 |
| | half | 260 | 334 | **+74** | +28,5 % | 301 |
| | expanded | 495 | 495 | 0 | 0 % | 430.8 |
| 390×844 | peek | 168 | 152 | −16 | −9,5 % | 146 |
| | collapsed | 268.5 | 178 | −90.5 | **−33,7 %** | 178 |
| | half | 316.5 | 380 | **+63.5** | +20,1 % | 351 |
| | expanded | 672 | 672 | 0 | 0 % | 607.8 |
| **428×843 (виміряний)** | peek | 168 | 152 | −16 | −9,5 % | 146 |
| | collapsed | **268.1** | **178** | **−90.1** | **−33,6 %** | 178 |
| | half | 316.1 | 379 | **+62.9** | +19,9 % | 350 |
| | expanded | 671 | 671 | 0 | 0 % | 606.8 |
| 430×932 | peek | 168 | 162 | −6 | −3,6 % | 154 |
| | collapsed | 300 | 186 | −114 | **−38,0 %** | 178 |
| | half | 349.5 | 419 | **+69.5** | +19,9 % | 391 |
| | expanded | 760 | 760 | 0 | 0 % | 695.8 |

Чесний підсумок для G1:

- **COMPACT** ущільнюється на 33,6–38 % при висоті ≥ 843 px → ціль §25 досягнута
  саме для цього детента; 82-px порожнеча зникає.
- **PEEK** лише −3,6…−13,1 % → ціль §25 не досягнута.
- **MEDIUM** навпаки **виростає** на 9–28 % (більше контенту, §24.2) — це
  свідома зміна, але «сумарна висота» по чотирьох детентах падає лише на
  **−3,0 %** (1423.2 → 1380 при 428×843).
- **FULL** не змінюється для довгого маршруту; content-fit helper допоможе
  лише коротким.
- Монтування глобальної панелі (§3) забирає **64.2 px** доступної висоти.

### 4.2. Інше, підтверджене у diff #129

- `transportModeRegistry.ts`: власні SVG-силуети `Minibus`, `Shuttle`, `Carpool`,
  `Carsharing` замість `Caravan`, `ArrowLeftRight`, `CarFront`, `Car` → закриває G3.
- `JourneyLegStops.tsx`: `min-h-11` для клікабельних / `min-h-7` для статичних рядків.
- нові модулі `routePreviewPath.ts`, `floatingInfoLifecycle.ts`,
  `floatingInfoPlacement.ts`, `floatingMapInfo.ts`, `useFloatingMapInfo.tsx`
  → HyperFlight + Floating Glass + Smoke Dissolve.
- глобальна 5-пунктова панель в `route-immersive-shell` → закриває §3.
- `routeSheet.ts`: safe-area рахується **один раз**, додано tab-bar inset.
- **НЕ торкається** `src/map/journeyRouteModel.ts` — тому єдина унікальна частина
  мого незакоміченого атома (прапорець `isWalk` замість крихкого порівняння
  `modeColor === '#91A6BB'`) не продубльована в #129.

### 4.3. Конфлікт файлів — чому я не відкриваю конкурентний PR

Мій незакомічений атом і #129/#128 перетинаються по файлах:
`src/index.css`, `src/map/MapAdapter.ts`, `src/map/MapLibreAdapter.ts`,
`src/map/routeGeometryTokens.ts`, `src/map/transportVisualZones.ts`,
`src/views/JourneyRouteMapScreen.tsx`, `src/views/routeSheet.ts`,
`tests/route-geometry-intelligence.test.ts`, `tests/route-map-sheet-3.test.ts`,
`tests/transport-visual-zones.test.ts`.

За §2 («не дублювати реалізовані функції») і §43 («не перезаписувати чужі
незбережені зміни») **не створюю конкурентний PR на ці файли**. Мої 15 файлів
лишаються збереженими й незакоміченими; рішення про їхню долю — за власником
після merge #129/#128 (тоді атом можна перебазувати й лишити тільки унікальне).

---

## 5. Матриця вимог MASTER 10.0 (§38)

Спільні поля для **кожного** рядка: zrok URL і SHA — з розділу 0
(`https://marshgo-dima.shares.zrok.io/`, worktree `…/330dd3/MarshGO-Site`,
гілка `qoder/route-geometry-continuation-20261110`, HEAD `dbd670b` + 15 dirty);
viewport 428×843, dark; скриншоти — розділ 6.

| ID | Вимога ТЗ | Компонент у live-збірці | Тест | Браузерний сценарій | Фактичний результат | Статус | Закриває |
|---|---|---|---|---|---|---|---|
| M10-01 | §1.4 ідентичність zrok-збірки | vite :7777 у Qoder-worktree | — | `ps`, `lsof`, `git` | zrok показує сторонній worktree + dirty, не main і не #129 | **VERIFIED** (факт встановлено) / **FAILED** (придатність для приймання) | блокер B1 |
| M10-02 | §1.2 безперервний цикл ANALYZE→…→RETEST | — | — | CHECKPOINT 1–3 | цикл виконано для губи й геометрії; для навігації/HyperFlight ні | PARTIAL | — |
| M10-03 | §3 глобальна нижня навігація в усіх режимах | немає в `route-map-screen` | — | `document.querySelectorAll('nav')` | **0** елементів `<nav>`; 5 пунктів відсутні | **FAILED** | #129 |
| M10-04 | §3.1 чотири режими | `JourneyRouteMapScreen`, вибір етапа | `tests/map-focus-mode.test.ts` | клік по стрічці, «Показати маршрут цілком» | DETAILS ✓, FULL_OVERVIEW ✓, STAGE_PREVIEW частково (вибір є, «Далі»/«Назад» немає), ACTIVE_NAVIGATION не перевірено | PARTIAL | #129 |
| M10-05 | §4 «Розпочати» = справжня GPS-навігація | кнопка `mg-route-cta` present | `tests/journey-navigation-gps.test.ts` (у #129) | клік «Розпочати» | кнопка є (52 px); сесію не запускав — auth + GPS дозвіл | **BLOCKED** | B2 |
| M10-06 | §5 «Далі» / «Назад» / «До навігації» | відсутні | — | інвентаризація всіх `button`/`aria-label` | знайдено лише «Назад до результатів»; «Далі», «До навігації» — **0** | **FAILED** | #129 |
| M10-07 | §6–10 HyperFlight, Scout, speed engine, curve anticipation, path-following | немає `routePreviewPath` у live | — | пошук контролів і станів | жодного контрола польоту, жодної світлової мітки | **FAILED** | #129 |
| M10-08 | §11 Magnetic Camera, правильний overview | `routeCameraController.ts`, `routeCameraFocus.ts`, `cameraMotion.ts` | `tests/map-focus-mode.test.ts` (проєкція у visible rect) | відкрити маршрут 55 хв | масштаб карти **«50 м»** на старті для 55-хв маршруту; sheet-aware fit є, але стартовий overview занадто близький | **FAILED** (композиція) / PARTIAL (solver) | #128 / мій атом |
| M10-09 | §12 Living Ribbon, адаптивна товщина, round caps/joins | `MapLibreAdapter.ts` halo/casing/core; `routeGeometryTokens.ts` | `tests/route-ribbon-density.test.ts`, `tests/route-geometry-intelligence.test.ts` | відкрити карту мультимодального маршруту | шари є; пішки — пунктир без casing, стики — білі крапки; незакомічені токени звужують лінії | PARTIAL | мій атом (незакомічений) |
| M10-10 | §12.2 не вигадувати дороги; §10.3 розриви | `journeyRouteModel.ts` (2-точковий fallback лише для approximate) | `tests/journey-route-map.test.ts` | — | routed-walk без геометрії **відкидається** (дірка), фальшивих з'єднувачів немає | VERIFIED (чесність) / PARTIAL (суцільність) | — |
| M10-11 | §13 focused A/B/C | `transportVisualZones.ts` | `tests/transport-visual-zones.test.ts` (57/57 у наборі) | карта маршруту | зони є в коді й тестах; live-візуально не підтверджено (0 vehicle-вузлів) | PARTIAL / NOT_TESTED візуально | #128 |
| M10-12 | §14 фірмові анімації (Pulse, Trail, Turn Lens, Transfer Bridge…) | `SEGMENT_REVEAL_TOKENS` (850/400/260 ms) | `tests/route-geometry-intelligence.test.ts` | перемикання етапа | reveal сегмента є; Route Pulse / Light Trail / Turn Lens / Transfer Bridge — відсутні | PARTIAL | #129 |
| M10-13 | §15 Precision Arrival Docking | немає | — | — | не реалізовано в live | **FAILED** | #129 |
| M10-14 | §16 Floating Glass Info | немає | — | `[class*="floating"]`, `[data-testid*="floating"]` | **0** вузлів | **FAILED** | #129 |
| M10-15 | §17 Smoke Dissolve, 4 с, tap-dismiss | немає | — | — | **0** вузлів; таймерів немає | **FAILED** | #129 |
| M10-16 | §18 Smart Live Transport Visibility | `VEHICLE_PRIORITY_TOKENS` L0–L4 | `tests/transport-visual-zones.test.ts` | інвентаризація map-маркерів | **0** vehicle-вузлів на цьому маршруті | NOT_TESTED | B2 / #128 |
| M10-17 | §19 до трьох ТЗ із підтвердженим ETA | — | — | пошук ETA-рядків у DOM | **0** рядків ETA; немає даних про живі ТЗ у цій сесії | NOT_TESTED | B2 |
| M10-18 | §20 USER_ONBOARD | — | — | — | не перевірено; потрібна авторизована сесія | **BLOCKED** | B2 |
| M10-19 | §21 12 унікальних піктограм | `transportModeRegistry.ts` | `tests/transport-icon-registry.test.ts` (у #129) | читання реєстру + DOM | **8/12** відповідають силуету; `marshrutka=Caravan`, `carpool=CarFront`, `carsharing=Car`, `transfer=ArrowLeftRight` — generic; carpool/carsharing/taxi майже однакові | **FAILED** (G3) | #129 (4 власні SVG) |
| M10-20 | §21.3 читабельність 16/20/24/32 px, обидві теми | — | — | — | матрицю 4×3 не знімав; світлу тему не перемикав | NOT_TESTED | — |
| M10-21 | §22 одна форма губи в усіх режимах | один `route-bottom-sheet`, radius 32px, один градієнт | `tests/route-map-sheet-3.test.ts` | 4 детенти | форма однакова в DETAILS; ACTIVE_NAVIGATION не порівняно | PARTIAL | #129 |
| M10-22 | §23 ultra-compact P0 | `JourneyRouteMapScreen.tsx`, `routeSheet.ts`, `index.css` | 57/57 цільових | виміри §3 | 8 із 12 параметрів поза діапазоном; 2 — конфлікт із 44 px підлогою | **FAILED** | #129 + §3.2 цього документа |
| M10-23 | §24 zero wasted blue space | CTA контейнер `mt-auto` | — | COMPACT | **82 px порожнечі = 30,6 %** детента | **FAILED** | #129 (collapsed 268→178) |
| M10-24 | §25 вимірювана компактність 25–35 % | — | — | `getBoundingClientRect` + перерахунок функції | COMPACT −33,6 % у #129; PEEK −9,5 %; MEDIUM +19,9 %; FULL 0 %; сума 4 детентів −3,0 %; `scrollHeight` 1260 не змінюється | PARTIAL | #129 + §3.2 |
| M10-25 | §26 компактний Smart HUD | — | — | — | навігація не запускалась | NOT_TESTED | B2 |
| M10-26 | §27 прибрати технічний шум | — | — | `document.body.innerText` | текст чистий: «55 хв 30 ₴ … Розпочати»; provider/debug/жовтих технічних блоків немає | **VERIFIED** | — |
| M10-27 | §28 пошук і результати узгоджені | 12 категорій, «Пішки» як сегмент | — | сторінка результатів | 12 категорій збережено; «Пішки» — сегмент, не категорія | VERIFIED (за реєстром і DOM) | — |
| M10-28 | §29 touch & gesture engine | коміти `b7a0316`, `d8e813d`, `dbd670b` у live | `tests/route-map-sheet-3.test.ts` | горизонтальний scroll стрічки | нативний scroll працює (`overflow:auto`, slack 0); pinch/rotate/flick на реальному пристрої не перевіряв | PARTIAL | #127 |
| M10-29 | §30 мобільна доступність | 44 px підлога, `env(safe-area-inset-bottom)` | `tests/canonical-design.test.ts` | вимір CTA і рядків | CTA 52/48 px ≥ 44; рядки 44 px; safe-area 12 px один раз | VERIFIED (428 px) / NOT_TESTED (320/375/390/430, WebKit) | — |
| M10-30 | §31–32 моушн-профілі й токени | `--mg-dur-*`, `--mg-ease-*` у `index.css` | `tests/route-geometry-intelligence.test.ts` | transition губи | `transition: height var(--mg-dur-base) var(--mg-ease-entrance)` — токени, не inline-числа | VERIFIED | — |
| M10-31 | §33 performance engineering | один MapLibre instance, `setData` | — | — | FPS, long tasks, пам'ять **не вимірював** | NOT_TESTED | — |
| M10-32 | §34 аудит реальних компонентів | усі 12 перелічених файлів існують | — | перевірка `-f` для кожного шляху §34 | `MapLibreAdapter.ts`, `MapAdapter.ts`, `MarshGoMap.tsx`, `cameraMotion.ts`, `journeyRouteModel.ts`, `transportVisualZones.ts`, `transportQuality.ts`, `JourneyRouteMapScreen.tsx`, `JourneyActiveNavigation.tsx`, `routeMapAnnotations.ts`, `productionApi.ts`, `transportModeRegistry.ts` — **12/12 OK**; назви не вигадував | **VERIFIED** | — |
| M10-33 | §35 backend-контракти, реальні дані | `productionApi.ts` `routeGeometry?: [number,number][] \| null` | Server PR #136 (61/61) | — | геометрії по ногах; shapes Львова 15139/15141; нових полів не вигадував | VERIFIED (Server-аудит) | #136 |
| M10-34 | §37 автоматизовані тести | `tests/*.test.ts` | **57/57 pass**, `tsc --noEmit` exit 0 | — | цільовий набір зелений на live-збірці; повний suite не запускав | PARTIAL | — |
| M10-35 | §36 CHECKPOINT 1 (губа) | — | — | 4 детенти, висоти, порожнеча, скриншоти | виконано, розділи 2–3 | **VERIFIED** | — |
| M10-36 | §36 CHECKPOINT 2 (іконки) | — | — | реєстр прочитано, матрицю 4×3 не знято | 8/12; візуальної матриці немає | PARTIAL | #129 |
| M10-37 | §36 CHECKPOINT 3 (геометрія) | — | — | карта маршруту | A/B/C і стики візуально не підтверджені в цій сесії | PARTIAL | — |
| M10-38 | §36 CHECKPOINT 4–10 | — | — | — | GPS, HyperFlight, Floating Info, Live Transport, Unified UI, Mobile, Full Journey — не пройдено | **BLOCKED** / NOT_TESTED | B1, B2 |

---

## 6. Скриншоти

Збережені локально (не закомічені в репо):

- `/tmp/marshgo-master10-evidence/01-peek-428x843.png` — PEEK 168 px, dark, 428×843
- `/tmp/marshgo-master10-evidence/02-expanded-428x843.png` — FULL 671 px, список 422/1260

Обидва зняті з `https://marshgo-dima.shares.zrok.io/` на HEAD `dbd670b` + 15 dirty.
Скриншот COMPACT із 82-px порожнечею в цій сесії не збережено окремо — дефект
підтверджений числовим виміром (`ribbon.bottom = 692`, `CTA.y = 774`).

---

## 7. Acceptance gates (§39)

| Gate | Стан у live-збірці | Стан після #129/#128 (за diff, не за виміром) |
|---|---|---|
| G1 UI Density | **FAILED** — 82 px порожнечі, 8/12 параметрів поза ціллю | PARTIAL — COMPACT −33,6 %, але scrollHeight 1260 без змін |
| G2 Unified Sheet | PARTIAL — одна форма в DETAILS | NOT_TESTED — навігацію не перевірено |
| G3 Icons | **FAILED** — 8/12, 4 generic-силуети | очікує VERIFIED після візуальної матриці 4×3 |
| G4 Geometry | PARTIAL — шари є, стики й casing дефектні | NOT_TESTED |
| G5 GPS | **BLOCKED** (B2) | BLOCKED |
| G6 Preview | **FAILED** — «Далі» немає | NOT_TESTED |
| G7 HyperFlight | **FAILED** — відсутній | NOT_TESTED (код є в #129, політ не спостерігав) |
| G8 Camera | **FAILED** — «50 м» на 55-хв маршруті | NOT_TESTED |
| G9 Floating Info | **FAILED** — 0 вузлів | NOT_TESTED |
| G10 Vehicles | NOT_TESTED — 0 маркерів, 0 ETA | NOT_TESTED |
| G11 Touch | PARTIAL — native scroll ✓, реальний пристрій ні | NOT_TESTED |
| G12 Performance | NOT_TESTED — FPS/пам'ять не міряв | NOT_TESTED |
| G13 zrok Browser QA | PARTIAL — CHECKPOINT 1–3 частково; zrok вказує на сторонню збірку | **BLOCKED (B1)** |
| G14 Final E2E | **BLOCKED** (B1 + B2) | BLOCKED |

**Жоден критичний gate не закритий. Повна готовність MASTER 10.0 не оголошується.**

---

## 8. Блокери

- **B1 — zrok identity.** Тунель :7777 обслуговує Qoder-worktree `dbd670b` + 15
  dirty, а не main і не #129/#128. §1.4 забороняє приймати новий код через таку
  збірку. Процес і тунель не чіпав. Потрібне рішення власника.
- **B2 — auth + GPS.** Свіжий пошук, «Розпочати», GPS-follow, live-транспорт,
  ETA і USER_ONBOARD потребують авторизованої сесії та реального дозволу
  геолокації. Credentials не вводив, тестовий акаунт не створював, GPS не
  підміняв. Сценарії позначені BLOCKED, не VERIFIED.
- **B3 — конкуренція виконавців.** §0/§44 ТЗ називає CODEX єдиним виконавцем і
  забороняє передавати роботу Qoder; власник водночас прямо доручив застосувати
  ТЗ до інтерфейсу мені. Codex фактично вже виконує ТЗ (#129 містить усі п'ять
  артефактів §42). Щоб не порушити §2 і §43, я обмежився аудитом і вимірами
  live-збірки та **не відкривав конкурентний PR** на ті самі файли.
- **B4 — viewport matrix.** Під'єднаний Chrome не дає керувати розміром вікна,
  тому виміряно лише 428×843. 320/375/390/430 і WebKit — NOT_TESTED
  (числа для них у §4.1 — **розрахунок функції**, не вимір).
- **B5 — конфлікт цілей §23.3 vs 44 px.** Див. §3.1: потрібне рішення власника.

---

## 9. Що я фактично виконав у цій сесії

1. Встановив точну ідентичність zrok-збірки (§1.4) — розділ 0.
2. Зняв базлайнові виміри губи в чотирьох детентах (§25, §36 CP1) — розділ 2.
3. Знайшов і числово довів 82-px порожнечу COMPACT (§24) — розділ 2.2.
4. Знайшов точну першопричину 44 px у рядках зупинок: `src/index.css:851`
   проти `min-h-9` у `JourneyLegStops.tsx` — розділ 3.1.
5. Звірив 12 піктограм із §21: 8/12, чотири generic — розділ 5, M10-19.
6. Прочитав фактичний diff #129 і перерахував обидві версії `routeSheetHeights`
   на 5 viewport — розділ 4.1 (чесно: COMPACT −33,6 %, MEDIUM +19,9 %, сума −3,0 %).
7. Запустив цільові тести на live-збірці: **57/57 pass, 0 fail**;
   `tsc --noEmit` — **exit 0, 0 помилок**.
8. Зафіксував конфлікт файлів і **не створив конкурентний PR**; мої 15
   незакомічених файлів збережені без змін.

Чого **не** робив: не merge, не deploy, не змінював main / :7777 / :3002 / DB /
Docker / канонічний брудний Site-репо, не вводив credentials, не вигадував GPS,
ETA, дороги чи провайдерів, не оголошував NOT_TESTED як VERIFIED.

---

## 10. ACCEPTANCE-ТЕСТУВАННЯ: чи всі пункти ТЗ виконані (2026-11-10, за командою власника «продовжуй і протестуй»)

### 10.1 Ресурсний стан і межі прогону

- RAM **14.2 % free** (поріг 20 %), swap **10.27 GB / 11.26 GB**; Docker VM + 5
  контейнерів (redis×2, db, walk-router×2), Qoder renderer 444 MB.
- **Браузерний прогін BLOCKED** за resource-guard (не запускав новий браузер,
  не restart-ив Docker/DB/API). Візуальні / live / device / touch пункти
  лишаються BLOCKED або NOT_TESTED — це не виправлено.
- Acceptance виконано на рівні **коду + exact-head CI**, що є реальним
  виконанням, а не записаною заявою.

### 10.2 Де живе фактична реалізація MASTER 10

| PR | Репо | Гілка | Head | Стан | Роль |
| --- | --- | --- | --- | --- | --- |
| #129 | MarshGO-Site | `codex/bottom-sheet-density-20261110` | `07dbdca` | OPEN, не merge | основна реалізація MASTER 10 (+2999/−275, 47 файлів) |
| #128 | MarshGO-Site | `codex/intelligent-navigation-premium-20261110` | — | OPEN, не merge | route focus evidence-safe |
| #23 | MarshGO | `qoder/integration-20261108` | `1f6e3fb` | OPEN | цей baseline-звіт (Qoder) |

**Вирішальний факт:** zrok `https://marshgo-dima.shares.zrok.io/` досі віддає
**мій** Site-worktree `dbd670b` + 15 dirty (гілка
`qoder/route-geometry-continuation-20261110`, :7777 PID 59193), **НЕ** #129.
Тому MASTER 10 **не розгорнуто на zrok** — приймання через zrok неможливе
(§1.4, G13 BLOCKED). Codex у власній матриці #129 це теж фіксує.

### 10.3 Незалежно перевірені гейти (код + CI)

**CI exact-head #129 `07dbdca`** (run 42837053687, job 129901949792,
2026-11-10T14:45:17 UTC): `tests 677 · suites 58 · pass 677 · fail 0`;
job `verify` = **pass** (typecheck + lint + test + check-tokens + build +
check:bundle + check-single-react + boot-smoke). Другий run 42837070272 теж pass.
Це **VERIFIED** через фактичний CI-лог, не через заяву в доку.

| § ТЗ | Вимога | Доказ у коді #129 @ `07dbdca` | Статус |
| --- | --- | --- | --- |
| §4 | «Розпочати» = реальний GPS, без вигадок | `journey-navigation-gps.test.ts`: «accepts only a fresh, accurate fix», «rejects simulated coordinates, low accuracy, stale», «virtual camera and Scout never write a fake GPS position or route lifecycle state» | код+тест VERIFIED; live GPS NOT_TESTED |
| §5 | «Далі» = preview, не змінює progress | «HyperFlight is a cancellable preview between confirmed adjacent route geometries»; persistence: «stage follows the passenger and never resurrects a left journey» | код+тест VERIFIED; live NOT_TESTED |
| §6–10 | HyperFlight за cumulative distance, не point index | `routePreviewPath.ts`: `cumulativeMeters[]`, `sampleRoutePreviewPath(path, distanceMeters)`, бінарний `segmentAtDistance`, guard «long unexplained jump is not a road» → null | код VERIFIED; FPS/тривалість NOT_TESTED |
| §17 | Smoke Dissolve 250–450 / 4 s / 600–900 / 200–350 ms | `floatingInfoLifecycle.ts`: enter **350**, visible **4000**, dissolve **750**, dismiss **275**; фази ENTERING/VISIBLE/DISSOLVING/HIDDEN; reduced-motion пропускає enter | код+тест VERIFIED (усі в діапазоні); browser timing PARTIAL |
| §21 | 12 унікальних силуетів, маршрутка ≠ трамвай | `transportModeRegistry.ts`: marshrutka=**Minibus**, trolleybus=**Trolleybus** («two current-collector poles», не bus), carpool=**Carpool**, carsharing=**Carsharing**, transfer=**Shuttle** — усі кастомні SVG; тест «all twelve … distinct», «marshrutka, tram, trolleybus … own silhouettes» | код+тест VERIFIED **12/12** (live было 8/12); B/W матриця 16–32 px PARTIAL |
| §3 | 4 режими камери роздільні | «keeps GPS-follow, stage preview, and full overview as separate camera actions» | код+тест VERIFIED; live переходи NOT_TESTED |
| §25 | губа −25…35 % collapsed | fixture Codex: 320×568 240→178 (−25.8 %), 390×844 245→178 (−27.3 %), 430×932 270→186 (−31.1 %) | PARTIAL (синтетичний fixture, не zrok); мій перерахунок: MEDIUM +19.9 %, сума детентів −3.0 % |

### 10.4 Матриця Codex #129 (незалежно прочитана) — чесні статуси

`docs/MARSHGO_MASTER_10_REQUIREMENTS_MATRIX.md` @ `07dbdca`:
- **G1–G9 = PARTIAL** — лише локальний синтетичний fixture `:4178`, без
  zrok-приймання, без repository-скриншотів, basemap чорний (бракує style assets).
- **G5** (real GPS Start), **G10** (vehicles/ETA/onboard), **G11** (touch
  gestures), **G12** (FPS/memory), **G14** (auth end-to-end), **G15** (six-repo
  release manifest) = **NOT_TESTED**.
- **G13** (zrok identity) = **BLOCKED** — zrok = чужий Qoder-worktree.

### 10.5 Відповідь на питання власника: чи ВСІ пункти виконані?

**НІ на рівні приймання; ТАК на рівні коду + unit-тестів для реалізованої частини.**

1. **Реалізовано й unit-перевірено** (677/677 CI exact-head): §4 GPS-чесність,
   §5 preview≠progress, §6–10 HyperFlight path sampler, §17 Smoke Dissolve
   тайминги, §21 12/12 іконок, §3 роздільні режими камери, компактна губа.
2. **НЕ прийнято через zrok** — #129 не розгорнуто; zrok віддає мій старий
   worktree (G13 BLOCKED). Жоден візуальний gate не закритий живим доказом.
3. **NOT_TESTED:** реальний GPS (§4 live), vehicles/ETA/USER_ONBOARD (§18–20),
   touch-жести на пристрої (§29), FPS/memory (§33), auth end-to-end (§35),
   six-repo release manifest.
4. **PARTIAL:** усі візуальні гейти — синтетичний fixture, не live-провайдер,
   без repository-скриншотів, basemap чорний.

**Жоден критичний gate не закритий повним доказом. `NOT_RELEASED`.**
Розрив між «код написано + 677 тестів зелено» і «прийнято на живому zrok +
пристрій + auth» — це і є залишок MASTER 10, який не можна оголосити виконаним.

### 10.6 Що потрібно для закриття (блокери)

- **B1** — розгорнути #129 на приймальній збірці (окремий preview або дозвіл
  перенаправити :7777); зараз zrok = мій dirty worktree, не кандидат.
- **B2** — авторизована сесія для GPS / пошуку / vehicles / auth end-to-end.
- **B3** — merge #129/#128 або явне доручення Qoder rebase мого атома
  (15 файлів, унікальне `isWalk`).
- **B4** — RAM ≥ 20 % для браузерного / device прогону (зараз 14.2 %, swap 10 GB).
- **B5** — §23.3 (зупинки 28–38 px) vs 44 px touch-floor (#129 кодує `min-h-11`).

---

## 11. ДЕТАЛЬНА ПЕРЕВІРКА КОЖНОЇ ВИМОГИ ТЗ (за командою «перевір кожну деталь згідно ТЗ»)

Прогін по повному тексту MASTER SPEC 10.0 (1481 рядок, §0–§44). Кожна
конкретна деталь звірена з **фактичним кодом Codex #129 @ `07dbdca`**
(через `gh api contents?ref=07dbdcabc` + `gh pr diff 129`, 4604 рядки).
Браузер BLOCKED (RAM 14.2 %), тому це code+test+CI рівень; live/device
приймання лишається BLOCKED/NOT_TESTED. Нижче — лише те, що реально
підтверджено або спростовано читанням коду, без вигадок.

### 11.1 VERIFIED — точні константи/символи в коді #129

| § | Деталь ТЗ | Доказ (файл:рядок @ `07dbdca`) | Статус |
| --- | --- | --- | --- |
| §4 | GPS лише свіжий `source==='gps'`, не replay/guessed | `passengerLocation.ts:10` + коди PERMISSION_DENIED/LOW_ACCURACY/STALE/INVALID_FIX/TELEPORT_DETECTED (:6), людські retry-повідомлення (:16-19) | VERIFIED код; live NOT_TESTED |
| §5 | Кнопки Розпочати/Далі/Назад/До навігації/Весь маршрут | `JourneyActiveNavigation.tsx:699,712,877,882`; «Назад» disabled at legIndex 0 | VERIFIED |
| §5.2 | «Далі» не змінює GPS/progress/посадку/ETA | тест «HyperFlight is a cancellable preview…», «Scout never write a fake GPS position or route lifecycle state» | VERIFIED тест |
| §6.2 | Близька 3D: zoom 15–17, pitch 45–60, adaptive look-ahead | `MapLibreAdapter.ts:1028` zoom 16.6 (short), :1033 pitch `min(52,…)`, :1043 lookAhead `max(90,min(280, remaining*0.12))` | VERIFIED код |
| §6.3 | HyperLight Scout: blue core, glow, trail, не GPS | `MapLibreAdapter.ts:1019-1025` + `index.css:1699-1700` (30 px, drop-shadow blue 62 %, trail+halo+core), dissolve+remove (:1052-1056) | VERIFIED |
| §8 | Adaptive duration 450–2800 мс | `MapLibreAdapter.ts:999` `Math.max(450, Math.min(2_800, durationMs))` — точний діапазон | VERIFIED |
| §9.4 | Найкоротший кут, без 270–360° | `MapLibreAdapter.ts:1081` `((Δ+540)%360)-180`, exponential bearingEase (:1076) | VERIFIED |
| §10 | Path-following за cumulative distance, не index | `routePreviewPath.ts` `cumulativeMeters[]`, `sampleRoutePreviewPath(path, distanceMeters)`, gap-guard → null | VERIFIED |
| §13 | A/B/C = beforeBoarding/passengerSegment/afterAlighting | `transportVisualZones.ts:7,12-14,58-62` — точні імена ТЗ | VERIFIED |
| §16.1-4 | Табло: вид+номер, час, відстань, посадка/висадка/пересадка | `floatingMapInfo.ts:26` title=baseLabel+routeName, distance/duration formatted, kinds boarding/alighting/transfer (:45,60) | VERIFIED |
| §16.6 | Placement уникає controls/sheet/edges | `floatingInfoPlacement.ts:22,39,42` overlapArea cost, 4 anchors, «avoids map controls, sheet and viewport edges» | VERIFIED |
| §17 | Smoke Dissolve 250–450/4 s/600–900/200–350 | `floatingInfoLifecycle.ts:4-7` enter 350 / visible 4000 / dissolve 750 / dismiss 275; 4 фази; reduced-motion | VERIFIED (усі в діапазоні) |
| §18.5/19 | Freshness 90 s, не scheduled як LIVE | `transportQuality.ts:9` `LIVE_POSITION_MAX_AGE_MS=90_000`, status LIVE/SCHEDULED/ESTIMATED/STALE/UNKNOWN (:14), «forbids live without proof» (:5) | VERIFIED |
| §21 | 12 унікальних силуетів, маршрутка≠трамвай | `transportModeRegistry.ts:103-114` Minibus/Trolleybus/Carpool/Carsharing/Shuttle кастомні; тест «all twelve … distinct» | VERIFIED 12/12 |
| §29 | Pan/pinch/rotate/pitch, manual > follow | `MapLibreAdapter.ts:299` dragPan/touchZoomRotate/pitchWithRotate/dragRotate/touchPitch; :361 «only user's own gestures leave follow mode» | VERIFIED код; device NOT_TESTED |
| §33 | Без remount per-segment, без particles, rAF cleanup | `MapLibreAdapter.ts:299` єдиний `new Map`; setData reuse (:936,1161); rAF+cancelAnimationFrame (:1049,1122,1130); particle=0 | VERIFIED код; FPS NOT_TESTED |
| §16.5 | Glass: напівпрозорий graphite, blur, blue акцент | `index.css:72,188` surface-glass rgba; :94,133 route-floating; backdrop-blur; scout glow | VERIFIED |
| §32 | Button press 100–160, active segment 160–260, camera 350–900 | `index.css:1400` tap 120, :1402 base 260; `cameraMotion.ts:35` FOCUS 700 | VERIFIED (базові) |

### 11.2 PARTIAL / DEVIATION — реалізовано інакше або не повністю

| § | Деталь ТЗ | Фактичний стан у #129 | Статус |
| --- | --- | --- | --- |
| §3.1 | 4 режими ROUTE_DETAILS/ACTIVE_NAVIGATION/STAGE_PREVIEW/FULL_ROUTE_OVERVIEW | `cameraFocusMode='gps'\|'preview'\|'overview'\|'free'` (`JourneyActiveNavigation.tsx:121`) — 4 режими є, але **не імена ТЗ**; ROUTE_DETAILS = окремий екран | PARTIAL |
| §3.2 | 9 незалежних станів (navigationSession, actualJourneyProgress, cameraMode, previewStageIndex, selectedStage, sheetDetent, vehicleState, floatingInfoState, hyperflightState) | cameraFocusMode/legIndex/sheetDetent/floatingInfoPhase є; **hyperflightState і vehicleState як іменовані enum — відсутні** | PARTIAL |
| §6.4 | 11 станів HyperFlight (IDLE…CANCELLED) через єдиний controller | **0 збігів** PREPARING/IGNITING/ACCELERATING/CRUISING/CORNERING/DECELERATING/DOCKING/ARRIVAL_REVEAL у всьому diff; continuous rAF flight + `isPreviewFlying` boolean замість state-machine | PARTIAL (немає іменованої машини) |
| §12.3 | Товщина: overview 3–4, details 5–6, active 6–8, navigation 7–9 px | `routeGeometryTokens.ts:21` core normal `[3.5,6,9,10.5]` по z5/z12/z15/z17: overview 3.5 ✓, details 6 ✓, **active 9 і navigation 10.5 — вищі за орієнтири** | PARTIAL (zoom-adaptive, але focus перевищує) |
| §18.1 | 8 станів vehicle (BACKGROUND…USER_ONBOARD…STALE) | **0 збігів** APPROACHING_FAR/NEAR/AT_BOARDING/PASSED_BOARDING; натомість модель L0–L4 + reason (`transportVisualZones.ts:23-25,38`) | PARTIAL (інша модель) |
| §19 | Максимум 3 ТЗ з ETA | priority L3/L4 + «verified top approaches» є; **явного cap `slice(0,3)` для vehicles не знайдено** | PARTIAL |
| §23.3 | Stop row 28–38 px, segment chip 32–40, transit card 56–72, CTA 44–50 | `JourneyLegStops.tsx` min-h-11 (44 px interactive) / min-h-7 (28 px static); **44 px конфліктує з 28–38** (B5); інше в Tailwind | PARTIAL + конфлікт цілей |
| §25 | −25…35 % сумарної висоти контенту | fixture collapsed −25.8…−31.1 % ✓; але **MEDIUM +19.9 %, сума детентів −3.0 %, scrollHeight 1260 без змін** | PARTIAL |
| §32 | Повна таблиця 13 токенів (Stop Halo 350–700, Route Pulse 400–900, Stage transition 450–950, Route Reveal 300–1100, Sheet Morph 220–400…) | базові tap/base/fast/slow + camera 700 + floating 350/4000/750/275 є; **спеціалізовані route-pulse/stop-halo/stage-transition/route-reveal/sheet-morph не всі явні як токени** | PARTIAL |

### 11.3 NOT_IMPLEMENTED / NOT_TESTED — чесні прогалини

| § | Деталь ТЗ | Доказ | Статус |
| --- | --- | --- | --- |
| §20 | USER_ONBOARD intelligence (підтверджений пасажир у ТЗ → найвиразніший, наступна зупинка, відстань до висадки) | **0 рядків коду** у всьому diff #129; 2 збіги «onboard» — лише в доках Codex як `M10-G10 … NOT_TESTED` | **NOT_IMPLEMENTED** |
| §18.4 | PASSED_BOARDING плавне згасання (не за одним GPS-стрибком) | reason `stale_position`/`other_route` є, але **PASSED_BOARDING як окремий стан відсутній** | NOT_IMPLEMENTED |
| §33.1 | FPS, long frames, input responsiveness, camera settling, CPU, пам'ять, memory growth | жодних вимірів; браузер BLOCKED | NOT_TESTED |
| §4 live | Реальна GPS-сесія «Розпочати» на пристрої | код-логіка є, live-сесії не було (немає дозволу/пристрою) | NOT_TESTED |
| §28 | 12 категорій + 3 стратегії сортування (Оптимальний/Найшвидший/Найдешевший) | **не в diff #129** — pre-existing base-код, окрема перевірка потрібна | NOT_VERIFIED цим прогоном |
| §36 CP1-10 | zrok-чекпоінти після кожного етапу | zrok = чужий worktree (G13 BLOCKED), браузер RAM BLOCKED | BLOCKED |
| §38/§42 | Скриншоти/відео кожного пункту, repository evidence | Codex matrix: «no repository screenshot file yet», basemap чорний | BLOCKED / NOT_TESTED |

### 11.4 Підсумок детальної перевірки

- **Ядро реалізовано добре:** GPS-чесність (§4), preview≠progress (§5),
  близька камера + Scout (§6.2/6.3), duration 450–2800 (§8), curve
  shortest-angle (§9), cumulative-distance (§10), A/B/C (§13), floating
  контент+placement (§16), Smoke Dissolve тайминги (§17), freshness 90 s
  (§18.5/19), 12/12 іконок (§21), gesture config (§29), performance bans
  (§33) — **VERIFIED у коді з точними константами**.
- **Але конкретні деталі ТЗ НЕ виконані буквально:**
  1. **§20 USER_ONBOARD — повністю відсутній у коді** (лише NOT_TESTED у доках).
  2. **§6.4 — немає 11-станної машини HyperFlight** (continuous flight замість).
  3. **§18.1 — немає 8-станної машини vehicle** (L0–L4 замість).
  4. **§3.1 — режими названі gps/preview/overview/free, не канонічними іменами ТЗ.**
  5. **§12.3 — товщина на focus-zoom перевищує орієнтири** (core 9/10.5 vs 6–8/7–9).
  6. **§23.3 — stop row 44 px конфліктує з 28–38 px** (свідомий a11y-floor, B5).
  7. **§19 — явний cap «рівно 3 ТЗ» не підтверджений.**
- **Усе live/browser/device приймання — BLOCKED/NOT_TESTED** (RAM 14.2 %,
  zrok ≠ кандидат, немає auth-сесії).

**Висновок: «кожна деталь згідно ТЗ» — НЕ виконана.** Код #129 покриває
більшість ядра з точними константами, але §20 (USER_ONBOARD), §6.4 (11 станів),
§18.1 (8 станів), §3.1 (імена режимів), §12.3 (ширини), §23.3 (stop row)
мають підтверджені відхилення або прогалини. Жоден критичний gate не закритий
живим доказом. `NOT_RELEASED`. Це чесний результат читання коду, не здогад.