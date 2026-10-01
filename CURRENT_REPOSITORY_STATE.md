# Current repository state — 2026-10-01

Reconciliation was performed from each local checkout after fetching `origin`. Each local `main` commit listed below was pushed as a fast-forward to that repository's `main`. The umbrella integration branch remains the release/orchestration branch and is being pushed after this report slice.

| Repository | Local branch / SHA | Working tree | Remote state | Open PR |
|---|---|---|---|---|
| `dima1203oleg/MarshGO` | `codex/marshgo-production` / `bae696f20d5f8e8730c04b3fdfa0057be11e0f0a` (code baseline before this report commit) | Report/deployment files pending commit in this slice | Was 12 commits ahead of `origin/codex/marshgo-production`; push follows verification | #1 draft `codex/marshgo-production`, remote head `3f597f4f63807a01ac6ef8504ededda36def3792` |
| `dima1203oleg/MarshGO-Server` | `main` / `2fcdeed196e262547342927ac1ddcfed9906865f` | clean | `origin/main` matches; pushed, CI success | #1 `codex/rendezvous-live-pickup`, head `f788a96a5365a8a7d7f1eef416868f97217706c4`; main now has the behavior and tests, review whether to close after PR diff audit |
| `dima1203oleg/MarshGO-Site` | `main` / `c7f76a4be2f6cd7ef31fe66ef6f04d3d29454ef7` | clean | `origin/main` matches; pushed, CI success | #1 `codex/rendezvous-live-pickup`, head `045f138bd9c31cb8bcc40231da867db7d7e8e531`; current main includes rendezvous controls and mobile onboarding, PR still open |
| `dima1203oleg/MarshGO-iOS` | `main` / `b8b1fcbfe9997e1a7a27594b5759690147de75df` | clean | `origin/main` matches; pushed, CI success | #1 `codex/simulator-smoke-capture`, head `328d9af2b3f7095d3f9afca8fcbe4e9c5e1df0ad`; only safe settled-screenshot behavior was ported because full PR conflicts with newer immutable release-input workflow |

## Reconciliation decisions

- Umbrella is used for integration, deployment assets, cross-repository verification, and release records. Server/Site/iOS `main` are canonical source branches.
- Server PR #1's Journey planner and Rendezvous unit tests were absent from local Server `main`; copied, linted, typechecked, tested, committed, and pushed as `2fcdeed`. The PR branch was not merged wholesale because it is older than `main` and would lose newer production fixes.
- Site PR #1's functional Rendezvous APIs/events/controls and branding/onboarding already exist in local canonical `main`; current standalone Site passed full lint, typecheck, and build before push. PR remains open because it contains additional source differences not yet independently reconciled.
- iOS PR #1 adds a settled launch screenshot; ported the change to canonical `main`, strengthened the minimum wait to 15 seconds after an initial premature capture, verified the rendered onboarding screenshot, then pushed. The full PR was not merged because its older workflow would remove pinned release input checks.
- No branch was force-pushed and no dirty source file was overwritten. At the start, all four worktrees were clean; missing tests/simulator change were added as discrete commits.

See [RELEASE_MANIFEST.json](RELEASE_MANIFEST.json) for the immutable source SHAs selected for this candidate. The umbrella SHA in this document is the integration source baseline; report-only commits do not alter the app source.
