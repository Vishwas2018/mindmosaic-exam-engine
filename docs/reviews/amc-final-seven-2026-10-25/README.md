# AMC final seven: controlled remediation proposal

**Branch:** `fix/amc-final-seven-remediation`, from `origin/dev` `608e1fe4324408ccb4c78c2673f7a50069e2ad65`.
**Status:** draft proposal. **Nothing in this branch is an owner approval.** No approval has been recorded, and nothing is ingested, staged, published, deployed or merged. The refreshed seven-question pack with blank owner fields is `decision-pack.md`.

## 1. What this branch changes

| Area | Change |
|---|---|
| Two proposed question revisions | `roadmap-amc-y3-014` and `roadmap-amc-y5-028`: stem and explanation in the two draft files, plus (`y3-014` only) its strand and skill label (the skill is child-visible; the strand is internal), corrected after review (section 2) |
| Their pinned bindings | Two rows in `content/review-sources/amc/y3.json` and `y5.json`, two attested hashes in `amc-content-bindings.ts`, two rows in `revision-loop-amc.csv`. Each is a hash-only change (a review-source row has its source and content hashes replaced; a pin and a CSV row have their hash values replaced). `y3-014`'s hashes were re-derived a second time after its learner-visible label was corrected |
| `y5-019` presentation defect | An AMC-scoped line-break fix in the multiple-choice renderer (`renderer-utils.ts`, `MultipleChoiceRenderer.tsx`) **and, added later, in the post-exam results page** (`src/app/results/page.tsx`, reusing the same helper). **The question's content and hash are unchanged** |
| Tests | New unit test, new component tests (including one that renders the real results page), two Playwright regression specs (exam page and results page), and a labelled "Prompt layout" section on the existing `/showcase` QA page that uses **clearly synthetic demonstration fixtures** (no real or unpublished question text) |
| Docs | This file and `decision-pack.md` |

**Not touched:** `y3-005`, `y3-016`, `y3-026`, `y5-006`; any of the 53 published questions, manifests, approvals or bank files; the code exclusions for the three held-back questions; CI workflows; marketing routes; timers and time estimates; GitHub settings.

## 2. The two proposed revisions

Each is a **new content revision**. It needs fresh independent review and your decision, and no earlier approval, review or signature is reused. Full old and new text, and all three hashes each, are in `decision-pack.md` sections 3.2 and 3.7.

### `roadmap-amc-y3-014`

| | Text |
|---|---|
| Old | Four boxes have an average of 8 shells each. Three boxes contain 5, 7 and 10 shells. How many shells are in the fourth box? |
| New | Four boxes contain some shells. If all the shells were shared equally among the four boxes, each box would have 8 shells. Three boxes actually contain 5, 7 and 10 shells. How many shells are in the fourth box? |

`contentHash` `2e12b48b…e123` becomes `c7aeef96…5b9b`. Preserved: ID, multiple choice, 4 marks, medium, 150 s, tier-2 placement, the five options and key d (10).

**Skill label corrected.** The first version of this branch left the child-visible label as Statistics & Chance, "Averages and data summaries". The exam and results pages show the skill (not the strand) to the student, and the stem no longer asks for an average (the Victorian Curriculum introduces the mean at Level 7). It is now **Patterns & Algebra, "Algebraic thinking and unknown values"**, an existing registered AMC skill already used by the published `y3-008`. The problem uses an equal-share total (4 × 8 = 32), subtracts the known amounts (22) and finds the unknown amount. "Working backwards and inverse operations" was rejected because that skill's published items reverse a chain of operations and this one has no chain. This changed the three hashes: source `ee5695a9…d7c0`, content `c7aeef96…5b9b`, manifest `3e62c179…5442` (full values in `decision-pack.md`). The earlier values `ec632c61…`, `b7d9141a…` and `853f53d3…` are superseded; nothing was ever approved against them.

### `roadmap-amc-y5-028`

| | Text |
|---|---|
| Old | How many whole-number solutions are there to 3a + 5b = 30 when a and b may be zero? |
| New | Counters are sold in bags of 3 and in bags of 5. Mia buys some bags to get exactly 30 counters. She may buy any number of each size of bag, including none of one size. Bags of the same size are identical, and the order in which she buys the bags does not matter. How many different combinations of bags could she buy? |

