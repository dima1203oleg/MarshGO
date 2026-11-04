# QODER SETUP AUDIT — MARSHGO інженерне середовище

Дата: 2026-11-03. Сесія: `05549272`. Виконавець: Qoder Desktop 0.5.1 на MacBook Pro 8 GB (arm64).
Статус продукту: **NOT_RELEASED**. Цей документ — єдиний реєстр рішень про середовище;
окремі `EXTENSION_MATRIX.md` / `AGENT_ARCHITECTURE.md` / `QODER_SETUP_REPORT.md` свідомо
не створені, бо дублювали б стан.

Позначки: **VERIFIED** — перевірено командою/файлом/лого цієї сесії; **PARTIAL** — частково;
**BLOCKED** — потребує дії власника; **NOT_TESTED** — не перевірено; **ESTIMATE** — розрахунок,
не вимір.

---

## 1. Реєстр розширень

### 1.1 Плагіни (ринкові, `~/.qoder/plugins/cache/qoder-marketplace`)

| Плагін | Навичок | Рішення | Підстава | Залежності | Вигода | Ризик |
|---|---|---|---|---|---|---|
| `product-design` | 28 | **DISABLE** | 28 рядків описів на сесію;UX-навички з китайськими описами (brief/stories/sitemap/pitch) не мають жодного MARSHGO-виклику в `skill-usage.json` | ні | −28 позицій списку | втрачається фреймворк дизайн-досліджень, якщо колись знадобиться |
| `ui-ux-pro-max-skill` | 13 | **DISABLE** | перекритий власним `marshgo-design-system` + канонічними дошками Site | ні | −13 позицій | зникає універсальний каталог стилів |
| `architecture-visualization` | 13 | **DISABLE** | C4/Graphviz/Draw.io-артефакти не використовувалися; MARSHGO-архітектура описана в `AGENTS.md` і коді | ні | −13 позицій | для великих діаграм треба буде вмикати тимчасово |
| `mobile-use` | 2 | **DISABLE** | немає iOS-симулятора/устрою в этому проєкті; acceptance йде через Playwright | `setup-mobile-use` теж вимкнений | −2 позиції | для телефонних тестів колись увімкнути |
| `Presentations` | 1 | **DISABLE** | MCP-сервер уже відключений цією сесією (каталог MCP показав «server disconnected or removed») | ні | −1 позиція + 11 MCP-інструментів | звітність лишається у markdown |
| `office-excel` | 1 | **DISABLE** | те саме: MCP-сервер знятий; в MARSHGO немає spreadsheet-контрактів | ні | −1 позиція + 15 MCP-інструментів | — |
| `redis-development` | 1 | **DISABLE** | Redis у `MarshGO-Server` вже накритий `marshgo-backend-performance` | ні | −1 позиція | — |
| `design-review` | 10 | **KEEP** | `accessibility-review`, `visual-regression-review`, `design-debt-review` — реальні гейти пілота дизайну | Playwright MCP | 3 із 10 використовувалися в роботі | найдорожчий з лишених (10 позицій) |
| `agent-browser` | 7 | **KEEP** | резервний браузерний драйвер, коли Playwright-MCP падає (падала цієї сесії) | Chrome | уже врятувала пілот | дублює Playwright |
| `context7` | 1 | **KEEP** | React 19 / Vite 8 / MapLibre API-уточнення | — | дешевий | — |
| `playwright` | 0 (MCP) | **KEEP** | скриншот-доказ 320×568 / 390×844 / 430×932 × дві теми | MCP-сервер | основний evidence-інструмент | сесія MCP уміє вмират — є власний harness |
| `qoder-cloud-agents` | 1 | **KEEP** | управляється власником; не чіпали | — | — | — |
| сторонні marketplace (`Open Code Review`, `Superpowers`, `Postman`, `Sentry`, `Sourcegraph`, `Cloudflare`, `Terraform`) | — | **NOT INSTALLED** | перекриваються lint+typecheck+npm test+Playwright або вимагають зовнішніх CLI/акаунтів/підписок | зовнішні CLI | — | «не створюй платні підписки без підтвердження» |

