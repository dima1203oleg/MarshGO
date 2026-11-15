# MARSHGO — Final User Experience & National Routing Audit

## Поточний вердикт: PARTIAL / NOT_RELEASED — 2026-11-15, U10 Ternopil urban

### Source follow-up — PDF contents viewed, current-service gates remain

Existing Qoder in-app browser rendered both one-page PDFs after local Read renderer failed. Bus16 Винниченка→Київська Sunday table has seven duty blocks, directional terminal grids, signatures/stamps and ordered stop names including Залізничний вокзал. Duty1 terminal08:03→08:33 and08:38→09:23 are not station boarding times or stable GTFS trips. Trolleybus2 Тролейбусна→Лесі Українки Sunday table has four blocks2.1–2.4 and Трол/Центр/Л.Укр/Центр columns; duty2.1 row06:37/06:51/07:07/07:22. Лесі Українки is not U10 Леся Курбаса; no exactOD service claim. Handwritten effective dates not confidently transcribed; Nov15 exceptions/current operation/rights/coordinates/identity still NOT_VERIFIED. Hashes unchanged, no activation.

Native [bus screenshot](evidence/ternopil-bus16-sunday-inapp.png), [90-degree rotated reading copy](evidence/ternopil-bus16-sunday-inapp-readable.png), [trolleybus screenshot](evidence/ternopil-trolleybus2-sunday-inapp.png) saved and reading copies Read-viewed. [Codex follow-up6886553521](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6886553521). Ledger remains72records; no new OD/search; national totals unchanged. Prior content-unread checkpoint below is superseded only for PDF visual content, not activation gates.

### U10 — Тернопіль, Привокзальний майдан → вулиця Леся Курбаса

Base Rootf5eca7354efb9c4106a848b81b17fdbf80fc48a6. Existing canonical Qoder in-app zrok. Exact autocomplete n:2510575495 lat49.5539341/lon25.6001758 → w:1081246284 lat49.5726151/lon25.6372156; street-only destination, not house8. Explicit picker15Nov2026 09:00 Europe/Kyiv (07:00Z), 1passenger/unlimited budget/transfers allowed/no deadline/BALANCED.

- TROLLEYBUS-only → 0: [PNG](evidence/final-browser-u10-ternopil-trolleybus.png), [AX](evidence/final-browser-u10-ternopil-trolleybus-ax.txt).
- BUS-only → 0: [PNG](evidence/final-browser-u10-ternopil-bus.png), [AX](evidence/final-browser-u10-ternopil-bus-ax.txt).
- BUS+TROLLEYBUS → 0: [selection](evidence/final-browser-u10-ternopil-city-selection-ax.txt), [PNG](evidence/final-browser-u10-ternopil-city.png), [AX](evidence/final-browser-u10-ternopil-city-ax.txt).

Three489×843dark native PNGs Read-viewed; stable empty results, disabled strategies, five-nav intact. Details/map/waits/fares NOT_TESTED. Zero results do not establish absent movement or a source-related runtime cause. OSM points are not platform identities; modes remain absent from URL. No marshrutka search.

Official linked Sunday PDF leads downloaded HTTP200: [bus16](evidence/ternopil-bus16-sunday-official-2026-11-15.pdf)260350B SHAe1a582965ff2ba027caa95d4a0cd1fb16f52d71d590d91c2acb3922a646810a7; [trolleybus2](evidence/ternopil-trolleybus2-sunday-official-2026-11-15.pdf)182821B SHA2c7d14c97963bc847136144598a031684f092e4dde99089dadee407f0995a03e. PDF content NOT_VERIFIED: Read renderer lacks pdftoppm; filenames are not dated-service evidence. Commercial rights/calendar/exceptions/timezone/stable trip-stop-sequence/coordinates remain unresolved. DeTransport public terms independently read: private use only; commercial service/movement-data use prohibited without permission. No endpoint research/activation. Delegated opendata.te.ua redirect was not followed or independently verified.

[Codex diagnostic/source handoff6886529268](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6886529268) requests imported hash→calendar→stop access/direction→planner→API/runtime first failing stage. National19OD50searches+1negative0fullyaccepted; matrix31PARTIAL293NOT_TESTED, bus3attempts including prior Chortkiv, trolleybus2; prior evidence preserved. Ledger72records22cols, three nonduplicate leads, old bytes preserved. Resource26%free/swap10372.50MiB/disk17GiB YELLOW; no new heavy process/tests/build/import/Server/Site/DB/7777/zrok/restart/deploy. PR144/URL/DATE01 coordination pending. Full27×12 acceptance unmet.

## Попередній checkpoint — U09 Khmelnytskyi urban

### Server acceptance follow-up — all10 retained; bus→bus witness, cross-mode still unproved

Base Root588cd947b638bc78b6757a40d8806cef9a79ad18. Exact Servermain c7d327b573c4fb35e3ccb6cb72bcc6aa88a28bf4/run43655265863 SUCCESS; artifact14137663409 ZIP11405B/JSON112682B SHAdecb97a9d2e0853289b3c6fb981e3afeef58650622b8779eba974679a4e0c544 independently matches Codex. Recomputed88catalog/83checked/5skipped/32HEALTHY30DEGRADED21OFFLINE. Compared with prior artifact14136263580, changed labels Полтава — позиції (EasyWay JSON) and Чортків — позиції (Dozor JSON), bothDEGRADED→HEALTHY; Codex earlier Ivano-Frankivsk label needs crosswalk verification. Snapshot health is not license/calendar/routing/booking coverage.

Exact scripts/transport-feed-smoke.ts:118–124/136 now exports all10 itineraries while examples remains first2. Recomputed center10=7tram/2trolleybus/1bus_unspecified, allsingletransitleg; north10=7singlebus_unspecified+3bus_unspecified→bus_unspecified. North ranks6/7 А52→А53, rank8 А51→А53; rank6 Варшавська612→ШевченківськаРА610 then ШевченківськаРА609→СихівськаРА453, total13:00Z→14:14:24Z. Different stop610/609 requires actual transfer walk/pathway evidence, not identical-name substitution. All20 returned chains have cross-mode count0. This is returned bus→bus evidence, not cross-mode/12-mode/calendar/runtime/API/browser acceptance or proof of ranking loss. Old omitted8results blocker is resolved by itineraries array, but IDs/perleg scheduled+effective times/service-date/hash/walk distances+seconds/buffers remain absent. Totaldeparture13:00Z is requested-start, not vehicle boarding time. Existing main-pool histograms160one90two/30one220two and truncation remain diagnostic, not causal rank-loss proof.

