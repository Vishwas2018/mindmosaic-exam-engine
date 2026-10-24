# AMC final seven: controlled remediation proposal

**Branch:** `fix/amc-final-seven-remediation`, from `origin/dev` `608e1fe4324408ccb4c78c2673f7a50069e2ad65`.
**Status:** draft proposal. **Nothing in this branch is an owner approval.** No approval has been recorded, and nothing is ingested, staged, published, deployed or merged. The refreshed seven-question pack with blank owner fields is `decision-pack.md`.

## 1. What this branch changes

| Area | Change |
|---|---|
| Two proposed question revisions | `roadmap-amc-y3-014` and `roadmap-amc-y5-028`: stem and explanation only, in the two draft files |
| Their pinned bindings | Two rows in `content/review-sources/amc/y3.json` and `y5.json`, two attested hashes in `amc-content-bindings.ts`, two rows in `revision-loop-amc.csv`. Exactly two lines changed in each |
| `y5-019` presentation defect | An AMC-scoped line-break fix in the multiple-choice renderer (`renderer-utils.ts`, `MultipleChoiceRenderer.tsx`). **The question's content and hash are unchanged** |
| Tests | New unit test, new component tests, new Playwright regression spec, and a labelled "Prompt layout" section with fixtures on the existing `/showcase` QA page |
| Docs | This file and `decision-pack.md` |

**Not touched:** `y3-005`, `y3-016`, `y3-026`, `y5-006`; any of the 53 published questions, manifests, approvals or bank files; the code exclusions for the three held-back questions; CI workflows; marketing routes; timers and time estimates; GitHub settings.

## 2. The two proposed revisions

Each is a **new content revision**. It needs fresh independent review and your decision, and no earlier approval, review or signature is reused. Full old and new text, and all three hashes each, are in `decision-pack.md` sections 3.2 and 3.7.

### `roadmap-amc-y3-014`

| | Text |
|---|---|
| Old | Four boxes have an average of 8 shells each. Three boxes contain 5, 7 and 10 shells. How many shells are in the fourth box? |
| New | Four boxes contain some shells. If all the shells were shared equally among the four boxes, each box would have 8 shells. Three boxes actually contain 5, 7 and 10 shells. How many shells are in the fourth box? |

`contentHash` `2e12b48b…e123` becomes `ec632c61…19cc`. Preserved: ID, multiple choice, 4 marks, medium, 150 s, the five options and key d (10).

### `roadmap-amc-y5-028`

| | Text |
|---|---|
| Old | How many whole-number solutions are there to 3a + 5b = 30 when a and b may be zero? |
| New | Counters are sold in bags of 3 and in bags of 5. Mia buys some bags to get exactly 30 counters. She may buy any number of each size of bag, including none of one size. Bags of the same size are identical, and the order in which she buys the bags does not matter. How many different combinations of bags could she buy? |

`contentHash` `2187d6ac…d5f8` becomes `28a4e4cc…f3ab`. Preserved: ID, number entry, key 3, tolerance 0, 8 marks, challenging, 180 s.

### Independent answer and ambiguity findings

- **A gap I found in the existing check.** The repository's answer verifier and first-party solver are keyed by question ID and never read the prompt, so their "0 mismatches" only shows the keys equal the solver output, not that new wording asks the same question. I therefore added tests that take the numbers stated in the text and enumerate every possibility.
- **`y3-014`:** 4 × 8 = 32, minus 22, gives 10, and only option d satisfies it. The total of 32 is fixed without a defined term. No ambiguity found.
- **`y5-028`:** exhaustive enumeration gives (0, 6), (5, 3), (10, 0), so 3. Each rule in the stem matters: without "including none of one size" the answer would be 1, and without "identical" and "order does not matter" a reader could count arrangements. The explanation accounts for every excluded count of 5-bags (25, 20, 10 and 5 leftover are not multiples of 3).
- **Left open on purpose:** the `y3-014` distractors are unchanged (7 was a "mean of three" slip and is now weaker); the `y5-028` answer is still a guessable small integer; and the `y3-014` skill label "Averages and data summaries" no longer names the idea in the stem. Each is flagged for you rather than silently altered.

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

The fix therefore applies `whitespace-pre-line` only when `examStyle` is `amc_style`, in the multiple-choice prompt only (the only observed case). It changes the rendering of exactly zero currently-served questions. Number-entry prompts have the same gap in principle; there is no AMC example yet, so I left it.

### Regression test

`e2e/amc-multiline-prompt.spec.ts` (Playwright, desktop and mobile) renders the real `y5-019` stem through the real renderer on `/showcase`. For `amc_style` it asserts `white-space: pre-line`, that the four clue lines are separate, and no overflow; for a `naplan_style` control with identical text it asserts the old behaviour is unchanged.

**Negative control:** with the fix disabled the two AMC tests fail (`Expected "pre-line"`, `Received "normal"`) and the control tests still pass; the fix was restored and the file confirmed intact. The existing showcase specs (pinned at 17 cards, plus the axe audit at every viewport) still pass with the new section.

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

Run in this worktree on 2026-10-25. Nothing below was run against production.

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `eslint .` | exit 0 |
| New unit test and extended component tests | 49 of 49 pass |
| Full unit suite (373 files) | **First run: 371 files and 6526 of 6527 tests passed; 2 files failed, both environmental.** `stripe-webhook-route.test.ts` read a gitignored `.env.local` that a fresh worktree lacks (CI supplies those values as environment variables), and one `legacy-import` CLI test hit its 20 s timeout while the machine was loaded. Re-run in isolation with the CI-style variables: **2 files, 35 of 35 pass.** I did not re-run the entire suite a second time |
| `validate:questions` | pass |
| `check:answers -- --include-published` | 0 failures; 1571 warnings, **identical to a pristine `origin/dev` export** |
| `questions:validate-ledger` | pass |
| Answer verifier over all 60 drafts | 0 mismatches (but see section 2: it is keyed by ID) |
| `content:verify-publication` | 53 eligible, 0 problems, nothing pending; zero diff in `published-manifests/` and `publication-approvals/` |
| Production build (`next build --webpack`) | succeeded |
| Browser tests on that production build (24) | **24 of 24 pass**: new AMC spec (4), renderer showcase (6), showcase accessibility (3), NAPLAN full-paper flow and picker (3), catalogue (5), smoke (3) |
| Negative control | AMC spec fails with the fix disabled (`Expected "pre-line"`, `Received "normal"`) |

**Not run here:** `test:rls` and `test:e2e:auth` (they need the local Supabase stack); CI will run them on the pull request.

Confirmed unchanged: the 53 published questions, manifests and approvals, the generated AMC bank, the four untouched candidates (their registry rows and draft text are identical to `origin/dev`), and NAPLAN/ICAS rendering (the control test, the full-paper flow, and the guarantee that the helper returns an empty class for any style other than `amc_style`). Across the two changed drafts, only `prompt` and `explanation` differ.

## 10. Unresolved decisions

1. Your decision on each of the seven, and the `y3-016` label.
2. How `y3-026`'s difficulty flag is resolved.
3. Whether the AMC-scoped renderer fix is accepted, or `y5-019`'s stem is reflowed instead.
4. Whether to treat the 63 collapsed NAPLAN/ICAS prompts as a separate defect.
5. Who is the human reviewer of record for age-fit on the two revisions.
6. Pacing (section 6) and the one-fixed-paper launch description.
7. Authorising the governed code change that lifts the three code exclusions, which this branch does not contain.
8. Launch messaging (section 7).
