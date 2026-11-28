# Manual testing on DEV

**Build under test:** `dev` @ `003b102b` (PR #141), Vercel deployment `dpl_7CgmubJpEqEAFLR8EvkQzozmAzT5`.

**URL:** https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app. This is always the latest `dev`
build. It is protected by Vercel SSO: open it in a browser signed in to the Vercel account that owns the project.
External families need a Vercel shareable link instead (see "Inviting a family" below).

Tip: Use a normal window for the parent and a second browser profile / private window for the student, so the two
sessions don't share cookies.

Design references and screen-by-screen status: DESIGN-VERIFICATION.md.

Backend: DEV Supabase `mfglzabnayacssgertat` only. PROD is never touched.

## Accounts

Credentials are given to the owner outside the repo and are never committed. They are:

| Account | Sign in at | Notes |
|---------|------------|-------|
| Manual-test parent `mm-manual-parent@example.com` | `/sign-in` → "I'm a parent" | Two children, Maya (Year 3) and Leo (Year 5). Seeded by `e2e/hosted/m-manual-test-family.spec.ts` (re-runnable; reuses the parent and resets its password). |
| Maya (Year 3) / Leo (Year 5) | `/student-sign-in` | Login code + 6-digit PIN issued by the app. If lost, reset the PIN from the parent's Children page. |
| Vihaan pilot + linked parent | `/student-sign-in` / `/sign-in` | Only Vihaan's account and their parent see the Scholarship Prep pilot (`VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS`, 2 entries on `dev`). |
| Admin | `/sign-in` → `/admin` | Fixture admin only. A personal admin account needs the owner (role elevation was not automated). |
| New registration / password recovery | `/sign-up`, `/auth/forgot` | Needs a real inbox; `example.com` cannot receive mail. |

`example.com` addresses cannot receive mail. To test registration, confirmation and password recovery yourself,
sign up with a real address you can read (the built-in sender is limited to a few emails an hour until custom SMTP
is on, see SMTP-RUNBOOK.md).

No card is ever requested during the free beta. What `/billing` shows depends on whether Stripe is configured on the deployment: with Stripe unset it says "The family beta is free"; with Stripe keys set (as in CI) it shows the Family plan roadmap ("isn't open for subscriptions yet", "Register interest"). Both are correct; neither takes payment. Record which one you see.

## What to try (about 45 minutes)

1. **Parent:** sign in → Family overview → Children (add a child, print a sign-in card, reset a PIN, archive
   and restore) → a child's Progress / Learning / Writing → Account → Help → sign out.
2. **Student (Maya, then Leo on a phone-width window):** code + PIN → My Space → Learning Hub (open a lesson) →
   Practice Studio (start a short untimed practice) → Exam Centre (start a timed paper, answer some questions,
   refresh mid-paper and confirm it resumes, submit) → My Results → review answers and explanations.
3. **Back as parent:** the finished paper shows under that child only. A verdict appears only after 2 papers and
   8 marks of evidence.
4. **Scholarship:** as Vihaan, `/student/vihaan` and the diagnostic. As any other student it must not appear.
5. **Billing:** `/billing` and Account → Billing show either the free-beta notice or the Family plan roadmap (see top of this page). No card is asked for.
6. **Security spot checks:** a wrong PIN is refused. `/admin` as a parent or student is denied. Another family's
   child is never visible.

Only approved questions are served on deployed builds. If a programme shows "coming soon" or has few papers, that
is the content gate working, not a defect.

## What is open on DEV (as of `dcf81714`, approved content only)

Every public, parent and student screen must agree with this table. A surface that says more or less is a defect
(MT-001, MT-002, MT-005). The table comes from `getPatternReadiness()` and the practice catalogue under the enforced
gate; it changes only when human-approved content changes, so re-check it before a test round.

| Programme | Open to start | Not open |
|-----------|---------------|----------|
| NAPLAN-style | Numeracy, Year 3 (full paper, 36 questions) and Year 5 (shortened paper, 40 of 42) | Reading and Language Conventions, both years (0 approved); Writing |
| ICAS-style | nothing (0 approved items in every subject) | everything: it must read "in development" or "coming soon" everywhere, never "available" |
| AMC-style | Year 3 and Year 5 **practice modules** only (26 and 27 approved questions) | Full-length 30-question papers, other years |
| Scholarship-style | Vihaan pilot account only | everyone else |

Checks for the five manual-testing findings:

1. **ICAS (MT-001):** landing, Programs, Practice, Exam papers and a child's Exam Centre all say ICAS-style is not open yet.
2. **AMC (MT-002):** the same five places say AMC-style has Year 3 and 5 practice modules and no full-length papers yet.
3. **Skill names (MT-003):** in a practice or exam sitting and on the results page (by-skill bars, "Practise missed skills",
   breakdown table, answer review) skills read "Measurement: perimeter", never `num.prod.measurement.perimeter`.
4. **Untimed results (MT-004):** an untimed sitting says "No time limit — your time is recorded". It never says time
   "ran out" or "was up", and never mentions the real assessment's time limit. A timed sitting still does.
5. **AMC listings (MT-005):** Exam papers shows one AMC-style card per year, badged "Practice module — not a full-length
   paper", with a line saying the full paper is not open yet. Practice lists "Australian Maths Competition" once.

## Reporting a problem

Note the URL, the account (parent / which child), what you expected and what happened, plus a screenshot.
Engineering logs it in DEFECT-REGISTER.md.

## Inviting a family (external beta only)

Not before the external-beta GO in READINESS.md. Then: create a Vercel shareable link for the `dev` alias, and
the family registers with their own email (needs custom SMTP).

## Scenarios and expected results (structured checklist)

### Parent (`mm-manual-parent`)
| # | Do | Expect |
|---|----|--------|
| P1 | Sign in | Lands on Family overview; Maya and Leo shown; no other family's children |
| P2 | Children → add a child (Year 3) | Profile created; sign-in card shows a login code + PIN; print view shows only that child |
| P3 | Reset a PIN; archive then restore the new child | New PIN shown once; archived child cannot sign in; restored child can |
| P4 | Open a child → Progress / Learning / Writing | Pages load; a verdict appears only after 2 papers and 8 marks of evidence |
| P5 | Account → Billing, `/billing` | Free-beta notice **or** Family plan roadmap with "Register interest"; never a card form or checkout |
| P6 | Visit `/admin`, `/parent/vihaan` | Redirected away (not admin; not the pilot family) |
| P7 | Sign out | Returned to public site; `/parent` asks to sign in |

### Student (Maya on desktop, Leo at phone width ≈390px)
| # | Do | Expect |
|---|----|--------|
| S1 | Wrong code, then wrong PIN | One generic "check your details" message for both (no hint which was wrong) |
| S2 | Correct code + PIN | My Space |
| S3 | Learning Hub → open a lesson | Lesson renders |
| S4 | Practice Studio → short **untimed** practice → submit | Skills read like "Measurement: perimeter", never `num.prod.…` (MT-003); results say "No time limit — your time is recorded", never "time was up" or a time limit (MT-004) |
| S5 | Exam Centre → NAPLAN Numeracy (Maya Y3 full, Leo Y5 shortened) → answer some → refresh mid-paper → submit | Paper resumes with answers kept; timer shown (timed); results + by-skill bars + review with explanations |
| S6 | Exam Centre / Exam papers → AMC | One card for the student's year, badged "Practice module — not a full-length paper", plus a line that the full paper is not open (MT-002, MT-005) |
| S7 | Look for ICAS anywhere | Never "available"; "in development" / "coming soon" (MT-001) |
| S8 | Visit `/parent`, `/admin`, `/student/vihaan` | Refused / redirected to `/student` |
| S9 | Back as parent | Finished paper appears under that child only |

### Vihaan pilot (owner-held account)
| # | Do | Expect |
|---|----|--------|
| V1 | As Vihaan: `/student/vihaan` → diagnostic → submit | Pilot hub and diagnostic load; attempt saved |
| V2 | As Vihaan's parent: `/parent/vihaan` | Pilot progress page for Vihaan |
| V3 | As Maya/Leo or `mm-manual-parent` | No pilot link; direct URLs redirect (covered by `e2e/hosted/v-vihaan-restriction.spec.ts`) |

### Admin (read-only)
| # | Do | Expect |
|---|----|--------|
| AD1 | `/admin` | Dashboard loads |
| AD2 | Papers, Questions, Review, Publication | Lists load; **do not approve, publish or withdraw anything** — content approvals are out of scope for this round |
| AD3 | Writing, Support, Activity, Analytics, Operations, Intelligence | Pages load without errors |

## Already verified automatically on `003b102b` (engineering-run, reproducible)

Hosted suite run `rmwm14v7l` on the DEV alias: **20 passed, 3 skipped** (A1–A2 and A0 need a real inbox; manual-family
seed is opt-in). Covers parent onboarding A3–A11, student sign-in B1–B2, timed paper scoring/autosave/resume/review
B3–B8 + C, family isolation and role restrictions D, responsive + accessibility at 1440/834/390 E, content governance G,
MT-001…005 H1–H3, and Vihaan restriction V (anonymous → `/sign-in` + API 401; non-pilot parent → `/parent`; non-pilot
student → `/student` for hub and diagnostic, API 403 `forbidden`). Synthetic accounts removed afterwards.

## Owner-reported manual verification on `003b102b` (2026-11-19) — NOT independently verified by engineering

> These results were reported by the owner-assisted session. Engineering has not reproduced them and they are not evidence for a readiness decision until re-run (see HOSTED verification in the audit follow-up).

Verified on DEV (`https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app`) across Desktop (`1440x900`) and iPad (`834x1194`):

| Area | Result | Notes |
|------|--------|-------|
| Vihaan student (`/student`, `/student/vihaan`, `/student/vihaan/diagnostic`, `/student/practice`, `/student/exam-preparation`, `/student/engagement`, `/results`) | **PASS** | 499-item bank (333 practice), diagnostic Q1/20, saved marks (`92%` avg, 4 finished sessions), 0 page/HTTP errors, 0 overflow. Minor copy note: `/results` shows `"1 questions"` for 1-question sittings. |
| Linked parent (`/parent`, `/parent/vihaan`, `/parent/children/.../progress`, `/parent/children`, `/parent/account`) | **PASS** | Progress matches Vihaan's student view (`4` finished papers, `23 of 24` marks earned, `4` awaiting marking, `2 papers and 8 marks` strand gate), 0 page/HTTP errors, 0 overflow. |
| Admin read-only (AD1–AD3: all 11 `/admin*` routes via ephemeral DEV admin, deleted immediately after) | **PASS (minor finding)** | 10/11 routes clean; `/admin/operations` (mock job data) logged React hydration error `#418` (text mismatch). |
| Registration, email verification & password recovery | **BLOCKED** | `/sign-up`, `/sign-in`, `/auth/forgot` UI forms render cleanly on Desktop & iPad; live email round-trip blocked without a readable inbox (`HOSTED_MAIL_BASE` unset; custom SMTP not yet enabled). |
