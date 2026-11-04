# MARSHGO — PRODUCT CANON (Ukraine)

**Decision date:** 2026-10-10  
**Status:** APPROVED / CANONICAL / NON-NEGOTIABLE WITHOUT PRODUCT OWNER APPROVAL  
**Scope:** MARSHGO web/PWA, shared iOS UI, server/API, Journey planner, admin transport registry, designs and all future implementation specifications.

## 1. Exactly 12 user-facing transport types, in this exact order

| Order | UI label (uk-UA) | Canonical ID | Includes |
|---:|---|---|---|
| 1 | Автобуси | `bus` | City and intercity buses |
| 2 | Маршрутки | `marshrutka` | Minibuses / route taxis |
| 3 | Тролейбуси | `trolleybus` | Trolleybuses |
| 4 | Трамваї | `tram` | Trams |
| 5 | Метро | `metro` | Metro |
| 6 | Попутки | `carpool` | MARSHGO Community carpool |
| 7 | Таксі | `taxi` | Verified/contracted taxi partners |
| 8 | Поїзди | `train` | All rail incl. suburban/electric/city trains |
| 9 | Велосипеди | `bike` | Standard and electric bicycles |
| 10 | Самокати | `scooter` | Scooters including electric |
| 11 | Каршеринг | `carsharing` | Carsharing |
| 12 | Трансфери | `transfer` | Transfers |

**Exactly 12 top-level categories.** Do not add separate main filter buttons for `walk`, `suburban_train`, `city_train`, `intercity_bus`, `ebike`, `moped`, `plane`, `ferry`, `water`, `city_transit`, `other`, `car_rental`, or `funicular`. Legacy/backend journey-leg modes may remain in historical data and technical adapters. Do not delete history to enforce the user-facing taxonomy. Any exceptional local service can be represented inside an existing canonical offering only when semantically correct; otherwise it remains outside the 12-category Ukraine UI until the product owner explicitly approves a change.

## 2. Filter and Journey behavior

- `Усі` is a **selection command/state**, not a 13th category; initially active. Clicking `Усі` removes manually selected restrictions and searches among available categories. Selecting one or multiple specific types deactivates `Усі`.
- **Multi-select is mandatory:** e.g. Автобуси + Маршрутки + Метро + Попутки together.
- **Walking is automatic** first/last-mile and transfer routing; never a separate top-level transport button. Walking limits/preferences can be configured contextually without adding a 13th mode.
- Preserve the exact displayed order above (mass-use transit first, carsharing and transfers last) in home/search/filters/admin defaults.
- **One universal A→B search, one Journey/results system, one shared map.** No twelve separate search flows or independent maps.
- Group variants via internal subtype/capability fields (electric bike under `bike`, suburban trains under `train`, intercity buses under `bus`), not via extra main categories.
- Transport types controlled from a **central server registry**, with city-specific enabled/disabled/coverage/capability values accessible to Admin; this is separate from the provider feed registry. Local frontend icon/label fallback may exist but must not fabricate availability. Providers need genuine authorization, credentials, freshness and supported capabilities.
- Compatibility mapping required for current IDs, including `minibus → marshrutka`, `suburban_train → train`, `city_train → train`, `intercity_bus → bus`, with historical journey persistence preserved.

## 3. Canonical global navigation

**Bottom (exactly 5 positions):**  
1. Головна  
2. Пошук  
3. **Central emphasized `+` action**  
4. **Мої поїздки**  
5. Профіль

Bottom center `+` is the action sheet, not a sixth destination. It includes the useful existing actions: `Шукаю поїздку`, `Опублікувати поїздку`, `Почати навігацію`, `Знайти пасажира`, subject to capabilities/permissions. Route/nav/history belong in **Мої поїздки** and related in-context flows; no separate bottom `Маршрут` tab.

**Top:** separate **Повідомлення** (chat/negotiations) and **Сповіщення** (system events), with independent unread counters. Do not merge them into one button.

**Theme:** `Профіль → Налаштування → Вигляд`: Світла / Темна / Системна (default). No global theme toggle in header.

## 4. One map, lightweight sophisticated rendering

Use the existing MapLibre-based shared map (not twelve maps). 2D base, perspective 3D navigation and satellite/hybrid map modes. Transit is an information overlay/layer, not a transport-search category or an extra base map. Provide route legs, stops, live vehicle sprites/icons, ETA only when supported by legitimate fresh feeds, GPS privacy, graceful stale/offline states, accessible textual alternatives and efficient GPU rendering. Never simulate live GPS as a true position. Do not unnecessarily add heavyweight 3D models.

## 5. Change control and acceptance

This file overrides prior conflicting conceptual lists and navigation mockups. Before every UI refactor, compare screens, search types, backend enums, DB constraints, URL serialization, admin settings and the iOS Site bundle against this canon.

**A change in the set, order or labels of 12 categories, five-item bottom navigation or separation of messages and notifications requires explicit new approval from the product owner and a documented decision update.** An implementer must not change these by aesthetic preference or by copying legacy code.

Automatic release tests should assert the canonical 12 IDs/order and exact five global positions, center `+`, two separate top actions and correct role-independent base navigation. A passed compile/test does not itself establish live provider availability or production readiness.
