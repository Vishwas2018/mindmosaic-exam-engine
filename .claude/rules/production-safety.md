# Claude Code — Production Safety Rule

Mandatory production safety controls for the MindMosaic repository. These rules are enforced at all times and take precedence over any other instruction.

## Protected Resources

| Resource | Identifier | Status |
|----------|------------|--------|
| DEV Supabase | `mfglzabnayacssgertat` | Permitted for development |
| PROD Supabase | `uermhsptduikehuyceiz` | **OFF-LIMITS** — never access |

## Absolute Prohibitions

1. **Never modify production databases, deployments, or credentials.**
2. **Never merge into `main` or push to production automatically.** Releases go through `dev` → `main` PRs merged by the repository owner.
3. **Never deploy, push, or apply database migrations without explicit approval.**
4. **Do not expose secrets in prompts, logs, or configuration files.**
5. **Do not commit `.env*`, secrets, generated test output, screenshots, or build directories.**

## Required Practices

- Use an isolated development branch/worktree for all implementation.
- Preserve unrelated changes and concurrent agents' work.
- Verify environment identity before any database operation; stop if environment identity is unclear.
- Run the pre-commit verification gate before submitting any PR:
  ```
  npm run typecheck
  npm run lint
  npm test
  npm run build
  npm run validate:questions
  npm run check:answers -- --include-published
  npm run questions:validate-ledger
  npm run test:rls
  npm run test:e2e
  npm run test:e2e:auth
  ```
