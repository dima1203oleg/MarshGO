# Security release checklist

**Status: PARTIAL; security release gate not passed.**

## Completed local checks

- Repository-wide lint and typecheck pass for the tested checkouts.
- Server `npm audit --audit-level=high` reported no high-severity vulnerabilities.
- Umbrella Bun lockfile audit reported no known vulnerabilities.
- Focused secret-pattern scan found no recognized credential patterns in the inspected local history/worktree beyond local/test placeholders.
- Existing API authorization, rate limiting, production config validation and security headers remain in place and are covered by selected tests.

## Required before release

- Run SAST/CodeQL, secret scanning and container image scanning on the exact published release commits; configured workflows have not yet produced hosted CI evidence.
- Complete endpoint-by-endpoint authorization/IDOR review, upload abuse and malware-scan verification, CORS/CSRF/CSP review and trusted-proxy review in staging.
- Rotate/verify provider secrets in a managed secret store.
- Record triage for all dependency findings, including the iOS wrapper audit results.
- Attach CI run URLs and staging evidence to the release record.

No complete security PASS is claimed.