[Codex6886324308](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6886324308) requests existing serializer fields from GtfsDirectJourney155–197/GtfsItinerary439–460, rank3+/6 retention and distinct610→609 nonzero-walk/time-buffer evidence before Engine tuning; no invented values, shared refresh or source activation. No local build/test/browser/search/import/runtime changes for this follow-up; national totals18OD47searches+1negative0fullyaccepted and30PARTIAL294NOT_TESTED unchanged. NOT_RELEASED.

### U09 — Хмельницький, Проскурівська 92 → Проскурівська 13

Base Root47eafd0673861834e9ab8c73992e91249168d3a3. Existing native Qoder in-app public zrok only. Exact autocomplete Проскурівська вулиця, 92, Хмельницький w:39095264 lat49.4165545/lon27.0101981 → Проскурівська вулиця, 13, Хмельницький w:191814406 lat49.4255814/lon26.9829886. Origin chosen from station query, not an attested station/platform crosswalk. Same street name in the result header does not mean identical coordinates. Explicit date picker15Nov2026 09:00 Europe/Kyiv (07:00Z), 1passenger, unlimited budget, no-transfers=false, no deadline, BALANCED.

1. **Тролейбус-only** (інші11false) → **0 маршрутів**. [PNG](evidence/final-browser-u09-khmelnytskyi-trolleybus.png)/[AX](evidence/final-browser-u09-khmelnytskyi-trolleybus-ax.txt).
2. **Автобус-only** (інші11false) → **0 маршрутів**. [PNG](evidence/final-browser-u09-khmelnytskyi-bus.png)/[AX](evidence/final-browser-u09-khmelnytskyi-bus-ax.txt).
3. Same OD/date **Автобус + Тролейбус** (інші10false) → **0 маршрутів** after loading completed. [Selection AX](evidence/final-browser-u09-khmelnytskyi-city-selection-ax.txt), [PNG](evidence/final-browser-u09-khmelnytskyi-city.png)/[AX](evidence/final-browser-u09-khmelnytskyi-city-ax.txt).

Three native PNG489×843dark saved and Read-viewed; stable empty-state, three disabled strategies and five-item navigation. Details/map/geometry/waits/fares NOT_TESTED because no routes returned. Zero output is not proof of absent real movement or source defect causing runtime0. Modes absent from URL; selection AX and rendered headers prove actual allowlists. No marshrutka control or bus/marshrutka conflation.

[Source handoff6886197942](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6886197942): municipalCC-BY508coordinate stops are not dated schedules; actual schedule resources omit calendars despite metadata description; old/shared dead API schemas unproved; municipally endorsed replacement website lacks permitted current export, stable trip-stop identity/calendar/timezone, and route403 research stopped. No source activation. [Codex U09 diagnostic handoff6886293151](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6886293151) requests exact source/hash→dated service→stop-access/direction→planner→API/runtime first failing stage, without shared refresh.

Totals **18 exact OD / 47 transport searches + 1 empty-mode negative / 0 fully accepted**. Matrix validated **324rows/14cols, 30PARTIAL/294NOT_TESTED**; only Khmelnytskyi bus/trolleybus changed to2attempts each/success0; previous regions and other10Khmelnytskyi modes preserved. Resource check27%memoryfree/swap10263.75MiB/disk17GiB YELLOW at U09 start; existing browser only. No code/test/build/import/Server/Site/DB/7777/zrok/restart/deploy. Latest Codex correction6886211839 says tracking ref stale, not divergent; protected Servermain c7d327b573c4fb35e3ccb6cb72bcc6aa88a28bf4 and run43655265863 completedSUCCESS independently verified. Artifact semantics/runtime parity not accepted from green CI. Full27×12 objective remains unmet. NOT_RELEASED.

## Попередній checkpoint — U08 Rivne urban

### U08 — Рівне, Привокзальна площа 1 → Соборна 63

Base Root7259ea95fa48fb4ba900dd9cc65c514472f5a91b. Existing native Qoder in-app public zrok only. Exact autocomplete Привокзальна площа, 1, Рівне w:105675898 lat50.6276986/lon26.2399112 → Соборна вулиця, 63, Рівне w:121799689 lat50.6197337/lon26.2446629. Explicit date picker15Nov2026 09:00 Europe/Kyiv (07:00Z), 1passenger, unlimited budget, no-transfers=false, no deadline, BALANCED.

1. **Автобус-only** (інші11false) → **0 маршрутів**. [PNG](evidence/final-browser-u08-rivne-bus.png)/[AX](evidence/final-browser-u08-rivne-bus-ax.txt).
2. **Тролейбус-only** (інші11false) → **0 маршрутів**. [PNG](evidence/final-browser-u08-rivne-trolleybus.png)/[AX](evidence/final-browser-u08-rivne-trolleybus-ax.txt).
3. Same OD/date **Автобус + Тролейбус** (інші10false) → **0 маршрутів** after loading completed. [Selection AX](evidence/final-browser-u08-rivne-city-selection-ax.txt), [PNG](evidence/final-browser-u08-rivne-city.png)/[AX](evidence/final-browser-u08-rivne-city-ax.txt).

Three native PNG489×843dark saved and Read-viewed; stable empty-state, disabled three strategies, five-item navigation preserved. Details/map/geometry/waits/fares NOT_TESTED because no routes returned. Zero output is not proof of absent real city movement. OSM autocomplete coordinates are not official stop/platform crosswalks. Modes are not serialized in URL; selection and rendered headers prove the actual allowlists. No marshrutka search performed.

Separate source handoff [6886063708](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6886063708): ZIP43357B SHA56f5c077daa40777423eccc436be22614c2ba57a8b4dcbd16133ff4a2ad5f2bc encodes15Nov/3type3routes/604route-service joined trips/82stops, but agency header-only/timezone absent/endpoint commercial rights and actual dated operation NOT_VERIFIED. Source not activated; no claim these gaps caused runtime0 or type3 establishes bus vs marshrutka. [Codex U08 diagnostic handoff](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6886141872) requests exact source/imported hash/calendar/stop-access/direction/planner/API/runtime crosswalk, without shared refresh.

Totals **17 exact OD / 44 transport searches + 1 empty-mode negative / 0 fully accepted**. Matrix **324rows/14cols, 28PARTIAL/296NOT_TESTED**; Rivne bus/trolleybus2attempts each/success0, other10 remain NOT_TESTED. Existing controls preserved. Latest resource check27%memoryfree/swap10198.88MiB/disk17GiB YELLOW; existing browser only, no new heavy process. No code/test/build/import/Server/Site/DB/7777/zrok/restart/deploy. National27×12 source-to-browser acceptance remains unmet. NOT_RELEASED.

## Попередній checkpoint — U07 Vinnytsia urban

