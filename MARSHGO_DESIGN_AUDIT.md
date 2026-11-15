# MARSHGO — Design audit

Дата: 2026-11-14. Статус продукту: **NOT_RELEASED**. Аудит: **PARTIAL**; візуальне приймання нового дизайну: **Inconclusive** — новий дизайн ще не реалізовано.

## 1. Межі та походження доказів

Це аудит фактичного Web/PWA, не макета. Єдиний вебконтур: https://marshgo-dima.shares.zrok.io → чинний Vite `127.0.0.1:7777`, PID 4613. Других серверів, збірок чи браузерів не запускали. Візуальний інструмент — вбудований браузер Qoder.

Живий Site: `/Users/dima1203/.qoder/worktrees/app/330dd3/MarshGO-Site`, `qoder/premium-ui-live-integration-20261114`, HEAD `b58cad91eddabbf89f016d438d446d36f169df87` **з незакоміченими змінами**. Скриншоти нижче характеризують це дерево, а не чистий коміт. Оркестрація: `ae5a62bd2a02785626fd0c45d691cf3a377aa5e1`, гілка `qoder/creative-redesign-discovery-20261114`.

Джерела: постановка власника «ULTIMATE CREATIVE REDESIGN MISSION 2026»; `MarshGO-Site/docs/design/canonical/README.md:23–35` і відкрита світла канонічна дошка; живі скриншоти; native Read вихідних файлів. Для нового дизайну постановка дозволяє зміну стилістики, але не бізнес-сценаріїв. Старі зображення/їхні checksum не змінюються. Indexed SearchWorkspace не покриває живий Site; це обмеження індексу, **не відсутність доступу до вихідного коду**.

Порівняння не є pixel-perfect QA: стара багатоскринна дошка та окремі поточні екрани не мають однакового viewport/контенту. Дошка використана як продуктова та композиційна база, не як джерело вигаданого відсотка збігу.

## 2. Інвентаризація шести репозиторіїв

| Репозиторій | Фактичний SHA / гілка | Стан на час discovery | Роль, межа перевірки |
|---|---|---|---|
| Site | `b58cad91eddabbf89f016d438d446d36f169df87`, `qoder/premium-ui-live-integration-20261114` | 70 dirty/untracked записів після попереднього інтеграційного коміту | Канонічний React 19/Vite 8/TS 6/Tailwind 4/MapLibre Web/PWA; головний об'єкт |
| Server | `e9934abbd8fc973177de8d7f47548739758a1b74`, `antigravity/ukraine-12-transports-multimodal` | 41 modified tracked + 24 untracked | Express/PostGIS/Redis/GTFS, journeys, availability, offers/demands/bookings, rendezvous, messages; source inventory, не backend acceptance |
| iOS | `4353cec3cacbaf662ceea047402f361024292b22`, `codex/production-site-sync-20261014` | clean | Capacitor 8.5.2/WKWebView; фізичний пристрій і parity bundle не перевірено |
| Admin | `d8afa64c4efda8ce4f10557a03651943effa52a7`, `main` | clean | React portal: partners, verification, providers, integrations, audit; браузер не запускався |
| Partner | `4d605d4353af281dd295fabf0c7c2ac05efe222e`, `main` | clean | Organization/application/onboarding, modes, integration settings; браузер не запускався |
| MarshGO | `ae5a62bd2a02785626fd0c45d691cf3a377aa5e1`, `qoder/creative-redesign-discovery-20261114` | Змінений checkpoint і нові докази | Оркестрація, acceptance, документація; кореневий `src/` заморожений і не є UI-ціллю |

Стани не є вічними гарантіями чистоти: перед записом/комітом потрібен свіжий status/diff. Admin/Partner README описують OTP, код — email/password; документація застаріла. Жодна захищена гілка не змінювалася під час discovery.

## 3. Фактична карта продукту

Production entry — `Site/src/main.tsx:1–25` → `ProductionMarketplace`, не legacy `App`. Router — `src/routing/productionRoutes.ts:1–85`: `/`, `/journeys/search`, `/trips`, `/messages`, `/profile`, `/demands/new`, `/demands`, `/demands/mine`, `/offers/new`, `/admin/verification`, `/navigate`, `/map`; entity routes offers/bookings/demands/journeys/messages.

