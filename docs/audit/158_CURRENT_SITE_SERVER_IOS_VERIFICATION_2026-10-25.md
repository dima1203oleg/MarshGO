# Current Site, Server, and iOS verification — 2026-10-25

## Exact source revisions

| Component | Revision | Local verification |
|---|---|---|
| Server | `38f17b88f98c8530f8090cfc6745cd334c87e53c` | typecheck PASS, lint PASS, 315/315 unit tests PASS; three opt-in integration tests skipped |
| Site | `9963aee9431c22cf118b965f0356e586951b87de` | typecheck PASS, lint PASS, 108/108 tests PASS, production build PASS, bundle budget PASS |
| iOS wrapper | `4353cec3cacbaf662ceea047402f361024292b22` | Site SHA above built into isolated Capacitor checkout; Xcode simulator build, install, launch PASS on iPhone 16 Pro Max Simulator |

## Results and limits

- Site bundle budget: largest observed JavaScript chunk is 274.5 KB gzip, under the configured 350 KB per-chunk limit.
- iOS screenshot: `/tmp/marshgo-ios-site9963-iphone16-20261025.png`. It shows the welcome screen rendered inside the native shell with safe areas. This is packaging/launch evidence only.
- The simulator build used Node `24.22.1`; repository engines pin `24.21.0`, so npm emitted an engine warning. Build and launch still completed successfully.
- The simulator profile used `http://127.0.0.1:3302`; no API process was listening during the UI check. Login, authenticated route search, GPS, map tiles, booking, notifications and native permissions were not tested.
- Browser check of `http://127.0.0.1:3000/journeys/search` redirected an unauthenticated session to the welcome screen. The UI states that real SMS delivery requires a configured provider. No bypass or fabricated account was used.
- The authenticated Admin/Partner local flow remains documented in [audit 156](156_AUTHENTICATED_ADMIN_PARTNER_PREVIEW_ACCEPTANCE_2026-10-25.md). Admin PR #1 hosted verification passed at run `40162633629`; current Admin head is `f39c4b74839a393f4487c830930669eabc8c0390`.
- The current Site checkout has no production immutable map style manifest or licensed satellite asset configuration. Visual acceptance against the supplied satellite/live-vehicle mockups remains blocked; fixture screenshots are not production map evidence.
- Current exact-candidate GTFS completeness remains unresolved. Query-weighted graph allocation was rejected in [audit 157](157_GTFS_ENDPOINT_WEIGHT_EXPERIMENT_REJECTED_2026-10-25.md).

## Release status

No deployed staging, production smoke, physical iPhone acceptance, live provider coverage, load/security/recovery acceptance, or production rollout was established by these checks. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next action

Continue only with an additive routing candidate that preserves baseline itinerary identities, and restore an isolated authenticated Site/API test environment before asserting end-to-end passenger acceptance. Keep the map-provider, staging, credentials, physical-device and owner-approval gates open.
