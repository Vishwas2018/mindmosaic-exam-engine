---
name: release-readiness
description: CI evidence, deployment dependencies, and GO/NO-GO recommendations for MindMosaic releases.
metadata:
  version: '1.0.0'
user-invocable: true
argument-hint: "[feature-or-release-name]"
license: Apache 2.0
---

# Release Readiness Skill

Use this skill to evaluate whether a feature or release is ready for DEV preview, integration, or production.

## When to Invoke

- Assessing a feature branch for DEV preview
- Evaluating release readiness for integration
- Making GO/NO-GO decisions for supervised testing
- Reviewing CI evidence and deployment dependencies
- Checking pre-commit verification gate results

## Decision Framework

| Decision | Criteria |
|----------|----------|
| **DEV Preview Testing** | CI green, typecheck passes, tests pass, feature flag works, Vercel on DEV Supabase |
| **Children's Supervised Testing** | Content approved by human (`approvedBy`), all questions servable, E2E tests executed, parent dashboard shows real data |
| **DEV Integration** | All CI checks pass, feature flag disabled by default, no uncommitted changes merged |

## Required Evidence

- `npm run typecheck` — zero errors
- `npm run lint` — zero errors
- `npm test` — all tests pass
- `npm run build` — production build succeeds
- `npm run validate:questions` — question bank valid
- `npm run check:answers -- --include-published` — answers verified
- `npm run test:rls` — RLS tests pass
- `npm run test:e2e` — E2E tests pass
- `npm run test:e2e:auth` — Auth E2E tests pass

## Output Format

Return:
1. **GO/NO-GO decision** for each environment (DEV preview, supervised testing, DEV integration)
2. **Evidence summary** — test results, typecheck, build status
3. **Blockers** — unresolved issues preventing release
4. **Recommendations** — next steps before approval

Never self-approve content. Human approval (`approvedBy`) is mandatory for publication.

## Evidence rules
- Pull CI state read-only: `gh pr checks <n>`, `gh run view <id>`. Required checks on `main`: `core`, `e2e`, `e2e-auth`, `rls`. A missing or skipped required check is NO-GO.
- Default to NO-GO when evidence is absent. State GO only with linked check results.
- List unapplied migrations, new env var names needed in Vercel (names only), content approvals and rollback steps.
- Never merge, push, deploy or touch PROD; the owner merges `dev` to `main`. Delegate to the `mm-release-readiness` agent.