`contentHash` `2187d6ac…d5f8` becomes `28a4e4cc…f3ab`. Preserved: ID, number entry, key 3, tolerance 0, 8 marks, challenging, 180 s.

### Independent answer and ambiguity findings

- **A gap I found in the existing check.** The repository's answer verifier and first-party solver are keyed by question ID and never read the prompt, so their "0 mismatches" only shows the keys equal the solver output, not that new wording asks the same question. I added tests with a narrower, honestly limited purpose: they enumerate arithmetic that is **hard-coded from the revision brief** (4 × 8 less 5 + 7 + 10; every pair with 3x + 5y = 30) and check that the keyed answer follows from it, and they check by plain string presence that the new prompt and explanation contain the expected phrases and figures. **They do not parse the prose or prove it is unambiguous or that a reader would reach those figures.** That is not comprehensive semantic verification, and none exists here; it rests on human review.
- **`y3-014`:** the hard-coded arithmetic (4 × 8 = 32, less 5 + 7 + 10 = 22) gives 10, and only option d matches it. My own reading of the wording found no ambiguity, but that is an AI reading, not a verified property of the text.
- **`y5-028`:** enumerating the hard-coded equation gives (0, 6), (5, 3), (10, 0), so 3. In my reading each rule in the stem matters: without "none of one size" the answer would be 1, and without "identical" and "order does not matter" a reader could count arrangements. The explanation accounts for every excluded count of 5-bags (25, 20, 10 and 5 leftover are not multiples of 3).
- **Left open on purpose:** the `y3-014` distractors are unchanged (7 was a "mean of three" slip and is now weaker); the `y5-028` answer is still a guessable small integer; (the `y3-014` skill label was an open item here and has since been corrected, see above). The rest are flagged for you rather than silently altered.

## 3. `y5-019`: investigated in a real browser

### Method

I built a throwaway export of baseline `origin/dev` in the scratchpad, extended only its local copy of the AMC bank with previews of the seven so the Year 5 paper became startable, and drove the real flow with Playwright (Chromium): `/exams/amc-y5-upper-primary-full`, start, begin, then through the paper to the question. Desktop 1280 × 800 and mobile 390 × 844.

**Disclosure:** the app correctly withheld the unapproved previews ("Coming soon: not enough reviewed questions"). To render the question I patched the approval filter in `servedBank()` **in the scratch export only**. That patch, the extended bank and the dev servers were never part of this branch, and no approval was created or forged.

### Before and after (measured in the browser)

| | Before | After |
|---|---|---|
| Computed `white-space` on the prompt | `normal` (both viewports) | `pre-line` (both viewports) |
| Lines of rendered text | 1 | 8 |
| Clues | One run-on paragraph with inline `•` | One clue per line, blank line before and after the list |
| Horizontal overflow | none | none (`scrollWidth` equals `clientWidth` at 1280 and 390) |

Before, the text rendered as: "…date and grape. • Asha chooses cherry. • Dev chooses date. • Ben does not choose banana or grape. • Chen does not choose grape. Which fruit does Chen choose?" Screenshots were captured for all four cases (before/after, desktop/mobile) and are held in the session scratchpad rather than committed, as repository policy bars committing screenshots.

Cosmetic, not changed: on mobile a wrapped bullet does not hang-indent under its `•`, because the bullet is a literal character in the text. Also observed: the question header reads "Amc Mathematics".

### Blast radius, and why the fix is AMC-scoped

An app-wide `white-space: pre-line` was **not** an acceptable narrow fix. Scanning every question the app serves:

| Exam style | Questions | Prompts containing a line break |
|---|---|---|
| NAPLAN-style | 675 | 40 |
| ICAS-style | 873 | 23 |
| AMC-style | 53 | **0** |

