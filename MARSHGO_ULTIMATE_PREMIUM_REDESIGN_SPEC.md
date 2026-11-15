# MARSHGO — Ultimate Premium Redesign Specification

**Дата:** 2026-11-14. **Версія:**1.0, специфікація перед реалізацією. **Напрям:** «Лінія подорожі». **Продукт:** NOT_RELEASED.

**Фактичний статус:** специфікація сформована; новий redesign-код не внесений. Аудит джерел і доступних екранів виконаний із явно задокументованими прогалинами. Повний авторизований browser coverage і final acceptance **не отримані**. Реалізація захищеного UI заблокована відновленням сесії Qoder після refresh401; не обходити цей gate.

## 1. Нормативний пакет

Цей документ та шість додатків утворюють одне ТЗ. Детальні таблиці не дублюються, щоб не розходилися під час реалізації.

1. [Аудит фактичного стану](MARSHGO_DESIGN_AUDIT.md) — шість репозиторіїв, provenance,17findings, before evidence, invalid probes, limits.
2. [Три концепції та зовнішні джерела](MARSHGO_CREATIVE_CONCEPTS.md) — A/B/C, порівняння, обґрунтування гібриду,12офіційних посилань з типом і обмеженнями доступу.
3. [Дизайн-система](MARSHGO_DESIGN_SYSTEM.md) — цільові HSL tokens, typography, spacing, components, responsive/a11y.
4. [Motion, map та preview](MARSHGO_MOTION_SPEC.md) — state machine, один slider/map, ownership, detents, reduced-motion, performance gates.
5. [Реєстр екранів](MARSHGO_SCREEN_REDESIGN_MATRIX.md) —42функціональні області, кожна зі зміною, entrypoint, evidence level і acceptance.
6. [План реалізації](MARSHGO_REDESIGN_IMPLEMENTATION_PLAN.md) — preflight,10batches, конкретні файли/наявні tests, integration/rollback.

Пріоритет: безпека/чесність даних і остання постановка власника → продуктові інваріанти → це ТЗ → локальні visual рішення. Старі canonical screenshots лишаються історичним baseline; не змінювати їх і checksum, щоб «узаконити» новий вигляд. Це авторський вибір напряму в межах наданої творчої свободи, не твердження про фінальне приймання власником.

## 2. Продуктова мета та користувачі

Пасажир має знайти шлях A→B всіма релевантними способами, зрозуміти пересадки/час/вартість і відрізнити план від реальної навігації. Для попутки — перевірити пропозицію, свідомо підтвердити бронювання та отримати лише придатний приватний MarshPass. Водій — опублікувати поїздку, працювати із запитами й навігацією без втрати контролю/consent.

Преміальність = впевнена ієрархія, точні дані, передбачувані дії, короткий рух. Не = більше blur, менші підписи, прихована функціональність або фіктивна live telemetry.

## 3. Поточна архітектура й provenance

- Канонічний source: `/Users/dima1203/.qoder/worktrees/app/330dd3/MarshGO-Site`, branch `qoder/premium-ui-live-integration-20261114`, HEAD `b58cad91eddabbf89f016d438d446d36f169df87` **+ dirty tree**.
- Running UI: https://marshgo-dima.shares.zrok.io → єдиний Vite127.0.0.1:7777, PID4613. Не створювати нову збірку/сервер/демо для редизайну, не руйнувати zrok.
- Entry `src/main.tsx` → ProductionMarketplace; root orchestration `src/` застарілий і не редагується.
- React19/Vite8/TS6/Tailwind4, MapLibre, existing CSS motion і themeService; усі дані через чинний API.
- Server/iOS/Admin/Partner інвентаризовані source-only; не оголошувати їх перевіреними у браузері/на пристрої. Точні SHAs у AUDIT.
- До цього redesign уже був інтегрований playback/search package. Його існування не дорівнює кінцевому acceptance; dirty-tree869tests не сертифікують чистий b58cad9.

## 4. Ключові проблеми та пріоритет