П'ять глобальних дій: Головна / Пошук / + / Поїздки / Профіль. Пошук формує один A→B запит; результати мають три стратегії; карта й покрокові деталі — один екран. Home має чотири квадратні швидкі дії. MarshPass не є універсальним квитком міського транспорту.

ProductionMarketplace: search 2121, home 2166, results 2216, trips 2241, chat 2291, profile 2357, offer form 2382, demand form 2395, route screen 2471, dispatch 2507, overlays 2536–2549. Повний реєстр і конкретні дії — у `MARSHGO_SCREEN_REDESIGN_MATRIX.md`.

## 4. Перевірені браузерні стани

| Область | Фактичний доказ | Межа |
|---|---|---|
| Search | 12 різних SVG, незалежне вимкнення/увімкнення Автобуса без зміни Трамвая; по одній умовній кнопці у полях | Новий пошуковий запит цього етапу не виконувався |
| Responsive/themes | Сім viewport × дві теми, реальні кнопки Світла/Темна | Повний responsive coverage лише Search |
| Home | Чотири дії, промо MarshPass, популярні напрямки | Видача справжнього квитка не виконувалася |
| Create drawer | Швидкі дії, перехід до пасажирського запиту | Публікація не виконувалася |
| Passenger demand | Маршрут, часові межі, пасажири, бюджет, багаж/тварини/дитяче крісло, примітка | Submit не натискали |
| Trips | Майбутні — empty; Збережені — наявні маршрути, відкриття одного | Життєвий цикл бронювання не проходили |
| Saved route | Маршрут з чотирма legs, один canvas, карта/деталі, CTA початку навігації | Немає нового підтвердженого GPS-fix або запуску навігації |
| Profile/settings | Список розділів, settings, перемикання тем | Export/delete/logout не виконували |
| Map point picker | Dialog «Звідки», один canvas, кнопка Моє місцезнаходження; підтвердження disabled без точки; закриття працює | GPS і підтвердження точки не запускали |
| Date/time picker | Відкриття/закриття, Київ, вибрана дата, часові колеса | Зміни дати не застосовували |
| Providers | Усі секції, unavailable states, disclaimer велосипеда | Не доказ живої доступності всіх категорій |
| Messages | Empty «Чати», зрозуміла прив'язка до бронювання | Повідомлення не надсилали, реальної нитки немає |
| Welcome/login | Після 401 видимий welcome; кнопка на login працює; overflow X немає на 390 | Авторизацію автоматично не виконували; секретів не читали |

### Матриця Search (однакові результати у світлій і темній темах)

| Viewport | Колонки / кількість | Мінімальна ширина плитки CSS px | Обрізані підписи | Горизонтальний overflow |
|---|---:|---:|---:|---:|
| 320×568 | 4 / 12 | 69.15625 | 0 | ні |
| 390×844 | 4 / 12 | 76.453125 | 0 | ні |
| 430×932 | 4 / 12 | 86.453125 | 0 | ні |
| 768×1024 | 4 / 12 | 167.953125 | 0 | ні |
| 1280×800 | 8 / 12 | 131.53125 | 0 | ні |
| 1440×900 | 8 / 12 | 141.15625 | 0 | ні |
| 844×390 | 4 / 12 | 168.703125 | 0 | ні |

Знімки: `redesign-before-search-{light,dark}-{320,390,430,768,1280,1440,844}.png` поруч із документом. Вони full-page: fixed navigation, намальована на початковій висоті viewport, сама по собі **не доводить** перекриття кінця скролу.

### Невдалий probe та блокер авторизації

Серія full-navigation до `/offers/new`, `/demands`, `/demands/mine`, `/navigate`, `/map` зробила знімки до завершення auth boot. Усі п'ять містять «Завантажуємо захищену сесію…», тому **невалідні як baseline відповідних екранів**. У network log є aborted refresh, потім `POST /api/v1/auth/refresh` → 401; застосунок перейшов на welcome. Послідовність могла спровокувати проблему ротації/відновлення сесії, але причина сервером не встановлена. Не називати це доведеною випадковою протермінованою сесією чи доведеним дефектом UI.

