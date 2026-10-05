# Baseline Verification Report — origin/dev (2026-10-05)

**Base commit:** `cc50a9a1ea13339897c081f652b757d50bf222c5` (`origin/dev`)  
**Workspace:** Isolated baseline worktree (`C:/Users/vishw/Vish/Vish/.worktrees/baseline-dev-2026-10-05`)  
**Execution date:** 2026-10-05  

## Verification Suite Results

| Suite / Command | Status | Passed Count | Failed Count | Failure Names / Root Cause | Classification Reference |
|---|---|---|---|---|---|
| `npm run typecheck` | PASS | 1 | 0 | None | Baseline clean |
| `npm run lint` | PASS | 1 | 0 | None | Baseline clean |
| `npm test` | FAIL (1 suite) | 302 test files (5,443 tests) | 1 test file (1 test) | `src/tests/unit/stripe-webhook-route.test.ts` — `ENOENT: no such file or directory, open '.env.local'` | **PRE-EXISTING**: CI sets dummy placeholder env vars (`STRIPE_SECRET_KEY` etc.), while clean local checkouts without `.env.local` fail looking for the file. |
| `npm run build` | PASS | 63 routes | 0 | None | Baseline clean |
| `npm run validate:questions` | PASS | 1,548 questions + 18 showcase fixtures | 0 | None | Baseline clean |
| `npm run check:answers -- --include-published` | PASS | 1,548 questions checked (175 computable, 1,369 editorial) | 0 | None | Baseline clean |
| `npm run questions:gate` | PASS | 98 ledger rows, 20 files | 0 | None | Baseline clean |
| `npm run projection:verify` | PASS | 1,548 projected items (1,005 curated, 543 factory) | 0 | None | Baseline clean |
| `npm run audit:bank` | PASS | Exit code 0 (read-only inventory) | 0 | None | Baseline clean (flags 0 human approvals as expected drift) |

## Failure Classification Invariant

Any test failure observed on feature or governance branches matching `src/tests/unit/stripe-webhook-route.test.ts` with `ENOENT .env.local` is **PRE-EXISTING**. All other failures are **INTRODUCED** and must be resolved before calling any branch or PR ready.
