# Security release checklist

**Status: PARTIAL; security release gate not passed.**

## Completed local checks

- Repository-wide lint and typecheck pass for the tested checkouts.
- Server `npm audit --audit-level=high` reported no high-severity vulnerabilities.
- iOS `npm audit --audit-level=moderate` initially found the transitive `uuid@7` issue under Capacitor CLI; the iOS lockfile now overrides it to `uuid@11.1.1`, and the audit reports 0 vulnerabilities.
- Site `npm audit --audit-level=high` reports 0 vulnerabilities; the umbrella Bun lockfile audit reports none.
- Umbrella Bun lockfile audit reported no known vulnerabilities.
- Focused secret-pattern scan found no recognized credential patterns in the inspected local history/worktree beyond local/test placeholders.
- Existing API authorization, rate limiting, production config validation and security headers remain in place and are covered by selected tests.

## Trusted proxy configuration

The API must be reachable only through the configured reverse-proxy chain. Set `TRUST_PROXY_HOPS` to the exact number of trusted proxies between the client and Express (`2` for the documented Caddy → Nginx → API production path; staging tunnels must use their actual hop count). The API validates this value at startup and production refuses to start without an explicit value. Do not expose the API port publicly or trust arbitrary forwarded headers.

## Required before release

- Run SAST/CodeQL, secret scanning and container image scanning on the exact published release commits; configured workflows have not yet produced hosted CI evidence.
- Complete endpoint-by-endpoint authorization/IDOR review, upload abuse and malware-scan verification, CORS/CSRF/CSP review and trusted-proxy review in staging.
- Rotate/verify provider secrets in a managed secret store.
- Re-run dependency scans in hosted CI against the published release commits and retain the resulting reports.
- Attach CI run URLs and staging evidence to the release record.

No complete security PASS is claimed.
