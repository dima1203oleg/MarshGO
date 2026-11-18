---
name: marshgo-release
description: Assemble evidence-based MARSHGO release candidates, manifests, staging checks, and rollback readiness.
---

# MARSHGO Release

- Verify the deployed URL and exact component SHAs; local builds and green CI are not production deployment evidence.
- Require API/schema compatibility, provider coverage, security, browser acceptance, staging, backup/restore, rollback, and smoke evidence.
- Keep the manifest `NOT_RELEASED` while any required gate lacks evidence.
- Do not deploy without a real authorized target and required release approval.
- Record blockers as external only when an outside credential, contract, host, or approval is actually needed.
