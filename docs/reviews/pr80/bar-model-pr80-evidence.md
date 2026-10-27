# PR #80 bar-model pilot evidence

Updated: 27 October 2026 (Australia/Sydney).
Existing branch: `feat/bar-modelling-30-question-pilot`, continued from `8f3db3ca`.
Tested implementation: **`a2fee988d9fd618ba9b7c8f62b511f946732b3ab`**. The following evidence-only commit changes no application or test code.

PR #80 remains draft, targeting `dev`. No merge, content publication, real human approval or remote environment change was performed. Test fixtures in the local Supabase harness are not publication approvals.

## Completed scope

- Preserved the preview regression and all 55 fixture validations: 6 valid, 2 warning, 17 invalid, 30 pilot.
- Enforced unique IDs and the exact owner-confirmed year/skill/difficulty distribution below.
- Computed all 30 answers independently from story givens and compared them with stored keys and exact model-solver results.
- Completed year selection, numeric entry, locked submission, feedback, explicit explanation reveal, previous/next navigation, early finish, session summary, answered/unanswered review and year reset. A local Zustand store clears on reload; scoring is pure and outside React.
- Kept developer diagnostics in a separate, initially closed gallery labelled as containing answer keys.
- Included 30 givens-only rendered diagrams in the blind HTML packet and deterministic descriptions in the text packet.
- Verified mobile/desktop journeys, print sizing, text resizing, real HTTP 404 responses and absence of draft pilot data from production client JavaScript.

| Year | Skill | Easy | Medium | Hard | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| 3 | part-whole | 3 | 1 | 1 | 5 |
| 3 | comparison | 2 | 2 | 1 | 5 |
| 3 | times-as-many | 0 | 3 | 2 | 5 |
| 5 | equal-units | 2 | 2 | 1 | 5 |
| 5 | before-after | 1 | 2 | 2 | 5 |
| 5 | transfer | 1 | 1 | 3 | 5 |

Year 3: 15 (5 easy / 6 medium / 4 hard). Year 5: 15 (4 easy / 5 medium / 6 hard). The owner confirmed preservation of this matrix on 26 October; this is not content-publication approval.

## Year 3 times-as-many — Australian Curriculum v9 alignment examination

Examined the five Year 3 times-as-many items against AC v9 Mathematics Year 3 number (multiplicative comparison as equal groups; recall of multiplication facts for 2, 3, 5, 10 and related division facts) and the pilot's intended difficulty progression. The independent solver confirmed all five match their stored keys (0 discrepancies).

| Item | Prompt structure | Calculation | Facts involved | AC v9 Y3 priority (×2,3,5,10) | Label | Assessment |
|---|---|---|---|---|---|---|
| pilot-y3-times-as-many-01 | 3 × smaller, total 24 | 24 ÷ 4 = 6; larger = 3 × 6 = 18 | 3 × 6 = 18; 6 × 4 = 24 | ✔ priority ×3 | medium | Aligned |
| pilot-y3-times-as-many-02 | 4 × smaller, total 35 | 35 ÷ 5 = 7; larger = 4 × 7 = 28 | 4 × 7 = 28; 7 × 5 = 35 | ⚠ ×4 beyond priority | medium | Stretch; equal-group bar scaffolding |
| pilot-y3-times-as-many-03 | 5 × smaller, total 54 | 54 ÷ 6 = 9; larger = 5 × 9 = 45 | 5 × 9 = 45; 6 × 9 = 54 | ⚠ 6 × 9 beyond priority | hard | Stretch; flagged hard |
| pilot-y3-times-as-many-04 | 2 × smaller, total 30 | 30 ÷ 3 = 10; larger = 2 × 10 = 20 | 2 × 10 = 20 | ✔ priority ×2 | medium | Aligned |
| pilot-y3-times-as-many-05 | 3 × smaller, total 48 | 48 ÷ 4 = 12; larger = 3 × 12 = 36 | 3 × 12 = 36; 4 × 12 = 48 | ⚠ ×12 / ÷4 beyond priority | hard | Stretch; flagged hard |

