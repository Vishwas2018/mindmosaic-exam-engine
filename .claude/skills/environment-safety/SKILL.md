---
name: environment-safety
description: Verify DEV/PROD isolation and the agent safety gate (hooks, deny/ask rules) are active and unmodified. Use at session start for DB or deploy work, or after changing config.
user-invocable: true
---

# Environment Safety

Canonical rules live in `AGENTS.md` (AI Environment & Production Safety). Enforcement detail is in `docs/AI_ENVIRONMENT_SAFETY.md`. This skill is a checklist; do not restate the rules.

1. **Identity**: `git branch --show-current`, `git worktree list`; confirm cwd is a worktree, not the primary checkout.
2. **Gate tests**: `node --test .agents/scripts/safety-gate.test.mjs` (mock strings only, expect 0 failures).
3. **Hooks not disabled**: `grep -n disableAllHooks` over user, project and local settings; none may be `true`. Do not print other settings values.
4. **Gate responds**: pipe a mock PreToolUse payload for a prohibited string (for example `git push origin main`) into `node .agents/scripts/safety-gate.mjs` and expect `deny`. Never run the prohibited command itself.
5. **Env target**: identify the Supabase target by project ref only, never print keys. If it is not local `127.0.0.1:56321` or DEV `mfglzabnayacssgertat`, STOP.
6. **Protected config untouched**: `git diff origin/dev -- .claude/settings.json .agents .clineignore` shows only intended changes.
7. **MCP scope**: Vercel read-only tools only; Stripe and Supabase MCP not connected.

Report PASS/FAIL/BLOCKED per item.
