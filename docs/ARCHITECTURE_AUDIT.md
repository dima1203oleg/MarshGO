# MARSHGO architecture audit — 2026-10-26

## Target ownership model

The requested 5+1 boundary is coherent: Server owns business logic and persistence; Site owns shared Web/PWA UI; iOS wraps a pinned Site build; Admin and Partner are separate clients of the same Server; the root MarshGO repository owns integration and release artifacts. No sixth backend is introduced.

## Observed state and material risks

1. **Release source drift:** The current manifest pins Server `a403a51…`, Site `6961afc…`, iOS `be5478b…`, Admin `f39c4b7…`, Partner `97a3727…`, and integration `0d3ed4a…`. Current local Server/Site/iOS/Admin/orchestrator HEADs differ. The tested dirty Server/Site trees are not reproducible from those pins until reviewed changes are captured in immutable commits and the manifest is deliberately updated.
2. **PR stack complexity:** Server and Site each have more than twenty open PRs, with deep base-branch chains. Several heads are drafts; known conflicting PRs include orchestrator #2, Server #1, Site #1, iOS #3/#1. A mergeability indicator is not semantic or test acceptance.
3. **Route search completeness:** Current dense Lviv replay still reports truncation across tested OD pairs. Preserve an incomplete-search status and do not market search as exhaustive; continue from audits 212/215.
4. **Client/API evidence boundary:** Local Server unit/integration and Site fixture E2E pass, but fixture tests do not establish live provider permissions, production freshness, paid booking, or deployed API compatibility.
5. **iOS tuple mismatch:** A simulator launch was previously observed for an iOS wrapper embedding a different Site SHA. It is not acceptance of the current Site worktree or a physical device.
6. **Admin/Partner authorization:** Builds and small unit suites are not proof of authenticated RBAC, cross-tenant isolation, audit logging, or real organization operations.
7. **Operations gates:** No deployed SHA is in the manifest. Staging, provider entitlement, physical iPhone/APNs, security acceptance, load targets, backup/restore and rollback are not all evidenced as passed.
8. **Worktree sprawl:** Server currently registers 75 worktrees, 30 marked `prunable`. Orphaned Git metadata and potentially unique uncommitted files need a provenance/content audit before cleanup; none were removed.

## Required architectural sequence

1. Freeze/review the current dirty diffs without discarding user work.
2. Select one Server head and validate migrations plus API contracts.
3. Select one Site head against that exact API contract and run route/browser acceptance.
4. Pin the same Site SHA in iOS; validate Admin and Partner against the chosen Server.
5. Update the root manifest to exact clean SHAs only after the tuple is reproducibly built and tested.
6. Establish staging and close external/provider and operational gates before requesting the separate production rollout approval.

## Evidence boundary

Local tests and fixture replay are useful engineering evidence but are not staging or production evidence. Production remains `NOT_RELEASED`; no production deployment is authorized by this audit.
