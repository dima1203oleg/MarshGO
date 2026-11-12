# Current exact release-candidate acceptance — 2026-10-26

This checkpoint supersedes the pending items in audit 242 where newer evidence is available. All runs refer to the exact candidate SHAs below; the original dirty root/Site/Server worktrees were not reset or broadly staged.

## Candidate tuple evidence

| Component | Exact SHA | PR | Current hosted result | Scope limit |
|---|---|---:|---|---|
| Server | `24c70dc31d652ac6ba9fbc5fcd7abd138378b457` | #43 | verify passed | API/server checks; not deployed |
| Site | `df0d61d3ff6c36c8522e8d57721a361d94ec16b9` | #28 draft | verify passed, runs 40292993643 and 40292999186 | browser run uses local fixtures; strict visual comparison still fails |
| iOS | `808685022654925de3bbbe911a9ebd25d381db7c` | #15 draft | simulator-build passed twice, runs 40293246120 and 40293264988 | compile/simulator CI only; no physical iPhone/TestFlight |
| Admin | `a008dbad8edc5d81d716a0913e10c325f739540b` | #1 | typecheck, lint, unit tests, build passed | no current-tuple authenticated tenant acceptance |
| Partner | `5ec9f368d2788e44483a0effe6eac34838e89790` | #1 | typecheck, lint, unit tests, build passed | no current-tuple authenticated tenant acceptance |
| Orchestrator | candidate PR #6 head `2b87b8b016ce8b4c309adc4399ad31b81781cd09` | #6 draft | verify failed closed at step 15 | missing Actions secret `MARSHGO_REPOS_READ_TOKEN`; cross-repo materialization/build steps skipped |

Admin, Partner and Orchestrator SHAs above are their current open PR heads, not proof they form a compatible release tuple with the Server candidate. The candidate branches are stacked across PR bases and are still unmerged.

## Browser acceptance against exact Server/Site SHAs

- Full Playwright E2E: 24/25 passed in 3m 54s. Passed coverage includes 169 main-screen button clicks (0 inert, 0 stale before click), booking/chat between independent accounts, driver GPS matching/reroute, 12 transport categories, responsive navigation, URL restore, truncated-search disclosure, rendezvous map, consent and revocation, GPS denial, and route selection.
- Sole full-suite failure: strict `journey-results-light.png` screenshot comparison, 38,818 pixels (~12%). Snapshot and threshold unchanged. Actual and expected render nearly alike at normal scale, but pixel acceptance is still FAIL; no visual baseline is approved or replaced.
- The unmodified route-map spec also revealed a contradictory assertion: it expected zero dimmed segments and one total segment when selecting Metro. Product requirement for ordinary segment focus says preserve other legs and dim them; only Live Bus Focus hides unrelated route legs. A temporary, deleted acceptance copy checked `selected=1`, `dimmed=all other legs`, `route segment count=original itinerary count`, and the complete interaction flow passed 1/1 with screenshot assertions explicitly skipped. Original tracked/dirty spec was not altered. This shows the behavior is consistent with the general focus requirement, while the existing assertion needs an intentional spec/test reconciliation before CI can be called all-green.
- Focused post-copy checks for GPS reroute, truncation warning, and rendezvous had passed 3/3 before this repeat. Full deterministic runs use local map, geocoder, and OSRM fixtures, not licensed live assets or live feeds.

## Infrastructure and deployment evidence

- Read-only GitHub deployments query returned an empty list for each of the six canonical repositories: no GitHub-recorded staging or production deployment/SHA is available to smoke-test.
- Orchestrator PR #6 failure is specifically `MARSHGO_REPOS_READ_TOKEN` unset. Its repository materialization, image build, cross-repo browser E2E and browser compatibility steps were skipped. The token must be configured by the repository owner with read-only Contents access; do not weaken the fail-closed gate or put a personal token in CI.
- Docker local loopback Postgres/PostGIS and Redis are healthy. They prove local integration only and are not deployment infrastructure.

## Gate status

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

Still open: accepted visual screenshots for all ten supplied mockups and both themes; resolve or formally review the strict screenshot delta; update the route-map test assertion to the agreed ordinary-focus behavior without touching pixel baselines; Admin/Partner authenticated tenant tests against this exact Server SHA; a real staging URL and deployed exact SHA; authorized/licensed map and satellite assets; provider credentials/contracts and live probes for claimed capabilities; physical iPhone acceptance; production security and load tests; backup/restore and rollback exercises; exact six-component manifest/image digests; owner approval for rollout.

## Next exact actions

1. Reconcile the route-map expected behavior with the master requirement in an isolated change, then run the real route-map test with screenshots enabled; keep the strict screenshot as a hard gate and explain/fix its 38,818-pixel delta without accepting a baseline blindly.
2. Obtain/configure owner-managed read-only private-repo CI access and real staging endpoint; rerun full orchestrator materialization, image build and cross-repository acceptance at the exact six SHAs.
3. Run Admin/Partner tenant isolation and authenticated workflows against Server `24c70dc…`; do not treat their independent unit/build checks as integration acceptance.
4. Complete the external map/provider licensing and credential gates, physical iPhone, security, load, backup/restore and rollback checks.
5. Prepare exact manifest and runbooks; keep deployment blocked until the user provides the separately required final rollout approval.
