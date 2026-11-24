# GO/NO-GO and recommended DEV merge sequence: PR #156 + #159 + #160

Date 2026-11-24. Assessment of the combined candidate `a1759a6b` (draft PR #161). DEV Supabase and Stripe sandbox only. **Nothing has been merged; every merge below is for the owner.**

## Decision

| Target | Decision | Basis |
|--------|----------|-------|
| Merge into `dev` | **CONDITIONAL GO** | Two consecutive complete hosted cycles on the same SHA and deployment: 17/17 batches each, 118 tests passed, **0 failed, 0 flaky, 0 retries** per cycle, across Chromium, Firefox and WebKit. CI 7/7 green. **No application defects found.** All auth fixes from #160 and all billing, entitlement and webhook behaviour from #159 are intact (file-level identity check and hosted coverage) |
| Owner manual UAT on DEV | **GO**, after the merge and the post-merge check in step 6 below | Same as above |
| `dev` → `main` (production) | **NO-GO** | Carried blockers: legal text (O-04), provisional pricing (O-02), `past_due` policy (O-06), live Stripe setup, production migration, CSP enforcement decision |

**The conditions** (the GO is not unconditional, because 7 tests per cycle were skipped or not run on some engines):

1. The owner accepts coverage exceptions X1–X6 in `COVERAGE-MATRIX.md`. They are scoped-out coverage, not failures. The one closest to a security assertion is **X1, the WebKit SameSite check**. It is asserted on Chromium and Firefox; the cookie is set server-side, so the result is browser-independent. A real-Safari spot check in UAT is recommended.
2. The post-merge hosted run in step 6 passes on the `git-dev` deployment.

Residual risks: E-03 (RBAC-01 Chromium timeout, root cause not isolated, not reproduced in 7 later runs); E-01 and E-02 (Stripe front-end TLS and email delivery on the test host, intermittent). None of these points at application code.

## Why not merge only the component PRs

#156 says "merge the individual PRs in the documented order", but the tested tree contains code that **no open component PR carries**:

- Branch `fix/exposed-mocks-practice-only-claude-20261121` (`16614790`, changes `src/server/vihaan-practice.ts`): has **no PR**.
- Seven commits made directly on the #156 branch (`8160fb67`, `b7766439`, `e582cb9b`, `ebc2c740`, `625ced17`, `9e3ea15f`, `3253ab1e`). Two change app code (`src/features/auth/components/EmailVerificationScreen.tsx`); one changes `scripts/hosted-acceptance/run.mjs`.

Merging only #143–#155, #157 and #158 would therefore produce a `dev` that was never tested. The sequence below merges the tested units.

## Pre-flight (read-only)

- `dev` is at `003b102b`, and the #156 branch contains all of it (0 commits behind). Re-check immediately before step 1: `git rev-list --count origin/integration/beta-readiness-claude-20261120..origin/dev` must be `0`.
- Migrations in the whole stack: **one**, `supabase/migrations/20261106090000_individual_plans.sql` (#159). It widens `subscriptions_plan_check` to allow `individual_monthly` and `individual_annual`. **Already on DEV**: proven by the U3 and L2 hosted runs writing `individual_*` rows through the webhook. **Not on production.** #156 and #160 add no migrations.
- DEV Supabase redirect allowlist already contains `git-dev` (probe MATCH).

## Sequence (owner merges)

1. **#156 into `dev`.** Change it from draft and verification-only to mergeable, and merge it as one merge commit (it is the tested combination of #143–#155, #157, #158, the exposed-mocks fix and the direct commits). Then close #143–#155, #157 and #158 as "merged via #156". Wait for CI on `dev` and the `git-dev` deployment.
2. **#160 into `dev`.** Retarget its base from `integration/beta-readiness-claude-20261120` to `dev`. It has no conflicts and no migrations. CI green.
3. **#159 into `dev`.** Retarget to `dev`. The only file shared with #160, `src/features/auth/provision-child.ts`, merges without conflict (proven by the candidate merge). No migration step: it is already applied on DEV. CI green.
4. **Harness fixes and these reports.** Retarget #161 to `dev`, retitle it (drop "DO NOT MERGE"), and merge. After steps 1–3 its remaining diff is the test-only commit `a1759a6b` plus this `docs/reports/combined-integration-161/` folder. Alternatively cherry-pick those two commits into a fresh PR.
5. **Tree check (read-only).** `git diff a1759a6b origin/dev -- . ':(exclude)docs'` must be empty. If not, stop: `dev` is not the tested tree.
6. **Post-merge hosted check on `git-dev`** (DEV + sandbox):
   - Stripe sandbox variables for `dev` Preview. The owner issues a sandbox key; I set the variables **branch-scoped to `dev`**, create a `git-dev` webhook endpoint, and redeploy.
   - Decide `MM_DEV_AUTH_CSP_ENFORCE` for `dev`: the candidate ran with `1`.
   - Run the 17-batch cycle once against `git-dev` with the batch runner (about 65 minutes; ≥ 8 GB free RAM).
7. **Cleanup** (after step 6, or now if the order changes):
   - Remove the candidate-branch Preview variables.
   - Delete sandbox webhook `we_1Uf5prDtPH5dvWkmHQ8nMMF9`.
   - Shred `C:/tmp/stripe-readiness/*.env`.
   - Remove the candidate alias from the DEV redirect allowlist.
   - Close #161 if it was not used in step 4.

## Before any `dev` → `main` release PR

- Apply `20261106090000_individual_plans.sql` to **production**, only in the release PR and with explicit owner approval.
- Live Stripe: account verification; GST; live products and prices with lookup keys `mindmosaic_{individual,family}_{monthly,annual}`; a live webhook on an unprotected production domain for the six events; a live customer portal; live keys in Production variables only.
- Legal text for subscriptions, billing, cancellation, refunds and GST; finalise `/terms`.
- Pricing (O-02), the `past_due` policy and `BILLING_ENFORCEMENT_ENABLED` per environment (O-06), and the production CSP setting.
- Owner manual UAT, including a real Safari/iOS check (X1, X6).
