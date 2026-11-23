# Stripe billing readiness: final GO / NO-GO

**Tested commit:** `08352f8a` · **PR:** #159 (draft, not merged) · **Date:** 2026-11-23
**Scope tested:** DEV Supabase `mfglzabnayacssgertat`, Stripe sandbox `acct_1StznKDtPH5dvWkm`, branch-scoped Vercel Preview. Nothing in production was touched.

## Verdict

| Decision | Verdict |
|----------|---------|
| Owner manual UAT on the sandbox Preview | **GO** |
| Merge to `dev` for continued sandbox testing | **GO** (owner merges; not done here) |
| Production release with real payments | **NO-GO**, blocked by non-code items below |

**Why GO for UAT.** The billing implementation behaves correctly end to end against the real Stripe sandbox and the real DEV database. Two consecutive complete hosted cycles on the tested commit passed (31 of 31 tests each, no flaky, no skipped), CI is green on the same commit, and there are no unresolved critical or high-severity billing code defects.

**Why NO-GO for production.** Four things are not engineering defects but must be settled first:

1. **Free-plan claim does not match behaviour (O-01).** See below. Customer-facing claims must be true.
2. **Prices are placeholders for testing (O-02).** Individual A$14.99/month, A$149/year; Family A$19.99/month, A$169/year are the retained sandbox amounts. They are not approved production pricing.
3. **Legal pages are drafts (O-04).** Privacy, terms and billing and refund wording await sign-off.
4. **A live Stripe account has not been set up.** Business details, tax settings, live products and prices, a live webhook endpoint on an unprotected domain, and live-mode keys are all out of scope and untouched.

## Completion criteria

| Criterion | Status |
|-----------|--------|
| Two consecutive complete hosted regression cycles pass | **Met.** `08352f8a`, cycles 1 and 2, 31/31 each. Chromium, Firefox, WebKit sequentially, one worker |
| All required CI checks pass | **Met.** `core`, `e2e`, `e2e-auth`, `rls`, `scholarship-drafts`, Vercel all success on `08352f8a` |
| Zero unresolved critical or high billing defects | **Met for code.** 12 defects found and fixed (3 were S1 or S2 billing-logic faults); one S1-for-production item remains open and is a copy and policy decision (O-01) |
| No unverified security assumptions | **Met, with named limits.** Webhook signature, replay, duplicate, ordering, RLS, authorisation, cross-family isolation, entitlement bypass and double-checkout were each verified against the deployed system. Not verified: a real Safari on a physical device; production configuration (does not exist yet) |
| Final reports committed and pushed to the draft PR | See Delivery below |

## What was verified (summary; detail in COVERAGE-MATRIX.md and TEST-EXECUTION-RESULTS.md)

- Individual and Family, monthly and annual: payment, renewal, cancel at period end, resume, expiry, failed payment, recovery, upgrade, downgrade, plan caps.
- Real card payment and real decline on Stripe's hosted Checkout in Chromium, Firefox and WebKit, with the real webhook activating the plan.
- Webhook signature, tampering, one-hour replay, duplicate, out-of-order and delayed delivery, unappliable delivery.
- Parent token cannot read other families, forge subscription state, or call the webhook function; student of a non-paying parent is held to the sample.
- Customer portal session for the caller's own customer only.
- Mobile (390), tablet (834) and desktop (1440) billing UI; no sideways scrolling.

## Defects fixed in this PR that mattered most

- Late or reordered Stripe events could **reopen a cancelled subscription or downgrade a paying one** (B-01). The system now re-reads Stripe's current state for every event.
- A parent could be **billed twice** by opening a second Checkout (B-03). Now 409.
- The ported AGY work would have **re-exposed answer keys to guests** and broken guest practice (B-06, B-07). Not ported; the guest controls and the #130 redesign are untouched.
- A parent who paid before adding a child **never saw a payment confirmation** (B-12), found by the automated Checkout test and fixed.
- The Individual plan could not be stored (B-05). The approved migration is applied to DEV only.

## Free-plan claim versus behaviour (requested investigation)

**Facts measured.** Landing, pricing, assessments, billing and FAQ all say the Free plan is "5 sample questions in every programme, no account needed", and that a subscription "unlocks the full question bank". On the Preview, an anonymous guest received 10 questions in one sitting and can start more. Only signed-in students of a parent without access are limited to 5 per programme, and only while `BILLING_ENFORCEMENT_ENABLED=true`. The guardrail document says billing must never gate whether a guest can practise.

**Expected behaviour (to be decided by the owner).** The product currently has two incompatible stories: "Free is a 5-question sample" (copy, and the student limit) and "guests can always practise" (guardrail, and the server). The change to the guardrail text in this PR only records the signed-in-student rule; it does not decide the guest question.