### U07 — Вінниця, Привокзальна площа 1 → Соборна 50

Base Root4aaa955. Native Qoder in-app existing public zrok only. Exact autocomplete: Привокзальна площа, 1, Вінниця w:35150650 lat49.2393802/lon28.5105445 → Соборна вулиця, 50, Вінниця w:35397037 lat49.2333459/lon28.4687818. Explicit date picker15.11.2026 09:00 Europe/Kyiv (07:00Z), 1passenger, unlimited budget, no-transfers=false, no deadline, BALANCED.

1. Лише **Трамвай** (інші11false) → **0 маршрутів**. [PNG](evidence/final-browser-u07-vinnytsia-tram.png)/[AX](evidence/final-browser-u07-vinnytsia-tram-ax.txt).
2. Той самий OD/date, **Трамвай + Автобус + Тролейбус** (інші9false) → **0 маршрутів**. [Selection AX](evidence/final-browser-u07-vinnytsia-city-selection-ax.txt), [PNG](evidence/final-browser-u07-vinnytsia-city.png)/[AX](evidence/final-browser-u07-vinnytsia-city-ax.txt).

Both native PNG489×843 dark saved and Read-viewed; stable empty-state, disabled strategies and five-item navigation. Details/map/geometry/waits/fares NOT_TESTED because no routes returned. Zero results are **not evidence of absent city movement**. OSM autocomplete coordinates are not an official stop/platform crosswalk. Source→ingestion→calendar→access/egress→planner→API/runtime cause NOT_VERIFIED; Depo website is not declared the cause. Its public weekend grids remain disabled pending commercial/export permission, current dated calendar and stable keys/coordinates; Codex review [6885920745](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6885920745) confirms these gaps.

Totals **16 exact OD / 41 transport searches + 1 empty-mode negative / 0 fully accepted**. Matrix validated **324rows/14cols, 26PARTIAL/298NOT_TESTED**: U07 tram2attempts, bus1combined, trolleybus2 across V01+U07; previous V01 Soborna1→Keletska100 evidence preserved. Combined control is not isolated bus/trolleybus acceptance. [Codex reproduction handoff](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6886004357) requests exact imported source/SHA, dated calendar, stop-radius/direction and planner-stage diagnostics, without shared refresh or invented service. No code/test/build/import/Server/Site/DB/7777/zrok/restart/deploy. NOT_RELEASED.

## Попередній checkpoint — U06 Dnipro urban

### U06 — Дніпро, Вокзальна площа → проспект Дмитра Яворницького 75

Native Qoder in-app browser на чинному публічному zrok, фактичні PNG489×843 dark. Exact autocomplete: Вокзальна площа, Дніпро n:12351552626 lat48.4780763/lon35.0149877 → проспект Дмитра Яворницького, 75, Дніпро r:1208751 lat48.4666825/lon35.0398884. Date picker явно перевірено: 15.11.2026 09:00 Europe/Kyiv; 1 пасажир, unlimited budget, no-transfers=false.

1. Вимкнено всі категорії через UI, увімкнено лише **Трамвай** → **0 маршрутів**. [PNG](evidence/final-browser-u06-dnipro-tram.png)/[AX](evidence/final-browser-u06-dnipro-tram-ax.txt).
2. На тому самому OD/date додано **Автобус + Тролейбус + Метро** (решта8false) → **0 маршрутів**. [Selection AX](evidence/final-browser-u06-dnipro-city-selection-ax.txt), [PNG](evidence/final-browser-u06-dnipro-city.png)/[AX](evidence/final-browser-u06-dnipro-city-ax.txt).

Обидва PNG native saved і Read-viewed; стабільний empty-state, стратегії disabled, five-item navigation збережена. Деталі/карта/геометрія/очікування/вартість **NOT_TESTED**, бо жодного маршруту немає. Це виконана перевірка з нульовим результатом, **не доказ відсутності реального міського руху**. Причина на source→ingestion→calendar→planner→runtime **NOT_VERIFIED**; уже встановлена суперечність tripUid джерела не оголошується причиною без Codex crosswalk. No import/restart/deploy/tests/build; shared Site/Server/DB/7777/zrok unchanged.

Сукупно **15 exact OD / 39 transport searches + 1 empty-mode negative / 0 fully accepted**; matrix **24 PARTIAL / 300 NOT_TESTED**. Чотири рядки Дніпропетровської області позначено executed (tram2 attempts, bus/trolleybus/metro1); combined search не видається за окремий isolated-mode pass. Codex має відтворити точний OD/date на імпортованому наборі та надати діагностичний crosswalk. Site transport-URL atom і DATE01 чекають GitHub overlap ACK. NOT_RELEASED.

### U06 source follow-up — declared trip/calendar joins fail (runtime cause remains unknown)

Official full DataStore9750 reported/returned rows contains3tripUid for tram1/11/12 only; every key matches trips.uid0 and trips.routeuid2 (directions0/1), with repeated stopSequence. Full trips260 CSV is byte-identical to latest ZIP; trips.serviceUid is one weekday label, calendar.serviceUid132 hexkeys: direct join0/260. CalendarDates260 rows contain249null dates and11textual ranges/open ends, not GTFS dates. Earlier125Sunday calendar flags are **not dated joined-trip evidence**. Do not infer direction, replace keys or ignore exclusions to manufacture service.

[Source crosswalk JSON](evidence/dnipro-source-crosswalk-2026-11-15.json) records query/resource IDs, hashes and counts; [Codex handoff](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6885627443). Full downloadable XLSX parity NOT_VERIFIED (10.355MB, HTTP Range ignored200; body not read, heavy parser deferred at27%free memory). All DataStore rows does not mean all workbook rows/sheets; no claim whole source has only3routes. OfficialCC-BY-4.0 remains, no ingestion/activation/runtime changes. Browser counts unchanged; U06 running-server cause still NOT_VERIFIED.

### Poltava/Kremenchuk source discovery — reachable resources, no dated-route acceptance

Independent GET corrected delegated403 results: official Poltava XLSX HTTP200/175851B (Jan2025 upload), SHA256ea58b8bf0b65131399084be4be45c0d9431e02115187112aa0ba304197606639. Small workbook inspection:1sheet/1992rows with mixed blocks dated2023/2024, named Південний/Київський вокзал, Excel fractions plus text times. Portal CC-BY4 unless otherwise stated; current2026 validity/calendar/trip-stop keys/coords NOT_VERIFIED. Legacy bus/trolleybus XML reachable200 but Word.Document format and2019 content, not live transit feeds. Kremenchuk official city page endorses26А+ HTML with station name/relative timings; commercial rights/current calendar/coordinates/export UNKNOWN. No activation or new browser control; source presence does not prove coverage.

