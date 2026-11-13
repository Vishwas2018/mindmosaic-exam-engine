# Paywall Enforcement Specification & Price-Drift Audit

**Branch:** `docs/monetisation-readiness`  
**Status:** Architecture Specification (No Code Modifications in this Branch)  
**Date:** October 2026  
**Audience:** Core Engineering, Product Lead, Systems Architect  

---

## 1. Executive Summary & Paywall Truth Today

### 1.1 Configuration & Default Posture
The billing enforcement flag is controlled by `BILLING_ENFORCEMENT_ENABLED` in `src/features/billing/config.ts`:

```typescript
export function isBillingEnforcementEnabled(): boolean {
  return process.env.BILLING_ENFORCEMENT_ENABLED === "true";
}
```

* **Current Default:** `false` (disabled). In both local development, CI, and production deployment environments, `BILLING_ENFORCEMENT_ENABLED` is either empty or unset.
* **Effect when OFF:** Billing enforcement is completely disabled across the application. All signed-in parents and students have unrestricted access to all features, regardless of whether they have a trial, an active subscription, or an expired status.
* **Effect when ON (`BILLING_ENFORCEMENT_ENABLED="true"`):**
  * Billing is currently checked **only** at the Next.js Layout layer for page navigations:
    * `src/app/parent/layout.tsx` (calls `requireActiveSubscription(userId, "parent")`)
    * `src/app/student/layout.tsx` (calls `requireActiveSubscription(userId, "student")`)
  * **Critical Architectural Gap:** **Zero API routes, Route Handlers, or Server Actions enforce billing entitlement today.** A signed-in user or student whose trial has expired is blocked from loading the dashboard in their browser, but any direct API call (`POST /api/exam/session`, `POST /api/exam/session/[id]/submit`, `POST /api/parent/children`, etc.) or navigation to non-layout-gated pages (`/exam`, `/results`) succeeds unhindered.

### 1.2 Entitlement Functions in the Database
The database provides two authoritative SQL entitlement functions in `supabase/migrations/20260720100000_subscriptions.sql`:

1. `public.has_active_access(p uuid)`:
   ```sql
   select exists (
     select 1
     from public.subscriptions s
     where s.parent_id = p
       and (
         (s.status = 'trialing' and s.trial_end > now())
         or (s.status in ('active', 'past_due') and s.current_period_end > now())
       )
   );
   ```
2. `public.current_parent_has_access()`:
   ```sql
   select public.has_active_access(auth.uid());
   ```

* **Key finding:** These functions are **NOT** referenced in any Row Level Security (RLS) policy in the database. All table access policies (`exam_sessions`, `exam_attempts`, `parent_children`, `profiles`, etc.) check authentication and ownership (`auth.uid()`), but never entitlement.
* Therefore, entitlement enforcement currently rests 100% on application-tier logic.

### 1.3 Guest Access Guarantee
* **Standing Rule:** Per `docs/PRIVACY_AND_BILLING_GUARDRAILS.md` §Payments: *"Billing status determines feature access (e.g. which roles/seats are active) but must never gate whether a **guest** can practise — the guests-allowed decision applies regardless of billing state."*
* **Verification:** Guest practice operates entirely client-side via `/practice/**` and fetches static question data from `GET /api/exam/guest-bank`. Guests have no user record, no profile row, no JWT, and no database persistence. Guest practice **never** touches `requireActiveSubscription` or database session RPCs, ensuring guests are **never** accidentally gated by billing.

---

## 2. Complete Codebase Trace: Entitlement Check Status

Below is the exhaustive trace of every Server Action, Route Handler, API Endpoint, and Layout across the MindMosaic codebase:

| Endpoint / Component | Type | Current Auth & Role Gate | Entitlement Check (`has_active_access`) | Gated Today? | Action Required for Paywall Enforcement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/app/parent/layout.tsx` | Layout | `requireRole(["parent"])` | `requireActiveSubscription(userId, "parent")` | **YES** (Only when flag ON) | None (UI redirect to `/billing` works as intended). |
| `src/app/student/layout.tsx` | Layout | `requireRole(["student"])` | `requireActiveSubscription(userId, "student")` | **YES** (Only when flag ON) | None (UI redirect to `/billing` works as intended). |
| `src/app/exam/layout.tsx` | Layout | None (reads client state) | None | **NO** | Add student entitlement check before rendering active exam view. |
| `src/app/results/layout.tsx` | Layout | None | None | **NO** | Add student entitlement check (or allow read-only viewing of past attempts). |
| `src/app/billing/layout.tsx` | Layout | `requireRole(["parent", "student"])` | Explicitly bypassed | **NO** | Correctly exempt (parents need access to `/billing` to subscribe). |
| `POST /api/exam/session` | Route Handler | Auth + `role === "student"` | **NONE** | **NO (VULNERABLE)** | **MUST GATE**: Block session creation if linked parent has no active access. Return `402 Payment Required`. |
| `GET /api/exam/session/active` | Route Handler | Auth (`auth.getUser()`) | **NONE** | **NO (VULNERABLE)** | **MUST GATE**: Block active sitting retrieval if no active access. |
| `GET /api/exam/session/[id]` | Route Handler | Auth (`auth.getUser()`) | **NONE** | **NO (VULNERABLE)** | **MUST GATE**: Block paper item retrieval if no active access. |
| `POST /api/exam/session/[id]/responses` | Route Handler | Auth + session student check | **NONE** | **NO** | **FAIL-SOFT EXEMPTION**: Allow in-flight autosave to save without blocking; gate at session start and submission. |
| `POST /api/exam/session/[id]/submit` | Route Handler | Auth + session student check | **NONE** | **NO (VULNERABLE)** | **MUST GATE**: Block exam scoring and attempt recording if no active access (or score and hold result). |
| `GET /api/exam/guest-bank` | Route Handler | Public (`force-static`) | **NONE** | **NO (INTENTIONAL)** | **DO NOT GATE**: Required for guest practice. Must remain public and unauthenticated. |
| `POST /api/parent/children` | Route Handler | Origin check + `provisionChild` | **NONE** | **NO (VULNERABLE)** | **MUST GATE**: Block provisioning new child accounts if parent has no active subscription. |
| `PATCH /api/parent/children/[childId]` | Route Handler | Auth + parent link check | **NONE** | **NO** | **DECISION**: Allow profile updates for existing children, or gate behind active subscription. |
| `DELETE /api/parent/children/[childId]` | Route Handler | Auth + parent link check | **NONE** | **NO** | **DO NOT GATE**: Always allow parents to unlink/archive children, even if subscription has lapsed. |
| `POST /api/student/onboarding/complete` | Route Handler | Auth + `role === "student"` | **NONE** | **NO (VULNERABLE)** | **MUST GATE**: Creating baseline diagnostic session and attempt requires active entitlement. |
| `POST /api/student/onboarding/preferences` | Route Handler | Auth + `role === "student"` | **NONE** | **NO** | Safe to allow onboarding preferences to persist. |
| `GET /api/student/onboarding/questions` | Route Handler | Auth + `role === "student"` | **NONE** | **NO** | Safe or gate alongside onboarding warmup. |
| `POST /api/teacher/assignments` | Route Handler | Auth + `role === "teacher"` | **NONE** | **NO** | Teacher / School institutional tier is separate from Family subscription. |
| `POST /api/teacher/marking` | Route Handler | Auth + `role === "teacher"` | **NONE** | **NO** | Teacher marking workflow is separate from Family subscription. |
| `fetchAttemptHistory` (Server Action) | Server Action | Auth (`auth.getUser()`) | **NONE** | **NO** | Allow students/parents to view historical results or gate. |
| `fetchResultsHistory` (Server Action) | Server Action | Auth (`auth.getUser()`) | **NONE** | **NO** | Allow comparison stats or gate. |
| `provisionChild` (Server Action) | Server Action | Auth + `role === "parent"` | **NONE** | **NO (VULNERABLE)** | **MUST GATE**: Check `current_parent_has_access` before creating `auth.users` row and `parent_children` link. |
| `POST /api/stripe/checkout` | Route Handler | Auth + `role === "parent"` | Creates checkout session | **N/A** | Correctly exempt (entry point to billing). |
| `POST /api/stripe/portal` | Route Handler | Auth + `role === "parent"` | Accesses Stripe customer | **N/A** | Correctly exempt (self-service billing portal). |
| `POST /api/stripe/webhook` | Route Handler | Stripe signature verification | Processes webhook events | **N/A** | Correctly exempt (trusted webhook processor). |
| `GET /api/stripe/status` | Route Handler | Auth + `role === "parent"` | Reads live subscription | **N/A** | Correctly exempt (parent billing status display). |
| `GET /api/stripe/invoices` | Route Handler | Auth + `role === "parent"` | Reads customer invoices | **N/A** | Correctly exempt (parent billing history). |
| `GET /api/stripe/payment-method` | Route Handler | Auth + `role === "parent"` | Reads default payment method | **N/A** | Correctly exempt (parent payment method). |
| `POST /api/stripe/cancel` | Route Handler | Auth + `role === "parent"` | Requests cancellation | **N/A** | Correctly exempt (cancellation must always be possible). |
| `POST /api/stripe/resume` | Route Handler | Auth + `role === "parent"` | Resumes subscription | **N/A** | Correctly exempt (subscription reactivation). |

---

## 3. Server-Side Paywall Enforcement Specification

### 3.1 Principles
1. **Never Rely on Client Layout Gating Alone:** Layout gating only stops browser URL transitions. Any scripted client or curl command can hit API endpoints. Every state-altering or content-serving endpoint must enforce entitlement independently.
2. **Fail-Closed on Unsubscribed API Access:** Unsubscribed requests to paid endpoints must fail with `402 Payment Required` (or `403 Forbidden` with a machine-readable error code).
3. **Fail-Safe Mid-Exam:** If a parent's subscription expires during an active student exam, autosave (`POST /api/exam/session/[id]/responses`) should continue to accept responses until the session expires, avoiding distressing data loss for the child. The gate should be evaluated strictly at **session creation** (`POST /api/exam/session`) and **session submission** (`POST /api/exam/session/[id]/submit`).
4. **Preserve Guest Practice Completely:** Guest endpoints (`/api/exam/guest-bank`, `/practice/**`) must have no billing dependencies.

### 3.2 Proposed Server-Side Helper: `requireActiveSubscriptionApi`
Create a centralized server helper `src/features/billing/require-active-subscription-api.ts`:

```typescript
import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBillingEnforcementEnabled } from "./config";

export type ApiEntitlementResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse };

/**
 * Validates billing entitlement for API route handlers.
 * When BILLING_ENFORCEMENT_ENABLED is false, allows all authenticated requests.
 * When enabled, checks current_parent_has_access (for parents) or
 * has_active_access for any linked parent (for students).
 */
