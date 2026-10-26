# Exact Server PR #43 frozen Lviv completeness replay — 2026-10-26

## Scope and reproducibility

- Repository: `MarshGO-Server`, isolated clean checkout `/private/tmp/marshgo-server-release-candidate`.
- Branch: `codex/server-release-candidate-20261026`.
- Exact Server SHA: `24c70dc31d652ac6ba9fbc5fcd7abd138378b457` (PR #43 candidate).
- Feed: frozen Lviv GTFS archive SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`, 72 routes, 1,071 stops, 15,716 trips.
- Replay: the existing three deterministic Lviv O/D pairs, 30-minute departure window, six-hour horizon, up to two transfers, 900 m access / 1,000 m egress / 400 m transfer walking, 180-second transfer buffer, and 100-result page.
- Runtime for this replay/test session: Node `v25.4.0`. Do not treat this as the package-pinned Node `24.21.0` CI result.

## Candidate search behavior

All three requests returned 100 journeys, but all were explicitly partial:

| O/D | Returned | Candidate graph truncated | Search budget truncated | Candidate sampling truncated | Search complete? |
|---|---:|---|---|---|---|
| Holosko → Sykhiv | 100 | yes | yes | yes | no |
| Naukova → Sykhiv | 100 | yes | yes | yes | no |
| Rynok → Dubliany | 100 | yes | yes | yes | no |

With `MARSHGO_GTFS_SEARCH_DEBUG=1`, candidate graph construction estimated 194,024–415,997 viable segment opportunities and reached the 100,000-segment graph budget for every O/D. Per-route allocation ranged up to its 5,000-segment cap. The router then traversed 94,745–226,336 search steps before its bounded candidate reservoirs stopped continuation. The largest observed heap sample was about 699 MB; these are diagnostic samples, not a capacity guarantee.

This confirms the main dense-Lviv defect on the exact PR candidate: the current finite graph representation omits viable candidate segments, and later bounded traversal/sampling also omits alternatives. The API correctly discloses partial candidate generation, so this is not a false-completeness bug, but it prevents claiming complete routing for these requests. Raising the cap is not justified by these memory observations.

## Regression tests

On this exact candidate, the focused GTFS timetable and journey-search-completeness suites passed **79/79** tests; the complete Server unit suite passed **316/316** with **3 opt-in DB integration tests skipped**; `npm run typecheck` and `npm run lint` passed (all on Node `v25.4.0`). The focused suite includes exhaustive small-feed one-/two-transfer oracles, all three strategy winner checks on fixtures, transfer/pathway constraints, query-time retention, and explicit dense-graph truncation reporting. Skipped database integration tests are not passes, and the fixture suite does not establish full Lviv-feed recall.

## Engineering decision

- Preserve explicit partial-search metadata and the visible client disclosure.
- Do not increase the graph cap or disable truncation.
- Continue from the existing query-relevance / event-index experiments; do not repeat rejected route-weighting, cap, temporal-retention, or queue-budget experiments.
- The next viable implementation is a query-directed event/segment source that materializes feasible stop-pair legs only when a bounded label reaches a boarding event, while delegating exact transfers, calendars, realtime overlays, fare semantics, and path identity to the production logic. First make it match the exhaustive small-feed production oracle; then compare exact three-OD itinerary identities, strategy winners, route-chain recall, truncation causes, latency, heap and RSS against PR #43.
- If the experiment cannot meet correctness and resource budgets, keep it isolated and retain the current honest partial result behavior.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