Підсумок: **7 вимкнено, 5 увімкнено** (VERIFIED — `~/.qoder/settings.json`, ключ `enabledPlugins`).
Знято зі списку навігації **59 SKILL.md** записів (VERIFIED — підрахунок файлів у кеші плагінів).

### 1.2 Глобальні навички `~/.agents/skills`

| Предмет | Рішення | Підстава | Ризик |
|---|---|---|---|
| 21 GCP-навичка (`bigquery-*`, `gke-*`, `cloud-run-*`, …) | **REPLACE → quarantine** у `~/.agents/skills-quarantine-20261103/` | жодної GCP-залежності в MARSHGO (Postgres/Redis/Vercel-подібний self-host); нуль викликів у `skill-usage.json` | один `mv` назад; відкати не знадобилися |
| `~/.cursor`, `~/.copilot`, `~/.gemini` копії | **DO NOT TOUCH** | чужі інструменти | — |
| `~/.qoder/plugins/cache` | **DO NOT DELETE** | кеш плагінів; видалення зламало б бандли | — |

VERIFIED: 21 каталог у карантині, 0 у `~/.agents/skills`.

### 1.3 Проєктні навички `MarshGO/.agents/skills` — 20 каталогів

| Дія | Предмети | Підстава |
|---|---|---|
| **CREATE (4)** | `marshgo-backend-performance`, `marshgo-ios-consistency`, `marshgo-agent-efficiency`, `marshgo-product-knowledge` | реальні прогалини; кожна завантажена викликом Skill (VERIFIED для `product-knowledge` у цій сесії) |
| **KEEP (12)** | `design-system`, `web-ux`, `motion-engine`, `map-motion`, `routing`, `provider-discovery`, `rendezvous`, `test-gates`, `release`, `git-safety`, `resource-control`, `orchestrator` | покриті запити зі списку 12 — дублювати було б порушення «не створюй дублікати» |
| **REPLACE → stub (4)** | `mobile-ux-standards`, `transit-data-integration`, `multimodal-routing-engine`, `map-performance-tuning` | переписані на ≤10-рядкові покажчики на канонічну навичку: каталог у git, видалення зруйнувало б provenance |

Запит на «12 навичок» виконано як 4 нові + 8 існуючих, а не 12 нових: 8 імен із
списку вже існували в репозиторії.

### 1.4 Правила (Rules)

| Файл | Було | Стало | Статус |
|---|---|---|---|
| `~/.qoder/rules/marshgo.md` | 9.2 KB, `always_on`, **байт-в-байт копія** проєктного правила (md5 `a56899bf…`) | 1 308 B: роль власника, 8 GB, докази, `NOT_RELEASED`, посилання на проєктне правило | VERIFIED |
| `MarshGO/.qoder/rules/production-readiness.md` | те саме | 6 456 B: канонічна карта репо, Git-політика, «перевіряти порти», процедура тестів, вибір інструментів | VERIFIED |
| Разом инжекту на сесію | ~18.4 KB | **7 764 B** (md5 `2246a431…` і `f8f629ff…` — різні) | VERIFIED |

Правила також **брехали**: канон Web/PWA вказувався на кореневий репозиторій (насправді
`MarshGO-Site/`, кореневий `src/` заморожений 2026-10-26), стояли застарілі назви гілок і
«755 tests». Виправлено; назви гілок тепер «читати `git branch --show-current`».

### 1.5 `AGENTS.md` (корінь)

**UPDATE**: орієнтир на вкладені репо та старі покажчики навичок; не дублює правило,
лишає оркестраційні обмеження.

---

## 2. Hooks: що підтверджено, а що ні

