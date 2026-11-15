# Reconciling PR #124 with the uncommitted billing rewrite

Last updated 2026-11-15. The main checkout (`dev`) holds someone's uncommitted billing rewrite (pricing, plan
comparison, `purchasablePlans()`, ParentShell header on `/billing`, Family plan card removal). PR #124 was not
changed to accommodate it and the main checkout was not touched.

**PR #124 itself merges cleanly into `dev`** (GitHub: MERGEABLE; `dev` is still `100287e7`). The conflict appears
only when that rewrite is later committed on top of the merged `dev`.

## Trial merge (scratch copy, 2026-11-15)

Four files are changed by both. `git merge-file` against base `100287e7`:

| File | Result |
|------|--------|
| `src/app/billing/page.tsx` | 2 conflict hunks (below) |
| `src/tests/unit/parent-curriculum-explorer-page.test.tsx` | 1 hunk: the rewrite drops the Supabase client/server mocks that PR #124 added for the D-029 "404 unless the parent is linked" check. Keep PR #124's mocks |
| `src/app/globals.css`, `src/server/exam-bank.ts` | merge cleanly |

1. **Imports.** Keep both sides: PR #124's `isStripeConfigured` and the rewrite's `isProfileRole`,
   `purchasablePlans`, `ParentShell`. `createClient` is already imported on both sides.
2. **Start of `BillingPage()`.** PR #124 adds two early returns; the rewrite reformats `getMySubscription()` and
   adds `getViewerRole()`. Keep, in this order:
   - the rewrite's `getViewerRole()` call, moved to the top, and PR #124's **student block** keyed on
     `role === "student"` (one profile query instead of two): a signed-in child sees "This page is for grown-ups",
     never a plan or a price (`data-testid="billing-student"`);
   - `getMySubscription()` as the rewrite formats it;
   - PR #124's **free-beta block**: `if (!subscription && !isStripeConfigured)` → "The family beta is free"
     (`data-testid="billing-free-beta"`). If the rewrite's `purchasablePlans()` becomes the source of truth, the
     equivalent condition is "no subscription and no purchasable plan"; either way nothing is offered for sale
     while payments are off;
   - then the rewrite's role/availability logic and plan rendering unchanged.

The child rule is pinned by the hosted security spec (`e2e/hosted/d-security-isolation.spec.ts`: a student's
`/billing` shows no price, plan or checkout; `/api/stripe/checkout` refuses a student). After resolving, run
`npm run typecheck`, the billing unit tests, and the hosted scenario D on the Preview.
