# MARSHGO — Creative concepts and research

2026-11-14 · Pre-implementation specification · **NOT_RELEASED**.

## 1. Завдання дизайну

Зробити один мультимодальний маршрут зрозумілим за перший погляд: куди, коли, як, де пересадка, що підтверджено. Фірмовість має виникати з точного представлення шляху, не з декоративного «футуризму». Audit baseline — `MARSHGO_DESIGN_AUDIT.md`; screen coverage — `MARSHGO_SCREEN_REDESIGN_MATRIX.md`. Частина захищених станів source-only після refresh401; дослідження не підміняє їх приймання.

Незмінні умови: 12 категорій, mobile4×3, незалежний multiselect; 5 глобальних пунктів; + = публікація;4Home actions; один journey engine; один MapLibre screen + sheet; справжні дані; MarshPass лише для приватної підтвердженої попутки.

## 2. Три самостійні концепції

### A — Refined Minimalism / «Точність руху»

- **Характер:** тихий, редакційний, надійний. Найсильніший елемент — зміст, а не рамка.
- **Колір:** паперовий canvas, біла surface, graphite ink; один blue action; темна тема — матовий navy. Transport color тільки в іконці/лінії.
- **Типографіка:** native system stack, tabular numbers для часу; display28/32, section20/26, body16/24, metadata12/16.
- **Геометрія:** spacing4/8/12/16/24/32; cards20px, controls12px, sheets28px. Одна тонка розділювальна лінія замість подвійної картки.
- **Поведінка:** progressive disclosure деталей; ціна й ETA завжди видимі; тихі pressed/focus states.
- **Motion:** короткі opacity/transform переходи, без паралаксу.
- **Карта:** плоский overview за замовчуванням, акцентована обрана лінія, один control rail.
- **Плюси:** читабельність, низький GPU-cost, доступність, проста підтримка.
- **Мінуси:** слабша впізнаваність, ризик схожості на типову utility-app; може недостатньо пояснювати складні пересадки.
- **Складність:** середня; головне — системне вирівнювання всіх станів, а не переписування.

### B — Premium Spatial Mobility / «Простір маршруту»

- **Характер:** картографічний, технологічний, орієнтація в просторі важливіша за декоративний chrome.
- **Колір:** темний ink canvas, layered navy, cyan focus; light карта має ту саму ієрархію.
- **Типографіка:** large ETA, compact maneuver; решта до рівня body/meta, без cockpit-дрібноти.
- **Геометрія:** широка карта, sheet з4положеннями, центр уваги над верхнім краєм sheet; floating toolbar лише за потребою.
- **Поведінка:** selection → focus сегмента; map gesture → user owns camera; explicit recenter/resume.
- **Motion:** distance-aware overview flight з уповільненням на пересадках; тільки добровільний preview, без ambient animation.
- **Карта:** стриманий pitch, довгі маршрути видно цілими; 2D доступний завжди. Геометрія з фактичного itinerary, не «дрон над вигаданими будинками».
- **Плюси:** найкраще просторове розуміння, сильний емоційний характер.
- **Мінуси:** GPU/motion/a11y ризики; дорогий контроль ownership, reduced-motion і low-end пристроїв; без даних 3D втрачає сенс.
- **Складність:** висока; неприйнятно будувати другу карту/движок.

### C — MARSHGO Signature Experience / «Лінія подорожі»

- **Характер:** власний візуальний словник, у центрі — неперервність A→B крізь різні види транспорту.
- **Фірмовий елемент:** route ribbon — впізнавана стрічка legs з вузлами пересадки, іконкою режиму та номером. Одна й та сама семантика у result card, details timeline, preview і trips.
- **Колір:** нейтральне тло, blue для дії, стримані mode strokes. Кожен режим має стабільний light/dark token, а не12кричущих карток.
- **Типографіка:** контраст ваги, великі числа лише для рішення (час/ціна), людські назви зупинок; без технічних статусів у hero.
- **Геометрія:** чіткий лівий маршрутний spine у form/timeline, rounded20cards, compact semantic chips. Desktop — композиція колонок, не смартфон у рамці.
- **Поведінка:** вибір сегмента підсвічує його у всіх представленнях; подробиці зберігаються у sheet, не в новій сторінці на кожен tap.
- **Motion:** continuity selection→map, короткий акцент active segment, той самий existing playback slider; ручна взаємодія перемагає анімацію.
- **Карта:** B-просторовість тільки для обраного маршруту; A-спокій за замовчуванням.
- **Плюси:** фірмовість відповідає суті мультимодального продукту, працює в обох темах і без motion.
- **Мінуси:** потрібна дисципліна одного route model, узгодження long itineraries і читабельності у320px; не можна видавати ширину сегментів за реальний час без валідних durations.
- **Складність:** середня/висока, але наявні `JourneySegmentStrip`, `CanonicalRouteLip`, `StatusBadge` зменшують потребу в нових абстракціях.

## 3. Оцінка та вибір

Оцінки1–5 — **дизайнерське судження**, не результати користувацького експерименту. «Підтримка»5 = простіша. Вага: зручність25%, доступність20%, естетика15%, унікальність15%, швидкість15%, підтримка10%.

| Концепція | Унікальність | Зручність | Естетика | Швидкість | Доступність | Підтримка | Weighted |
|---|---:|---:|---:|---:|---:|---:|---:|
| A |3|5|4|5|5|5|4.55|
| B |4|4|5|3|3|2|3.60|
| C |5|5|5|4|4|3|4.45|
| C+A+стриманий B |5|5|5|4|5|4|4.75|

