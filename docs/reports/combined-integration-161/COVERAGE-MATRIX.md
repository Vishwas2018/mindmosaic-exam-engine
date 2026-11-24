# Combined integration coverage matrix: PR #161 (#156 + #159 + #160)

Tested SHA `a1759a6b`, deployment `dpl_DARumhyTQMi5cmm7sCyX5iAsqZwD`. Each cell is **cycle 1 / cycle 2**: `P` passed, `F` failed, `s` skipped, `–` not run in that column by design. Columns: Chromium desktop 1440, tablet 834, mobile 390; Firefox and WebKit desktop 1440.

## Scenario coverage

| Area (owner item 6) | Scenarios | Chromium | Firefox | WebKit |
|---|---|---|---|---|
| Authentication | Registration with real email, verification, duplicates, simultaneous sign-ups (REG-01..04, A0); login, lockout, role homes, logout + Back, multi-tab, ephemeral session, revoked account (AUTH-01/02); recovery end-to-end (REC-01); single-use and tamper-proof links, weak passwords, no enumeration (N1–N12); offline recovery and student PIN pad (XBR-01) | All passed ×2 | AUTH-01/02, XBR-01 ×2 | AUTH-01/02, XBR-01 ×2 |
| Student journeys | PIN sign-in (B1–B2); timed paper: answer, navigate, autosave, resume, submit, marks match stored attempt, review, history (B3–B8 + C); student screens responsive | ×2 | ×2 | ×2 |
| Parent journeys | Sign-in, add child, print card, sign-out/in (A3–A11); parent sees child's result (C12); parent screens responsive | ×2 | ×2 | ×2 |
| Guest access | Guard state explicit (G2a); one winner under conflicting submits, no cross-browser reuse (G2b); per-browser rate limit 429 + Retry-After (G2c); untimed guest sitting (H) | ×2 | ×2 | ×2 |
| Assessments / programmes | Approved programmes and counts only (G); AMC labelling and picker, ICAS not offered (H); exam runner and results review responsive (E) | ×2 | ×2 | ×2 |
| Subscriptions | Family monthly pay/renew/cancel/resume/expire on test clocks (L1); failed renewal and dunning recovery (L1b); annual and Individual cadences (L2); declined payments (L3); upgrade/downgrade re-map plan and child cap (L4) | ×2 | – (server/API path) | – |
| Billing | Stripe-hosted Checkout, no card field on our origin (U2); sandbox payment activates plan via webhook, second checkout refused (U3); declined card (U4); plan picker prices and overflow (U1); customer portal own customer only (P1) | ×2 | U1–U4 ×2 | U1–U4 ×2 |
| Security | 6-role × route matrix and API matrix with real cross-family IDs (RBAC-01); cookies `Secure`, CSP, open redirects, CSRF Origin, tampered JWT, privilege escalation, secret leakage (SEC-01); billing routes refuse unauthenticated and cross-site callers (S1); webhook signature, replay, duplicate, out-of-order, unappliable delivery (W1–W4); RLS on billing tables (S4); Vihaan pilot allowlist (V) | ×2 | RBAC-01, SEC-01 (no SameSite), V ×2 | RBAC-01, SEC-01 (no SameSite), V ×2 |
| Entitlement rules | 409 while paid in period (S2); Checkout bound to own customer and plan (S3); unpaid parent's student held to free sample, paid family gets full bank (S5); Individual caps at one child, Family three (S6); guest-served content characterisation (F1) | ×2 | – (server/API path) | – |
| Cross-family isolation | Two families: students, parents and anonymous refused the other family's data (D); cross-family child IDs in RBAC-01 API matrix | ×2 | ×2 | ×2 |

## Coverage exceptions (not counted as passes)

