# Test results: DEV family beta release candidate

Release candidate: **`5c69c65f`** on `integration/dev-beta-completion` (PR #124), based on `dev` `100287e7`.
Later commits on the branch change docs only.

## Hosted browser acceptance (real Chromium against the deployed Preview)

- Preview `mindmosaic-exam-engine-eop3ykuoo-vishwas2018s-projects.vercel.app`, deployment
  `dpl_JCUdWoP4Lttnue3CyiLK6zKNyXFn`, commit `5c69c65f`, bound to DEV `mfglzabnayacssgertat` (accounts created through
  its UI are found on DEV by the service role).
- Command: `node scripts/hosted-acceptance/run.mjs <preview> --env <.env.local> -- a-parent b-c-student d-security e-responsive g-content`
- Run `rmwgde1po`, 2026-11-14: **14 passed, 0 failed, 1 skipped, 0 retries** (retries are disabled in the hosted config).
- Evidence (screenshots, PDFs, attempt rows, isolation evidence JSON): `test-results/hosted/rmwgde1po/` on the
  operator machine (not committed: it holds synthetic credentials).

| Scenario | Viewports | Result | What it proves |
|----------|-----------|--------|----------------|
| A1–A2 registration + confirmation | 1440 | **Passed** on `3fc807b4` (Preview `2vabi48g3`); **skipped** on the RC | Form sign-up creates an unconfirmed parent; sign-in before confirming refused; confirmation link signs in to `/parent`. Skipped on the RC because DEV Auth allows about one confirmation email an hour (D-025). The link was minted by the service role for that same account; inbox delivery is not verified |
| A3–A11 | 1440 | Passed | Parent sign-in; add child with parent-chosen PIN; code + PIN shown once; persisted after reload; sign-in card shows the real code, never the PIN, prints alone (PDF); sign out; guard; sign back in; child still linked |
| B1–B2 | 1440 | Passed | Wrong PIN and unknown code give one generic message; correct code + PIN reach My Space; `/parent`, `/admin` refused to a student |
| B3–B8 + C | 1440 | Passed | Practice Studio reachable; timed NAPLAN Y3 paper; mixed answer kinds; palette navigation keeps answers; autosave acknowledged; reload resumes with answers and flag; submit; **marks and % on screen equal the stored attempt** (exactly one row, owned by the child); review shows explanations; submitted paper cannot be reopened; sign out/in; history; parent sees the child, the progress page (evidence threshold respected) and the paper's marks; no build notes, raw skill ids or invented time limit |
| D | 1440 | Passed | Two families. Parent B: A's child pages 404, PATCH 404, PostgREST 0 rows. Student B on A's session: read/autosave/submit 404 with well-formed bodies; A's attempt unchanged; PostgREST 0 rows. Legacy RPCs with real signatures: 403 `42501`; no forged row. Student checkout refused; `/billing` shows a child no plan. Anonymous: protected routes redirect; session create 401; PostgREST 401 |
| E | 1440, 834, 390 | Passed (9 tests) | Student sign-in (keyboard PIN entry, visible focus), My Space, Practice Studio, programme setup, results, My Progress, Learning Hub; parent sign-in, home, children, account, help, child progress, paper result; exam runner, submit dialog, results after submit. Each: no horizontal scroll, no serious/critical axe violation, 44 px targets on touch viewports |
| G | 1440 | Passed | `/practice` lists NAPLAN numeracy Y3 (36) and Y5 (41) only; reading, language, ICAS withdrawn; a withdrawn programme 404s |

## Hosted API acceptance (independent scoring oracle)

- Preview `oozgz3zzf` (`8f68b771`; the RC differs only by removing one illustrative Exam Centre panel).
- `score-e2e-preview-approved.cjs` (copy of the 66-check script with one NAPLAN form and no ICAS, because ICAS is
  withdrawn and approved content cannot fill three disjoint 36-item forms): **21/21 passed**. Pool integrity, create
  (36 unique), oracle coverage 100%, no answer-key leak, autosave, resume, forged client score ignored, per-question
  status equals the oracle, totals 20/10/6 marks 20/36, % consistent, single persisted attempt, resubmit 409,
  post-submit autosave 409, history, ISO-SUBMIT/AUTOSAVE/READ 404, ISO-RLS 0 rows, ANON-RLS 401, FORGE-RPC 403 `42501`.
- The unmodified script on the same Preview: 6/13. All failures are the three-form NAPLAN and ICAS papers that
  approved-only content no longer serves (422 `insufficient_questions`), and the checks that depend on them. Expected
  after D-019; the single-form paper a child actually starts from `/exams` was verified in the browser.

## CI (GitHub Actions)

`4be46f87` (last fully finished run before the RC; RC CI recorded in the PR): core 442 files / **7,308 passed**;
rls 38 files / **607 passed** + 2 expected-fail; e2e-auth **93 passed, 0 skipped**; e2e **386 passed, 1 flaky**
(`landing-keyboard-focus.spec.ts` short-viewport chapter heading caught mid-fade; landing page untouched by this
branch; passes on `dev`'s run; D-034). scholarship-drafts passed.

## Local checks on the RC

`npm run typecheck` clean. ESLint: 0 errors on changed files. Vitest pages + components: 127 files / 962 passed.
`npm audit --omit=dev`: 0 vulnerabilities (dev-only tooling: 4 high, 9 moderate; SECURITY-REVIEW.md).

## Not run in this session

`npm run build` locally (Vercel builds every Preview; each RC build was READY), `validate:questions`,
`check:answers`, `questions:validate-ledger` locally (content unchanged by this branch; CI core covers the unit
equivalents). Design comparison against the Claude canvas exports was not done screen by screen.