**Вибір: C+A+стриманий B, назва «Лінія подорожі».** Не повна B: важкість графіки не повинна погіршувати навігацію. Не лише A: у MARSHGO є змістовний власний motif — зміна способів руху всередині одного маршруту.

Для кожного нового елемента задаємо три питання: яку дію він пояснює, які дані підтверджують його зміст, чи працює він без кольору/руху. Якщо немає відповіді — елемент не додається.

## 4. Зовнішнє дослідження: джерело → висновок → застосування

Досліджено публічні офіційні джерела станом на2026-11-14. «PARTIAL» означає доступний офіційний витяг, але не повністю отриманий текст. Маркетинг не є незалежним доказом UX/безпеки.

| Джерело | Тип / доступ | Підтверджена ідея | Застосування / що не переносимо |
|---|---|---|---|
| [Apple HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion.md) | Настанова; текст | Рух цілеспрямований, короткий, переривний, не єдиний носій інформації | Native CSS transitions; user interrupt; не копіюємо decorative glass |
| [Apple Maps route overview/list](https://support.apple.com/en-eg/guide/iphone/iph1b3553719/ios) | Довідка; PARTIAL | Overview і список поворотів як представлення маршруту | Карта+timeline одного itinerary; точний конкурентний preview/Go не досліджений |
| [Google Design for Driving](https://developers.google.com/cars/design/design-foundations/interaction-principles) | HMI-настанова; текст | Glanceability, interrupt/resume, не відволікати нерелевантним рухом | Стабільний navigation header; не переносимо автомобільні обмеження на весь passenger PWA |
| [Material3 States](https://m3.material.io/foundations/interaction/states) | Настанова; PARTIAL | Послідовні стани і більше одного visual indicator | Check+surface для multiselect; focus відмінний від selected |
| [Fluent2 Motion](https://fluent2.microsoft.design/motion) | Настанова; текст | Motion підтримує функцію й ієрархію, можливий no-motion | Не запускати entrance sheet/card/camera одночасно без причини |
| [Citymapper multimodal cabs+transit](https://citymapper.com/news/1240/combining-public-transit-with-cabs) | Продуктовий опис; PARTIAL | Комбінований маршрут з різних режимів | Route ribbon і точки пересадки; жодних запозичених рекламних цифр економії |
| [Uber price explanation](https://help.uber.com/riders/article/how-are-fares-calculated/?nodeId=d2d43bbc-f4bb-4882-b8bb-4bd8acf03a9d) | Довідка; текст | Ціна до замовлення, зміна умов може змінити суму | Estimate/confirmed і fee breakdown до booking; не обіцяти тариф конкурента |
| [Bolt price estimate](https://bolt.eu/en/support/articles/115002917754/) | Довідка; текст | Estimate залежить від маршруту/часу/умов | Невизначеність показується поруч із сумою; unknown≠zero |
| [Waze toll estimates](https://support.google.com/waze/answer/9370512?hl=en) | Довідка; PARTIAL | Оцінка зборів не замінює тариф оператора | Data provenance та застосовність; не приховувати збори |
| [BMW Panoramic iDrive](https://www.bmwgroup.com/en/news/general/2025/newidrive.html) | Маркетинговий анонс07.01.2025; текст | Потрібна інформація у потрібний момент/місце | Contextual route strip; не cockpit-стилізація і не доказ безпечності |
| [WCAG2.2](https://www.w3.org/TR/WCAG22/) | Стандарт; PARTIAL витяг | AA target24px з винятками, AAA44px з винятками | MARSHGO44px — власна вища підлога; AA не обмежується targets |
| [W3C Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) | Пояснення AA; текст | Drag-функції мають single-pointer альтернативу | Sheet expand/collapse та preview step buttons; keyboard alone не замінює pointer alternative |

Це desk research, не фактичні usability-тести Apple/Google/Tesla/Bolt. Окремого перевіреного Tesla/MBUX сценарію немає; automotive reference обмежено Google HMI та BMW. Порівняння швидкості/безпеки конкурентів не заявляється.

## 5. Реальна технологія проти експерименту

**Використати наявне:** React/Vite/Tailwind, CSS tokens і transitions, MapLibre adapter, routeCameraController, hyperFlightEngine, FlightTelemetry native range, existing route components, themeService. Motion dependency вже є у package.json; це не причина вводити ще одну бібліотеку або мігрувати всі transitions.

**Реалізувати після gates:** shared playback controller без GPS, synchronized route ribbon, modal focus handling, restrained light/dark mode tokens, responsive desktop form, honest transaction/data statuses.

**Не включати у release scope:** декоративні3Dбудівлі без geometry/feed; VR/AR; AI-predicted safety; фальшиві live vehicles; shader-heavy blur; autoplay на кожному маршруті; цінові/часові «оптимізації» без engine даних.

## 6. Критерій творчого успіху

Скрін без логотипа все одно впізнається за маршрутною стрічкою, узгодженою картою й спокійною ієрархією. Людина може знайти шлях, зрозуміти пересадку й відрізнити перегляд від реальної навігації без пояснення. Це **ціль**, яка ще потребує after screenshots, task-based usability і вимірів, а не вже досягнутий результат.