Those 63 NAPLAN/ICAS prompts span multiple choice (45), dropdown (6), true/false (5), number entry (3), multiple select (2), short answer (1) and fill-blank (1). Some, such as a numbered "How to Plant a Sunflower Seed" list, currently display collapsed. Changing them would alter live NAPLAN/ICAS rendering and needs its own visual review. **That is a separate finding I recommend you consider, and is not decided here.**

The fix therefore applies `whitespace-pre-line` only when `examStyle` is `amc_style`, in the multiple-choice exam renderer only (the only observed case), and later also in the post-exam results-page prompt (see the results-page subsection). It changes the rendering of exactly zero currently-served questions. **The exam's number-entry renderer is not changed:** a multi-line AMC number-entry prompt would still collapse there. There is no such AMC question today, so I left it.

### A leak I introduced, found in review, and fixed

My first version of the regression test used a showcase fixture that **reproduced the complete unpublished `y5-019` question, options and answer key**, and the `/showcase` page is a client page, so that text was compiled into a static JavaScript chunk. Measured on the unfixed commit with a deployment-style build (`SHOWCASE_ENABLED` unset): the `/showcase` **page** returned 404 as designed, but the compiled chunk `/_next/static/chunks/app/showcase/page-….js` returned **HTTP 200** (40,673 bytes) containing the stem and the answer-key literal. The chunk URL is content-hashed and is not linked from the home page, so it was not trivially discoverable, but nothing protected it. (My first attempt at this measurement was misleading, because I reused a build made with the flag set; I redid it from a flag-unset build.) The fixtures are now **clearly synthetic demonstration content**, see below.

### Regression test (now on synthetic text)

`e2e/amc-multiline-prompt.spec.ts` (Playwright, desktop and mobile) renders a **synthetic demonstration prompt** through the real multiple-choice renderer on `/showcase`, under `amc_style` and under a `naplan_style` control with identical text. The section is visibly labelled "Demonstration content". For `amc_style` it asserts `white-space: pre-line`, that each list line is separate, and no overflow; for the control it asserts the old behaviour is unchanged; and it asserts the page contains no real question text. The real `y5-019` evidence in this document comes from the earlier scratch-environment run, not from this test.

**Guards against recurrence** (in `amc-final-seven-remediation.test.ts`): no runtime showcase fixture contains the `y5-019` stem, its options, or any of the 60 AMC draft prompts; fixture IDs are `showcase-demo-…`, tagged `demonstration` and absent from every real bank; and only `src/app/showcase/page.tsx` imports the fixture module. With the real stem put back, three of these tests fail.

**Negative control:** with the renderer fix disabled the two AMC browser tests fail (`Expected "pre-line"`, `Received "normal"`) and the control tests still pass. The existing showcase specs (pinned at 17 cards, plus the axe audit at every viewport) still pass with the new section.

### Results page (added after review)

The review found that the post-exam results page rendered `question.prompt` in a plain paragraph, so a multi-line AMC prompt would still collapse there even though the exam page kept the breaks. `src/app/results/page.tsx` now applies the same `promptLayoutClass(question.examStyle)` helper and a `data-testid` of `review-prompt-<id>` to that paragraph. NAPLAN and ICAS get an empty class, so their markup is byte-identical to before. No question data, scoring or answer key is touched. This paragraph is shared by every question type, so on the **results page** a multi-line AMC prompt of any type keeps its breaks, whereas in the **exam** only the multiple-choice renderer does (the number-entry renderer is unchanged).

## 4. The remaining four, and recorded positions

