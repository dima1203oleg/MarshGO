# MARSHGO — «Лінія подорожі» design system

Version1 / 2026-11-14 / **SPECIFIED, NOT_IMPLEMENTED**.

Власник джерела — канонічний Site, `src/index.css`; dark/system — `src/services/theme.ts`. Не створювати другу Tailwind-конфігурацію або паралельний набір `theme-v2`. Наявні `--mg-*`, `--mode-*`, `--route-*` лишаються API для компонентів; значення оновлюються централізовано. Одиничний token потрібен лише якщо наявний не описує семантику.

## 1. Дизайн-філософія

1. Маршрут — головний зміст, interface chrome допомагає його читати.
2. Blue позначає дію/фокус, не кожну поверхню. Mode color пояснює транспорт, не тему сторінки.
3. Один локальний primary CTA; видимі secondary actions, без приховування необхідних можливостей.
4. Ієрархія = розмір/вага/відступ, не десятки відтінків і рамок.
5. Unknown, estimate, scheduled, live і confirmed — різні змістові стани.
6. Кожен pixel contract має keyboard/short-screen/reduced-motion варіант.

## 2. Семантична палітра

Нижче **цільові**, не вже внесені значення. Запис CSS — повний колір `--mg-canvas: hsl(214.3 46.7% 97.1%)`, щоб існуюче `var(--mg-canvas)` продовжило працювати. Не підставляти bare HSL-трійки в старі consumers. Не змішувати `hsl(var(...))` із повним color value.

| Token | Light HSL | Dark HSL | Призначення |
|---|---|---|---|
| `--mg-canvas` |214.3 46.7% 97.1%|211.6 51.4% 7.3%|Тло застосунку |
| `--mg-surface-primary` |0 0% 100%|210 50% 13.3%|Головна картка/форма |
| `--mg-surface-secondary` |212.3 44.8% 94.3%|210 45.8% 18.8%|Вкладена смислова група, не кожен рядок |
| `--mg-ink-primary` |215 47.4% 14.9%|210 62.5% 96.9%|Основний текст |
| `--mg-ink-secondary` / `--mg-ink-muted` |212.7 21% 41.2%|209.3 32.8% 74.3%|Допоміжний текст, без opacity поверх кольору |
| `--mg-action` |209.8 77.3% 39.8%|209.8 77.3% 39.8%|Фон CTA з білим текстом |
| `--mg-blue` |209.8 77.3% 39.8%|202.3 84.9% 71.4%|Іконки/лінії/large accent |
| `--mg-blue-ink` |209.8 77.3% 39.8%|202.3 84.9% 71.4%|Малий accent text на surface/tint |
| `--mg-blue-tint` |208.8 75.8% 93.5%|205.4 59.6% 19.4%|Selected background |
| `--mg-border-medium` |210 18.1% 50.2%|207.6 22.7% 56.9%|Функціональна межа control, не суцільна обводка сторінки |

`--mg-border-subtle`/`--mg-line`: декоративний divider, достатньо ink-primary12% на відповідній opaque surface. Не використовувати такий divider як єдину функціональну межу input. `--mg-surface-glass`: лише тонкий nav/toolbar chrome з opaque fallback; не довгі абзаци або forms поверх рухомої карти. `--route-*` лишаються scoped: спершу явно зіставити sheet/card/ink/map-label surfaces, не глобальний remap усіх route кольорів.

Semantic success/warning/error — з чинних tokens після перевірки контрасту. Warning не перетворюється на success через dark theme. Не вводити нові кольори для кожного статусу.

### Розрахований контраст палітри

Легкий Node-розрахунок sRGB relative luminance,2026-11-14; вхідні еквіваленти палітри до округлення HSL. **Це не computed-style WCAG PASS.** Після реалізації перевірити rounding, opacity, реальні фони та всі стани.

| Пара | Light | Dark |
|---|---:|---:|
| Primary ink / primary surface |15.82:1|14.98:1|
| Muted ink / primary surface |5.81:1|8.44:1|
| Muted ink / secondary surface |5.06:1|7.05:1|
| White / action |5.84:1|5.84:1|
| Blue-ink / blue-tint |5.00:1|6.69:1|
| Functional border / primary surface |4.09:1|5.04:1|

