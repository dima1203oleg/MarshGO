# Multimodal routing root causes

2026-11-14 19:08 UTC. **PARTIAL / NOT_RELEASED**. This is an interim evidence report, not acceptance of Routing Engine 3.0.

## Findings

| Finding | Evidence | Status |
|---|---|---|
| Unmapped multimodal modes could serialize as bus | Server `server/index.ts`: isolated patch replaces fallback with exhaustive `Record<JourneyLegMode, string>`; metadata keeps explicit feed classification | Patched locally; canonical API integration NOT_TESTED |
| Real timetable search was excluded on intercity distances | Server PR #157, head `22e4798`; recorded earlier intercity browser probes in root progress log | Separate open PR; not proof of current deployed main |
| Identical walks repeatedly consumed the shared request budget | Request-local budget-keyed cache in `server/journey/walkingRoutes.ts`; negative control failed before fix; passing targeted suite | Fixture VERIFIED; live chain acceptance still fails |
| Confirmed walking legs were routed again | `server/journey/multimodalWalkRouter.ts` now reuses internal routed paths, rechecking geometry, boarding time and preferences | Fixture VERIFIED |
| Foot geometry contracts disagree | `osrmTransport.ts`: 100 m endpoint tolerance; `directWalkingCandidate.ts`: 15 m | Static VERIFIED; attribution of previous 16 rejected chains NOT_VERIFIED |
| Feeder cards tied into one train duplicated alternatives | Separate Server PR #158, head `1b6f522` | Open PR; full runtime acceptance pending |

These are contributing defects, not a quantified proof that all bus dominance is explained. No random modes or routes were inserted to manufacture diversity.

## Current probe

A read-only Kyiv foot-router request from [30.523, 50.450] to [30.489, 50.441] returned 212 geometry points, distance 3176.2 m, duration 2293.4 s, start/end offsets 11.08/12.02 m, polyline length 3175.35 m. This path satisfies the 15 m endpoint rule and does not explain the previously rejected chains.

## Diagnostics gap

Current patch reports ranked/visible **leg counts**, trunk/chain generation and rejection counts. It does not yet provide the requested complete feeds → imported routes → active trips → graph edges → generated → feasible → ranked → visible pipeline per product mode.

Added exact geometry subreasons: invalid timing, coordinates, metrics, endpoint snap, and distance/geometry mismatch. Thresholds were not loosened; no private GPS is added to diagnostics.
