# Integration assessment: PR #156 + PR #160 (auth) + PR #159 (billing)

Date 2026-11-24. DEV Supabase and Stripe sandbox only. Nothing merged into `dev` or `main`; no production resource touched.

## Candidate

- Branch `integration/combined-156-159-160-candidate` = #159 (`d96a282c`) merged with #160 (`d603bb74`), both stacked on the #156 branch (`3253ab1e`). Merge commit `1d1580de`.
- CI-only draft PR #161, titled "[CANDIDATE - DO NOT MERGE]". Close it once the sequence is decided.

## Compatibility

| Check | Result |
|-------|--------|
| Files changed by both PRs | One: `src/features/auth/provision-child.ts`. Git merged it with no conflict |
| Semantic review of that file | Compatible. #160 adds typed error codes (401/403/503) and #159 adds the plan child cap. The cap runs after auth checks, applies regardless of `allowDuplicate`, and returns 400 with the upgrade message (no error code) |
| #160 cookie hardening (`Secure`, `SameSite=Lax`) vs Stripe | No interaction. Only auth cookies change. The webhook, which has no cookies or Origin, is unaffected |
| #160 CSRF Origin enforcement vs Stripe routes | Consistent with #159 behaviour (hosted S1 already expects 4xx on a foreign Origin) |
| Database migrations | #160 has none. #159 has one (`20261106090000_individual_plans.sql`), already on DEV, not on production |
| Free-plan copy (O-01) | Independent of #160 |

## Regression on the combined candidate

| Gate | Result |
|------|--------|
| typecheck | clean |
| lint | 0 errors (17 warnings, pre-existing) |
| vitest, full suite | 469 files, 7,528 tests, all passed (includes the auth-hardening, provision-child, entitlement, apply-subscription-event, checkout-route and family-isolation unit tests from both PRs) |
| CI on PR #161 | Vercel, core, e2e, e2e-auth, rls, scholarship-drafts: all pass |
| CI on PR #159 at `d96a282c` | all pass |

**Not run (disclosed):** the hosted regression (the #160 auth specs plus the #159 `s1` to `s4` specs) against a Preview of the candidate. The sandbox key was destroyed in the security cleanup and the candidate has no branch-scoped Stripe variables. Each PR's hosted suite passed on its own head. A combined hosted cycle needs a fresh sandbox key and the Preview variables, which is an owner step. The #160 plan lists the cases (`INT-AUTH-*`, `INT-ENT-*`, `INT-BILL-*`).

## Integration defects

None found. No code change was needed to combine the PRs.

## Remaining blockers

1. Combined hosted regression, two cycles on the final `dev` deployment (needs a fresh sandbox key).
2. Pricing is provisional (O-02).
3. Legal: `/terms` calls itself "a draft pending professional legal review". Neither `/terms` nor `/privacy` mentions subscriptions, billing, cancellation, refunds, GST or Stripe, so a paid launch needs that text (O-04).
4. Production Stripe: live-mode account and business verification, tax (GST) settings, live products and prices matching the lookup keys, a live webhook endpoint on an unprotected domain subscribed to the five handled events, a live customer portal configuration, and live keys in Production variables only. Then apply the migration to production in the release PR.
5. `past_due` grace policy (O-06) and the `BILLING_ENFORCEMENT_ENABLED` setting per environment.

## Recommended merge sequence (owner merges)

1. #156 into `dev`. CI green.
2. #160 into `dev`. No migrations. Hosted auth smoke on `git-dev`.
3. #159 into `dev` (rebase onto the updated `dev`; the one shared file merges cleanly). Migration is already on DEV. Re-issue the sandbox key and Preview variables, then run `scripts/billing-readiness/cycle.sh 1` and `2` plus the #160 hosted specs on the final `dev` deployment.
4. Close #161. Resolve O-01 follow-up, legal text and live Stripe setup before any `dev` to `main` release PR.
