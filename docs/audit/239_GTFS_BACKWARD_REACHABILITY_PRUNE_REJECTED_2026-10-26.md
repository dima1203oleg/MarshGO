# GTFS backward reachability pruning prototype rejected — 2026-10-26

## Experiment boundary

- Server branch `feature/transport-layer-availability`, tested base HEAD `92a26a3f617f32d644a66c0af46cba096ccb0ce0`; existing dirty source preserved.
- Frozen feed SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (72 routes, 1,071 stops, 15,716 trips).
- Node `v24.22.1`. Prototype lived in one temporary sibling module under `/tmp` for the benchmark; the canonical Server source was not edited.
- Concept: make a conservative stop-level reverse reachability superset from the selected destination, then avoid materializing candidate ride edges whose alighting stop is outside it. The prototype intentionally ignored timetable, direction-specific transfer prohibitions, pickup/drop-off constraints and segment-span limits so it would over-approximate feasible paths.

## Results

| O/D | Baseline segments | Prototype segments | Baseline result SHA-256 | Prototype result SHA-256 | Result |
|---|---:|---:|---|---|---|
| Holosko → Sykhiv | 415,243 | 415,243 | `ab8378da9492541b4078fafefb613d45536b20ba77e040372383266a670003e9` | same | all strategy winners and truncation status unchanged |
| Naukova → Sykhiv | 194,355 | 194,355 | `7f7c65d9e377edfb4713332208404c1163151184e6e54b381ead2f8d6fb4a877` | same | all strategy winners and truncation status unchanged |
| Rynok → Dubliany | 263,839 | 263,839 | `a34f0f3c6f718158c01a5c8eece6a5a4f4a5b0bfd1f0997a8dc786983a5c9a6b` | same | all strategy winners and truncation status unchanged |

The prototype found 474–574 potentially useful alighting stops out of 1,064 candidate stops, but every materialized edge in these three queries already ended at one of those stops. The additional prepass took about 80–100 ms from the beginning of the measured query. End-to-end single samples were noisy and mixed; no latency or memory improvement is claimed. All three searches remained truncated for the same reasons.

## Decision

Rejected: it did not reduce the graph at all on the target feed. No prototype source was copied into the Server worktree. The next routing experiment must reduce the candidate representation or event expansion before constructing the same full segment set; it must first pass the exact small-feed path/winner oracles and then show a paired frozen-feed reduction in segment count, peak RSS or latency without losing route-chain recall.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
