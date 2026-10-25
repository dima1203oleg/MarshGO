# GTFS routing stack integration and frozen-feed replay — 2026-10-25

## Scope

Integrated the reviewed Server routing candidate `codex/gtfs-route-budget-followup-20261024` into an isolated branch based on `feature/transport-layer-availability` after adding the small-feed calendar/realtime/transfer oracle. The integration branch is local only; it is not a release tuple and is not deployed.

## Exact candidate

- Server repository: `MarshGO-Server`
- Integration branch: `codex/production-routing-integration-20261025`
- Merge commit: `269a288ac3a8e0bceaa86c414ecb46dd0093f735` (`merge: integrate audited GTFS routing candidate`)
- Candidate source: `codex/gtfs-route-budget-followup-20261024` at the frozen replay baseline previously recorded in audit 134.
- Frozen Lviv GTFS archive SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (3,755,976 bytes; 72 routes, 1,071 stops, 15,716 trips).
- Runtime: Node `v25.4.0`; repository engine expects Node `24.21.0`.

## Verification evidence

- Server unit suite: **310 PASS, 0 FAIL, 3 opt-in SKIP** (313 tests total).
- TypeScript typecheck: PASS.
- ESLint: PASS.
- Loopback-only integration suite: **30/30 PASS**, including migrations, journey lifecycle, live overlays, last-seat booking race (20 concurrent attempts), cancellations, vehicle edits, Partner tenant isolation, navigation, cross-instance realtime, restart durability, and Redis rate limits.
- Frozen-feed replay: each of three OD queries was repeated five times. Ordered 100-result identity hashes exactly match the recorded baseline hashes and remain identical across all five repeats. Strategy winner signatures also remained stable across repeats.

| OD | Median (5 repeats) | Ordered result SHA-256 | Trip chains | Route chains | Search status |
|---|---:|---|---:|---:|---|
| Holosko → Sykhiv | 1,876.23 ms | `698e0e7538b5f0b9c0645ffdffd75be039ef921a2ebb79feb928237b29b6dd6f` | 58 | 37 | Truncated; result limit reached |
| Naukova → Sykhiv | 1,466.49 ms | `d60392aed4e68af3d4c2e9f8a5df3340344ded578624d9d912a4e31c40607d86` | 57 | 40 | Truncated; result limit reached |
| Rynok → Dubliany | 2,572.10 ms | `49a674a48b073e16e9eeab97fc550aaf015473d2e961f5118822470d60beadf8` | 58 | 32 | Truncated; result limit reached |

The replay measured a frozen local feed, not a live provider. It proves deterministic baseline parity for these queries, not search completeness or acceptable production capacity. Timings are single-process local medians, not a load test. Node version differs from the repository’s declared runtime.

## Release status and next step

The candidate has not been pushed or opened as a PR. A standalone Site correction is recorded below, but the Server and Site commits are not yet paired in an immutable release tuple; iOS, Admin, Partner, staging, external provider credentials/rights, physical iPhone acceptance, production infrastructure, backup/restore, rollback, security, and load gates are also open. Dense-feed search still reports truncation on all three queries. Keep `PRODUCTION_READY=false` and `RELEASE_STATUS=NOT_RELEASED`.

Next: assemble and verify a clean compatible exact-SHA integration tuple. Do not suppress truncation or present these replay results as complete journeys.

## Site response-contract follow-up

- Site repository: `MarshGO-Site`
- Isolated follow-up branch: `codex/search-truncation-status-20261025`, based on the fuller Site PR #23 candidate `9569bb4f174a4bdf912a6f490e69a359148db342`.
- Exact integrated-candidate commit: `192a526fedb415bcb9f9d3cfff1dac65fa05dd03` (`fix(search): distinguish truncated route result states`). The change was cherry-picked and resolved against the candidate's already-refined incomplete-search message; prior route, rideshare, and layer work remains in the ancestry.
- Added the Server `resultSamplingTruncated` response field to the client type and made the result panel distinguish result sampling from incomplete candidate generation. Legacy responses without the new field remain supported.
- Site checks on Node `v25.4.0`: unit suite **107/107 PASS**, typecheck PASS, ESLint PASS, production build PASS, and bundle budget PASS (17 JS chunks, each ≤350 KB gzip). The route-result notice selector covers five legacy/new-state cases across two tests.
- This Site SHA is not yet paired with the Server merge in an immutable release manifest and was not pushed or deployed. Browser visual acceptance was not rerun for this text-only status correction.