**Recommendation, no product policy changed.**
1. **Short term (recommended):** correct the copy to match what the product does today. For example: "Try MindMosaic free as a guest, with no account or card" and describe paid value as what is genuinely gated: saved progress across sessions, child profiles and the parent dashboard, exam history, and (when enforcement is on) the full bank for signed-in students. Remove "5 sample questions" and "unlocks the full bank" until they are true. This is low risk and reversible.
2. **If you want a hard Free sample for guests:** that is a policy change to `PRIVACY_AND_BILLING_GUARDRAILS.md` and needs a server-side limit in `/api/exam/guest-session` (not the client), a rewrite of the guest e2e flows, and a decision on whether the 5-per-programme number is right. Hosted test `F1` will then fail on purpose and should be inverted.
3. Whichever is chosen, set `BILLING_ENFORCEMENT_ENABLED` deliberately per environment and keep copy and flag in step.

## Residual risks

| Risk | Level | Note |
|------|-------|------|
| Free-plan copy untrue (O-01) | High for production | Owner decision; recommendation above |
| Pricing, legal pages, live Stripe not set up | Production blockers | Out of scope here |
| `past_due` keeps access until the paid period ends (O-06) | Low | Confirm the grace policy |
| WebKit differs in headless mode after Stripe's redirect | Low | Strict checks on Chromium and Firefox; webhook and API verified on WebKit; real Safari still to be checked by a human (UAT M-05) |
| Sandbox dunning is not deterministic under test clocks | Low | Test accepts both legitimate Stripe outcomes and asserts correct entitlement for each |
| The deployed Vercel Preview and DEV Supabase are shared with other work | Low | Billing variables are branch-scoped; migration is additive and applied to DEV only |
| Stripe MCP connector failed to authenticate (O-08) | None for release | CLI and API covered all work; reconnect with `/mcp` |

## Owner actions needed

1. Decide O-01 (Free-plan wording or enforcement) and confirm pricing (O-02).
2. Run MANUAL-UAT-CHECKLIST.md on the Preview.
3. Re-authorise the Stripe MCP via `/mcp` if you want it back.
4. Before production: live Stripe set-up, legal sign-off, and apply `20261106090000_individual_plans.sql` to production through your normal release process (**not applied here**).
5. After UAT, rotate the Vercel automation-bypass token again (see "Security cleanup" below); the sandbox webhook URL carries the current one.

## Security cleanup (performed after testing)

| Item | Action | Result |
|------|--------|--------|
| Local Stripe credential files (`sandbox.env`, `webhook-secret.env`) | Overwritten with random data three times, then deleted; the whole `C:/tmp/stripe-readiness` directory and the AGY port scratch directory removed | Done. The sandbox secret key now exists only as a *sensitive* Vercel Preview variable scoped to this branch |
| Vercel Preview automation-bypass token | Revoked and regenerated through the Vercel API | Done. The old token is refused (HTTP 302 to the login wall); the new one is accepted. Hosted harness reads the current token from the project API on each run, so no file holds it |
| Sandbox webhook endpoint | URL updated to carry the new token (needed because the Preview sits behind Vercel Authentication) | Done. The token is visible only in the owner's sandbox Dashboard. **Rotate again after UAT.** |
| Secrets in Git history, logs, reports | Scanned every commit from the PR #156 base to the tested SHA, the committed evidence logs and the reports for `sk_test_`, `rk_test_`, `sk_live_`, `whsec_`, bypass-token query strings and JWTs | None found. The only match is a code comment in `scripts/stripe-setup.mts` that mentions the *prefix* `sk_live_` |
| Playwright traces | Deliberately not produced (a trace would record the bypass header) | By design |
| Production | No Stripe or billing variable exists for Vercel Production; Supabase CLI link points at DEV only; the only migration in the PR was applied to DEV; Stripe is the sandbox account | Confirmed. No production credential, deployment, database or Stripe resource was read or changed |
| Vercel Preview variables | 7 variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, four `STRIPE_PRICE_*`, `BILLING_ENFORCEMENT_ENABLED`) scoped to branch `feat/stripe-billing-readiness` | Left in place on purpose so UAT works. Remove them with `vercel env rm <name> preview feat/stripe-billing-readiness` when finished |

Note: because the local key files are gone, re-running the hosted billing suite later needs a fresh sandbox key saved as `C:/tmp/stripe-readiness/sandbox.env` and the webhook secret re-issued (`scripts/billing-readiness/configure-preview.mjs` does the second step).

## Delivery

All code and these reports are on `feat/stripe-billing-readiness` and in draft PR #159. The PR is not merged and was not marked ready.