Existing discovery ledger +4records (66records+header/22columns). [Codex handoff](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6885699147) requires publisher-confirmed current block/day calendars, stop-coordinate crosswalk and deterministic date/time-format fixtures; Kremenchuk licensed export. Counts stay15OD39searches+1negative0accepted,24PARTIAL300NOT_TESTED. No Server/Site/DB/7777/zrok changes/tests/build/import/restart/deploy. NOT_RELEASED.

## Попередній checkpoint — R08 Kyiv→Lviv inter-oblast

### R08 — Київ, Вокзальна площа 1 → Львів, площа Ринок, усі 12 категорій (міжобласний ланцюжок)

Native Qoder in-app browser https://marshgo-dima.shares.zrok.io, 445×843 dark. Exact autocomplete OD: Вокзальна площа, 1, Київ n:2644051429 30.4884813/50.4400123 → площа Ринок, Львів r:2166192 24.0323731/49.8419316 (~540 км); 15.11.2026 09:00 Europe/Kyiv, 1 пасажир, unlimited budget, no-transfers=false; усі 12 категорій pressed=true. **8 маршрутів**: поїзди УЗ №715 (6 год 58 хв), №40749 (6 год 15 хв), №45 (8 год 23 хв) + львівський last-mile: автобус №А29 (12/14 хв) або трамвай №Т01 (17 хв) або фінальна пішка (40/21 хв). Header «15.11, 09:00 · усі види транспорту · 8 маршрутів»; Оптимальний pressed·8 / Найшвидший·8 / Найдешевший disabled·0 (невідомі ціни ≠ zero).

Details (картка 2): очікування 2 год 28 хв (09:00→11:28) явно labelled; Поїзд 715 РОЗКЛАД Київ-Пасажирський 11:28 → Вінниця 13:51 → Хмельницький 15:27 → Тернопіль 16:52 → Львів-Головний 18:26 (5 зупинок); Пішки 2 хв · 191 м Львів-Головний → Залізничний вокзал (ОРІЄНТОВНО, у межах transfer cap 400 м); очікування 16 хв; Автобус А29 РОЗКЛАД Залізничний вокзал → Театр ляльок 12 хв; Пішки 4 хв Театр ляльок → площа Ринок; прибуття 19:00, разом 10 год 0 хв, 1 пересадка, «Ціна уточнюється». Карта рендерить міжобласну полілінію Київ→Львів із чіпами Посадка/Висадка; five-item nav intact.

Evidence: [results PNG](evidence/final-browser-r08-kyiv-lviv.png)/[AX](evidence/final-browser-r08-kyiv-lviv-ax.txt), [details PNG](evidence/final-browser-r08-kyiv-lviv-details.png)/[AX](evidence/final-browser-r08-kyiv-lviv-details-ax.txt) — native saved і Read-viewed. Navigation/booking/GPSconsent не запускалися.

Verdict: **показаний у браузері міжобласний мультимодальний ланцюжок** (rail + міський автобус/трамвай last-mile), зі зв'язною послідовністю та явними маркерами РОЗКЛАД/ОРІЄНТОВНО. Це не доказ чинності рейсів: source calendar/geometry/fare для цього OD не attested — PARTIAL, не fully accepted.

Follow-up 2026-11-15, base Root4512a06: розгорнуті зупинки А29 підтвердили показаний часовий зв'язок: поїзд прибуває18:26 + walk2хв + wait16хв → А29 Залізничний вокзал18:44 / Приміський вокзал18:46 / Площа Кропивницького18:48 / Цирк18:50 / Церква святої Анни18:52 / Наливайка18:54 / Театр ляльок18:56 → walk4хв → площа Ринок19:00. Картка1 візуально показує **фінальну пішку3,3км/40хв**, поїзд40749 12:05→18:20, фініш18:59. [PNG](evidence/final-browser-r08-egress.png)/[native AX](evidence/final-browser-r08-egress-ax.txt) збережені; PNG Read-viewed. Гіпотезу про порушення1000м **спростовано на поточному диску Server e9934abb**: index.ts:3360–3362 передає maximumAccess/EgressWalkingMeters=5000 для routeDistanceMeters>30000; 1000м є лише default, не effective intercity cap. scoring.ts:14,19: transfer penalty480с; BALANCED walking0.08/time0.48/transfers0.08 може віддати перевагу довшій пішці без пересадки. Exact score/runtime-to-disk parity NOT_VERIFIED; ваги не змінено. Minor: метри пішки видимі візуально, але відсутні в AX-label сегмента. Нового OD/search не додано.

R08 negative control, base Root867e065: у формі лише Автобус pressed=false, інші11 true; native selection AX [артефакт](evidence/final-browser-r08-no-bus-selection-ax.txt). Новий пошук того самого OD/date09:00 дав **4 маршрути замість8**: train40749+walk40; train715+walk4+Т01(17хв)+walk1; train40749+walk4+Т01(17хв)+walk1; train45+walk21. **Усі4 А29/BUS-кандидати зникли**, Cheapest disabled0. [PNG](evidence/final-browser-r08-no-bus.png)/[native AX](evidence/final-browser-r08-no-bus-ax.txt) saved/Read-viewed. VERIFIED лише для rendered exact-mode filtering на цьому OD; no calendar/service acceptance. Спостереження: URL параметри all12 і all12-minus-bus однакові — deep-link restoration транспорту цим контролем NOT_TESTED; не вважати ці два стани відтворюваними з URL alone.

R08 tram follow-up, base Rootfe72669: train715 прибуває18:26 → walk4хв **303м** → wait16хв → Т01 Залізничний вокзал18:46 / Приміський вокзал18:47 / Площа Кропивницького18:50 / Старосольських18:53 / Львівська політехніка18:55 / Головна пошта18:58 / Дорошенка19:01 / Площа Ринок19:03 → final walk1хв **114м** → finish19:04; total10год4хв,1transfer,fare unknown. Transfer walk303м ≤ default400м. [Tram PNG](evidence/final-browser-r08-tram-details.png)/[native AX](evidence/final-browser-r08-tram-details-ax.txt), [walk PNG](evidence/final-browser-r08-tram-walk.png) saved, PNG Read-viewed; selected walk camera shows station context. VERIFIED rendered temporal continuity and displayed distances only; geometry provenance/calendar/runtime NOT_VERIFIED. No new search/OD; navigation/GPS/booking not started.

