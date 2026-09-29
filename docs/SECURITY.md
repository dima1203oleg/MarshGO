# Security and privacy status

## Implemented controls

* Production requires a configured `SESSION_SECRET`; development identity bypass is accepted only when `NODE_ENV=development` and `AUTH_DEV_BYPASS=true`.
* OTP challenges are HMAC-hashed, expire after five minutes, allow at most five verification attempts, enforce resend cooldown and per-phone/per-IP request limits, and use a development provider that makes no outbound request.
* Access/refresh credentials are opaque random values; only SHA-256 hashes are persisted. Refresh rotation revokes the token family if a previously consumed token is reused.
* Refresh credentials use HttpOnly, SameSite=Strict cookies and Secure in production. Access credentials remain in browser memory.
* Vehicle, booking, proposal, and conversation mutations check authenticated ownership/role. Phone, plate, and verification evidence are not returned in public offer search.
* Vehicle photos use short-lived presigned upload policies constrained to 10 MiB and JPEG/PNG/WebP; API finalization checks object metadata plus detected file signature. Read URLs are signed and time-limited.
* API requests have a JSON body limit, an allowlisted CORS policy, baseline security headers, request IDs, and per-process rate limits.
* Errors return structured codes/messages/request IDs; server logs do not include request bodies or OTP values.

## Open security work

* Replace per-process rate limiting with shared Redis coordination; configure trusted proxy hops behind deployment ingress before relying on source IP throttles.
* Add a security review and automated dependency/static/security checks; CI currently runs lint, typecheck, unit tests, and build.
* Configure production SMS credentials, secret management, HTTPS, same-site API routing, and account recovery policy.
* Configure private object storage and bucket CORS, add retention controls and anti-malware scanning before accepting real vehicle documents/photos.
* Add account deletion processing, data retention and export policy review, admin RBAC provisioning/audit review, and incident response.
* GPS sharing, location minimization/retention, WebSocket authorization, push privacy, and background-navigation consent are not implemented.

No production security certification or legal compliance review is claimed.
