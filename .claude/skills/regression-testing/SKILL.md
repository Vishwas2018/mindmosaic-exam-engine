---
name: regression-testing
description: Choose and run the right regression tests for a MindMosaic change (vitest, RLS, Playwright, accessibility, visual) and add a failing test first. Use after any bug fix or behavioural change.
user-invocable: true
---

# Regression Testing

Extends `qa-automation`. Pick tests by blast radius, run narrow first, then widen to the full gate (`pr-gate`).

| Change touches | Run |
|---|---|
| `src/features/**`, `src/lib/**` pure logic | `npx vitest run <path>`, then `npm test` |
| scoring, answers, question bank | `npm run validate:questions`, `npm run check:answers -- --include-published`, `npm run questions:validate-ledger` |
| Supabase migration, RLS, `src/server` | `npm run test:rls` against local Supabase only |
| routes, auth, billing UI | `npm run test:e2e`, `npm run test:e2e:auth` |
| landing or other UI | Playwright screenshots at 360, 768 and 1280 px, keyboard pass, `mm-frontend-a11y-reviewer` |

Rules: write the failing test first (`superpowers:test-driven-development`); use one worker for flaky specs; never use `waitForTimeout` as a fix; do not commit screenshots or test output; if a run is blocked by host stalls, mark BLOCKED with evidence instead of retry-looping. Record each result as PASS/FAIL/BLOCKED with command and counts.
