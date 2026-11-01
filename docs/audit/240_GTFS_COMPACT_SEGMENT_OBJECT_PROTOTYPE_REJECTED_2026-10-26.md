# GTFS compact segment-object prototype rejected — 2026-10-26

## Experiment boundary

- Server branch `feature/transport-layer-availability`, canonical dirty source based at `92a26a3f617f32d644a66c0af46cba096ccb0ce0`; canonical source was not changed.
- Frozen Lviv archive SHA-256 `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164` (72 routes, 1,071 stops, 15,716 trips), Node `v24.22.1`.
- A throwaway module represented each candidate segment as a small object referring to shared trip/date data; the worker/public result boundary would require explicit conversion back to plain serializable objects. Prototype, temporary test copy, and paired benchmark were moved to `/tmp` after evaluation; none was integrated.

## Correctness

- The existing small-feed GTFS timetable suite passed **45/45**, including exhaustive one- and two-transfer path oracles and FASTEST/CHEAPEST/BALANCED winner checks.
- Seven-pair and five-pair within-process A/B replays on the three fixed O/Ds retained identical ordered itinerary hashes and all three strategy winners. All baseline and prototype Lviv runs still reported `searchTruncated=true`.

## Performance decision

The compact object prototype did not meet the no-regression requirement. In the final five-pair series, per-O/D medians were:

| O/D | Baseline | Compact prototype | Delta |
|---|---:|---:|---:|
| Holosko → Sykhiv | 1,562 ms | 1,398 ms | −10.5% |
| Naukova → Sykhiv | 1,041 ms | 1,060 ms | +1.9% |
| Rynok → Dubliany | 1,414 ms | 1,567 ms | +10.8% |

Earlier standalone process RSS samples varied substantially (including an apparent reduction in one process and near-baseline peak use in another), so the memory benefit is unproven. The object accessors also need an explicit plain-data conversion before worker `postMessage`; this adds a compatibility requirement. Rejected and not integrated.

## Next action

Do not retry accessor-backed candidate objects without a new representation and a stable peak-heap/RSS measurement. Keep the canonical full-object implementation, exact small-feed tests, and truthful truncation state while continuing independent release gates.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