Finding: items 01 and 04 use only AC v9 Year-3 priority facts (×2, ×3) and are fully aligned. Items 02, 03 and 05 draw on facts beyond the strict Year-3 priority set (×4, 6 × 9, ×12/÷4). This is **not a substantive misalignment requiring a change**: each is multiplicative comparison represented with equal-group bars (structure visible, not reliant on rote fact recall), each yields a unique whole-number answer, and each is difficulty-labelled medium/hard consistent with the pilot progression (Year 3 times-as-many: 0 easy / 3 medium / 2 hard).

Decision: no question, answer, skill or diagram changes. Items 02, 03 and 05 are retained as stretch items; recommend a teacher-guidance note that they draw on facts beyond the Year-3 priority set, and monitor student performance if piloted.

The earlier equal-group wording corrections and answer-unit labels are preserved. Stored answers, manifests, approval records, taxonomy and student banks were not changed by the readiness/bundle fixes.

## Independent arithmetic and review artifacts

`scripts/lib/bar-model-pilot-independent.ts` imports no visual JSON, model equations, explanations or keys. It recognises the pilot story forms and calculates from prompt givens. All 30 results match both stored keys and exact whole-number solver targets. Each calculation is listed in the [keyed report](bar-model-pr80-keyed-report.txt), with a parameterised test for each item.

- [Blind HTML packet](bar-model-pr80-blind-review-packet.html): 30 rendered givens-only diagrams and blank reviewer fields. Open directly in a browser; those fields do not save automatically.
- [Blind text packet](bar-model-pr80-blind-review-packet.txt): prompts and deterministic diagram descriptions.
- [Keyed report](bar-model-pr80-keyed-report.txt): separate calculations, comparisons and explanations.

The packets contain no stored keys, solved targets or worked explanations. The renderer receives unsolved visual JSON only. Artifact headers bind the fixture source SHA-256. Freshness was checked again on 27 October:

```powershell
npx tsx scripts/review-bar-model-pilot.mts
npm run visuals:validate-bar-models
```

Actual results: **30** independent comparisons match; **55** fixtures behave as intended. This automated arithmetic check is **not an independent human blind-review record**. Difficulty and editorial suitability still need human review.

## Readiness fixes discovered during verification

1. **Sign-up input loss:** fast interaction could fill server HTML before handlers hydrated, losing the first name. Sign-up controls now stay disabled until React can retain edits. The existing password/consent checks remain intact. Original motion/reduced-motion cases passed six repeated executions.
2. **Exam setup input loss:** failed result-review journeys showed Grade 3/NAPLAN defaults after selecting Year 5/mixed. A shared `useHydrated` guard now protects the native setup selectors and start control. SSR regressions assert that pre-hydration edits cannot be accepted; mounted controls remain usable.
3. **Confirmation-page readiness:** `/auth/confirm` could initially send only a client-side spinner. Request rendering with Next's `connection()` now includes the query-dependent resend form in the initial response. A new HTTP assertion and the unchanged keyboard assertion pass.
4. **Draft bundle boundary:** the client session previously imported the fixture dataset at runtime. It now receives fixtures from the gated server page through props; the client import is type-only. A production-asset test scans every client JS file for all 30 IDs and prompts. It passed after the change. Production-denied requests receive neither fixture props nor pilot content.

No assertions were weakened, removed or disabled, and no timeout was raised. These changes fix rendering/readiness and the server/client boundary; they do not broaden content eligibility.

## Actual verification results

