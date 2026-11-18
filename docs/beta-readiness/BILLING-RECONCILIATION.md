# Reconciling PR #124 with the uncommitted billing rewrite

Last updated 2026-11-15. The main checkout (`dev`) holds someone's uncommitted billing rewrite (pricing, plan
comparison, `purchasablePlans()`, ParentShell header on `/billing`, Family plan card removal). PR #124 was not
changed to accommodate it and the main checkout was not touched.

**PR #124 itself merges cleanly into `dev`** (GitHub: MERGEABLE/CLEAN; `dev` is still `100287e7`). The conflict appears
only when that rewrite is later committed on top of the merged `dev`.

## Full replay (scratch worktree, 2026-11-15, since removed)

The rewrite sits on the main checkout's local `dev` at **`17d8be2f`, which predates #123 (`100287e7`)**. Replaying
its 60 tracked changes (`git apply --3way`) onto PR #124's head conflicts in 9 files:

| Conflicts with | Files |
|----------------|-------|
| `dev` already (#123, merged) | `scripts/migrations/registry.ts`, `src/app/parent/{page,children/page,curriculum-explorer/page,writing/page}.tsx`, `ParentShell.tsx`, `parent-shell.test.tsx`, `parent-curriculum-explorer-page.test.tsx` (partly) |
| PR #124 | `src/app/billing/page.tsx`, `parent-curriculum-explorer-page.test.tsx` (partly) |

The rewrite also adds **two untracked database migrations**, `20261105090000_profile_programmes.sql` and
`20261106090000_individual_plans.sql` (new `profiles.programmes` column; `subscriptions.plan` gains `individual_*`).
Resolving it is therefore not a mechanical merge: it re-applies a pre-redesign parent shell over #119's workspace,
and it carries schema changes that need their own review and DEV approval. **Not done here**, on purpose: the rewrite
is someone else's unfinished work and not part of the beta (the beta deploys PR #124 → `dev`; billing is off).
Whoever owns it should rebase it onto `dev` after #124 merges, keep the two PR #124 rules below, and take the
migrations through the normal approval path. Nothing in the main checkout was modified.

## Trial merge of the overlapping files (base `100287e7`)

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
