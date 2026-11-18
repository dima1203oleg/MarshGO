# Supported-runtime Lviv route replay — 2026-10-26

## Method

- Canonical Server checkout: dirty `feature/transport-layer-availability`, base
  HEAD `92a26a3f617f32d644a66c0af46cba096ccb0ce0`.
- Runtime: bundled Node `v24.22.1`.
- Frozen GTFS archive SHA-256:
  `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`;
  72 routes, 1,071 stops, 15,716 trips.
- Three fixed OD pairs, same departure/query settings as audits 212–215; two
  runs per OD with `.tmp-route-repeat-bench.mts`.

## Results

| OD | Returned each run | Ordered result SHA-256 (both runs) | Elapsed ms (run 1 / run 2) | Search truncated |
|---|---:|---|---:|---|
| Holosko → Sykhiv | 100 | `ab8378da9492541b4078fafefb613d45536b20ba77e040372383266a670003e9` | 1,635.74 / 1,840.21 | Yes |
| Naukova → Sykhiv | 100 | `7f7c65d9e377edfb4713332208404c1163151184e6e54b381ead2f8d6fb4a877` | 920.87 / 1,157.13 | Yes |
| Rynok → Dubliany | 100 | `a34f0f3c6f718158c01a5c8eece6a5a4f4a5b0bfd1f0997a8dc786983a5c9a6b` | 1,886.25 / 1,512.81 | Yes |

All FASTEST/CHEAPEST/BALANCED winners also matched between repeats. This is
determinism evidence for these fixed requests only. Two samples per OD are too
few for a performance claim, and every OD still reaches the 100-result page
while reporting incomplete search. No search limit was raised or hidden.

## Status

Routing completeness remains an open P0 gate. The next algorithm change must
retain path identity and strategy winners against the exhaustive small-feed
oracle, then show increased feasible-chain recall on the frozen feed without
violating bounded latency/memory. Release remains `NOT_RELEASED` and
`PRODUCTION_READY=false`.
