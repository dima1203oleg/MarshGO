# Browser chain — zrok contour, 2026-11-14

- URL: https://marshgo-dima.shares.zrok.io (Vite dev, port 7777), viewport 390×844, Playwright Chromium.
- Runtime: Site worktree 330dd3 at f88ba55 **dirty (83 files)**; API port 3002 from canonical Server e9934ab **dirty**. This is not main.
- Test account: the driver role was enabled on it during the run.

| File | Screen | Result |
|---|---|---|
| mg-01-home-390.png | Home | VERIFIED renders, 5-item nav |
| mg-02-search-results-390.png | Kyiv→Lviv results | VERIFIED 2 rail journeys, fare UNKNOWN |
| mg-03-fastest-390.png | Fastest tab | VERIFIED |
| mg-04-route-detail-390.png | Route detail | VERIFIED geometry, «ЗА РОЗКЛАДОМ», «Ціна уточнюється», no fake GPS |
| mg-05-cheapest-disabled-390.png | Cheapest tab | VERIFIED disabled — unknown fare never ranks as zero |
| mg-06-quick-actions-390.png | «+» sheet | VERIFIED driver and passenger actions |
| mg-07-profile-driver-guard-390.png | Publish without driver role | VERIFIED redirect + guard message |
| mg-08-publish-form-390.png | Offer form | VERIFIED |
| mg-09-publish-filled-disabled-390.png | Offer form filled | VERIFIED disabled without verified car; DEFECT stale banner «Спершу активуйте роль водія у профілі.» ~15 min after enabling the role |
| mg-10-trips-upcoming-390.png | Trips | VERIFIED 5 tabs, honest empty states; PARTIAL notifications show trip-started events while Active is empty |
| mg-11-demand-validation-390.png | Demand form, empty submit | VERIFIED validation message, no POST sent |
| kyiv-lviv-journeys-search-response.json | Planner response | Raw API payload (scanned: 0 tokens/passwords) |

Other findings: `/bookings` and `/conversation-unread-counts` polled every 3.0 s while on Trips, regardless of realtime status (ProductionMarketplace.tsx interval); manifest fetched anonymously → zrok HTML interstitial, fixed in MarshGO-Site PR #140 (854abf7, 895/895). Token refresh after 401 VERIFIED.

NOT_TESTED: real offer/demand submits, two-account booking and negotiation, 320/430 px, physical iPhone.
