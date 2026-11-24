# Stripe billing readiness: test execution results

**Tested commit:** `08352f8a` on `feat/stripe-billing-readiness` (draft PR #159, stacked on the PR #156 branch).
**Hosted target:** the branch's Vercel Preview alias, verified to serve `08352f8a` before each cycle (deployment `readyState=READY`, `meta.githubCommitSha` matched).
**Data stores:** DEV Supabase `mfglzabnayacssgertat` only. Stripe sandbox `acct_1StznKDtPH5dvWkm` (test mode) only. No production resource was read or changed. No real payment was made.
**Executed:** 2026-11-23, Windows 11, Playwright 1.61.1, one worker, engines run sequentially (Chromium, then Firefox, then WebKit).

Documentation commits made after `08352f8a` change only files under `docs/reports/`; no application or test code changed after the tested SHA.

## 1. Two consecutive full hosted regression cycles: PASS

Cycle script: `scripts/billing-readiness/cycle.sh <n>`. Each cycle was started fresh after CI went green on the tested SHA. Earlier cycles on older SHAs were discarded and are not counted (see section 5).

| Leg | Spec | Cycle 1 | Cycle 2 |
|-----|------|---------|---------|
| Chromium lifecycle | `s1-billing-lifecycle` | 4 passed | 4 passed |
| Chromium security | `s2-billing-security` | 9 passed | 9 passed |
| Chromium extended | `s4-billing-extended` | 4 passed | 4 passed |
| Chromium UI (desktop 1440, tablet 834, mobile 390) | `s3-billing-ui` | 6 passed | 6 passed |
| Firefox UI | `s3-billing-ui` | 4 passed | 4 passed |
| WebKit UI | `s3-billing-ui` | 4 passed | 4 passed |
| **Total per cycle** | | **31 passed, 0 failed, 0 flaky, 0 skipped** | **31 passed, 0 failed, 0 flaky, 0 skipped** |

Cycle 1: 21:55 to 22:09 (+11:00). Cycle 2: 22:09 to 22:23. Raw logs: `evidence/logs/cycle1-*.log`, `evidence/logs/cycle2-*.log`, `evidence/logs/cycle{1,2}.summary`.

## 2. Test inventory and what each proves

| ID | Test | Proves |
|----|------|--------|
| L1 | Family monthly lifecycle | Pay (test clock customer, `pm_card_visa`) gives `active` and plan `family_monthly`; renewal moves `current_period_end` out by over 25 days; cancel at period end keeps access; resume; expiry past period end gives `canceled` and no access |
| L1b | Failed renewal | Failing card is declined; row mirrors Stripe (`past_due` keeps access until period end and recovers to `active` when a good card pays the invoice; or `canceled` then no access and re-checkout allowed) |
| L2 | Annual and Individual plans | Family annual, Individual monthly, Individual annual each map to the right plan with the right period and grant access |
| L3 | Declined payments | Card refused at creation: no paid state. Incomplete subscription: row `incomplete`, no access |
| L4 | Upgrade and downgrade | Individual to Family monthly, Family monthly to annual, Family to Individual: plan re-mapped each time, child cap follows, existing children kept on downgrade, access retained |
| W1 | Signature | Missing, malformed, wrong-secret, tampered-body and one-hour-old-timestamp deliveries each get 400 and leave no ledger row |
| W2 | Duplicate | Second delivery acknowledged as `duplicate`; exactly one ledger row |
| W3 | Out-of-order and delayed | A stale `updated(active)` after cancellation and a stale `payment_failed` leave the row `canceled` with no access |
| W4 | Unappliable delivery | A delivery that cannot be applied returns a 5xx (so Stripe retries) and writes no ledger row |
| S1 | Authorisation | All 7 billing routes return 401 to anonymous callers; cross-site Origin refused; bad or missing plan 400; portal and cancel with no customer or subscription 404 |
| S2 | Duplicate checkout | 409 `already_subscribed` for three plans while a paid subscription is in period; exactly one Stripe subscription exists afterwards |
| S3 | Checkout session | Real Stripe session bound to the caller's customer, `client_reference_id`, correct plan price, return URL on the Preview host |
| S4 | RLS | Parent sees only own subscription row; forged `PATCH` and `INSERT` change nothing; webhook RPC and event ledger unreachable with a parent token; cross-family cancel and portal never touch another family's customer or subscription |
| S5 | Entitlement | Student of a parent without access: full-length paper refused 402, custom draw clamped; student of a paying family not refused |
| S6 | Child caps | Individual allows 1 child; Family allows 3 and refuses a 4th |
| P1 | Customer portal | Portal session created for own customer, opens, allow-listed return path; status, invoices and payment-method routes work |
| F1 | Free-plan characterisation | What a guest is actually served (see section 4) |
| U1 | Plan picker | Both tiers, cadence switch, correct prices, no placeholder copy, 44px targets, page cannot scroll sideways at 1440, 834 and 390 wide |
| U2 | Subscribe | Sends the parent to Stripe-hosted Checkout; no card field on our origin |
| U3 | Real card payment in Stripe's hosted page | Success card completes; real webhook activates `individual_annual`; user returns to the app and sees "Payment received"; a second checkout is refused (409). Run on Chromium, Firefox, WebKit. WebKit does not follow Stripe's post-payment redirect in headless mode, so it verifies the plan via the webhook and records the difference |
| U4 | Declined card in Stripe's hosted page | Issuer's refusal shown on Stripe's page; plan never activates; session not paid. Run on Chromium, Firefox, WebKit |

## 3. Other verification

| Check | Result |
|-------|--------|
| CI on `08352f8a`: `core`, `e2e`, `e2e-auth`, `rls`, `scholarship-drafts`, Vercel | all success |
| Typecheck, lint | clean (lint: 0 errors; pre-existing warnings in unrelated files) |
| Billing-related unit tests (8 files) | 92 passed |
| Full vitest suite on the tested SHA | see section 6 |
| DEV migration `20261106090000_individual_plans.sql` | applied to DEV only, constraint verified, ledger row recorded, registry check `present = true` |
| Stripe sandbox | 4 recurring AUD prices by lookup key, 2 products, customer portal configured, one webhook endpoint for the branch Preview |
| Vercel | 7 variables set for Preview scoped to branch `feat/stripe-billing-readiness` only, stored sensitive; nothing set for Production |

## 4. Free-plan claim versus behaviour (finding F1)

Observed on the Preview: an anonymous guest `POST /api/exam/guest-session` for NAPLAN-style Year 3 numeracy with `questionCount: 10` returns **201 with 10 questions** in one sitting, and a guest can start further sittings. The site copy says "5 sample questions in every programme, no account needed" (landing, `/pricing`, `/assessments`, `/billing`, FAQ). A signed-in student whose parent has no access **is** held to a 5-per-programme sample, but only when `BILLING_ENFORCEMENT_ENABLED=true` (set on this Preview, off by default).

Expected behaviour is therefore undecided in the product: copy describes a hard 5-question Free plan; the guardrail (`PRIVACY_AND_BILLING_GUARDRAILS.md`) says billing must not gate guest practice; the server limits only signed-in students. Product policy was not changed. Recommendation is in FINAL-GO-NO-GO.md.

## 5. Failures found and resolved during execution (all re-verified in the counted cycles)

| What failed | Cause | Resolution | Kind |
|-------------|-------|------------|------|
| Late events could reopen a cancelled subscription | Webhook wrote the payload as-is | Re-sync from Stripe's current state | **Product defect (B-01)** |
| Double checkout possible | No guard | 409 `already_subscribed` | **Product defect (B-03)** |
| `subscription.created` and `invoice.paid` not synced | Events not handled | Added | **Product defect (B-04)** |
| Individual plan webhook write would fail | DEV CHECK constraint | Approved migration applied to DEV | **Environment (B-05)** |
| Guest bank would re-expose answers; client-only guest limits broke guest flows | Unported-AGY changes | Not ported / reverted | **Product defect (B-06, B-07)** |
| Mobile billing header clipped | Header did not wrap | Wrap | **Product defect (B-08)** |
| **Payment confirmation lost for a parent who pays before adding a child** | `/parent` redirected to `/parent/setup` dropping `?checkout=success`; setup had no toast | Flag carried across the redirect; toast mounted on setup; 4 unit tests | **Product defect (B-12), found by the automated Checkout test** |
| Stale `billing.spec.ts` | Asserted old roadmap copy | Rewritten per tier | Test |
| CI e2e: CI sets only Family prices | Spec assumed all-or-nothing | Per-tier expectation | Test |
| L1b never reached `past_due` | Sandbox dunning is non-deterministic under test clocks | Finalise and attempt the invoice, accept either legitimate Stripe outcome with correct entitlement assertion | Test (Stripe behaviour) |
| L3 asserted a trial parent has no access | Wrong assumption (trial is legitimate access) | Assert no paid state | Test |
| U3 expected a monthly plan | Page defaults to annual | Expect `individual_annual` | Test |
| Stripe Checkout unreachable to Playwright | Card form lives in an Elements iframe; Link opt-in requires a phone | Drive the frame; opt out of Link | Test |
| WebKit U3 hung after payment | Headless WebKit does not follow Stripe's redirect and cannot reload our origin afterwards | Verify via webhook and API on WebKit; strict redirect and toast check on Chromium and Firefox | Test (engine limitation, disclosed) |
| One cycle leg lost to a launcher error and one run stalled about 50 minutes | Transient `vercel api` error; DNS outage on the test machine | Rerun | Infrastructure |
| A background run was stopped by Claude Code under memory pressure | Machine low on memory | Not restarted until authorised; later runs used one worker and sequential engines | Infrastructure |

Cycles run before `08352f8a` (including two earlier cycles on `d7a9c72d` and `a504eaeb`) are **not counted**.

## 6. Unit suite on the tested SHA

`npx vitest run` on `08352f8a`: **467 test files, 7,514 tests, all passed, 0 failed.** (One unrelated filesystem test, `question-factory/legacy-import`, failed once in an earlier parallel run under load and passes alone; it did not fail in this run.)

## 7. Evidence

- `evidence/logs/`: Playwright list output for every leg of both counted cycles, per-cycle summaries, CI conclusion.
- `evidence/screenshots/`: Stripe-hosted Checkout (payment-method options, card form), the mobile `/billing` header before and after the fix, and an early run showing Stripe Link's phone prompt that the test now opts out of.
- **Playwright traces were deliberately not kept.** A trace records request headers, and the hosted harness sends the Vercel automation-bypass token as a header, so a trace would leak it. Failure screenshots are on, traces are off (`playwright.hosted.config.ts`). Per-run `report.json` files stay in the local `test-results/` directory (not committed).