export async function requireActiveSubscriptionApi(
  userId: string,
  role: "parent" | "student"
): Promise<ApiEntitlementResult> {
  if (!isBillingEnforcementEnabled()) {
    return { allowed: true };
  }

  const supabase = await createClient();

  if (role === "parent") {
    const { data: hasAccess, error } = await supabase.rpc("current_parent_has_access");
    if (error || !hasAccess) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: "subscription_required",
            message: "An active subscription is required to perform this action.",
            redirectUrl: "/billing",
          },
          { status: 402 }
        ),
      };
    }
    return { allowed: true };
  }

  // Student role: check if at least one linked parent has active access
  const { data: links } = await supabase
    .from("parent_children")
    .select("parent_id")
    .eq("child_id", userId);

  for (const link of (links ?? []) as { parent_id: string }[]) {
    const { data: hasAccess } = await supabase.rpc("has_active_access", { p: link.parent_id });
    if (hasAccess) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    response: NextResponse.json(
      {
        error: "subscription_required",
        message: "An active family subscription is required to practice exams.",
        redirectUrl: "/billing",
      },
      { status: 402 }
    ),
  };
}
```

### 3.3 Endpoint Integration Specifications

#### 1. `POST /api/exam/session` (Session Creation)
* **Location:** Immediately after verifying `profile?.role === "student"` (around line 100).
* **Code to add:**
  ```typescript
  const entitlement = await requireActiveSubscriptionApi(user.id, "student");
  if (!entitlement.allowed) {
    return entitlement.response;
  }
  ```
* **Payload returned on rejection:** HTTP 402 with `{ error: "subscription_required", redirectUrl: "/billing" }`.

#### 2. `POST /api/exam/session/[id]/submit` (Session Submission)
* **Location:** After verifying user identity and sitting origin.
* **Code to add:**
  ```typescript
  const entitlement = await requireActiveSubscriptionApi(user.id, "student");
  if (!entitlement.allowed) {
    return entitlement.response;
  }
  ```

#### 3. `src/features/auth/provision-child.ts` (Child Provisioning Action)
* **Location:** Inside `provisionChild` after checking `requesterProfile?.role !== "parent"`.
* **Code to add:**
  ```typescript
  if (isBillingEnforcementEnabled()) {
    const { data: hasAccess } = await requesterClient.rpc("current_parent_has_access");
    if (!hasAccess) {
      return {
        ok: false,
        message: "An active subscription or free trial is required to add new student accounts.",
      };
    }
  }
  ```
* **Seat Limit Enforcement:** Check existing child count:
  ```typescript
  if (childIds.length >= FAMILY_PLAN.maxChildren) {
    return {
      ok: false,
      message: `The Family plan includes up to ${FAMILY_PLAN.maxChildren} student profiles. Please upgrade or manage existing profiles.`,
    };
  }
  ```

#### 4. `POST /api/student/onboarding/complete` (Diagnostic Warmup)
* **Location:** After verifying `profile?.role === "student"`.
* **Code to add:**
  ```typescript
  const entitlement = await requireActiveSubscriptionApi(user.id, "student");
  if (!entitlement.allowed) {
    return entitlement.response;
  }
  ```

---

## 4. Price-Drift Protection Specification

### 4.1 Current Architecture & Vulnerability
In `src/lib/billing/prices.ts`:
* Hardcoded display values:
  * `monthly`: `amount: 14.99`, `display: "A$14.99"`, `period: "/mo"`
  * `annual`: `amount: 149`, `display: "A$149"`, `period: "/yr"`
  * `CURRENCY = "AUD"`
* In `src/lib/stripe/config.ts`:
  * `STRIPE_PRICE_FAMILY_MONTHLY`
  * `STRIPE_PRICE_FAMILY_ANNUAL`
* In Stripe Dashboard:
  * Stripe Price objects have their own `unit_amount` (e.g. 1499), `currency` (`aud`), `recurring.interval` (`month` / `year`), and `tax_behavior` (`inclusive`).

**The Risk:** If someone edits Stripe Dashboard prices or modifies `prices.ts` without synchronizing the other, the website displays `A$14.99/mo` while Stripe Checkout charges a different amount or currency (e.g. $19.99 USD + GST). Under the Australian Consumer Law (ACL), displaying one price and charging another constitutes misleading or deceptive conduct (Competition and Consumer Act 2010 (Cth) Schedule 2, s 18 & s 29).

### 4.2 Proposed Automated Verification Check

Create `scripts/billing/verify-stripe-prices.ts` to execute in CI and optionally during production container startup:

```typescript
import Stripe from "stripe";
import { FAMILY_PLAN, CURRENCY } from "../../src/lib/billing/prices";

