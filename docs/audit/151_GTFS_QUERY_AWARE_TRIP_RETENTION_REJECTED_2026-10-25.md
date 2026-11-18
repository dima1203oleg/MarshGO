# GTFS query-aware trip retention experiment — 2026-10-25

## Candidate and scope

- Base Server SHA: `38f17b88f98c8530f8090cfc6745cd334c87e53c` (`codex/server-current-pr39-integration-20261025`).
- Isolated experiment: `/private/tmp/marshgo-gtfs-query-aware-retention-20261025`, branch `codex/gtfs-query-aware-retention-20261025`.
- Experiment changed only the tie-break priority for transfer-only trip groups, counting up to eight query-feasible stop-pair handoffs.
- Frozen Lviv archive SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`.
- Compared the default frozen query against the exact unmodified base checkout. Runtime in both executions was Node `v25.4.0`; repository expected Node `24.21.0`. This paired replay is internally comparable but is not a supported-runtime acceptance result.

## Verification

- Full Server unit suite on the experiment: **315 PASS / 0 FAIL / 3 opt-in SKIP** (318 total).
- TypeScript typecheck: PASS. ESLint: PASS.
- Five serial experiment replays had identical result hash `b5ae817329144a4b4b2b81df3e5a2c0644623c9bc16ab65c205f0066d328e1bb` and identical FASTEST/CHEAPEST/BALANCED winners.
- Baseline exact base SHA result hash was `ae63d38ab6848ab5b8a44fa18103efd684f1697aaafb8902f56bed7dfd31c726`; the recorded five-run PR #38→#39 comparison in audit 148 had 60 unique trip chains and 43 route chains for this OD.
- Experiment retained 58 unique trip chains and 42 route chains. It preserved the three selected strategy winner IDs, but reduced candidate diversity and remained `searchTruncated=true`, `candidateGraphTruncated=true`.
- Experiment replay latency ranged 2.21–2.40 s on this machine. One baseline replay was 2.38 s; this is not enough to claim a latency improvement or regression. Heap/RSS samples varied and are not used for a memory claim.

## Decision

**Reject and do not promote.** Although the winners were preserved, the query-aware handoff count reduced distinct itinerary-chain recall and did not remove truncation. The experimental source change was reverted in the isolated worktree; its base code is again clean. No production branch or release candidate was changed.

## Next step

Continue investigating route-budget allocation and the source of underfilled per-route budgets against the existing exact-transfer oracle. Any new candidate must preserve all three strategy winners for all frozen OD pairs, increase useful chain recall without materially regressing latency, and keep truthful truncation status until the graph is demonstrably complete. Repeat the paired multi-OD replay under the declared Node `24.21.0` runtime before promotion.

Production remains `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.
