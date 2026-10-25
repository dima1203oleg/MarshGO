# Server PR #41 truncation contract and exact CI evidence — 2026-10-25

## Candidate identity

- Repository: `dima1203oleg/MarshGO-Server`.
- Draft PR: [#41](https://github.com/dima1203oleg/MarshGO-Server/pull/41), stacked on draft PR #40.
- Branch: `codex/gtfs-nearby-stop-retention-20261025`.
- Exact branch head: `70e11d8d8730e54311f13d73953ab565fd6b432a` (`docs: describe journey truncation detail`).
- Implementation commit: `1aa34fa2166d3a6f3040a2ebd08985da61d5c9ee` adds the structured per-cause truncation object to `/api/v1/journeys/search`; the API documentation commit above is docs-only.
- PR remains draft and is not merged into the server production branch.

## Behavior now made observable

`data.gtfsTruncation` reports the OR-aggregated GTFS causes across the primary transit search and secondary mobility-to-metro searches:

- `stopSelection`
- `candidateGraph`
- `searchBudget`
- `searchStepLimit`
- `candidatePoolLimit`
- `candidateSampling`
- `responsePage`

Existing aggregate fields remain for compatibility. This describes where information may have been lost; it does not recover omitted candidates or claim that the search is complete.

## Verification evidence

- Local fresh-database/isolated-Redis integration harness on implementation commit `1aa34fa`: **30 PASS, 0 FAIL, 0 SKIP**. It includes a journey-search HTTP assertion for the exact structured truncation fields, plus migration, journey, booking, concurrency, tenant isolation, navigation, multi-instance realtime, restart durability, and rate-limit coverage.
- Local TypeScript typecheck, touched-file ESLint, and `git diff --check`: PASS.
- Hosted Server CI for exact head `70e11d8`:
  - push run [40194603311](https://github.com/dima1203oleg/MarshGO-Server/actions/runs/40194603311): **SUCCESS**;
  - pull-request run [40194607141](https://github.com/dima1203oleg/MarshGO-Server/actions/runs/40194607141): **SUCCESS**.
  - Both include dependency audit, lint, typecheck, unit tests, fresh migrations, integration tests, production API image build, and local PostGIS/Redis image smoke.

## Remaining routing limitation

The frozen Lviv feed replay still reaches the 100-result response page and reports truncation. The dense-query diagnostics recorded in audit 182 found candidate-graph, search-budget, and sampling loss despite stable repeated ordering. The public reason fields make that state clearer but do not fix completeness. Existing test-only query-directed event-index prototypes pass tiny exhaustive fixtures but have not been shown safe and memory-bounded on the dense production-shaped replay; they are not promoted into the serving path.

## Release state and unrelated CI blocker

- Server PR #41 remains an unmerged draft candidate; this CI result is not production deployment evidence.
- Root orchestrator commit `160621180983bd24d625944cb944c794d13357b1` has a successful hosted security scan. Root CI fails at the explicit private-repository access setup because the GitHub Actions secret `MARSHGO_REPOS_READ_TOKEN` is absent. The workflow requires read-only Contents access to the private Admin and Partner repositories. No protection was bypassed.
- Staging, deployed SHA, external provider credentials/contracts, physical iPhone acceptance, full security/load/recovery/backup/restore/rollback gates remain unverified or blocked.
- `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next action

Design an additive, bounded, query-directed GTFS candidate search that preserves the exact transfer authority and ranking winners. Validate identity completeness against the existing small one-/two-transfer oracles and frozen Lviv cases, and report supported Node-version latency and memory before considering production integration.
