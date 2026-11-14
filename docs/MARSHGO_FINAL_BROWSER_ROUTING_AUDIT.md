# MARSHGO — Final User Experience & National Routing Audit

## Поточний вердикт: PARTIAL / NOT_RELEASED — 2026-11-14, GitHub coordination та R04/R05

### Розподіл ролей і фактичний GitHub-стан

Qoder приєднався до існуючого [NATIONAL MULTIMODAL COMMAND CENTER #26](https://github.com/dima1203oleg/MarshGO/issues/26); [передача серверних знахідок Codex](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6883901105) опублікована. Codex володіє Server, реєстром/адаптерами та Journey Engine; Qoder — discovery, Site та in-app browser QA. Після нової директиви Server не редагувався. Попередній ізольований availability patch переданий як неінтегрований матеріал для рев’ю, не новий паралельний router.

Remote main: Root `1e7d0ee74f11121a7d5a29c6379944a5360581c4`, Server `9477b73df9d70c34c7012547bf5cdb273a612737`, Site `6f0707a71e09fa8f9215f02b40204ba4589ff1cf`. Root local `a4856c2f691476823c3212ca4cf140f44e2373c2`; чинний Site `b58cad91eddabbf89f016d438d446d36f169df87` + dirty, Server `e9934abbd8fc973177de8d7f47548739758a1b74` + 65 dirty paths. Порти7777/PID4613 і3002/PID23151 підтверджені lsof; zrok адреса фактично відкрита у Qoder. Це source HEAD + dirty, не точний immutable build hash. Процеси, sharedDB та чужі зміни не змінені.

### R04/R05 — фактичні пошуки 15.11.2026

| Сценарій | Точний autocomplete O/D, lon/lat | Результат | Межі доказу |
|---|---|---|---|
| R04, 07:00 | Двірцева1 Львів n:9543603568,23.9937023/49.8399296 → Станційна9 Ужгород w:277307109,22.3004587/48.60924 | all12,1passenger,no-transfers=false: один №3 Львів-Головний09:45→Ужгород14:54; train5год9хв,wait2год45хв,total7год55хв,unknownfare | [PNG](evidence/final-browser-r04-lviv-uzhhorod-details.png), [AX](evidence/final-browser-r04-lviv-uzhhorod-details-ax.txt). Details/map/6stops відкриті; walking warning/estimated egress. Офіційний №83107:46→13:23 відсутній у цьому результаті, хоча пошук починається раніше. Причина calendar/ingestion/candidate/geometry rejection NOT_VERIFIED; це конкретний crosswalk для Codex, не доведений алгоритмічний діагноз. №3 незалежно не атестований. |
| R05, 15:00 | Привокзальна2 Одеса w:391034396,30.7399394/46.4671678 → Вокзальна1 Київ n:2644051429,30.4884813/50.4400123 | all12,1passenger,no-transfers=false: один №106 Одеса-Головна22:08→Київ-Пасажирський06:57; train8год49хв,wait7год7хв,access71м<1хв,total15год57хв,unknownfare | [PNG](evidence/final-browser-r05-odesa-kyiv-overnight.png), [AX](evidence/final-browser-r05-odesa-kyiv-overnight-ax.txt). Details/map/10stops відкриті. DATE-01 відтворений: summary15:00→06:57 та stops після00:00 не показують16.11. Офіційний №14815:47→16.11 08:42 відсутній у цьому результаті; причина NOT_VERIFIED. №106 незалежно не атестований. |

Обидва PNG збережені native in-app Browser tools і відкриті Read; не зовнішній Chrome. Matching frame445×843 — не приймання запитаних390px чи всіх viewport/theme. Cheapestdisabled через unknownfare; Fastestavailable, у R04/R05 не натиснутий. Навігація/бронювання/consent не запускалися. Autocomplete wait за AX-назвою listbox в R05 timed out, свіжий snapshot показав готові варіанти; це помилка wait-умови harness, не planner timeout.

Сукупно **10 exact O/D,22 transport searches + 1 empty-selection negative,0 fully accepted**. Single-mode матриця незмінна **12 PARTIAL / 312 NOT_TESTED**: all12-selected R04/R05 не зараховані як24single-mode PASS. Source/licence/calendar/fare/geometry/live й національне покриття лишаються відкритими. Browser interval завершено після20:42:47Z; точні browser URLs/inputs записані в AX. Тести/build/import/restart/deploy у цьому coordination/R04/R05 checkpoint не запускалися.

Нижче збережені попередні чекпоінти; їх старі лічильники/NOT_TESTED стосуються лише часу відповідного запису.

### R03 виконано в Qoder; taxi availability negative control

Через autocomplete фактично вибрано Вокзальна38,Чернівці n:255367661,25.9299818/48.3010524 → Привокзальна1,Івано-Франківськ w:135210961,24.7234494/48.9252915. Новий origin OSM-node відрізняється від w:99408856 попередніх U02/R02; не приписувати їх однаковим координатам. 15.11.2026 09:00,1пасажир,all12selected,no-transfers=false. Один варіант №8: Чернівці19:35→Коломия20:39→Івано-Франківськ21:33; rail1год58хв,очікування10год35хв,total12год33хв,без пересадок. Часи кінцевих станцій збігаються з незалежно fetched official R03 page; Коломия20:39 окремо не атестована. Unknownfare,Cheapestdisabled; Fastest доступний, але не натиснутий у цьому R03. Реально відкрито details/map; [PNG](evidence/final-browser-r03-chernivtsi-frankivsk-details.png) збережено/переглянуто, [AX](evidence/final-browser-r03-chernivtsi-frankivsk-details-ax.txt) збережено. Warning «Частина пішої геометрії не підтверджена», egress29м/ОРІЄНТОВНО. SourceGTFS/calendar/shapes provenance/commercialrights/booking/roadwalk NOT_VERIFIED; schedule agreement є частковим доказом, не fullchainPASS. У цьому R03 лише train+walk, не змішаний vehicle-feeder chain. Сукупно **8exactOD,20transportsearches+1emptynegative,0fullyaccepted**; single-mode matrix незмінна12PARTIAL/312NOT_TESTED.

У тому самому isolated realTrunkChains.ts:343,437 додатково усунуто hardcoded taxi AVAILABLE→UNKNOWN для access та egress. InputTaxiQuote містить road distance/duration/geometry, не партнерську availability. Реальний тест taxi→train→taxi тепер перевіряє UNKNOWN на всіх TAXI legs. До sourcefix9pass/1fail/0skip,42.437667ms,assertion «a road estimate does not confirm a taxi is available»; після10pass/0fail/0skip,41.9955ms. Той самий in-memory TypeScript loader/реальна implementation, HEADad981095ede883b03e58f93417faf101872c7103+dirty, без emittedbuild/install/network. GenericKyivfare/provider-name claims ще НЕ виправлені; estimatedfare не перетворено на confirmed. Sourcefix **isolated fixture VERIFIED, activeAPI/browserfix NOT_TESTED**, без інтеграції. Resources25%free,swap9282.69MiB,disk19GiB; тільки вузький тест, без heavyweight build/parser. Нижче попередній rental checkpoint із hardcodedtaxi блокером є історичним станом до цієї правки.

### U01-S: головний вокзал → Сихів, трамвай і пересадка

Фактично вибрано autocomplete «Двірцева площа,1,Львів» n:9543603568,23.9937023/49.8399296 → попередній Сихів n:1831445863,24.057585/49.794117. 15.11.2026 09:00,1пасажир,тільки tram,no-transfers=false. Пошук повернув2варіанти: Т04 без пересадки47хв/30UAH та Т09→Т08 з пересадкою45хв/60UAH. Actual Fastest переставив45хв першим; Cheapest повернув47хв/30UAH першим. [Результати PNG](evidence/final-browser-u01-station-tram-results.png) і [деталі PNG](evidence/final-browser-u01-station-tram-chain.png) збережені та переглянуті, [деталі AX](evidence/final-browser-u01-station-tram-chain-ax.txt) збережені. Screenshot результатів показує обрізаний початок горизонтальної ribbon другого варіанта; це не відсутній у AX сегмент.

Т09: Залізничний вокзал09:05→Площа Франка09:23; Т08: Площа Франка09:29→Центр Довженка09:43; фініш09:45. Шість хвилин між транспортними сегментами включають walk<1хв та очікування5хв. Обидва набори зупинок реально відкрито, другий tram-leg вибрано; карту відкрито, PNG показує геометрію вибраного першого сегмента. Піші сегменти позначені ОРІЄНТОВНО; egress196м. GPS-мітка першого сегмента змінилася з РОЗКЛАД на GPSОНЛАЙН між спостереженнями — freshness та прив’язка до рейсу завтрашньої дати НЕ атестовані. Немає доказу street-walk, exact GTFS trip/calendar/shapes hash чи незалежного тарифу; **PARTIAL, не повністю прийнятий O/D**. Навігацію/booking/GPSconsent не запускали.

Цей positive control спростовує висновок «трамвай у Львові взагалі не працює», але не встановлює причину Varshavska→Sykhiv0. Сукупно7exactOD,19transportsearches+1emptynegative,0fullyaccepted. Матриця324keys/27територій/12режимів залишається12PARTIAL/312NOT_TESTED; tram має2різні attemptedOD. Жодне all-modes не зараховано як12індивідуальних PASS.

### Ланцюжки: доведений code barrier та вузький негативний контроль

Main перевірив active Server index.ts:3642–3658: rental→transit пошук обмежений METRO. В ізольованому /private/tmp/mgwt/chains index.ts:3580–3616 door-to-door street-walk/preference відсів виконується до index.ts:4175–4184 composeRealTrunkChains(trunks:scheduledCandidates). Тому vehicle-feeder не рятує вже відкинутий trunk; upstream GTFS first-boarding walking обмеження також лишається. Потрібен bounded station/feeder-aware trunk discovery в існуючому worker, потім повна кінцева walk/time/geometry/preferences валідація; не збільшення walk-cap і не другий router. Це **встановлений бар’єр коду**, не виміряне пояснення всіх nationwide0. Read-only chain agent reported121111ms/subagent_tokens1666672/47tools; cost/quotaunknown.

В існуючому ізольованому realTrunkChains.ts:208 зроблено лише surgical fix: rental leg бере estimate.availabilityStatus UNKNOWN замість hardcoded AVAILABLE. Road geometry не доводить наявність прокатного транспорту. tests/real-trunk-chains.test.ts додано assertionUNKNOWN: до виправлення9pass/1fail/0skip,51.748208ms; після10pass/0fail/0skip,47.258667ms. Команда env -u NODE_TEST_CONTEXT node --input-type=module з registerHooks(resolve extensionless .ts; load installed TypeScript.transpileModule in memory) імпортувала реальний testfile та реалізацію; без emitted build, package install, network чи заміни implementation mock. Стандартний tsx відсутній; startup-errors не counted testfailures. SHAad981095ede883b03e58f93417faf101872c7103+dirty; Node runtime26.7.0. Source/test untracked у старому patch, тому звичайний gitdiff їх не показує. **Fixture VERIFIED, active API/integration/browser acceptance NOT_TESTED**; tsc/lint/fullsuite не повторювалися. Generic Kyiv taxi-rate/provider-name/hardcoded AVAILABLE у цьому patch лишаються окремим невиправленим доказовим блокером.

### Офіційні цивільні розклади: підтверджено сторінки, не інтеграцію

Main незалежно fetched офіційні timetable pages після agent result:
- [R03 №8](https://www.uz.gov.ua/passengers/timetable/?ntrain=105857&by_id=1): Чернівці19:35→Івано-Франківськ21:33, щоденно з28.06.2026; published timetable підтримує15.11.
- [R04 №831](https://www.uz.gov.ua/passengers/timetable/?ntrain=107949&by_id=1): Львів07:46→Ужгород13:23, з11.11.2026 щоденно крім вівторка; неділя15.11 підтримується, але09:00 search уже пропустить цей рейс.
- [R05 №148](https://www.uz.gov.ua/passengers/timetable/?ntrain=107915&by_id=1): Одеса15:47→Київ08:42 наступного дня, з15.11.2026 вт/чт/нд; arrival16.11, старе17:07 не переносити.

Це цивільний published schedule, не live availability/cancellation/booking, не дозвіл комерційного імпорту і не зіставлення active GTFS. R03–R05 browser probes ще не виконані у цьому checkpoint. R07 Чортків→Біла №5 агент знайшов недільний PDF07:15→07:30/13:35→13:50, але чинність15.11 не довів; main PDF не перевіряв. Агент reported406929ms/subagent_tokens1715915/60tools,cost/quotaunknown; його broader CI inventory не використано як active runtime чи browser pass.

RootHEADa4856c2f691476823c3212ca4cf140f44e2373c2. Canonical active Site/API,sharedDB,7777/zrok/3002 не змінені; production deploy/restart/import не виконані. Ізольований availability fix не активовано. Наступні гейти: R03–R05 exact station/calendar crosswalk; feeder-aware real mixed chains; source/licence/geometry/fare/live; інші області й усі viewport/theme gates.

## Попередній чекпоінт — 20:20 UTC

### Окремі 12 режими U01 та відновлений R01

Matching R01 result frame отримано після `select_page(pageId1,bringToFront:true)` і послідовного native screenshot; [PNG](evidence/final-browser-r01-stryi-lviv-all-modes.png) збережено та переглянуто: Стрий→Двірцева,15.11 09:00,all-modes,1train74959хв,total1год43,unknownfare/Cheapestdisabled. Це відновлює візуальний доказ **результатів**, не підтверджує source/calendar/access/egress чи всі деталі. Hidden/stale capture може повторюватися; історичний BROWSER-03 нижче збережений.

Новий autocomplete повторно вибраний, coordinates збігаються з U01-N: Варшавська24.0123672/49.8657606 w:335054636 → Сихів24.057585/49.794117 n:1831445863;15.11.2026 09:00,1passenger,unlimitedbudget/arrival. Виконано **9 додаткових single-mode пошуків**, кожен з одним selected mode, no-transfers=false. Tram,trolleybus,metro,train,carpool,taxi,scooter,carsharing,transfer повернули0; усі3стратегіїdisabled, без bus/bike підміни. [Зведені фактичні AX/UI спостереження](evidence/final-browser-u01-additional-modes-ax.txt), [Tram PNG](evidence/final-browser-u01-tram-only.png), [Transfer PNG](evidence/final-browser-u01-transfer-only.png); ці два PNG переглянуті. Trolleybus має nativeAX, шість інших completedresult observations — ComputerUseAX; окремих PNG/придатних inlineimages для них не отримано, VISUAL_NOT_VERIFIED. ComputerUse batch зупинився на user-interaction guard до перемикання transfer; native freshsnapshot підтвердив carsharingselected, після чого transfer реально виконано окремо. Зовнішній Chrome/hiddenDOM/authbypass не використовувалися.

Разом з попередніми bus/marshrutka/bike контролями **всі12категорій окремо виконані лише на одному Львівському O/D**, не по всій області чи Україні. Bus A37/A47 і estimatedbike були попередніми positivecontrols; решта0 не доводять правильність positiveoffer filtering, відсутність сервісу або coveragePASS. Лічильники:6exactOD,18transportsearches+1emptynegative,0fullaccepted; single-mode matrix **12PARTIAL/312NOT_TESTED**,324keys. Комбінації/allmodes обліковуються окремо.

Read-only server diagnosis: registry response має tramproviderЛьвівавтодор `sources:[gtfs],services:[bus,tram]`; trolleybus/marshrutka lists empty. Trolleybus0 узгоджується з missingregisteredsource; tram0 лишається calendar/access/direction/transfers/filter UNKNOWN. Main перевірив active `search.ts:94–99` route-count guard і `index.ts:4727–4741` response diagnostics: gtfsTruncation/partialReasons/blockedProviders/providerErrors; modeDiagnostics/completeness відсутні. DB-конектора немає; POSTsearch автентифікований і записуєjourneys, тому він не є read-only harness. Агент reported199157ms/subagent_tokens510865/23tools; usagecost/quotaunknown,0edits/tests/builds/parsers. Не заявляти runtimecause від читання коду.

Feed integration review reported PRServer155 OPEN/MERGEABLE/head6e84dff3b47be5bdf546da570d12600e68922a96,2CISUCCESS: Odesa/BuchaMDB і EasyWayRivne/Chernivtsi/Korosten. Agent finding: новіMDBrows можуть отриматиenabled доhealthprobe, existingpaused/disabled збережено; EasyWayLICENSE_UNVERIFIEDdisabled; Malynpartnerrightsrequired. Legal/calendar/shapes readiness не підтверджена, активнийforeign-dirtyseedScopes має іншу реалізацію. PR не інтегровано, sharedDBактивацій немає. Reported97444ms/subagent_tokens223937/15tools; costs/quotaunknown. Паралельно запущені незалежні read-only перевірки chainalgorithm та civil/inter-oblastsources; їх результатів ще немає.

RootHEADa4856c2f691476823c3212ca4cf140f44e2373c2; appcode/БД/7777/zrok/3002 не змінені; тести/build/deploy NOT_TESTED. Пріоритет власника20:20: коректні здійсненні ланцюжки поУкраїні з усіма застосовними категоріями, не штучний ланцюг з обов’язковими12режимами. Без дублюванняrouter/registry та без вигаданихschedule/fare/geometry.

## Історичний чекпоінт: PARTIAL / BLOCKED_VISUAL / NOT_RELEASED — 19:59 UTC

### R01 та повторна перевірка поверхні

R01 у native AX: реально введено «Стрий залізничний вокзал», але autocomplete запропонував Ходорів/Лавочне/Верхнє Синьовидне/Славсько. Після уточнення «Стрий Вокзальна» вибрано «Вокзальна вулиця,7,Стрий» n:392259764 lon23.8411609 lat49.259355. Destination «Двірцева площа1,Львів» n:9543603568 lon23.9937023 lat49.8399296 — інший OSM-об’єкт тієї самої адреси, не w:162361985 із R02-b. Не називати ці точки ідентичними.

15.11.2026 09:00 all-modes: count1, train№749,59хв; total1год43; unknownfare/Cheapestdisabled. Details: Стрий09:44→Львів-Головний10:43, wait44хв, лише train-leg; access/egress graph для вибраних адрес не доведений. [AX details](evidence/final-browser-r01-stryi-lviv-details-ax.txt) збережено. **Візуальний результат R01 NOT_VERIFIED:** Computer Use screenshot показав стару форму R02, а не поточні AX details. Той PNG/inline frame не приписується Стрию.

BROWSER-03: native list_pages має одну selected page з R01 URL; fresh Qoder AX має цей самий R01 HTML, але адресний рядок спочатку залишався R02. Після кліку вкладки AX адресний рядок оновився, а screenshot знову лишився старою R02 формою; розгортання панелі також не дало нового рендера чи зміни toggle у AX. Отже причина може бути stale capture/paint, а не дві незалежні програми; її не встановлено. Подальше візуальне приймання заблоковане, нові сценарії не зараховуються візуальними. Попередні PNG U01/U02/U03 і окремий matching R02 details frame збережені як докази своїх моментів, але не сертифікують поточну поверхню.

**Лічильники:** 6 нових точних O/D, 9 транспортних пошуків + 1 empty-mode negative; R01 structural-only, 0 повністю прийнятих O/D. Георівні: city3, inter-oblast2 (exploratory R02-a і main-station R02-b), intra-oblast1 structural-only; rural/suburban NOT_MEASURED. 324-cell single-mode matrix незмінна: 3 PARTIAL / 321 NOT_TESTED / 0 accepted. R03–R05 NOT_TESTED; R06/R07 потребують civilian source; full viewport/themes/zoom/booking/live gates не закриті.

### Походження та чинність залізничного джерела — PARTIAL

Read-only agent знайшов можливе джерело: https://jbb.ghsq.de/gtfs/ua-ukrzaliznytsya.gtfs.zip. Активний `server/mobility/ukraineCatalog.ts:54` прямо називає його ODbL/OSM-похідним, **не офіційним фідом УЗ**; точне зіставлення train7/train749 з цим ZIP не доведене. [Збережений замір](evidence/national-live-probe-2026-11-14-evening.json)266–272: HTTP200, Last-Modified09.11.2026 23:00:09GMT, age115.3h; дата файла не доводить календар на15/16листопада. Наявність календарних/ timezone перевірок у gtfsTimetable не доводить конкретний runtime service. Дата чинності2027-10-23 з іншого BusMaps-набору не переноситься на це дзеркало. Незалежне офіційне підтвердження цивільного рейсу через https://booking.uz.gov.ua не отримано. Довге очікування R02 арифметично можливе, але ні чинність, ні повноту альтернатив не прийнято.

Агент: без змін/тестів/build/parser; reported duration44,138ms, reported subagent_tokens311285 (метрика сервісу, не оцінка вартості); quota/cost unknown. Основна сесія перевірила catalog:54 і збережений probe266–272. Root SHA a4856c2f691476823c3212ca4cf140f44e2373c2; git diff --check exit0 о19:57:34Z. Чужі зміни,7777/zrok/3002 не змінені; native screenshot файли R02/R01 не вигадані. Наступний гейт — matching current AX + rendered in-app frame; без цього не продовжувати видавати структурні кліки за візуальні тести.

## Попередній чекпоінт: PARTIAL / NOT_RELEASED — 19:55 UTC

### U02, U03 та R02 — фактично виконані комбіновані пошуки

Усі наведені пошуки: 15.11.2026 09:00, 1 пасажир, all-modes; конкретний режим не отримує PASS лише через увімкнення всіх 12 кнопок.

| Контроль | Реально вибраний autocomplete O/D, lon/lat | Фактичний результат | Доказ / приймання |
|---|---|---|---|
| U02 Чернівці | Вокзальна38 25.9302147/48.3009217 w:99408856 → Руська248-Е 25.9923805/48.2719658 n:1242162115 | 0; усі 3 стратегії disabled; copy про відсутність підтверджених рейсів для частини режимів | [PNG](evidence/final-browser-u02-all-modes.png), [AX](evidence/final-browser-u02-all-modes-ax.txt); PNG візуально переглянуто; джерело/service на дату NOT_VERIFIED |
| U03 Київ | Вокзальна площа1 30.489395/50.4404389 w:182584465 → Позняки 30.6271509/50.4107574 n:1308284052 | 0; усі 3 стратегії disabled; той самий частковий-service copy | [PNG](evidence/final-browser-u03-all-modes.png), [AX](evidence/final-browser-u03-all-modes-ax.txt); PNG візуально переглянуто; не доказ відсутності транспорту в Києві |
| R02-a, неоднозначний початковий вокзал | Залізничний вокзал, Львів 24.0536691/49.8360973 w:1551714044 → Вокзальна38, Чернівці | UI count7, AX3видимі картки: walk58→train7; tramТ01→train7; tramТ07→tramТ01→train7; усі23год, unknown fare | Не головний вокзал; не приписувати58хв walk дефекту маршрутизатора. Native PNG не збережений; фактичне Qoder-вікно показано Computer Use у чаті |
| R02-b, уточнений головний вокзал | Двірцева площа1, Львів 23.9943404/49.8397377 w:162361985 → Вокзальна38 25.9302147/48.3009217 w:99408856 | 1: walk<1→train№7 4год31→walk<1; total23год; unknown fare; actual Fastest switch працює, Cheapest disabled | [Details AX](evidence/final-browser-r02-main-station-details-ax.txt), фактичний Qoder screenshot у чаті; native PNG не збережений; source/calendar/geometry NOT_VERIFIED |

R02-b: реально відкрито details/map. Візуально видно лінію між Львовом і Чернівцями, «Частина пішої геометрії не підтверджена», access51м, очікування18год28хв. Зупинки: Львів-Головний03:29 → Івано-Франківськ05:33 → Коломия06:50 → Чернівці08:00. Summary09:00→08:00, total23год; **дати наступного дня не показані** — DATE-01 UX finding, не доведена календарна помилка. Розклад №7 не підтверджений незалежним чинним цивільним джерелом; тривале очікування не назване алгоритмічним дефектом без інших рейсів на дату. Booking/navigation/GPS consent не виконувалися.

BROWSER-02: native screenshot повторно повернув NATIVE_BROWSER_VIEWPORT_UNAVAILABLE (468×843, visible=true, attached=true, cdpAttached=true, visibilityState=hidden). Native Back/Change-route спочатку повідомили success без переходу; після фактичного Computer Use Back нові native autocomplete/Search/Fastest/details дали перевірену зміну стану. Один Computer Use input batch перерваний user-changed guard; ввід не повторювався без свіжого спостереження. Зовнішній Chrome, reset хоста, інші сесії та приховані DOM-click не використовувалися. Computer Use screenshot — повне вікно Qoder, не окремий mobile PNG і не viewport acceptance.

Сукупно до цього чекпоінта: **5 нових точних O/D** (U01, U02, U03, R02-a, R02-b), **8 транспортних пошуків + 1 empty-mode negative**, **0 повністю прийнятих O/D**. R02-a є exploratory OD, не прийнятий контроль головного вокзалу. Матриця лишається 3 PARTIAL single-mode клітинки / 321 NOT_TESTED; combined search evidence наведено окремо, без фальшивого зарахування всіх режимів. Root SHA a4856c2f691476823c3212ca4cf140f44e2373c2; код програми не змінено; suites/build/restart/deploy не запускалися. R01, R03–R05 ще NOT_TESTED; R06/R07 цивільні-source гейти відкриті.

### Попередній чекпоінт U01 — 19:42 UTC

Початковий блокер BROWSER-01 **усунуто** після reset лише власного Node REPL і нового Computer Use client; перевірено Qoder-вікно саме chat22e3d34b-97c4-4178-b838-87a9a30e124e. Native click і screenshot стали доступні. Інші сесії/процеси не зупинялися; зовнішній Chrome/приховані DOM-click не використовувалися. Нижче збережено історичний 19:31 baseline, а не поточний стан блокера.

### Виконані дії U01

Раніше завантажений O/D Варшавська→Сихів15.11 08:00 (origin24.0145169/49.8666259) не приписується новому пошуку. Після відновлення поверхні реально натиснуто Fastest/Cheapest/Optimal, відкрито bike details/map і сегмент. Fastest: bike42хв unknown fare + busА37 56хв30₴; Cheapest: лишеА37; Optimal: обидва. Bike details: WALK8хв583м→BICYCLE33хв→WALK1хв85м, «ОРІЄНТОВНО», unknown fare; «Частина пішої геометрії не підтверджена». Підтвердженого вуличного bicycle graph не прийнято. Navigation/GPS consent не починали.

Докази: [Fastest](evidence/final-browser-u01-fastest.png), [Cheapest](evidence/final-browser-u01-cheapest.png), [Bike map](evidence/final-browser-u01-bike-map.png). Fastest/Bike map візуально переглянуті; Cheapest підтверджено AX, PNG збережено.

Новий **реально введений autocomplete O/D**: «Варшавська Львів»→«Варшавська вулиця, Львів», «Сихів Львів»→«Сихів, Львів». Date/time picker змінено на15.11.2026 09:00. Origin lon/lat24.0123672/49.8657606, providerw:335054636; destination24.057585/49.794117, providern:1831445863. Видима назва та сама, origin інший; не ідентичний08:00контроль.

| Пошук на однаковому новому O/D/09:00 | Фактично | UI-фільтри / route acceptance | Доказ |
|---|---|---|---|
| All except bus | 1bike42хв unknown fare; Cheapest disabled | Bus-off без автобуса; PARTIAL geometry/availability | [PNG](evidence/final-browser-u01-bus-off.png) |
| None | Loading→0; generic date/time advice | **FAIL empty-mode guard**, не coverage scenario | [PNG, візуально переглянуто](evidence/final-browser-u01-empty-modes.png) |
| Bike only | 1bike42хв; Cheapest disabled | Немає bus підміни; PARTIAL street geometry/availability | [PNG](evidence/final-browser-u01-bike-only.png) |
| Bus only | А37 56хв, А47 1год11хв, обидва30₴ cash | Немає bike/marshrutka підміни; PARTIAL source/calendar/live | [PNG](evidence/final-browser-u01-bus-only.png) |
| Marshrutka only | 0; немає підтверджених рейсів у напрямку | Немає bus підміни; UNKNOWN service, не PASS coverage | [PNG](evidence/final-browser-u01-marshrutka-only.png) |

Виконано5пошуків з **1точним новим O/D**, з них4транспортні та1empty-mode negative. **0повністю прийнятих O/D**: джерела на дату/геометрія/live ще не доведені. Bus-only позитивний контроль на тих самих точках/часі має2автобуси; bus-off0автобусів. Вибір зберігався після back. Це не перевірка всіх11увімкнених режимів.

А37 details:09:00→09:55,rounded56хв; access4хв340м, wait2хв, bus49хв25зупинок, egress<1хв. Реально розгорнуто зупинки: Варшавська09:06→Центр Довженка09:55. Дві «Шевченківська РА»09:10/09:12 не названі дефектом безstopIDs. [Stops/map PNG, візуально переглянуто](evidence/final-browser-u01-bus-stops.png) показує маршрутну лінію/anchors, але **GPS ОНЛАЙН проти AX РОЗКЛАД** на тому самому сегменті — LIVE-01 evidence mismatch. Fresh GPS timestamp/trip match не перевірені; це не доказ live.

Network summaries: searchPOST200, окремо401→refresh200→search200; bodies/credentials/storage не читалися. Конкретний empty-mode payload із summaries не доведений.

### Поточні дефекти та read-only перевірка

- D9-active: guard FAIL. Server PR159 OPEN headf29b18950a14815e3383ba62d481ea5a49c8091b, basemain9477b73; Site PR141 OPEN headaad6115791bffce8b587d2d6f904dec1e41c586d, basemain6f0707a. Active SiteProductionMarketplace.tsx951–978 guard відсутній; transportPreferences.ts206–207,243 серіалізує[]; Serversearch.ts211–219 приймає[]. Serversearch/test перетинаються з чужимиdirty: не дублювати fix і не застосовувати поверх них. Наявний PR не означає виправлений runtime.
- BIKE-01: read-only активний ServermicromobilityEstimates.ts67–188 використовує rental_locations/great-circle/2pointSTRAIGHT_LINE_ESTIMATE, bike4м/с, walk1.25м/с; не own-bike road graph. Registry flags не незалежний доказ availability/license. index.ts4159–4206 unknown fare/bookingAvailable:false/liveStatus:UNVERIFIED; exact rendered journey payload не зіставлено.
- LIVE-01: JourneyRouteMapScreen.tsx916–932 може брати liveJourney status, тоді як AX опис походить із leg; фактичну свіжість не встановлено. Foreign dirty файл не змінено.

### Національна матриця та незакриті гейти

324клітинки — облік, не324тести. Після recovery невиконані клітинкиNOT_TESTED, не ongoing surfaceBLOCKED. Лише Львівbike/bus/marshrutka маютьsingle-mode виконання, усіPARTIAL; prior feed statuses не стаютьbrowserPASS. Стан19:55: city3новіточніO/Dвиконано/0прийнято; inter-oblast2новіточніO/Dвиконано/0прийнято (один exploratory, один уточненийR02); suburban/rural,intra-oblast0/0NOT_MEASURED. R02-a містить видимі трамвай→поїзд ланцюжки, але їхня feasibility не прийнята. Національний знаменник чиннихO/Dневідомий, coverage%не обчислюється.

U02/U03/R02 виконані PARTIAL, докази вище; R01,R03–R05NOT_TESTED; R06Київ→ХарківBLOCKED до офіційногоcivilservice на дату; R07ruralBLOCKED до встановлення підтвердженої пари/оператора. Own-bike street graph/rentalGBFS/return availability/scootergeofences; street/stationtransfergeometry; calendars/fare/GPS/ETA; booking; arrival-by/сьогодні/інша дата; mobile320/390/430/768/1280/1440+desktop/themes лишаються відкритими. Поточна поверхня≈468×843, не повнийviewportgate.

Код програми не змінено, тести/build не запускалися, applicationfixне заявляється. Чинний7777/zrok/3002збережено. SHAs/fingerprints нижче — baseline dirty-контуру, не сертифікат runtime. Аудит продовжується.

---

## Історичний baseline 19:31 UTC: BLOCKED / PARTIAL / NOT_RELEASED

На цей момент нових виконаних браузерних O/D було0; наведені нижче BLOCKED/NOT_TESTED стани збережені як історичні, не поточний вердикт.

## 1. Перевірений чинний контур

| Компонент | Фактично перевірено |
|---|---|
| Оркестрація | HEAD `a4856c2f691476823c3212ca4cf140f44e2373c2`; чужі dirty-файли збережені |
| Web/PWA | PID 4613, 127.0.0.1:7777; worktree `/Users/dima1203/.qoder/worktrees/app/330dd3/MarshGO-Site`; HEAD `b58cad91eddabbf89f016d438d446d36f169df87`, dirty |
| API | PID 23151, 127.0.0.1:3002; `/Users/dima1203/Desktop/MarshGO/MarshGO-Server`; HEAD `e9934abbd8fc973177de8d7f47548739758a1b74`, dirty |
| Публічний Web | https://marshgo-dima.shares.zrok.io — HTTP 200 |
| API readiness | `/readyz`: ready; database connected; realtime connected |
| Ресурси | memory free 27%; swap used 8926.31 MiB; disk available 19 GiB — YELLOW |

SHA dirty-дерева не ідентифікує весь виконуваний код. Виміряні SHA-256 `git diff HEAD --`:

- Site: `ecbf567fc17538ae4dff2a2882f356dd398b951832cb1334cf61c06fde379205`.
- Server: `2752ea8282fc8ea5d7a3ad9979835be7da05541559cd23f954d8155da48c1e94`.

Ці fingerprints охоплюють лише tracked diff, не untracked-файли, конфігурацію чи точний час завантаження модулів процесом. Найновіший remote SHA цим чекпоінтом не перевірявся. Чинні процеси не перезапускалися; дублюючі Web/API, build, GTFS-парсер чи production deployment не запускалися. Ізольований routing-патч не вважається інтегрованим.

HTTP 200 та readiness — інфраструктурні результати, **не PASS маршруту**.

## 2. Браузерний блокер BROWSER-01

Інструмент Qoder in-app Browser знаходить сторінку MARSHGO і читає її accessibility tree. Спроба натиснути «Найшвидший» повернула:

`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`: operation=click, viewport=468×843, visible=false, attached=false, cdpAttached=true, visibilityState=hidden.

Спроба скриншота повернула той самий блокер для operation=screenshot. Жоден із цих викликів не доводить перемикання стратегії чи наявність видимого рендера.

Computer Use не надав прив'язку до Qoder: `SESSION_BUSY: close the previous client and wait for its cleanup`. Повторне використання наявного client також не надало прив'язку. Cleanup API не вгадувався; інші сесії, вкладки й процеси не зупинялися. Chrome, приховані DOM-click, ін'єкція стану й інший браузер не використовувалися для обходу.

**Потрібна передумова продовження:** видима прикріплена поверхня in-app Browser саме цієї сесії Qoder та доступний UI client. До цього неможливо підтвердити реальні кліки, autocomplete, стратегії, карту, zoom, mobile/desktop або скриншоти.

Артефакт: [структурний AX-знімок](evidence/final-browser-audit-2026-11-14-ax.txt). Це текстова структура, **не скриншот**.

## 3. Поточне структурне спостереження — NOT_VERIFIED

Сторінка вже містила результати перед діями цього чекпоінта. Введення адрес, autocomplete, вибір дати/режимів і натискання пошуку **не виконані й не приписуються цьому аудиту**.

| Поле | Структурно прочитано |
|---|---|
| O/D | Варшавська вулиця, Львів → Сихів, Львів |
| Координати URL, lon/lat | 24.0145169,49.8666259 → 24.057585,49.794117 |
| Дата/час | 15.11.2026, 08:00; timezone payload не перевірений |
| Режими | «усі види транспорту»; фактичний API request не перевірений |
| Результати | 2 |
| Варіант 1 | Пішки 8 хв → Велосипед 33 хв → Пішки 1 хв; загалом 42 хв; ціна уточнюється |
| Варіант 2 | Пішки 2 хв → Автобус №А37 49 хв → Пішки <1 хв; загалом 56 хв; 30 ₴ готівкою |
| Стратегії | Оптимальний: 2; Найшвидший: 2; Найдешевший: 1; перемикання не виконане |
| Джерело, геометрія, availability, GPS | NOT_VERIFIED для обох конкретних варіантів |

Наявність велосипеда в AX не доводить придатний велосипедний граф, доступний прокат, правила повернення чи власний велосипед. Наявність А37 не доводить поточний календар, тариф або civil service. Невідома ціна не зарахована як нуль. Геометрія й час пересадок не прийняті.

## 4. Матриця 27 × 12

[Машиночитний журнал браузерного аудиту](evidence/final-browser-audit-2026-11-14-matrix.csv): **324 унікальні клітинки**, 27 територій, 12 режимів. Генератор перевірив cardinality та унікальність region_id/mode.

- PASS: 0; FAIL транспортного сценарію: 0; BLOCKED поверхнею аудиту: 324.
- Виконаних O/D: 0. Ці 324 записи є клітинками обліку, **не 324 виконаними тестами**.
- `prior_feed_status` імпортований із наявної матриці; він не стає `browser_status`.
- Навіть попередній `NOT_APPLICABLE` не є браузерним PASS. Застосовність конкретного O/D має бути окремо доведена.
- BLOCKED тут означає неможливість виконати аудит, не відсутність транспорту в усій області.

Території: 24 області, місто Київ, АР Крим, Севастополь. Режими: carpool, marshrutka, bus, taxi, tram, trolleybus, metro, train, bike, scooter, carsharing, transfer. Пішки — сполучна ланка, не 13-та категорія.

## 5. Обов'язкові контрольні сценарії

Спільна дата для повторюваного базового запуску: 15.11.2026 08:00 Europe/Kyiv; це **запланована**, не виконана дата. Окремо потрібні сценарії «сьогодні» з реально майбутнім часом, arrival-by та інша дата. Наявність рейсу на цю дату не припускається.

Кожен контроль потребує реального введення адрес/вибору autocomplete, кожного застосовного режиму окремо, сумісних комбінацій, all-modes, bus-off, трьох стратегій і mobile/desktop. Для невизначеного сервісу застосовність лишається NOT_VERIFIED.

| ID | Територія / O/D | Клас | Очікування | Фактично / джерело | Статус |
|---|---|---|---|---|---|
| U01 | Львів: Варшавська → Сихів | Місто | Джерело, календар, фільтри, фізичні переходи, геометрія | Лише попередній AX-стан; provenance не перевірена | BLOCKED |
| U02 | Чернівці: різні райони; точні адреси ще не обрані | Місто | Реальні autocomplete-точки і застосовні режими | Не виконано; джерело не підтверджене для O/D | BLOCKED |
| U03 | Київ: різні райони; точні адреси ще не обрані | Місто | Доступне цивільне сполучення; bus-off без підміни | Не виконано; джерело не підтверджене для O/D | BLOCKED |
| R01 | Стрий → Львів | Внутрішньообласний | Дійсний рейс конкретної дати; access/egress | Історичний запис ретесту не замінює новий прогін | BLOCKED |
| R02 | Львів → Чернівці | Міжобласний | Календар, можливі пересадки, невідома ціна чесно | Не виконано в цьому чекпоінті | BLOCKED |
| R03 | Чернівці → Івано-Франківськ | Міжобласний | Дійсний напрямок і календар | Окремий збережений O/D-доказ не знайдений | BLOCKED |
| R04 | Львів → Ужгород | Міжобласний | Джерело/геометрія/час без вигаданих ланок | Історичний запис ретесту не замінює новий прогін | BLOCKED |
| R05 | Одеса → Київ | Міжобласний | Чинний цивільний рейс і коректні стратегії | Історичний запис ретесту не замінює новий прогін | BLOCKED |
| R06 | Київ → Харків | Міжобласний, умовний | Спочатку офіційне підтвердження цивільного рейсу | Civil service на дату не підтверджено | BLOCKED |
| R07 | Мале місто → село, пару ще не встановлено | Сільський/районний | Спочатку підтвердження регулярного перевізника | Іменована підтверджена пара не знайдена | BLOCKED |

Ці 10 контрольних рядків — не повний перелік міст, громад або рейсів України. Геокодування не є покриттям. Не підтверджений цивільний сервіс не активується за історичним розкладом; не використовується непублічна військова інформація.

## 6. Незалежні метрики географічного рівня

| Рівень | Пройдено / виконано в чекпоінті | Повний знаменник | Результат |
|---|---|---|---|
| Місто | 0 / 0 | Чинні застосовні O/D міських мереж не інвентаризовані | NOT_MEASURED |
| Передмістя / район / село | 0 / 0 | Підтверджені регулярні O/D не встановлені | NOT_MEASURED |
| Міжмісто всередині області | 0 / 0 | Підтверджені чинні O/D не встановлені | NOT_MEASURED |
| Міжобласні | 0 / 0 | Підтверджені чинні O/D не встановлені | NOT_MEASURED |
| Складні мультимодальні | 0 / 0 | Реально допустимі комбінації ще не встановлені | NOT_MEASURED |

Метод майбутнього виміру: чисельник — O/D, що мають джерело на дату, виконаний браузерний пошук, прийняту геометрію/пересадки/фільтри і доказ результату; знаменник sample-метрики — усі виконані застосовні O/D, з FAIL і BLOCKED окремо. Повнота країни вимагає незалежного повного inventory операторів/маршрутів/громад. За 0/0 відсоток не обчислюється; кількість відібраних тестів не є національним знаменником.

## 7. Велосипед / самокат, тарифи, бронювання, live

Окремі не виконані гейти:

- Власний велосипед: короткий вуличний маршрут bicycle-profile; заборонені дороги/односторонність, геометрія й час, без фіктивного прокатного availability.
- Прокатний велосипед: свіжий GBFS/API, доступний пристрій/станція, законний доступ, повернення/вільне місце, геозони.
- Самокат: реальна доступність, ride/parking/no-go zones, повернення й придатний дорожній профіль; не car-profile або пряма лінія.
- Перевезення велосипедів у поїзді не припускається без правил оператора.
- Кожна транспортна пересадка: вулична/станційна геометрія, досяжність, запас часу, календар і напрямок наступного рейсу.
- GPS/ETA: свіжий timestamp, валідні координати, match route/trip; scheduled і estimated не підміняють live.
- Тарифи: unknown не нуль; Cheapest лише за відомою сумарною ціною або чесне недоступне сортування.
- Booking/navigation: лише справжня capability; реальні гроші, SMS, private GPS, публікація чужих поїздок не використовувалися.

## 8. Попередні докази — не нове приймання

- [Національна фідова матриця](evidence/national-coverage-matrix-2026-11-14.csv): 10/324 FULLY_VERIFIED джерел; не 10 браузерних PASS і не покриття всіх населених пунктів цих областей.
- [Фідові метрики](evidence/national-coverage-metrics-2026-11-14.json): M8 NOT_MEASURED. Цим чекпоінтом M8 не закрита.
- [Індекс попередніх скриншотів](evidence/browser-zrok-2026-11-14/README.md): старий Chromium-прогін, інший dirty Site; не поточна перевірка in-app Qoder і не 27×12.
- [Routing 3.0 E2E](MULTIMODAL_ROUTING_E2E_REPORT.md): 45/45 fixture-тестів раніше; не rerun у цьому чекпоінті. Ізольовані live-ланцюжки не прийняті та не завантажені в поточний API.
- Записи про Стрий→Львів, Львів→Чернівці, Львів→Ужгород, Одеса→Київ містять числа ланок, не числа сценаріїв. Окремі збережені PNG/payload цих ретестів пошуком не знайдені.

## 9. Дефекти, зміни й повторне приймання

| ID | Тип | Факт | Зміна / повторний тест |
|---|---|---|---|
| BROWSER-01 | Блокер harness | Прихована неприкріплена поверхня; click і screenshot недоступні | Не обходився; повторення лише після доступної поверхні |
| EVIDENCE-01 | Прогалина приймання | Завершений national browser report/O/D-result set не знайдений | Створено незавершений журнал і 324 явно BLOCKED клітинки; не PASS |
| BIKE-01 | Питання provenance | Велосипедний варіант у AX; own/rental/geometry не підтверджені payload | Потрібен bounded read-only аналіз і той самий видимий сценарій |

Код програми в цьому чекпоінті не змінено, дефекти маршрутизатора не оголошені виправленими. Unit/integration/browser suites не запускалися. Лише CSV-перевірки: 324 рядки, 27 територій, 12 режимів, унікальні ключі, нуль успадкованих браузерних PASS.

Наступне приймання: відновити саме поверхню Qoder, U01 з autocomplete/датою, single-mode та bus-off, три стратегії, деталі/карта; далі U02/U03 і R01–R07 з підтвердженими сервісами. Будь-яку виправлену помилку повторити тим самим O/D/часом/режимами; регресійні результати прив'язати до фактично виконуваного коду. Матриця лишається відкритою, статус продукту — NOT_RELEASED.
