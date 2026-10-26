# GTFS objective-search window screening probe — rejected (2026-10-25)

## Hypothesis and setup

Test whether extending the per-leg post-pool objective-reservoir search window from 25,000 to 50,000 steps would discover more useful candidates without raising the materialized graph limits. This was a screening experiment in an untracked copy of the router source, on Node 24.21.0 and frozen Lviv feed SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (72 routes, 1,071 stops, 15,716 trips). The committed source was not modified.

For each OD, one warm-up call per variant preceded a single measured parent/candidate call. Since this was not a repeated paired performance study, timings are descriptive only and are not used to claim a speedup.

## Screening results

| OD | 25k / 50k trip-chain diversity (top 100) | Route-chain diversity | Strategy winners | Ordered top-100 | Truncation |
|---|---:|---:|---|---|---|
| Holosko → Sykhiv | 65 / 56 | 44 / 38 | Same | Changed | Both truncated |
| Naukova → Sykhiv | 58 / 53 | 41 / 36 | Same | Changed | Both truncated |
| Rynok → Dubliany | 66 / 68 | 36 / 36 | Same | Changed | Both truncated |

The longer window did not improve FASTEST, CHEAPEST or BALANCED winners on any OD, changed all three ordered top-100 lists, reduced both trip-chain and route-chain diversity on the first two ODs, and did not remove truncation. The one-shot timings were noisy and are not a performance acceptance result.

## Decision

Reject the 50,000-step variant. Do not change production limits or source based on this probe. Continue investigating graph truncation, per-route budget allocation and bounded-search completeness with an oracle/paired-replay gate. Exact candidate code and full run evidence remain at audit 177; current source stays at `c217d6e4aa33ba032464428415c0694c35ad4fd3`.
