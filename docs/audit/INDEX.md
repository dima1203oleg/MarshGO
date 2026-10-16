# Індекс аудиту та релізної готовності MARSHGO

Власник архітектури, продуктового контракту й міжрепозиторної аудиторної документації: репозиторій MarshGO. Ці звіти залишаються в робочій гілці codex/marshgo-production до завершення міграції. Це не означає, що legacy репозиторій уже можна архівувати.

| Документ | Зміст |
|---|---|
| [00_BASELINE_2026-10-12.md](00_BASELINE_2026-10-12.md) | Початкові гілки, SHA, PR/CI та блокери на початок аудиту. |
| [01_LEGACY_INVENTORY.md](01_LEGACY_INVENTORY.md) | Runtime та код legacy, статуси модулів і підтверджені дельти. |
| [02_FEATURE_COMPARISON.md](02_FEATURE_COMPARISON.md) | Відповідальність і функціональні розбіжності чотирьох репозиторіїв. |
| [03_MIGRATION_MATRIX.md](03_MIGRATION_MATRIX.md) | Джерельні модулі, target-шляхи, причини, тести та статус перенесення. |
| [04_READINESS_REPORT.md](04_READINESS_REPORT.md) | Окрема оцінка кодової й production готовності за прозорою моделлю. |
| [05_CRITICAL_BUGS.md](05_CRITICAL_BUGS.md) | Підтверджені помилки, безпека, E2E та виправлення. |
| [06_TEST_RESULTS.md](06_TEST_RESULTS.md) | Локальні результати та посилання на конкретні CI runs. |
| [07_RELEASE_BLOCKERS.md](07_RELEASE_BLOCKERS.md) | P0/P1/P2 умови перед staging, pilot і комерційним запуском. |
| [08_RELEASE_MANIFEST.md](08_RELEASE_MANIFEST.md) | Точні версії Server/Site/iOS та статус manifest. |
| [09_ARCHIVE_READINESS.md](09_ARCHIVE_READINESS.md) | Чи безпечно відкладати активну розробку в legacy репозиторії. |
| [10_NEXT_STEPS.md](10_NEXT_STEPS.md) | Послідовність наступних робіт. |

## Поточне обмеження

Оцінка є проміжною. Server exact-SHA CI та iOS Simulator exact-SHA CI пройшли; Site CI пройшов. Root cross-repo E2E має невдалі сценарії та очікує повторного запуску на оновлених pins. Production deployment, staging data acceptance, зовнішні партнерські інтеграції й iPhone field tests не підтверджені.