Unchanged. Positions for your review, none of them approvals: `y3-005` approve the current wording; `y3-016` easy, 4 marks, fresh owner approval rather than reinstating the archived signature; `y3-026` approve only once the difficulty flag is explicitly resolved; `y5-006` first approval of the current question, with the old encoding allegation identified as stale (the file holds a valid `×` and no U+FFFD, and the exclusion-time hash equals today's).

## 5. Full-paper readiness, previews only

Using the repository's own readiness, selection and scoring code on the 53 published questions plus in-memory previews of the seven:

| | Year 3 | Year 5 |
|---|---|---|
| Today (published only) | short, 26 of 30 | short, 27 of 30 |
| With the seven (previews) | ready | ready |
| Tiers (10 / 10 / 5 / 5) | exact | exact |
| 30 unique questions | yes | yes |
| Scoring: all correct / all wrong / blank | 135 / 0 / 0 | 135 / 0 / 0 |
| **Distinct papers** | **1** | **1** |

`src/tests/unit/amc-final-seven-remediation.test.ts` now asserts the tier shape and that dropping any one of the seven leaves its paper short. These are previews, so they prove the shape, selection and scoring, **not** that governed assembly will succeed.

**One fixed paper per year.** 25 different seeds produced exactly one question set per year, because 30 questions fill a 30-question paper. Any initial full-paper release must be described honestly as **one fixed practice paper per year**, not a rotating bank.

## 6. Pacing (not changed)

| | Paper timer | Summed per-question estimates | Over by |
|---|---|---|---|
| Year 3 | 60 min | 66.0 min (3960 s) | 6.0 min |
| Year 5 | 60 min | 62.5 min (3750 s) | 2.5 min |

I did not change either timer or any estimate. The timer matches the official 30-question, 60-minute AMC length, and the overrun was already present across the 30-question sets before these seven. **Your options:** keep 60 minutes and treat the estimates as per-question guidance, not a budget; or re-estimate individual items (each re-estimate is a content-hash change needing a fresh approval); or change the paper length (a product decision that moves away from the official format). Whichever you choose, the learner-facing description should not imply the estimates sum to the paper time.

## 7. AMC messaging: inventory and proposed copy (no routes changed)

| Where | Today | Problem |
|---|---|---|
| Landing programme data (`content.ts`) | status `in_development`; "Planned scope: no year level is live yet"; Years 3 to 12 | Contradicts the practice page |
| `/practice/australian-maths-competition` | Banner: papers "are now open as shorter practice modules" above a coming-soon component | Contradicts itself and the landing page; "shorter" becomes wrong once a full paper exists |
| Coming-soon catalogue entry | "Years 3–6"; "Untimed investigation… not exam-speed pressure" | Only Years 3 and 5 exist; the real paper is timed |
| Question header | "Amc Mathematics" | Casing |

**Proposed copy, for when both full papers are live:**
- Landing and catalogue status: "AMC-style practice for Year 3 and Year 5: one full-length paper per year, 30 questions in 60 minutes. Original practice, not official AMC questions."
- Practice page banner: "The Year 3 and Year 5 AMC-style practice papers are open. Each year has one fixed 30-question paper, so you will see the same questions each time while we add more."
- Catalogue scope label: "Years 3 and 5". Replace the "Untimed investigation" focus area with "Timed problem solving: 30 questions in 60 minutes".
- Interim wording, only if you launch before both papers are approved: "AMC-style practice is being prepared for Year 3 and Year 5." I have **not** verified in a browser whether the reduced practice module is startable today, so confirm that before choosing between the interim wording and the current banner.

## 8. What needs fresh human approval

| Question | Why |
|---|---|
| `y3-014` | New revision (new stem, explanation, hashes) |
| `y5-028` | New revision (new stem, explanation, hashes) |
| `y3-005`, `y3-016`, `y3-026`, `y5-006`, `y5-019` | Not yet approved. `y5-019` is unchanged in content, so its decision does not depend on this branch's code change |

Independent review of the two revised texts is also outstanding. I wrote none and cite none: my own review in this proposal is an AI review, not a qualified human approval.

## 9. Verification

Run in this worktree on 2026-10-25. Nothing below was run against production. The table covers the corrected branch (after the showcase-fixture fix); the earlier full-suite run was on the first version.

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `eslint .` | exit 0 |
| Unit and component tests touching showcase fixtures, AMC, exam patterns and answer-position bias (20 files) | **521 of 521 pass** |
| Full unit suite, final P2 correction (dummy CI-style Stripe variables set) | **374 of 374 files and 6,543 of 6,543 tests pass**, in one run (637 s). The earlier two failures (`stripe-webhook-route.test.ts` reading a gitignored `.env.local`, and a `legacy-import` CLI timeout under load) did not recur in this run; that does not show their cause was fixed in the repo, only that they were environmental in this worktree |
| New results-page component test (renders the real `ResultsPage` from a submitted store, synthetic fixtures only) | 3 of 3 pass (part of the suite above) |
| Results-page browser regression (`e2e/results-amc-multiline-prompt.spec.ts`: desktop 1280 and mobile 390; line breaks, NAPLAN control, axe, overflow) | 6 of 6 pass on the final build. **Negative control:** with the results-page class removed (a throwaway build, restored byte-for-byte afterwards) exactly the two "keeps each authored line" tests failed with `Expected "pre-line"`, `Received "normal"`; the NAPLAN control and axe tests passed. The first negative-control run also hit cold-server navigation timeouts, so the clean result is from a second run on a warm server |
| `validate:questions`, `check:answers -- --include-published`, `questions:validate-ledger` | pass (0 correctness failures; 1571 warnings, identical to pristine `origin/dev`). `check:answers` and the ledger check were run on the first version, since the fixture fix touches none of the data they read; `validate:questions` was re-run on the corrected branch and passes |
| `content:verify-publication` and answer verifier (re-run on the corrected branch) | 53 eligible, 0 problems, nothing pending; answer verifier 0 mismatches over 60 drafts; zero diff in `published-manifests/`, `publication-approvals/` and the generated AMC bank |
| Production build and browser tests on it (desktop and mobile) | **38 of 38 pass in the final combined run**: results-page spec (6), exam-page AMC spec (6), results review accessibility (4), renderer showcase (6), showcase accessibility (3), NAPLAN full-paper flow and picker (3), scholarship simulation (2), catalogue (5), smoke (3) |
| **Earlier failure, disclosed** | In an earlier combined run, `a11y-results-review` "flagged-only question review" failed once with a 30 s timeout waiting for `begin-exam` during exam start, before the results page was reached. It passed 4 of 4 when run on its own, and the later combined run passed 38 of 38. **Those later passes do not show the earlier combined run passed**; they show the failure did not repeat. Cause not established (cold or loaded host is the likely but unproven explanation). The production build also exceeded Playwright's 300 s web-server window once on this host, after which I built separately and served that build |
| Validators actually run after the final change | `tsc --noEmit` exit 0; `eslint .` exit 0; `validate:questions`; `check:answers -- --include-published` (0 failures, 1,571 warnings); `questions:validate-ledger`; `content:verify-publication` (summary in the integrity section); `verify-roadmap-amc-answers` (60 items, 0 mismatches) |
| **Not executed** | `test:rls`, `test:e2e:auth` (need the local Supabase stack; CI runs them); a deployment-style build with the showcase flag unset was not repeated for the P2 change (the P1 measurement on `e35e3817` stands; the new tests add only synthetic text, and the final build was made with the QA flags set as the Playwright config does) |
| Negative control (fix disabled) | exactly the two AMC "keeps each line" tests fail (`Expected "pre-line"`, `Received "normal"`); the control and labelling tests pass; with the fix restored, 6 of 6 pass |
| Guard negative control (real `y5-019` stem put back into the fixture) | 3 unit tests fail; fixture restored byte-for-byte |
| Deployment-style build (flags unset), served with the showcase gate off | `/showcase` page 404; the showcase chunk is a static file but now contains only the demonstration text. Zero hits for any unpublished question text in `.next/static` and `public/` |

**Not run here:** `test:rls` and `test:e2e:auth` (they need the local Supabase stack); CI runs them.

### CI record for the previous head `c9ecdb8c`, kept separate

| Run | Event | Result |
|---|---|---|
| [40135923954](https://github.com/Vishwas2018/mindmosaic-exam-engine/actions/runs/40135923954) | **push** | **Failed**: `e2e-auth` only. The `next/font` Google loader threw `TypeError: Cannot read properties of null (reading '1')` while compiling `src/app/layout.tsx`, the build failed and the web server never started, so no authenticated test ran. `core`, `e2e`, `rls` and `scholarship-drafts` passed |
| [40135927715](https://github.com/Vishwas2018/mindmosaic-exam-engine/actions/runs/40135927715) | **pull_request** | **Passed**: all five jobs |

So the same commit passed and failed depending on the run, which points to an intermittent font-fetch problem rather than the content of this change. Root cause is not established. It is tracked separately as issue #77, which also records the earlier 24 October failure on `dev`. **No font or global build configuration is changed in this PR.**

Confirmed unchanged: the 53 published questions, manifests and approvals, the generated AMC bank, the four untouched candidates (registry rows and draft text identical to `origin/dev`), and NAPLAN/ICAS rendering (the control test, the full-paper flow, and the helper returning an empty class for any style other than `amc_style`). Across the two changed drafts: for `y5-028` only `prompt` and `explanation` differ from `origin/dev`; for `y3-014` `prompt` and `explanation` differ **and so do its `strand` and `skill`** (the skill is shown to children on the exam and results pages; the strand is not) (Patterns & Algebra, Algebraic thinking and unknown values), as described in section 2.

### Integrity record for the final P2 correction

Checked in this worktree before committing:

| Check | Result |
|---|---|
| `content:verify-publication` (complete summary) | `authored` 1601; `eligible` **53**; `awaitingApproval` 1548; `pendingPublication` empty; `problems` **[]**. Writing prompts: 10 drafts, 0 eligible, 0 problems. Baseline unchanged |
| `y3-014` hashes against the repository's canonical recomputation (`loadAmcReviewTargets`) | Source `ee5695a9…d7c0`, content `c7aeef96…5b9b`, manifest `3e62c179…5442` all equal the recomputed values; the registry row and the attested pin carry the same source and content hashes |
| Superseded hashes `ec632c61…`, `b7d9141a…`, `853f53d3…` | Appear in no file under `content/`, `src/`, `scripts/` or `e2e/`, and no approval file exists for `y3-014` or `y5-028`. They are named only in these review documents |
| `y5-028` | No difference from the previous PR head (`e35e3817`) in the Year 5 draft or the Year 5 review-source file |
| Published manifests, approval records, generated question banks | No diff against `origin/dev` |
| Code exclusions (`AMC_EXCLUDED_FROM_REVIEW`, `pending-amc-approvals.ts`) | Files unchanged; all three exclusions still active |
| Owner decision fields | Seven present, all blank; no ticked box |
| Scholarship, NAPLAN, ICAS questions | Not in the diff (8 modified files and 2 new test files, listed in the commit) |
| Public assets | A scan of `.next/static` and `public/` on the final build found zero occurrences of the `y5-019` stem, the revised `y3-014` stem or the revised `y5-028` stem. The new tests use only the synthetic demonstration fixtures, and the results-page spec imports them in the Playwright (Node) process, not into the app bundle |

### Outstanding advisory decisions (not resolved by this change)

- `y5-028`: the child-visible skill label "Enumerate whole-number solutions" reads slightly algebraic, and the stem is the longest in Year 5 (64 words). Neither was changed under this authorisation.
- `y3-014`: whether a conditional "if … would" stem suits Year 3, and the weak distractors 7 and 13.
- `y3-016` easy versus medium, `y3-026` medium versus challenging, `y5-028` challenging versus medium (owner difficulty decisions).
- A qualified human age-fit reviewer is still needed for `y3-014` and `y5-028`; the AI reviews, including mine, are author-involved or not independent.
- The exam keeps AMC line breaks in the multiple-choice renderer only; the exam's number-entry renderer is unchanged, so a future multi-line AMC number-entry prompt would still collapse during the exam. The results page already preserves breaks for any AMC question type.

## 10. Unresolved decisions

1. Your decision on each of the seven, and the `y3-016` label.
2. How `y3-026`'s difficulty flag is resolved.
3. Whether the AMC-scoped renderer fix is accepted, or `y5-019`'s stem is reflowed instead.
4. Whether to treat the 63 collapsed NAPLAN/ICAS prompts as a separate defect.
5. Who is the human reviewer of record for age-fit on the two revisions.
6. Pacing (section 6) and the one-fixed-paper launch description.
7. Authorising the governed code change that lifts the three code exclusions, which this branch does not contain.
8. Launch messaging (section 7).
