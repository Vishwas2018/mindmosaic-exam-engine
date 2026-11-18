# DEV readiness audit — 2026-11-18

Scope: DEV only. Baseline build: deployed DEV alias at `dcf81714` (origin/dev after #140). Fix build: PR #141 preview at
`b19df0f0`. Synthetic accounts only, created and removed by `scripts/hosted-acceptance` (my run ids only). No production
access, no content-approval change, no security-gate change, deployment protection untouched (the existing
automation bypass was used, read into memory, never printed).

States: **PASS** (observed, with evidence) · **FAIL** (observed failing) · **BLOCKED** (a prerequisite is unavailable; not
claimed either way).

## Verification gate (PR #141, commit `b19df0f0`)

| Check | Result | Evidence |
|-------|--------|----------|
| typecheck, lint (0 errors), validate:questions, check:answers --include-published (0 failures), questions:validate-ledger | PASS locally | local runs |
| Targeted regression tests MT-001…005 (208 tests across 8 files) | PASS locally | `programme-availability-alignment`, `results-timing-and-skill-labels`, `programme-badge`, updated landing/chapter-two/programmes suites |
| core (full unit suite + build), rls, e2e, e2e-auth, scholarship-drafts | PASS in GitHub CI, both the push and pull_request runs | PR #141 checks |
| Full unit suite, build, rls, e2e, e2e-auth run locally | BLOCKED locally | the host ran out of memory during the production build; CI is the evidence for these |

## Defects MT-001 … MT-005

| ID | Baseline `dcf81714` | PR preview `b19df0f0` |
|----|---------------------|-----------------------|
| MT-001 ICAS messaging contradicts the catalogue | FAIL (landing "Available now: … ICAS-style"; hosted spec H1) | PASS (H1). A second occurrence was found by the hosted spec on the first preview, `/programs/icas-style` "Available for Years 3 and 5", and fixed in `b19df0f0` |
| MT-002 AMC differs across surfaces | FAIL (H1 AMC) | PASS (H1) |
| MT-003 internal skill ids | FAIL in results (H3); runner clean on baseline in the sitting tested | PASS (H3); unit test also covers the runner, by-skill bars, drills, table, review |
| MT-004 untimed timing language | covered by unit tests; hosted H3 failed on MT-003 first, so the baseline hosted evidence for MT-004 is code and unit level only | PASS (H3, no "time was up" / "time limit"; "No time limit" present) |
| MT-005 AMC duplicates and counts | FAIL (`/exams` showed 2 Year 3 AMC cards) | PASS (H2: one module card per Year 3 and Year 5, badged; full paper withheld with reason; catalogue lists AMC once) |

## Hosted acceptance matrix

Baseline suite on `dcf81714`: 14 passed, 1 skipped. PR preview: first run 18 passed / 1 failed (MT-001 detail-page badge,
fixed); final run on `b19df0f0`: **19 passed, 1 skipped**. Desktop 1440, tablet 834, mobile 390.

| Area | Result | Notes |
|------|--------|-------|
| Parent: sign in, add child, sign-in card (real code, scoped print), sign out and in (A3–A11) | PASS | |
| Parent screens at desktop, tablet, mobile with accessibility checks (E) | PASS | |
| Student: wrong code / wrong PIN give one generic message; right credentials reach My Space (B1–B2) | PASS | |
| Scoring, autosave, resume, persistence: timed paper, answers kept after reload, marks on screen equal the stored attempt, review, history, parent view (B3–B8, C) | PASS | marks compared with the `exam_attempts` row read from DEV |
| Untimed sitting end to end (H3) | PASS on preview; FAIL on baseline | |
| Family isolation; role restrictions; student refused `/parent` and `/admin`; anonymous refused (D, B1) | PASS | |
| Exam runner and results review at three viewports with accessibility checks (E) | PASS | |
| Content governance: only approved programmes offered, with approved counts (G) | PASS | |
| Registration through the form and confirmation by mailed link (A1–A2, A0) | BLOCKED | needs an inbox the operator can read (`HOSTED_MAIL_BASE`); skipped, not claimed |
| Password / email recovery | BLOCKED | same prerequisite |
| Admin journeys (dashboard, papers, publication, writing, support) | BLOCKED | no admin credential available to this session; admin role elevation is not automated. Only the negative check (parent and student are refused `/admin`) ran: PASS |
| Vihaan pilot access restriction | BLOCKED | needs a Vihaan pilot account; the `VISHAAN_SCHOLARSHIP_PREP_*` variables exist only for branch `dev`, so a PR preview cannot show it either. Only the general check "Scholarship content is not offered to other accounts" is covered by G |
| Billing / Stripe | NOT RUN | free beta; out of scope for this pass |

## DEV database identity

| Claim | State | Evidence |
|-------|-------|----------|
| Browser code of the deployed app references only DEV project `mfglzabnayacssgertat` (13 scripts scanned; production ref `uermhsptduikehuyceiz` absent) | CONFIRMED | read-only fetch with the bypass, refs only printed |
| Server-side writes from the deployed app land in DEV | CONFIRMED by behaviour | the `exam_sessions` and `exam_attempts` rows created through the deployed app by the synthetic child exist in DEV (read with the DEV service role, which this tooling restricts to the DEV project) |
| The exact host of `EXAM_WRITE_DB_URL`, `SCORING_DB_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the Preview | UNVERIFIED | these are Vercel "sensitive" variables, unreadable by design. The behavioural result above is consistent with DEV and is the only evidence |
| Production isolation of these Preview variables | UNVERIFIED | production was not touched or inspected |

Observation, not asserted: `session_responses` returned no rows for the audit session after submission; autosave itself was
acknowledged (HTTP OK) and answers survived a reload in B3–C, so this is likely how responses are archived on submit, but
it was not investigated.

## Tooling notes

- Vercel MCP returned 403 for the team scope; the authenticated Vercel CLI was used read-only instead.
- The Chrome extension denied reads on the DEV host; Playwright with the existing automation bypass was used.
- `scripts/hosted-acceptance/cleanup.mjs` prints a libuv assertion at exit on Windows after finishing; deletions completed
  and were re-checked with a dry run (my run ids only).
- Reconciled the E2E framework: the existing hosted suite A–G needs no changes for current DEV. A1–A2/A0 stay mail-gated.
  New spec `e2e/hosted/h-programme-availability-and-labels.spec.ts` covers MT-001…005 and runs without an inbox.
