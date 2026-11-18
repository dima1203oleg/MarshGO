# Transport mode routing coverage

2026-11-14 19:08 UTC. **PARTIAL / NOT_RELEASED**.

This is a routing evidence matrix, not nationwide feed coverage. Prior isolated Kyiv→Lviv search observations are historical session evidence, not a fresh canonical 7777 retest. Source evidence is dated in `MARSHGO_NATIONAL_COVERAGE_AUDIT.md`; existence of a source is not integration or current service availability.

| Category | Available evidence | Generation / validation | Web acceptance and remaining gap |
|---|---|---|---|
| carpool | Published-offer data model; earlier DB check found zero future offers | Fixture offer→train composition passes; live new chain acceptance absent | NOT_TESTED; need eligible real offers, not substitute fixtures |
| marshrutka | Some explicit feed classifications; generic route_type 3 remains unclassified | Exhaustive mode map; exact selected-only matrix pending | NOT_TESTED; do not infer from size/route number |
| bus | GTFS sources and previously observed train→bus alternatives | Timetable path present; new trunk-chain validation failing | Canonical current matrix NOT_TESTED |
| taxi | Road graph can produce geometry; market fare estimates | Taxi→train fixture passes | Partner dispatch/availability/booking unconfirmed; not a booked ride |
| tram | Validated source evidence in national audit; earlier intercity results contain tram legs | Transit composition present | Canonical selected-only and mixed tests NOT_TESTED |
| trolleybus | Validated source evidence; earlier results contain trolleybus legs | Transit composition present | Canonical selected-only and mixed tests NOT_TESTED |
| metro | Earlier Kyiv source warning: stops/geometry/timetable/transfers absent or disabled | No proven current metro route | Source/integration gap; real service absence must not be inferred |
| train | GTFS timetable mirror; previous search produced rail legs | Trunks generated; new composed chains fail geometry | Current-service freshness and canonical acceptance remain open |
| bike | Regional bicycle graphs and separate PR #156 | Own-bike and rental semantics must remain distinct; fixture chain passes | Graph coverage, carrying rules and canonical E2E incomplete |
| scooter | Earlier Kyiv GBFS availability measurement | Eligible rental composition requires geometry and return rules | Parking/geofence/current availability and canonical E2E incomplete |
| carsharing | No proven usable source in this checkpoint | No proven candidate | Partner/source access; NOT_TESTED |
| transfer | No proven usable offer in this checkpoint | No proven candidate | Partner/source access; NOT_TESTED |

Walking is a connecting segment, not a thirteenth product category. All 12 selected means allowed modes, not a requirement to use every mode in one journey.

The existing national 27×12 audit does not prove settlement-wide or routing-wide coverage. Full 27-region routing matrix and per-mode stage counters are still required. No zero count here is presented as proof that transport does not exist.
