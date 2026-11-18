# Current 5+1 CI and release gate status — 2026-10-25

## Exact release manifest tuple

The current central `RELEASE_MANIFEST.json` pins:

| Component | SHA |
|---|---|
| Server | `38f17b88f98c8530f8090cfc6745cd334c87e53c` |
| Site | `7aed5344218058b024f5c269b36b03577d94026e` |
| iOS | `7dfd35bf5f06169d7df82fa8d0879fcaf02431b5` |
| Admin | `f39c4b74839a393f4487c830930669eabc8c0390` |
| Partner | `97a3727cc395dea092af6e3e24d6822370c2bc63` |

This is the manifest candidate only; it has not been deployed.

## Current GitHub checks

- Server PR #41 is OPEN, DRAFT, CLEAN at `70e11d8d8730e54311f13d73953ab565fd6b432a`; both hosted `verify` checks pass. Its base is the integrated Server PR #40 head `38f17b88f98c8530f8090cfc6745cd334c87e53c`.
- Site PR #27 is OPEN, DRAFT, CLEAN at `740f952729bc6f62498080660e2f70833026350f`; both hosted `verify` checks pass. It is based on Site PR #26 head `1b5986de5af875c5c2945df4752c23603c135ed3`.
- Admin PR #1 is OPEN, not draft, CLEAN at `f39c4b74839a393f4487c830930669eabc8c0390`; hosted `verify` passes.
- Partner PR #1 is OPEN, not draft, CLEAN at `97a3727cc395dea092af6e3e24d6822370c2bc63`; hosted `verify` passes.
- iOS PR #14 is OPEN, not draft, CLEAN at `7dfd35bf5f06169d7df82fa8d0879fcaf02431b5`; both hosted simulator-build checks pass. Simulator CI is not physical-device acceptance.
- Central orchestrator PR #5 is OPEN, DRAFT, `UNSTABLE` at `a862ad7ac11ed879da9086d09f79670cdd643568`. Hosted lint, typecheck, unit, migration, integration, build, bundle and security checks pass. `verify` fails closed at “Configure read-only access to private Admin and Partner repositories” because `MARSHGO_REPOS_READ_TOKEN` is unavailable. Materialization, Docker component builds, cross-repository browser E2E and browser-compat checks are consequently skipped. No gate was bypassed.

## Release conclusion

The manifest tuple and current open PR heads are not one exact, fully verified release tuple: Server #41 and Site #27 are newer draft heads and are not the SHAs pinned in the manifest. The root PR is also blocked before cross-repository materialization. Do not merge or promote the mixed tuple as a release.

Still NOT TESTED / externally blocked: verified staging and deployed SHA, approved map/tile/geocoding configuration, provider commercial access and live-feed health, production secrets, physical iPhone/background GPS, production security and load acceptance, backup/restore, rollback rehearsal, monitoring/alerting, and owner approval for deployment. The production workflow explicitly forbids deploy without that final approval.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.

## Next action

Continue creating one compatible exact-SHA tuple and exact-tuple browser acceptance. The hosted central workflow can resume after the owner configures a least-privilege read-only repository secret; do not substitute personal credentials or local cached auth. Prepare staging, image/manifest and rollback evidence before requesting only the final production action.
