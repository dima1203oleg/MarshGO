# MARSHGO UI reference matrix

Візуальні референси: фото, прикріплені до запиту 13.10.2026, збережені у Site. Схожі фото 2–7 побайтно збігаються з попередніми hash-locked еталонами Site; новими є фото 1 і фото 8.

Остання канонічна серія користувача — шість екранів: Фото 1–3 показують результати в світлій і темній темах та каталог 12 режимів; Фото 4 — повний ланцюжок на карті зі згорнутою панеллю; Фото 5 — картки сегментів; Фото 6 — розгорнуті зупинки. Для вебприймання порівнюється crop самого інтерфейсу на однаковому viewport: рамка телефона, статусбар iOS і зовнішній аркуш із підписами не є частиною вебекрана.

| Референс / зона | App route / component | Стан | Тема | API / дані | Visual test | Статус |
|---|---|---|---|---|---|---|
| Фото 1.1 · Огляд карти | Home / ProductionNavigation + MarshGoMap | idle/map overview | Light | Places + MapLibre styles; карта без вигаданого маршруту | Не має окремого reference-matched golden | PARTIAL |
| Фото 1.2 · Вибір маршруту | Navigation / ProductionNavigation | route preview до старту сесії | Light | Server routing route geometry | E2E проходить через справжню navigation session; потрібен скриншот екрана вибору маршруту | PARTIAL |
| Фото 1.3 · Активна навігація | Navigation / ProductionNavigation + NavigationCore | maneuver HUD, ETA, GPS, reroute | Light | Navigation session, GPS fix, maneuvers, MapLibre | `navigation-light-route.png` — локальний regression snapshot; live basemap і pixel acceptance заблоковані provider-ом | PARTIAL |
| Фото 1.4 · Шари карти | Navigation / MapLayersControl `variant="navigation"` | відкрита панель шарів | Light | Наявні transport layer API; недоступний layer має показувати provider state | `navigation-light-layers.png` — локальний regression snapshot | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 2 · Розгорнуті деталі | Search results → JourneyRouteMapScreen | expanded; список зупинок; вибір сегмента підсвічує лінію і кадрує її shape | Dark | POST journeys/search; вибраний Journey/GTFS stop calls | `journey-route-details-dark-expanded.png` + bus/tram/metro color, focus і camera-zoom assertions | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 3 · Основна панель маршруту | Search results → JourneyRouteMapScreen | half; сегментні картки й зупинки згорнуті; mode color спільний із картою | Dark | POST journeys/search | `journey-route-map-dark-half.png` + segment selection/focus assertions | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 4 · Огляд маршруту | Search results → JourneyRouteMapScreen | collapsed map, повна геометрія, короткий summary | Dark | Journey legs із реальною routeGeometry | `journey-route-map-dark-collapsed.png` + map state assertions | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 5 · Результати | Search → JourneyResultsPanel | список компактних карток, 3 стратегії | Dark | POST /api/v1/journeys/search | `journey-results-dark.png` + CSS/behavior assertions | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 6 зліва · Результати | Search → JourneyResultsPanel | картки та strategy controls | Light | POST /api/v1/journeys/search | `journey-results-light.png` | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 6 по центру · Результати | Search → JourneyResultsPanel | ті самі картки | Dark | POST /api/v1/journeys/search | `journey-results-dark.png` | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 6 справа · Каталог режимів | Search / TransportTypesPanel + transport registry | 12 canonical modes, піктограми й назви | Light | Каталог режимів; доступність окремо від показу в легенді | Registry unit tests; screenshot golden ще відсутній | PARTIAL |
| Фото 7 зліва · Найкращий маршрут | Search → JourneyResultsPanel | перша картка виділена, сегменти по часу | Light | Server ranks, times, fares, legs | `journey-results-light.png` + data assertions | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 7 справа · Піктограми | TransportTypesPanel / results legend | весь каталог та legend | Light | Спільний registry містить labels, іконки, кольори і map line styles | Registry unit tests; screenshot golden ще відсутній | PARTIAL |
| Фото 8 зліва · Results light | Search → JourneyResultsPanel | compact results | Light | POST /api/v1/journeys/search | `journey-results-light.png` | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 8 центр · Results dark | Search → JourneyResultsPanel | compact results | Dark | POST /api/v1/journeys/search | `journey-results-dark.png` | IMPLEMENTED, VISUAL ACCEPTANCE PENDING |
| Фото 8 справа · Іконки та дії | JourneyResultsPanel + shared transport registry | strategy, transfers, favorite, open details, mode legend | Light/Dark | Journey response; local favorite є лише UI preference | Behavior assertions + registry unit tests; окремий catalog golden ще відсутній | PARTIAL |

## Тестовий контракт для приймання

У Playwright використовуються фіксований iPhone portrait viewport 402×852, locale uk-UA, timezone Europe/Kyiv, детермінований маршрут і screenshot assertion без анімації. Перевіряється, що до чотирьох сегментів повністю вміщуються у картку, а довші ланцюжки мають керовану прокрутку. CSS-геометрія заголовка, перемикача стратегії, першої картки й маршрутної панелі порівнюється між темами для напіввідкритого та згорнутого станів.

Вибір автобуса, трамвая й метро перевіряє канонічний колір, активний segment ID, збільшення масштабу та проєкцію всіх точок сегмента в незакриту область карти над нижньою панеллю. Відступ карти враховує фактичну висоту панелі. Metro тут є лише fixture типу даних, а не твердженням, що він є у Lviv feed. Проміжні зупинки й часи перевіряються окремо. Для золотих скриншотів використовуються локальні deterministic map tiles, без live зовнішнього провайдера.

Поточні snapshots захищають реалізацію від регресій; вони ще не є доказом pixel-відповідності фото. Для числового pixel-diff потрібні crop-и екранів з однаковим viewport і узгодженим контентом карти, а в наданих референсах карта, масштаб і системні рамки відрізняються від тестового вебрендеру. Тому візуальна тотожність «один в один» ще не підтверджена.

Обов'язкові goldens: results-light, results-dark, route-map-light-half, route-map-dark-half, route-map-light-collapsed, route-map-dark-collapsed, route-detail-dark-expanded, navigation-light-idle, navigation-light-route, navigation-light-active, navigation-light-layers. Це окремо від функціональних E2E з реальним API/provider contract.

Прогрес для кожного golden фіксувати окремо: версія еталона, viewport, commit SHA, diff threshold, результат і зауваження. Hash перевірка source image не є доказом pixel-відповідності UI.
