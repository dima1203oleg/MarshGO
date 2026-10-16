# MARSHGO — START HERE FOR CODEX

This is the Codex handoff for the MARSHGO web/PWA UX/UI and Map V2 redesign. Read the following source documents **in this order**:

1. [PRODUCT_CANON.md](../PRODUCT_CANON.md) — signed-off product invariants (exact 12 transport categories, 5 bottom navigation positions, separate top Messages and Notifications).
2. [Full UX/UI Specification v3.1](./MARSHGO_FINAL_UX_UI_TZ_v3.1_MAP_REDESIGN_2026-10-10.md) — full multi-screen UX, state and map redesign brief.
3. [PRODUCTION_READINESS_TZ_2026-10-09.md](../PRODUCTION_READINESS_TZ_2026-10-09.md) — production blockers, existing implementation and release gates.
4. [MAP_JOURNEY_DESIGN_SYSTEM.md](../MAP_JOURNEY_DESIGN_SYSTEM.md) — current map/Journey architecture and honest implementation status.
5. [PRODUCT_LOGIC_V2.md](../PRODUCT_LOGIC_V2.md) — previously agreed passenger/driver navigation, passive matching and trip life cycle.

Repo set:
- https://github.com/dima1203oleg/MarshGO
- https://github.com/dima1203oleg/MarshGO-Site
- https://github.com/dima1203oleg/MarshGO-Server
- https://github.com/dima1203oleg/MarshGO-iOS

## Mandatory implementation behavior

- Work in the existing repositories, not a parallel demo site.
- Start by examining exact current SHAs, branches, code ownership, release manifest and divergence between `MarshGO/codex/marshgo-production` and `MarshGO-Site/main`. The shared Site UI must also be the iOS UI.
- Catalog is exactly: `bus`, `marshrutka`, `trolleybus`, `tram`, `metro`, `carpool`, `taxi`, `train`, `bike`, `scooter`, `carsharing`, `transfer` in that order; `Усі` is a selection command and walking is an internal route leg.
- Bottom navigation exactly `Головна | Пошук | + | Мої поїздки | Профіль`. Top-right separate `Повідомлення` and `Сповіщення`. Theme under `Профіль → Налаштування → Вигляд`.
- Keep universal A→B search separate from active GPS navigation. Support 2D, lean 3D and hybrid satellite map modes, each day/night. Transit is an information overlay, not a fourth base-map renderer.
- All realtime markers, prices, seats and confirmation statuses must be backed by real server/provider data. Never fake provider availability, live positions or successful payments.
- Inventory every button/form/tab/modal/CTA and close all functional loops. Complete full passenger/driver scenarios, chat, reverse marketplace, rendezvous, cancellation, Rescue, reviews, privacy controls, provider registry.
- Run appropriate lint, TypeScript, unit, DB integration, browser E2E, accessibility and supported iOS acceptance. Do not assert tests were run unless they were.

## Visual reference assets

The owner provided three design reference images, bundled with the original chat artifact `MARSHGO_ANTIGRAVITY_DESIGN_PACKAGE_v3.1.zip` as:

- `reference_images/A_3_modes_day_night.jpeg`
- `reference_images/B_search_map_day_night.jpeg`
- `reference_images/C_neon_lightweight_map.jpeg`

**These binary images are not presently stored in this GitHub folder.** The authoritative text specification describes them in detail. Request the owner to attach the ZIP to the Codex task if you need pixel-exact visual reference. Do not claim to have retrieved them from GitHub.

## Starting instruction

Read all linked specifications; build an implementation inventory and task plan; perform the work across existing repositories; provide validated commit hashes, tests and evidence. Report any unavailable provider credentials, deployment infrastructure or physical-iOS testing as explicit blockers. Do not silently redefine the product canon.