| Пріоритет | Findings | Вплив | Рішення |
|---|---|---|---|
| P0 acceptance gate | A11 | Після перерваних auth refresh отримано401; protected UI недоступний; manifest errors | Відновити справжню сесію, окремо діагностувати, не обходити auth |
| P1 interaction | A01,A14,A17 | Preview залежить від GPS, ownership не охоплює всі camera controls, lifecycle ambiguity | Independent geometric playback, explicit owner, one slider,0preview side effects |
| P1 trust | A02,A08,A12,A13,A16 | Неправдиві/неузгоджені ticket/fare/booking/speed/live статуси | Чесні source-aware states; unknown≠zero/confirmed/safe |
| P1 accessibility | A07,A15 | Modal/footer/focus/keyboard gaps | Shared overlay semantics,44targets,focus restore,Kyiv time |
| P2 visual | A03,A04,A05,A06,A09,A10 | Desktop overscaling, noisy layers, token drift, duplicate affordances | Signature route ribbon, restrained tokens, meaningful grouping |

A08 fare/category mismatch — гіпотеза, не доведений дефект обчислення. A07 overlap — кандидат, потребує pointer/scroll probe. Ці позначки зберігаються у tickets/tests і не стають «виправленими» від переписування стилів.

## 5. Вибраний творчий напрям

**C: MARSHGO Signature Experience** дає route ribbon/spine, який зв'язує пошук, результат, карту, timeline і поїздки. **A: Refined Minimalism** визначає тиху surface/type/spacing ієрархію. **B: Premium Spatial Mobility** використовується тільки для осмисленої карти/preview, не як декоративний режим усіх екранів.

Детальна оцінка в CREATIVE_CONCEPTS: гібрид4.75/5 за суб'єктивною weighted rubric; це не empirical usability score. Зовнішні HIG/Fluent/Material/HMI принципи застосовані до interruptibility, visual states і glanceability; Uber/Bolt/Waze — до пояснення ціни/невизначеності; WCAG — до доступності. Не копіювати їх screens/branding і не рекламувати неперевірену перевагу MARSHGO.

## 6. Незмінні продуктові інваріанти

- П'ять глобальних пунктів: Головна / Пошук / + / Поїздки / Профіль. + = driver publication або passenger request. Чотири Home quick actions лишаються2×2square.
- Рівно12категорій із канонічного catalog: bus,marshrutka,trolleybus,tram,metro,carpool,taxi,train,bike,scooter,carsharing,transfer. `walk` внутрішній leg; `all` selection state. Не додавати legacy-ID як13кнопку.
- Mobile modes4×3, усі видимі, незалежний multiselect,12різних icons; автобус/трамвай/маршрутка розрізняються формою.
- Origin/destination мають поодній trailing дії clear або map-picker. GPS доступний у picker/навігації, не дублюється «парашутиком» у origin.
- Один A→B engine,3стратегії: Оптимальний / Найшвидший / Найдешевший. Results list first, карта при виборі route.
- Карта+деталі — один synchronized screen із draggable sheet; не створювати другу карту для playback.
- Availability/ціна/час/GPS/booking лише з actual contracts. Не hardcode доступність за містом, не zero fallback для unknown price/speed.
- MarshPass лише passenger confirmed/boarding booking приватної попутки; journey/driver не створюють квиток.
- Preview не змінює GPS, active trip store, booking або journey lifecycle. Manual camera interaction має пріоритет.

## 7. Візуальна система та layout

DESIGN_SYSTEM є нормативною таблицею значень. Семантичні ролі: світлий paper canvas/white surface, темний ink/navy; blue-action,blue-ink і blue-stroke не міняти місцями. Mode palette тільки як route/icon accents. Усі значення через existing tokens, не літерали у feature components.

Typography12/14/16/20/24/28–32; body/input16, metadata12floor. Spacing4/8/12/16/24/32/48. Controls44minimum/48primary, cards20radius, sheet28radius. Native font, без нового network asset.

Mobile — читабельна одна колонка, scroll дозволений. Desktop — повноцінне полотно до1200px з двома змістовими колонками Search, не рамка смартфона і не великий landing hero. Transport panel6×2 тільки за достатньої ширини; інакше4×3. Route desktop dock360–440px, одна карта. Детальні breakpoints та landscape правила в DESIGN_SYSTEM.

Розрахунок палітри: white/action5.84:1; primary text/surface15.82light,14.98dark. Реальні rendered backgrounds, opacity,focus/disabled/map contrast ще потребують вимірювання; числової відповідності всього UI не заявлено.

