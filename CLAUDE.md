@AGENTS.md

## Claude Code

- Start Claude from the isolated worktree so its project hooks govern that checkout. The project requires Claude Code 2.1.295 or later for blocking hook failures.
- Use `debug-rootcause` and Superpowers `systematic-debugging` to reproduce a defect, identify its cause and verify the fix. For behavioral fixes use Superpowers `test-driven-development` and `regression-testing` to add a focused failing case before changing the implementation.
- Use Superpowers `verification-before-completion` and `pr-gate` to report PASS, FAIL or BLOCKED from fresh evidence. Use `release-readiness` for go/no-go review.
- Run `environment-safety` before database, deployment or configuration work. Vercel is inspection-only. Use local fixtures for browser, RLS and authenticated E2E verification.
- Use `codex-review` for a user-requested, read-only second opinion on a screened snapshot. Automatic review is off.
- Choose the project specialist agents in `.claude/agents/`. Use Opus or Sonnet for architecture, security and RLS, and Haiku for straightforward exploration.
- Graphify can supplement targeted source reads. Refresh the index only in the isolated worktree and keep generated graph output out of the change.