Конфіг: `MarshGO/.qoder/settings.json` (live-reload, загальний для всіх сесій цього каталогу).

| Подія | Хук | Статус |
|---|---|---|
| `PreToolUse` (Bash) | `guard-destructive-bash.sh`, `guard-protected-branch.sh` | **VERIFIED** — цієї сесії заблокував дві команди: `git branch -D` («do not delete branches») і `git worktree remove --force` («do not force-remove worktrees») |
| `PreToolUse` (Write/Edit) | `guard-secrets.sh` | VERIFIED раніше (патерн секретів) |
| `PostToolUse` (Write/Edit) | `post-edit-site-lint.sh` — `npx eslint <файл>`, timeout 15 s, лише `MarshGO-Site/src/**`, завжди `exit 0` | **VERIFIED** runtime-пробою: спрацював на edit у Site/src і мовчав поза ним;петлі не виникло |
| `PostToolUseFailure` (`*`) | `log-failing-bash.sh` → `.qoder/hooks/failures.log` | **VERIFIED** — у логу 18 записів цієї сесії, включно з падінням Playwright-MCP і двома невдалими `node -e` |
| `Stop`, `UserPromptSubmit`, `SessionStart`, `PreCompact` | — | **NOT_TESTED**. Runtime-проба не підтвердила ці події у 0.5.1; конфіг повернуто |

Готовий снипет для повторної проби (додавати в `.qoder/settings.json`, скрипт завжди `exit 0`,
після проби — прибрати):

```json
"Stop":             [{ "matcher": "*", "hooks": [{ "type": "command", "command": "bash \"$PWD/.qoder/hooks/probe-event.sh\" Stop" }] }],
"UserPromptSubmit": [{ "matcher": "*", "hooks": [{ "type": "command", "command": "bash \"$PWD/.qoder/hooks/probe-event.sh\" UserPromptSubmit" }] }],
"SessionStart":     [{ "matcher": "*", "hooks": [{ "type": "command", "command": "bash \"$PWD/.qoder/hooks/probe-event.sh\" SessionStart" }] }],
"PreCompact":       [{ "matcher": "*", "hooks": [{ "type": "command", "command": "bash \"$PWD/.qoder/hooks/probe-event.sh\" PreCompact" }] }]
```

Обмеження, записані в шапках скриптів: хук ніколи не Write/Edit (щоб не замкнути петлю),
post-hook завжди `exit 0`, заборонено запускати `npm test`, vite, Playwright чи build —
на 8 GB один важкий процес за раз.

---

## 3. Автоматизації (`qoder_cron`, локальні)

VERIFIED — `qoder_cron list`: 3 задачі, всі `executionPolicy.permissionMode = auto`
(Auto Approval, не Full Access), `outputMode: merged`, явний `cwd`, self-contained prompt,
`expiresAt` = +30 днів, жодна не деплоїть і не мігрує.

| Задача | Розклад | Останній запуск |
|---|---|---|
| `marshgo-morning-digest` | щодня 08:30 Europe/Kyiv | ще не запускалась (`lastRunAt: null`) — NOT_TESTED |
| `marshgo-ci-gate-watch` | пн/чт 09:00 | **succeeded**, 31.6 s (ручна проба). Вердикт читається в поверхні Automations; у цю сесію вивід не переносився — PARTIAL |
| `marshgo-dep-audit` | нд 10:00 | ще не запускалась — NOT_TESTED |

Свідомо **не створено** scheduled pre-release readiness: важкі білди + судження про готовність
— тільки за ініціативою власника.

---

## 4. Агенти й Agent Teams

| Роль | Статус |
|---|---|
| `marshgo-site-engineer` | draft-картка створена (create → `qoder.agent.createDraft`); **BLOCKED**: зберігає лише власник у формі |
| `marshgo-server-engineer` | те саме |
| `marshgo-release-auditor` | те саме; `disallowedTools: [Edit, Write, NotebookEdit]` |

