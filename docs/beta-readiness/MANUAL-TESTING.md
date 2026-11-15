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

## Reporting a problem

Note the URL, the account (parent / which child), what you expected and what happened, plus a screenshot.
Engineering logs it in DEFECT-REGISTER.md.

## Inviting a family (external beta only)

Not before the external-beta GO in READINESS.md. Then: create a Vercel shareable link for the `dev` alias, and
the family registers with their own email (needs custom SMTP).
