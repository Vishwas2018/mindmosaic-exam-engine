# PR #80 bar-model pilot evidence

Date: 26 October 2026 (Australia/Sydney).
Existing branch/worktree: `feat/bar-modelling-30-question-pilot`.
Continuation base: `8f3db3ca`. Tested implementation revision: `80cc2a30a0e8486c80b4dc1b3e28b53bc04769c6`.
The subsequent evidence-only commit does not change the tested implementation.
PR remains draft. No merge, content publication or human approval was performed.

## Implemented scope

- Preserved the preview diagnostics regression and validation of all 55 fixtures (6 valid, 2 warning, 17 invalid, 30 pilot).
- Exact distribution assertions, including unique IDs and every year/skill/difficulty cell. The owner confirmed preservation of this matrix on 26 October.
- Internal QA session: year selection, 15 questions per year, whole-number answer validation, locked submission, feedback, explicit explanation reveal, previous/next navigation, early finish, summary, answered/unanswered question review and year reset. State uses a local Zustand store and clears on reload. Scoring is pure and outside React.
- Developer diagnostics remain in a separate, initially closed gallery labelled as containing answer keys.
- Clarified equal-group wording for coin bundles and stick sets; corrected the inconsistent juice story to equal bottles containing cups of juice. Corrected the biscuits answer-unit label and generic group labels. Stored answers and the confirmed distribution are unchanged.
- No student bank, manifest, approval record, taxonomy or publication lifecycle was changed. This remains a gated QA simulation of unpublished fixtures.

| Year | Skill | Easy | Medium | Hard | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| 3 | part-whole | 3 | 1 | 1 | 5 |
| 3 | comparison | 2 | 2 | 1 | 5 |
| 3 | times-as-many | 0 | 3 | 2 | 5 |
| 5 | equal-units | 2 | 2 | 1 | 5 |
| 5 | before-after | 1 | 2 | 2 | 5 |
| 5 | transfer | 1 | 1 | 3 | 5 |

Year 3: 15 (5 easy / 6 medium / 4 hard). Year 5: 15 (4 easy / 5 medium / 6 hard).

## Independent arithmetic and blind packet

`scripts/lib/bar-model-pilot-independent.ts` computes answers from prompt givens alone. It accepts only the pilot story forms and imports neither model equations nor visual JSON, stored keys or explanations. All 30 computed answers match both stored keys and exact whole-number model-solver results. Each calculation and comparison is recorded in the [keyed report](bar-model-pr80-keyed-report.txt), with a separate parameterised regression for every item.

This is an independent arithmetic implementation, **not an independent human blind-review record**. Difficulty suitability and editorial quality still require human review.

- [Blind HTML packet with 30 rendered givens-only diagrams](bar-model-pr80-blind-review-packet.html): open directly in a browser; blank reviewer reasoning fields are not saved automatically.
- [Blind text packet with deterministic diagram descriptions](bar-model-pr80-blind-review-packet.txt).
- Neither packet contains keys, explanations or solved targets. The renderer receives only validated, unsolved visual JSON. Artifacts identify the fixture source SHA-256.

Reproduce and check freshness:

```powershell
npx tsx scripts/review-bar-model-pilot.mts --write
npx tsx scripts/review-bar-model-pilot.mts
npm run visuals:validate-bar-models
```

Actual result: `30 independent prompt calculations match stored keys and model-solver results; blind diagrams and reports are current.` Validation: `All 55 bar_model fixtures behave as intended (including the 30 pilot items).`

## Verification results

| Command/check | Actual result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0. Production build TypeScript also passed. |
| `npm run lint` | PASS, exit 0; one existing unused `gift` warning in the fixture builder. Changed-file lint also passed without findings. |
| `npm test -- --maxWorkers=1` | FAIL, exit 1: 362 files passed / 14 failed; 6,551 tests passed / 20 failed. Stripe failed during collection because `.env.local` is absent. Other failures include timeouts, subprocess exit/timeout assertions, cleanup `ENOTEMPTY`, a sign-up lookup and an admin boundary assertion. |
| `npm run build` | PASS, exit 0, including the final QA build. |
| `npm run validate:questions` | PASS, exit 0; production bank and 18 showcase fixtures valid. |
| `npm run check:answers -- --include-published` | PASS, exit 0; 1,601 structurally checked, 175 fully computable verified, 1,422 editorial-review questions, 1,571 warnings, 0 failures. This does not assert independent computation of the entire production bank. |
| `npm run questions:validate-ledger` | PASS, exit 0; 98 rows, 20 in-scope files reconciled. |
| `npm run test:rls` | BLOCKED/FAIL, exit 1: `ECONNREFUSED 127.0.0.1:56322`, 15 failures and an unexpected worker exit; not a complete run. Docker Linux engine pipe is absent (Docker Desktop is stopped). |
| `npm run test:e2e` | Initial startup failed at the 300,000ms web-server limit. Prepared-server rerun with `--max-failures=3`: exit 1, 65 passed / 3 failed / 193 unrun, 5.9 minutes. All 12 bar-model cases also passed within that broader run. |
| `npm run test:e2e:auth` | BLOCKED, exit 1 before tests: `NEXT_PUBLIC_SUPABASE_URL` missing from local-only E2E configuration. |
| Focused bar-model unit/component command below | PASS, 6 files / 111 tests, exit 0. Earlier concurrent render attempt timed out; isolated rerun passed. |
| `npm run test:e2e -- e2e/bar-model-preview.spec.ts` against prepared QA server | PASS, all 12 tests, exit 0, 1.9 minutes. |

