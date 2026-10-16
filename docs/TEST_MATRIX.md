# Test Matrix

| Layer | Command/evidence | What it establishes | Limitation |
|---|---|---|---|
| Typecheck/lint/unit | `npm run check:production` | TS boundaries, configured ESLint scopes, unit contracts, Vite production build, JS gzip budget | Not whole-repo lint; legacy/demo source has 144 supplemental ESLint findings |
| Navigation replay | `npm run navigation:replay` | Deterministic clean, jump, weak-GPS and offline fixtures | Synthetic traces; no consented physical trace is checked in |
| Integration | `npm run test:integration` | Real local PostGIS, Redis, API processes, outbox/realtime/restart/rate-limit and routing adapter against local OSRM fixture | Local providers; not a public deployment or paid-provider test |
| Browser E2E | `npm run test:e2e` | Real Chromium UI, independent account contexts, auth, marketplace booking/negotiation/chat/trip, navigation and mobile viewport | OTP/geocoder/OSRM/map tile fixture services are local deterministic test providers |
| Browser compatibility | `npm run test:browser-compat` | Chromium, Firefox and WebKit at 390×844, 820×1180 and 1440×1000; desktop welcome and authenticated home; overflow, sidebar, current-data empty-state and console checks | Three browser engines and representative viewports, not every browser/device/OS version; fixture API and test OTP |
| Live provider browser probe | `npm run acceptance:live-providers` | One-time live Nominatim geocoding, OSRM road route, MapLibre browser render with OpenFreeMap vector style | Public endpoints have no SLA; not the app's production CDN/manifest or end-to-end account journey |
| iOS simulator | `SIMULATOR_UDID=… npm run ios:simulator` | Capacitor package builds, installs and launches on iPhone 16 Pro Max Simulator | Launch/welcome smoke only; not physical iPhone or complete authenticated navigation flow |
| Staging/production | Not run | Requires deployed environments | `BLOCKED_EXTERNAL` |

Do not convert skipped opt-in suites or unavailable external checks to PASS. Production release report: [RELEASE_STATUS.md](RELEASE_STATUS.md).
