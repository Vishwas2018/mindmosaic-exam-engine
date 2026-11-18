---
name: qa-automation
description: Unit, integration, Playwright, accessibility, and regression testing for MindMosaic.
metadata:
  version: '1.0.0'
user-invocable: true
argument-hint: "[test-scope]"
license: Apache 2.0
---

# QA Automation Skill

Use this skill to run, write, or review tests for MindMosaic features.

## When to Invoke

- Running the unit test suite (`npm test`)
- Writing Vitest unit or component tests
- Creating Playwright E2E tests
- Running accessibility scans
- Verifying regression coverage
- Reconciling test count discrepancies

## Test Commands

| Command | Purpose |
|---------|---------|
| `npm run typecheck` | TypeScript strict mode check |
| `npm run lint` | ESLint check |
| `npm test` | Vitest unit suite once |
| `npm run test:rls` | Row Level Security tests |
| `npm run test:e2e` | Playwright E2E suite |
| `npm run test:e2e:auth` | Auth E2E suite |
| `npm run validate:questions` | Question bank validation |
| `npm run check:answers` | Answer correctness verification |

## Test Standards

1. **Never weaken assertions.** Fix the underlying component or logic, not the test.
2. **Evidence-based results.** Report actual pass/fail counts, never fabricate outcomes.
3. **Intermittent failures.** Diagnose root cause before adjusting timeouts or mocks.
4. **Playwright requires browser.** Install with `npx playwright install` if not available.
5. **Accessibility scan.** Included in E2E via axe-core (`e2e/accessibility.spec.ts`).

## Output Format

Return:
1. **Test command run** and scope
2. **Pass/fail counts** per test file
3. **Failure details** — error messages, stack traces
4. **Reconciliation notes** — if counts differ from expectations
5. **Recommendations** — fixes needed, tests to add

Do not disable or delete assertion logic to force a pass.
