# Manual testing on DEV

**URL:** https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app. This is always the latest `dev`
build. It is protected by Vercel SSO: open it in a browser signed in to the Vercel account that owns the project.
External families need a Vercel shareable link instead (see "Inviting a family" below).

Design references and screen-by-screen status: DESIGN-VERIFICATION.md.

Backend: DEV Supabase `mfglzabnayacssgertat` only. PROD is never touched.

## Accounts

Credentials are given to the owner outside the repo and are never committed. They are:

| Account | Sign in at | Notes |
|---------|------------|-------|
| Manual-test parent `mm-manual-parent@example.com` | `/sign-in` | Two children, Maya (Year 3) and Leo (Year 5). Seeded by `e2e/hosted/m-manual-test-family.spec.ts` (re-runnable; reuses the parent and resets its password). |
| Maya / Leo | `/student-sign-in` | Login code + 6-digit PIN issued by the app. If lost, reset the PIN from the parent's Children page. |
| Vihaan pilot | `/student-sign-in` | Only Vihaan's account and their parent see the Scholarship Prep pilot (`VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS`). |
| Admin | `/sign-in` → `/admin` | Fixture admin only. A personal admin account needs the owner (role elevation was not automated). |

`example.com` addresses cannot receive mail. To test registration, confirmation and password recovery yourself,
sign up with a real address you can read (the built-in sender is limited to a few emails an hour until custom SMTP
is on, see SMTP-RUNBOOK.md).

## What to try (about 45 minutes)

1. **Parent:** sign in → Family overview → Children (add a child, print a sign-in card, reset a PIN, archive
   and restore) → a child's Progress / Learning / Writing → Account → Help → sign out.
2. **Student (Maya, then Leo on a phone-width window):** code + PIN → My Space → Learning Hub (open a lesson) →
   Practice Studio (start a short untimed practice) → Exam Centre (start a timed paper, answer some questions,
   refresh mid-paper and confirm it resumes, submit) → My Results → review answers and explanations.
3. **Back as parent:** the finished paper shows under that child only. A verdict appears only after 2 papers and
   8 marks of evidence.
4. **Scholarship:** as Vihaan, `/student/vihaan` and the diagnostic. As any other student it must not appear.
5. **Billing:** `/billing` and Account → Billing say billing is off for the free beta. No card is asked for.
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
