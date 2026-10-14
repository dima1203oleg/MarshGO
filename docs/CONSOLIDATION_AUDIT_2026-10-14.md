# MARSHGO repository consolidation audit

**Snapshot:** 2026-10-14. Counts below compare tracked Git trees at the listed candidate refs. They do not include local-only dirty files, generated `.release` files, ignored build outputs, or a semantic equivalence proof. No duplicate source was deleted during this audit.

## Repositories and refs compared

| Tree | Repository/ref | Commit |
| --- | --- | --- |
| Central | `MarshGO` / `codex/navigation-experience-6` | `c02d35785c3e31ddfbec82a1c4789006bdf91cc8` |
| Server | `MarshGO-Server` / `codex/redis-smart-cache` | `64ed70c72fec06cb9418dc7feee67ae0acee3826` |
| Site | `MarshGO-Site` / `codex/journey-rendezvous-map` | `22fe4f1089f3acfb342e8a8399ca8e9fe4cd1730` |
| iOS | `MarshGO-iOS` / `codex/pin-rendezvous-site` | `c304ae30b19bdaca57931baedeec4ffde02bca2d` |
| Admin | `MarshGO-Admin` / `codex/p0-admin` | `9263befb9b8e8d1eecb2a6c492a9e39a33794d76` |
| Partner | `MarshGO-Partner` / `codex/p0-partner` | `4293510ab1b8a64a30dc4db2b432595fef1a51ec` |
| MarshGO2 | `MarshGO2` / `main` | `8542f4b5` (local checkout also has 26 dirty entries) |

These are comparison inputs, not a statement that all PRs are merged, compatible, or production-approved.

## Central Server source versus canonical Server

Compared central `server/` (106 files) with Server `server/` (109 files):

- 85 same relative paths; 59 byte-identical; 26 same-path files differ.
- 21 files exist only in central; 24 only in Server.
- Examples currently central-only include `journey/arrivalEngine.ts`, `journey/multimodalChainEngine.ts`, `mobility/vehiclePositionCache.ts`, `mobility/realtimePoller.ts`, `registryService.ts`, and migrations 037 and 041–047.
- Examples currently Server-only include cache service modules, `communityComposition.ts`, GTFS fare/realtime modules, live vehicle and walking-route services, and later migration files.

This is material divergence. Central `server/` cannot be removed as a duplicate. Each central-only module needs an owning Server PR or a documented retirement decision, with dependency/API/migration tests before the central copy is disabled.

### Migration numbering conflict

Identical migration content has different sequence numbers in the two trees: city-train/funicular content is central migration 043 and Server migration 041; provider-choice content is central 044 and Server 043. Server also has migrations 049/050 absent from this central tree, while central contains unique migration numbers through 047. Do not renumber, copy, or apply both sequences until migration ledgers and dependencies are reconciled against a disposable database.

## Central Site source versus canonical Site

Compared central `src/` (153 files) with Site `src/` (120 files):

- 96 same relative paths; 48 byte-identical; 48 same-path files differ.
- 57 files exist only in central; 24 only in Site.
- Examples central-only include common components, mobility flow/timeline UI, `StopArrivalsSheet`, stop-arrival mapping, trip lifecycle, and `BookingRescueModal`.
- Examples Site-only include its application entry point, canonical journey design system/state, map focus/route models, rideshare map features, and navigation engine.

Central `src/` is not a duplicate. Site remains the canonical Web/PWA/UI owner. Central-only user-facing modules must be classified and transferred by feature PR after checking their Server API dependencies and the supplied approved design references; no mechanical tree copy is safe.

## iOS source comparison

Central `ios/` and product `ios/` each contain 21 files at these refs. Nineteen same-path files are byte-identical; two same-path files differ (`App/App/Info.plist` and `App/CapApp-SPM/Package.swift`). Keep native iOS ownership in `MarshGO-iOS`; inspect the two differences before removing any central native files. Shared Web UI is consumed from Site by SHA and must not be independently copied into the native repo.

## Hash findings and safe ownership outcome

The same-path SHA-256 scan found 183 exact-identical path pairs across the compared candidate trees, plus same-path content differences. There are also identical blobs at different paths (including common error helpers and migration bodies). A matching digest proves byte identity only; it does not establish that both copies are still required or safe to delete. The present disposition is:

- Server/API/migrations: Server owns; central copies remain until each unique delta has an accepted Server PR and exact-SHA integration evidence.
- Web/PWA/UI: Site owns; central copies remain until each unique delta is accepted in Site and integrated without changing the approved UX.
- Native shell: iOS owns; compare the two plist/package differences before central cleanup.
- Admin and Partner: their own frontends; all security and tenant checks remain Server-owned.
- Release orchestration: central owns manifests, CI, deployment, shared integration fixtures and cross-repository E2E.

## Branch and PR topology

- Central PR #1 (`codex/marshgo-production` → `main`) is a large draft; PR #2 (`codex/redis-smart-cache`) is based on it; PR #3 (`codex/navigation-experience-6`) is based on PR #2. This is a stack, not three independent release candidates.
- Server PR #3 (mobility registry) is a parent for PR #4 (partner platform foundation) and PR #5 (Redis Smart Cache). The commits need a reviewed integrated Server candidate; these refs cannot be combined with a normal cross-repository Git merge.
- Site PR #6 is the current Site candidate. iOS PR #5 pins its exact SHA. Other iOS candidates pin different Site revisions.
- Admin PR #1 and Partner PR #1 are feature UI candidates; the current Server release pin lacks the partner API/migration 051 needed by the Partner portal and some Admin workflows.
- During this audit, three additional feature PRs were opened for GTFS stop-arrival filtering/display and transport-layer availability. They remain separate, unmerged changes.

## MarshGO2 disposition

Remote `MarshGO2/main` has no open PRs and no additional remote branches observed. The local checkout has 26 dirty entries (22 tracked modifications and 4 untracked files), including a substantial redesign in `App.tsx`, maps/routes/screens, auth/API models, and new adapter/auth/date-time files. There were no exact same-path/SHA matches for its tracked files in the compared canonical trees, although journey search, route details/maps, profile, messages, and MarshPass are conceptually shared product features. This work has not been behaviorally compared to the current Site screens, tested, or migrated. Keep it intact; archive candidacy is BLOCKED until the dirty design/code has an explicit disposition and unique functionality is mapped to Site or Server.

## Required follow-up before source cleanup

1. Build an explicit file/module transfer matrix for all central-only Server and Site paths and the two changed iOS files.
2. Resolve migration ordering/content against the database ledger and test every candidate sequence on disposable PostGIS.
3. Integrate Server registry, partner foundation, cache, and stop-arrival changes into a reviewed candidate with contract tests.
4. Compare `MarshGO2` UI and uncommitted changes with canonical Site screens and transfer unique designs/features through PRs.
5. Run exact-SHA five-component acceptance, then propose deletion of individual central copies in a separate review. Preserve old Git references; do not clean worktrees or archive `MarshGO2` automatically.