## 3. Transport tokens

Усі12режимів використовують наявний registry та різні SVG. Не міняти ID/порядок канонічного catalog; відображення в compact panel не переписує taxonomy. `walk` — leg, не13категорія; `all` — стан вибору.

Кольори застосовуються до stroke/іконки/segment accent, не до всієї12-плиткової дошки. Текстові labels лишаються ink-primary. Колір ніколи не є єдиним ідентифікатором.

| Mode / token `--mode-*` | Light HSL | Dark HSL | Контраст на primary surface L/D |
|---|---|---|---|
| bus |209.8 77.3% 39.8%|208.9 95.6% 73.1%|5.84 / 8.07|
| marshrutka |39.9 100% 29.2%|42.8 76.3% 66.9%|5.17 / 9.86|
| trolleybus |172.2 65.7% 27.5%|168.6 50.8% 63.3%|5.62 / 8.91|
| tram |10.1 48.9% 42.9%|11.5 83.9% 78%|5.84 / 8.55|
| metro |264.7 35.4% 49.8%|263.8 64.6% 77.8%|5.85 / 7.37|
| carpool |137.7 34.9% 34.3%|135.5 42.9% 69.8%|5.43 / 9.26|
| taxi |45.9 74.5% 29.2%|47.1 67.1% 70.2%|5.33 / 10.53|
| train |227 38.7% 46.7%|225.2 68.3% 80.2%|6.19 / 8.51|
| bike |92.7 51% 29.6%|84.5 41.5% 66.5%|5.66 / 9.17|
| scooter |190.2 69.7% 29.8%|191.9 59.5% 70%|5.79 / 9.15|
| carsharing |209.2 18.5% 41.4%|208.3 28.6% 75.3%|5.59 / 8.73|
| transfer |324.8 20.5% 43.9%|321.7 37.6% 75.5%|5.66 / 8.01|

На карті контраст цих ліній із тайлами **ще не виміряний**. Використати наявну casing/halo лінію та перевірити обидва basemaps. Walk — нейтральний dashed path, transfer — вузол із label, unavailable — patterned/neutral з текстом. Не підфарбовувати непідтверджений live marker як live.

## 4. Типографіка

Без нового font download: системний stack Site. Variable webfont додавати лише після доказу потреби/ліцензії/впливу на завантаження.

| Роль | Size / line-height px | Weight | Обмеження |
|---|---|---|---|
| Page display mobile |28 / 32|750–800|Search може24/30; не займати третину viewport |
| Page display desktop |32 / 38|750–800|Не гігантський landing hero у робочій формі |
| Section |20 / 26|700|Один заголовок на смислову групу |
| Main value/ETA |24 / 28|750|tabular-nums; unknown = «—» |
| Body / input |16 / 24|400–600|Input не менше16px для iOS zoom |
| Label |14 / 20|600|Persistent, не лише placeholder |
| Metadata / transport tile |12 / 16|500–650|Абсолютна підлога; без text10/11 |

Адреси/зупинки можуть переноситися на2рядки; повна назва доступна screen reader. Не ellipsis для єдиної ціни/часу/помилки. CTA labels не обрізати. Зменшення letter-spacing не замінює достатню ширину компонента. Підтримати zoom200% і text scaling без втрати дій.

## 5. Геометрія й elevation

- Registry spacing:4,8,12,16,24,32,48px; safe-area додається через env, не hardcoded device padding.
- Radius: field/control12px, card20px, sheet28px, small badge8px, pill тільки для короткого status/segmented selection. Використати чинні radius tokens, не literals у feature JSX.
- Touch floor44×44 CSSpx; primary action48px; map controls48px (чинний shared component). Візуальний grabber може бути4px, його кнопка-hit area44px.
- Mobile content padding16px;320px допускає12px за умови12labels fit. Inner card padding12–16px. Наявний narrow-grid fit не ламати загальним override.
- Elevation:0 — звичайні cards;1 — sticky action/nav;2 — modal sheet. Не тінь на кожну transport tile. Нові shadow values лише у token registry.
- Global nav height/content reservation: фактична висота +safe-area; scrolling content має matching bottom padding. Modal overlay ставить nav поза focus/pointer interaction, не бореться з нею z-index хаками.

## 6. Responsive composition

