# Admin/Partner authenticated approval acceptance — 2026-10-26

This is a bounded local acceptance addendum for the exact Admin `a008dbad8edc5d81d716a0913e10c325f739540b`, Partner `5ec9f368d2788e44483a0effe6eac34838e89790`, and Server `24c70dc31d652ac6ba9fbc5fcd7abd138378b457` candidates. It used only isolated loopback services, synthetic development OTP, and a dedicated local database. No external provider or production service was called.

## Verified flow

- Admin account signed in and opened the overview, partner directory, provider registry, integration center, and audit journal.
- A regular passenger account was denied access to Admin with the expected role message.
- Partner account submitted `Local Transit Six`; the Partner UI displayed its pending-review state.
- Admin found the new organization and approved it. The UI showed the approval confirmation.
- The isolated database confirmed the linked application is `APPROVED`, organization is `ACTIVE`, and the applicant has an `ACTIVE` `organization_owner` membership.
- A fresh Partner sign-in then received HTTP 200 from `/api/v1/partner/organizations`; the response contained the same active organization and approved application. The Partner overview rendered `Local Transit Six`, `Активна`, and `Схвалено`.
- The Partner integration page remains explicit that a submitted transport mode is not an active provider: the server/provider contract and live API, booking, and GPS are not claimed as connected.

## Limits

- The original browser script failed to locate the organization text immediately after its reload/navigation sequence. Database state and a separate fresh authenticated session showed the approval persisted and rendered correctly in the Partner overview; this points to a test synchronization/selector issue, but the exact same-session post-approval details-page sequence was not conclusively rerun.
- Subsequent OTP attempts from the test client were rate-limited with HTTP 429. The rate limit was not bypassed or reset. This is a local test constraint, not evidence of a product defect.
- This is local fixture acceptance, not staging, live-provider, security, or production acceptance. Admin/Partner PRs remain unmerged and their compatibility with the exact Server candidate is not yet represented by the orchestrator’s complete cross-repository job.

## Result

`PASS` for local authenticated application submission, Admin approval, persisted role/membership, and Partner overview reflection on fresh authentication.

`NOT_TESTED` for the exact same-session detail-page refresh following approval, full organization/tenant isolation matrix, staging, and production.

`PRODUCTION_READY=false`; `RELEASE_STATUS=NOT_RELEASED`.
