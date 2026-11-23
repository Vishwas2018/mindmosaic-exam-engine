# MindMosaic Combined Integration Regression Plan (PR #156 + PR #159 + PR #160)

- **Date:** 2026-11-23
- **Scope:** Combined integration of:
  - **PR #156 (`integration/beta-readiness-claude-20261120` @ `3253ab1e`)** — component PRs (`#147`, `#148`, `#149`+`#151`, `#150`+`#152`, `#146`, `#145`+`#155`, `#143`+`#153`, `#144`+`#154`, `#157`, `#158`, Redis guest guard)
  - **PR #160 (`audit/auth-e2e-20261123`)** — Authentication hardening (`DEF-AUTH-001`..`004`, `DEF-AUTH-006`) + hosted auth audit suite (`01`–`04`)
  - **PR #159 (`feat/stripe-billing-readiness` @ `d7a9c72d`)** — Stripe sandbox billing (Individual + Family plans, Free-sample entitlement, webhook idempotency & hardening, `20261106090000_individual_plans.sql`)
- **Environment:** DEV Supabase (`mfglzabnayacssgertat`), Stripe Sandbox (`acct_1StznKDtPH5dvWkm`), Vercel DEV Preview exclusively. Never Production (`uermhsptduikehuyceiz`).

---

## 1. Pre-Integration Gates

1. **DEV Supabase Redirect URL (`DEF-AUTH-005`):** Confirm DEV Supabase (`mfglzabnayacssgertat`) -> Authentication -> URL Configuration -> Redirect URLs accepts `https://<preview-host>/auth/confirm` and `https://<preview-host>/auth/reset` (verified via direct `generateLink` probe + live `REG-02`, `REG-04`, `REC-01` returning `MATCH`, zero fallback to `git-dev`).
2. **Safe Merge Order (No Merges Until Approved):**
   - Step A: Merge PR #156's component PRs into `dev` in documented order; verify `dev` CI green.
   - Step B: Rebase & merge PR #160 into `dev` (zero DB migrations, 0 conflicts); verify `dev` CI green and run hosted auth smoke on `git-dev` (already allowlisted in DEV Supabase).
   - Step C: Rebase PR #159 onto updated `dev` (verified 0 textual conflicts on `src/features/auth/provision-child.ts` via `git merge-tree`); apply `supabase/migrations/20261106090000_individual_plans.sql` to DEV Supabase with owner approval; merge PR #159 into `dev`.
3. **Preview Environment Parity:** Verify Vercel Preview env vars (`STRIPE_SECRET_KEY` sandbox, `STRIPE_WEBHOOK_SECRET`, Individual + Family price IDs, Redis guest guard store, `NEXT_PUBLIC_SUPABASE_URL` = DEV `mfglzabnayacssgertat`, optionally `MM_DEV_AUTH_CSP_ENFORCE=1`).

---

## 2. Combined Test Matrix (Authentication × Trial Entitlements × Stripe Billing)

### Track A — Authentication & Session Hardening (PR #160 + PR #156)
| Case ID | Scenario | Spec / Test | Pass Criteria |
|---|---|---|---|
| `INT-AUTH-01` | Real-email parent registration, confirmation (`/auth/confirm`), duplicate unverified/verified, simultaneous sign-up | `01-registration-and-verification.spec.ts` (`REG-01`..`04`) | `redirect_to` stays on target Preview with `/auth/confirm`; 100% first-attempt delivery; no enumeration |
| `INT-AUTH-02` | Standalone `/auth/forgot` & `/sign-in?mode=forgot` validation, 30s resend cooldown, real-email recovery (`/auth/reset`), cross-device session invalidation | `02-login-logout-recovery.spec.ts` (`AUTH-01`, `AUTH-02`, `REC-01`) + `forgot-password-page.test.tsx` | `redirect_to` preserves `/auth/reset`; Device B redirected to `/session-expired`; old password rejected |
| `INT-AUTH-03` | 6-role × 19-route UI matrix (114 cells) + 6-role × 10-API matrix (60 cells) with valid cross-family child UUIDs | `03-rbac-isolation-security.spec.ts` (`RBAC-01`) | 114/114 UI + 60/60 API pass; student onboarding routes `403` for non-students; `POST /api/parent/children` `401`/`403` |
| `INT-AUTH-04` | Session cookie `Secure=true`, `SameSite=Lax`, nonce CSP, CSRF `checkOrigin` (including now-enabled `/api/stripe/checkout`), open redirects, JWT tamper, privilege escalation | `03-rbac-isolation-security.spec.ts` (`SEC-01`) | `Secure=true`; all active mutating routes (incl. `/api/stripe/checkout`) return `403` on evil/missing `Origin`; 0 leaks |
| `INT-AUTH-05` | Cross-browser & multi-viewport resilience (Chromium `1440`/`834`/`390`, Firefox, WebKit) | `04-cross-browser-resilience.spec.ts` (`XBR-01`) | 5/5 pass including offline recovery, logout, student PIN pad |