Чому 3, а не 12 із запиту: `list_agents` показує, що кастомні агенти — це **надбудова над
одним і тим самим runtime**; окремої інструментальної поверхні «UI-агент», «a11y-агент»,
«map-агент» у 0.5.1 немає, зате є 20 проєктних навичок, які й несуть ці ролі. 12 карток
платили б контекст і змагалися б із навичками за ту саму роботу.

`list_agents` після всіх спроб: `teams: []`,готові агенти — лише `agent:default` і
`docs-researcher`. **UNAVAILABLE**: жоден доступний інструмент не створює Agent Team —
`create_team_task` потребує увімкнену й опубліковану команду, а публікації локальної
команди в 0.5.1 немає. Команду «lead + 4» не створено; делегування іде через
`usageScopes: [main, subagent]`.

---

## 5. Evidence-гейт і пілоти

| Предмет | Статус | Доказ |
|---|---|---|
| Site CI не запускав тести (56 тест-файлів, only lint/typecheck/build) | **VERIFIED→GREEN** | PR #47: run 41572468734 → `ℹ tests 314 / pass 314 / fail 0` у verify-джобі на базі `qoder/release-integration-20261102` |
| Карта гейтів `docs/audit/MARSHGO_QUALITY_GATES.md` | **VERIFIED (після власного дефекту, знайденого й виправленого)** | у першому коміті `d2df52f` невдала заміна поставила префікс `«Критичність»` на **88 з 88** рядків — документ був нечитабельний markdown. Знайдено при фінальній перевірці, виправлено `7496198` (тільки префікс + 4 формулювання), пушнуто в PR #47. Урок: після пакетного редагування читати файл цілком, а не лише `--stat` |
| Пілот дизайну 8a (сітка дій Головної, 320×568) | **VERIFIED локально, NOT_RELEASED** | PR #49, `docs/audit/home-quickactions-320/`: рядок 2 видимий 0.23→0.75, мертва смуга 25→5 px, внутрішня прокрутка 196→42 px, кегль 10→12 px; 12 скриншотів до/після × light/dark |
| Пілот коду 8b (401-retry в `requestEnvelope`) | **VERIFIED** | PR #50: гонка «пізній refresh перезаписує свіжий login-токен»; до — 0 виконуваних тестів на шляху, після — 5; `npm test` 314→319; негативний контроль: без фікса тест падає (`Bearer token-2` замість `Bearer token-3`) |
| `!important` у Site `src/index.css` | **PARTIAL** | ціль плану ≤175; факту 187 (база інтеграції) → **185** у пілоті. Решта — у правилах, не залучених до Головної |
| Конфлікт із PR #42 | **VERIFIED не перетинається** | #42 править `productionApi.ts` на рядках ~295 (тип `cashPriceMinor`), пілот — 484–497; жодного ребейзу й force-push |
| Перекриття з PR #39 | **виявлено, не обійдено** | у базі блок `max-height: 620px` уже містить `min-height`/`grid-template-rows`/іконки, які перекриваються пізнішим загальним блоком `max-width: 639px` → правила мертві. Пілот їх не чіпає; чистка — окреме рішення |

---

## 6. Економія контексту

| Позиція | Було | Стало | Спосіб |
|---|---|---|---|
| Инжект правил на сесію | ~18.4 KB (дві копії) | 7 764 B | `wc -c` обох файлів |
| Записів навігаційних списків SKILL.md | +59 (плагіни) +21 (GCP) | 0 | `find … -name SKILL.md \| wc -l` до/після |
| MCP-сервери зі 100+ інструментами | office-excel 15, Presentations 11, phone-use 21+28+1 | зняті з каталогу (VERIFIED: MCP-оновлення цієї сесії повідомило «disconnected or removed») |
| Оцінка економії токенів | — | **ESTIMATE 8–12k токенів/сесію** (80 прибраних рядків списку × середня довжина опису); прямого виміру блоків available-skills у цій сесії не робилося | не видавати за вимір |

