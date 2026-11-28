---
name: pr-gate
description: Run the MindMosaic pre-commit verification gate in order and report real PASS/FAIL/BLOCKED per step before any PR. Use before opening or updating a PR.
user-invocable: true
disable-model-invocation: true
argument-hint: "[--quick]"
---

# PR Gate

Run from the worktree root, never from the main checkout. Confirm environment first: `git branch --show-current`, `git status --short`, and that the env file points at local or DEV (`mfglzabnayacssgertat`), never PROD. Do not print env values.

Record exit code and counts for each gate. If a gate fails, continue any independent checks and mark dependent checks BLOCKED where appropriate:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `npm run validate:questions`
6. `npm run check:answers -- --include-published`
7. `npm run questions:validate-ledger`
8. `npm run test:rls` (local Supabase only)
9. `npm run test:e2e`
10. `npm run test:e2e:auth` (local Supabase only)

`--quick` runs 1-3 only and must be labelled "partial, not mergeable".

## Report format

| # | Step | Result | Evidence |
|---|------|--------|----------|

Result is one of PASS, FAIL, BLOCKED (state the blocker, e.g. Docker/Supabase not running, Windows socket stall). Never mark PASS from memory or from a prior run. Diagnose FAIL with `debug-rootcause`; do not retry in a loop.

Record the reviewed commit and required GitHub CI results. The tabletop check for assistant tooling is `node --test .agents/scripts/safety-gate.test.mjs`. Hosted CI carries additional checks, including `questions:gate` and `projection:verify`.