The full unit failures occur outside the changed pilot files; they are **not** claimed to be baseline-proven pre-existing defects. An isolated rerun of `stripe-webhook-route`, `admin-draft-review`, `cli-questions-review-ai` and `sign-up-wizard` passed all 39 tests across 4 files. That rerun supplied test-only Stripe placeholders through the process environment (the same supported pattern as CI), without reading or writing real secrets. A rerun of the other 10 failed suites reported 8 files passing / 2 failing, 139 tests passing / 4 failing. Remaining failures are 5-second timeouts in `content-projection` and `originality-orchestration`, plus `ENOTEMPTY` during originality test cleanup. Neither rerun constitutes a green complete unit suite.

```powershell
npm test -- --run src/tests/unit/bar-model-pilot-fixtures.test.ts src/tests/unit/bar-model-pilot-session.test.ts src/tests/unit/bar-model-preview-gate.test.ts src/tests/unit/bar-model-fixtures.test.ts src/tests/unit/validate-question-bank-bar-model.test.ts src/tests/components/bar-model-renderer.test.tsx
```

The initial concurrent unit attempt was interrupted under host memory pressure. A repeat with `npm test -- --maxWorkers=1` was run without changing assertions. The initial guest E2E command failed before tests with `Timed out waiting 300000ms from config.webServer`. A separately prepared QA production build/server is used for the browser rerun; no test source or assertion is skipped for that workaround.

The initial unrestricted prepared-server guest attempt was interrupted after repeated authentication-page timeouts, then rerun with the explicit fail-fast limit. Its three final failures are: sign-in axe evaluation exceeds 30 seconds (`e2e/a11y-auth-pages.spec.ts:25`), and the two sign-up shake/reduced-motion tests time out clicking a disabled **Continue** button (`e2e/entry-screens-step5.spec.ts:121`, `:149`). These are not bar-model failures. The 193 unrun guest cases remain unverified in this continuation. Fail-fast is a runner limit, not a change to test assertions; it must not be mistaken for complete guest-suite coverage.

Raw logs and screenshots are local under `C:/tmp/pr80-checks` and Playwright's ignored output directory; they are not committed. These results do not assert green CI.

## HTTP and browser evidence

All 12 focused Chromium tests passed on the production QA build:

- All 30 diagrams and separate diagnostics at 320px and 1280px; no horizontal overflow.
- A4 print sizing and 200% text size at 320px; no overflow.
- Blind HTML packet: 30 rendered givens-only diagrams, 30 blank reviewer fields, target question mark present and no key/explanation fields.
- Full Year 3 and Year 5 journeys at both 320px and 1280px: invalid blank entry, submission, locked answers, incorrect/correct feedback, explicit explanation reveal, navigation, summary, review, year reset and unanswered review. Each completed session reports 14 correct / 1 deliberately incorrect / 0 unanswered; reset/early finish reports 15 unanswered.
- Same production build, flag absent: actual HTTP **404**, with no learner, diagnostic or pilot fixture content.
- Same production build, `VERCEL_ENV=production` plus preview flag `1`: actual HTTP **404**, with no pilot content.

Mobile, desktop and blind-packet screenshots were visually inspected. Test screenshots remain untracked.

QA server preparation (PowerShell):

```powershell
$env:CIRCLE_NODE_TOTAL='3' # limits build workers on this memory-constrained host
$env:SHOWCASE_ENABLED='1'
$env:BAR_MODEL_PREVIEW_ENABLED='1'
$env:WRITING_PREVIEW_ENABLED='1'
npm run build
npm run start -- --hostname 127.0.0.1 --port 3180 --keepAliveTimeout 120000
```

In a second shell set `$env:PW_PORT='3180'` and run the Playwright command. The repository config reuses the prepared server. These QA flags are local process variables only; production gate tests start separate servers without the escape flag, then with the explicit production override.

Live production HTTP GET to `https://mindmosaic-exam-engine.vercel.app/dev/bar-model`: **404**, pilot fixture ID absent. This observation concerns the currently deployed revision; local production tests concern this PR's implementation.

## Preview instructions

From the existing worktree:

```powershell
npm run dev -- --port 3180
```

Open `http://localhost:3180/dev/bar-model`, choose a year, submit answers, reveal explanations, finish and review. The developer gallery is opt-in below the session.

For local production-build QA, set `BAR_MODEL_PREVIEW_ENABLED=1` before `npm run start`. A Vercel Preview deployment also requires this variable in the Preview environment. Do not set it for production; `VERCEL_ENV=production` refuses the route even when the flag is set. No remote environment settings were changed.

## Remaining requirements

- Independent human blind review, reconciliation of findings and explicit human sign-off.
- A real `approvedBy` record and governed publication checks before publication. None is fabricated here.
- Restore local Docker/Supabase and local-only authenticated E2E configuration, then obtain complete green required checks/CI before any merge.
- Resolve the remaining full-suite unit timeouts/cleanup failures and guest sign-in/signup failures, then run the complete guest suite (including its 193 unrun cases). No complete green CI result is claimed.

Design contract: checked against `docs/design.md` v2.2; no unapproved deviations. Shared buttons/input, product colours, spacing and canonical `.mm-root` typography are reused. The Impeccable mechanical detector reported no findings on the changed UI targets.
