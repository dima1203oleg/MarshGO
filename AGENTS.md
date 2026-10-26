# MARSHGO orchestration rules

- Work only in the six canonical repositories: `MarshGO`, `MarshGO-Server`, `MarshGO-Site`, `MarshGO-iOS`, `MarshGO-Admin`, and `MarshGO-Partner`. Exclude `MarshGO2`.
- Inspect the relevant repository status and diff first. Preserve pre-existing dirty files; never reset, clean, force-push, or overwrite another task's work.
- Use isolated Git worktrees for delegated edits. Keep one heavy local build, test, browser, Docker, or GTFS process at a time on the 8 GB Mac.
- Prefer one narrow Antigravity or Codex subagent task over duplicated reviews. Use Gemini Flash for routine tasks; escalate only when risk or prior failure warrants it. Do not claim model quotas unless the service reports them.
- Verify real providers and capabilities; never substitute fixtures for live data without labelling them. Record tests and exact SHAs.
- Keep production `NOT_RELEASED` until every required gate has evidence. Do not deploy without an approved target and release authorization.
- Use `transit-data-integration` for feeds, `multimodal-routing-engine` for journey planning, and the other MARSHGO skills only when relevant. Update `CODEX_PROGRESS.md` and `NEXT_ACTIONS.md` after a meaningful checkpoint.
