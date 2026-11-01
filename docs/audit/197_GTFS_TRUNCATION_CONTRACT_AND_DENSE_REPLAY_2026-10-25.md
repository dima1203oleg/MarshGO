# GTFS truncation contract and dense replay — 2026-10-25

## Exact cross-repository candidates

- Server PR #41: `dima1203oleg/MarshGO-Server`, branch `codex/gtfs-nearby-stop-retention-20261025`, HEAD `70e11d8d8730e54311f13d73953ab565fd6b432a`; draft, open, stacked on PR #40 at `38f17b88f98c8530f8090cfc6745cd334c87e53c`. PR #40 is stacked on #39, which is stacked on #38. Exact-head CI runs `40194603311` and `40194607141` both report SUCCESS.
- Site PR #27: `dima1203oleg/MarshGO-Site`, branch `codex/site-gtfs-truncation-reasons-20261025`, HEAD `cc1499573732a41e8ff31d7ab634d15421d45df1`; draft, open, stacked on PR #26 at `1b5986de5af875c5c2945df4752c23603c135ed3`. #26 is stacked on #25, then #24. Exact-head CI runs `40201475281` and `40201478772` both report SUCCESS.
- These candidates are related but **not merged into the respective main/release branches**. This audit does not change or promote the release manifest.

## Contract review

- Server `/api/v1/journeys/search` returns `data.gtfsTruncation` with seven independent boolean causes: `stopSelection`, `candidateGraph`, `searchBudget`, `searchStepLimit`, `candidatePoolLimit`, `candidateSampling`, and `responsePage`. The aggregate is OR-combined across the GTFS worker results while the older broad fields remain present.
- Server integration assertions verify the exact key set and boolean values and keep `partial`, `partialReasons`, and `resultsTruncated` consistent.
- Site's `ApiJourneySearchResult` uses the same seven keys. `JourneyResultsPanel` gives a plain-language incomplete-results status and puts technical causes behind “Чому список неповний”; response-page omission remains distinct from candidate loss.
- Site PR #27 is stacked on the status distinction introduced in PR #25, so safe release integration must honor that ancestry.

## Local verification this checkpoint

- Exact Site PR #27 worktree: focused journey status/panel tests **6 PASS / 0 FAIL / 0 SKIP**; typecheck PASS; ESLint PASS.
- Exact Server PR #41 worktree: complete Server unit suite **316 PASS / 0 FAIL / 3 opt-in integration SKIP**; typecheck PASS; ESLint PASS. Local runtime was Node `v25.4.0`, whereas the package pins Node `24.21.0`; exact-head hosted CI above passes on the configured runtime.
- Frozen GTFS archive SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`.
- Replayed three frozen Lviv ODs on Server `70e11d8` (Node `v25.4.0`): each returns 100 results and honestly sets both `searchTruncated=true` and `candidateGraphTruncated=true`. Deterministic IDs/strategy winners match the prior recorded baseline for this source family, but this does not establish completeness or production performance.
- Naukova → Sykhiv profile: 233 corridor stops, 815 interchange stops, 9,742 eligible trips; estimated graph demand 194,024 versus the 100,000 hard graph budget. 9 routes reach their 5,000 per-route cap. Search takes about 3.48 s in this single diagnostic and reports 94,745 search steps, 1,630 candidate results and candidate sampling truncation. This is a diagnostic on Node 25, not a supported-runtime SLA.

## Decision and next action

- The previous checkpoints describing missing structured truncation causes are stale with respect to current Server PR #41 and Site PR #27. The UI transparency part is now present in these draft PRs.
- The fundamental dense-feed recall/completeness issue is **not fixed**. Do not increase graph/search caps without a paired recall, latency and memory evaluation. Prior topology pruning and cap/window experiments were rejected in audit 195 and earlier records.
- Next: compare the exact generated graph and route chains against the exhaustive small-feed oracle, then prototype a destination-directed event/connection scan in an isolated Server branch. Require oracle parity and frozen multi-OD recall/latency/RSS improvement before accepting runtime changes. Reconcile the stacked PR ancestry before any release candidate integration.
- No staging, deployed provider probe, iOS physical device, production smoke, backup/restore or rollback gate was established here. Keep `PRODUCTION_READY=false`, `RELEASE_STATUS=NOT_RELEASED`.
