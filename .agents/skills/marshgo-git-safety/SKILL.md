---
name: marshgo-git-safety
description: Preserve MARSHGO repository state while integrating branches, worktrees, and pull requests.
---

# MARSHGO Git Safety

- Check `git status`, HEAD, remotes, and worktrees before edits; record the base SHA.
- Keep work in the six canonical repositories and use isolated `codex/` worktrees for delegated changes.
- Never reset, clean, force-push, delete a branch with unique work, or commit unrelated dirty files.
- Compare ancestry and diff before integrating; preserve unique implementations and migration history.
- After review, report changed paths, resulting SHA, checks, and any unaccepted work.
