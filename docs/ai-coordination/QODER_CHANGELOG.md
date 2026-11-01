# MARSHGO — QODER CHANGELOG

Хронологія фактичних змін. Кожна позиція має коміт, який можна відкрити на GitHub. Без дифа = не «зроблено».

## 2026-11-01T18:47Z · MarshGO (root) · `qoder/checkpoint-20261031` · `344eaa4`
- Файл: `RELEASE_MANIFEST.json` (тільки додавання: 36 вставок, 0 видалень).
- Що: паркувальний блок `resume_state_2026_11_01_late` — пінні SHA, образ RC.3, докази циклу, рішення власника A–E, наступні кроки.
- Вимога: resumed-robustness (щоб наступна сесія не відновлювала контекст на око).
- Примітка для рецензента: перший варіант этого блока мав той самий ключ, що й існуючий `resume_state_2026_11_01`, і перезаписав його; відновлено з HEAD, передpubлікаційна перевірка «0 видалень + жоден старий ключ не змінений» тепер обов'язкова.
- Команди: `python3 - <<PY` (порівняння кожного ключа з `git show HEAD:RELEASE_MANIFEST.json`), `git diff --stat`.

## 2026-11-01T18:45Z · MarshGO-Server · `qoder/uploads-perm-fix-20261101` · `959e547`
- Файл: `tests/bookings-list-lifecycle-columns.test.ts` (26 рядків, новий).
- Що: захищає читання `b.completed_at`/`b.cancelled_at` у `GET /api/v1/bookings` і штампування `completed_at=now()` / `cancelled_at=now()` у записах.
- Вимога: COMPLETED-AT-1 (завершенa поїздка не виглядала завершеною).
- Тести: `npx tsx --test tests/bookings-list-lifecycle-columns.test.ts` → 2 pass, 0 fail; `npx eslint <файл>` і `npx tsc --noEmit` → exit 0.
- PR: https://github.com/dima1203oleg/MarshGO-Server/pull/64

## 2026-11-01T18:20Z · MarshGO-Server · `a5ec118`
- Файл: `server/index.ts` — `SELECT b.id, …, b.completed_at, b.cancelled_at, …` у списку бронювань.
- Root cause: запис завжди був правильним (`completed_at=now()` при ≥2 підтвердженнях), дефект був у читанні — ендпоінт не вибирав стовпчик.
- Перевірка на живому образі: `GET /api/v1/bookings` → `completed_at=2026-11-01T18:40:04.647Z`, `cancelled_at=2026-11-01T18:40:04.843Z`; `psql` збіг 1:1.

## 2026-11-01T17:5xZ · MarshGO-Server · `b03bba3`
- Файл: `tests/object-storage-local-fallback.test.ts` (новий).
- Що: (1) запис об'єкта на диск, (2) шлях збоку сховища дає `ObjectStorageUnavailableError` (чесний 503), (3) відмова, якщо тіло не відповідає оголошеному MIME.
- Деталі реалізації: `LOCAL_STORAGE_DIR` і видалення `S3_*` мають застосовуватись до `await import('../server/objectStorage')`, бо модуль читає env під час завантаження; невдалий підхід `chmod 0o500` замінено на ENOTDIR (файл там, де потрібна директорія).
- Спрощено: `fs.chmodSync(dir, 0o500)` у цьому середовищі не блокує запис → тест падав «Missing expected rejection».

## 2026-11-01T17:2xZ · MarshGO-Server · `8cc634a`
- Базовий коміт гілки перед фіксом читання (doc-та дрібні правки) — див. `git show 8cc634a --stat`.

## 2026-11-01 (раніше) · MarshGO (root) · `ops/docker/Dockerfile.server`
- Що: `RUN mkdir -p /app/.uploads && chown node:node /app/.uploads` до `USER node`.
- Вимога: CARPOOL-PUBLISH-BLOCKER — порожній іменований том монтувався як root-owned, API без прав → 500 на завантаженні фото → `trust_level` не піднімався → публікація поїздки неможлива.
- Це канонічний релізний Dockerfile: додати Dockerfile у застунковий репозиторій — заборонено (`project-portal-image-provenance`).

## Не зміни цього циклу (щоб не хибно атрибувати)
- `MarshGO-Site fef697e`, `MarshGO-Admin 4eb5d15`, `MarshGO-Partner 544e5d8` — закомічені в попередніх циклах, цього разу лише перевірено синхронізацію з remote (0 behind / 0 ahead).
- `MarshGO-iOS 4353cec` — гілка Codex, Qoder не чіпав.
- 431 dirty-файлів у root (`docs/**`, `.release/**`) — чужі роботи та scratch; збережено, не стейджено, не видалено. Коміти завжди з явним pathspec.
