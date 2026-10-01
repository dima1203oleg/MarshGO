# Web E2E acceptance

## Locally verified

- `npm run test:e2e` — 6/6 Chromium tests pass on an isolated local stack. Coverage includes two-user booking/negotiation/chat, route match confirmation/insertion, mobile navigation/GPS progress, off-route GPS replay through browser geolocation with reroute/route-version replacement, and Community journey display.
- `npm run test:browser-compat` — Chromium, Firefox and WebKit pass at representative phone, tablet and desktop viewports, including refresh, browser history and unknown-route handling.
- `npm run acceptance:live-providers` — one-time Chromium rendering of a public OpenFreeMap style with a live OSRM route; public Nominatim forward/reverse lookup also passed.

These are local or public-service checks. The browser E2E stack uses deterministic providers and does not establish hosted staging behavior, commercial provider availability, or production SLAs.

## Release acceptance still required

Run the same browser journeys against HTTPS staging with two independent accounts, real configured routing/geocoding/map assets, SMS, private storage, and actual production-like Redis/PostGIS. Capture Playwright traces/screenshots and fail on unexpected console errors, first-party network errors, or React exceptions. The required continuous golden path (route → GPS movement → passive match → pickup insertion → off-route route replacement → arrival → completed trip/review) remains unverified as one scenario.