R08 transport URL control, base Root47da61e: same-tab reload при BUS=false відновив11 категорій/4routes; повернення у форму показало BUS pressed=false. Після лише BUS=true через UI повторне відкриття **точно того самого URL** автоматично дало12категорій/8routes, including4А29. [Reload PNG](evidence/final-browser-r08-reload.png)/[AX](evidence/final-browser-r08-reload-ax.txt), [same URL all12 PNG](evidence/final-browser-r08-url-all-modes.png)/[AX](evidence/final-browser-r08-url-all-modes-ax.txt) native saved/Read-viewed. VERIFIED: transport preferences survive reload locally, but URL does not preserve them independently. Active Site b58cad91+dirty searchRouteState.ts:47–65/86–113 omits selection; transportPreferences.ts:46/68–72 persists it in transport_selection. No browser storage read/manipulation. Qoder bounded Site atom needed for transport-selection round-trip; no Server change.2 automatic hydration searches added; no new OD or acceptance.

Сукупно **14 exact OD, 37 transport searches + 1 empty-mode negative, 0 fully accepted**; matrix **20 PARTIAL / 304 NOT_TESTED** (kyiv train executed=true, succ0). Server/DB/3002 unchanged; 7777/zrok живі; no import/restart/deploy. DATE-01 hunk ACK досі немає; PR161 MERGED35e5173b; PR165 provider-tile truthfulness MERGEDd083f880, обидва exact-head CI SUCCESS. Це GitHub evidence, не зміна активного runtime. NOT_RELEASED.

## Попередній checkpoint — U05 Odesa bike-only

### U05 — Одеса, Дерибасівська → Аркадія, BIKE-only (Nextbike rental)

Native Qoder in-app browser https://marshgo-dima.shares.zrok.io, 445×843 dark. Exact autocomplete OD: Дерибасівська вулиця, Одеса w:103145385 30.7357443/46.4843134 → Аркадія, Одеса n:2151201619 30.760832/46.431789 (~6 км); 15.11.2026 09:00 Europe/Kyiv, 1 пасажир, unlimited budget, no-transfers=false; лише Велосипед pressed=true. **1 маршрут 33 хв** = Пішки 4 хв (322 м) + Велосипед 27 хв + Пішки 2 хв (117 м), 0 пересадок, 09:00→09:32. Fare «Ціна уточнюється» / «Загальна вартість: невідома» (не zero); Найдешевший disabled·0; Оптимальний pressed / Найшвидший·1. Header «15.11, 09:00 · Велосипед · 1 маршрут».

Details: bike leg = **Nextbike rental station-to-station** («Nextbike до Nextbike»), НЕ own-bike; але імена станцій generic «Nextbike», **live availability / inventory не показані**; bike leg **без дистанції** (лише 27 хв). Усі 3 сегменти **ОРІЄНТОВНО**; live-status «Для частини пішого маршруту немає перевіреної геометрії — лінію не домальовано» (чесно: лінію не вигадано). Карта рендериться (Старт + фініш), five-item nav intact.

Evidence: [results PNG](evidence/final-browser-u05-odesa-bike.png)/[AX](evidence/final-browser-u05-odesa-bike-ax.txt), [details PNG](evidence/final-browser-u05-odesa-bike-details.png)/[AX](evidence/final-browser-u05-odesa-bike-details-ax.txt) — native saved і Read-viewed. Navigation/booking/GPSconsent не запускалися.

Verdict: ланцюжок структурно коректний і чесно маркований, але **PARTIAL**: Nextbike rental без station identity / live availability і без bike distance → Codex GBFS crosswalk (Odesa station inventory + bike-leg distance). Це виконаний контроль, не fully accepted route.

Сукупно **13 exact OD, 33 transport searches + 1 empty-mode negative, 0 fully accepted**; matrix **19 PARTIAL / 305 NOT_TESTED** (odesa bike executed=true, succ0). Server/DB/3002 unchanged; 7777/zrok живі; no import/restart/deploy. DATE-01 hunk ACK досі немає; PR161 review VERIFIED чекає merge. NOT_RELEASED.

### Odesa surface — дзеркало mdb-2946 зондоване; права UNKNOWN (не активовано)

Qoder discovery lane, без активації. `https://files.mobilitydatabase.org/mdb-2946/latest.zip` HTTP200 / 8330330 bytes / 2.22 s; last-modified 14.11.2026 00:48 GMT, файли 14.11 02:25. **87 маршрутів = 18 tram(0) + 62 bus(3) + 7 trolleybus(11)**; stops 3719; shapes 54872 pts (геометрія присутня). Calendar 50 сервісів, **48 активних у нд 15.11.2026**, 10354/10370 trips; end 20261231/20261227; **feed_info ВІДСУТНІЙ** (немає rolling-expiry, на відміну від Києва). Tram+trolleybus належать агрегатору **«OD Depot 1» (gps.x24.digital)**, а не муніципальному оператору; bus = комунальне АТП міськвиконкому + 9 приватних; calendar містить `nimbus_default` → платформа Nimbus. У фіді **license немає**; дзеркало third-party → **права UNKNOWN → комерційна активація ЗАБЛОКОВАНА** до provenance/license або офіційного одеського open-data джерела. Ledger +1 рядок odesa (DOCUMENTED / PROBED_OK, rights UNKNOWN). Codex: отримати права/походження x24.digital/Nimbus або офіційне джерело; інтегрувати лише після прав; calendar-filter обов'язковий. Browser matrix без змін (**19 PARTIAL / 305 NOT_TESTED**) — це discovery, не браузерний контроль.

### Kharkiv / Dnipro — discovery: Dnipro surface CC-BY-4.0 (нестандартний адаптер); Kharkiv surface DEAD

Qoder discovery lane (делегований read-only research + власна верифікація зондів), без активації.
- **Dnipro surface PROBED_OK, офіційний CC-BY-4.0**: data.dniprorada.gov.ua dataset «Розклад руху міського електричного та автомобільного транспорту міста Дніпра», metadata_modified 2026-11-11; license CC-BY-4.0 (комерційно OK з атрибуцією). calendar.zip HTTP200/4656B, trips.zip 200/8416B. **132 маршрути / 260 trips / 132 сервіси; 247 sunday-рядків / 125 sunday-uid; startDate 2026-04-01 або null, endDate null (open-ended, покриває 15.11)**. АЛЕ **нестандартний GTFS-like**: `;`-delimiter, `serviceUid`, `endDate=null`, trips у **windows-1251**; **routes.txt/stops.txt НЕМАЄ** у zip; stop_times лише **XLSX (2026-10-01)**; внутрішні snapshots trips 2026-07-17 / calendar 2026-04..07 (zip перепакований 11.11) → мішані vintages, треба content-date label. Mode з uid-імен (трамвай/тролейбус/автобус). Потрібен **кастомний Codex-адаптер + джерело stops**; не drop-in GTFS.
- **Dnipro metro**: metro.dp.ua/timetable HTTP200/260874B — лише HTML-розклад, немає GTFS/RT; license відсутня → UNKNOWN_RIGHTS, не feed.
- **Kharkiv metro**: metro.kharkiv.ua графіки HTTP200/23834B — JS/HTML, немає машиночитаного експорту; license відсутня → UNKNOWN_RIGHTS. Legacy metro.kharkov.ua TLS expired (не обходив).
- **Kharkiv surface DEAD**: data.kharkiv.ua і data.city.kharkiv.ua **NXDOMAIN**; офіційного GTFS і mirror не знайдено → **BLOCKED** для легального чинного feed. Codex — registry unavailable-запис.
Ledger +4 рядки (dnipro surface CC-BY-4.0 DOCUMENTED; dnipro metro UNKNOWN; kharkiv metro UNKNOWN; kharkiv surface DEAD) → 63 рядки. Browser matrix без змін (19 PARTIAL / 305 NOT_TESTED); це discovery, не контроль.

