# Current dirty-source Web acceptance and mockup boundary — 2026-10-26

## Exact source boundary

- Orchestrator: `/Users/dima1203/Desktop/MarshGO`, branch `codex/production-finalization-20261014`, HEAD `0211cff8ce75b048a0a1666856678a97764df265`, 317 changed/untracked paths in the working tree.
- Site: `/Users/dima1203/Desktop/MarshGO/MarshGO-Site`, branch `codex/sync-journey-mobility-ui`, committed base `ae2c8aaf140305c4a1124c0b9a232f21b09eed0e`, 45 changed/untracked paths.
- Server: `/Users/dima1203/Desktop/MarshGO/MarshGO-Server`, branch `feature/transport-layer-availability`, committed base `92a26a3f617f32d644a66c0af46cba096ccb0ce0`, 40 changed/untracked paths.
- E2E used a dirty Site production bundle and dirty Server source with isolated loopback Postgres/Redis plus map/geocoder/OSRM fixtures. This is mutable local-source evidence, not one immutable release tuple. Existing worktrees were preserved; no broad stage, reset, clean, commit, push, or deployment was done in this checkpoint.

## Functional acceptance evidence

- Full Playwright E2E against current dirty source: **25/25 PASS**.
- Button sweep within the production web flows: **179 controls clicked, 0 with no visible effect, 0 stale/changed before click**. This covers the controls discovered by the Site suite; it is not a declaration that every control on every page across all six repositories has been enumerated.
- Cross-browser responsive + canonical route-map/sheet/focus checks: **6/6 PASS** across Chromium, Firefox, and WebKit.
- Site: typecheck PASS, ESLint PASS, **99/99 unit tests PASS**, production build PASS.
- Server: **240 unit tests PASS**, 0 failures, 1 opt-in integration skipped; typecheck and focused lint PASS. Separate guarded loopback DB/Redis integration: **29/29 PASS**.
- Production bundle budget: **16 JavaScript chunks** checked from the current dirty Site E2E build; all are <=350 KB gzip. Largest measured chunks: MapLibre 274.5 KB; application entry 252.2 KB; MapLibre worker 140.7 KB.
- Prior authenticated Admin/Partner local browser evidence covers Admin's five sections, Partner's four sections, partner submission and Admin approval, and 54/54 responsive viewport checks; see audits [223](223_ADMIN_PARTNER_AUTHENTICATED_BROWSER_ACCEPTANCE_2026-10-26.md) and [225](225_PORTAL_RESPONSIVE_NAVIGATION_ACCEPTANCE_2026-10-26.md). It is a separate candidate/source tuple, not part of the above 25-case run.

## Mockup and component review

- Reviewed the existing route-map fixture states and the earlier ten-mockup comparison in audit [127](127_REFERENCE_MOCKUP_VISUAL_ACCEPTANCE_2026-10-25.md). The route map and navigation fixtures are functional, but use schematic/test map imagery. They are not the supplied licensed satellite/road map compositions, and no exact 10-image pixel comparison has passed.
- `JourneySegmentStrip` is reused in journey results and the map sheet. The totals/actions row and surrounding sheet markup are independently composed in `JourneyResultsPanel.tsx` and `JourneyRouteMapScreen.tsx`; there is no single `CanonicalRouteLip` component covering all six reference states. Segment mode, duration and fare labels are present, but the full common lip requirement is only PARTIAL.
- The live bus and confirmed rideshare references depend on authorized, fresh provider/GPS data. Fixture E2E proves UI behavior under fixtures, not live fleet coverage, vehicle movement, or driver ETA.
- Physical iPhone Safari, dynamic type, background/resume GPS, licensed map appearance, and production/staging screenshots remain unverified.

## Acceptance status

| Area | Result | Evidence boundary |
|---|---|---|
| Site primary passenger/driver web flows | PASS (local fixture E2E) | Mutable dirty source; not immutable candidate/staging. |
| Visible controls found by production-flow sweep | PASS (179; none inert in sweep) | Not an exhaustive census of every control in all six repos. |
| Chromium/Firefox/WebKit smoke | PASS (6/6) | Selected responsive + route-map scenarios only. |
| Site unit/type/lint/build and bundle budget | PASS | Local dirty source. |
| Server unit/type/lint and guarded DB/Redis integrations | PASS with 1 optional skip | Local dirty source; dense Lviv GTFS search remains truncated per audits 227–230. |
| Admin/Partner workflows | PASS in separate local authenticated evidence | Separate PR candidate tuple; not combined with current Site run. |
| Supplied 10 mockups visual parity | PARTIAL / NOT ACCEPTED | No exact reference-by-reference matched visual acceptance; map assets differ. |
| iOS physical-device acceptance | NOT_TESTED | Simulator evidence is not physical iPhone/Safari acceptance. |
| Unified six-repository immutable release tuple | FAIL / OPEN | Current dirty HEADs do not match one verified manifest tuple. |
| Staging, live providers, security/load/recovery/backup/restore/rollback | NOT_TESTED or BLOCKED_EXTERNAL | No verified deployed staging and provider entitlements/evidence. |
| Production deployment and smoke | NOT_RELEASED | No deployment performed or approved. |

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next exact actions

1. Review and reconcile dirty Site/Server/root diffs against the six-repository PR DAG without staging unrelated work; select an immutable exact SHA tuple.
2. Produce state-matched screenshots for all ten supplied mockups using approved production map assets. Implement/reuse one complete shared route lip only after checking its call sites and the existing dirty design changes; add visual and interaction assertions for all six states and both themes.
3. Enumerate page/control coverage separately for Site, Admin, Partner, and iOS; extend browser acceptance where an actual screen/control is not represented, without treating demo fixtures as live integration proof.
4. Complete the required provider, iOS, security, performance, staging, backup/restore, rollback and deployment gates from the release matrix. No production deployment before explicit owner approval.