Відхилені як екранний доказ файли: `redesign-before-offer-390.png`, `redesign-before-requests-390.png`, `redesign-before-my-demands-390.png`, `redesign-before-navigation-390.png`, `redesign-before-transport-map-390.png`. Знімок login може містити автозаповнення; це приватний локальний артефакт, **не включати в публічний PR/порівняльну дошку**.

Надалі кожен маршрут перевіряти окремо, чекати завершення auth boot та семантичного стану, не скасовувати refresh наступною навігацією. Для закриття захищених сценаріїв потрібна відновлена користувацька сесія у тому самому браузері; auth guard не обходити.

## 5. Findings — пріоритет, вплив, рішення, перевірка

### A01 — Preview залежить від реальної геолокації
- **Major / interaction / source VERIFIED, runtime PARTIAL.** `ProductionMarketplace.tsx:568–609` отримує та валідує fresh fix, і лише потім встановлює `activeJourneyNavigation`; програвач живе в цьому екрані.
- Наслідок: неможливо незалежно оглянути маршрут без GPS. Permission granted не означає отриманий fix.
- **REDESIGN:** явний окремий preview mode без activation API/ActiveJourneyStore/підробленої LocationFix; один існуючий slider. Реальна навігація лишається GPS-gated.
- Gate: preview доступний при відмові GPS; 0 lifecycle writes; manual pan не відбирається камерою; GPS не використовує preview-стрілку.

### A02 — Неправдива обіцянка MarshPass
- **Major / copy / VERIFIED.** Home screenshot: «Увесь міський і міжміський транспорт в одному рішенні». `src/domain/marshPass.ts:1–14` допускає тільки passenger booking confirmed/boarding, не journey і не driver.
- **REDESIGN:** промо «Квиток на вашу попутку»; підтвердження, посадка й QR — тільки для придатного реального бронювання. Не розширювати domain eligibility.
- Gate: без booking — пояснення, не квиток; journey/driver не створюють MarshPass.

### A03 — Desktop механічно збільшує мобільну форму
- **Major / composition / VERIFIED.** Search1280/1440: величезний hero, форма вертикальна майже на всю ширину; 8+4 плитки, CTA нижче початкового viewport800.
- **REDESIGN:** компактний page heading, desktop composition із двома змістовими колонками, а не phone frame; 6×2 transport grid або 4×3 у вузькій колонці. Мобільні 4×3 залишити.
- Gate: 1280/1440, довгі адреси, zoom200%, keyboard reachability, mobile parity. Не зменшувати шрифт/target, щоб штучно втиснути все.

### A04 — Забагато однаково сильних рамок та заливок
- **Minor / hierarchy / VERIFIED visual.** Плитки транспорту, inputs, metadata, hero і page shell конкурують одночасними borders, navy layers і shadows.
- **SIMPLIFY:** один primary surface, secondary grouping через відступ; активний контур тільки для selection/focus; один сильний CTA на локальний контекст.
- Gate: обраний transport залишається очевидним без залежності лише від кольору; focus відрізняється від selection.

### A05 — Колір не розрізняє транспортні сегменти
- **Major / source design drift.** `src/index.css:23–34`: усі `--mode-*` посилаються на monochrome. Це не відповідає задуму послідовного розрізнення режимів у картці/таймлайні/карті.
- **ENHANCE:** одна стримана transport palette на спільних tokens, однаковий mode → однаковий token всюди; іконка та текст обов'язкові. Не використовувати 12 яскравих заливок плиток.
- Gate: зіставлення tokens у всіх трьох поверхнях; контраст; monochrome/color-vision review.

### A06 — Суб-12px типографіка і розрізнені motion values
- **Debt / source VERIFIED.** `index.css` містить .625/.6875rem, literal transitions; `styles/motion.css` має fallback160/240ms, тоді як основні fast/base180/260ms.
- **MERGE:** одна шкала type/spacing/durations, мінімум12px secondary,16px inputs. Вимірювати реально застосовані computed styles, не оголошувати всі декларації runtime порушеннями.
- Gate: rendered font/target scan; reduced-motion; жодного blanket-replace CSS.

