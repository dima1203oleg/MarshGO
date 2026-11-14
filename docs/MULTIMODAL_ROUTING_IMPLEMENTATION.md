# Multimodal routing implementation

2026-11-14 19:08 UTC. **PARTIAL / NOT_RELEASED**.

## Provenance

- Isolated Server worktree: `/tmp/mgwt/chains`, branch `qoder/multimodal-real-chains-20261114`, HEAD `ad981095ede883b03e58f93417faf101872c7103` plus uncommitted patch.
- Remote Server main, freshly queried through GitHub: `9477b73df9d70c34c7012547bf5cdb273a612737`.
- Active API 3002: canonical Server HEAD `e9934abbd8fc973177de8d7f47548739758a1b74`, dirty.
- Active Web 7777: Site worktree 330dd3, HEAD `b58cad91eddabbf89f016d438d446d36f169df87`, dirty; existing zrok retained.
- These identities differ. Passing isolated tests do not prove canonical runtime integration.

## Patch

The existing Journey Engine calls `composeRealTrunkChains`; no second backend is introduced. Real GTFS trunks may receive feeder transit, road-routed taxi estimates, eligible rental estimates or published community offers. Plain walk-only sides do not emit duplicate chains. Combination caps bound work; completeness beyond those caps is not proven.

Walking uses the existing OSRM gateway. A budget-keyed WeakMap reuses identical completed paths within one request. Cross-request caching still requires a graph version. Internally confirmed walking legs are revalidated without spending the route budget again. Published transit departure times remain fixed; flexible taxi/rental estimates may shift, after which connections are rechecked.

Unknown fares remain null. Exhaustive serialization preserves explicit transport metadata, including unclassified GTFS bus semantics. No marshrutka inference from vehicle size or arbitrary route numbers is added.

Geometry rejection now has five subreasons while preserving the original rejection decision. Counts are exposed under `modeDiagnostics.chains.multimodalRejectionDetails` in the isolated patch, not added to primary UI cards.

## Checks on this dirty patch

- Three targeted suites: **45/45 passed, zero failed/skipped**, 740.432208 ms.
- New detail tests before implementation: **2/2 failed** as expected.
- Typecheck: project TypeScript **6.0.3**, exit 0. Auxiliary 5.9.3 produced errors; that invocation is not a passing gate.
- Lint: **8 files executed**, zero errors/warnings. An initial CLI invocation ignored all files and is explicitly not evidence.
- `git diff --check`: exit 0.

No dependencies, shared database, canonical runtime, protected branch or deployment were changed. The chain patch has no new commit/PR yet. Live chain geometry acceptance, complete diagnostics, exact filter matrix and canonical E2E remain open.
