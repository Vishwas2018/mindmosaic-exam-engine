# Design verification — deployed DEV, 2026-11-15

Build: `dev` **f7cfe8d0** (PR #130), deployment `dpl_HRhn725w2M5gc5PxsqCHkvDZ8yWt`, alias
https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app, DEV Supabase `mfglzabnayacssgertat`.

Source of truth: the Claude Design exports (`C:/tmp/wt-workspace-design-r1/docs/clean-screens` — Authentication 26,
Parent 35, Admin 27, Plan-Billing 7; `Downloads/MindMosaic — Student journey.html` — 14 student artboards).
Method: `scripts/visual-fidelity/shoot-designs.mjs` renders every artboard; `shoot-deployed.mjs` signs in as the real
manual-test parent and Maya (Year 3) on the deployed build and captures 37 routes at 1440 / 834 / 390. All **111**
captures returned 200 with **no horizontal overflow**. Before shots were taken on the same accounts before the change.

## Reported defects

| # | Defect | Fix | Evidence |
|---|--------|-----|----------|
| 1 | Create Family Account: duplicated grid, wrong proportions | One `AuthShell`; single-card form (artboards 05/09) | `/sign-up` panel 620px / card 420px at 1440, as designed |
| 2 | Shift when choosing Parent or Student | Chooser and form share one 420px column, top-aligned | — |
| 3 | Auth state lost via Terms/Privacy | Draft kept (never the password), legal pages open in a new tab, role kept in `?role=` | e2e "keeps name, email and consent after a trip to the Terms and back"; signed-in header verified on /terms, /privacy |
| 4 | Duplicate role-selection screens | One chooser at `/sign-in`; `/welcome` redirects | route log: `/welcome` → `/sign-in` |
| 5 | Shift switching Parent/Student tabs | Shake only after a failed submit, no remount, reserved form height | `layout-shift.mjs`: 0px at 1440/834/390 on `/sign-in` and `/student-sign-in` |
| 6 | Legacy parent screens | Shell, Family Overview, setup flow, Children, profile, tokens everywhere | screens below |
| 7 | Legacy student screens | Shell, My Space, Practice Studio heading, tokens everywhere | screens below |

## Screen by screen

Status: **Matches** = layout, hierarchy and styling follow the artboard; **Adapted** = follows the artboard except
where the design shows something the product cannot honestly do (reason given); **Styled** = design tokens applied,
layout predates the artboards; **Not verified** = no access.

| Area | Route | Artboard(s) | Status | Notes |
|------|-------|-------------|--------|-------|
| Auth | `/sign-in` | 01–03 Welcome | Matches | |
| Auth | `/sign-in?role=parent` | 04, 07, 08 | Adapted | Google/Apple shown only when configured (none on DEV) |
| Auth | `/student-sign-in` | 15–17 | Matches | PIN boxes ≥45px from 320px |
| Auth | `/sign-up` | 05, 09 | Adapted | Same OAuth rule; "NEEDS SIGN-OFF" canvas note not shipped |
| Auth | `/sign-in?mode=forgot`, `/auth/forgot` | 12, 14 | Matches | |
| Auth | `/auth/session-expired`, `/auth/account-paused`, `/auth/signed-out`, `/student-sign-in/help` | 18–20, 22 | Matches | Shared shell |
| Auth | `/switch-account` | 21 | Styled | |
| Parent | `/parent` | 06–10 | Matches | Weekly strip, side rail, inline add form removed as in the design |
| Parent | `/parent/setup` (new) | 01–03 | Adapted | "Email these to me" not built, so not shown |
| Parent | `/parent/children` | 11, 13–15 | Matches | Paid places only with a real plan |
| Parent | `/parent/children/[id]` | 12 | Adapted | Avatar colours kept; deletion behind "Deleting a profile" |
| Parent | `/parent/children/[id]/progress` | 16–20 | Styled | Empty state matches 19; full results view uses tokens |
| Parent | `/parent/children/[id]/learning` (+ preview) | 21–23 | Styled | Was 404 for every family; fixed |
| Parent | `/parent/account` | 24–25, 27 | Adapted | Free-beta plan; emails "not sent yet" rather than dead toggles |
| Parent | `/parent/account/billing` | 26 | Adapted | No payment controls while the beta is free |
| Parent | `/parent/help` | 28–30 | Styled | |
| Billing | `/billing` | Plan-Billing 01–07 | Adapted | Payments are off on DEV, so a parent is sent to 26; the 01–07 paid states are not reachable on DEV |
| Student | `/student` | My Space 01–09 | Adapted | "Why this set? — from your warm-up" not drawn: no warm-up record behind it |
| Student | `/student/practice` | Practice Studio 10–14 | Styled | Heading per 10; stepper and summary rail predate the artboard |
| Student | `/student/learn`, `/student/exam-preparation`, `/results`, `/student/engagement`, `/student/assignments`, `/student/writing` | — | Styled | No artboard in the exports |
| Admin | `/admin/*` | Admin 01–27 | Not verified | Needs an admin account on DEV (owner item) |

## Broken journeys found and fixed

- `/parent/children/[id]/learning` 404 for every real family (non-existent column); hard-coded "not written" and a
  fake "could not check" state replaced with gated-bank counts.
- Parent progress "Start an Exam Paper" sent a parent into the student exam runner.
- `/billing` offered card/invoice controls from a stored trial row with Stripe off, and listed "Parent dashboard" twice.
- Student chrome: invented "Term 3 · Week 4" / "Goal" chips, an inert bell, a disabled "Edit interests & goals".
- "Grade N" → "Year N" in parent, exam and results screens.

## Regression on the deployed build (f7cfe8d0)

| Check | Result |
|-------|--------|
| CI on PR head (core, rls, e2e, e2e-auth, scholarship-drafts) | Green both runs; 388 + 92 e2e passed, 0 skipped, 0 flaky |
| Hosted acceptance A–E, G (1440/834/390) | 14 passed, 3 skipped (mail-inbox steps: no custom SMTP) |
| Scoring and security API oracle | 21/21 (forged score ignored, isolation, RLS, RPC lockdown) |
| Visual capture, 37 routes × 3 widths | 111 / 111 status 200, 0 horizontal overflow |
| Synthetic data | Suite families removed (`cleanup.mjs --apply`); manual-test family kept |