### Track B — Trial Entitlements & Child Provisioning Boundary (PR #159 × PR #160)
| Case ID | Scenario | Spec / Test | Pass Criteria |
|---|---|---|---|
| `INT-ENT-01` | Newly registered/seeded parent receives active trial row via DB trigger and accesses `/parent` without premature `/billing` redirect | `AUTH-02`, `RBAC-01`, `s1-billing-lifecycle.spec.ts` | Parent lands on `/parent`; `current_parent_has_access()` returns `true` during trial |
| `INT-ENT-02` | Parent on Trial / Free / Family plan can add up to 3 children; parent on Individual plan is capped at 1 child (`provision-child.ts` combined change) | `provision-child.test.ts` + `auth-audit-hardening.test.ts` + `s1-billing-lifecycle.spec.ts` | 1st child `200`; 2nd child on Individual plan refused with upgrade message; unauthenticated returns `401`; non-parent returns `403` |
| `INT-ENT-03` | Expired-trial / cancelled parent is redirected from `/parent` -> `/billing`, while linked student is **NOT** redirected to `/billing` and stays gated to Free 5-question sample in `/api/exam/session` | `s1-billing-lifecycle.spec.ts`, `student-access.test.ts`, `require-active-subscription.test.ts` | Parent -> `/billing`; Student accesses `/student` and `/api/exam/session` returns only Free sample items (never full bank) |
| `INT-ENT-04` | Archived/paused child under paid Family plan is immediately signed out (`denyArchivedSessions`) and still counts toward the 3-child plan cap (cannot bypass cap by archive-add-restore) | `AUTH-02` + `provision-child.test.ts` | Archived child session rejected immediately; child link still counted in `maxChildrenForPlan` |

### Track C — Stripe Billing Lifecycle, Webhooks & Security (PR #159 + PR #160)
| Case ID | Scenario | Spec / Test | Pass Criteria |
|---|---|---|---|
| `INT-BILL-01` | Parent checkout (Individual & Family, monthly & annual), successful payment, active subscription webhook apply, upgrade/downgrade via Customer Portal, cancellation & expiry (Stripe test clocks) | `e2e/hosted/s1-billing-lifecycle.spec.ts` | Subscription state transitions accurately in DEV `subscriptions`; entitlements activate and revoke on expiry |
| `INT-BILL-02` | Duplicate Checkout prevention (`409 already_subscribed`), duplicate/replayed webhook idempotency, invalid Stripe signature rejection, student/teacher/admin/anonymous blocked from `/api/stripe/*` | `e2e/hosted/s2-billing-security.spec.ts` + `apply-subscription-event.test.ts` + `stripe-checkout-route.test.ts` | Duplicate checkout `409`; invalid signature `400`; non-parent `401`/`403`; evil/missing `Origin` `403` on `/api/stripe/{checkout,portal,cancel,resume}` |
| `INT-BILL-03` | Billing UI & guest/student boundaries (`/pricing`, `/billing`, `/parent/account/billing`) | `e2e/hosted/s3-billing-ui.spec.ts` + `e2e/billing.spec.ts` | Students never see prices/checkout CTAs; parents see accurate plan cards & portal controls |
| `INT-GUEST-01` | Guest practice answer boundary & Redis-backed rate limits (PR #149/#151/#156) | `e2e/hosted/g2-guest-guard.spec.ts` + `e2e/hosted/g-content-governance.spec.ts` | No answer oracle leaks; per-IP/per-browser limits enforced cleanly |

---

## 3. Execution Cadence & Exit Criteria

1. **Local / CI Gate (Every Commit):** `core` (typecheck, lint, vitest, build, content/answer/ledger checks), `rls`, `e2e`, `e2e-auth`, `scholarship-drafts` — **all green**.
2. **Combined Hosted Regression (2 Consecutive Cycles on Same Final `dev` Deployment SHA):**
   - Run Track A (`01`–`04` including Chromium/Firefox/WebKit), Track B & C (`s1`–`s3`, `d-security-isolation`, `g2-guest-guard`).
   - **Zero** application failures, **zero** unresolved High/Critical defects, **100%** first-attempt real-email delivery with verified same-origin `/auth/confirm` and `/auth/reset` callbacks.
3. **Cleanup & Owner UAT:** Clean up all synthetic DEV users and Stripe sandbox test customers/clocks; owner completes `MANUAL-UAT-CHECKLIST.md` before any `dev` -> `main` release PR.
