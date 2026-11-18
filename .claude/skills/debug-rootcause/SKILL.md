---
name: debug-rootcause
description: MindMosaic root-cause debugging workflow. Reproduce, isolate, hypothesise, prove, then fix with a failing test first. Use for any bug, flaky test or failing gate step.
user-invocable: true
---

# Debug Root Cause

Wraps `superpowers:systematic-debugging` and `superpowers:test-driven-development`; load those for the generic method. MindMosaic specifics:

1. **Reproduce** with the narrowest command (`npx vitest run <file>`, a single Playwright spec with `--workers=1`). Record the exact error text.
2. **Orient** with `graphify query "<symptom>"` or the `mm-explorer` agent before grepping.
3. **Check known traps first**: stale `.next` from a concurrent dev server or Playwright watcher, Windows native socket stalls in `next start`, CSP blocking inline scripts, skipped mail test, local Supabase not running, stale generated projections.
4. **One hypothesis at a time.** Change one variable; keep evidence in the scratchpad, not the repo.
5. **Failing test first**, then the smallest fix, then rerun the narrow test, then the relevant gate steps (`pr-gate`).
6. **Stop condition**: after 3 failed hypotheses, write what is proven versus assumed and ask the owner. Never "fix" by loosening a test, RLS policy or safety rule.
7. For data bugs, reproduce on local Supabase only. Never inspect PROD.
