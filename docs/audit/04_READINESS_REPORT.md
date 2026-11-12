# Оцінка готовності MARSHGO

Дата: 12.10.2026. Це проміжна оцінка на основі перевірених гілок, локальних тестів та GitHub CI; вона не замінює staging acceptance.

## Методика

Оцінено 10 робочих напрямів по п’яти representative gates на напрям (усього 50). Гейт зараховується лише за наявності відповідного коду та перевірюваного доказу; невідоме або неперевірене не зараховується.

- **Код** — реалізація існує та підключена до відповідного runtime.
- **Інтеграція** — контракт/API/БД/платформа реально взаємодіють у виконаній перевірці.
- **Автотести** — відповідні перевірки виконалися; невдалий E2E не зараховується.
- **Стадійне приймання** — конкретний сценарій перевірений на staging із реальним сервісом/даними. CI не прирівнюється до staging.

Кодова готовність: 0.4 × код + 0.3 × інтеграція + 0.3 × автотести, де кожна частка — підтверджені gates / 50.

Production readiness — окремі 7 release gates однакової ваги: production deployment/config, перевірені реальні зовнішні інтеграції та права, повністю зелений критичний end-to-end сценарій, migration upgrade rehearsal, backup/restore + monitoring/load, фізичне iOS/GPS/push приймання, відсутність відомих critical security alerts/exposed credentials. 1 підтверджений gate / 7 = 14.3%.

Кількість gates — однаковий контрольний набір для порівняння напрямів, не твердження, що повний перелік вимог цього ТЗ містить лише 50 пунктів. Де модульно детальніший аудит або staging відсутні, відсоток є консервативним і має переглядатися з кожним доказом.

## Розбивка

| Напрям | Код / 5 | Інтеграція / 5 | Автотести / 5 | Staging / 5 | Перевірений доказ і головний залишок |
|---|---:|---:|---:|---:|---|
| Backend | 4 | 3 | 3 | 0 | Server API/DB/Redis проходить unit та PostGIS/Redis CI; production SMS/object storage/payment/service deployment не прийняті. |
| Frontend | 4 | 3 | 3 | 0 | Site typecheck/lint/build та 60 тестів пройшли; root cross-repo E2E run мав 6/12 невдалих сценаріїв; pixel diff ще не проведений. |
| Journey Engine | 4 | 4 | 4 | 0 | GTFS timetable/RT, multi-leg composition, transfer checks і corridor matching мають CI; реальне національне покриття/тарифи не доведені. |
| Карти та GPS | 3 | 3 | 3 | 0 | MapLibre, road route та foreground navigation мають локальні/CI сценарії; root GPS browser flows потребують зеленого rerun, фонова iOS геолокація не прийнята. |
| Попутки | 4 | 4 | 4 | 0 | Corridor PostGIS search, inventory/date constraints та rescue alternatives покриті target tests; загальний двокористувацький E2E був timeout. |
| Бронювання та переговори | 4 | 3 | 3 | 0 | Ідемпотентні booking/proposal/chat/lifecycle шляхи є й мають API/unit coverage; довгий marketplace E2E не пройшов у поточному root run. |
| Зовнішній транспорт | 2 | 1 | 1 | 0 | Є GTFS/GTFS-RT адаптери й registry; конкретні комерційні інтеграції/права/credentials, широка жива feed-мережа відсутні або не підтверджені. |
| iOS | 4 | 3 | 3 | 0 | Capacitor/Xcode simulator CI пройшов із точним Site SHA; device, APNs, background GPS, signing/TestFlight ще не пройшли польове приймання. |
| Безпека | 4 | 2 | 3 | 0 | GitHub Secret Scanning/Code Scanning без alerts; local Gitleaks збіги підтверджено як документаційні false positives; penetration/privacy acceptance відсутні. |
| Production інфраструктура | 3 | 2 | 3 | 0 | CI міграції, Docker build і release materialization перевірені; немає production/staging deploy, restore drill, alerting або навантажувальних замірів. |
| **Разом** | **36 / 50** | **28 / 50** | **30 / 50** | **0 / 50** | **Кодовий розрахунок нижче.** |

## Результат

- **Кодова готовність: 63.6%** = 0.4×72% + 0.3×56% + 0.3×60%. Це оцінка representative scope, а не сумарна кількість рядків чи файлів.
- **Production readiness: 14.3%** = 1/7 release gates. Підтверджений лише gate відсутності відомих critical GitHub security alerts та підтверджених exposed secrets; інші умови випуску не виконані.
- **Стадійно перевірені функції: 0/50 gates** за доступними на момент аудиту доказами. Наявність staging URL у старих нотатках не є доказом доступного staging; актуальна перевірка deployment не пройдена.
- **Cross-repo release candidate: NOT_RELEASED.** Release manifest фіксує Server 4e32ac3…, Site 570ea7b…, iOS d9a9c43…; Server та iOS exact-SHA CI успішні, але root E2E з попереднім Server pin мав 6 pass / 6 fail, новий rerun ще очікується.
- Ці відсотки будуть змінені після повного module-by-module аудиту й нових результатів CI/staging; зелена збірка сама собою балів production readiness не додає.

## Критичні блокери

1. Повторити root E2E на точних manifest SHA; дослідити traces, виправити реальні функціональні дефекти й дочекатися browser-compat.
2. Звірити legacy та Server migration histories (041, 043, 044), провести schema diff і upgrade rehearsal на ізольованій копії.
3. Підключити й перевірити легальні реальні transport/provider integrations або явно вимкнути їх у runtime registry.
4. Провести staging booking/Journey/Rescue smoke та restart/session recovery.
5. Перевірити backup restore, alerts, rate/resource budgets і навантаження з виміряними p95.
6. Перевірити фізичний iPhone: GPS permissions/background policy, APNs, deep links, мережеві стани та TestFlight signing.
7. Перенести release/E2E ownership із legacy та закрити module parity перед archive decision.

## До першого пілота

- Повністю зелений cross-repo E2E та browser-compat на exact SHA.
- Staging з реальними SMS credentials, перевіреним Server/Site, тестовими користувачами та журналом міграцій.
- Доведений driver/passenger booking/cancel/Rescue flow, API restart/session recovery та доступність підтримки.
- Реальні джерела обмежити лише підтвердженими провайдерами; показувати freshness, невідомі ціни й відсутність доступності без вигаданих даних.
- Протокол фізичного iPhone acceptance і privacy/location consent.

## До повного комерційного запуску

- Укласти/підтвердити provider, booking, SMS, payment та map data права й інтеграції.
- Завершити nationwide timetable/live-feed coverage і provider health/recovery.
- Закрити DB migration strategy, backup/restore, DR, security/privacy review, moderation/support та finance reconciliation.
- Провести навантажувальні/довготривалі тести й підтвердити SLO/p95 на реальній інфраструктурі.
- Підписати відтворювані Server/Site/iOS release artifacts та пройти device/TestFlight/App Store процес.
- Лише після міграції legacy dependencies повторно оцінити archive readiness; archive і production publish потребують окремого підтвердження власника.
