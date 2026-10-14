# Repository ownership matrix

The owner listed here is the only canonical home for the corresponding product source. Changes crossing boundaries should use versioned API/type contracts and exact source pins, not duplicated source trees.

| Repository | Canonical ownership | Explicitly out of scope |
| --- | --- | --- |
| [MarshGO-Server](https://github.com/dima1203oleg/MarshGO-Server) | API, auth/RBAC, profiles and verification, PostgreSQL/PostGIS, migrations, Redis/cache/rate limits, rides and reverse marketplace, bookings/MarshPass, messages/realtime, routing/navigation services, GTFS/GTFS-RT/GBFS, OSRM/GPS, provider registry, partner tenant enforcement | Web or native UI implementation; release orchestration |
| [MarshGO-Site](https://github.com/dima1203oleg/MarshGO-Site) | Web/PWA, canonical design system, shared web UI, search/results, maps, journey and navigation screens, profiles, trips/bookings, responsive behavior and dark/light themes | Native iOS host/capabilities; API authorization or migrations |
| [MarshGO-iOS](https://github.com/dima1203oleg/MarshGO-iOS) | Capacitor/Xcode project, native plugins, permissions, background GPS, push capabilities, simulator/TestFlight/archive workflows | A second source copy of Site screens; Server logic |
| [MarshGO-Admin](https://github.com/dima1203oleg/MarshGO-Admin) | Standalone administrative frontend, moderation and operator/service monitoring workflows | Privileged policy enforcement or persistence; those belong in Server |
| [MarshGO-Partner](https://github.com/dima1203oleg/MarshGO-Partner) | Standalone partner/transport-operator portal, organization onboarding and partner workflows | Cross-tenant authorization or unsupported operational APIs; those belong in Server |
| [MarshGO](https://github.com/dima1203oleg/MarshGO) | Release manifests, pinned-source builds, Compose/deployment, infrastructure templates, integration/E2E tests, release and recovery docs | Canonical backend, web, native, admin, or partner product source |

## Shared contracts

- OpenAPI/API schemas and shared transport types must have one reviewed version boundary. A frontend may generate or consume a client, but must not independently redefine authorization policy.
- Database migrations belong in Server. The central release gate records the migration version and runs compatibility checks against the exact Server SHA.
- iOS consumes the exact Site SHA recorded in the same candidate manifest; the iOS repository must not vendor a separately maintained Web UI.
- Admin and Partner should consume the same Server API. Every tenant-scoped query must be scoped by the authenticated organization membership in the Server layer.
- MapLibre styling and shared Web presentation belong to Site; provider credentials and routing/geocoding adapters belong to Server or deployment configuration as appropriate.

## Change ownership procedure

If a feature appears in two repositories, compare behavior, contracts, tests, and Git history before moving or removing anything. Transfer unique code through a feature branch and pull request in the owning repository. Keep the original until tests and integration prove the new owner is complete. The central repository may then stop building a legacy copy in a separate reviewed change.
