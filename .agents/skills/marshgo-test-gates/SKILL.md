---
name: marshgo-test-gates
description: Run proportionate MARSHGO checks and report fixture, live, staging, production, and device evidence accurately.
---

# MARSHGO Test Gates

- Start with the smallest affected test; run one memory-heavy local task at a time.
- Reuse passing results only when the tested SHA and relevant inputs are unchanged.
- A skipped test is not a pass. Separate fixtures, live probes, staging E2E, production smoke, and physical-device tests.
- Do not loosen assertions to turn a failure green. Record command, outcome, duration, and exact SHA.
- Reserve full suites for integration checkpoints and release candidates.
