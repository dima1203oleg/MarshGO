# Server to Site truncation handoff — 2026-10-25

## Exact candidates

| Component | PR / branch | Exact head | Base | State |
|---|---|---|---|---|
| Server | [PR #41](https://github.com/dima1203oleg/MarshGO-Server/pull/41), `codex/gtfs-nearby-stop-retention-20261025` | `70e11d8d8730e54311f13d73953ab565fd6b432a` | `codex/server-current-pr39-integration-20261025` (the PR #40 stack) | Draft, open, clean merge state |
| Site | [PR #27](https://github.com/dima1203oleg/MarshGO-Site/pull/27), `codex/site-gtfs-truncation-reasons-20261025` | `740f952729bc6f62498080660e2f70833026350f` | `codex/site-map-layers-fit-20261025` (PR #26) | Draft, open, clean merge state |

Site PR #27 consumes the optional typed `data.gtfsTruncation` object from Server PR #41. Old Server responses remain valid; the UI only displays the detailed cause list when it is present. This is a compatible candidate pairing, not a merged/released pair.

## Evidence

- Server exact head `70e11d8`: hosted push CI [40194603311](https://github.com/dima1203oleg/MarshGO-Server/actions/runs/40194603311) and PR CI [40194607141](https://github.com/dima1203oleg/MarshGO-Server/actions/runs/40194607141) both **SUCCESS**. Includes lint, typecheck, unit and integration suites, fresh migrations, production API image build, and PostGIS/Redis image smoke.
- Site exact head `740f952`: hosted push CI [40195207117](https://github.com/dima1203oleg/MarshGO-Site/actions/runs/40195207117) and PR CI [40195211087](https://github.com/dima1203oleg/MarshGO-Site/actions/runs/40195211087) both **SUCCESS**. Includes lint, typecheck, production build, and bundle check.
- Local Site Node `24.21.0`: **111/111 tests PASS**, typecheck PASS, lint PASS, Vite production build PASS.
- Supported-runtime event-label screen documented in audit 186 remains a rejected/truncated prototype; Server routing completeness is unresolved.

## Release gates still open

- Root orchestrator CI at exact head `f620213d6d31559dd4a264a28eea8bbe855727e8` fails before private Admin/Partner verification because Actions secret `MARSHGO_REPOS_READ_TOKEN` is absent. The Security workflow succeeds. No access control is bypassed.
- Server PR #41 and Site PR #27 are still drafts. The Server dense-feed search remains truncated; Site copy communicates partial results but does not fix route recall.
- No verified staging or production deployment, no deployed SHA/image digest, no physical iPhone, and no complete security/load/backup/restore/rollback acceptance is recorded here.
- `PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next action

Continue the Server query-directed search work under strict exact-oracle, frozen-feed, and memory-bound checks. Keep the new UI reason contract backward-compatible. Do not promote either draft until the routing candidate is evidence-backed and the required integration/release gates pass.
