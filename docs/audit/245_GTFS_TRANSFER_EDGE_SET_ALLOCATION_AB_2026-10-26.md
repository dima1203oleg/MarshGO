# GTFS bounded-edge cursor allocation A/B — 2026-10-26

## Source and method

- Server checkout: `MarshGO-Server`, branch `feature/transport-layer-availability`, committed HEAD `92a26a3f617f32d644a66c0af46cba096ccb0ce0`; the checkout contains substantial pre-existing dirty changes. No broad source changes were staged.
- Feed: frozen Lviv GTFS SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (72 routes, 1,071 stops, 15,716 trips).
- Runtime: Node `v24.22.1`. Three deterministic OD pairs; 30-minute departure window, six-hour journey horizon, two transfers, 900/1,000/400 m access/egress/transfer bounds, 180-second transfer buffer, 100 returned journeys.
- A/B used a byte-for-byte copy of the current dirty `gtfsTimetable.ts` as “before”, compared with a candidate that replaces the per-boarding-stop `Set<number>` of contiguous stop cursors plus disjoint query-targeted destination cursors with direct ordered indexing. Only the measured search implementation delta was compared. Candidate runtime behavior was unchanged by subsequent explicit TypeScript annotations.
- Current modified source file SHA-256 after the annotations: `0f6a07775f021fc969194337e3201f8dd17ba3b7500c1393e3d54eac289af4a9`. This is a working-tree identity, not a Git commit or release artifact.

## Evidence

Three paired samples in one process for each OD produced identical ordered itinerary hashes, every itinerary's trip/stop/time/fare/transfer data, all `FASTEST`, `CHEAPEST`, and `BALANCED` winner identities, route-chain counts, and every truncation flag.

| OD | Before median | Candidate median | Paired sample medians | Exact output parity |
|---|---:|---:|---|---|
| Holosko → Sykhiv | 2,168 ms | 1,932 ms | before 1,565/2,168/2,603; candidate 1,723/1,932/1,938 | PASS |
| Naukova → Sykhiv | 884 ms | 792 ms | before 846/884/1,023; candidate 814/792/784 | PASS |
| Rynok → Dubliany | 1,594 ms | 1,432 ms | before 2,017/1,594/1,517; candidate 1,431/1,657/1,384 | PASS |

The medians were 10.2–10.9% lower in this single-process, three-pair comparison. Samples vary materially, so this is a local measured improvement, not a general latency guarantee or capacity SLA.

- Exact GTFS/worker/completeness oracle tests: 53/53 PASS after the runtime change.
- Full Server unit suite: 240 PASS, 0 FAIL, 1 opt-in integration test skipped. ESLint PASS. TypeScript initially surfaced inference errors around the cursor arrays; explicit number annotations fixed them and final `npm run typecheck` PASS.
- Frozen Lviv searches remain partial. All three still report stop selection, per-depth search budget, candidate sampling and segment-span loss; Holosko/Naukova also hit the candidate pool; Rynok hits the global step limit. Each returns 100 and response-page truncation remains true. This optimization removes allocation churn only; it does not improve route recall or prove dense-feed completeness.
- Postgres/Redis integration suite was `NOT_TESTED`: Docker CLI calls did not return and loopback ports 5434/6380 refused connections. No migration or integration script ran, and no Docker service was restarted.

## Decision and next step

Retain the direct cursor iteration in the existing dirty working tree because the tested output is exact and all three local medians improved. Do not push or present it as a release candidate: it depends on uncommitted surrounding timetable changes in this shared checkout. Next, benchmark a materially different query-directed segment materialization/index design against the same exhaustive small-feed oracle and frozen OD identities, winners, route-chain recall, truncation, latency and RSS. Keep `searchTruncated=true` until all candidate-loss causes are resolved or proven irrelevant to the response contract.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
