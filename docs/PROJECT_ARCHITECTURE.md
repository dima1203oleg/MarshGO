# MARSHGO project architecture

**Audit date:** 2026-10-14. This describes the intended 5 + 1 ownership model and the observed release candidate, not a claim that all open changes are merged or production-ready.

## Repositories

```text
MarshGO-Server ─┐
MarshGO-Site ───┤
MarshGO-iOS ────┼── exact commit SHAs ──> MarshGO release manifest and integration pipeline
MarshGO-Admin ──┤
MarshGO-Partner ┘
```

The five product repositories are the only canonical product-source locations. The central `MarshGO` repository owns orchestration and integration evidence. It may contain Docker build recipes, Compose/deployment configuration, test fixtures, generated release inputs, and cross-product E2E tests; it must not become an independent product implementation.

## Runtime boundaries

- Server owns HTTP/API contracts, PostgreSQL/PostGIS, migrations, Redis, authentication and authorization, bookings, marketplace, messages, routing, transport feeds, realtime and provider adapters.
- Site owns the Web/PWA experience, the canonical design system, map and multimodal journey UI, profiles, trip and booking flows, themes, and shared browser-facing UI. The global navigation remains `Головна / Пошук / + / Поїздки / Профіль`; route guidance must not obscure it.
- iOS owns the Capacitor/Xcode host and native integrations. Its workflow checks out a pinned Site revision and synchronizes that web bundle; it must not fork equivalent React screens.
- Admin and Partner are separate frontends backed by the same Server API. All administrative permissions and tenant isolation must be enforced in Server handlers and data access, not trusted to frontend visibility.
- Central owns release pins, cross-repository integration tests, production gates and deployment definitions. Production Compose must build from materialized Server/Site source trees at the manifest SHAs.

## Current integration shape and limits

The central materializer currently checks out Server and Site by SHA and creates a release Compose file with those directories as Docker build contexts. iOS independently pins Site for simulator builds. The central path does not yet build or prove compatibility for Admin and Partner, does not record immutable image digests, and does not build/sign an iOS release artifact. The current candidate therefore remains `NOT_RELEASED`.

`MarshGO2` is not a canonical repository in the 5 + 1 model. Its locally modified design and code must be compared and migrated into the relevant product owner before any archive decision.

See `docs/CURRENT_PROJECT_STATE.md` for audited refs, open changes, and known blockers.