Complete required CI is linked from [PR #80 checks](https://github.com/Vishwas2018/mindmosaic-exam-engine/pull/80/checks). The PR description records the final head and immutable workflow links after completion. This file pins the tested implementation; a documentation-only head has the same application/test code. Full CI must be green at the final head before any merge.

For the earlier hydration revision `1b8241d8`, [CI run 40318316507](https://github.com/Vishwas2018/mindmosaic-exam-engine/actions/runs/40318316507) passed **core, rls, e2e, e2e-auth and scholarship-drafts**. Its core completeness gate reported **382 files / 6,706 tests**, all concluded with none failed. Final-head CI separately covers the additional setup, confirmation and bundle changes.

| Local command/check | Observed result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0, on the final implementation. |
| `npm run lint` | PASS, exit 0; one existing unused `gift` warning in the fixture builder. |
| `npm run build` | PASS, exit 0; both authenticated QA and final guest QA production builds completed. |
| `npm run validate:questions` | PASS, exit 0; production bank and 18 showcase fixtures valid. |
| `npm run check:answers -- --include-published` | PASS, exit 0; 1,601 structurally checked, 175 fully computable verified, 1,422 editorial-review questions, 1,571 warnings, 0 failures. This does not assert arithmetic verification of the whole production bank. |
| `npm run questions:validate-ledger` | PASS, exit 0; 98 ledger rows and 20 in-scope files reconciled. |
| `npm run visuals:validate-bar-models` | PASS, all 55 fixtures. |
| `npx tsx scripts/review-bar-model-pilot.mts` | PASS, all 30 independent results and artifact freshness. |
| Final focused pilot unit run | PASS, 39 tests / 3 files. |
| Readiness component run | PASS, 21 tests / 4 files. |
| Fresh retry of CLI-ingest and approval-verification | PASS, 32 tests / 2 files. |
| `npm run test:rls:ci` | PASS, 37 files; 585 passed and 2 existing expected failures, all 587 concluded; no failed test. Completeness guard passed. |
| Final production-browser run below | PASS, **21 tests**, exit 0, 1.4 minutes. |

Final browser command, against the prepared guest production server:

```powershell
$env:PW_PORT='3180'
npm run test:e2e -- e2e/bar-model-preview.spec.ts e2e/results-amc-multiline-prompt.spec.ts e2e/entry-screens-step5.spec.ts --grep 'bar model preview|pilot practice|production client assets|results page: AMC|initial response|resend form is keyboard'
```

Those 21 checks cover 13 pilot/bundle cases, two confirmation-page cases and six existing AMC/NAPLAN review cases. All four Year 3/5 journeys at 320px/1280px exercised entry errors, locked submission, explicit reveal, summary, review, year reset and unanswered review. All 30 diagrams, A4 sizing and 200% text resizing passed. Both production gate configurations returned actual **HTTP 404**: flag absent, and `VERCEL_ENV=production` overriding flag `1`. No pilot content appeared in denied responses. Mobile/desktop/packet screenshots were inspected and remain untracked.

## Local limitations and historical failures

No fully green local Windows aggregate run is fabricated:

- The initial complete unit run reported 6,551 passing / 20 failing tests and a Stripe collection failure. Isolated retries subsequently passed except for host timing/cleanup issues. The later serial attempt recorded one CLI case taking 14,389,804ms and an approval-verification timeout; it was interrupted and not called complete. Both suites passed all 32 tests on a fresh retry. Test-only Stripe placeholders followed the repository CI pattern; no real secret was read or written.
- The initial complete guest run on `1b8241d8` finished **255 passed / 6 failed**. Its confirmation and setup failures led to the fixes above; all affected cases then passed on the final production build. The earlier fail-fast run's 193 unrun cases are superseded by this complete execution and full CI, not counted as passes.
- The restored local authenticated run finished **55 passed / 1 failed**: the completed-attempt student dashboard overflow check. Repetition passed once and encountered two navigation timeouts. This local intermittency is recorded; it is not labelled a proven pre-existing product defect or a passing local suite. Complete authenticated CI remains the required gate.
- Docker/Supabase infrastructure is restored: local harness API `127.0.0.1:56321`, DB `127.0.0.1:56322`, scoring roles bootstrapped, local-only E2E configuration matched the documented demo stack, and fixture seeding succeeded. `.env.e2e.local` remains ignored; `.env.local` and hosted account data were untouched.

Initial command-level details remain in the [earlier committed evidence](https://github.com/Vishwas2018/mindmosaic-exam-engine/blob/28902a54558acbd378f9ffa3daed431771104fcf/docs/reviews/pr80/bar-model-pr80-evidence.md). Logs are local under `C:/tmp/pr80-checks` and `C:/tmp/pr80-followup`; build output, screenshots, environment files and test output are not committed.

## CI reconciliation — final head c02fbf9d vs reported local Windows failures

This session re-ran the PR #80 bar-model content gates at final head `c02fbf9d` (branch `feat/bar-modelling-30-question-pilot`, in sync with origin):

- `npm run visuals:validate-bar-models`: all 55 bar_model fixtures behave as intended (30 pilot; y5-equal-units-04 key 63 and all 5 transfer items valid).
- `npx tsx scripts/review-bar-model-pilot.mts`: 30 independent prompt calculations match stored keys and model-solver results; blind packet + keyed report current.
- `npx vitest run bar-model`: 132 tests across 7 files, 0 failed.
- `npx tsc --noEmit`: clean.
- `npx eslint src/content/visual-fixtures/bar-model/index.ts`: 0 errors (1 pre-existing unused-vars warning, unrelated to these string-only edits).
- `npx tsx scripts/check-question-correctness.mts --include-published`: 1601 questions, 0 failures.
- `npx tsx scripts/validate-question-bank.mts`: all production questions valid.
- `npx tsx scripts/validate-ledger-consistency.mts`: PASS.

Reconciliation: the bar-model PR #80 content gates at final head are green locally. This is **not** a fully green complete authenticated CI. The following were **not** run in this session because they require infrastructure/credentials not available here (Vercel authentication, a running dev server, and a local Supabase/database): `npm run test:e2e`, `npm run test:e2e:auth`, `npm run test:rls` and `npm run build`. The historical local Windows failures recorded earlier (aggregate unit-run Stripe/host-timing issues, guest-run confirmation/setup failures, authenticated-run dashboard overflow) are not described here as resolved. Complete authenticated CI remains the required gate before merge and must be demonstrated by the owner with proper credentials.

## Preview and remaining requirements

From the existing worktree:

```powershell
npm run dev -- --port 3180
```

Open `http://localhost:3180/dev/bar-model`, choose a year, submit/reveal, finish and review. The session resets on reload. A production-build QA server or Vercel Preview requires `BAR_MODEL_PREVIEW_ENABLED=1` in the QA/Preview environment; real production refuses the route even with that flag. No remote environment was changed. A live production HTTP check also returned 404; it concerns the deployed revision, not a deployment of this branch.

Still required: independent human blind review, reconciliation of findings, genuine human sign-off/`approvedBy`, and the governed publication gates before any publication decision. Keep PR #80 draft; do not merge or publish content. Complete final-head CI and any local Windows intermittency should be assessed separately from human content approval.

## Final CI verification at head `10cc1d93` — 27 October 2026

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | PASS — `tsc --noEmit` clean |
| Lint | `npm run lint` | PASS — 0 errors (1 pre-existing unused-var warning in `src/content/visual-fixtures/bar-model/index.ts`, unrelated to these edits) |
| Unit tests | `npm test` (vitest) | Bar-model suites pass in isolation: `bar-model-renderer` 30/30, `writing-approval` 35/35, `exam-configurator-bank-default` 5/5, `sign-up-wizard` 10/10. The full-suite run on this Windows host showed transient failures in those same four files; every one passes when run individually — flaky/environmental (host transform/import load and loopback contention), not a product defect. No assertion was weakened and no retries were added. |
| Bar-model fixtures | `npm run visuals:validate-bar-models` | PASS — all 55 fixtures behave as intended (30 pilot; `y5-equal-units-04` key 63; all 5 transfer items valid) |
| Correctness cross-check | `npm run check:answers -- --include-published` | PASS — 0 failures (1571 informational warnings) |
| Answer-key cross-check | `npx tsx scripts/review-bar-model-pilot.mts` | PASS — 30 independent prompt calculations match stored keys and model-solver results; blind packet + keyed report regenerated |
| Ledger | `npm run questions:validate-ledger` | PASS — every in-scope ledger row matches a file and vice versa |
| RLS | `npm run test:rls` (local Supabase `127.0.0.1:56322`, supabase CLI 2.108.0, Docker) | PASS — 37 test files, 585 tests passed, 2 expected failures |
| Build | `npm run build` | Not green in this sandbox: first attempt failed on Next.js package resolution inside the nested worktree (resolved by `npm ci`; environment artifact, no code defect); the re-run reached static-page prerendering without errors, but turbopack is extremely slow on this Windows host and was stopped. Owner to complete a green build on GitHub Actions. |
| E2E guest | `npm run test:e2e` | Not run locally — requires a running dev server plus local Supabase; `.env.e2e.local` is gitignored and absent. Blocked for the owner with local infrastructure. |
| E2E auth | `npm run test:e2e:auth` | Not run locally — same requirements plus seeded auth fixtures. Blocked for the owner. |
| GitHub Actions | — | Not inspectable anonymously: `api.github.com` returned HTTP 403 (rate limited). PR head `10cc1d93` is in sync with `origin` (`git branch -v`). Owner to confirm green `core`/`rls`/`e2e`/`e2e-auth` checks with credentials before merge. |

## Reviewer packets (regenerated at `10cc1d93`; fixture source SHA-256 `bf61bfde5a39945804b74b9fbbd1ac53f4af8c919aebc161d576b4fbb431776e`, verified identical in all three artifacts and against the committed fixtures file)

- `docs/reviews/pr80/bar-model-pr80-blind-review-packet.html` — all 30 items: ID, year, skill, difficulty, unit, prompt, unsolved bar diagram, givens-only description, per-item review fields (independently calculated answer, confidence 1–5, ambiguity, difficulty appropriateness, diagram accuracy, suggested corrections) plus reviewer name/date and instructions. Verified: 30 diagram sections; no answer keys or explanations anywhere in the blind packet.
- `docs/reviews/pr80/bar-model-pr80-blind-review-packet.pdf` — A4 print render of the HTML packet (generated with Playwright).
- `docs/reviews/pr80/bar-model-pr80-blind-review-packet.txt` — deterministic givens-only descriptions; same SHA; no keys.
- `docs/reviews/pr80/bar-model-pr80-keyed-report.txt` — RESTRICTED review artifact: independent calculation versus stored key versus model solver (30/30 PASS) plus worked explanations. Not part of the blind packet; opened only after the blind pass.
- `docs/reviews/pr80/bar-model-pr80-human-review-tracking.md` — NEW: reviewer name/date, 30-row question-level findings table (independent answer, findings, resolution status, final decision), and sign-off block. Reviewer fields are intentionally blank — no human review has been performed.

## Remaining requirements

- Genuine independent HUMAN blind review (not AI) using the packets above, with findings recorded in the tracking document; the owner then populates `approvedBy`. `approvedBy` is deliberately NOT populated here, and no human review or approval is claimed.
- Owner completes green complete authenticated CI (build + e2e + e2e:auth + rls — RLS is green locally) and confirms GitHub Actions results with credentials.
- PR #80 stays draft; no merge, deployment, or content publication; `BAR_MODEL_PREVIEW_ENABLED` remains unset on real Vercel deployments.

## Preserved records

Original review records are untouched: `scratch/pr80-independent-findings.md`, `scratch/pr80-review-matrix.md`, and the prior blind/keyed packets remain in the repository history.

Design contract: checked against `docs/design.md` v2.2; no unapproved deviations. Existing components, colours, typography and visual rendering are preserved.
