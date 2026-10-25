# City-scoped map layers and local passenger acceptance — 2026-10-25

## Exact candidate

| Component | Revision / environment | Result |
|---|---|---|
| Site | `7aed5344218058b024f5c269b36b03577d94026e` on `codex/site-current-pr24-integration-20261025`; pushed normally to the existing PR #25 branch | Local acceptance below; hosted CI was still running at checkpoint time |
| Server | `38f17b88f98c8530f8090cfc6745cd334c87e53c` | Local loopback API, isolated `marshgo_e2e` database and Redis |
| Browser | Local Site at `127.0.0.1:3000`, API at `127.0.0.1:3302` | Development OTP; no auth bypass |

## Defect fixed

The transport map used global layer health without applying each selected city's supported GTFS modes. As a result, the Metro layer remained selectable for Lviv despite the city's mode catalog omitting Metro. Site now maps transit layers to their required city modes, scopes the layer sheet to the selected city, and disables the Metro quick action when the selected city does not provide Metro. Added a focused regression test.

Evidence: in the authenticated local browser session, Metro was disabled/unavailable for Lviv and available for Kyiv. Focused transport-layer tests passed 6/6. Full Site suite passed 109/109, with typecheck, lint, production build and bundle-budget check passing. The map cannot display production tiles because its candidate has no configured production map style/data manifest; the route view truthfully reports that map configuration is needed.

## Passenger/browser acceptance performed

- Signed in only with a synthetic development account in the isolated local E2E database. No production account or auth bypass was used.
- Address autocomplete resolved public Lviv origin/destination points; address swap, date/time, passenger count, provider filter and route search were exercised.
- OPTIMAL, FASTEST and CHEAPEST controls changed the selected result. The API returned five candidates per strategy and honestly disclosed truncated graph search, approximate walking, unavailable trolleybus/train routing and unavailable UZ schedule data. This is not exhaustive routing or proof of provider coverage.
- Route details expanded stop lists and displayed boarding/alighting times. Segment focus changed the selected segment state. A production map base style was unavailable.
- Navigation opened preview and awaited foreground location permission; permission was not granted. No live GPS or ETA was claimed.
- Home quick actions, transport map, city selection, map layers, trip empty states, profile, documents, theme settings, help and all seven FAQ entries were opened. The transport map defaulted to Kyiv even while the Home context was Lviv; city-context persistence remains a UX issue to review.
- Browser console inspection reported no unexpected errors in this session.

## Acceptance boundaries and open requirements

| Requirement | Status | Evidence / remaining work |
|---|---|---|
| City-specific Metro availability | PASS (local browser + unit) | Lviv disabled, Kyiv enabled; test 6/6 |
| Main passenger search and result strategies | PASS (local API/browser, partial coverage) | One route-search journey; search disclosed truncation and missing capabilities |
| All account, booking, payment, trip lifecycle, chat and notification actions | NOT_TESTED | This session did not execute transactions, external messaging, payments, or every role-specific action |
| Mockup fidelity across all supplied images, light/dark and dimensions | NOT_TESTED | No complete visual comparison against the full reference set in this checkpoint |
| Live vehicle, GPS rendezvous, provider booking and fare coverage | NOT_TESTED / BLOCKED_EXTERNAL | No authorized live-provider or production device session |
| Production basemap and satellite imagery | BLOCKED_EXTERNAL | Provision a versioned, licensed map style/tiles source before visual acceptance |
| Staging, production smoke, release SHA | NOT_TESTED | No deployment or staging origin used |
| Physical iPhone and background GPS | NOT_TESTED | Simulator shell launch is recorded in audit 158 only |

## Exact next actions

1. Wait for Site PR #25 hosted CI on `7aed5344218058b024f5c269b36b03577d94026e`; record its final result.
2. Continue acceptance of remaining passenger flows using isolated test data, then exercise Admin/Partner role boundaries against the exact current candidate tuple.
3. Resolve map style/imagery licensing and deployment configuration; run visual comparisons against the provided mockups only after real candidate assets exist.
4. Keep rejected GTFS search-budget experiments rejected; pursue additive candidate discovery with frozen feed parity and completeness evidence.
5. Keep `PRODUCTION_READY=false` and `RELEASE_STATUS=NOT_RELEASED` until all mandatory release gates have evidence. No production deployment was performed.

## Hosted CI follow-up

After this checkpoint's local record was prepared, both hosted Site runs completed successfully for the exact head `7aed5344218058b024f5c269b36b03577d94026e`: PR run [40163680187](https://github.com/dima1203oleg/MarshGO/actions/runs/40163680187) and push run [40163677847](https://github.com/dima1203oleg/MarshGO/actions/runs/40163677847). This confirms Site CI for this branch head; it does not constitute staging or production acceptance.

The generated synthetic test account, its five owned test journeys, one development OTP challenge, and account-owned sessions/roles were removed transactionally from the isolated `marshgo_e2e` database. Only the local Vite and API processes started for this browser acceptance were stopped.

## iOS synchronized to the accepted Site SHA

- Updated the existing iOS PR #14 branch without force-push: commit `7dfd35bf5f06169d7df82fa8d0879fcaf02431b5` pins Site `7aed5344218058b024f5c269b36b03577d94026e` and retains Server `38f17b88f98c8530f8090cfc6745cd334c87e53c` in its build inputs.
- `npm ci --prefix web` completed with zero reported vulnerabilities. Local toolchain is Node 25.4.0 and emitted the declared-engine mismatch (project/CI require Node 24.21.0).
- `CAPACITOR_BUILD` Site production bundle and embedded release metadata built successfully; manifest recorded iOS `17da5c05be674cec2fadf7340cb5fdff5af010d9` as the source commit used by the build and the above Site/Server SHA pair, API contract `v1`, migration `055`. `npx cap sync ios` passed.
- iPhone 16 Pro Max Simulator compile/install/launch passed with local API origin `http://127.0.0.1:3302`; the screenshot shows the welcome page only. API was not running during this later simulator launch, so authenticated app workflows, GPS, map assets and background behavior remain unverified.
- iOS hosted PR/push CI for commit `7dfd35bf5f06169d7df82fa8d0879fcaf02431b5` was queued/in progress at this report update (runs 40163992039 / 40163988537); do not mark hosted CI passed until they complete.
