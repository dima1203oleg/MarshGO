# Admin and Partner exact release-candidate local checks — 2026-10-25

## Exact inputs

- Admin manifest SHA: `f39c4b74839a393f4487c830930669eabc8c0390`.
- Partner manifest SHA: `97a3727cc395dea092af6e3e24d6822370c2bc63`.
- Runtime available locally: Node `v24.22.1`; both package manifests specify exact Node `24.21.0`, so npm emitted an `EBADENGINE` patch-version warning. This local run is supplementary; exact-head hosted CI remains the runtime-authoritative check.
- Dependencies were installed with each repository's own lockfile inside its isolated `.release` checkout. No source or lockfile changes were made; existing untracked `.dockerignore`, `Dockerfile.marshgo` and `deploy/` files were preserved.

## Results

- Admin: typecheck PASS, lint PASS, tests **4/4 PASS**, production build PASS.
- Partner: typecheck PASS, lint PASS, tests **3/3 PASS**, production build PASS.
- Both tests are unit-level access/filter rules. Existing exact Partner audit 112 provides a separate local development OTP/browser onboarding flow and Server integration tenant-isolation evidence for Partner; it is not a production-auth/staging proof.

## Acceptance boundary

- Current Admin authenticated browser/API workflows and Admin/Partner deployed cross-tenant role acceptance remain **NOT_TESTED** for this exact integrated tuple.
- Component builds and unit tests do not make event handlers proof of successful server mutations. No live organization/provider/financial operations, staging, or production was used.
- No manifest SHA was changed. Release remains `NOT_RELEASED`; `PRODUCTION_READY=false`.
