# Stripe billing readiness: coverage matrix

Legend: **H** hosted (real Stripe sandbox + DEV Supabase + Vercel Preview), **U** unit/component (vitest), **C** CI e2e (Playwright, local server), **M** manual UAT (see MANUAL-UAT-CHECKLIST.md), **n/a** not applicable.
Nothing in the hosted columns mocks Stripe or the database.

## Requirement coverage

| Area | Scenario | Automated evidence | Layer |
|------|----------|--------------------|-------|
| Payments | Successful payment, monthly (Family) | `L1` subscription paid on a test-clock customer (`pm_card_visa`), webhook sets `active`, plan mapped from price | H |
| Payments | Successful payment, annual (Family) | `L2` period end about one year out | H |
| Payments | Individual monthly and annual | `L2`; plan limit `S6` | H |
| Payments | Declined payment at creation | `L3a` Stripe refuses (`card_declined`); row stays trial, no plan, no Stripe subscription | H |
| Payments | Incomplete (payment failed, left open) | `L3b` row becomes `incomplete`, no access | H |
| Payments | Stripe Checkout session creation | `S3`: session bound to the caller's customer, `client_reference_id`, price id, success URL on the Preview host | H |
| Payments | Card payment and decline on Stripe-hosted Checkout, Chromium, Firefox, WebKit | `U3` (success, real webhook, return and confirmation, second checkout 409), `U4` (decline shown, no activation) | H |
| Lifecycle | Renewal | `L1`: clock advanced to renewal, new `current_period_end` > +25 days | H |
| Lifecycle | Failed renewal then recovery | `L1b`: finalise and attempt with failing card gives `past_due` (access kept until period end); pay with good card gives `active` | H |
| Lifecycle | Failed renewal ends in cancellation | `L1b` alternate branch: `canceled`, no access, re-checkout allowed | H |
| Plan changes | Individual to Family, monthly to annual, Family to Individual; caps follow; children kept | `L4` | H |
| Customer portal | Session for own customer; return path allow-listed; status/invoices/payment-method | `P1` | H |
| Webhooks | Unappliable delivery returns 5xx, no ledger row | `W4` | H |
| Free plan | Characterise what a guest is served | `F1` (10 questions) | H |
| Lifecycle | Cancel at period end, resume | `L1`: `/api/stripe/cancel`, `/api/stripe/resume`; still active until period end | H |
| Lifecycle | Expiry | `L1`: clock past period end, `customer.subscription.deleted`, `canceled`, `has_active_access` false | H |
| Webhooks | Missing / malformed / wrong-secret / tampered / replayed-timestamp signatures | `W1` (400 each; no ledger row) | H, U |
| Webhooks | Duplicate delivery | `W2`: second delivery `duplicate:true`; one ledger row | H, U |
| Webhooks | Out-of-order and delayed | `W3`: stale `active` after cancel and stale `payment_failed`; row stays `canceled` | H, U (6 cases) |
| Webhooks | Delivery failure retried | unit: Stripe outage during re-sync throws, RPC never called | U |
| Webhooks | Transactional apply / idempotency | RPC `apply_stripe_subscription_event` (migration `20260723090000`, already on DEV) | H via `W2` |
| Duplicate checkout | 409 `already_subscribed` | `S2` hosted (three plans refused, one Stripe subscription); 6 unit cases incl. canceled/trialing/expired allowed | H, U |
| Authorisation | Anonymous on all 7 billing routes | `S1`: 401 each | H |
| Authorisation | Cross-site Origin | `S1`: 4xx; unit MM-SEC-03 | H, U |
| Authorisation | Invalid or missing plan, no customer, no subscription | `S1`: 400 / 404 | H |
| Authorisation | Student or non-parent on billing routes | unit `parents_only` 403 | U |
| RLS | Parent reads only own subscription row | `S4` | H |
| RLS | Forged `PATCH` / `INSERT` of paid status | `S4`: 0 rows changed, insert refused, DB row still `trialing` and `plan` null | H |
| RLS | Webhook RPC and ledger not reachable by a parent token | `S4` | H |
| RLS | Family isolation | `S4`: parent A's cancel/portal 404; family B's subscription untouched in Stripe and DB | H |
| Entitlement | Student of a no-access parent: paper refused 402; draw clamped to sample | `S5` | H, U |
| Entitlement | Student of a paying family not refused | `S5` | H |
| Entitlement | Enforcement off is a no-op | unit `require-active-subscription`, `student-access` | U |
| Entitlement | Plan child cap (Individual 1, Family 3) | `S6` | H, U |
| Guest security | Guest answer controls and guest-bank 410 preserved | route file identical to base; CI e2e guest flows green | C |
| #130 redesign | Parent and billing UI preserved | no ported AGY UI; CI e2e green | C |
| Config | Stripe sandbox, products, 4 prices (lookup keys), portal, webhook, Vercel Preview vars | `configure-preview.mjs` run log; Stripe CLI listing | H |
| DB | Migration applied to DEV only, verified | `pg_constraint` check, ledger row | H |
| UI | Plan picker both tiers, cadence switch, honest prices, no placeholder copy | `U1` | H |
| UI | Subscribe goes to Stripe-hosted page, no card field on our origin | `U2` | H |
| UI | Responsive: desktop 1440, tablet 834, mobile 390; page does not scroll sideways | `U1` x3 projects | H |
| Cross-browser | Chromium, Firefox, WebKit | UI spec on all three; lifecycle and security are engine-independent API and DB checks run once per cycle on Chromium | H |
| Time | Stripe test clocks | `L1`, `L1b`, `L2`, `L3`, `W2`, `W3`, `S2`, `S4`, `S5`, `S6` | H |

## Test inventory

| Suite | Count | Result |
|-------|-------|--------|
| Billing-related unit tests (`apply-subscription-event`, `stripe-checkout-route`, `stripe-webhook-route`, `require-active-subscription`, `student-access`, `billing-plans`, `free-sample`, `provision-child`) | 92 | pass |
| Full vitest suite | 7,510 | pass (one unrelated filesystem test, `legacy-import`, flaked once under load and passes alone) |
| Hosted lifecycle (`s1`) | 4 | 4 passed in each of 2 cycles |
| Hosted security (`s2`) | 9 | 9 passed in each of 2 cycles |
| Hosted extended (`s4`) | 4 | 4 passed in each of 2 cycles |
| Hosted UI (`s3`) | U1 x3 projects + U2 + U3 + U4 on Chromium; 4 each on Firefox and WebKit | 14 passed per cycle |
| CI: `core`, `e2e`, `e2e-auth`, `rls`, `scholarship-drafts`, Vercel | all | green on final commit |

## Gaps

| Gap | Impact | Mitigation |
|-----|--------|------------|
| Real Safari on a physical device | Headless WebKit differs (does not follow Stripe's redirect) | Manual UAT M-05 |
| Student-role denial on billing routes only unit-tested | Hosted check would need a student session per route | Same `requireParentSubscriptionRow` gate is hit for every route and covered by the hosted anonymous and cross-family checks |
| Real (non-test-clock) elapsed-time renewals | Not possible in a sandbox run | Test clocks are Stripe's supported mechanism |
| Production Stripe account and live keys | Out of scope by instruction | Release checklist in GO-NO-GO.md |
