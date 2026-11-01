# MARSHGO — EVIDENCE INDEX

Індекс відтворюваних доказів. Локальні абсолютні шляхи наводяться лише як розташування артефактів —вони не є єдиним доказом; первинні докази — це коміти/PR на GitHub і команди, які можна пере-запустити.

## E-01 · Повний тест-набір MarshGO-Server (перед фіксом читання)
- Ревізія: `b03bba3` (гілка `qoder/uploads-perm-fix-20261101`)
- Команда: `npm test` (усередині `tsx --test tests/*.test.ts`)
- Результат: **412 тестів · 409 pass · 0 fail · 3 skipped**; `npx eslint .` і `npx tsc --noEmit` exit 0
- Записано в: `RELEASE_MANIFEST.json` → `carpool_publish_blocker_2026_11_01.test_evidence`

## E-02 · Регрес-захист таймстемпів списку бронювань
- Ревізія: `959e547`
- Команда: `npx tsx --test tests/bookings-list-lifecycle-columns.test.ts`
- Результат: 2 pass / 0 fail (0.21 s), exit 0; `npx eslint <файл>` і `npx tsc --noEmit` exit 0

## E-03 · Карпул-життєвий цикл на канонічному prod-образі
- Образ: `marshgo/api:RC-2026-11-01-canonical.3`, label `org.opencontainers.image.revision=a5ec118bc01d4469650757521e637ffd03f502a3`, `SOURCE_STATE=clean` (контекст з `git archive`, не з робочого дерева)
- Стек: `docker compose -p marshgo-canonical-smoke -f .release/compose.production.yml -f .release/compose.canonical3.yml --env-file .release/env.build-smoke up -d api` → порт 3012
- Команда: `python3 /tmp/canonical3_carpool_e2e.py` (ізольовані smoke-акаунти, пароль не публікується)
- Результат: 41 крок, 1 FAIL (відомий #60) · `final status: completed | completed_at: 2026-11-01T18:40:04.647Z` · `seats after cancel: 2` · `concurrent results: [('B', 201), ('A', 409)] | successes: 1`
- Артефакт: `/tmp/carpool_e2e.json` (ключі: `accounts, offer, search, booking, idempotency, seat_inventory_after_idempotency, ticket, rendezvous_pre_trip, completion, events, sold_out_offer_detail, cancellation, race`) — локальний scratch, не комітиться (містить токени)

## E-04 · Крос-провір API ↔ БД
- Команда API: логін водія/пасажира → `GET /api/v1/bookings`
- Результат: `confirmed` — жодної позначки; `cancelled cancelled_at=2026-11-01T18:40:04.843Z`; `completed completed_at=2026-11-01T18:40:04.647Z`
- Команда БД: `docker compose -p marshgo-canonical-smoke exec -T db psql -U marshgo -d marshgo -c "SELECT status, count(*) n, count(completed_at) wc, count(cancelled_at) wx FROM bookings GROUP BY status ORDER BY status;"`
- Результат: cancelled 3 (wc 0, wx 3) · completed 3 (wc 3, wx 0) · confirmed 4 (0, 0) · in_progress 1 (0, 0)

## E-05 · Шлях збоку локального сховища (юніт)
- Ревізія: `b03bba3` · команда: `npx tsx --test tests/object-storage-local-fallback.test.ts`
- Результат: 3 pass; ENOTDIR-симуляція повертає саме `ObjectStorageUnavailableError`

## E-06 · Готовність канонічного стеку
- Команда: `curl -s http://127.0.0.1:3012/readyz` з bounded retry (10 × 4 s)
- Результат: `{"status":"ready","database":"connected","realtime":"connected"}`
- Безповторне: одразу після `up -d` дає exit 52 (ще boot) — тому retry, а не миттєвий assert

## E-07 · Живі позиції та міжміський коридор (попередні цикли)
- Результат: Львів GTFS-RT 443 борті; Lviv → Київ 12 реальних поїздок; публічна медиaна пошуку 10.5–11.9 s
- Статус доказу: записано в `CODEX_PROGRESS.md` / маніфесті; `[NEEDS_REVERIFY]` на поточному RC

## Що свідомо НЕ є доказом
- План, CI-зеленість, локальний контейнер, чи мій текст у чаті.
- `file:///Users/...` посилання як самодостатній доказ.
- Публічний zrok-url без свіжого зовнішнього проходу (останній підтверджений прохід — попередні цикли).