### A07 — Модальний map picker і глобальна навігація
- **Major candidate / needs runtime verification.** `redesign-before-place-picker-390.png`: нижня навігація лишається поверх footer picker, CTA не видно в viewport; AX містить disabled «Підтвердити точку».
- **REDESIGN:** picker має власні безпечні краї й footer; global nav не повинна перехоплювати modal focus/дії. Не стверджувати, що CTA недосяжний без окремого scroll/focus probe.
- Gate: point selection, footer reachability320/landscape/keyboard, Escape, focus return, background inert.

### A08 — Суперечливі дані маршруту потребують окремого розслідування
- **Data/contract, не косметика; PARTIAL.** У збереженій картці спостерігався ≈23₴, у відкритих деталях60₴; «Автобус Тр31» не дозволяє вивести режим лише з назви лінії.
- **KEEP + investigate:** порівняти той самий journey payload/snapshot, fare provenance і timestamps перед виправленням. Не підганяти значення в UI і не перейменовувати режим евристикою.
- Gate: ідентичний journey/fare input; пояснений estimated vs confirmed; unknown не стає zero.

### A09 — Providers не розрізняють однакові імена
- **Minor / content VERIFIED.** У секції Поїзд двічі «Укрзалізниця»; за порожніх маршрутних полів і current city Чернівці видно операторів інших міст.
- **ENHANCE:** вторинний змістовий descriptor із наявних даних (область/тип джерела), чітке пояснення coverage. Спершу перевірити server registry/filter contract, не фільтрувати міста hardcoded.
- Gate: однакові displayName різних providerId зрозумілі, сервіси не зникають без підстав.

### A10 — Create drawer дублює швидкі дії
- **Minor / IA consistency.** + показує Navigation/Map/Search поряд із Publish та passenger request.
- **SIMPLIFY:** + = публікація (водійська поїздка або пасажирський запит). Існуючі navigation/map/search лишаються у відповідних розділах і Home; не видаляти функції.
- Gate: passenger/driver обидва маршрути доступні; рівно п'ять нижніх пунктів.

### A11 — Сесія та manifest блокують повну QA
- **Blocker для acceptance / runtime VERIFIED.** Два manifest syntax errors до втрати сесії; потім refresh401. Це не доказ повністю непрацездатного API: раніше відповідали200 users/me, bookings, journeys/me, providers.
- **KEEP security + investigate:** окремий auth/manifest incident; не вимикати guard, не підміняти API mocks у живому контурі.
- Gate: валідний manifest на зовнішньому URL; стійке відновлення сесії; повтор protected-flow browser audit.

### A12 — Бронювання: невизначений результат названий перевіреним
- **Major / transaction honesty / source VERIFIED.** `bookingFailureState.ts:22` каже «Бронювання перевірено», але `ProductionMarketplace.tsx:1198–1204` показує текст до reconciliation, а помилку refresh поглинає. Source-аудит повторно перевірено головним агентом.
- **REDESIGN copy/state:** confirmed / rejected / outcome unknown — різні стани. Невідомий результат не закликає негайно повторити POST; пропонує перевірити Поїздки. Транзакційний API не переписувати в UI batch.
- Gate: timeout після commit, failure reconciliation, idempotent retry; негативний контроль на старому тексті.

### A13 — Навігаційний текст робить недоведені висновки
- **Major / data honesty / source VERIFIED агентом.** `ProductionNavigation.tsx:746–765`: unknown speed → 0, pause → «Безпечно зупинено»; `:547–563` quick destination обирає перший geocoder result без підтвердження.
- **REDESIGN:** unknown speed → «—»; pause → «Навігацію призупинено»; неоднозначну адресу підтверджує користувач.
- Gate: null speed не дорівнює stationary; пауза не є доказом фізичної безпеки; адреса іншого міста не приймається автоматично.

### A14 — Не всі ручні команди припиняють preview-camera
- **Major candidate / source VERIFIED, browser NOT_TESTED.** `MapLibreAdapter.ts:418–430,1188–1197,1705–1711`: gesture перериває cinematic, zoom/perspective не викликають той самий interrupt.
- **MERGE:** кожна ручна команда zoom/pan/rotate/pitch/layers-перспектива передає ownership користувачу; resume лише явною дією. `JourneyRouteMapScreen` padding залежить від detent, а не frozen-half — потрібен фактичний gesture probe, не сліпа заміна.
- Gate: утримання камери після zoom/2D3D/drag; MapLibre instance count незмінний.

