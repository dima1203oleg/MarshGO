# WebKit control audit triage — 2026-10-25

## Exact tested candidate

- Production Site source: PR #27, `740f952729bc6f62498080660e2f70833026350f`.
- Server fixture: `38f17b88f98c8530f8090cfc6745cd334c87e53c`.
- Isolated E2E database: `marshgo_e2e_button_audit_20261025` on loopback PostgreSQL `127.0.0.1:5434`; Redis DB 14. Only fixture services and data were used. No existing database was cleared.
- Browser: Playwright WebKit on this Mac. This is WebKit automation, not physical Safari/iPhone acceptance.

## Results

- Broad WebKit audit clicked 169 enabled controls. It found no stale targets and no page errors/unexpected HTTP 5xx, but its generic no-visible-effect assertion failed with 11 observations. This means the audit is **not a clean pass** and the observations require semantic classification.
- Three of four tests in that WebKit button-audit group passed. In particular, the explicit home-banner selector test passed, and the trip route loaded with its expected tabs.
- A separate WebKit run passed both meaningful flows: (1) swap populated origin/destination places and preserve their coordinates through a real journey-search request; (2) start navigation without a destination with a fresh GPS fix, create a server session, expand the panel, and end the session. Result: **2/2 PASS**.
- A separate WebKit accessibility/state check passed: active trip sections expose `aria-selected`, the active global navigation item exposes `aria-current="page"`, and switching to Search updates URL and selected navigation state. Result: **1/1 PASS**.

## Classification of the 11 observations

The generic audit records an effect only when its fingerprint changes within 100 ms or a request begins. That is insufficient for idempotent actions and asynchronous location acquisition. Source inspection and focused WebKit tests show:

| Control | Triage |
|---|---|
| `Поміняти місцями` on `/journeys/search` and `/search` | The broad sweep used empty/equal endpoints, so swapping has no visible difference. Populated-address swap plus coordinates is separately verified in WebKit. |
| `Пошук` on `/journeys/search`; `Поїздки` on `/trips`; `Профіль` on `/profile`; `Повідомлення` on `/messages` | Likely selected-route reactivation. Production global navigation uses `aria-current="page"`; a focused WebKit test confirms current trip/search states. `/messages` reactivation was not separately asserted. |
| `Активні` on `/trips` | State can already be active after account data loads; the broad fingerprint omits `aria-selected` (it includes class, which may update asynchronously). Source uses `aria-selected`; standalone selection behavior is covered for tabs, but this exact active tab click was not isolated. |
| Home banner selector 1 | It can already be selected; a dedicated WebKit test confirms both banner controls switch `aria-pressed` and content correctly. |
| `Назад` on `/` | Context dependent (the broad sequence may retain a navigation overlay); not separately isolated. No product defect confirmed. |
| `Почати без пункту призначення` on `/` | The broad sequence had a stale GPS fix and sampled after 100 ms. Fresh-GPS start succeeds in WebKit. The stale-GPS feedback path was not verified by this click. |

## Decision

Do not report the WebKit broad button sweep as PASS, and do not describe the 11 observations as 11 confirmed product defects. Two observations remain insufficiently isolated (`Назад`, stale-GPS start feedback), and two need their exact active-state assertions made explicit (`Повідомлення`, `Активні`). No JavaScript crash or unexpected 5xx was observed in the broad sweep. The tested production entrypoint is `ProductionMarketplace`; the legacy `BottomNav` component is only used by DEV `DemoApp` and is not counted as production acceptance.

The independent visual gate remains open: on Site PR #27, `transport-map-layers-light.png` differs from the current golden by 12,657 pixels (4%). The golden was not updated. See audit 189. The supplied mockup parity is not accepted.

## Release boundary

This evidence uses local fixture map/geocoder/OSRM and a pinned local Server. It does not establish live-provider, staging, production, licensed map-style, physical iPhone, load, recovery, backup/restore, rollback, or deployment readiness. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next actions

1. Replace the broad 100 ms fingerprint-only treatment of idempotent controls with semantic state assertions while retaining failure detection for genuine inert actions.
2. Isolate `Назад` and stale-GPS recovery in WebKit; explicitly assert the message/state transition.
3. Resolve the remaining visual mismatch against the approved reference, without refreshing the golden to manufacture a pass.
4. Re-run route-map and broader WebKit acceptance on one exact Site/Server SHA pair.

## Follow-up confirmation

After the first report draft, isolated WebKit checks confirmed both remaining behaviors:

- A fresh account with a deliberately stale geolocation fix clicks `Почати без пункту призначення`; the UI exposes `GPS-точка застаріла`, and `Назад` returns to Home. Result: **1/1 PASS**.
- Populated-place swap and fresh-GPS start/end remain **2/2 PASS**; active-section/tab and bottom-navigation state remains **1/1 PASS**.
- The broad harness itself deliberately preselects `Активні` before enumerating controls and clicks the current route tab; those are same-state activations. Empty-input swap is also unchanged by definition. Its no-effect list was therefore a semantic-audit false positive, not evidence of 11 inert product controls.

The screenshot gate was repeated against the same Site PR #27 SHA and remains **FAIL**, with the identical 12,657-pixel / 4% delta on `transport-map-layers-light.png`. Expected and actual images were visually inspected; the candidate uses fixture/schematic map assets and revised transport-category presentation. The screenshot was not approved and no golden was refreshed.

## Updated next action

Treat the isolated WebKit functional scenarios as PASS and keep the broad generic no-effect assertion as an audit-harness limitation until it gains semantic/idempotence handling. Continue by resolving reference-based visual acceptance and run the full route-map suite on the exact candidate after changes.
