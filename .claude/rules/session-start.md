# Claude Code — Session Startup Rule

This rule applies at the start of every Claude Code session in the MindMosaic repository. It references the canonical instructions in `AGENTS.md` and adds Claude-specific operational guidance.

## Reference to Canonical Source

All MindMosaic development standards are defined in `AGENTS.md` at the repository root. This file contains only Claude-specific additions; it does not duplicate `AGENTS.md`.

## Session Startup Behaviour

At the beginning of every new development task, confirm:

1. **Repository and active Git branch/worktree.** Run `git branch --show-current` and `git worktree list`.
2. **Uncommitted changes and existing work.** Run `git status --short`. Preserve concurrent agents' work.
3. **Permitted development environment.** DEV Supabase: `mfglzabnayacssgertat`. PROD Supabase `uermhsptduikehuyceiz` is strictly off-limits.
4. **MindMosaic coding, architecture, and security standards.** Follow AGENTS.md standing rules, TypeScript strict mode, `docs/design.md`, and the pre-commit verification gate.
5. **Relevant context only.** Inspect only files, features, and tests related to the current task — do not scan the entire repository.
6. **Appropriate implementation and testing workflow.** Reuse existing components and patterns before creating new ones. Apply skills on demand.
7. **Concurrent work check.** Coordinate with other agents editing the same files.

Startup is lightweight. No expensive tests, package installs, or modifications run automatically on session start.

## Available Skills (Load On Demand)

Skills in `.claude/skills/` and agents in `.claude/agents/` (`mm-*`) load on demand:

- Skills: `architecture-review`, `feature-development`, `qa-automation`, `security-review`, `database-review`, `release-readiness`, `pr-gate`, `debug-rootcause`, `codex-review`, `environment-safety`, `regression-testing`
- Agents: `mm-explorer` (Haiku); `mm-architecture-reviewer`, `mm-security-rls-reviewer`, `mm-db-migration-reviewer` (Opus); `mm-qa-automation`, `mm-frontend-a11y-reviewer`, `mm-release-readiness` (Sonnet)

To invoke a skill, reference it by name.