async function verifyStripePrices() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const monthlyPriceId = process.env.STRIPE_PRICE_FAMILY_MONTHLY;
  const annualPriceId = process.env.STRIPE_PRICE_FAMILY_ANNUAL;

  if (!secretKey) {
    console.error("FATAL: STRIPE_SECRET_KEY is missing.");
    process.exit(1);
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  const checks = [
    {
      id: monthlyPriceId,
      name: "Monthly Family Plan",
      expectedCents: Math.round(FAMILY_PLAN.monthly.amount * 100), // 1499
      expectedInterval: "month",
    },
    {
      id: annualPriceId,
      name: "Annual Family Plan",
      expectedCents: Math.round(FAMILY_PLAN.annual.amount * 100), // 14900
      expectedInterval: "year",
    },
  ];

  for (const check of checks) {
    if (!check.id) {
      throw new Error(`Missing price ID env var for ${check.name}`);
    }
    const price = await stripe.prices.retrieve(check.id);

    if (price.currency.toUpperCase() !== CURRENCY) {
      throw new Error(
        `Price ${check.id} currency mismatch: Stripe has ${price.currency}, app requires ${CURRENCY}`
      );
    }
    if (price.unit_amount !== check.expectedCents) {
      throw new Error(
        `Price ${check.id} amount mismatch: Stripe charges ${price.unit_amount} cents, prices.ts displays ${check.expectedCents} cents`
      );
    }
    if (price.recurring?.interval !== check.expectedInterval) {
      throw new Error(
        `Price ${check.id} interval mismatch: Stripe has ${price.recurring?.interval}, app requires ${check.expectedInterval}`
      );
    }
    if (!price.active) {
      throw new Error(`Price ${check.id} is inactive in Stripe.`);
    }
  }

  console.log("PASS: Stripe price IDs match application display prices exactly.");
}

verifyStripePrices().catch((err) => {
  console.error("PRICE DRIFT DETECTED:", err.message);
  process.exit(1);
});
```

### 4.3 CI Gate Recommendation
Add `npm run check:prices` to `package.json` and run it in the deployment pipeline prior to flipping `FAMILY_PLAN_AVAILABILITY` from `"roadmap"` to `"purchasable"`.
