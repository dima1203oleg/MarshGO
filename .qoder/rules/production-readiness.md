---
trigger: always_on
---

# MARSHGO — інженерний контракт проєкту

## 1. Місія та статус
Довести MARSHGO (мультимодальна транспортна платформа, 12 категорій транспорту, Web/PWA + iOS + сервер) до **перевіреної** production-готовності. Статус лишається `NOT_RELEASED`, доки кожен гейт не має доказу. Не оголошувати готовність без доказів; не підміняти живі дані фікстурами без позначки mock/demo.

## 2. Канонічні репозиторії (корінь = `/Users/dima1203/Desktop/MarshGO`)
| Де | Роль |
|---|---|
| `MarshGO-Site/` | **канонічний Web/PWA-інтерфейс** (активний UI, токени дизайну, `npm test`). Саме тут правиться дизайн і UX. |
| `MarshGO-Server/` | API, PostGIS/PostgreSQL, Redis, GTFS/GTFS-RT, маршрутизація, carpool-логіка. |
| `MarshGO-iOS/` | нативна iOS-оболонка (Capacitor) + узгодженість із Web. |
| корінь `MarshGO/` | оркестрація, документація стану, Playwright-e2e, acceptance-скрипти, worktree-харнес. **`src/` у корені — застаріла копія до міграції (заморожена 2026-10-26); не правити UI там.** |
| `../MarshGO-Admin/`, `../MarshGO-Partner/` | портали модераторів і партнерів — **sibling-каталоги**, не всередині кореня. |

Виключити `MarshGO2`. Перевіряти призначення файлу читанням, а не пам'яткою: якщо UI-правка «не знайдена» в Site — це сигнал, що ви шукаєте не в тому репо.

## 3. Git і безпека змін
- Заборонено: `git reset --hard`, `git clean -fd`, force-push, прямі зміни `main` і `codex/*`, видалення чужих файлів чи незакомічених змін.
- Працювати у **worktree** + гілці `qoder/*`, потім PR. Назви гілок не запам'ятовувати: читати `git -C <репо> branch --show-current`.
- Перед комітом переглянути `git status --porcelain`: у корені є **численні чужі незакомічені зміни** (перевірено: ~105 відстежуваних файлів, 2026-11-03) — stage лише власні шляхи, ніколи `git add -A`/`.`.
- Секрети не виводити й не комітити; creds у прев'ю-середовищах space-separated, тому `sed`-маскування не захищає — парсити лише всередині скриптів.

## 4. Середовище
Інфраструктура (PostgreSQL 5434, Redis 6380, API 3002, acceptance 3900–3904, Nginx 8080) **змінюється**: перш ніж використовувати порт або казати «здорово» — перевірити `lsof -nP -iTCP -sTCP:LISTEN` і `curl /readyz`. Один важкий процес за раз (build / test / browser / Docker / GTFS-парсер) — це 8 GB Mac.

## 5. Тести та докази
Не вірити заздалегідь записаним кількостям тестів. Процедура: запустити `npm test` у відповідному репо, повідомити фактичний passed/failed і SHA. Падіння не приховувати й не skip-ати. Готовність гейта закривається посиланням на CI-run, виміром або скриншотом, а не твердженням.

## 6. Де живуть поточні задачі
Стан і пріоритети — в `NEXT_ACTIONS.md` (RESUME BLOCK на початку) і `CODEX_PROGRESS.md`; зовнішні блокери — `docs/EXTERNAL_BLOCKERS.md`. Це правило задає лише рамки, тому не дублює списки робіт — не переносити їх сюди.

## 7. Вибір інструментів і економія контексту
- Проєктні навички в `.agents/skills/` (20, з них 4 застарілі покажчики): UI/токени → `marshgo-design-system`; анімація → `marshgo-motion-engine`; карта → `marshgo-map-motion`; сценарії PWA → `marshgo-web-ux`; маршрутизація → `marshgo-routing`; феди → `marshgo-provider-discovery`; rendezvous → `marshgo-rendezvous`; тести/гейти → `marshgo-test-gates`; реліз → `marshgo-release`; Git → `marshgo-git-safety`; ресурси → `marshgo-resource-control`; бекенд → `marshgo-backend-performance`; iOS → `marshgo-ios-consistency`; IA і бізнес-правила → `marshgo-product-knowledge`; делегування й моделі → `marshgo-agent-efficiency`; оркестрація → `marshgo-orchestrator`. Застарілі `mobile-ux-standards`, `transit-data-integration`, `multimodal-routing-engine`, `map-performance-tuning` — лише короткі покажчики на перелічене вище.
- Делегувати пошук коду `Explore`/`SearchWorkspace`; у головну сесію не тягнути цілі репозиторії — точкове читання за рядками.
- Сильну модель — на архітектуру, дизайн і критичні дефекти; дешевшу — на пошук і класифікацію. Не запускати повний E2E після кожного редагування; після редагування — вибірковий lint/typecheck.
- Не створювати нову навичку чи агента, якщо вже є наявна, що покриває задачу; не дублювати інструкції між Rules і Skills.

## 8. Звітність
Після кожного змістовного чекпоінта — RESUME BLOCK у `NEXT_ACTIONS.md` + запис у `CODEX_PROGRESS.md` з фактичним SHA й числом тестів. Розрізняти VERIFIED / PARTIAL / BLOCKED / NOT_TESTED.
