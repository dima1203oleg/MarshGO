# Exact RC control and cross-browser acceptance — 2026-10-25

## Exact candidate tuple exercised

| Component | Branch | SHA | PR |
|---|---|---|---|
| Server | `codex/server-current-pr39-integration-20261025` | `38f17b88f98c8530f8090cfc6745cd334c87e53c` | [#40](https://github.com/dima1203oleg/MarshGO-Server/pull/40), stacked on #39 |
| Site | `codex/site-current-pr24-integration-20261025` | `9963aee9431c22cf118b965f0356e586951b87de` | [#25](https://github.com/dima1203oleg/MarshGO-Site/pull/25), stacked on #24 |
| iOS | `codex/ios-final-rc-20261024` | `17da5c05be674cec2fadf7340cb5fdff5af010d9` | [#14](https://github.com/dima1203oleg/MarshGO-iOS/pull/14) |
| Admin | `codex/p0-admin` | `9dbf7db0a935498ac40c98b19bc36bce056d630d` | [#1](https://github.com/dima1203oleg/MarshGO-Admin/pull/1) |
| Partner | `codex/p0-partner` | `c639257a7f28aeda5b378a816038b01651146b83` | [#1](https://github.com/dima1203oleg/MarshGO-Partner/pull/1) |

These are review candidates, not one merged or deployed release. Orchestrator state remains separately dirty and is not an immutable release input.

## Site change and exact-pair checks

The previous exact-pair route run exposed that selecting a bus/minibus kept unrelated itinerary legs on the map, contrary to the live-bus-focus requirement. Site commit `9963aee` carries transport mode metadata into map route segments and suppresses unrelated itinerary legs only for bus/minibus focus; ordinary segment focus continues to dim the other legs. The selected bus corridor remains the only itinerary route segment in map focus.

On the exact Server/Site pair, using loopback Postgres/PostGIS, Redis and deterministic local map/geocoder/routing fixtures:

- Server: 315 unit tests PASS, 3 opt-in tests SKIP; typecheck/lint PASS; integration 30/30 PASS. Frozen Lviv replay preserves existing strategy winners but remains truncated.
- Site: 108 unit tests PASS; typecheck, lint, production build and bundle check PASS.
- Main functional browser suite: 25/25 PASS. This includes the corrected bus-focus requirement, journey search, booking/community flows, navigation/re-route and rendezvous consent behavior.
- Production-route control audit: 169 controls clicked across the audited route set; 0 had no visible effect, 0 became stale before interaction, and 4 audit scenarios PASS.
- Responsive/browser matrix: 6/6 PASS on Chromium, Firefox and WebKit, covering home/search at 320, 390, 430, 768, 1280 and 1440 px and route-map/sheet/focus behavior with light/dark palettes.
- GitHub checks: Server run `40157852445`, Site run `40158631306`, Admin run `38622007161`, Partner run `38622007703`, and iOS run `40158678815` report success on the SHAs above.

The control audit covers visible enabled buttons, tabs, switches/radios and links enumerated on its 15 application routes. It does not claim every hidden, role-specific, external-provider or error-only state was exercised. Browser tests use fixtures and a local API, not production providers or staging.

## iOS verification

- iOS workflow pins Site `9963aee...` and Server `38f17b8...` and verifies the embedded manifest.
- Local Capacitor build metadata matched iOS `17da5c0...`, Site `9963aee...`, Server `38f17b8...`, API contract `v1`, and migration `055_provider_commercial_use_requires_license`.
- Capacitor sync and unsigned iOS Simulator build PASS. The app was installed and cold-launched on an iPhone 15 Pro Max Simulator; after startup it rendered the MARSHGO sign-in landing screen. The first screenshot was taken during the splash transition, then a later capture confirmed the page render.
- No interactive sign-in, provider-backed journey, GPS permission/background tracking, APNs, physical iPhone, signing, TestFlight or App Store test was performed. Local simulator build points to loopback test API and is not a deployable production configuration.

## Visual acceptance and release status

The route-map browser scenario captured and compared its fixture snapshots in Chromium, Firefox and WebKit. That is not a complete visual acceptance against all ten owner-provided mockups: production tile imagery, all live bus/rideshare states, all screens and both themes have not been reviewed against the references. The map fixture is synthetic.

No integrated staging deployment, production domain/API origin, live-provider commercial entitlement, production secrets, backup/restore, rollout/rollback, security acceptance or load test is evidenced. Router results still expose truncation. Admin/Partner authenticated tenant isolation has only standalone local checks, not integrated acceptance. No production deployment was performed.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Exact next actions

1. Confirm Admin/Partner exact SHAs and Server contract together in a clean isolated integration checkout; add authenticated tenant/RBAC acceptance rather than relying on their standalone builds.
2. Finish deterministic route completeness/parity work without hiding the existing truncation signal.
3. Compare all ten provided mockups with production-route captures in both themes and record visual PASS/FAIL per screen; fixture maps do not satisfy this.
4. Build a clean six-repository release tuple, verify migrations, environment configuration and CI, then run the integrated staging and security/load/recovery/backup/rollback gates.
5. Physical-device, provider agreement/keys and owner approval remain external gates. Production deployment remains prohibited until its separately required approval.
