# Authenticated E2E baseline — 2026-09 student-portal repair

Real pass/fail data from `npm run test:e2e:auth` against a live local Supabase
stack (`supabase start`, `npm run e2e:seed`), captured **before** any fixes in
this repair, per this repair's own "baseline first, then write" rule. The
previous audit that identified this suite as broken was done statically
(Docker wasn't running); this is the ground truth that audit was missing.

## Environment

- Docker Desktop + `supabase start` (local stack, `project_id =
  "mindmosaic-rls-harness"`, matches `.env.e2e.local`'s committed example
  values)
- `npm run e2e:seed` — all 11 fixture identities created/reused successfully
- `npm run test:e2e:auth` — 1 worker, Chromium, production build

## Baseline result: 18 passed, 12 failed

| # | Spec | Failure | Cause |
|---|------|---------|-------|
| 1 | `a11y-student-dashboard.spec.ts` — `/student` heading | `getByRole("heading", {name: /do you want to study today\?/i})` not found | Stale: dashboard rewrite's real h1 is "Welcome back, {name}" |
| 2 | `a11y-student-dashboard.spec.ts` — `/student` touch targets | 10 elements under 44px (Choose another lesson, Enter Curriculum Hub, Launch NAPLAN Prep, Enter ICAS Arena, Close modal, Notify me when live, Back to dashboard, View My Progress, Review answers, Detailed breakdown) | Real regression: new dashboard components sized under the 44px minimum |
| 3-4 | `a11y-student-dashboard.spec.ts` — `/student/learn` touch targets | Browse recordings / Download PDF pack (237×16) | Real regression: LearningHubResourceStrips |
| 5 | `a11y-student-dashboard.spec.ts` — `/student/engagement` color-contrast | 11 nodes | Real regression: StudentSidebar tokens (only reachable once earlier viewport checks in the same test stop failing first) |
| 6 | `a11y-student-dashboard.spec.ts` — `/student/engagement` touch targets | Review answers (89×32) | Real regression: MyProgressSessionsTable |
| 7 | `a11y-student-dashboard.spec.ts` — "recent sessions" text | `getByText("Recent sessions")` not found | Stale: real heading is "Recent activity" |
| 8 | `a11y-student-dashboard.spec.ts` — mobile nav disclosure | `getByRole("button", {name: "Open menu"})` not found | Real regression: native `<details>/<summary>` wasn't exposed with an accessible "button" role by Chromium even with `aria-label` set |
| 9 | `a11y-student-dashboard.spec.ts` — desktop keyboard walkthrough | No visible focus indicator on "MindMosaic — Dashboard" | Real regression: sidebar logo link had `focus:outline-none` with no replacement |
| 10 | `assessment-capability-auth.spec.ts` | color-contrast on Results page (12 nodes) | **Pre-existing, unrelated** — confirmed via direct node diagnostic: `text-teal-accent` on `bg-teal-light/60` in `src/app/results/page.tsx`, a file this repair never touches |
| 11 | `role-access.smoke.spec.ts` — student title/text | Title `/Student home/`, text "No sessions yet"/"Recent sessions" not found | Stale: real title is "My Learning — Dashboard...", real empty/populated text differs |
| 12 | `student-exam-session.spec.ts` | Heading "Student sign in" not found on `/student-sign-in` | **Pre-existing, unrelated** — confirmed: that page's real `<h1>` is "Your code and PIN are all you need."; "Student sign in" is only the `eyebrow` label, never a heading-role element. Never touched by this repair. |

## Disposition

- Findings 1, 2-6 (touch targets, contrast), 7, 8, 9, 11: fixed. See
  `playwright-audit.md` for the final state and which were test fixes vs
  component fixes.
- Findings 10 and 12: confirmed pre-existing and unrelated to the student-
  portal rewrite (verified by reading the actual component source, not
  assumed) — left failing, out of scope for this repair per "do not touch
  unrelated code." Both are real bugs worth a separate fix.

## Final state after this repair

`npm run test:e2e:auth`: **28 passed, 2 failed** (findings 10 and 12 above,
both pre-existing/unrelated). Full command output available in this repair's
PR description.
