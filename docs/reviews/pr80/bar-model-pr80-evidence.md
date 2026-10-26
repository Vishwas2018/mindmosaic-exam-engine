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

## Preview and remaining requirements

From the existing worktree:

```powershell
npm run dev -- --port 3180
```

Open `http://localhost:3180/dev/bar-model`, choose a year, submit/reveal, finish and review. The session resets on reload. A production-build QA server or Vercel Preview requires `BAR_MODEL_PREVIEW_ENABLED=1` in the QA/Preview environment; real production refuses the route even with that flag. No remote environment was changed. A live production HTTP check also returned 404; it concerns the deployed revision, not a deployment of this branch.

Still required: independent human blind review, reconciliation of findings, genuine human sign-off/`approvedBy`, and the governed publication gates before any publication decision. Keep PR #80 draft; do not merge or publish content. Complete final-head CI and any local Windows intermittency should be assessed separately from human content approval.

Design contract: checked against `docs/design.md` v2.2; no unapproved deviations. Existing components, colours, typography and visual rendering are preserved.
