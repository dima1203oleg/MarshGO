# Попередній release manifest

Дата знімка: 12.10.2026. Це контрольна відправна точка аудиту, **не release candidate** і не інструкція для deployment.

| Компонент | Репозиторій / гілка | SHA | Статус доказу |
|---|---|---|---|
| Backend | [MarshGO-Server](https://github.com/dima1203oleg/MarshGO-Server), `codex/sync-mobility-registry` | `cf82c68bc00d343f3a4e691e860259f5ca1acd04` | Локальні typecheck/lint/unit pass; CI integration pass. Не підтверджено production. |
| Frontend | [MarshGO-Site](https://github.com/dima1203oleg/MarshGO-Site), `codex/sync-journey-mobility-ui` | `570ea7b9faa3d55a7e24599657c86fb2903d4cce` | Локальні typecheck/lint/tests/build pass; CI pass. Не підтверджено розгортання проти цієї Server версії. |
| iOS | [MarshGO-iOS](https://github.com/dima1203oleg/MarshGO-iOS), `codex/reliable-capacitor-sync` | `68f69a32886d6db248bbac627b78f076bc7efe7a` | Simulator CI pass; workflow Site pin `1745822ce1162dcaee2728fd87f2593844960268`, не SHA audited Site. |
| Legacy integration / release material | [MarshGO](https://github.com/dima1203oleg/MarshGO), `codex/marshgo-production` | `a008749cbc6b8dadd6eb15ff51c861b08f507e3f` (до audit docs) | Аудит/E2E/release матеріали ще тут; фінальний migration не виконаний. |

## Контракт і база даних

- API contract version: **не зафіксована** як кросрепозиторний release contract у перевіреному manifest.
- DB migration version: legacy містить файли до `047`, Server — до `044`; ці числа не сумісні як спільна версія через SQL-колізії `041`, `043`, `044`.
- Конфігурація staging: не включаємо секрети в manifest. Перевірений production/staging deployment target не зафіксований.
- `RELEASE_MANIFEST.json` legacy на цьому branch зафіксував Server `cf82c…`, Site `1745822…`, iOS `68f69a…`, `NOT_RELEASED`, production false. Це не відповідає audited latest Site SHA і не можна використовувати без узгодження.

## Рішення

Немає узгодженого RC. Не збирати production release із цього документа. Після міграції/паритету та повного тестування створити окремий manifest із точними SHA, contract version, migration ledger hash та CI URLs.
