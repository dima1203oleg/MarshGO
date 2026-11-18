# 309 — PREMIUM UX/UI REDESIGN: FINAL REPORT (2026-11-01)

**Scope.** Directive «МАРШGO — МАКСИМАЛЬНО ДОСКОНАЛИЙ ПРЕМІАЛЬНИЙ UX/UI-РЕДИЗАЙН» for `MarshGO-Site` (Web/PWA), executed in the mandated 12-step order.

**Canonical tuple this report certifies:**

| Layer | Value |
|---|---|
| Site branch / HEAD | `qoder/site-ui-polish-20261031` / `255184c` |
| Redesign commits | 19, range `0d3f205..255184c` |
| Root checkpoint | `0e31084` (`NEXT_ACTIONS.md`) |
| Public image tag | `marshgo/web:RC-2026-11-01-order.2` |
| Served bundle | `dist/assets/index-CDLvxRZh.js` — 1 013,83 kB, gzip 273,29 kB |
| Public URL | `https://marshgo-dima.shares.zrok.io` → nginx `marshgo-proxy` :8080 → web :3900 |
| Data behind the UI | 52 registered / 21 enabled healthy+degraded providers; Lviv GTFS-RT live layer 443 борти |

**Status of the overall product is unchanged: `NOT_RELEASED`.** This is a UI/UX gate, not a release authorization.

---

## 1. The 12 mandated steps — closure evidence

| # | Step | Closed by | Evidence |
|---|---|---|---|
| 1 | Audit | task #18 UX-AUDIT-1 | baseline of design-system + live map recorded before any edit |
| 2 | Design system | task #19, `651c4c2`, `68d25cf` | `src/index.css` — 113 `--mg-*` declarations, 1 499 lines; one `--mg-action: #0B63D6` per theme (dark line 55, light line 142) |
| 3 | Shared components | `651c4c2`, `68d25cf`, `233`-series parity | `src/design-system/ui/{StatusBadge,tokens}`, `journey/{CanonicalRouteLip,JourneySegmentStrip,SavedJourneyCard}`, `transport/{TransportIcon,transportModeRegistry}` |
| 4 | Home / search | `249e822`, `0d3f205`, `e95faba`, `05baa6c`, tasks #41 #44 | `.release/ux-states-20261101/{offline-home-light,bike-search-pending,offline-search-dark}.png` |
| 5 | Markers / map | `3581fce`, `f3dc687`, tasks #24 #40 | `.release/ux-live-{arrivals,layer,layers}-*.png`, `.release/ux-public-{layers,focusdim}-*.png` |
| 6 | Results / navigation | `d9420cf`, `53c1347`, tasks #39 #45 | `.release/ux-states-20261101/public-boarding-{light,dark}.png` |
| 7 | Booking / MarshPass / Trips / Profile | `8b27533`, `a3c9189`, `1373a1a` | scanner + theme segments at 44 px; lazy profile sections and point picker no longer blank |
| 8 | Light AND dark verified | task #43 #44 | paired screenshots for every screen group below; both themes captured on the public build |
| 9 | Real browser screenshots | — | 32 PNGs under `.release/` (16 in `ux-states-20261101/`), captured with browser tooling, not mockups |
| 10 | Lint / types / build / tests | `255184c` | `npx tsc --noEmit` = 0 errors, `npm run lint` = 0, `npm test` = **226/226**, `npm run build` = bundle above |
| 11 | Fix every found defect | 18 commits | each defect row in §2 names its commit |
| 12 | Deliver report | this file | — |

Dev-endpoint leak check on the built bundle: **0** hits (no `:3002` / `:3000` / demo tokens / quick-login in production output).

---

## 2. Defects found → fixed → proven

| Screen group | Defect (measured, not assumed) | Fix / commit | Public or gate proof |
|---|---|---|---|
| Design tokens | Several blues used as «action» and «accent» with no single source | `651c4c2` | token audit in `tests/canonical-design.test.ts` |
| Cards globally | An unlayered card rule overrode each screen's own surface | `3a29d17` | light/dark re-screenshots |
| Search form | Steppers and trip-details row used two control families, sub-44 px | `249e822`, `c255afb` | measured hit-areas ≥ 44 px |
| Search running | Fake progress / spinner with no truth | `0d3f205` | `searchPendingCopy` shows measured elapsed, **no percentage and no ETA** — tests cover it |
| Deep-link | Second-precision `departureAt` made «Знайти маршрут» inert | `e95faba`, `05baa6c`, #41 | restored link submits and names the real button |
| Results | First card was highlighted without being selected; unknown fare looked like zero | `d9420cf`, #39 | selection is explicit; `UNKNOWN` renders as «ціна уточнюється» |
| Map focus | Focusing one leg blanked the whole route | `f3dc687`, #40 | `ux-public-focusdim-{light,dark}-20261101.png` — others dim, none vanish |
| Live map | Trust halo invisible; map re-fetched what it already had | `3581fce` | `ux-live-map-stops-light-20261031.png`, latency task #27 |
| Trips / privacy | Overlong titles; privacy & safety screens were stubs | `8b27533` | `ux-settings-tap44-light-20261101.png` |
| Profile / picker | Lazy sections and the map point picker could leave a blank screen | `1373a1a` | STATES-14 screenshots |
| Auth / onboarding | Sub-44 px targets, missing field labels, error semantics, raw hex instead of tokens | `0391485`, #43 | `ux-onboarding-step{1-light,2-dark}-20261101.png`, `ux-login-error-alert-20261101.png` |
| Empty / error / offline / unavailable | Copy implied absence of data meant absence of transport; `blockedProviders` unexplained | `a835077`, #44 | `empty-results-{light,dark}-v2.png`, `error-toast-dark.png`, `public-notices-{light,dark}.png` |
| Touch targets (rest) | Theme segments + scanner close below 44 px | `a3c9189`, #42 | measured 44 px |
| **Result cards looked duplicated** | In an 8-result Lviv→Kyiv search, cards 1/2/3 and 5/6/7 were byte-identical on every displayed metric — same 34 548 s duration, same `UNKNOWN` price, same transfers/walk, same aggregate «Очікування · 2 год 39 хв», same `score 0.053408534075540484`. Cause: they board the **same** 09:03Z train and differ only in which tram they catch; the card hid the only differentiating field. | `53c1347` + `journeyBoardingNote()` in [journeyResultPresentation.ts](../../MarshGO-Site/src/views/journeyResultPresentation.ts), rendered in [JourneyResultsPanel.tsx](../../MarshGO-Site/src/views/JourneyResultsPanel.tsx) | **8 cards → 8 unique `aria-label`; visible boarding line shows 08:21 / 10:08 / 08:33 / Поїзд 11:03 / 09:12 / 08:01 / 08:09 / Поїзд 16:03; 0 overflowing cards.** 4 new regression tests replay the real public response. |

