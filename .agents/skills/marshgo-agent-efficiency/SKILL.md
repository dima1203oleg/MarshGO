---
name: marshgo-agent-efficiency
description: Route MARSHGO tasks between agents, models and skills with measured context cost. Use when delegating work, adding a skill or agent, or trimming session context.
---

# MARSHGO agent efficiency

## What actually costs tokens
- Rule files with `trigger: always_on` are injected every session — keep them short and never duplicate them across global/project scopes.
- Skill `description:` is taxed whether or not the skill loads; skill body is free until invoked. Shorten descriptions, don't multiply skills.
- Measured at the 2026-11-03 audit: enabled plugin + global skill descriptions = 60,721 bytes, one plugin (product-design) alone = 37,761 bytes. Only 5 of ~60 skills had ever been invoked (`~/.qoder/skill-usage.json`).
- Re-measure after any change in a **fresh session** — the current session's listing is cached and lies about the delta.

## Delegation rules
- One `Explore`/`SearchWorkspace` pass per question. If you delegate a search, do not also run it yourself.
- Ask subagents for conclusions and file:line evidence, not file dumps; the main agent keeps the summary, not the reads.
- Parallelize only reads and reasoning. Builds, `npm test`, Playwright, Docker and GTFS parsing stay strictly serial — 8 GB Mac, one heavy process.
- Cheap model for lookups, classification and routine edits; escalate only on real risk or after a prior failure. Never claim quota the service did not report.
- Prefer one narrow task over a duplicated review pass. Two agents on the same file need a worktree per agent, agreed in advance.

## Environment levers (Qoder 0.5.1, verified)
- No per-skill disable key and no per-project plugin scope. The only levers are `enabledPlugins` in `~/.qoder/settings.json` and moving a skill directory (quarantine with `mv`, never delete — other tools' copies under `~/.cursor`, `~/.copilot`, `~/.gemini` are not ours to touch).
- Custom agents come from `mcp__qoder-settings__manage_app_agent` with `action=create`, which produces a **draft card the owner must save**; verify with `list_agents` before relying on one.
- Agent Teams have no creation API (`create_team_task` needs an enabled, published team). If the owner has not published one, document `UNAVAILABLE` and delegate through `usageScopes: ["subagent"]` instead of promising a team.

## Stop and report
- More than 5 pre-existing test failures, a hook blocking a tool call, or a conflict with an open PR → stop, report facts, do not work around.
- Report VERIFIED / PARTIAL / BLOCKED / NOT_TESTED. An unmeasured improvement is not an improvement.
