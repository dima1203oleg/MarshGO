# MARSHGO security delta audit — 2026-10-01

Statuses: `PASS`, `FIXED`, `OWNER_BLOCKED`.

## Findings fixed in this pass

| Status | Finding | Change and evidence |
|---|---|---|
| FIXED | GitHub CodeQL flagged a backtracking-prone regular expression parsing user-controlled `Authorization` headers in the umbrella copy of `server/index.ts`. | Added a length-bounded Bearer parser that validates the generated 43-character base64url token format without a backtracking expression. Added tests for normal tokens, whitespace/case, invalid format and an oversized header. Server PR #2 is `f0a6cdb2fd918733770f65f997dfea5d7c302b0c`; server tests/lint/typecheck and all 17 integration tests passed locally. |
| FIXED | CodeQL flagged tile-provider detection using substring matching, which could count an arbitrary host containing the expected domain text. | Live provider smoke now parses each request URL and compares the exact hostname. Latest umbrella CodeQL scan passes. |
| PASS | Secret scan for the umbrella security workflow. | GitHub Gitleaks run for the latest umbrella commit passed. Staging secrets remain in an ignored mode-0600 local env file and are not committed. |
| PASS | Production config rejects development OTP/auth bypass and requires explicit secure origins/secrets. | Existing Server config tests pass; no production credentials are configured in staging. |

## Not yet release-accepted

| Status | Area | Remaining verification |
|---|---|---|
| OWNER_BLOCKED | Production secrets and deployment | No production server, domain/DNS, TLS certificate, real SMS credentials, APNs keys or payment/partner credentials are available. |
| OWNER_BLOCKED | iOS distribution | Apple signing/App Store Connect and a physical acceptance device are not available in this environment. Simulator CI is not a substitute. |
| OWNER_BLOCKED | Real production providers | Staging uses dev OTP, S3Mock, and public geocoding/routing/tiles. These are not production credentials or services. |
| PASS (partial scope) | Static security scans | Current integration PR CodeQL and Gitleaks pass. This does not substitute for full dependency/SAST/container scans on every standalone release artifact. |
| PASS (partial scope) | Authorization and data isolation | Server integration tests cover booking participant access, staff-only verification evidence, safety case review and protected user data; broader endpoint-by-endpoint IDOR and upload abuse acceptance remains. |
| OWNER_BLOCKED | Public staging exposure | The anonymous development-OTP staging tunnel has isolated test databases, no production credentials, and a visible warning banner. It is temporary; do not use real personal or payment data. A durable access-controlled staging deployment still requires hosting/domain choices. |

## Test commands

- MarshGO-Server: `npm run lint:all` — PASS.
- MarshGO-Server: `npm run typecheck` — PASS.
- MarshGO-Server: `npm test` — 46 passed, 1 skipped (opt-in integration tests are run separately).
- MarshGO-Server: `npm run test:integration` — 17 passed, 0 failed.
- MarshGO umbrella: `npm run lint:all` — PASS.
- MarshGO umbrella: `npm run typecheck` — PASS.
- MarshGO umbrella: `npm test` — 74 passed, 1 skipped.
- GitHub latest umbrella CI, CodeQL and Gitleaks — PASS.