| Діапазон | Search / results | Map / sheet |
|---|---|---|
|320–479|Single column;4×3 modes; short page heading; vertical scroll allowed|Full viewport map,4detents, readable overlay;44targets|
|480–767|Single comfortable column, не розтягувати дрібні controls|Та сама interaction model|
|768–1023|Content до768px,4×3 modes; pair field groups where fit|Map широка, sheet readable max width без phone frame|
|≥1024|Content до1200px; Search two regions route/time + transport/preferences; modes6×2 якщо доступно≥600px, інакше4×3; no8+4|Map + docked detail region360–440px; одна карта, details не закривають route bounds|
|Landscape height≤480|Не примушувати все вміститися; compact sticky summary і scroll|Collapsed/half default, action+expand доступні; keyboard не приховує confirm|

Точні6-column умови прив'язати до доступної ширини panel (container query за підтримки чинної збірки), не лише viewport. Mobile4×3 не змінюється. Не вводити інший router чи card model для desktop.

## 7. Компонентна архітектура

| Власник | Що повторно використати / вдосконалити | Не робити |
|---|---|---|
| `TransportTypesPanel` + registry | IconTile states, однаково12icons | Новий паралельний catalog |
| `CanonicalRouteLip` | Route summary time/price/actions | Копіювати JSX у кожну Trips card |
| `JourneySegmentStrip` | Фірмова route ribbon, selected/unknown semantics | Новий strip із власною геометрією/кольорами |
| `StatusBadge` | live/scheduled/stale/unavailable як text+icon | Raw tone colors або invented quality |
| `MapInteractionControls` | Існуючі48px labels і controls | Дублювати floating buttons у screen |
| `FlightTelemetry` | Один slider і playback controls | Другий progress/seek slider |
| Existing modal implementations | Спільні focus trap/Escape/restore/inert behavior після точкового extraction | Додавати ще одну UI-бібліотеку заради одного dialog |
| Search / publication route fields | Спільна presentation після parity перевірки handlers | Об'єднувати різні API contracts у універсальний form-engine |

Межі extraction невеликі: JSX presentation без зміни server DTO; pure helpers для state/formatter. Нові hooks допустимі для реального reuse playback, не абстракцій «на майбутнє». Dirty helpers sensory/magnetic/ownership перевірити на самодостатність commit до рефакторингу.

## 8. Route ribbon contract

- Leg order тільки з itinerary; icon + route number/name + transfer node. Один selected leg index синхронізує карту/timeline/preview.
- За валідних durations пропорції можуть відображати час із readable minimum; accessible text зберігає реальні значення. Інакше однакова схематична ширина, не вигаданий час.
- Багато legs → wrapping/detail expansion, не приховане горизонтальне гортання транспортних категорій. Ribbon і category grid — різні компоненти.
- Active state: border/weight/check; не лише зміна hue. Unknown leg не «виправляється» приємною іконкою.

## 9. A11y та copy

WCAG2.2AA — ціль повного acceptance: contrast4.5normal/3large,3nontext, keyboard, names/roles/states, focus not obscured, errors, reflow, dragging alternative.44px — окрема продуктова підлога, не твердження про мінімум AA.

Copy examples: «Перегляд · не GPS», «Показати моє місце», «Навігацію призупинено», «Дані тимчасово недоступні», «За розкладом», «Орієнтовна вартість», «Результат бронювання поки невідомий. Перевірте Поїздки». Не показувати «Безпечно зупинено», «Бронювання перевірено» без доказу або універсальний transit-MarshPass.

## 10. Assets

Reuse наявного brand mark, унікальних Lucide/custom transport SVG і Home road imagery. Не підмінювати реальну карту generated image. Нові декоративні hero assets не потрібні для Search/Route; Home asset змінюється тільки з явною потребою, перевіреним crop/alt/ліцензією. Жодних нових remote-font/image залежностей у початковому batch.

## 11. Gate впровадження

Усі tokens спочатку в registry, потім components. Кожен batch: focused type/lint/test, rendered same-state before/after у Qoder через7777/zrok. Візуальна й функціональна прийнятність, contrast у фактичних backgrounds, responsive, reduced motion, no console regression. До цього таблиці вище — специфікація, не production-ready design system.
