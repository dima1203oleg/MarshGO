# MARSHGO — RELEASE COORDINATION

Авторитетом залишається `[RELEASE_MANIFEST.json](../../RELEASE_MANIFEST.json)`; цей документ лише зводить стан для рецензії. Жоден неформальний звіт не замінює маніфест.

## Поточний релізний кандидат
- Образ API: `marshgo/api:RC-2026-11-01-canonical.3`
- Ідентичність: `org.opencontainers.image.revision = a5ec118bc01d4469650757521e637ffd03f502a3`, `SOURCE_STATE=clean`
- Рецептура: `.release/server-<sha>` з `git -C MarshGO-Server archive <sha> | tar -x` + `ops/docker/Dockerfile.server` + `.dockerignore` з контексту 44f954b; аргументи `MARSHGO_BUILD_ID / BUILD_SHA / BUILD_TIME`
- Попередній на тій самій гілці: `RC-2026-11-01-canonical.2` (rev `8cc634a` + `b03bba3`) — на ньому вперше пройдено цикл; `completed_at` ще був `None`
- ⚠ Розбіжність: верхньорівневе поле маніфесту `release_candidate` досі `RC-2026-10-30-evidence.3` — застаріле, потребує рішення власника (R-OPEN-1)

## Піні компонентів (фактичні голови, не baseline)
| Компонент | Гілка | SHA | Статус збірки |
|---|---|---|---|
| Server | `qoder/uploads-perm-fix-20261101` | `959e547` (RC.3 побудовано з `a5ec118`) | образ RC.3 локально |
| Site | `qoder/site-ui-polish-20261031` | `fef697e` | RC-образ nginx з dist (рецепт у пам'яті проєкту) |
| Admin | `qoder/admin-email-auth-moderation-20261031` | `4eb5d15`; acceptance-образ зібрано з `6ee2ede` | образ існує, браузерний прохід #56 не зроблено |
| Partner | `qoder/partner-email-auth-20261031` | `544e5d8`; acceptance-образ з `df37e7c` | API-прохід є |
| iOS | `codex/production-site-sync-20261014` (Codex) | `4353cec` | симулятор ok; device `BLOCKED_EXTERNAL` |
| Root (оркестрація) | `qoder/checkpoint-20261031` | `344eaa4` | compose + Dockerfiles + маніфест |

Порівняльні baseline з майстер-промпту (не поточні): server `fc5b589ca3956cc6cb0458d308ce777611adf050`, site `ca5140cb78248f15e3794419f3d493bb17d465b9`.

## База даних
- PostgreSQL 17 (`127.0.0.1:5434`), Redis 7 (`127.0.0.1:6380`), acceptance-контейнери + smoke-проєкт `marshgo-canonical-smoke` (зараз зупинено, томи збережено).
- Версія міграції: **не зафіксовано цього циклу** — `MarshGO-Server/migrations` не існує за очікуваним шляхом; істинне місце і head потребують перевірки перед наступним RC (`[NOT_VERIFIED]`).

## CI / гейти
- Внутрішні acceptance-гейти: див. `ACCEPTANCE_MATRIX.md` (PASS 14 · FAIL 1 · IN_PROGRESS 6 · BLOCKED_EXTERNAL 2 · NOT_TESTED-частково 1 · BLOCKED_INTERNAL 2).
- Staging: `BLOCKED_INTERNAL` — немає авторизованого цільового середовища.
- Production authorization: **не надано**. Статус: `NOT_RELEASED`.

## Ідентичності образів, доступні локально
`marshgo/api:RC-2026-11-01-canonical.2`, `marshgo/api:RC-2026-11-01-canonical.3` (+ acceptance-образи порталів з `6ee2ede` / `df37e7c`).

## Як відтворити / зупинити
```bash
cd /Users/dima1203/Desktop/MarshGO
# status
curl -s http://127.0.0.1:3012/readyz
# start (RC.3)
docker compose -p marshgo-canonical-smoke -f .release/compose.production.yml \
  -f .release/compose.canonical3.yml --env-file .release/env.build-smoke up -d api
# smoke
python3 /tmp/canonical3_carpool_e2e.py
# stop (томи лишаються)
docker compose -p marshgo-canonical-smoke -f .release/compose.production.yml \
  -f .release/compose.canonical3.yml --env-file .release/env.build-smoke down
```

## Конфлікт-політика між агентами
- Окремі гілки/worktree на задачу; один координатор RC за раз.
- Не чіпати: `codex/*`, `main`, робочі процеси dev :3002 (node, без watch) і :3000, чужі dirty-файли.
- Один важкий процес на 8 GB Mac; без force-push, `reset --hard`, `clean -fd`.
