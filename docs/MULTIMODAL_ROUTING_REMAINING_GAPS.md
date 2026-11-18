# Multimodal routing remaining gates

2026-11-14 19:08 UTC. **PARTIAL / NOT_RELEASED**. Routing Engine 3.0 is not complete.

## Engineering gates

1. Identify the exact failing walking leg/subreason in previous 16 rejected real chains. The new counters distinguish timing, coordinates, metrics, endpoint snapping and length inconsistency. Do not loosen geometry limits or add endpoint connectors without physical-path evidence.
2. Finish per-mode feeds → imported routes → active trips → graph edges → generated → feasible → ranked → visible diagnostics. Current leg counts are not journey counts and do not prove completeness.
3. Complete objective-preserving, diversity-aware selection and the exact disabled-mode regression matrix. Preserve FASTEST, OPTIMAL and known-fare CHEAPEST witnesses; unknown price stays null.
4. Verify complete bike/scooter graph, availability, geofence, return/parking, carrying and booking semantics. Taxi market estimates are not confirmed dispatch. Carsharing/transfer need actual eligible sources or offers.
5. Review composition caps and latency: the last historical failed isolated search took 52.794 s. Neither performance nor chain acceptance is proven.
6. Complete exact departure/arrival constraints, calendars, realtime cancellations, minimum transfers, accessibility and wartime current-service checks across the required geographic scenarios.

## Integration gates

Active API 3002 has dirty changes overlapping the isolated patch in index, chain engine, walking routes and tests. Active Site 7777 also has substantial dirty changes. Do not overwrite either, replace the running process, deploy, or restart zrok to bypass integration review. Preserve the existing single web contour; no parallel preview/backend.

The isolated chain patch has not been committed or submitted as a new PR. Remote Server main remains `9477b73df9d70c34c7012547bf5cdb273a612737`; separate relevant PRs #155–159 remain open at this checkpoint. Protected main integration stays owner-controlled.

## Acceptance gates

- Canonical Qoder in-app browser for this chat is hidden/unattached. Current patch browser acceptance is BLOCKED; another session's visible browser is not a substitute.
- 20 required UI/API scenarios and the complete 27-region routing matrix remain unaccepted.
- Current tree fixture checks, typecheck and eight-file lint passed, but hosted CI, live real chains, two-account flows and physical-device checks are not proven for this patch.
- The five reports are interim evidence, not completion certificates. No nationwide coverage or release claim is made.
