# Site status lifecycle fix and cross-browser CTA acceptance — 2026-10-25

## Change

- Parent Site: `9569bb4f174a4bdf912a6f490e69a359148db342` (`codex/rideshare-route-detail-reference-20261024`).
- Candidate Site: `b416da14dd566c0a84a07c2a2eeb7e0f31480aa1` (`codex/site-place-search-guard-20261025`), PR [MarshGO-Site #24](https://github.com/dima1203oleg/MarshGO-Site/pull/24), open and unmerged.
- `ProductionMarketplace` clears transient status feedback when the active section changes and gives its dismiss button the accessible name “Закрити повідомлення”.
- The root fixture E2E file adds a regression for status dismissal/reset and checks fresh-fix navigation start/finish.

## Verification

- Candidate Site on Node `24.22.1`: typecheck, ESLint, unit tests (**105 pass, 0 fail, 0 skip**), production build, and gzip bundle budget all pass.
- Exact local fixture E2E: **15/15 pass** on Chromium, Firefox and WebKit (5 cases per browser), using Site candidate above and Server `134ed017828a020e1d5f696b3cb9ea95527bb093`. The checks cover conditional CTAs, status dismiss/reset, entered-address swap, and fresh-fix GPS navigation start/finish.
- E2E database cleanup checked after the run; no active GPS sessions remained for the synthetic test users.
- Broad WebKit control sweep remains **PARTIAL**: 179 controls clicked, no stale targets, runtime errors or unexpected 5xx, but a generic no-effect heuristic reports 11 cases. Follow-up semantics now confirm the search address-swap control and fresh-fix navigation start/end work; selected tabs/current-section navigation are expected idempotent. Nine candidates still need route-specific assertions, especially the separate journey-search swap and home/back/message/profile/trip states. This is not full semantic acceptance of every control.
- GitHub Site CI run `40139361574` for the exact PR head completed successfully. PR #24 is mergeable and remains open/unmerged.

## Limits

These are local fixture checks, not staging or production acceptance. PR #24 is not merged, so the release manifest remains pinned to the prior Site SHA. The supplied mockups remain partially/unaccepted because the approved production map style and real live transit/rideshare overlays are not available. Staging, provider entitlements, physical iPhone/APNs, authenticated Admin/Partner and remaining release gates are still open. `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
