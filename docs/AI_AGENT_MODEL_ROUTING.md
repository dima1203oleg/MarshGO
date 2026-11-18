# MARSHGO agent model routing

Last verified: 2026-10-26. This is an observed local catalog, not a quota report.

## Antigravity CLI models observed

| CLI model | Default use | Escalate when |
|---|---|---|
| `gemini-3.8-flash-medium` | Routine scoped review, tests, and small isolated fixes | A task remains ambiguous or fails after one clarified attempt |
| `gemini-4-argon-medium` | Architecture, difficult routing completeness, high-risk independent review | Use only when a high-impact question merits its separate quota |
| `claude-sonnet-5-5-medium` | Complex multi-file implementation after scope and tests are clear | Flash cannot handle the implementation safely |
| `claude-opus-5-5-medium` | Last-resort security, concurrency, or architecture escalation | Cheaper suitable models failed or impact is critical |
| `gpt-oss-120b-medium` | Optional auxiliary review | Never make the workflow depend on it |

`agy models` listed these model IDs on this Mac. The CLI did not expose remaining quotas; treat all model quota values as UNKNOWN. Use `agy --print --model=<id> --mode=plan --sandbox --output-format=json` for a bounded headless task. Do not use `--dangerously-skip-permissions`.

## Observed cost and operating policy

Two successful Flash calls returned provider usage of 20,840 and 57,296 total tokens and took about 38 and 59 seconds. These were not code changes. The large workspace context makes repeated small reviews expensive, so dispatch only independent tasks with concrete acceptance value, use one Antigravity call at a time, and do not run duplicate reviewers. The reported usage belongs to those calls only; it is not a quota balance.

## Codex subagents

Project defaults use `gpt-6-luna` at low reasoning and cap concurrent subagent threads at two. Prefer one read-heavy scout or reviewer. Give write tasks only after recording an isolated worktree, branch, and base SHA.