| ID | Exception | Why | Mitigation | Needs owner acceptance |
|----|-----------|-----|------------|------------------------|
| X1 | **WebKit SameSite attribute not asserted** | Playwright's Windows WebKit reports `sameSite: "None"` for cookies set `Lax`/`Strict` (probed) | Asserted on Chromium and Firefox both cycles; `Secure` asserted on all engines; cookie attributes are set server-side and are browser-independent | Yes. Real Safari check in manual UAT recommended |
| X2 | A1–A2 (form registration confirmed via operator inbox) never run | Needs `HOSTED_MAIL_BASE` (an inbox the operator reads) and a manual link drop | Same journey automated with real mail by A0 (×2 parents) and REG-02/03/04 | Yes |
| X3 | Real-email scenarios (A0, REG-01..04, REC-01, N1–N12) run on Chromium only | Supabase's hourly auth-email cap; email content and delivery are browser-independent | Link-opening, sign-in and recovery UI exercised on Firefox/WebKit by AUTH-01/02 and XBR-01 | Yes |
| X4 | Billing lifecycle, security, webhook, RLS and entitlement (s1, s2, s4) run on Chromium only | Server/API scenarios driven through Stripe and request APIs; the browser engine is not in the path | Billing UI including real Checkout (s3 U1–U4) runs on all three engines | Yes |
| X5 | Tablet 834 and mobile 390 viewports on Chromium only | Firefox/WebKit configured for desktop 1440 | `@responsive` specs run in three Chromium viewports | Yes |
| X6 | WebKit is Playwright's Windows build, not Safari on macOS/iOS | Test host is Windows | Manual UAT on a real iPhone/iPad and Safari recommended | Yes |
| X7 | `m-manual-test-family` (seeds the owner's manual-test family) not run | Writes the owner's fixed accounts; opt-in | Not a test of behaviour | No |

## Per-test results

| Spec | Test | Cr-desk | Cr-tab | Cr-mob | firefox | webkit | Batches |
|---|---|---|---|---|---|---|---|
| `a-parent-onboarding.spec.ts` | A1–A2: parent registers through the form and confirms with the mailed link | s/s | –/– | –/– | s/s | s/s | C2-family-chain, C5-mail-onboarding, F2-family-chain, W2-family-chain |
| `a-parent-onboarding.spec.ts` | A3–A11: confirmed parent signs in, adds a child, prints a card, signs out and back in | P/P | –/– | –/– | P/P | P/P | C2-family-chain, C5-mail-onboarding, F2-family-chain, W2-family-chain |
| `a0-real-email.spec.ts` | A0: two parents register with real email; confirm, sign in, recover and change the passwor | P/P | –/– | –/– | –/– | –/– | C5-mail-onboarding |
| `auth-audit/01-registration-and-verification.spec.ts` | REG-01: Form validation, password boundaries, draft restore (no password stored), invalid  | P/P | –/– | –/– | –/– | –/– | C6-mail-auth |
| `auth-audit/01-registration-and-verification.spec.ts` | REG-02: Real registration, double-click guard, unverified sign-in & enumeration check, dup | P/P | –/– | –/– | –/– | –/– | C6-mail-auth |
| `auth-audit/01-registration-and-verification.spec.ts` | REG-03: Cross-device verification & verification while already signed in as another user | P/P | –/– | –/– | –/– | –/– | C6-mail-auth |
| `auth-audit/01-registration-and-verification.spec.ts` | REG-04: Simultaneous registrations in two parallel browser contexts | P/P | –/– | –/– | –/– | –/– | C6-mail-auth |
| `auth-audit/02-login-logout-recovery.spec.ts` | AUTH-01: Empty inputs, malformed email, wrong password vs unknown account, and 5-attempt l | P/P | –/– | –/– | P/P | P/P | C1-auth, C6-mail-auth, F1-auth, W1-auth |
| `auth-audit/02-login-logout-recovery.spec.ts` | AUTH-02: Role-home routing (Parent, Student, Teacher, Admin), logout + Back button, multi- | P/P | –/– | –/– | P/P | P/P | C1-auth, C6-mail-auth, F1-auth, W1-auth |
| `auth-audit/02-login-logout-recovery.spec.ts` | REC-01: Password recovery end-to-end, active-session guard, cross-device invalidation & /a | P/P | –/– | –/– | s/s | s/s | C1-auth, C6-mail-auth, F1-auth, W1-auth |
| `auth-audit/03-rbac-isolation-security.spec.ts` | RBAC-01: Complete 6-role Route Matrix + API Authorisation Matrix + Cross-Family Isolation  | P/P | –/– | –/– | P/P | P/P | C1-auth, F1-auth, W1-auth |
| `auth-audit/03-rbac-isolation-security.spec.ts` | SEC-01: Cookies, CSP, Open Redirects, CSRF Origin, Tampered JWT, Privilege Escalation & Se | P/P | –/– | –/– | P/P | P/P | C1-auth, F1-auth, W1-auth |
| `auth-audit/04-cross-browser-resilience.spec.ts` | XBR-01: Parent & Student sign-in, offline recovery, refresh, logout + back navigation @res | P/P | P/P | P/P | P/P | P/P | C3-responsive, F3-responsive-public, W3-responsive-public |
| `b-c-student-assessment.spec.ts` | B1–B2: wrong code and wrong PIN get one generic message; correct ones reach My Space | P/P | –/– | –/– | P/P | P/P | C2-family-chain, F2-family-chain, W2-family-chain |
| `b-c-student-assessment.spec.ts` | B3–B8 + C: timed paper — answer, navigate, autosave, resume, submit, marks equal the store | P/P | –/– | –/– | P/P | P/P | C2-family-chain, F2-family-chain, W2-family-chain |
| `d-security-isolation.spec.ts` | D: two families are isolated; students, parents and anonymous visitors are refused what is | P/P | –/– | –/– | P/P | P/P | C2-family-chain, F2-family-chain, W2-family-chain |
| `e-responsive-a11y.spec.ts` | E: parent screens | P/P | P/P | P/P | P/P | P/P | C3-responsive, F3-responsive-public, W3-responsive-public |
| `e-responsive-a11y.spec.ts` | E: student screens | P/P | P/P | P/P | P/P | P/P | C3-responsive, F3-responsive-public, W3-responsive-public |
| `e-responsive-a11y.spec.ts` | E: the exam runner and results review | P/P | P/P | P/P | P/P | P/P | C3-responsive, F3-responsive-public, W3-responsive-public |
| `g-content-governance.spec.ts` | G: only approved programmes are offered, with approved counts | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |
| `g2-guest-guard.spec.ts` | G2a: guard state is explicit — either shared and working, or failing closed | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |
| `g2-guest-guard.spec.ts` | G2b: parallel conflicting submits have exactly one winner; another browser cannot use the  | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |
| `g2-guest-guard.spec.ts` | G2c: a browser that keeps starting sittings is rate limited (429 with Retry-After) | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |
| `h-programme-availability-and-labels.spec.ts` | AMC-style is described the same way on landing, programmes, practice and the picker | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |
| `h-programme-availability-and-labels.spec.ts` | ICAS-style is not offered anywhere while its practice catalogue entries are coming so | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |
| `h-programme-availability-and-labels.spec.ts` | start untimed, read the runner, submit, read the results | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |
| `h-programme-availability-and-labels.spec.ts` | the paper picker lists one AMC-style sitting per year, badged as a module | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |
| `h-programme-availability-and-labels.spec.ts` | the practice catalogue lists AMC once | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |
| `n-negative-auth.spec.ts` | N1-N4: confirmation link is single-use and tamper-proof; sign-in stays blocked until confi | P/P | –/– | –/– | –/– | –/– | C5-mail-onboarding |
| `n-negative-auth.spec.ts` | N11: reset and confirm pages opened with no link give guidance, not a form or an error pag | P/P | –/– | –/– | –/– | –/– | C5-mail-onboarding |
| `n-negative-auth.spec.ts` | N12: a confirmation link opened in a different browser shows same-device guidance and the  | P/P | –/– | –/– | –/– | –/– | C5-mail-onboarding |
| `n-negative-auth.spec.ts` | N5-N9: recovery link is single-use and tamper-proof; weak passwords refused; no account en | P/P | –/– | –/– | –/– | –/– | C5-mail-onboarding |
| `s1-billing-lifecycle.spec.ts` | L1 Family monthly: pay, renew, cancel at period end, resume, expire | P/P | –/– | –/– | –/– | –/– | C7-billing-lifecycle |
| `s1-billing-lifecycle.spec.ts` | L1b failed renewal: access follows Stripe's dunning outcome, and a paid invoice recovers a | P/P | –/– | –/– | –/– | –/– | C7-billing-lifecycle |
| `s1-billing-lifecycle.spec.ts` | L2 plans: annual and Individual cadences map to the right plan and period | P/P | –/– | –/– | –/– | –/– | C7-billing-lifecycle |
| `s1-billing-lifecycle.spec.ts` | L3 declined payments never grant access | P/P | –/– | –/– | –/– | –/– | C7-billing-lifecycle |
| `s2-billing-security.spec.ts` | S1 unauthenticated and cross-site callers are refused on every billing route | P/P | –/– | –/– | –/– | –/– | C8-billing-security |
| `s2-billing-security.spec.ts` | S2 checkout is refused with 409 while a paid subscription is in period | P/P | –/– | –/– | –/– | –/– | C8-billing-security |
| `s2-billing-security.spec.ts` | S3 a trial parent gets a real Stripe Checkout session bound to their own customer and plan | P/P | –/– | –/– | –/– | –/– | C8-billing-security |
| `s2-billing-security.spec.ts` | S4 RLS: a parent token cannot read, forge or call the billing write paths, and sees only i | P/P | –/– | –/– | –/– | –/– | C8-billing-security |
| `s2-billing-security.spec.ts` | S5 entitlement: a student of a parent without access is held to the free sample, a paid fa | P/P | –/– | –/– | –/– | –/– | C8-billing-security |
| `s2-billing-security.spec.ts` | S6 Individual plan caps the account at one child; Family allows three and refuses a fourth | P/P | –/– | –/– | –/– | –/– | C8-billing-security |
| `s2-billing-security.spec.ts` | W1 webhook signature: missing, malformed, wrong secret, tampered body and replayed timesta | P/P | –/– | –/– | –/– | –/– | C8-billing-security |
| `s2-billing-security.spec.ts` | W2 duplicate delivery is acknowledged once and applied once | P/P | –/– | –/– | –/– | –/– | C8-billing-security |
| `s2-billing-security.spec.ts` | W3 out-of-order and delayed events cannot resurrect a cancelled subscription | P/P | –/– | –/– | –/– | –/– | C8-billing-security |
| `s3-billing-ui.spec.ts` | U1 plan picker: both tiers, cadence switch, honest prices, no horizontal overflow | P/P | P/P | P/P | P/P | P/P | C9-billing-ui, F4-billing-ui, W4-billing-ui |
| `s3-billing-ui.spec.ts` | U2 Subscribe sends the parent to Stripe-hosted Checkout (no card field on our origin) | P/P | –/– | –/– | P/P | P/P | C9-billing-ui, F4-billing-ui, W4-billing-ui |
| `s3-billing-ui.spec.ts` | U3 sandbox card payment succeeds, activates the plan via webhook, then a second checkout i | P/P | –/– | –/– | P/P | P/P | C9-billing-ui, F4-billing-ui, W4-billing-ui |
| `s3-billing-ui.spec.ts` | U4 sandbox declined card shows the issuer's refusal and never activates the plan | P/P | –/– | –/– | P/P | P/P | C9-billing-ui, F4-billing-ui, W4-billing-ui |
| `s4-billing-extended.spec.ts` | F1 characterisation: what a guest is actually served, versus the 'Free: 5 sample questions | P/P | –/– | –/– | –/– | –/– | C7-billing-lifecycle |
| `s4-billing-extended.spec.ts` | L4 upgrade and downgrade re-map the plan and the child cap, without deleting anyone's chil | P/P | –/– | –/– | –/– | –/– | C7-billing-lifecycle |
| `s4-billing-extended.spec.ts` | P1 customer portal: a parent gets a portal session for their own customer only; the return | P/P | –/– | –/– | –/– | –/– | C7-billing-lifecycle |
| `s4-billing-extended.spec.ts` | W4 a delivery that cannot be applied is refused (so Stripe retries) and leaves no ledger t | P/P | –/– | –/– | –/– | –/– | C7-billing-lifecycle |
| `v-vihaan-restriction.spec.ts` | V: Vihaan pilot routes and API refuse non-allowlisted parents, students and anonymous visi | P/P | –/– | –/– | P/P | P/P | C4-public-guest, F3-responsive-public, W3-responsive-public |

Unit, integration and RLS coverage for the same SHA is CI (`core` vitest suite, `rls`, `e2e`, `e2e-auth`): 7/7 green on `a1759a6b`. It includes the auth hardening, provision-child, entitlement, apply-subscription-event, checkout-route and family-isolation unit tests from #159 and #160.
