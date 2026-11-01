# MARSHGO — QODER STATUS

Останнє оновлення: 2026-11-01T18:50Z · Агент: Qoder (Qwen Coder) · Мова звітів: українська

## Поточна задача
Налаштування GitHub-handoff (ці документи) поверх завершеного циклу «карпул-життєвий цикл + целові таймстемпи на канонічних prod-образах».

## Фазa
Координаційний чекпойнт опубликовано; продуктова робота продовжується за `[NEXT_ACTIONS.md](../../NEXT_ACTIONS.md)`.

## Статус продакшну
`NOT_RELEASED`. Стейджинг і production-deploy gate не пройдені — немає авторизованого цільового середовища (рішення власника C).

## Реальні шляхи репозиторіїв
| Реппозиторій | Шлях | Гілка | HEAD | Синхронізація |
|---|---|---|---|---|
| MarshGO (root, координація релізу) | `/Users/dima1203/Desktop/MarshGO` | `qoder/checkpoint-20261031` | `344eaa4` | 0 behind / 0 ahead |
| MarshGO-Server | `/Users/dima1203/Desktop/MarshGO/MarshGO-Server` | `qoder/uploads-perm-fix-20261101` | `959e547` | 0 behind / 0 ahead |
| MarshGO-Site | `/Users/dima1203/Desktop/MarshGO/MarshGO-Site` | `qoder/site-ui-polish-20261031` | `fef697e` | 0 behind / 0 ahead |
| MarshGO-Admin | `/Users/dima1203/Desktop/MarshGO-Admin` | `qoder/admin-email-auth-moderation-20261031` | `4eb5d15` | 0 behind / 0 ahead |
| MarshGO-Partner | `/Users/dima1203/Desktop/MarshGO-Partner` | `qoder/partner-email-auth-20261031` | `544e5d8` | 0 behind / 0 ahead |
| MarshGO-iOS | `/Users/dima1203/Desktop/MarshGO/MarshGO-iOS` | `codex/production-site-sync-20261014` | `4353cec` | чисте дерево (гілка Codex, не чіпано) |

## Зроблено (зdiff-підтвердження, див. QODER_CHANGELOG.md)
- `server/index.ts` — список бронювань тепер вибирає `b.completed_at`, `b.cancelled_at` (defect COMPLETED-AT-1).
- `tests/bookings-list-lifecycle-columns.test.ts` — регрес-захист тих самих стовпчиків.
- `tests/object-storage-local-fallback.test.ts` — локальний fallback сховища + чесний 503 при недоступному томi.
- `ops/docker/Dockerfile.server` (root) — `chown node:node /app/.uploads` до `USER node`: усунуто блокувач публікації поїздки.
- Докази й стани — у `RELEASE_MANIFEST.json` (ключі `canonical_carpool_*`, `completed_at_fix_2026_11_01`, `resume_state_2026_11_01_late`).

## В процесі / не закрито
- #60 SOLDOUT-OFFER-404-1, #56 PORTAL-MODERATION-UI-1, #33 DATA-QUALITY-LABEL-1, #35 ROUTES-COLD-PATH-1, #36 SEARCH-LATENCY-1 (+ #52, #54), GATE-03 iOS.

## Прогнані тести (свіжі, цей цикл)
- `npx tsx --test tests/*.test.ts` (MarshGO-Server, повний прогін перед a5ec118): **412 тестів · 409 pass · 0 fail · 3 skipped**; `eslint` і `tsc --noEmit` чисті.
- `npx tsx --test tests/bookings-list-lifecycle-columns.test.ts`: **2 pass · 0 fail**.
- Деталі та команди — `EVIDENCE_INDEX.md`.

## Загальнопроєктні лічильники (не пере-запущені цього циклу)
`CODEX_PROGRESS.md`/AGENTS.md фіксують baseline 755 тестів (root 264, Site 138, Admin 4, Partner 3, Server 346). Цього циклу пере-запущено лише тест-набір; інші — `[NEEDS_REVERIFY]`.

## Зовнішні блокери (лише справжні)
1. Публічне середовище/staging не авторизоване → deploy gate неможливий (заборона власника).
2. Київське метро: КМДА віддає HTTP 522 → `BLOCKED_EXTERNAL`.
3. iOS physical device: немає під'єднаного пристрою → `BLOCKED_EXTERNAL`.
4. Production S3 і self-hosted OSRM не підключені (рішення A, B).

## Наступна дія
#56 — підняти Admin-образ `6ee2ede` і пройти чергу модерації в браузері з доказом UI→API→DB→UI (не потребує дозволу власника).