### A15 — Modal keyboard та ticket timezone не уніфіковані
- **Major candidate / a11y, source VERIFIED агентом.** `MarshPassTicket.tsx:32–70,152–176` має focus initial/Escape, але немає повного trap/inert; `:7–8` дату форматує timezone пристрою. `MapPointPicker.tsx:22–104` не має trap/restore. `MapLayersControl.tsx:57–123` без Escape/focus-management.
- **MERGE:** спільна поведінка modal, не новий дизайн кожного overlay; Kyiv-time contract у квитку; topmost Escape не виходить зі всього маршруту.
- Gate: keyboard loop, restoration, device timezone≠Europe/Kyiv, QR eligibility незмінна.

### A16 — Важлива недоступність схована разом із diagnostics
- **Major / source VERIFIED агентом.** `TransportMapView.tsx:69–126`: error міст і quality/staleness відображаються diagnostics-only.
- **ENHANCE:** «Дані тимчасово недоступні»/«Оновлено …» з фактичного timestamp — користувачеві; HTTP/provider traces лишаються diagnostics.
- Gate: звичайний passenger бачить outage, але не секрети чи технічний дамп. Немає live badge без fresh data.

### A17 — Невикористані lifecycle callbacks і прихована GPS-помилка
- **Major candidate / source VERIFIED агентом.** `JourneyActiveNavigation.tsx:852`: GPS errors приховані при following=false; onFinish/onStageChange оголошені, але не споживаються.
- **KEEP + investigate:** preview-mode не повинен запускати GPS effect `:287–328`; реальна navigation має незалежний location-status. Не під'єднувати completion до preview/end-of-animation.
- Gate: завершення preview не завершує поїздку; stale/denied GPS видимий і без follow; backend lifecycle test окремо.

## 6. Обов'язкові fidelity surfaces

- **Typography:** ієрархія search/home/profile оглянута, transport labels виміряні. Весь runtime sub12/zoom/screen-reader scan NOT_TESTED.
- **Spacing/layout:** viewport matrix Search; desktop overscaling; інші екрани390. Safe-area на фізичному iOS та keyboard NOT_TESTED.
- **Colors/tokens:** світла/темна Search, token inventory; повний числовий WCAG contrast audit NOT_TESTED. Візуальна читаємість не дорівнює WCAG PASS.
- **Assets:** 12 унікальних SVG перевірені; Home має наявні ілюстрації. Не замінювати карту/реальні фото decorative mock assets. Нових asset licenses не перевіряли.
- **Copy:** українська, MarshPass mismatch, duplicate providers, технічний шум визначено; усі error states не відтворювали.
- **States/a11y:** selected/disabled/empty/modal reviewed; keyboard focus trap, error recovery, hover, VoiceOver, reduced-motion, live navigation NOT_TESTED.

## 7. Невиконані гейти та чесність звітності

- Попередні `tsc=0`, eslint без errors і **869 pass / 0 fail / 0 skip** належать попередньому dirty live tree. Цей audit їх не запускав і не доводить відтворюваність чистого `b58cad9`.
- PR143 self-containment перевіряється окремо; наявність untracked live dependencies не можна приховувати.
- Немає before/after доказу, що проблема входу в navigation була або не була regression інтеграції. Попереднє твердження «НЕ регресія» відкликане.
- Весь premium UI не має статусу VERIFIED; підтверджено лише перелічені вузькі сценарії Search та baseline observations.
- Не виміряно FPS, long tasks, INP, memory growth, реальну GPS-navigation, booking/QR, фізичний iOS, Admin/Partner render.
- Ресурси перед цим циклом: memory free27%, swap9176.06MiB/10240MiB, disk20GiB; важких build/test задач не запускали.

## 8. Правило переходу до реалізації

Спочатку зберегти всі сім документів з дослідженням і прийнятою концепцією. Відсутні runtime стани не вигадувати: для них у matrix визначено code contract і окремий acceptance gate. Захищений UI не змінювати навмання, якщо неможливо одразу перевірити зміну в єдиному браузері. Відновлення сесії — передумова наступного live implementation batch, не привід створити другий preview або відключити auth.