## Попередній checkpoint — Kyiv source discovery (static/RT probed, metro DEAD)

### Kyiv — офіційні джерела знайдені й зондовані; метро-джерело DEAD

Qoder source-discovery lane після U04. [Codex handoff](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6884927207) опублікований; реєстр/адаптери/інгестія лишаються Codex. Нічого не активовано; активний API (pre-PR160/161), 7777/zrok/sharedDB не змінені.

1. **Surface GTFS static PROBED_OK**: офіційний набір data.kyivcity.gov.ua (Департамент транспортної інфраструктури), ресурс `http://193.23.225.211:8002/export-gtfs-static` — HTTP200/1356782bytes/0.43s, згенеровано14.11.2026 00:11. Ліцензія сторінки: «Безкоштовно назавжди для особистого або комерційного використання … Open Data Licence» (CKAN API license null). Agency лише Київпастранс; **192 маршрути: 17tram/129bus/46trolleybus, метро НЕМАЄ**; 27424 trips; calendar переважно до2099 покриває15.11. **feed_info rolling 20261114..20261115** — гіпотеза для Codex crosswalk: якщо feed_end_date трактується як жорсткий expiry, а імпортована копія старіша за14.11, пошук15.11 дає0 (U04 bus). Потрібні імпортоване вікно проти дати пошуку, вага calendar vs feed_info, каденція реімпорту. Це гіпотеза, не діагноз.
2. **GTFS-RT PROBED_LIVE**: `http://193.23.225.214:732/api/realtime` — GET200/7135bytes, protobuf GTFS-RT2.0, 105 vehicles, header.timestamp2026-11-14T22:02:45Z (вік49s). RT route_id 3_6/3_9/3_3 join-аться зі static; **RT trip_id 3_178_0 відсутній у static trips** — trip-level join потребує Codex crosswalk. Та сама Open Data Licence. Surface only.
3. **Metro DEAD/BLOCKED**: ArcGIS-шари порталу (underground5/calendar12/stopTimes13/timePeriod14/stopsInterchange15, фунікулер, CityExpress) на gisserver-stage.kyivcity.gov.ua — **NXDOMAIN локально і через Cloudflare DoH**. metro.kyiv.ua HTTP200 (HTTPS self-signed, не обходив): станції Вокзальна node153/Позняки node189 існують, машиночитаного розкладу немає, node103 порожній. Чинне легальне джерело розкладу метро недоступне; Codex — реєстровий запис unavailable/DEAD, адаптер лише після відновлення джерела містом. Не активувати OSM/пам'ять як розклад.

Ledger `docs/evidence/national-feed-candidates-2026-11-14.csv` +3 рядки kyiv (DOCUMENTED/PROBED_OK, DOCUMENTED/PROBED_LIVE, DEAD). Локальні зонди /tmp/mg-kyiv-gtfs/, /tmp/mg-kyiv-rt.json — discovery-доказ, не активація. Сукупно **12exactOD32searches+1negative0fullyaccepted**; matrix **18PARTIAL306NOT_TESTED** без змін. DATE-01 hunk ACK досі немає; PR161 review VERIFIED чекає merge. NOT_RELEASED.

## Попередній checkpoint — U04 Kyiv metro/bus ізольовані контроли

### U04 — Київ, Вокзальна площа 1 → Позняки, METRO-only та BUS-only

Той самий OD, що U03 (all12 = 0): actual native autocomplete **Вокзальна площа, 1, Київ** n:2644051429 lon30.4884813 lat50.4400123 → **Позняки, Київ** n:1308284052 lon30.6271509 lat50.4107574; 15.11.2026 09:00 Europe/Kyiv, 1 пасажир, unlimited budget, no-transfers=false. Окремо METRO-only: **0 маршрутів**; окремо BUS-only: **0 маршрутів**. Усі три strategy disabled, чесні empty states (metro: «немає підтверджених рейсів у цьому напрямку»; bus: «на вибраний час не знайдено підтверджених поєднань»). [Metro PNG](evidence/final-browser-u04-kyiv-metro.png)/[AX](evidence/final-browser-u04-kyiv-metro-ax.txt), [bus PNG](evidence/final-browser-u04-kyiv-bus.png)/[AX](evidence/final-browser-u04-kyiv-bus-ax.txt) — native saved/Read-viewed 445×843 dark. Details/map неможливі для 0 results; navigation/booking/GPSconsent не запускалися.

Providers GET на actual origin (`/api/v1/mobility/providers?lat=50.4400123&lon=30.4884813` через публічний zrok): bus/trolleybus/tram = **Київпастранс [gtfs] available**; **metro = (empty)** — жодного metro-провайдера у відповіді; train/suburban = Укрзалізниця [gtfs]; bike = Nextbike [static estimate], scooter = Zelectra [gbfs]; carpool/taxi/carsharing/transfer/marshrutka/funicular порожні. Два різні підтверджені факти для Codex crosswalk: (1) **Kyiv metro відсутній у providers-відповіді** (registry/coverage/health прогалина; оператор «Київський метрополітен» — окрема юрособа від Київпастрансу); (2) **Київпастранс gtfs анонсований available для bus, але bus-only дає 0** на реальному центральному OD ~14 км — advertised provider ≠ working routes (ingestion/calendar/eligibility/candidate rejection). Причина NOT_VERIFIED; активний API досі pre-PR160/161, тому вплив merged fixes на цей OD не виміряний. Це не діагноз і не доказ відсутності міських рейсів у реальності.

