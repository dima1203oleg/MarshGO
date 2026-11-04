---
name: marshgo-backend-performance
description: Optimize MARSHGO server request paths using the real cache, pool and queue contracts in MarshGO-Server. Use for API latency, PostGIS queries, Redis caching, GTFS workers or load testing.
---

# MARSHGO Backend Performance

Рахуємо продуктивність на фактичних контрактах, а не на загальних порадах.

## Де що лежить (`MarshGO-Server/`)
- Кеш: `server/cache/cacheService.ts` — ключ `marshgo:cache:v1:<category>:<sha256>` (канонічний sorted JSON), L1 = LRU (`CACHE_L1_MAX_ENTRIES` 5000, `CACHE_L1_MAX_BYTES` 16 MiB), L2 = **окремий** Redis через `REDIS_CACHE_URL` (ніколи не `REDIS_URL`), `CACHE_L2_MAX_ENTRY_BYTES` 2 MiB, TTL-джиттер ±10%, SWR через `staleTtlMs`, локи `SET NX PX` + compare-and-delete.
- TTL-таблиця: `docs/REDIS_SMART_CACHE.md` (геометрія транспорту 10 хв/6 год, піша 5 хв/3 год, GBFS ≤15 с, GTFS-RT 15 с, статичний GTFS/GeoJSON 10 хв/≤6 год).
- Черга маршрутизації: 12 активних / 24 у черзі / бюджет 2.5 s / таймаут 10 s, пріоритети `navigation > interactive > background`.
- Postgres: сирий параметризований SQL через `pg`, пул `server/index.ts:74` — `max: 12`, `idleTimeoutMillis: 30000`; міграції `server/migrations/*.sql`, застосовує `server/migrate.ts` транзакційно з advisory lock `743921604`.
- Rate limit: `server/redisRateLimitStore.ts` (fixed-window Lua INCR/PEXPIRE, хешовані IP); realtime WS: upgrade на `/api/v1/realtime`.
- GTFS: `server/journey/gtfsTimetable.ts` (+ worker-тріо `gtfsSearchWorker*`), аудит фідів `server/mobility/gtfs.ts`.

## Алгоритм
1. Виміряй до правки: `npm run benchmark:routing-cache`; за потреби `npm run test:load:routing` (k6, потребує `LOAD_TEST_ALLOW_REMOTE=1`).
2. Визнач шар: L1-промах, L2-промах, черга (2.5 s бюджет) чи SQL. Не «оптимізуй запит», коли причина — розігрів кеша.
3. Зміни один шар, повтори той самий вимір на тому ж SHA.
4. Перевір релевантні тести: `cache-smart`, `cache-stale`, `routing-cache`, `transport-index-warmup`, `bounded-graph-budget`, `bounded-promise-cache`, `request-search-memo`, `redis-rate-limit-store` (+ `cache-redis.integration.test.ts`, `realtime-cluster.integration.test.ts` з `npm run test:integration`).

## Обмеження й перевірені застерігання
- EXPLAIN-інструменту в репо **немає** (лише untracked `.tmp-route-*.mts` утилі) — не вигадувати «plan-аналіз», якщо не додале脚本.
- Числа з `docs/CACHE_PERFORMANCE_REPORT.md` (uncached p50 432.64 ms → cold 57.09 → warm 7.94 ms) отримані на **фікстурах** і авторами позначені як «not an SLO». Реальний cold-шлях 10830 ms → 283/ms зафіксовано у root: `.release/feed-cold-refresh-20261031-evidence.json` і `NEXT_ACTIONS.md:160` (PR #62).
- k6-профілі 5/10/30/50 rps стануть у `docs/CACHE_PERFORMANCE_REPORT.md` як NOT_TESTED, доки є запущено.
- Один важкий локальний процес за раз (8 GB Mac); міграції й нагрузочні запуски — тільки за явним дозволом власника.
