---
name: marshgo-product-knowledge
description: Canonical MARSHGO product decisions — transport taxonomy, information architecture, MarshPass rules and design invariants with their source-of-truth files. Use before changing IA, transport categories, or any owner-approved screen hierarchy.
---

# MARSHGO Product Knowledge

Правило: канонічна IA ієрархія змінюється **лише окремим рішенням власника**. Якщо завдання «поліпшити дизайн» — полотно (відступи, контраст, типографіка, reachability) поліпшуємо, ієрархію й навігацію не чіпаємо.

## Джерела істини (читати, а не пам'ятати)
- Таксономія транспорту: `docs/CANONICAL_12_TRANSPORTS_SPEC.md` — статус APPROVED, затверджено 2026-10-10.
- Реалізація категорій: `MarshGO-Site/src/domain/transportCatalog.ts:11-22` — `bus, marshrutka, trolleybus, tram, metro, carpool, taxi, train, bike, scooter, carsharing, transfer` з групами (Громадський транспорт / Спільні поїздки / Залізниця / Мікромобільність).
- Візуальний канон: `MarshGO-Site/docs/design/canonical/README.md` (дві дошки, light і dark, SHA-256 перевіряє `tests/canonical-design.test.ts`); для карти/шторки — `docs/design/canonical/route-map-bottom-sheet/`, для результатів пошуку — `journey-search-results/` (вони **мають перевагу** над загальними дошками для цих екранів).
- MarshPass: `MarshGO-Site/src/domain/marshPass.ts`.
- Життєвий цикл попутки: `MarshGO-Site/src/domain/rideshareLifecycleMachine.ts` (дема-значення в ньому позначені `(DEMO)` — мітку не знімати).

## Затверджені рішення
- Рівно **12 користувацьких категорій**, порядок і ID — як у спеці. `walk` — не тринадцятий транспорт, а внутрішній leg першої/останньої милі та пересадок; `all` («Усі») — стан вибору, а не транспорт; legacy-ідентифікатори (`suburban_train`, `city_train`, `intercity_bus`, `ebike`, `moped`, `car_rental`, `funicular`, `plane`, `ferry`) **не** породжують додаткових основних кнопок.
- Один A→B пошук, один Journey Engine, один формат результатів, одна спільна карта (MapLibre). Доступність категорії визначає **серверний реєстр за містом і провайдерами**, а не hardcoded-список в UI — тому «метро немає у Львові» треба перевіряти реєстром, а не зашивати в компонент.
- Нижня навігація — 5 пунктів із центральним create-дією; Головна — 4 швидкі дії у двох-стовпцевій сітці квадратних тайлів.
- Карта й покрокові деталі маршруту = **о один синхронізований екран** із перетягуваною нижньою шторкою; карта лишається позаду шторки в обох темах.
- Один транспорт = один колір у картках маршруту, таймлайні й на карті одночасно (`--mode-*` у `MarshGO-Site/src/index.css:19-30`).
- MarshPass — **лише** для підтвердженої приватної поїздки MARSHGO (попутка). Квитки громадського транспорту та збережені мультимодальні маршрути не підходять.
- Світла дошка = primary geometry reference; темна = той самий набір поверхонь у graphite/navy з electric-blue акцентом.
- Короткі екрани: квадратні дії Головної зберігаємо, а **вміст Головної скролимо**, щоб усі дії лишалися доступними (`canonical/README.md:32`) — не зменшувати тайли під 320×568.
- Преміум-підлога: 44×44 px touch targets і підлога типографіки 12 px. На гілці `qoder/v41-ui-20261101` (HEAD 13a1106) це тримають тести `MarshGO-Site/tests/canonical-design.test.ts:84` («route sheet actions keep the 44 px touch-target floor») і `tests/v41-contrast.test.ts`. Тесту `tests/premium-mobile-ergonomics.test.ts` на цій гілці **немає** — його додає відкритий PR #46 (`qoder/premium-8-mobile-1`); посилатися на нього можна лише після мерджу.

## Конфлікти, які потрібно узгоджувати з власником (не «виправляти» мовчки)
1. **Мітки нижньої навігації.** У постановках завдань іноді перелік «Головна · Пошук · + · Поїздки · Профіль»; у ship-коді `MarshGO-Site/src/components/BottomNav.tsx:20-74` — «Пошук (веде на `home`) · Заявки (`demand-new`/`driver-requests`) · + · Поїздки (`trips`) · Профіль/Водій». Структура збігається (5 + центральна дія), лейбли — ні. Код = поточна істина до окремого рішення.
2. **Порядок категорій.** Раніше зустрічався перелік, де Попутка йде першою. Затверджена спека і `transportCatalog.ts` ставлять `bus` першим, а `carpool` — шостим. Не реордерити каталог під цитату з завдання.
3. **Ролі.** Останній таб перемикається між `Профіль` і `Водій` за `isDriver`; «Заявки» теж змінює ціль. UX-тести мають покривати обидва стани.

## Обмеження
- Не вигадувати бізнес-правила (ціна, availability, статуси поїздки) — їх бере сервер і затверджені документи; за відсутності джерела позначати припущення.
- Копія в інтерфейсі — людська українська, без технічного шуму (зафіксовано в історії PREMIUM-8 CP3).