The duplication fix was deliberately placed in the UI, **not** in server Pareto pruning: «catch the 08:21 tram» vs «wait until 10:08» is a real passenger choice, and ties are legitimate Pareto survivors.

A latent accessibility defect surfaced by the same measurement — three buttons previously had identical accessible text — is fixed in the same commit (the boarding value is in both the label and an `sr-only` sentence).

---

## 3. Accessibility and visual measurements (not self-assessment)

- Contrast of the new boarding note: **7.6:1** on white (`slate-600`), **9.3:1** in dark (`rgb(182,194,208)` on `rgb(9,27,42)`) — WCAG AA and AAA for small text.
- Minimum touch target 44 px enforced on every control measured this cycle (`c255afb`, `a3c9189`).
- Times are formatted in `Europe/Kyiv` (`06:21Z → 08:21`); no local-machine timezone leakage.
- Sort tab label made AA-safe (`68d25cf`).
- Light and dark are separate token sets, not inverted CSS filters; both captured per screen group.

---

## 4. What is NOT claimed

1. **Not a production release.** `NOT_RELEASED`. Deployment requires explicit owner authorization.
2. **1 MB initial chunk remains.** `index-9sZIGS80.js` = 1 013,61 kB / gzip 273,25 kB — visually clean but a real load-cost problem; code-splitting is still open.
3. ~~**Card order is still tie-driven.**~~ **Resolved the same session** (`255184c`, task BOARDING-ORDER-1). Measured cause was not a UI tie: the planner returns BALANCED ranks 1/2/3 for three journeys with identical `totalDurationSeconds 34548`, `walkingMeters 3022`, `transfers 1`, `legs 5` and identical `score 0.053408534075540484`, and ranks 5/6/7 for three more with `walkingMeters 2971 / transfers 2 / legs 7 / score 0.10355828220858895` — the rank gap inside such a group carries no information. The comparator now treats journeys that are equal on everything a passenger can compare (duration, price, walking, transfers, leg count) as one group and orders that group by boarding time, and otherwise defers to the server rank unchanged. Public result before → after: `08:21, 10:08, 08:33` → `08:21, 08:33, 10:08` and `09:12, 08:01, 08:09` → `08:01, 08:09, 09:12`; the genuinely different rail results stayed in their server positions (Поїзд 11:03 fourth, Поїзд 16:03 last). Evidence: `.release/ux-states-20261101/public-boarding-order-light.png`, 4 new regression tests (226 total).
4. **Open product question:** whether «9 год 36 хв» total duration should count waiting from the requested departure. Left to the owner.
5. **Search latency (#36/#38) and cold paths (#35)** are still in progress; the honest pending copy exists precisely because tens of seconds is the real number.
6. **iOS on a physical device** remains `BLOCKED_EXTERNAL`; simulator rendering is proven, device build is not.
7. **Admin/Partner portals over the public tunnel** are API-only (their Vite base `/` collides with the PWA's `/assets`); their UIs are verified locally on :3903/:3904.
8. **Testing caveat:** during public verification the dark theme was applied by adding the `dark` class directly instead of going through `themeService`, which proves rendering but not the persisted toggle path for that one pass.
9. **Fidelity of the redesign to the original mock** was judged on real provider data; no synthetic rideshare simulation appears in the certified bundle.

---

## 5. Resumption pointers

- Defect-by-defect narrative with exact numbers: `NEXT_ACTIONS.md` §AUTH-UX-13, §STATES-14, §DUPLICATE-CARDS-1.
- Screenshots: `.release/ux-*.png` and `.release/ux-states-20261101/`.
- Publication is additive and reversible: compose backup `compose.container-acceptance.yml.bak-boards1`, only the `web` service recreated, prior RC images untouched.
- Tests: `MarshGO-Site/tests/journey-result-presentation.test.ts` (`describe('journeyBoardingNote')`) reproduces the real public response as its fixture.
