---
name: marshgo-orchestrator
description: Choose and dispatch bounded, non-overlapping MARSHGO work across Codex and Antigravity while tracking evidence and cost.
---

# MARSHGO Orchestrator

- Select one highest-value task with a repository, owner, isolated branch/worktree, base SHA, file scope, acceptance criteria, model, and resource ceiling.
- Prefer Codex for integrated changes and Antigravity for an independent, bounded review or implementation in a separate worktree.
- Use Flash/low for routine work; escalate only after ambiguity, failure, or elevated risk. Never send the same task to multiple models.
- Record status and returned SHA in `docs/AI_AGENT_QUEUE.json`; verify every result before acceptance.
- Do not invent quotas, active work, or background execution. No useful independent task means idle is correct.