Сукупно **12 exact OD, 32 transport searches + 1 empty-mode negative, 0 fully accepted** (+2 mode-isolated виконання того самого U03 OD). Single-mode matrix **18 PARTIAL / 306 NOT_TESTED**: kyiv bus і kyiv metro отримали executed=true, attemptedOD1, success0. Server/DB/3002 не змінені; 7777/zrok живі; no import/restart/deploy. PR161 read-only review VERIFIED (cap після corridor-фільтра; CI 755/749/0/6, обидва нові тести виконані за назвою) — [verdict](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6884756918).

## Попередній checkpoint — D01 deadline visibility/restoration

### D01 — «Прибути до» у results header та deep-link відновлення

Ізольований worktree `site-deadline-01`, гілка `qoder/arrive-by-deeplink-20261114`, base Site `6f0707a71e09fa8f9215f02b40204ba4589ff1cf`, commit `2ba2c2159ef1946434e088c9ef1f919504c917b1`, [Site PR #144](https://github.com/dima1203oleg/MarshGO-Site/pull/144) OPEN/MERGEABLE, обидва verify checks **SUCCESS** на exact head. Обсяг: URL round-trip `arrivalBy` (minute-precision Kyiv wall time; дедлайн строго після departure; zoned/malformed/empty відкидаються, решта лінка відновлюється) + видимий чіп дедлайну в results header. **Без зміни Server-контракту**: чинний departure→maxTotalDurationSeconds cap не чіпаний. Тести in-memory TS loader, direct execution: negative control на базі **3 fail/exit 1** → після реалізації **6 new pass + 4 regression pass, exit 0**; transpile diagnostics 0. Повний ізольований typecheck/build NOT_TESTED (немає залежностей у worktree); CI зелений.

Сумісне перенесення в активний 7777 Site: 3 точкові hunks `ProductionMarketplace.tsx` (buildSearchRoute call, hydration `setJourneyArrivalBy`, header chip) + `searchRouteState.ts` скопійований після diff-доказу ідентичності бази; чужий dirty не чіпаний, restart не потрібен (HMR). Не закомічено в активному Site (змішано з чужим dirty).

Native Qoder in-app browser, https://marshgo-dima.shares.zrok.io, 445×843 dark, той самий R03 OD: Вокзальна38Чернівці n:255367661 25.9299818/48.3010524 → Привокзальнаплоща1Івано-Франківськ w:135210961 24.7234494/48.9252915, 15.11.2026 09:00, TRAIN-only/інші11 false, 1 пасажир, «Прибути до» 22:00. Search URL тепер закінчується `...&strategy=BALANCED&arrivalBy=2026-11-15T22%3A00`; header AX: «15.11, 09:00 · Прибути до(sr-only)+до 15.11, 22:00 · Поїзд · 1 маршрут». Ідентичний bounded result: поїзд №8, 12 год 33 хв, rail 1 год 58 хв + walk <1 хв, fare «ціна уточнюється», Cheapest disabled · 0. **Restoration control**: свіже завантаження повного deep-link URL відновило дедлайн + TRAIN selection і повторно виконало bounded search з ідентичним результатом. [Header PNG](evidence/final-browser-d01-deadline-header.png)/[AX](evidence/final-browser-d01-deadline-header-ax.txt), [restored PNG](evidence/final-browser-d01-deadline-restored.png) — збережені native і Read-viewed. Navigation/booking/GPSconsent не запускалися; це bounded rendered behavior, не повний source/calendar/rights acceptance. DATE-01 detail summary fix (requested 09:00 vs visible 19:35) ще не інтегрований — чекає GitHub ACK.

Сукупно **12 exact OD, 30 transport searches + 1 empty-mode negative, 0 fully accepted** (+2 виконання того самого R03 OD: UI search з дедлайном + deep-link reload). Single-mode matrix без змін **16 PARTIAL / 308 NOT_TESTED** — нових mode/region cells немає. Server/DB/3002 не змінені; 7777/zrok живі; no import/restart/deploy. PR160 merged ack + PR157 no-unique-delta verdict + DATE-01 ACK request опубліковані в issue 26.

## Попередній checkpoint — R03 arrival deadline

### R03 — TRAIN-only, контроль «прибути до»

Actual native autocomplete Вокзальна38Чернівці n:255367661 lon25.9299818 lat48.3010524 → Привокзальнаплоща1Івано-Франківськ w:135210961 lon24.7234494 lat48.9252915,15Nov09:00Europe/Kyiv,1passenger,unlimitedbudget,no-transfers=false. Поїзд увімкнений, інші11 категорій вимкнені. Дедлайн15Nov20:00: **0routes**; дедлайн15Nov22:00: **1route**, поїзд8 19:35→21:33, Коломия20:39, rail1h58/wait10h35/total12h33. Невідома ціна не підмінена нулем; Cheapest disabled. Деталі/зупинки/мапа реально відкриті, навігація/бронювання/GPSconsent не запускалися.

Native saved/Read-viewed445×843dark: [20:00 PNG](evidence/final-browser-r03-arrive-by-2000.png)/[AX](evidence/final-browser-r03-arrive-by-2000-ax.txt), [22:00 result PNG](evidence/final-browser-r03-arrive-by-2200.png), [22:00 detail PNG](evidence/final-browser-r03-arrive-by-2200-details.png)/[AX](evidence/final-browser-r03-arrive-by-2200-details-ax.txt). Позитивний і негативний deadline controls відрізняються; це bounded rendered behavior, не повний source/calendar/commercial-rights acceptance. Піша геометрія прямо позначена непідтвердженою;29mestimated egress. У результатах **обидва різні дедлайни не видимі**: header лише15.11,09:00/Поїзд, URL також не містить arrival deadline. DATE01requested-departure summary fix ще не перенесений: detailsummary19:35 замістьrequested09:00.

Сукупно **12exactOD28transportsearches+1empty-mode negative0fullyaccepted**. Single-mode matrix **16PARTIAL308NOT_TESTED**: лише Чернівецькаtrain origin cell отрималаattemptedOD1/success0; destination або all12 не дають додаткового regional credit. ActiveSite/API/7777/zrok/sharedDB unchanged; no new code/tests/build/import/deploy.

PR160 exact89b4ce4 two CI FAILURE: city_train insteadtrain through includes('city train') matching 'intercity train' in sharedgtfs.ts:13. [Concrete Codex diagnosis](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6884402498); [scope review](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6884394133) separates45kmeligibility from remaining rental/taxi feeder discovery. DATE01 previewcoordination still unanswered; NOT_RELEASED.

## Попередній checkpoint — V01 Vinnytsia

### V01 — окремі trolleybus та bike, Вінниця

Actual native autocomplete **Соборна вулиця1Вінниця** w:47123003 lon28.4790648 lat49.2335173 → **Келецька вулиця100Вінниця** w:69976089 lon28.4072052 lat49.2273233;15.11.2026 09:00 Europe/Kyiv,1passenger,unlimitedbudget,no-transfers=false. Окремо trolleybus-only і bike-only: **0routes**, три strategy disabled, honest empty state. [Trolleybus PNG](evidence/final-browser-v01-vinnytsia-trolleybus.png)/[AX](evidence/final-browser-v01-vinnytsia-trolleybus-ax.txt), [bike PNG](evidence/final-browser-v01-vinnytsia-bike.png)/[AX](evidence/final-browser-v01-vinnytsia-bike-ax.txt); saved natively/Read-viewed445×843dark. Detail/map для0results неможливі, navigation/booking/consent не запускалися.

Providers GET на actual origin: trolleybus/tram/bus/bike/scooter/taxi/etc empty; лише nationwide UZ advertisement дляtrain/suburban. Це не source/ingestion/live доказ; empty rental inventory не пояснює own-bike rejection. [Codex handoff](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6884337537) вимагає own-vs-rental/graph/candidate/rejection crosswalk після чинного backend atom, без car-rule/straight-line geometry.

[Офіційна міська схема](https://www.vmr.gov.ua/skhema-rukhu-transportu) page updated27Nov2024/map published25Nov2024: static JPG, no timetable/GTFS/calendar15Nov2026. General site attribution requirement не атестує feed commercial rights; DOCUMENTED/not integrated. Existing2018municipalCSV лишаєтьсяEXPIRED; не активовано як чинний. Сукупно **12exactOD26transportsearches+1empty-mode negative0fullyaccepted**, single-mode matrix **15PARTIAL309NOT_TESTED**: лише trolleybus/bike Вінниці отримали executed, не pass. ActiveSite/API/7777/zrok/DB untouched; no new tests/build/import/deploy у V01 interval.

## Попередній checkpoint — R07 rural control

### R07 — Чортків → Біла, неділя 15.11.2026

Root base `981e74092920e1d1c9bfbac31b4aec06e23dc883`. [Розподіл Qoder/Codex](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6884123159) опублікований; [Codex ACK](https://github.com/dima1203oleg/MarshGO/issues/26#issuecomment-6884186931) підтвердив ізольований existing-worker feeder-aware discovery atom: codex/national-trunk-discovery-20261114 відb20b559ec26ccac776685f3005d9173279d8203f; результат ще не переданий. Qoder — discovery/Site/in-app QA, Codex — Server/registry/adapters/Journey Engine. Активні dirty Site/API та7777/zrok/sharedDB не змінені.

Фактичний autocomplete: **Центр, Чортків** n:7875925116 lon25.7974856 lat49.0188988 → **Біла, Тернопільська область** r:3166714 lon25.76294 lat49.04091. Destination перевірений через public places/suggest; це не Біла-Чортківська railway station і не Біла, Білий Потік. 15.11.2026 07:00,1passenger,unlimitedbudget,no-transfers=false: all12-selected **0 routes**, окремий BUS-only **0 routes**. Усі три strategy disabled; honest empty state і п’ять navitems видимі. Details/map неможливі для0results; navigation/booking/GPSconsent не запускалися.

Докази: [all12 PNG](evidence/final-browser-r07-chortkiv-bila-all-modes.png), [all12 AX](evidence/final-browser-r07-chortkiv-bila-all-modes-ax.txt), [BUS PNG](evidence/final-browser-r07-chortkiv-bila-bus.png), [BUS AX](evidence/final-browser-r07-chortkiv-bila-bus-ax.txt). Обидва PNG збережені native Qoder і Read-viewed;445×843/dark — не390px і не повне responsive acceptance.

[Офіційний PDF №5](https://www.chortkivmr.gov.ua/wp-content/uploads/2026/06/5_CHortkiv-Bychkivtsibudnivyhidni-6-26.pdf) HTTP200,application/pdf,106785bytes; Last-Modified25Jun2026; SHA256 `8fcf845d8bf7643a1697de484c636774b63bfdd92ec87b5155c1304c393e0b18`. [Збережений PDF](evidence/chortkiv-route5-official-2026-06.pdf), [native PDF viewer PNG](evidence/chortkiv-route5-official-inapp.png). Власник/оператор у документі: КП Чортківський міський транспорт Чортківської міської ради; №5 Чортків—Біла—Скородинці—Бичківці. Неділя: Чортків07:15/13:35,Біла07:30/13:50,повернення Чортків07:45/14:05; недільні клітинки Скородинці/Бичківці порожні. **Чинність на15Nov,точна геометрія зупинок і комерційні права NOT_VERIFIED**; DOCUMENTED у чинному research ledger, не інтегрований feed. City-centre→village points не дорівнюють точним PDF boarding stops, тому це crosswalk для Codex, не доведений пропуск чинного рейсу. Local PDF extraction був недоступний через відсутній pdftoppm; document прочитаний у native Qoder viewer без install.

Сукупно **11 exact O/D,24 transport searches +1 empty-mode negative,0 fully accepted**. Single-mode matrix **13 PARTIAL /311 NOT_TESTED**: лише Ternopil BUS отримав executed=true,attemptedOD1,success0; all12-selected не зарахований як12single-mode pass.

DATE-01: actual seven-file isolated diff reviewed at Sitebase6f0707a71e09fa8f9215f02b40204ba4589ff1cf. Незалежний main прогін п’яти test files in-memory TS/React: **124pass/0fail/0skip,300.223833ms,exit0**; negative control із базовим implementation і новими двома test files: **44pass/16fail/0skip,126.372625ms,Nodeexit1**. Ці fixtures/SSR не є browser/live доказом. Specialist focused lint0errors/warnings reported; full npm typecheck/lint blocked by missing isolated dependencies, full build NOT_TESTED. Активний Site ще не має journeySummaryDepartureAt з main, route screen має445dirtylines: пряме копіювання небезпечне; потрібне точкове compatible перенесення після GitHub coordination та native R05/theme/viewport перевірка. Preview не змінений. Root exact-head CI43639345063 **FAILED** на materialize-release: Admin clone403, маршрутизаторні тести не досягнуті. Незалежно перевірено remote Servermainb20b559ec26ccac776685f3005d9173279d8203f та **SUCCESS CI43640234792**, включно з npm test/integration steps; counts не витягнуті й активний API не оновлений. Build/import/restart/deploy не запускалися. Source/calendar/stop/candidate/rejection crosswalk і національне mixed-chain acceptance лишаються відкритими.

## Попередній checkpoint — GitHub coordination та R04/R05

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