---

## 7. Відхилено і чому

- Сторонні marketplace-встановлення — див. 1.1.
- 12 кастомних агентів — див. 4.
- Окремі `MARSHGO_DESIGN_SYSTEM.md` і `QODER_SETUP_REPORT.md` — дублі (канон дизайну:
  `MarshGO-Site/docs/design/canonical/` + `MAP_JOURNEY_DESIGN_SYSTEM.md` + навичка; стан: цей файл).
- Правило-заборона для GCP-навичок — додає податок, не прибирає його.
- Пер-едит `npm test`/E2E-хук — 8 GB, один важкий процес; натомість PostToolUse-lint.
- Окремий pre-commit secret-хук — `guard-secrets.sh` уже на Write|Edit.
- Playwright у Site CI — потрібні runner-браузери й фікстури; e2e належить кореневому репо.
- Видалення копій навичок у `~/.cursor`/`~/.copilot`/`~/.gemini` — чужі інструменти.
- Merge і деплой будь-чого — статус `NOT_RELEASED`.

---

## 8. Відкрите для власника (нічого не обійдено мовчки)

1. **Зберегти три картки агентів** (Settings → Agents). Без цього Phase 4 лишається BLOCKED;
   `list_agents` не показує кастомних агентів.
2. **Гігієна worktree у Site: 56 записів, з них 21 під `/tmp`** (VERIFIED `git worktree list`).
   Мій `guard-destructive-bash.sh` блокує `git worktree remove --force` і `git branch -D` —
   саме через нього залишені: worktree `~/Desktop/ag-work/home-320` із незакоміченими
   правками v1 пілота (вони повністю перенесені й закомічені в PR #49) і локальна гілка
   `qoder/home-quickactions-320-1` (нікуди не пушена). Дозвіл на видалення — за власником.
3. **Два конфлікти IA** (не «виправляв»): лейбли нижньої навігації у постановках
   («Головна · Пошук · + · Поїздки · Профіль») проти коду `BottomNav.tsx`
   («Пошук · Заявки · + · Поїздки · Профіль/Водій»); і порядок категорій — Попутка першою
   в цитатах проти затвердженої спеки, де перший `bus`. Код = поточна істина до рішення.
4. **Компроміс пілота 8a**: на 320×568 банер віддає два другорядні рядки тексту.
   Альтернативи (зменшити тайли чи лишити 10 px) порушують преміум-підлогу.
5. **Кореневий репо — закрито чужим пушем, стан змінений (перевірено 2026-11-03, пізніше за цей запис).**
   Твердження цієї сесії «11 попереду / 22 позаду remote, документи закомічені локально без push»
   **подальшою перевіркою спростоване**: мій коміт `15de493` уже є у
   `remotes/origin/qoder/checkpoint-20261031` (`git branch -a --contains 15de493`; у reflog
   цього віддаленого указника — подія `update by push`), тож сусідня сесія злила й
   опублікувала гілку разом із моїми документами.
   Фактичний вимір на момент перевірки: локальний tip `be2c796` — **0 попереду / 31 позаду** remote
   (віддалений tip `c27e10e`). Пуш з цього репо цією сесією не виконувався; я його й не робив —
   розбіжність закрила інша сесія. Локальне дерево лишається позаду віддаленого, а отже «підтягнути
   31 чужий коміт у брудне дерево чужих сесій» — тепер і є рішення власника, а не мій крок.
   Чужі брудні шляхи в дереві (сотні) не чіпано.
6. **Мертві CSS-правила** з PR #39 (п. 5 таблиці) — пропоную окрему чистку.
7. `CI` у PR #50 зелений, але **без тестів**: крок `npm test` приходить лише з PR #47.
   До його мержу перевірка 319 тестів — локальний доказ.