## 8. Компоненти та межі reuse

Залишити власників `TransportTypesPanel`, transport registry, `CanonicalRouteLip`, `JourneySegmentStrip`, `SavedJourneyCard`, `StatusBadge`, `MapInteractionControls`, `FlightTelemetry`. Вдосконалити їхню семантику/variants замість копіювання екранів.

Extraction допускається для реального спільного playback controller, modal focus behavior і presentation route field після перевірки parity handlers. Не новий form-framework, routing stack, animation library чи duplicate category registry. Dirty/untracked helpers спершу інвентаризувати в exact diff; не видаляти як «зайві».

## 9. Interaction architecture

### Пошук → маршрут

Home/Search → addresses → date/passengers/budget/modes → submit → pending → results3strategies → selected route map/sheet. Cancel/error зберігають inputs; outage не маскується empty. Back повертає існуючий query/context. Details timeline і map share selected leg.

### Preview → реальна навігація

На route-details дві різні за змістом дії: secondary «Переглянути маршрут» та primary «Розпочати навігацію». Preview відкриває existing telemetry і paused geometry без GPS. Play/seek не активують journey. GPS-start залишається явним permission/fresh-fix/server flow. GPS denied не блокує геометричний preview.

У preview одна видима мітка «Не GPS», один native range і play/pause/step. Числа прогресу — лише playback position. Після manual pan/zoom/pitch playback pause/user owner; explicit resume повертає camera. Перелік станів і acceptance у MOTION_SPEC.

### Публікація → бронювання → MarshPass

+ → тип публікації → form → validation → explicit submit → own item. Carpool result → factual offer → confirm trip/date/seats/price → server result. Підтверджений commit не скасовується через background refresh failure; timeout із невідомим outcome не оголошується успіхом або guaranteed failure. Ticket eligibility перевіряється і при відображенні, і при отриманні token.

### Profile / privacy / safety

Всі існуючі розділи лишаються. Sensitive/destructive actions не спрощуються до одного невидимого tap. Permissions/consent/OS grant розділяються. Dialog traps focus, topmost Escape, return-focus; no automatic upload/messages/booking у visual audit.

## 10. Map, sheet, live-data contract

Один MapLibre instance; route data оновлюється чинним adapter. Шторка має4detents, camera не слідує за кожним pixel drag. Padding frozen під час gesture/expand; explicit fit враховує видиму область. Поточний detent behavior перевірити targeted probe до зміни.

Рух на довгих100–500+км routes — distance-aware overview/zoom, slowdown біля transfer. Тільки valid geometry, no arbitrary turns, no fake terrain. Manual ownership перемагає. Стани live/scheduled/stale/unavailable видимі текстом і символом; coordinates preview не передаються у live fix/marker.

## 11. Екрани та стани

SCREEN_REDESIGN_MATRIX є повним реєстром42областей:24мінімальні області постановки плюс auth, providers/date, requests/proposals, safety/documents, notifications, overlays, shell/portals. Для кожної визначені KEEP/ENHANCE/REDESIGN/MERGE/SIMPLIFY, actual owner, конкретна зміна та verification states.

Наявність source inventory **не означає**, що42екрани відкриті у браузері. В audit table перелічено реальні V-стани; S/B залишаються source-only/blocked. Усі modified components перевіряти default/hover/focus/selected/disabled/loading/empty/error/success, reduced-motion,offline де релевантно.

## 12. Accessibility та performance

- WCAG2.2AA: semantics, labels, keyboard,contrast,reflow,focus-not-obscured,errors;44px — власна підлога понад AA target minimum.
- Sheet/range мають click/tap alternatives без dragging; keyboard підтримка не замінює single-pointer alternative.
- Reduced-motion вимикає autonomous camera fly/autoplay; manual seek доступний.
- Zoom200%, long Ukrainian addresses, short displays, virtual keyboard, safe areas, VoiceOver — реальні gates, не припущення.
- Не додавати long tasks>50ms у interaction path; measured baseline/after,p95frame intervals,memory trend,one map;60FPS без виміру не заявляти.
- Один важкий локальний процес на8GBMac. No extra server/build/browser; current public origin only.

## 13. Файли та послідовність реалізації

