# 02. Public Product Experience Audit

**Audit Date:** 26 August 2026  
**Auditor:** Antigravity  
**Classification:** `COMPLETE` / `POLISHED`

---

## 1. Global Header and Navigation (`src/features/landing/components/SiteNav.tsx`)

### Architecture & Verification
The global header is implemented as a client component with loading-state protection, active nested route detection, role-aware dashboard redirection, and accessible mobile drawer behavior.

```tsx
// Canonical public navigation structure in src/features/landing/content.ts
export const nav = {
  links: [
    { label: "Learning pathways", href: "/assessments" },
    { label: "How it works", href: "/methodology" },
    { label: "Plans", href: "/pricing" },
    { label: "Resources", href: "/help" },
    { label: "About", href: "/about" },
  ],
  signIn: { label: "Log in", href: "/sign-in" },
  cta: { label: "Start free", href: "/sign-up" },
};
```

### Visual & Interactive Behavior
* **Single-Row Layout:** Aligns with the `.mm-width` container (max 1440px width with fluid padding), logo on left, central navigation items, and right-aligned auth actions.
* **Approved Brand Palette:**
  - Background: Warm `#FCFBF8` (`--mm-page`)
  - Accent / Primary CTA: Coral `#FF5055` (`--mm-coral`) with `#18151F` text (5.75:1 contrast, WCAG AA compliant)
  - Wordmark Accent: Primary Purple `#5925A8` (`--mm-brand`)
  - Focus Ring: Purple 4px ring with 2px offset (`focus-visible:ring-4 focus-visible:ring-mm-brand/25`)
* **Active State:** Quiet bottom bar indicator (`shadow-[inset_0_-2px_0_var(--mm-coral)]`) on current and nested routes with `aria-current="page"`.
* **Flash Prevention:** When `status === "loading"`, an unobtrusive placeholder skeleton is rendered, preventing guest buttons from flashing before auth session resolves.
* **Authenticated State:** Displays role-aware **Dashboard** button (`roleHomePath(role)`) and **Sign out** action calling `signOut()` and `router.refresh()`.
* **Mobile Drawer (`#mm-mobile-nav`):**
  - Slides down smoothly below header with `aria-expanded` and `aria-controls`.
  - Enforces body scroll locking (`document.body.style.overflow = "hidden"`).
  - Automatically dismisses on `Escape` or when any link is clicked, restoring focus.

---

## 2. Landing Page Analysis (`src/app/page.tsx`)

The landing page is composed of modular semantic sections in `src/features/landing/components/`:

1. **Hero (`Hero.tsx`)**:
   - Clear value proposition: *"Know exactly what to practise next."*
   - Age/jurisdiction context: Australian Curriculum, NAPLAN (Years 3 & 5), ICAS, AMC, and Selective School preparation.
   - Dual CTA: "Start free trial" (Primary Coral) and "Explore sample questions" (Secondary Outline).
2. **Trust Mosaic (`Trust.tsx`)**:
   - 4 evidence-backed claims: 100% Original Questions, Australian English (`en-AU`), Instant Objective Scoring, and Progress Persistence.
3. **Quality Standards (`Quality.tsx`)**:
   - 10 published editorial standards (Grade-appropriate vocabulary, Single-concept testing, Step-by-step worked explanations, etc.).
4. **Programmes Grid (`Programmes.tsx`)**:
   - Live interactive cards for Year 3 & 5 NAPLAN/ICAS with real question counts.
   - Clear "Coming Soon" badges for Secondary Years and Olympiads.
5. **Showcase Visual Proof (`Showcase.tsx`)**:
   - High-fidelity interactive mockups of the testlet runner, scratchpad tool, worked explanations, and parent mastery rings.
6. **Plans & FAQ (`PlansFaq.tsx`)**:
   - Transparent pricing comparison with toggle between Monthly ($19/mo) and Annual ($180/yr).
   - Expandable accessible accordion for common parent questions.
7. **Closing Section (`Closing.tsx`)**:
   - Final CTA card with reassurance on cancellation policy and no lock-in contracts.

### Parent Evaluation Checklist

| Question | Assessment | Evidence |
| :--- | :--- | :--- |
| **1. What is MindMosaic?** | **YES** | Clear definition as an Australian online practice and diagnostic assessment platform. |
| **2. Who is it for?** | **YES** | Explicitly targeted at Australian primary & middle school students (Years 3 & 5 primary focus) and their parents. |
| **3. What assessments does it support?** | **YES** | NAPLAN, ICAS, AMC, Olympiads, Selective Schools, and Australian Curriculum. |
| **4. How does practice work?** | **YES** | Showcases instant-feedback practice mode and timed exam simulation. |
| **5. What happens after practice?** | **YES** | Demonstrates detailed score report, worked explanations, and parent mastery trends. |
| **6. Why is it different from generic question banks?** | **YES** | Highlights original Australian curriculum-aligned items, structured visuals, and diagnostic recommendations. |
| **7. What action to take next?** | **YES** | Prominent "Start free" and "Explore practice" CTAs on both desktop and mobile. |

---

## 3. Pricing, Plans & Stripe Subscription Integration

### Plan Offerings (`src/lib/billing/prices.ts`)

| Plan | Placeholder Price (AUD) | Trial Period | Features |
| :--- | :--- | :--- | :--- |
| **Family Monthly** | $19 / month | 14-day free trial | Up to 4 children, unlimited practice, full diagnostic reports, learning insights |
| **Family Annual** | $180 / year ($15/mo) | 14-day free trial | Same as monthly + 21% annual savings |

> **Note on Commercial Billing Readiness:** While Stripe checkout, webhooks, and customer portal handlers are implemented in code, `FAMILY_PLAN_AVAILABILITY` is currently set to `"roadmap"` in `src/lib/billing/prices.ts`. Pricing displayed is placeholder, legal terms remain drafts, and commercial billing is not currently enabled for live consumer purchases.

### Stripe Infrastructure Verification

* **Checkout (`src/app/api/stripe/checkout/route.ts`)**: Generates authenticated Stripe Checkout sessions with pre-filled customer email and trial end metadata.
* **Customer Portal (`src/app/api/stripe/portal/route.ts`)**: Redirects parents to Stripe Customer Portal for card updates, invoice downloads, and cancellations.
* **Webhooks (`src/app/api/stripe/webhook/route.ts`)**: Handles `customer.subscription.created`, `updated`, and `deleted` transactions, synchronizing state directly into the `subscriptions` table.
* **Entitlement Guard (`src/lib/billing/subscription.ts`)**: `getMySubscription()` checks `trial_end` and `current_period_end` timestamps to determine `hasAccess`.
