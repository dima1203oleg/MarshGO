# Попередній release manifest

Дата знімка: 12.10.2026. Це контрольна відправна точка аудиту, **не release candidate** і не інструкція для deployment.

| Компонент | Репозиторій / гілка | SHA | Статус доказу |
|---|---|---|---|
| Backend | [MarshGO-Server](https://github.com/dima1203oleg/MarshGO-Server), `codex/sync-mobility-registry` | `cf82c68bc00d343f3a4e691e860259f5ca1acd04` | Локальні typecheck/lint/unit pass; CI integration pass. Не підтверджено production. |
| Frontend | [MarshGO-Site](https://github.com/dima1203oleg/MarshGO-Site), `codex/sync-journey-mobility-ui` | `570ea7b9faa3d55a7e24599657c86fb2903d4cce` | Локальні typecheck/lint/tests/build pass; CI pass. Root test manifest оновлений на цей SHA для E2E; новий повний root CI ще очікується. Не підтверджено розгортання проти цієї Server версії. |
| iOS | [MarshGO-iOS](https://github.com/dima1203oleg/MarshGO-iOS), `codex/reliable-capacitor-sync` | `68f69a32886d6db248bbac627b78f076bc7efe7a` | Simulator CI pass; workflow Site pin `1745822ce1162dcaee2728fd87f2593844960268`, не SHA audited Site. |
| Legacy integration / release material | [MarshGO](https://github.com/dima1203oleg/MarshGO), `codex/marshgo-production` | `6d4b254` + manifest update у наступному audit commit | Аудит/E2E/release матеріали ще тут; фінальний migration не виконаний. |

## Контракт і база даних

- API contract version: **не зафіксована** як кросрепозиторний release contract у перевіреному manifest.
- DB migration version: legacy містить файли до `047`, Server — до `044`; ці числа не сумісні як спільна версія через SQL-колізії `041`, `043`, `044`.
- Конфігурація staging: не включаємо секрети в manifest. Перевірений production/staging deployment target не зафіксований.
- `RELEASE_MANIFEST.json` legacy зафіксував Server `cf82c…`, Site `570ea7b…`, iOS `68f69a…`, `NOT_RELEASED`, production false. Manifest Site pin оновлюється для E2E перевірки актуального UI; iOS workflow ще pin-ить Site `1745822…`, отже набір SHA все ще не синхронізований і не можна використовувати як RC.

## Рішення

Немає узгодженого RC. Не збирати production release із цього документа. Після міграції/паритету та повного тестування створити окремий manifest із точними SHA, contract version, migration ledger hash та CI URLs.


## Перевірена актуалізація SHA

Root `RELEASE_MANIFEST.json` оновлено після passing CI точними candidate pins:

| Компонент | SHA | Перевірка |
|---|---|---|
| Server | `4e32ac3ede97aff715d0604dcf02af7fedd00547` | exact-SHA push/PR CI pass; corridors, stop arrivals, timestamp semantics |
| Site | `570ea7b9faa3d55a7e24599657c86fb2903d4cce` | Site CI pass; shared web/PWA source |
| iOS | `d9a9c4392031cb08b2ecbc31cb959d44e483ab72` | exact-SHA push/PR Simulator CI pass; pins Site above |
| API contract | `v1` | version field in manifest; cross-repo E2E rerun pending |
| Database | migration `048` in candidate Server tree | CI applied on clean PostGIS DB; no existing/staging-data rehearsal |
| Release status | `NOT_RELEASED`; `production_ready=false` | unchanged |

Manifest is a reproducible build pin, not evidence that the full release candidate or production service passed acceptance. Root browser E2E and browser-compat must pass on the exact combined release SHA before RC review.
