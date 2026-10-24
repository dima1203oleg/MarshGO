# GTFS endpoint tie-break experiment — rejected — 2026-10-24

## Scope

Tested the existing local endpoint-ranking change on top of the exact current Server PR #38 head rather than its older parent.

- Exact base: `dima1203oleg/MarshGO-Server` SHA `8e570768c7e1e4dd2f016764d7396d9776e92abc` (PR #38 head).
- Experimental source diff SHA-256: `7588b9b29106f792a6d28011eb18946c753055ea8a19d4a4839115fa28048dbe` (only `server/journey/gtfsTimetable.ts` changed on the exact base).
- Frozen public Lviv GTFS SHA-256: `bb4ac0ce9127b4967ad889379f523b04b84a0bb033814aa8c844526b42078164`.
- Query: Малий Голоско `[24.008217,49.864885]` → Сихів `[24.0175835,49.8013165]`; three serialized paired runs, Node `v25.4.0`.

The experiment reorders origin-serving segments within the same retention tier so departure time precedes in-vehicle segment duration. The temporary checkout was not committed or pushed.

## Results

| Variant | Search ms, runs 1/2/3 | Median | Ordered result SHA-256 | Trip / route chains | Truncation |
|---|---|---:|---|---:|---|
| PR #38 | 2125.99 / 2173.62 / 2105.91 | 2125.99 | `6a6c4a1ab31ef22b42c13d50a05b7cba2fb9a3d95c52a841cfee2c1924124ce6` | 59 / 38 | graph and search |
| PR #38 + local diff | 1976.85 / 1971.61 / 2008.45 | 1976.85 | `698e0e7538b5f0b9c0645ffdffd75be039ef921a2ebb79feb928237b29b6dd6f` | 58 / 37 | graph and search |

PR #38 selected BALANCED `32659_0_1:4571→4595`; FASTEST and CHEAPEST selected the chain `29559_1_1:4571→4573` + `32878_0_1:4574→4690`. The local diff changed all three selections: BALANCED selected `29559_1_1:4571→5001` + `31679_1_0:5139→4690`; FASTEST and CHEAPEST selected `29559_1_1:4571→4878` + `31679_1_0:44973→4690`.

Although the experimental runs were faster, they returned fewer distinct chains and changed every strategy winner. Latency is not a valid improvement when achieved by losing candidates, and both variants still disclose truncation.

## Verification and decision

- GTFS timetable + journey scoring + bounded graph budget tests: **97/97 PASS**.
- TypeScript and targeted ESLint: **PASS**.
- **Reject this tie-break.** Do not apply it to PR #38 or the release candidate. Keep the stable output on the exact PR head and continue investigating bounded graph completeness with the small-feed exhaustive oracle plus additional frozen-feed ODs.