B1 tokens/primitives → B2global navigation/Home → B3Search → B4Results/ribbon → B5Map/sheet/modals → B6Preview/camera → B7Real navigation/live data → B8Trips/carpool/booking/ticket → B9Profile/chat/remaining → B10Integration/performance.

Точні paths, line evidence, існуючі tests та gates кожного batch — IMPLEMENTATION_PLAN. Критичні entrypoints: Marketplace568GPSstart,1174booking,1252ticket,2121search,2471route; JourneyActiveNavigation287GPS effect/474playback; FlightTelemetry26existing range. Лінії є baseline references і можуть зміститися після patch.

Сервер/API transport не переписувати заради дизайну. Business bug або missing payload відкривається як окремий bounded fix із contract evidence; не прикривати косметикою.

## 14. Acceptance matrix

| Gate | Умова завершення | Поточний статус |
|---|---|---|
| G0 Provenance | Clean/self-contained code snapshot або явно ідентифікований dirty diff, tracked deps | PARTIAL |
| G1 Baseline | Same-state before для кожної зміненої області | Search/кілька390станів VERIFIED; інші NOT_TESTED |
| G2 Design artifacts | Усі7docs saved до нових UI edits | Цей пакет сформовано до реалізації |
| G3 Search |12unique,4×3mobile, independent multi-select,one field action,actual search/back | Old grid verified; new design NOT_TESTED |
| G4 Map/preview |One map+slider,allmanualinterrupts,noGPS/lifecyclefrompreview | NOT_TESTED new implementation |
| G5 Booking/trust |Confirmed/rejected/unknown,correct ticket,real dates/fares | NOT_TESTED |
| G6 Accessibility |AA scan+manual keyboard/focus/VoiceOver,44floor,reduced-motion | NOT_TESTED |
| G7 Responsive |320/390/430/768/1280/1440 +844×390,light/dark,200%zoom | BaselineSearch14states; afterNOT_TESTED |
| G8 Performance |Actual timings/frame/long-task/memory comparison | NOT_TESTED |
| G9 Tests |Relevant behavior tests+negativecontrols,type/lint,fullintegration,build/bundle | Old869pass not transferable; newNOT_TESTED |
| G10 Live/device |Same zrok Qoder golden paths,realGPS,authorized booking context,iOSdevice | BLOCKED/PARTIAL |
| G11 Delivery |Scoped commit/PR evidence,remaining risks,no protected merge/deploy | NOT_DONE for redesign |

Не збільшувати thresholds/маски, щоб приховати регресію. Source regex корисний для contract guards, не заміна виконання поведінки. Порівнювати той самий route content, не різні fares/dates. Відхилені loading screenshots не включати у baseline count.

## 15. Ризики та запобігання

| Ризик | Захист |
|---|---|
| Dirty work від інших задач | Fresh narrow diff/ownership review перед кожним edit; no reset/clean/broad staging |
| Auth loss під час probe | Не batch full-navigation до auth completion; ручне відновлення сесії; no credential bypass |
| Shared token викликає широку регресію | Small batches,representative screens+themes одразу; route tokens scoped |
| Preview запускає GPS/lifecycle | Controller dependency boundary,spies0calls,negativecontrol |
| Camera бореться із жестом | Єдиний interrupt на всі manual commands,ownership tests+browser |
| CTA/footer за safe-area/nav |Viewport screenshot+DOM bounds+actual scroll/focus,not fullPage inference |
| Дизайн маскує API помилку |Data findings separate,unknown states,real payload provenance |
| Неможлива відтворюваність PR |Tracked dependency audit,exact SHA+diff,not dirty-tree tests as commit evidence |
| Performance на8GBMac |Oneheavyprocess,resource gates,no duplicate build,measured profile |
| Витік приватного screenshot |No tokens/QR/autofill in public artifacts;login shot private-only |

## 16. Вихід цього етапу та наступна дія

Специфікація містить дослідження, три концепції, вибір, системні tokens,42screen scopes,motion/map contracts,файли/тести/ризики. Вона збережена **до** нових UI edits. Це не заявка на завершення всього redesign.

Після відновлення користувацької сесії у тому самому Qoder браузері автоматично виконати preflight і B1; нове погодження концепції не потрібне. Зараз не починати неперевірювані правки захищених екранів, не піднімати alternate preview, не робити production deployment. Поточний статус залишається **NOT_RELEASED**.
