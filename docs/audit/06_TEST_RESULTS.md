# Результати перевірок

Дата: 12.10.2026. У таблицях вказано конкретні локальні SHA та CI run. Проходження build не вважається доказом production-приймання.

## Локальні перевірки трьох кодових баз

| Репозиторій | SHA / середовище | Перевірки | Результат |
|---|---|---|---|
| MarshGO (legacy branch) | `a008749cbc6b8dadd6eb15ff51c861b08f507e3f`, Node 24.21.0 через тимчасовий `npx --package=node@24.21.0` | `npm run check:production`; окремий `npm test` | Production check: exit 0 (typecheck, lint, unit, build, bundle). Unit: 230 тестів, 229 pass, 0 fail, 1 skipped. DB-backed integration і browser E2E рахуються окремо нижче. |
| MarshGO-Server | `cf82c68bc00d343f3a4e691e860259f5ca1acd04`, Node 24.21.0 | typecheck, lint, `npm test`; GitHub Actions [38279343797](https://github.com/dima1203oleg/MarshGO-Server/actions/runs/38279343797) | Локально 158 тестів: 157 pass, 0 fail, 1 opt-in integration skipped. CI для цього SHA пройшов PostGIS/Redis integration suite. |
| MarshGO-Site | `570ea7b9faa3d55a7e24599657c86fb2903d4cce`, Node 24.21.0 | typecheck, lint, `npm test`, production build, bundle check; GitHub Actions [38295522056](https://github.com/dima1203oleg/MarshGO-Site/actions/runs/38295522056) | 60 тестів pass, 0 fail, 0 skipped; build і bundle перевірки успішні. Звітний bundle audit: 17 JS chunks, gzip до 350 KB; MapLibre chunk 275.7 KB gzip. |
| MarshGO-iOS | `68f69a32886d6db248bbac627b78f076bc7efe7a`; Simulator CI [38286540826](https://github.com/dima1203oleg/MarshGO-iOS/actions/runs/38286540826) | Capacitor sync / Xcode Simulator build за workflow | Simulator build успішний. Це не підтверджує фізичний GPS, APNs, background location, signing або App Store readiness. Workflow pin використовує Site SHA `1745822ce1162dcaee2728fd87f2593844960268`, предка поточної перевіреної Site гілки; потрібна нова збірка з конкретно погодженим актуальним Site SHA. |

## Повторний CI старого MarshGO

Pull request: [MarshGO #1](https://github.com/dima1203oleg/MarshGO/pull/1), SHA `34ad4798237ef836da3c652daf762984cc7bd908`, run [38297112997](https://github.com/dima1203oleg/MarshGO/actions/runs/38297112997).

Поточний повторний run завершив успішно такі етапи: встановлення залежностей, Bun audit, lint, typecheck, unit tests, міграція ізольованої CI БД, API integration, build, bundle check і матеріалізація release package. Перший запуск на тому самому SHA мав один `ECONNRESET` у DB/API integration test; повторний API integration suite пройшов. Це слід відстежувати як нестабільність.

Повний висновок цього старого run відкладений: на останній перевірці виконувався `npm run test:e2e` із Site SHA `1745822…`, зафіксованим у manifest. Повторне попереднє CI на цьому SHA дало 5 pass / 7 fail; частина тестів перевіряла UI, який уже змінений у Site `570ea7b…`. Manifest зараз оновлюється на перевірений Site SHA, і саме наступний root CI буде основним актуальним E2E результатом. Browser compatibility для нового SHA теж має пройти окремо.

## Тестове покриття та межі

- У Site branch `570ea7b…` всі канонічні результати та маршрутні референси з наданих вкладень перевірено за SHA-256: світло-темна дошка, світлі деталі й карта та чотири фінальні темні кадри побайтно збігаються з файлами `docs/design/canonical/**`. Site `npm test` включає перевірку цілісності цих reference assets. Це доводить правильність еталонних файлів; саме по собі не доводить pixel-diff готового UI. |
- Локальні unit та окремі CI integration результати відтворювані для наведених SHA.
- Server локальні integration тести за замовчуванням не запускаються без явного opt-in; green локальний `npm test` сам по собі не є доказом DB/Redis integration.
- Legacy API integration у GitHub використовує ephemeral PostGIS/Redis service. Локальні persistent база й Redis не очищалися.
- Немає підтвердження живих OTP/SMS, зовнішніх партнерських booking API, production database, production backup/restore, фізичного iPhone acceptance чи реального навантажувального тесту.
- Браузерні E2E і Chromium/Firefox/WebKit треба оцінювати лише за повним GitHub run; не переносити історичні `5/7` як актуальну цифру.

## Наступний крок

Отримати фінальний стан run `38297112997`, записати браузерні E2E результати та причини кожного невдалого сценарію, якщо вони є. Після кожної зміни повторити відповідні тести на новому точному SHA та оновити цей звіт.


## Оновлення після baseline

| Репозиторій | SHA / середовище | Перевірки | Результат |
|---|---|---|---|
| MarshGO legacy | локальний робочий набір після змін E2E/GTFS timestamp; parent `1e8fbca…` | `npm run check:production`, `npm test` | exit 0: typecheck, lint, unit, build і bundle audit. Unit suite: **232 total, 231 pass, 0 fail, 1 opt-in integration skip**. Browser E2E на root SHA до цих змін: run [38301176574](https://github.com/dima1203oleg/MarshGO/actions/runs/38301176574), 6 pass / 6 fail. |
| MarshGO-Server | `4e32ac3ede97aff715d0604dcf02af7fedd00547` | локально typecheck/lint/unit; GitHub push CI [38305019352](https://github.com/dima1203oleg/MarshGO-Server/actions/runs/38305019352) і PR CI [38305024597](https://github.com/dima1203oleg/MarshGO-Server/actions/runs/38305024597) | локально 160 pass / 1 opt-in integration skip; exact-SHA CI успішний, включно з DB/PostGIS/Redis integration. |
| MarshGO-Site | `570ea7b9faa3d55a7e24599657c86fb2903d4cce` | Site CI [38295522056](https://github.com/dima1203oleg/MarshGO-Site/actions/runs/38295522056) | 60 тестів pass; typecheck/lint/build/bundle успішні. |
| MarshGO-iOS | `d9a9c4392031cb08b2ecbc31cb959d44e483ab72` | exact-SHA push CI [38303892342](https://github.com/dima1203oleg/MarshGO-iOS/actions/runs/38303892342), PR CI [38303901032](https://github.com/dima1203oleg/MarshGO-iOS/actions/runs/38303901032) | обидві Simulator/Capacitor перевірки успішні; workflow пінить Site `570ea7b…`. Фізичний пристрій не тестувався. |

Root unit-test count підтверджено локальним друкованим результатом вище. Точний root commit SHA буде додано після коміту; E2E після оновлення manifest/селекторів та browser-compat залишаються очікуваними; production/staging, physical iOS і навантажувальні перевірки не виконані.
