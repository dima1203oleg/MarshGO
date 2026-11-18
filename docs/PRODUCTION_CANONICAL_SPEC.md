# MARSHGO production canonical spec

Дата аудиту: 13.10.2026. Документ закріплює ролі репозиторіїв, межі даних і дизайн-контракт для міграції без переписування наявної системи.

## Єдині джерела правди

| Репозиторій | Канонічна роль | Правило |
|---|---|---|
| MarshGO-Site | Production frontend і спільний UI для PWA та iOS | Усі production екрани й UI-контракти живуть тут. React/Vite/TypeScript і MapLibre залишаються основою. |
| MarshGO-Server | Backend, API та доменні дані | Бронювання, місця, ціна, статуси, пропозиції, чат, Journey і навігаційні сесії є серверною істиною. |
| MarshGO-iOS | Native Capacitor shell | Вбудовує MarshGO-Site; native дозволи, статусбар, камера, push і release конфігурація належать сюди. |
| MarshGO2 | Design lab | Використовувати як UX-референс. Не переносити звідти demo data, симуляції GPS або GTFS-RT у production runtime. Робочі незакомічені зміни цього checkout збережені. |
| MarshGO | Integration та історичний репозиторій | Використовувати перевірені тести, контракти й поведінку під час конвергенції; не створювати тут другу production UI. |

Робочі гілки під час цього аудиту не є синхронними з віддаленим main. До них не застосовувати автоматичний merge/reset: спершу рев'ювати зміни та фіксувати точні SHA в release manifest.

## Продуктовий шлях

Канонічний пасажирський маршрут:

Home → Search → Journey Results → Route Map і синхронні Route Details → Booking → MarshPass → Live Navigation → Completion.

Основні переходи зберігають пошуковий запит, вибраний маршрут і тему. Повернення з карти до результатів не очищає результати. Карта й деталі маршруту є одним екраном із snap points collapsed, half та expanded.

Паралельні server-backed шляхи:

- Home → Publish trip → Driver offer → Requests → Booking.
- Home → Messages → Conversation.
- Home → Trips → Journey або підтверджений MarshPass.
- Home → Profile → Vehicle, verification та theme.
- Navigation → Driver matching лише за актуальної GPS-позиції, належної згоди та серверного стану.

## Візуальна істина

Фото з цього запиту збережені у [папці референсів](../MarshGO-Site/docs/design/canonical/task-2026-10-13/README.md). Вони доповнюють раніше затверджені, hash-locked дошки Site:

- Фото 1 задає чотири світлі стани точкової навігації: огляд карти, вибір маршруту, активний маневр і шари транспорту.
- Фото 2–4 є побайтно тими самими файлами, що фінальні темні еталони деталей маршруту в Site.
- Фото 5–7 повторюють hash-locked еталони результатів і маршрутних деталей.
- Фото 8 додає світло-темне порівняння карток і легенду режимів.

Фото задають компонування, ієрархію, геометрію та кольоровий напрям. Тексти зразків, міста, зупинки, тарифи, live-маркери й GPS-координати не є даними для production. Не використовувати фото як фон, iframe чи статичний екран.

Світла й темна тема використовують ті самі компоненти й структуру. Темна тема — шаруваний navy/graphite, світла — нейтральний canvas і білі поверхні. Кольори режимів, іконки й підписи мають походити з одного transport registry. Значення палітри зафіксувати один раз після візуального звіряння повного каталогу режимів.

## Архітектурні правила

- MapLibre лишається єдиним production map renderer. Маршрути малюються тільки з геометрії провайдера; відсутню геометрію не замінювати прямою.
- Кожен route leg показує режим, час, тривалість, тарифний стан і джерело, якщо він доступний. Невідомі тариф і відстань не перетворювати на нуль.
- Сервер залишається істиною для бронювань, місць, цін, статусів, повідомлень, vehicle verification та активної навігації.
- Realtime позначається live/recent/stale/unavailable за часом джерела. За відсутності або застаріванні feed не показувати LIVE.
- localStorage допускається для теми й нешкідливих UI налаштувань. Не використовувати його як істину для booking, wallet/pass, vehicle, conversation, proposal або inventory.
- Production-збірка не імпортує GPS/GTFS симуляції чи demo inventory з production entry graph.
- Background GPS для iOS є окремою native вимогою; foreground Capacitor Geolocation не підтверджує фонову роботу.

## Definition of Done

Екран готовий, коли він збігається з еталоном у фіксованому viewport; проходить світлу/темну тему, responsive та accessibility перевірки; використовує справжні server/API дані; має loading, empty, error, offline і provider-unavailable стани; зберігає навігаційний стан; має детермінований visual regression; а в production dependency graph немає прихованих симуляцій.

Production release додатково потребує реальних погоджених провайдерів, secrets у secret manager, staging acceptance, backup/restore drill, monitoring, підписаного iOS build і фізичного device acceptance. Детальний стан: [Gap analysis](./PRODUCTION_GAP_ANALYSIS.md), [Provider matrix](./PRODUCTION_PROVIDER_MATRIX.md), [Release checklist](./PRODUCTION_CHECKLIST.md).
