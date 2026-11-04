# GTFS retention diff recheck — 2026-10-24

## Scope and exact sources

- Rechecked the existing uncommitted graph-retention experiment; no source files were changed during this recheck.
- Baseline: `MarshGO-Server` SHA `1c08a98dfe93224eb06cb8562bab2c9e64054573` in a clean detached temporary worktree.
- Experiment: same base SHA plus the already-present uncommitted changes to `server/journey/gtfsTimetable.ts` and `tests/gtfs-timetable.test.ts`; binary diff SHA-256 `be0148bf66db8b3adf6d06a921ac8a492dc358b595fded0b62c25627c925e550`.
- Frozen public Lviv GTFS: `https://track.ua-gis.com/gtfs/lviv/static.zip`, SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`.
- Query: Малий Голоско `[24.008217,49.864885]` → Сихів `[24.0175835,49.8013165]`; three serialized paired runs; Node `v25.4.0`.

## Evidence

| Variant | Search ms, runs 1/2/3 | Median | Ordered result SHA-256 | Trip / route chains | FASTEST / CHEAPEST / BALANCED winners | Truncation |
|---|---|---:|---|---|---|---|
| Clean baseline | 1966.82 / 1953.89 / 1927.41 | 1953.89 | `698e0e7538b5f0b9c0645ffdffd75be039ef921a2ebb79feb928237b29b6dd6f` | 58 / 37 | stable | `searchTruncated=true`, `candidateGraphTruncated=true` |
| Existing local diff | 1987.32 / 1999.42 / 1919.27 | 1987.32 | identical to baseline | 58 / 37 | identical to baseline | `searchTruncated=true`, `candidateGraphTruncated=true` |

The result is deterministic and identical on this OD. Median runtime differs by +1.71%, which is not a demonstrated performance change at this sample size. The experiment provides no measured completeness improvement here and must not be promoted on this evidence. This single OD does not replace the earlier three-OD rejection evidence or establish behavior on other queries.

## Verification

- GTFS timetable + journey scoring + bounded graph budget tests: **97/97 PASS**.
- TypeScript: PASS.
- Targeted ESLint: PASS.
- GitHub state, staging and live provider behavior were not checked by this replay.

## Decision / next action

Keep `searchTruncated` and `candidateGraphTruncated` exposed; do not claim dense-feed completeness or merge this experiment as a routing fix. Continue from the active exact Server candidate and develop a genuinely query-directed bounded search/allocation change, checking the independent small-feed exhaustive oracle before any repeated multi-OD frozen-feed replay. Keep release status `NOT_RELEASED` until the separate staging and release gates pass.
