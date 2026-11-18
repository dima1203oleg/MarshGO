# Поточне приймання release candidate — 2026-10-23

## Перевірений стан

- Root MarshGO: branch `codex/production-finalization-20261014`, committed HEAD `7ab0d8cbb1390f88fe6151e933229c0a92f2937d`. Робоче дерево містить значні раніше незакомічені зміни; наведені локальні результати отримані саме на цьому dirty working tree і не є відтворенням лише committed HEAD.
- Canonical Site: `1d2aaa012b88519273eae7a2b8d703ec32c212f6` (draft PR #15).
- Canonical Server candidate: `e21536d5f97e7876aae0a360ed3ff4126ba5c78c` (draft PR #29).
- iOS pin candidate: `1d1e9763ec99d7e77b22998c4212ce71a7fa924a`, який посилається на Site `1d2aaa012b88519273eae7a2b8d703ec32c212f6`.
- PR #29 на точному Server SHA має два успішні hosted CI runs: `39852917615`, `39852909626`.
- Root integration PR #5 зараз на SHA `7ab0d8cbb1390f88fe6151e933229c0a92f2937d`; Gitleaks і CodeQL успішні, але verify завершується до решти umbrella steps через відсутній Actions secret `MARSHGO_REPOS_READ_TOKEN` для читання приватних MarshGO-Admin і MarshGO-Partner. CI log: run `39854554389`. Це зовнішня конфігураційна перешкода, її не обходили.

## Локальні перевірки

- `npm run check:production`: PASS — typecheck, lint, 256 unit tests PASS, 0 FAIL, 1 opt-in integration SKIP, Vite production build і bundle budget PASS.
- `npm run test:e2e`: PASS — 16/16 production-route Playwright сценаріїв за 8,5 хвилин. Перевірено browser compatibility, 158 кнопок на production екранах, маршрут/карту й фокус сегмента, 12 transport modes, onboarding, два облікові записи, бронювання/переговори/чат, GPS reroute, iPhone viewport-и, відмову геолокації, відновлення URL-пошуку, partial-search попередження та rendezvous UI.
- Кнопковий heuristic аудит записав 15 «без видимого ефекту» сигналів. Це не 15 підтверджених дефектів: серед них поточні вкладки, заголовки й неінтерактивна мітка; потрібна точкова класифікація.
- E2E використовував loopback PostGIS/Redis і детерміновані map/geocoder/OSRM fixtures. Server був локально заданий кандидатом PR #29, Site — точним pin PR #15. Живі provider API, публічний staging, реальні SMS/GPS та фізичний iPhone цими тестами не перевірені.
- Bun lock оновлено до версій, що прибирають дві High advisories; `bun install --frozen-lockfile` і `bun audit --audit-level=high` PASS локально. Hosted audit для цього коміту не був виконаний: workflow зупинився раніше на відсутньому приватному-repo token.

## Відкриті production gates

1. Надати GitHub Actions secret з read-only Contents доступом до приватних Admin/Partner репозиторіїв, щоб завершувався umbrella CI. Не публікувати token у чаті чи файлах.
2. Надати/налаштувати перевірений staging host, API origin, deploy access і секрети. На поточних доказах нема HTTPS staging/production URL, deployed SHA, smoke test чи rollback rehearsal.
3. Виправити або чесно обмежити заявлену повноту GTFS пошуку: актуальний Lviv search ще повертає `searchTruncated=true`.
4. Провести live provider acceptance, включно з реальною доступністю/цінами/бронюванням, лише для джерел із підтвердженими правами й доступом.
5. Пройти фізичний iPhone приймальний тест для GPS, background behavior, push і двохсторонньої зустрічі.
6. Підтвердити rollback, резервне копіювання/відновлення і production migration rehearsal.

## Статус

`NOT_RELEASED`. Локальний код і ізольовані інтеграційні сценарії мають добрий доказовий рівень, але відсутні staging/deploy/production докази та лишаються функціональні обмеження зовнішніх даних. Ні merge, ні production deployment у цьому кроці не виконувались.
